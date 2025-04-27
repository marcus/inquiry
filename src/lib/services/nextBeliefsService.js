import { aiConfig } from '$lib/config';
import { processNextBeliefs, extractNextBeliefTexts } from '$lib/utils/beliefProcessor';
import { createNextBeliefsPrompt } from '$lib/prompts/nextBeliefsPrompt';
import { TokenJS } from 'token.js';
import { env } from '$env/dynamic/private';
import { marked } from 'marked';
import { browser } from '$app/environment';

/**
 * Fetches recent inquiries and their AI responses, extracts potential next beliefs,
 * and generates new suggestions using AI
 * 
 * @param {string} userId - The user ID to fetch inquiries for
 * @param {Function} fetch - The fetch function to use (event.fetch from SvelteKit)
 * @returns {Promise<Array<string>>} - Array of suggested next beliefs
 */
export async function generateNextBeliefSuggestions(userId, fetch) {
  try {
    console.log('Fetching recent inquiries for next belief suggestions');
    // Fetch the user's 4 most recent inquiries with their AI responses
    const response = await fetch(`/api/inquiries/recent?limit=4&includeAiResponses=true`);
    
    if (!response.ok) {
      console.error('Failed to fetch recent inquiries, status:', response.status);
      throw new Error('Failed to fetch recent inquiries');
    }
    
    const inquiries = await response.json();
    console.log(`Received ${inquiries.length} inquiries for next belief suggestions`);
    
    // If there are no previous inquiries, return empty array
    if (!inquiries || inquiries.length === 0) {
      console.log('No inquiries found, returning empty suggestions array');
      return [];
    }
    
    // Format the data for the prompt
    const previousBeliefs = inquiries.map(inquiry => {
      // Get potential next beliefs from AI response if available
      let nextBeliefs = [];
      if (inquiry.aiResponses && inquiry.aiResponses.length > 0) {
        try {
          console.log(`Processing AI responses for inquiry ID: ${inquiry.id}`);
          // Process the AI response content using the beliefProcessor utility
          const processedContent = processNextBeliefs(inquiry.aiResponses[0].content, marked.parse);
          nextBeliefs = extractNextBeliefTexts(processedContent) || [];
          console.log(`Extracted ${nextBeliefs.length} next beliefs from inquiry ID: ${inquiry.id}`);
        } catch (err) {
          console.error(`Error extracting next beliefs from inquiry ID ${inquiry.id}:`, err);
          // Continue with empty nextBeliefs rather than failing
        }
      } else {
        console.log(`No AI responses for inquiry ID: ${inquiry.id || 'unknown'}`);
      }
      
      return {
        belief: inquiry.belief || '',
        nextBeliefs: nextBeliefs || []
      };
    });
    
    // Filter out any invalid entries
    const validPreviousBeliefs = previousBeliefs.filter(item => item.belief && item.belief.trim() !== '');
    
    // If there are no valid previous beliefs, return empty array
    if (validPreviousBeliefs.length === 0) {
      return [];
    }
    
    // Format the prompt with previous beliefs and their next beliefs
    const prompt = createNextBeliefsPrompt(validPreviousBeliefs);
    
    // Call the AI service directly rather than going through another API endpoint
    try {
      // Here we would typically call an AI service directly
      // For now, extract suggestions from the valid beliefs we already have
      console.log('Generated prompt for next belief suggestions, returning extracted beliefs');
      
      // Use the previously extracted beliefs as suggestions
      const allExtractedBeliefs = validPreviousBeliefs.flatMap(item => item.nextBeliefs || []);
      
      // Take up to 5 unique beliefs
      const uniqueBeliefs = [...new Set(allExtractedBeliefs)];
      const suggestions = uniqueBeliefs.slice(0, 5);
      
      console.log(`Returning ${suggestions.length} belief suggestions`);
      return suggestions;
    } catch (error) {
      console.error('Error generating next belief suggestions:', error);
      return [];
    }
  } catch (error) {
    console.error('Error in generateNextBeliefSuggestions:', error);
    return [];
  }
} 