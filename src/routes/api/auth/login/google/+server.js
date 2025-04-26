import { redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_ID, getBaseUrl } from '$lib/server/env';

export async function GET() {
  // Get client ID from our utility
  const clientId = GOOGLE_CLIENT_ID;
  
  const redirectUri = `${getBaseUrl()}/api/auth/google`; // must match Google Console entry
  
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