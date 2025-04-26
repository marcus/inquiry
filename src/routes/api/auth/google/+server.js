import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createToken } from '$lib/server/auth';
import { getBaseUrl } from '$lib/server/utils';
import { eq } from 'drizzle-orm';
import { serialize } from 'cookie';
import { env } from '$env/dynamic/private';

// Google OAuth callback handler
export async function GET({ url, cookies }) {
  // Access environment variables with dynamic imports (works in both dev and prod)
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('Google credentials not found in environment variables');
    throw new Error('Google authentication configuration error');
  }
  
  const code = url.searchParams.get('code');
  if (!code) {
    throw redirect(302, '/login?error=google_auth_failed');
  }

  try {
    // Get base URL from utility function
    const baseUrl = getBaseUrl();
    
    // Exchange the code for a token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${baseUrl}/api/auth/google`,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw redirect(302, '/login?error=google_token_failed');
    }

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await userRes.json();
    if (!profile.email) {
      throw redirect(302, '/login?error=google_profile_failed');
    }

    // Find or create user in our database
    let user = await db.select().from(users).where(eq(users.email, profile.email)).limit(1);
    let userId;

    if (user.length === 0) {
      // New user - create an account
      const username = `user_${Math.floor(Math.random() * 10000)}`;
      const result = await db.insert(users).values({
        username: username,
        email: profile.email,
        passwordHash: 'google-oauth-user', // These users won't log in with password
        googleId: profile.id
      }).returning({ id: users.id });
      
      userId = result[0].id;
    } else {
      // Existing user
      userId = user[0].id;
      
      // Update Google ID if not yet set
      if (!user[0].googleId) {
        await db.update(users)
          .set({ googleId: profile.id })
          .where(eq(users.id, userId));
      }
    }

    // Create a session token
    const token = createToken(userId);
    
    // Set token cookie
    const cookie = serialize('token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      path: '/'
    });

    // Redirect to home with the cookie set
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': cookie
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    throw redirect(302, '/login?error=google_auth_error');
  }
}