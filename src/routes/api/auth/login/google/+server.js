import { redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_ID } from '$env/static/private';

export async function GET() {
  // Get client ID from environment variable - use the imported value
  const clientId = GOOGLE_CLIENT_ID || '';
  const redirectUri = `${process.env.NODE_ENV === 'production' 
    ? 'https://haplab.com' 
    : 'http://localhost:5173'}/api/auth/google`; // must match Google Console entry
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });
  

  throw redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}