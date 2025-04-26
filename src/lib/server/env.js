/**
 * Environment variable utility that works in both development and production
 * This handles the differences between SvelteKit's $env modules and process.env
 */

// Try to import from SvelteKit's env module first (for local development)
let googleClientId, googleClientSecret;

try {
  // This will work in development
  const env = await import('$env/static/private');
  googleClientId = env.GOOGLE_CLIENT_ID;
  googleClientSecret = env.GOOGLE_CLIENT_SECRET;
} catch (error) {
  // Fallback to process.env (for Docker/production)
  googleClientId = process.env.GOOGLE_CLIENT_ID;
  googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
}

export const GOOGLE_CLIENT_ID = googleClientId || '';
export const GOOGLE_CLIENT_SECRET = googleClientSecret || '';

/**
 * Get the appropriate base URL based on environment
 */
export function getBaseUrl() {
  return process.env.NODE_ENV === 'production' 
    ? 'https://haplab.com' 
    : 'http://localhost:5173';
}
