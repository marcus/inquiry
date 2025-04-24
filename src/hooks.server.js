import { verifyToken, getUserById } from '$lib/server/auth';
import { parse } from 'cookie';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Get cookies from request
  const cookies = event.request.headers.get('cookie');
  
  if (cookies) {
    const parsedCookies = parse(cookies || '');
    const token = parsedCookies.token;
    
    if (token) {
      // Verify token and get user ID
      const payload = verifyToken(token);
      
      if (payload && payload.userId) {
        // Get user from database
        const user = await getUserById(payload.userId);
        
        if (user) {
          // Remove password hash for security
          delete user.passwordHash;
          
          // Set user in locals for use in routes
          event.locals.user = user;
        }
      }
    }
  }
  
  // Enhanced error logging for debugging 500 errors
  try {
    return await resolve(event);
  } catch (err) {
    // Log error details to server console
    const url = event.url?.toString() || '';
    const method = event.request?.method || '';
    const headers = Object.fromEntries(event.request.headers.entries());
    console.error('[SvelteKit handle error]', {
      url,
      method,
      headers,
      message: err.message,
      stack: err.stack
    });
    // Optionally, return a custom error response (still 500)
    return new Response('Internal Server Error (logged in server console)', { status: 500 });
  }
}
