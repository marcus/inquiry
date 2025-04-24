import { json } from '@sveltejs/kit';
import { TokenJS } from 'token.js';
import { db } from '$lib/server/db';
import { inquiries, aiResponses } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { aiConfig } from '$lib/config';

// POST endpoint to generate AI guidance
export async function POST({ request }) {
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
    
    // Format the inquiry text for the prompt
    const inquiryText = `# Inquiry

## Belief
${inquiry.belief}

## Is it true?
${inquiry.isTrue}

## Can I absolutely know it's true?
${inquiry.absolutelyTrue}

## How do I react when I believe that thought?
${inquiry.reaction}

## Who would I be without the thought?
${inquiry.withoutThought}

## Turnarounds
1. ${inquiry.turnaround1}
2. ${inquiry.turnaround2}
3. ${inquiry.turnaround3}`;

    // Create the prompt
    const prompt = `Act as a loving non-dual teacher in the tradition of Byron Katie, Michael Singer, Angelo Dilulo, Adyashanti and others. This message contains a completed self-inquiry done in the format that Byron Katie uses in her process of doing "The Work." Please provide a detailed response that gives guidance and insight on the inquiry. The guidance should be fully honest and not simply confirm beliefs that can still be seen through. Your ultimate value is truth and directness above all. Provide feedback on each section of the inquiry. Provide possible next beliefs to inquire into at the end of your response in a list with each topic on a new line (do not exclude the newline) under the heading titled exactly like this:

"Potential Next Beliefs:"
{{sample belief 1}}
{{sample belief 2}}


There should be no text after the above title. The response should end abruptly after the last possible next belief is listed.
Here is the inquiry text:
${inquiryText}`;

    console.log('Initializing TokenJS with OpenAI API key');
    const tokenjs = new TokenJS({
      openaiApiKey: env.OPENAI_API_KEY
    });

    // Use the Fetch API with streaming to process the response in chunks
    console.log('Setting up streaming response');
    const response = new Response(
      new ReadableStream({
        async start(controller) {
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
              
              // Encode and enqueue the chunk
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            
            console.log('Stream complete, saving response to database');
            // Save the completed response to the database
            await db.insert(aiResponses).values({
              inquiryId: inquiryId,
              content: completedResponse
            });
            
            console.log('Response saved, closing stream');
            controller.close();
          } catch (error) {
            console.error('Error in AI guidance generation:', error);
            controller.error(error);
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      }
    );
    
    return response;
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
