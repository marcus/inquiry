import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ authenticated: false });
  }
  
  return json({
    authenticated: true,
    user: {
      id: locals.user.id,
      username: locals.user.username,
      email: locals.user.email,
      googleId: locals.user.googleId || null
    }
  });
}
