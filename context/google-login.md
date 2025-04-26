Google Login Integration Plan for Svelte 5
Note that this is a high-level overview of the process. You will need to adapt it to your specific application structure.

⸻

1. Expose Client ID to Frontend

In .env (this already exists):

GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
PUBLIC_GOOGLE_CLIENT_ID=xxx

	•	PUBLIC_ prefix makes it available to client-side code via Vite.
	•	Only Client ID gets exposed. Secret stays server-only.

⸻

2. Configure OAuth Redirect URI

In Google Cloud Console → OAuth Credentials:

Authorized Redirect URIs:
http://localhost:5173/api/auth/google

Later, in production, update it to your deployed URL.

⸻

3. Server: Create Login Initiation Endpoint

Create /src/routes/api/auth/login/+server.js:

import { GOOGLE_CLIENT_ID } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export async function GET() {
  const redirectUri = 'http://localhost:5173/api/auth/google'; // must match Google Console entry
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  throw redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

	•	Redirects user to Google’s OAuth2 consent screen.

⸻

4. Server: Handle Google Redirect

Create /src/routes/api/auth/google/+server.js:

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export async function GET({ url, cookies }) {
  const code = url.searchParams.get('code');
  if (!code) {
    throw redirect(302, '/login');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:5173/api/auth/google',
      grant_type: 'authorization_code'
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw redirect(302, '/login');
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });

  const profile = await userRes.json();

  // Example: create or update user in DB
  const user = await upsertUserFromGoogle(profile);

  // Example: create session
  const sessionToken = createSessionToken(user);

  cookies.set('session', sessionToken, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  throw redirect(302, '/');
}

// Implement `upsertUserFromGoogle(profile)` and `createSessionToken(user)` appropriately.



⸻

5. Frontend: Load Client ID

In /src/routes/login/+page.server.js:

import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';

export function load() {
  return { googleClientId: PUBLIC_GOOGLE_CLIENT_ID };
}



⸻

6. Frontend: Render Google Login Button

In /src/routes/login/+page.svelte:

<script lang="ts">
  import { onMount } from 'svelte';
  export let data: { googleClientId: string };

  onMount(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.head.append(script);

    script.onload = () => {
      google.accounts.id.initialize({
        client_id: data.googleClientId,
        ux_mode: 'redirect',
        login_uri: '/api/auth/login'
      });
      google.accounts.id.renderButton(
        document.getElementById('googleButton')!,
        { theme: 'outline', size: 'large' }
      );
    };
  });
</script>

<div id="googleButton"></div>

	•	When user clicks the button, they are redirected via /api/auth/login.
	•	login_uri points at your login initiation endpoint.

⸻

7. Important Security and Behavior Notes
	•	The secret (GOOGLE_CLIENT_SECRET) never reaches the browser.
	•	Always validate or sanitize Google profile fields before trusting them.
	•	Add CSRF protection if you want to be extra careful during session creation.
	•	In production, change redirect_uri to match your real domain.
	•	Always set your cookies with httpOnly, secure and sameSite.


Overview of Flow
	1.	User clicks button → /api/auth/login
	2.	Redirects to Google → OAuth Consent
	3.	Google redirects back → /api/auth/google
	4.	Exchange code for token → Fetch profile
	5.	Create session cookie → Redirect home

