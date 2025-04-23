import { db } from '$lib/server/db';
import { inquiries } from '$lib/server/db/schema';
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
    
    return {
      inquiry: inquiry[0]
    };
  } catch (err) {
    console.error('Error loading inquiry:', err);
    throw error(500, 'Error loading inquiry');
  }
}
