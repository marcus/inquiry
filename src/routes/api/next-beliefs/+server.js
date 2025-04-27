import { generateNextBeliefSuggestions } from '$lib/services/nextBeliefsService';
import { json } from '@sveltejs/kit';

/**
 * GET handler to generate next belief suggestions based on previous inquiries
 */
export async function GET({ locals, fetch }) {
  // Ensure user is authenticated
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    // Generate next belief suggestions
    const suggestions = await generateNextBeliefSuggestions(locals.user.id, fetch);
    
    // Ensure we always return an array, even if there was an issue
    return json({ 
      suggestions: Array.isArray(suggestions) ? suggestions : [] 
    });
  } catch (error) {
    console.error('Error generating next belief suggestions:', error);
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