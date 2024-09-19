import { NextRequest, NextResponse } from 'next/server';
import { Dropbox, DropboxAuth } from 'dropbox';
import fetch from 'node-fetch';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const cookieStore = request.cookies;
  const accessToken = cookieStore.get('dropboxAccessToken')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated with Dropbox' },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const email = formData.get('email') as string;
  const files = formData.getAll('files') as File[];

  if (!email || files.length !== 2) {
    return NextResponse.json(
      { error: 'Please provide an email and exactly 2 files' },
      { status: 400 }
    );
  }

  try {
    const dbxAuth = new DropboxAuth({ accessToken, fetch });
    const dbx = new Dropbox({ auth: dbxAuth, fetch });

    const fileUrls = await Promise.all(
      files.map(async (file) => {
        const contents = Buffer.from(await file.arrayBuffer());

        const uploadResponse = await dbx.filesUpload({
          path: `/${file.name}`,
          contents: contents,
          mode: { '.tag': 'overwrite' },
        });

        const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
          path: uploadResponse.result.path_lower!,
        });

        return sharedLinkResponse.result.url.replace('?dl=0', '?raw=1');
      })
    );

    // Send URLs as separate fields
    const response = await fetch(process.env.MAKE_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        fileUrl1: fileUrls[0],
        fileUrl2: fileUrls[1]
      }),
    });

    if (!response.ok) {
      throw new Error(`Make.com webhook responded with status ${response.status}`);
    }

    return NextResponse.json({ success: true, fileUrls });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}