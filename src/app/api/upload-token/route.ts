import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const ext = pathname.toLowerCase().split('.').pop() || '';
        if (!['pdf', 'doc', 'docx'].includes(ext)) {
          throw new Error(`סוג קובץ לא נתמך: ${ext}`);
        }
        return {
          allowedContentTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/octet-stream',
          ],
          addRandomSuffix: true,
          maxFileSizeBytes: 50 * 1024 * 1024, // 50MB per file
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log(`[UPLOAD] Blob ready: ${blob.pathname} (${blob.url})`);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
