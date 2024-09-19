import { NextRequest, NextResponse } from 'next/server';
import { DropboxAuth } from 'dropbox';
import fetch from 'node-fetch';

export const runtime = 'nodejs';

// Define a custom error type for Dropbox errors
interface DropboxError extends Error {
  status?: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const isProduction = process.env.NODE_ENV === 'production';

  if (!code) {
    return NextResponse.redirect(new URL('/', request.nextUrl.origin));
  }

  const codeVerifier = request.cookies.get('dropboxCodeVerifier')?.value;

  console.log('Retrieved code verifier from cookie:', codeVerifier);

  if (!codeVerifier) {
    console.error('Code verifier is missing');
    return NextResponse.redirect(
      new URL('/?error=code_verifier_missing', request.nextUrl.origin)
    );
  }

  const redirectUri = isProduction
    ? 'https://voice-photo.vercel.app/api/dropbox/callback'
    : 'http://localhost:3000/api/dropbox/callback';

  const dbxAuth = new DropboxAuth({
    clientId: process.env.DROPBOX_APP_KEY!,
    fetch,
  });

  dbxAuth.setCodeVerifier(codeVerifier);

  try {
    const tokenResponse = await dbxAuth.getAccessTokenFromCode(
      redirectUri,
      code
    );
    const accessToken = tokenResponse.result.access_token;

    const response = NextResponse.redirect(
      new URL('/', request.nextUrl.origin)
    );
    response.cookies.set('dropboxAccessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      path: '/',
    });
    response.cookies.delete('dropboxCodeVerifier');

    return response;
  } catch (error) {
    console.error('Error getting access token:', error);
    
    if (error instanceof Error) {
      const dropboxError = error as DropboxError;
      console.error('Error message:', dropboxError.message);
      console.error('Error stack:', dropboxError.stack);
      
      if (typeof dropboxError.status !== 'undefined') {
        console.error('Error status:', dropboxError.status);
      }
      if (dropboxError.error) {
        console.error('Error details:', dropboxError.error);
      }
    } else {
      console.error('Unknown error:', error);
    }
  
    return NextResponse.redirect(
      new URL('/?error=access_token', request.nextUrl.origin)
    );
  }
}