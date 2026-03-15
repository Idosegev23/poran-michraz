import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { blobs } = await list({ prefix: `history/${id}.json` });

    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const res = await fetch(blobs[0].url);
    const record = await res.json();
    return NextResponse.json(record.data);
  } catch (error) {
    console.error('[history/id] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { blobs } = await list({ prefix: `history/${id}.json` });

    if (blobs.length > 0) {
      await del(blobs[0].url);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[history/id] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
