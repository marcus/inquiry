import { verifyToken, getUserById } from '$lib/server/auth';
import { parse } from 'cookie';
import { runMigrations } from '$lib/server/db/migrations/index.js';

// Run migrations on server startup
// Wrap in try/catch to prevent app from crashing if migrations fail
try {
  runMigrations().then(() => {
    console.log('Migrations completed successfully');
  }).catch(error => {
    console.error('Failed to run migrations:', error);
    // Log the error but don't throw it to allow the app to start
  });
} catch (error) {
  console.error('Error initializing migrations:', error);
}

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
  // Let errors bubble up to SvelteKit's handleError
  return await resolve(event);
}

/**
 * SvelteKit handleError hook for logging uncaught errors
 * @type {import('@sveltejs/kit').HandleServerError}
 */
export function handleError({ error, event }) {
  const url = event.url?.toString() || '';
  const method = event.request?.method || '';
  const headers = Object.fromEntries(event.request.headers.entries());
  console.error('[SvelteKit handleError hook]', {
    url,
    method,
    headers,
    message: error.message,
    stack: error.stack
  });
  // Optionally, return a custom error object for the error page
  return {
    message: error.message,
    code: error.code || 'UNKNOWN',
    stack: error.stack
  };
}
