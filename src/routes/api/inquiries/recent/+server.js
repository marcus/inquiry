import { db } from '$lib/server/db';
import { inquiries, aiResponses } from '$lib/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

/**
 * GET handler to fetch recent inquiries for the authenticated user
 */
export async function GET({ request, locals, url }) {
  // Ensure user is authenticated
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get limit parameter (default to 4)
  const limit = parseInt(url.searchParams.get('limit') || '4', 10);
  const includeAiResponses = url.searchParams.get('includeAiResponses') === 'true';
  
  try {
    // Fetch the most recent inquiries for this user
    let recentInquiries = await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.userId, locals.user.id))
      .orderBy(desc(inquiries.createdAt))
      .limit(limit);
    
    // If includeAiResponses is true, fetch AI responses for these inquiries
    if (includeAiResponses && recentInquiries.length > 0) {
      const inquiryIds = recentInquiries.map(inquiry => inquiry.id);
      
      // Create a map to store responses by inquiry ID
      const responsesByInquiryId = {};
      
      // Initialize empty arrays for each inquiry
      inquiryIds.forEach(id => {
        responsesByInquiryId[id] = [];
      });
      
      // If there's only one inquiry, use eq instead of inArray
      if (inquiryIds.length === 1) {
        const responses = await db
          .select()
          .from(aiResponses)
          .where(eq(aiResponses.inquiryId, inquiryIds[0]))
          .orderBy(desc(aiResponses.createdAt));
          
        responsesByInquiryId[inquiryIds[0]] = responses;
      } 
      // If there are multiple inquiries, process each one separately
      else if (inquiryIds.length > 1) {
        // Process each inquiry ID separately to avoid the "too many parameters" issue
        for (const inquiryId of inquiryIds) {
          const inquiryResponses = await db
            .select()
            .from(aiResponses)
            .where(eq(aiResponses.inquiryId, inquiryId))
            .orderBy(desc(aiResponses.createdAt));
            
          responsesByInquiryId[inquiryId] = inquiryResponses;
        }
      }
      
      // Add responses to the inquiries
      recentInquiries = recentInquiries.map(inquiry => ({
        ...inquiry,
        aiResponses: responsesByInquiryId[inquiry.id] || []
      }));
    }
    
    return json(recentInquiries);
  } catch (error) {
    console.error('Error fetching recent inquiries:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 