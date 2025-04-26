import { redirect } from '@sveltejs/kit';

// Create a Google OAuth redirect URL
export function GET() {
  // Get the client ID from environment or use a fallback mechanism
  // This approach is more resilient during build time
  const clientId = process.env.PUBLIC_GOOGLE_CLIENT_ID || '';
  
  // Redirect to Google's OAuth flow
  const redirectUri = `${process.env.NODE_ENV === 'production' 
    ? 'https://haplab.com' 
    : 'http://localhost:5173'}/api/auth/google`;
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.append('client_id', clientId);
  googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'email profile');
  googleAuthUrl.searchParams.append('prompt', 'select_account');
  
  return redirect(302, googleAuthUrl.toString());
}
