<script>
  import { goto } from '$app/navigation';
  import { signup, googleLogin } from '$lib/stores/authStore';
  import { onMount } from 'svelte';
  
  export let data;
  
  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let isSubmitting = false;
  
  onMount(() => {
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
          { theme: 'outline', size: 'large', text: 'signup_with', shape: 'rectangular' }
        );
      }
    };
  });
  
  // Handle Google Sign-In callback
  function handleCredentialResponse(response) {
    if (response && response.credential) {
      googleLogin();
    }
  }
  
  async function handleSubmit() {
    error = '';
    
    // Validate input
    if (!username || !email || !password || !confirmPassword) {
      error = 'All fields are required';
      return;
    }
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      error = 'Please enter a valid email address';
      return;
    }
    
    isSubmitting = true;
    
    try {
      const result = await signup(username, email, password);
      
      if (result.success) {
        // Redirect to home page after successful signup
        goto('/');
      } else {
        error = result.error || 'Failed to create account';
      }
    } catch (e) {
      console.error('Signup error:', e);
      error = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
  <h1 class="text-2xl font-light text-center mb-6">Create an Account</h1>
  
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
        placeholder="Choose a username"
      />
    </div>
    
    <div>
      <label for="email" class="block text-sm text-slate-600 mb-1">Email</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        placeholder="Enter your email address"
      />
    </div>
    
    <div>
      <label for="password" class="block text-sm text-slate-600 mb-1">Password</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        placeholder="Create a password"
      />
    </div>
    
    <div>
      <label for="confirmPassword" class="block text-sm text-slate-600 mb-1">Confirm Password</label>
      <input
        id="confirmPassword"
        type="password"
        bind:value={confirmPassword}
        class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        placeholder="Confirm your password"
      />
    </div>
    
    <div class="pt-2">
      <button
        type="submit"
        disabled={isSubmitting}
        class="w-full py-2 px-4 bg-accent-blue text-white rounded-md hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
      </button>
    </div>
    
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-slate-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-slate-500">Or sign up with</span>
      </div>
    </div>
    
    <div id="googleButton" class="flex justify-center"></div>
    
    <div class="text-center text-sm text-slate-500 mt-4">
      Already have an account? <a href="/login" class="text-accent-blue hover:text-accent-blue/80 no-underline">Log in</a>
    </div>
  </form>
</div>
