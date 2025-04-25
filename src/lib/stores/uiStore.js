import { writable } from 'svelte/store';

// Store for tracking UI state across components
export const showGuidanceStore = writable(false);
