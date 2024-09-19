import { NextResponse } from 'next/server';
import { Dropbox, DropboxAuth } from 'dropbox';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  const cookieStore = request.cookies;
  const accessToken = cookieStore.get('dropboxAccessToken')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated with Dropbox' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const email = formData.get('email');
    const imageName = formData.get('imageName');
    const file = formData.get('file');

    if (!email || !imageName || !file) {
      return NextResponse.json(
        { error: 'Please provide an email, image name, and a file' },
        { status: 400 }
      );
    }

    const dbxAuth = new DropboxAuth({ accessToken, fetch });
    const dbx = new Dropbox({ auth: dbxAuth, fetch });

    const contents = await file.arrayBuffer();

    try {
      const uploadResponse = await dbx.filesUpload({
        path: `/${imageName}`,
        contents: Buffer.from(contents),
        mode: { '.tag': 'add' },
        autorename: true,
      });

      const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: uploadResponse.result.path_lower,
      });

      const fileUrl = sharedLinkResponse.result.url.replace('?dl=0', '?raw=1');

      // Send data to Make.com webhook
      const webhookResponse = await fetch(process.env.MAKE_IMAGE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          fileUrl
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Make.com webhook responded with status ${webhookResponse.status}`);
      }

      return NextResponse.json({ success: true, fileUrl });
    } catch (uploadError) {
      console.error('Dropbox upload error:', uploadError);
      return NextResponse.json({ error: 'Error uploading to Dropbox', details: uploadError.message }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}