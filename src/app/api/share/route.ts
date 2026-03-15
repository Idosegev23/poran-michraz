import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data) {
      return NextResponse.json({ error: 'No data' }, { status: 400 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const blob = await put(`shares/${id}.json`, JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
    });

    return NextResponse.json({ id, url: blob.url });
  } catch (error) {
    console.error('[share] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
