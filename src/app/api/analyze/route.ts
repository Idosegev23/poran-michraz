import { NextRequest, NextResponse } from 'next/server';
import { parseDocument } from '@/lib/parseDocument';
import { analyzeTender } from '@/lib/claudeAnalyzer';
import { put } from '@vercel/blob';
import { sendErrorAlert } from '@/lib/alertEmail';

export const maxDuration = 600;

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`[API:${requestId}] === New analysis request ===`);

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

    console.log(`[API:${requestId}] Files received: ${files.length} — ${files.map(f => `${f.name} (${(f.size / 1024).toFixed(0)}KB)`).join(', ')}`);

    if (files.length === 0) {
      console.warn(`[API:${requestId}] No files in request`);
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
        console.warn(`[API:${requestId}] Unsupported file type: ${file.name} (ext: ${ext})`);
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
      console.log(`[API:${requestId}] Parsing: ${file.name}...`);
      const parseStart = Date.now();
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const text = await parseDocument(buffer, file.name);
        const parseTime = Date.now() - parseStart;

        if (text && text.trim().length > 10) {
          console.log(`[API:${requestId}] Parsed ${file.name}: ${text.length} chars in ${parseTime}ms`);
          textParts.push(`\n\n===== מסמך: ${file.name} =====\n\n${text}`);
        } else {
          console.warn(`[API:${requestId}] Parsed ${file.name}: TOO SHORT or empty (${text?.length ?? 0} chars) in ${parseTime}ms`);
        }
      } catch (parseErr) {
        console.error(`[API:${requestId}] FAILED to parse ${file.name}:`, parseErr);
      }
    }

    const documentText = textParts.join('\n');
    console.log(`[API:${requestId}] Total document text: ${documentText.length} chars from ${textParts.length}/${files.length} files`);

    if (!documentText || documentText.trim().length < 50) {
      console.error(`[API:${requestId}] Document text too short (${documentText.length} chars). Cannot analyze.`);
      return NextResponse.json(
        { success: false, error: 'לא ניתן היה לחלץ טקסט מהמסמכים. ודא שהקבצים תקינים ומכילים טקסט.' },
        { status: 400 }
      );
    }

    // Analyze with Claude
    console.log(`[API:${requestId}] Sending to Claude for analysis...`);
    const analyzeStart = Date.now();
    const analysis = await analyzeTender(documentText);
    const analyzeTime = ((Date.now() - analyzeStart) / 1000).toFixed(1);
    console.log(`[API:${requestId}] Analysis complete in ${analyzeTime}s. Fields: ${Object.keys(analysis).length}`);

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
    console.log(`[API:${requestId}] Saving to history: ${id}`);
    put(`history/${id}.json`, JSON.stringify(record), {
      access: 'public',
      contentType: 'application/json',
    }).then(() => {
      console.log(`[API:${requestId}] History saved: ${id}`);
    }).catch((err) => {
      console.warn(`[API:${requestId}] History save failed:`, err);
    });

    console.log(`[API:${requestId}] === Request complete (success) ===`);
    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error(`[API:${requestId}] === Request FAILED ===`);
    console.error(`[API:${requestId}] Error:`, error);
    if (error instanceof Error) {
      console.error(`[API:${requestId}] Name: ${error.name}, Message: ${error.message}`);
      console.error(`[API:${requestId}] Stack: ${error.stack}`);
    }
    const message = error instanceof Error ? error.message : 'שגיאה לא צפויה בעיבוד המסמך';

    // Send alert email (non-blocking)
    sendErrorAlert({
      route: 'POST /api/analyze',
      errorMessage: message,
      errorStack: error instanceof Error ? error.stack : undefined,
      details: { requestId },
    }).catch(() => {});

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
