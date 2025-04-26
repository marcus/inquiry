import { redirect } from '@sveltejs/kit';

// Create a Google OAuth redirect URL
export function GET() {
  // Access environment variables with proper error handling
  let clientId;
  
  try {
    // Since this is a synchronous function, we can only use process.env
    if (typeof process !== 'undefined' && process.env && process.env.GOOGLE_CLIENT_ID) {
      clientId = process.env.GOOGLE_CLIENT_ID;
      console.log('Got client ID from process.env');
    }
  } catch (error) {
    console.log('Error accessing environment variables:', error);
  }
  
  if (!clientId) {
    console.error('Google Client ID not found in environment variables');
    throw new Error('Google authentication configuration error');
  }
  
  // Determine base URL based on environment
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://haplab.com' 
    : 'http://localhost:5173';
  
  const redirectUri = `${baseUrl}/api/auth/google`;
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.append('client_id', clientId);
  googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'email profile');
  googleAuthUrl.searchParams.append('prompt', 'select_account');
  
  return redirect(302, googleAuthUrl.toString());
}
