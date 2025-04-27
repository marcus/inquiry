<script>
  import { fade, slide } from 'svelte/transition';
  import { getNextBeliefUrl } from '$lib/utils/beliefProcessor';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  // Component state
  let isLoading = $state(false);
  let error = $state(null);
  let suggestions = $state([]);
  let isOpen = $state(false);
  let hasCompletedInquiries = $state(false);

  /**
   * Helper function to decode HTML entities in a string
   * @param {string} text - Text that may contain HTML entities
   * @returns {string} Text with HTML entities decoded
   */
  function decodeHTMLEntities(text) {
    if (typeof text !== 'string') return '';
    
    // Replace common HTML entities
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  /**
   * Helper function to strip any HTML tags from a string
   * @param {string} text - Text that may contain HTML tags
   * @returns {string} Text with HTML tags removed
   */
  function stripHtml(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '');
  }

  // Check if the user has completed inquiries
  onMount(async () => {
    if (!browser) return; // Only run in browser
    
    try {
      // Check if the user has any completed inquiries
      const response = await fetch('/api/inquiries/recent?limit=1');
      if (response.ok) {
        const inquiries = await response.json();
        hasCompletedInquiries = Array.isArray(inquiries) && inquiries.length > 0;
        
        // If no completed inquiries, don't show the component
        if (!hasCompletedInquiries) {
          console.log('No completed inquiries found, hiding component');
        }
      } else {
        console.error('Error checking for completed inquiries, status:', response.status);
        hasCompletedInquiries = false;
      }
    } catch (err) {
      console.error('Error checking for completed inquiries:', err);
      hasCompletedInquiries = false;
    }
  });

  /**
   * Fetch next belief suggestions from the API
   */
  async function fetchSuggestions() {
    if (isLoading || !browser) return;
    
    isLoading = true;
    error = null;
    
    try {
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/next-beliefs', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch suggestions';
        
        try {
          const data = await response.json();
          if (data && data.error) {
            errorMessage = data.error;
          }
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data.suggestions)) {
        throw new Error('Invalid response format');
      }
      
      // Clean up any HTML in the suggestions
      suggestions = data.suggestions
        .filter(s => s && typeof s === 'string' && s.trim() !== '')
        .map(s => stripHtml(decodeHTMLEntities(s)));
      
      // If we got suggestions, auto-open the panel
      if (suggestions.length > 0) {
        isOpen = true;
      } else {
        error = 'No suggestions available based on your previous inquiries.';
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        error = 'Request timed out. Please try again later.';
      } else {
        error = err.message || 'An error occurred while fetching suggestions';
      }
      console.error('Error fetching next belief suggestions:', err);
    } finally {
      isLoading = false;
    }
  }

  /**
   * Toggle the suggestions panel open/closed
   */
  function toggleSuggestions() {
    if (!isOpen && suggestions.length === 0 && !error) {
      // If we're opening the panel but don't have suggestions yet, fetch them
      fetchSuggestions();
    } else {
      // Otherwise just toggle the panel
      isOpen = !isOpen;
    }
  }
</script>

{#if hasCompletedInquiries}
  <div class="mt-8 border border-slate-200 rounded-md overflow-hidden">
    <button 
      onclick={toggleSuggestions}
      class="w-full py-3 px-4 bg-slate-50 text-left text-slate-700 hover:bg-slate-100 transition-colors duration-200 flex items-center justify-between"
    >
      <span class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Suggest Next Beliefs
      </span>
      
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    {#if isOpen}
      <div transition:slide={{ duration: 300 }} class="p-4 bg-white">
        {#if isLoading}
          <div class="flex justify-center py-6">
            <svg class="animate-spin h-6 w-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {:else if error}
          <div class="bg-red-50 border border-red-100 text-red-700 p-3 rounded-md">
            {error}
          </div>
        {:else if suggestions.length === 0}
          <div class="text-center text-slate-500 py-4">
            No belief suggestions available.
          </div>
        {:else}
          <div class="space-y-3">
            <p class="text-sm text-slate-500 mb-4">
              Based on your previous inquiries, here are some beliefs you might want to explore next:
            </p>
            
            <ul class="space-y-2">
              {#each suggestions as suggestion, i}
                <li transition:fade={{ delay: i * 100, duration: 200 }}>
                  <a 
                    href={getNextBeliefUrl(suggestion)}
                    class="block p-3 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-800 transition-colors duration-200 border border-blue-100"
                  >
                    {suggestion}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if} 