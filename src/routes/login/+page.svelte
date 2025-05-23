<script>
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { login, googleLogin } from '$lib/stores/authStore';
  import { onMount } from 'svelte';
  
  // Use export const instead of export let for data since we're not using it directly
  export const data = {}; 
  
  let username = '';
  let password = '';
  let error = '';
  let isSubmitting = false;
  let errorFromUrl = '';
  let isGoogleUser = false;
  
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
  });
  
  function handleGoogleLogin() {
    googleLogin();
  }
  
  async function handleSubmit() {
    error = '';
    isGoogleUser = false;
    
    // Validate input
    if (!username || !password) {
      error = 'Username/email and password are required';
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
        // Check if this is a Google user
        if (result.isGoogleUser) {
          isGoogleUser = true;
        }
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
      <div class={`p-3 rounded-md text-sm ${isGoogleUser ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
        {error}
        {#if isGoogleUser}
          <div class="mt-2">
            <button
              type="button"
              on:click={handleGoogleLogin}
              class="inline-flex items-center px-3 py-1.5 bg-white border border-blue-300 rounded-md text-blue-700 text-sm hover:bg-blue-50"
            >
              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v7/icons/google.svg" alt="Google" class="w-4 h-4 mr-1.5" />
              Sign in with Google
            </button>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Google Sign-in (Prioritized) -->
    <button 
      type="button" 
      on:click={handleGoogleLogin}
      class="flex items-center justify-center w-full py-3 px-4 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors duration-200 shadow-sm"
    >
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v7/icons/google.svg" alt="Google" class="w-5 h-5 mr-2" />
      Sign in with Google
    </button>
    
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-slate-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-slate-500">Or use email and password</span>
      </div>
    </div>
    
    <div>
      <label for="username" class="block text-sm text-slate-600 mb-1">Username or Email</label>
      <input
        id="username"
        type="text"
        bind:value={username}
        class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        placeholder="Enter your username or email"
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
    
    <div class="text-center text-sm text-slate-500 mt-4">
      Don't have an account? <a href="/signup" class="text-accent-blue hover:text-accent-blue/80 no-underline">Sign up</a>
    </div>
  </form>
</div>
