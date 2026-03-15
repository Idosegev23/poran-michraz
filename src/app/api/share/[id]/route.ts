import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { blobs } = await list({ prefix: `shares/${id}.json` });

    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const response = await fetch(blobs[0].url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[share/id] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
