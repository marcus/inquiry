import { redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_ID, getBaseUrl } from '$lib/server/env';

// Create a Google OAuth redirect URL
export function GET() {
  // Get the client ID from our utility
  const clientId = GOOGLE_CLIENT_ID;
  
  // Redirect to Google's OAuth flow
  const redirectUri = `${getBaseUrl()}/api/auth/google`;
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.append('client_id', clientId);
  googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'email profile');
  googleAuthUrl.searchParams.append('prompt', 'select_account');
  
  return redirect(302, googleAuthUrl.toString());
}
