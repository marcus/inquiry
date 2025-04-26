/**
 * Environment variable utility that works in both development and production
 * This handles the differences between SvelteKit's $env modules and process.env
 */

/**
 * Get Google Client ID from environment
 */
export function getGoogleClientId() {
  if (typeof process !== 'undefined' && process.env && process.env.GOOGLE_CLIENT_ID) {
    return process.env.GOOGLE_CLIENT_ID;
  }
  return '';
}

/**
 * Get Google Client Secret from environment
 */
export function getGoogleClientSecret() {
  if (typeof process !== 'undefined' && process.env && process.env.GOOGLE_CLIENT_SECRET) {
    return process.env.GOOGLE_CLIENT_SECRET;
  }
  return '';
}

/**
 * Get the appropriate base URL based on environment
 */
export function getBaseUrl() {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return 'https://haplab.com';
  }
  return 'http://localhost:5173';
}
