import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: { body: content },
        pinataMetadata: { name: 'ritual-anvil-skill' },
      }),
    });

    if (!pinataResponse.ok) {
      const errText = await pinataResponse.text();
      console.error('Pinata error:', errText);
      return NextResponse.json({ error: 'Failed to upload to IPFS' }, { status: 500 });
    }

    const data = await pinataResponse.json();
    return NextResponse.json({ cid: data.IpfsHash });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
