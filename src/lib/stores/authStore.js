import { writable } from 'svelte/store';

// Create a store for authentication state
export const authStore = writable({
  isAuthenticated: false,
  user: null,
  loading: true
});

// Function to fetch the current user
export async function fetchCurrentUser() {
  try {
    authStore.update(state => ({ ...state, loading: true }));
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    if (data.authenticated) {
      authStore.set({
        isAuthenticated: true,
        user: data.user,
        loading: false
      });
    } else {
      authStore.set({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
    
    return data.authenticated;
  } catch (error) {
    console.error('Error fetching user:', error);
    authStore.set({
      isAuthenticated: false,
      user: null,
      loading: false
    });
    return false;
  }
}

// Function to log in
export async function login(username, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      await fetchCurrentUser();
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Function to initiate Google login
export function googleLogin() {
  window.location.href = '/api/auth/login/google';
}

// Function to sign up
export async function signup(username, email, password) {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      await fetchCurrentUser();
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Function to log out
export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST'
    });
    
    authStore.set({
      isAuthenticated: false,
      user: null,
      loading: false
    });
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Function to change password
export async function changePassword(currentPassword, newPassword) {
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Function to update profile (username and email)
export async function updateProfile(username, email) {
  try {
    const response = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Update the local user data in the store
      await fetchCurrentUser();
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
