<script>
  import { goto } from '$app/navigation';
  import { authStore, logout, changePassword, updateProfile, deleteAccount } from '$lib/stores/authStore';
  import { onMount } from 'svelte';
  
  let currentPassword = '';
  let newPassword = '';
  let confirmNewPassword = '';
  let error = '';
  let success = '';
  let isSubmitting = false;
  let activeTab = 'profile';
  let editingProfile = false;
  let showDeleteConfirm = false;
  let deleteError = '';
  let isDeletingAccount = false;
  
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
  
  async function handleDeleteAccount() {
    deleteError = '';
    isDeletingAccount = true;
    
    try {
      const result = await deleteAccount();
      
      if (result.success) {
        // Redirect to home page after successful deletion
        goto('/');
      } else {
        deleteError = result.error || 'Failed to delete account';
        showDeleteConfirm = false;
      }
    } catch (e) {
      console.error('Delete account error:', e);
      deleteError = 'An unexpected error occurred';
      showDeleteConfirm = false;
    } finally {
      isDeletingAccount = false;
    }
  }
  
  function openDeleteConfirm() {
    showDeleteConfirm = true;
    deleteError = '';
  }
  
  function closeDeleteConfirm() {
    showDeleteConfirm = false;
    deleteError = '';
  }
  
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
    
    {#if deleteError}
      <div class="mb-6 p-3 bg-red-50 text-red-700 rounded-md text-sm">
        {deleteError}
      </div>
    {/if}
    
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
        
        <!-- Delete Account Section (Less Prominent) -->
        <div class="pt-8 mt-8 border-t border-slate-200">
          <details class="group">
            <summary class="flex justify-between items-center cursor-pointer list-none">
              <div class="flex items-center">
                <h3 class="text-sm font-medium text-slate-600">Account Management</h3>
              </div>
              <svg class="h-5 w-5 text-slate-500 group-open:rotate-180 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mt-4 pl-2">
              <p class="text-xs text-slate-500 mb-3">
                If you no longer wish to use this service, you can permanently delete your account and all associated data.
              </p>
              <button
                on:click={openDeleteConfirm}
                class="text-sm text-slate-600 hover:text-red-600 transition-colors duration-200 flex items-center"
              >
                <svg class="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                Delete my account
              </button>
            </div>
          </details>
        </div>
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

<!-- Delete Account Confirmation Modal -->
{#if showDeleteConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Delete your account?</h3>
      <p class="text-sm text-gray-500 mb-6">
        This will permanently delete your account and all associated data. This action cannot be undone.
      </p>
      
      <div class="flex justify-end space-x-3">
        <button
          on:click={closeDeleteConfirm}
          class="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
          disabled={isDeletingAccount}
        >
          Cancel
        </button>
        <button
          on:click={handleDeleteAccount}
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center"
          disabled={isDeletingAccount}
        >
          {#if isDeletingAccount}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
          {:else}
            Delete Account
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
