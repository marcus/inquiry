<script>
  import { goto } from '$app/navigation';
  import { authStore, logout, changePassword, updateProfile } from '$lib/stores/authStore';
  import { onMount } from 'svelte';
  
  let currentPassword = '';
  let newPassword = '';
  let confirmNewPassword = '';
  let error = '';
  let success = '';
  let isSubmitting = false;
  let activeTab = 'profile';
  let editingProfile = false;
  
  // Profile update form
  let profileUsername = '';
  let profileEmail = '';
  let profileError = '';
  let profileSuccess = '';
  let profileIsSubmitting = false;
  
  // Helper to check if user is a Google user
  $: isGoogleUser = $authStore.user && $authStore.user.googleId;
  
  // Reset to profile tab if Google user selects security
  $: {
    if (isGoogleUser && activeTab === 'security') {
      activeTab = 'profile';
    }
  }
  
  onMount(() => {
    // Redirect to login if not authenticated
    if (!$authStore.loading && !$authStore.isAuthenticated) {
      goto('/login');
    }
    
    // Initialize profile form with current values
    if ($authStore.user) {
      profileUsername = $authStore.user.username;
      profileEmail = $authStore.user.email;
      console.log('User data:', $authStore.user); // Debug user data
    }
  });
  
  async function handleUpdateProfile() {
    profileError = '';
    profileSuccess = '';
    
    // Validate input
    if (!profileUsername) {
      profileError = 'Username is required';
      return;
    }
    
    if (!isGoogleUser && !profileEmail) {
      profileError = 'Email is required';
      return;
    }
    
    // Simple email validation for non-Google users
    if (!isGoogleUser) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileEmail)) {
        profileError = 'Please enter a valid email address';
        return;
      }
    }
    
    profileIsSubmitting = true;
    
    try {
      const result = await updateProfile(profileUsername, profileEmail);
      
      if (result.success) {
        profileSuccess = 'Profile updated successfully';
        editingProfile = false;
      } else {
        profileError = result.error || 'Failed to update profile';
      }
    } catch (e) {
      console.error('Update profile error:', e);
      profileError = 'An unexpected error occurred';
    } finally {
      profileIsSubmitting = false;
    }
  }
  
  function cancelEdit() {
    editingProfile = false;
    profileError = '';
    profileSuccess = '';
    
    // Reset form values to current user values
    if ($authStore.user) {
      profileUsername = $authStore.user.username;
      profileEmail = $authStore.user.email;
    }
  }
  
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
        {#if !isGoogleUser}
          <button
            class={`py-2 px-4 border-b-2 ${activeTab === 'security' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-slate-500 hover:text-accent-blue'}`}
            on:click={() => activeTab = 'security'}
          >
            Security
          </button>
        {/if}
      </div>
    </div>
    
    {#if activeTab === 'profile'}
      <div class="space-y-6">
        {#if !editingProfile}
          <div>
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-medium">Profile Information</h2>
              <button 
                on:click={() => editingProfile = true}
                class="text-sm text-accent-blue hover:text-accent-blue/80 flex items-center"
              >
                <svg class="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div>
                <p class="text-sm text-slate-500">Username</p>
                <p class="font-medium">{$authStore.user.username}</p>
              </div>
              <div>
                <p class="text-sm text-slate-500">Email</p>
                <p class="font-medium">{$authStore.user.email}</p>
              </div>
            </div>
            {#if isGoogleUser}
              <div class="mt-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Google Account
                </span>
                <p class="mt-1 text-xs text-slate-500">Google-authenticated users cannot change their email address.</p>
              </div>
            {/if}
          </div>
        {:else}
          <div>
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-medium">Edit Profile</h2>
              <button 
                on:click={cancelEdit}
                class="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
            
            <form on:submit|preventDefault={handleUpdateProfile} class="space-y-4">
              {#if profileError}
                <div class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {profileError}
                </div>
              {/if}
              
              {#if profileSuccess}
                <div class="p-3 bg-green-50 text-green-700 rounded-md text-sm">
                  {profileSuccess}
                </div>
              {/if}
              
              <div>
                <label for="username" class="block text-sm text-slate-600 mb-1">Username</label>
                <input
                  id="username"
                  type="text"
                  bind:value={profileUsername}
                  class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>
              
              {#if !isGoogleUser}
                <div>
                  <label for="email" class="block text-sm text-slate-600 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    bind:value={profileEmail}
                    class="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              {/if}
              
              <div class="pt-2">
                <button
                  type="submit"
                  disabled={profileIsSubmitting}
                  class="py-2 px-4 bg-accent-blue text-white rounded-md hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {profileIsSubmitting ? 'Updating Profile...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'security' && !isGoogleUser}
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
