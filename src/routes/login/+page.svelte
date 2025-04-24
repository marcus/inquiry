<script>
  import { goto } from '$app/navigation';
  import { login } from '$lib/stores/authStore';
  
  let username = '';
  let password = '';
  let error = '';
  let isSubmitting = false;
  
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
    
    <div class="text-center text-sm text-slate-500 mt-4">
      Don't have an account? <a href="/signup" class="text-accent-blue hover:text-accent-blue/80 no-underline">Sign up</a>
    </div>
  </form>
</div>
