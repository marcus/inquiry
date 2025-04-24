import { db } from '$lib/server/db';
import { inquiries, aiResponses } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      throw error(400, 'Invalid inquiry ID');
    }
    
    const inquiry = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
    
    if (inquiry.length === 0) {
      throw error(404, 'Inquiry not found');
    }
    
    // Also fetch any AI guidance for this inquiry
    const guidance = await db
      .select()
      .from(aiResponses)
      .where(eq(aiResponses.inquiryId, id))
      .orderBy(aiResponses.createdAt, 'desc')
      .limit(1);
    
    console.log('Server load: Found guidance for inquiry', id, guidance.length > 0);
    
    return {
      inquiry: inquiry[0],
      aiGuidance: guidance.length > 0 ? guidance[0] : null
    };
  } catch (err) {
    console.error('Error loading inquiry:', err);
    throw error(500, 'Error loading inquiry');
  }
}
