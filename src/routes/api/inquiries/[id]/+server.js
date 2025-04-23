import { db } from '$lib/server/db';
import { inquiries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function DELETE({ params }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid inquiry ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await db.delete(inquiries).where(eq(inquiries.id, id));
    
    return json({ success: true });
  } catch (error) {
    console.error('Failed to delete inquiry:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete inquiry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
