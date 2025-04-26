<script>
  import { goto } from '$app/navigation';
  import { login, googleLogin } from '$lib/stores/authStore';
  import { onMount } from 'svelte';
  
  export let data;
  
  let username = '';
  let password = '';
  let error = '';
  let isSubmitting = false;
  let errorFromUrl = '';
  
  onMount(() => {
    // Check URL for error parameters from Google auth
    const url = new URL(window.location.href);
    errorFromUrl = url.searchParams.get('error');
    
    if (errorFromUrl) {
      switch(errorFromUrl) {
        case 'google_auth_failed':
          error = 'Google authentication failed.';
          break;
        case 'google_token_failed':
          error = 'Failed to get access token from Google.';
          break;
        case 'google_profile_failed':
          error = 'Failed to get profile information from Google.';
          break;
        case 'google_auth_error':
          error = 'An error occurred during Google authentication.';
          break;
        default:
          error = 'An error occurred during login.';
      }
    }
    
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.head.append(script);
    
    script.onload = () => {
      // Make sure data.googleClientId exists
      if (data && data.googleClientId) {
        google.accounts.id.initialize({
          client_id: data.googleClientId,
          callback: handleCredentialResponse
        });
        
        // Render the button
        google.accounts.id.renderButton(
          document.getElementById('googleButton'),
          { theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular' }
        );
      }
    };
  });
  
  // Handle Google Sign-In callback
  function handleCredentialResponse(response) {
    if (response && response.credential) {
      // We can either handle the credential here or redirect to our endpoint
      googleLogin();
    }
  }
  
  // Function to directly trigger Google login
  function handleGoogleLogin() {
    googleLogin();
  }
  
  async function handleSubmit() {
    error = '';
    
    // Validate input
    if (!username || !password) {
      error = 'Username and password are required';
      return;
    }
    
    isSubmitting = true;
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        // Redirect to home page after successful login
        goto('/');
      } else {
        error = result.error || 'Invalid username or password';
      }
    } catch (e) {
      console.error('Login error:', e);
      error = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
  <h1 class="text-2xl font-light text-center mb-6">Log In</h1>
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    {#if error}
      <div class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
        {error}
      </div>
    {/if}
    
    <div>
      <label for="username" class="block text-sm text-slate-600 mb-1">Username</label>
      <input
        id="username"
        type="text"
        bind:value={username}
        class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        placeholder="Enter your username"
      />
    </div>
    
    <div>
      <label for="password" class="block text-sm text-slate-600 mb-1">Password</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        placeholder="Enter your password"
      />
    </div>
    
    <div class="pt-2">
      <button
        type="submit"
        disabled={isSubmitting}
        class="w-full py-2 px-4 bg-accent-blue text-white rounded-md hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isSubmitting ? 'Logging In...' : 'Log In'}
      </button>
    </div>
    
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-slate-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-slate-500">Or continue with</span>
      </div>
    </div>
    
    <div id="googleButton" class="flex justify-center"></div>
    
    <div class="text-center text-sm text-slate-500 mt-4">
      Don't have an account? <a href="/signup" class="text-accent-blue hover:text-accent-blue/80 no-underline">Sign up</a>
    </div>
  </form>
</div>
