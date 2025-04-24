import { json } from '@sveltejs/kit';
import { serialize } from 'cookie';

export async function POST() {
  // Clear the token cookie
  const cookie = serialize('token', '', {
    httpOnly: true,
    maxAge: 0, // Expire immediately
    sameSite: 'strict',
    path: '/'
  });
  
  return json(
    { success: true },
    { 
      headers: {
        'Set-Cookie': cookie
      }
    }
  );
}
