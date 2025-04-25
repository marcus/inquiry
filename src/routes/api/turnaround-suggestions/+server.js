import { json } from '@sveltejs/kit';
import { TokenJS } from 'token.js';
import { env } from '$env/dynamic/private';
import { turnaroundAiConfig } from '$lib/config';

// POST endpoint to generate turnaround suggestions
export async function POST({ request }) {
  try {
    console.log('Turnaround suggestions POST request received');
    const { belief, isTrue, absolutelyTrue, reaction, withoutThought } = await request.json();
    
    if (!belief) {
      console.error('Missing belief in request');
      return new Response(JSON.stringify({ error: 'Missing belief' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing turnaround suggestions for belief:', belief);

    // Format the inquiry text for the prompt
    const inquiryText = `# Inquiry

## Belief
${belief}

## Is it true?
${isTrue || 'Not provided'}

## Can I absolutely know it's true?
${absolutelyTrue || 'Not provided'}

## How do I react when I believe that thought?
${reaction || 'Not provided'}

## Who would I be without the thought?
${withoutThought || 'Not provided'}`;

    // Create the prompt focused specifically on turnarounds
    const prompt = `Act as a facilitator for Byron Katie's "The Work" method of inquiry. Based on the following inquiry, please suggest ONLY three possible turnarounds for the belief. Do not provide any additional commentary, explanation, or introduction. Just provide the three turnarounds in this exact format:

Turnaround 1: [first turnaround]
Turnaround 2: [second turnaround]
Turnaround 3: [third turnaround]

Here is the inquiry:
${inquiryText}`;

    console.log('Initializing TokenJS with OpenAI API key');
    const tokenjs = new TokenJS({
      openaiApiKey: env.OPENAI_API_KEY
    });

    // Create a new TransformStream for better streaming control
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Start processing in the background
    (async () => {
      try {
        console.log('Calling OpenAI API with model:', turnaroundAiConfig.model);
        const result = await tokenjs.chat.completions.create({
          stream: true,
          provider: turnaroundAiConfig.provider,
          model: turnaroundAiConfig.model,
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
          
          // Encode and send the chunk immediately
          if (content) {
            await writer.write(new TextEncoder().encode(content));
            // Flush after each chunk to ensure immediate delivery
            await writer.ready;
          }
        }
        
        console.log('Stream complete, closing stream');
        await writer.close();
      } catch (error) {
        console.error('Error in turnaround suggestions generation:', error);
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
    console.error('Error in turnaround suggestions endpoint:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate turnaround suggestions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
