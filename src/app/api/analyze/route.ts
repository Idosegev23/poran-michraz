import { NextRequest, NextResponse } from 'next/server';
import { parseDocument } from '@/lib/parseDocument';
import { analyzeTender } from '@/lib/claudeAnalyzer';
import { put } from '@vercel/blob';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Support both single file (legacy "file") and multiple files ("files")
    const files: File[] = [];
    const multiFiles = formData.getAll('files');
    const singleFile = formData.get('file');

    if (multiFiles.length > 0) {
      for (const f of multiFiles) {
        if (f instanceof File) files.push(f);
      }
    } else if (singleFile instanceof File) {
      files.push(singleFile);
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'לא נבחרו קבצים' },
        { status: 400 }
      );
    }

    // Validate all files
    const fileNames: string[] = [];
    for (const file of files) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
        return NextResponse.json(
          { success: false, error: `סוג קובץ לא נתמך: ${file.name}` },
          { status: 400 }
        );
      }
      fileNames.push(file.name);
    }

    // Parse all documents and concatenate text
    const textParts: string[] = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const text = await parseDocument(buffer, file.name);
      if (text && text.trim().length > 10) {
        textParts.push(`\n\n===== מסמך: ${file.name} =====\n\n${text}`);
      }
    }

    const documentText = textParts.join('\n');

    if (!documentText || documentText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: 'לא ניתן היה לחלץ טקסט מהמסמכים. ודא שהקבצים תקינים ומכילים טקסט.' },
        { status: 400 }
      );
    }

    // Analyze with Claude
    const analysis = await analyzeTender(documentText);

    // Save to history (non-blocking)
    const id = crypto.randomUUID().slice(0, 8);
    const tenderName = typeof analysis.tenderName === 'string'
      ? analysis.tenderName.substring(0, 100)
      : 'מכרז ללא שם';
    const record = {
      id,
      fileName: fileNames.join(', '),
      tenderName,
      createdAt: new Date().toISOString(),
      data: analysis,
    };
    put(`history/${id}.json`, JSON.stringify(record), {
      access: 'public',
      contentType: 'application/json',
    }).catch(() => { /* history save is best-effort */ });

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'שגיאה לא צפויה בעיבוד המסמך';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
