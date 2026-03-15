import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    const { blobs } = await list({ prefix: 'history/' });

    // Fetch metadata from each blob (just the summary, not full data)
    const items = await Promise.all(
      blobs
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 50)
        .map(async (blob) => {
          try {
            const res = await fetch(blob.url);
            const record = await res.json();
            return {
              id: record.id,
              fileName: record.fileName,
              tenderName: record.tenderName,
              createdAt: record.createdAt,
            };
          } catch {
            return null;
          }
        })
    );

    return NextResponse.json(items.filter(Boolean));
  } catch (error) {
    console.error('[history] Error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
