import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';

export function load() {
  return { 
    googleClientId: PUBLIC_GOOGLE_CLIENT_ID 
  };
} 