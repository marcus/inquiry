import { env } from '$env/dynamic/private';

/**
 * Returns the base URL for the application based on the current environment
 * @returns {string} The base URL (e.g., 'https://haplab.com' or 'http://localhost:5173')
 */
export function getBaseUrl() {
  return env.NODE_ENV === 'production' 
    ? 'https://haplab.com' 
    : 'http://localhost:5173';
}
