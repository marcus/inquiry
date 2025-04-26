import { GOOGLE_CLIENT_ID } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export async function GET() {
  const redirectUri = 'http://localhost:5173/api/auth/google'; // must match Google Console entry
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  throw redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
} 