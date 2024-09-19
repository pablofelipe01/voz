import { NextResponse } from 'next/server';
import { DropboxAuth } from 'dropbox';
import fetch from 'node-fetch';

export const runtime = 'nodejs';

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production';
  const redirectUri = isProduction
    ? 'https://voice-photo.vercel.app/api/dropbox/callback'
    : 'http://localhost:3000/api/dropbox/callback';

  const dbxAuth = new DropboxAuth({
    clientId: process.env.DROPBOX_APP_KEY!,
    fetch,
  });

  const authUrl = await dbxAuth.getAuthenticationUrl(
    redirectUri,
    undefined,
    'code',
    'offline',
    undefined,
    undefined,
    true // usePKCE = true
  );

  const codeVerifier = dbxAuth.codeVerifier;

  console.log('Generated code verifier:', codeVerifier);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('dropboxCodeVerifier', codeVerifier, {
    httpOnly: true,
    secure: isProduction,
    path: '/',
  });

  return response;
}