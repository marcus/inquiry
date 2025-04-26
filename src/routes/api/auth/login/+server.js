import { json } from '@sveltejs/kit';
import { getUserByUsername, getUserByEmail, verifyPassword, createToken } from '$lib/server/auth';
import { serialize } from 'cookie';

export async function POST({ request }) {
  try {
    const { username, password } = await request.json();
    
    // Validate input
    if (!username || !password) {
      return json({ error: 'Username and password are required' }, { status: 400 });
    }
    
    // First, try to get user by email
    let user = await getUserByEmail(username);
    
    // If not found by email, try by username
    if (!user) {
      user = await getUserByUsername(username);
    }
    
    // Check if user has a Google account
    if (user?.googleId) {
      return json({ 
        error: 'It looks like you usually sign in with Google. Please use the "Sign in with Google" button instead.',
        isGoogleUser: true 
      }, { status: 401 });
    }

    // Return invalid credentials if no user found
    if (!user) {
      return json({ error: 'Invalid username or password' }, { status: 401 });
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return json({ error: 'Invalid username or password' }, { status: 401 });
    }
    
    // Create token
    const token = createToken(user.id);
    
    // Set cookie
    const cookie = serialize('token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'strict',
      path: '/'
    });
    
    return json(
      { success: true, username: user.username },
      { 
        headers: {
          'Set-Cookie': cookie
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Failed to log in' }, { status: 500 });
  }
}
