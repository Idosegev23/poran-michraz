import { NextRequest, NextResponse } from 'next/server';
import { parseDocument } from '@/lib/parseDocument';
import { analyzeTender } from '@/lib/claudeAnalyzer';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'לא נבחר קובץ' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const extension = fileName.toLowerCase().split('.').pop();

    if (!['pdf', 'doc', 'docx'].includes(extension || '')) {
      return NextResponse.json(
        { success: false, error: 'סוג קובץ לא נתמך. אנא העלה PDF או Word (.docx)' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse document
    const documentText = await parseDocument(buffer, fileName);

    if (!documentText || documentText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: 'לא ניתן היה לחלץ טקסט מהמסמך. ודא שהקובץ תקין ומכיל טקסט.' },
        { status: 400 }
      );
    }

    // Analyze with Claude
    const analysis = await analyzeTender(documentText);

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
