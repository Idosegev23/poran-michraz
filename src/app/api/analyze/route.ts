import { NextRequest } from 'next/server';
import { parseDocument } from '@/lib/parseDocument';
import { analyzeTender } from '@/lib/claudeAnalyzer';
import { put, del } from '@vercel/blob';
import { sendErrorAlert } from '@/lib/alertEmail';

export const maxDuration = 600;

interface BlobUploadInput {
  uploads: { url: string; name: string; size?: number }[];
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`[API:${requestId}] === New analysis request ===`);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE events
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          send('heartbeat', { time: Date.now() });
        } catch {
          // stream already closed
        }
      }, 10000); // every 10 seconds

      // Track Blob URLs we should clean up after processing
      const blobUrlsToCleanup: string[] = [];

      try {
        const contentType = request.headers.get('content-type') || '';
        const fileNames: string[] = [];
        const sources: { name: string; getBuffer: () => Promise<Buffer> }[] = [];

        if (contentType.includes('application/json')) {
          // New flow: client uploaded files directly to Blob, sent us URLs
          const body = (await request.json()) as BlobUploadInput;
          const uploads = Array.isArray(body.uploads) ? body.uploads : [];

          if (uploads.length === 0) {
            console.warn(`[API:${requestId}] No uploads in JSON body`);
            send('error', { error: 'לא נבחרו קבצים' });
            clearInterval(heartbeat);
            controller.close();
            return;
          }

          console.log(`[API:${requestId}] Blob uploads received: ${uploads.length} — ${uploads.map(u => `${u.name}${u.size ? ` (${(u.size / 1024).toFixed(0)}KB)` : ''}`).join(', ')}`);

          for (const u of uploads) {
            const ext = u.name.toLowerCase().split('.').pop();
            if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
              console.warn(`[API:${requestId}] Unsupported file type: ${u.name}`);
              send('error', { error: `סוג קובץ לא נתמך: ${u.name}` });
              clearInterval(heartbeat);
              controller.close();
              return;
            }
            fileNames.push(u.name);
            blobUrlsToCleanup.push(u.url);
            sources.push({
              name: u.name,
              getBuffer: async () => {
                const res = await fetch(u.url);
                if (!res.ok) throw new Error(`Failed to fetch blob ${u.name}: HTTP ${res.status}`);
                const ab = await res.arrayBuffer();
                return Buffer.from(ab);
              },
            });
          }
        } else {
          // Legacy flow: multipart/form-data direct upload (still subject to 4.5MB Vercel limit)
          const formData = await request.formData();
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

          console.log(`[API:${requestId}] Files received (form-data): ${files.length} — ${files.map(f => `${f.name} (${(f.size / 1024).toFixed(0)}KB)`).join(', ')}`);

          if (files.length === 0) {
            console.warn(`[API:${requestId}] No files in request`);
            send('error', { error: 'לא נבחרו קבצים' });
            clearInterval(heartbeat);
            controller.close();
            return;
          }

          for (const file of files) {
            const ext = file.name.toLowerCase().split('.').pop();
            if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
              console.warn(`[API:${requestId}] Unsupported file type: ${file.name}`);
              send('error', { error: `סוג קובץ לא נתמך: ${file.name}` });
              clearInterval(heartbeat);
              controller.close();
              return;
            }
            fileNames.push(file.name);
            sources.push({
              name: file.name,
              getBuffer: async () => Buffer.from(await file.arrayBuffer()),
            });
          }
        }

        send('progress', { step: 'parsing', message: 'מעבד מסמכים...' });

        // Parse all documents and concatenate text
        const textParts: string[] = [];
        for (const src of sources) {
          console.log(`[API:${requestId}] Parsing: ${src.name}...`);
          const parseStart = Date.now();
          try {
            const buffer = await src.getBuffer();
            const text = await parseDocument(buffer, src.name);
            const parseTime = Date.now() - parseStart;

            if (text && text.trim().length > 10) {
              console.log(`[API:${requestId}] Parsed ${src.name}: ${text.length} chars in ${parseTime}ms`);
              textParts.push(`\n\n===== מסמך: ${src.name} =====\n\n${text}`);
            } else {
              console.warn(`[API:${requestId}] Parsed ${src.name}: TOO SHORT or empty (${text?.length ?? 0} chars) in ${parseTime}ms`);
            }
          } catch (parseErr) {
            console.error(`[API:${requestId}] FAILED to parse ${src.name}:`, parseErr);
          }
        }

        const documentText = textParts.join('\n');
        console.log(`[API:${requestId}] Total document text: ${documentText.length} chars from ${textParts.length}/${sources.length} files`);

        if (!documentText || documentText.trim().length < 50) {
          console.error(`[API:${requestId}] Document text too short (${documentText.length} chars). Cannot analyze.`);
          send('error', { error: 'לא ניתן היה לחלץ טקסט מהמסמכים. ודא שהקבצים תקינים ומכילים טקסט.' });
          clearInterval(heartbeat);
          controller.close();
          return;
        }

        // Analyze with Claude
        send('progress', { step: 'analyzing', message: 'מנתח עם AI...' });
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
        send('result', { success: true, data: analysis });
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

        send('error', { error: message });
      } finally {
        clearInterval(heartbeat);
        // Clean up uploaded source blobs (we don't need them after analysis)
        if (blobUrlsToCleanup.length > 0) {
          del(blobUrlsToCleanup).then(() => {
            console.log(`[API:${requestId}] Cleaned up ${blobUrlsToCleanup.length} source blob(s)`);
          }).catch((err) => {
            console.warn(`[API:${requestId}] Blob cleanup failed:`, err);
          });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
