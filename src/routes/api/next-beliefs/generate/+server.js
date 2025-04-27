import { json } from '@sveltejs/kit';
import { TokenJS } from 'token.js';
import { env } from '$env/dynamic/private';
import { nextBeliefsAiConfig } from '$lib/config';
import { decodeHTMLEntities, stripHtml } from '$lib/utils/htmlUtils';
import { extractNextBeliefTexts } from '$lib/utils/beliefProcessor';
import { marked } from 'marked';

/**
 * POST handler to generate next belief suggestions using AI
 * Expects a request body with a prompt and previousBeliefs array
 */
export async function POST({ request, locals }) {
  // Ensure user is authenticated
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Initializing TokenJS for next belief suggestions');
    const tokenjs = new TokenJS({
      openaiApiKey: env.OPENAI_API_KEY
    });

    console.log('Calling OpenAI API with model:', nextBeliefsAiConfig.model);
    const result = await tokenjs.chat.completions.create({
      provider: nextBeliefsAiConfig.provider,
      model: nextBeliefsAiConfig.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        }
      ],
    });

    // Extract the content from the response
    const content = result.choices[0]?.message?.content || '';
    
    // First try to extract the suggestions using the beliefs extractor
    let suggestions = extractNextBeliefTexts(marked.parse(content));
    
    // If no beliefs were extracted using the standard method, fall back to basic parsing
    if (suggestions.length === 0) {
      suggestions = parseBasicNumberedList(content);
    }
    
    // Clean up and return the suggestions
    const cleanedSuggestions = suggestions.map(s => stripHtml(decodeHTMLEntities(s)));
    
    console.log(`AI generated ${cleanedSuggestions.length} next belief suggestions`);
    return json({ suggestions: cleanedSuggestions });
  } catch (error) {
    console.error('Error generating next belief suggestions with AI:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate next belief suggestions',
        suggestions: [] 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Basic parser for numbered lists when the more robust extractor doesn't find anything
 * @param {string} content - Raw content from AI response
 * @returns {Array<string>} - Array of extracted belief strings
 */
function parseBasicNumberedList(content) {
  if (!content) return [];
  
  // The format should be a numbered list like "1. Belief text"
  const suggestions = [];
  
  // Match numbered items (1. Text) or bullet points (• Text)
  const regex = /(?:^|\n)(?:\d+\.|\•)\s*(.+?)(?:\n|$)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (match[1] && match[1].trim()) {
      suggestions.push(match[1].trim());
    }
  }
  
  // If no matches found, try splitting by newlines
  if (suggestions.length === 0) {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('Potential Next Beliefs:'));
  }
  
  return suggestions;
} 