import { NextRequest, NextResponse } from 'next/server';
import { Dropbox, DropboxAuth } from 'dropbox';
import fetch from 'node-fetch';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
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
    const file = formData.get('file') as Blob;

    if (!email || !file) {
      return NextResponse.json(
        { error: 'Please provide an email and a file' },
        { status: 400 }
      );
    }

    const dbxAuth = new DropboxAuth({ accessToken, fetch });
    const dbx = new Dropbox({ auth: dbxAuth, fetch });

    const contents = Buffer.from(await file.arrayBuffer());

    let uploadResponse;
    try {
      uploadResponse = await dbx.filesUpload({
        path: `/${file.name}`,
        contents: contents,
        mode: { '.tag': 'overwrite' },
      });
    } catch (error) {
      console.error('Dropbox Upload Error:', error);
      return NextResponse.json({ error: 'Failed to upload file to Dropbox' }, { status: 500 });
    }

    let sharedLinkResponse;
    try {
      sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: uploadResponse.result.path_lower!,
      });
    } catch (error) {
      console.error('Dropbox Sharing Error:', error);
      return NextResponse.json({ error: 'Failed to create shared link' }, { status: 500 });
    }

    const fileUrl = sharedLinkResponse.result.url.replace('?dl=0', '?raw=1');

    if (!process.env.MAKE_WEBHOOK_URL_INM) {
      console.error('MAKE_WEBHOOK_URL_INM is not defined');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch(process.env.MAKE_WEBHOOK_URL_INM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        fileUrl
      }),
    });

    if (!response.ok) {
      console.error(`Make.com webhook responded with status ${response.status}`);
      return NextResponse.json({ error: 'Failed to send data to Make.com' }, { status: 500 });
    }

    return NextResponse.json({ success: true, fileUrl });
  } catch (error) {
    console.error('Unhandled Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}