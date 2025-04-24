import { json } from '@sveltejs/kit';
import { createUser, getUserByEmail, getUserByUsername, createToken } from '$lib/server/auth';
import { serialize } from 'cookie';

export async function POST({ request }) {
  try {
    const { username, email, password } = await request.json();
    
    // Validate input
    if (!username || !email || !password) {
      return json({ error: 'Username, email, and password are required' }, { status: 400 });
    }
    
    // Check if username already exists
    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return json({ error: 'Username already exists' }, { status: 400 });
    }
    
    // Check if email already exists
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return json({ error: 'Email already exists' }, { status: 400 });
    }
    
    // Create user
    const userId = await createUser(username, email, password);
    
    // Create token
    const token = createToken(userId);
    
    // Set cookie
    const cookie = serialize('token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'strict',
      path: '/'
    });
    
    return json(
      { success: true, username },
      { 
        headers: {
          'Set-Cookie': cookie
        }
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return json({ error: 'Failed to create account' }, { status: 500 });
  }
}
