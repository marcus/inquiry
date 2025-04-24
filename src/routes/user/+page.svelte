<script>
  import { goto } from '$app/navigation';
  import { authStore, logout, changePassword } from '$lib/stores/authStore';
  import { onMount } from 'svelte';
  
  let currentPassword = '';
  let newPassword = '';
  let confirmNewPassword = '';
  let error = '';
  let success = '';
  let isSubmitting = false;
  let activeTab = 'profile';
  
  onMount(() => {
    // Redirect to login if not authenticated
    if (!$authStore.loading && !$authStore.isAuthenticated) {
      goto('/login');
    }
  });
  
  async function handleChangePassword() {
    error = '';
    success = '';
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      error = 'All fields are required';
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      error = 'New passwords do not match';
      return;
    }
    
    if (newPassword.length < 8) {
      error = 'New password must be at least 8 characters long';
      return;
    }
    
    isSubmitting = true;
    
    try {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        success = 'Password changed successfully';
        currentPassword = '';
        newPassword = '';
        confirmNewPassword = '';
      } else {
        error = result.error || 'Failed to change password';
      }
    } catch (e) {
      console.error('Change password error:', e);
      error = 'An unexpected error occurred';
    } finally {
      isSubmitting = false;
    }
  }
  
  async function handleLogout() {
    await logout();
    goto('/');
  }
</script>

<div class="bg-white p-8 rounded-lg shadow-md">
  {#if $authStore.loading}
    <div class="text-center py-8">
      <p>Loading...</p>
    </div>
  {:else if $authStore.isAuthenticated}
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-light">Your Account</h1>
      <button
        on:click={handleLogout}
        class="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors duration-200 text-sm"
      >
        Log Out
      </button>
    </div>
    
    <div class="border-b border-slate-200 mb-6">
      <div class="flex space-x-4">
        <button
          class={`py-2 px-4 border-b-2 ${activeTab === 'profile' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-slate-500 hover:text-accent-blue'}`}
          on:click={() => activeTab = 'profile'}
        >
          Profile
        </button>
        <button
          class={`py-2 px-4 border-b-2 ${activeTab === 'security' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-slate-500 hover:text-accent-blue'}`}
          on:click={() => activeTab = 'security'}
        >
          Security
        </button>
      </div>
    </div>
    
    {#if activeTab === 'profile'}
      <div class="space-y-4">
        <div>
          <h2 class="text-lg font-medium mb-4">Profile Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-slate-500">Username</p>
              <p class="font-medium">{$authStore.user.username}</p>
            </div>
            <div>
              <p class="text-sm text-slate-500">Email</p>
              <p class="font-medium">{$authStore.user.email}</p>
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'security'}
      <div class="space-y-4">
        <h2 class="text-lg font-medium mb-4">Change Password</h2>
        
        <form on:submit|preventDefault={handleChangePassword} class="space-y-4">
          {#if error}
            <div class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          {/if}
          
          {#if success}
            <div class="p-3 bg-green-50 text-green-700 rounded-md text-sm">
              {success}
            </div>
          {/if}
          
          <div>
            <label for="currentPassword" class="block text-sm text-slate-600 mb-1">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              bind:value={currentPassword}
              class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              placeholder="Enter your current password"
            />
          </div>
          
          <div>
            <label for="newPassword" class="block text-sm text-slate-600 mb-1">New Password</label>
            <input
              id="newPassword"
              type="password"
              bind:value={newPassword}
              class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              placeholder="Enter your new password"
            />
          </div>
          
          <div>
            <label for="confirmNewPassword" class="block text-sm text-slate-600 mb-1">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              type="password"
              bind:value={confirmNewPassword}
              class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              placeholder="Confirm your new password"
            />
          </div>
          
          <div class="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              class="py-2 px-4 bg-accent-blue text-white rounded-md hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    {/if}
  {/if}
</div>
