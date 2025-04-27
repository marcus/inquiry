import { aiConfig } from '$lib/config';
import { processNextBeliefs, extractNextBeliefTexts } from '$lib/utils/beliefProcessor';
import { createNextBeliefsPrompt } from '$lib/prompts/nextBeliefsPrompt';
import { decodeHTMLEntities, stripHtml } from '$lib/utils/htmlUtils';
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
    // Step 1: Fetch recent inquiries with their AI responses
    const response = await fetch(`/api/inquiries/recent?limit=4&includeAiResponses=true`);
    
    if (!response.ok) {
      console.error('Failed to fetch recent inquiries, status:', response.status);
      throw new Error('Failed to fetch recent inquiries');
    }
    
    const inquiries = await response.json();
    
    // If there are no previous inquiries, return empty array
    if (!inquiries || inquiries.length === 0) {
      console.log('No inquiries found, returning empty suggestions array');
      return [];
    }
    
    // Step 2: Extract beliefs and potential next beliefs from previous inquiries
    const previousBeliefs = inquiries.map(inquiry => {
      // Get potential next beliefs from AI response if available
      let nextBeliefs = [];
      if (inquiry.aiResponses && inquiry.aiResponses.length > 0) {
        try {
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
    
    // Step 3: Generate a prompt using the nextBeliefsPrompt utility
    const prompt = createNextBeliefsPrompt(validPreviousBeliefs);
    
    // Step 4: Call our AI endpoint to get suggested next beliefs
    try {
      console.log('Calling AI endpoint for next belief suggestions');
      const aiResponse = await fetch('/api/next-beliefs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });
      
      if (!aiResponse.ok) {
        throw new Error(`AI service returned status ${aiResponse.status}`);
      }
      
      const result = await aiResponse.json();
      
      // If we have AI-generated suggestions, use those
      if (result && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
        return result.suggestions;
      }
      
      // Fallback to extracted beliefs if AI didn't return anything useful
      console.log('No AI-generated suggestions, falling back to extracted beliefs');
    } catch (error) {
      console.error('Error generating next belief suggestions with AI:', error);
      // Just log the error and continue to the fallback
    }
    
    // Step 5: Fallback - use previously extracted beliefs when AI fails
    console.log('Using fallback: extracting beliefs from previous inquiries');
    const allExtractedBeliefs = validPreviousBeliefs.flatMap(item => item.nextBeliefs || []);
    
    // Remove duplicates and clean the texts
    const uniqueBeliefs = [...new Set(allExtractedBeliefs)]
      .map(belief => stripHtml(decodeHTMLEntities(belief)))
      .filter(belief => belief && belief.trim() !== '');
    
    // Take up to 5 suggestions
    const suggestions = uniqueBeliefs.slice(0, 5);
    
    console.log(`Returning ${suggestions.length} fallback belief suggestions`);
    return suggestions;
  } catch (error) {
    console.error('Error in generateNextBeliefSuggestions:', error);
    return [];
  }
} 