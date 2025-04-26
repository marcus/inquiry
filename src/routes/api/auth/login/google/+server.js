import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET() {
  // Access environment variables with dynamic imports (works in both dev and prod)
  const clientId = env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    console.error('Google Client ID not found in environment variables');
    throw new Error('Google authentication configuration error');
  }
  
  // Determine base URL based on environment
  const baseUrl = env.NODE_ENV === 'production' 
    ? 'https://haplab.com' 
    : 'http://localhost:5173';
  
  const redirectUri = `${baseUrl}/api/auth/google`; // must match Google Console entry
  
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