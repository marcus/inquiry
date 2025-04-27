import { json } from '@sveltejs/kit';
import { TokenJS } from 'token.js';
import { db } from '$lib/server/db';
import { inquiries, aiResponses } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { aiConfig } from '$lib/config';
import { createGuidancePrompt, formatInquiryText } from '$lib/prompts/inquiryPrompts';

// Maximum number of guidance generations allowed per inquiry
const MAX_GUIDANCE_GENERATIONS = 2;

// POST endpoint to generate AI guidance
export async function POST({ request, locals }) {
  try {
    console.log('AI guidance POST request received');
    const { inquiryId } = await request.json();
    
    if (!inquiryId) {
      console.error('Missing inquiryId in request');
      return new Response(JSON.stringify({ error: 'Missing inquiryId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the current user from locals
    const currentUser = locals.user;
    const userId = currentUser?.id || null;
    
    // Check if the user has reached the guidance limit for this inquiry
    // Skip the check for user_id=1 (admin user)
    if (userId !== 1) {
      const existingResponses = await db
        .select({ 
          count: sql`COUNT(*)`,
          maxGuidanceCount: sql`MAX(guidance_count)`
        })
        .from(aiResponses)
        .where(eq(aiResponses.inquiryId, inquiryId));
      
      const { count, maxGuidanceCount } = existingResponses[0];
      
      if (maxGuidanceCount >= MAX_GUIDANCE_GENERATIONS) {
        console.log(`User ${userId} has reached the guidance limit for inquiry ${inquiryId}`);
        return new Response(JSON.stringify({ 
          error: 'Guidance limit reached',
          limitReached: true,
          maxGenerations: MAX_GUIDANCE_GENERATIONS
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    console.log('Processing guidance request for inquiry ID:', inquiryId);

    // Get the inquiry from the database
    const inquiryResults = await db.select().from(inquiries).where(eq(inquiries.id, inquiryId));
    
    if (!inquiryResults.length) {
      console.error('Inquiry not found:', inquiryId);
      return new Response(JSON.stringify({ error: 'Inquiry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const inquiry = inquiryResults[0];
    console.log('Found inquiry:', inquiry.id, inquiry.belief);
    
    // Format the inquiry text using the utility function
    const inquiryText = formatInquiryText(inquiry);

    // Create the prompt using the centralized prompt function
    const prompt = createGuidancePrompt(inquiryText);

    console.log('Initializing TokenJS with OpenAI API key');
    const tokenjs = new TokenJS({
      openaiApiKey: env.OPENAI_API_KEY
    });

    // Use the Fetch API with streaming to process the response in chunks
    console.log('Setting up streaming response');
    
    // Create a new TransformStream for better streaming control
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Start processing in the background
    (async () => {
      try {
        let completedResponse = '';
        
        console.log('Calling OpenAI API with model:', aiConfig.model);
        const result = await tokenjs.chat.completions.create({
          stream: true,
          provider: aiConfig.provider,
          model: aiConfig.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            }
          ],
        });
        
        console.log('Stream started, processing chunks');
        for await (const part of result) {
          const content = part.choices[0]?.delta?.content || '';
          completedResponse += content;
          
          // Encode and send the chunk immediately
          if (content) {
            await writer.write(new TextEncoder().encode(content));
            // Flush after each chunk to ensure immediate delivery
            await writer.ready;
          }
        }
        
        console.log('Stream complete, saving response to database');
        // Save the complete response to the database
        let guidanceCount = 1;
        
        // Check if there are existing responses for this inquiry
        const existingResponses = await db
          .select({ 
            count: sql`COUNT(*)`,
            maxGuidanceCount: sql`MAX(guidance_count)`
          })
          .from(aiResponses)
          .where(eq(aiResponses.inquiryId, inquiryId));
        
        if (existingResponses[0].count > 0) {
          // Increment the guidance count
          guidanceCount = (existingResponses[0].maxGuidanceCount || 0) + 1;
        }
        
        // Insert the new response with the updated guidance count
        await db.insert(aiResponses).values({
          inquiryId,
          content: completedResponse,
          guidanceCount
        });
        
        console.log('Response saved, closing stream');
        await writer.close();
      } catch (error) {
        console.error('Error in AI guidance generation:', error);
        writer.abort(error);
      }
    })();
    
    // Return the readable stream immediately
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable Nginx buffering
      }
    });
  } catch (error) {
    console.error('Error in AI guidance endpoint:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate AI guidance' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET endpoint to retrieve saved AI guidance
export async function GET({ url }) {
  try {
    const inquiryId = parseInt(url.searchParams.get('inquiryId'));
    console.log('GET request for guidance, inquiry ID:', inquiryId);
    
    if (isNaN(inquiryId)) {
      console.error('Invalid inquiryId in GET request:', url.searchParams.get('inquiryId'));
      return new Response(JSON.stringify({ error: 'Invalid inquiryId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const responses = await db
      .select()
      .from(aiResponses)
      .where(eq(aiResponses.inquiryId, inquiryId))
      .orderBy(aiResponses.createdAt, 'desc');
    
    console.log('Found responses:', responses.length);
    
    if (responses.length === 0) {
      console.log('No guidance found for inquiry ID:', inquiryId);
      return json({ exists: false });
    }
    
    console.log('Returning guidance for inquiry ID:', inquiryId);
    return json({
      exists: true,
      response: responses[0]
    });
  } catch (error) {
    console.error('Failed to get AI guidance:', error);
    return new Response(JSON.stringify({ error: 'Failed to get AI guidance' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE endpoint to remove saved AI guidance
export async function DELETE({ url }) {
  try {
    const inquiryId = parseInt(url.searchParams.get('inquiryId'));
    console.log('DELETE request for guidance, inquiry ID:', inquiryId);
    
    if (isNaN(inquiryId)) {
      console.error('Invalid inquiryId in DELETE request:', url.searchParams.get('inquiryId'));
      return new Response(JSON.stringify({ error: 'Invalid inquiryId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await db.delete(aiResponses).where(eq(aiResponses.inquiryId, inquiryId));
    console.log('Deleted guidance for inquiry ID:', inquiryId);
    
    return json({ success: true });
  } catch (error) {
    console.error('Failed to delete AI guidance:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete AI guidance' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
