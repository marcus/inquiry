import { db } from '$lib/server/db';
import { inquiries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

// GET a single inquiry by ID
export async function GET({ params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid inquiry ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const result = await db.select().from(inquiries).where(eq(inquiries.id, id));
    if (!result.length) {
      return new Response(JSON.stringify({ error: 'Inquiry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return json(result[0]);
  } catch (error) {
    console.error('Failed to get inquiry:', error);
    return new Response(JSON.stringify({ error: 'Failed to get inquiry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

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

// PATCH: partial update to inquiry
export async function PATCH({ params, request }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid inquiry ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const updates = await request.json();
    await db.update(inquiries).set(updates).where(eq(inquiries.id, id));
    return json({ success: true });
  } catch (error) {
    console.error('Failed to update inquiry:', error);
    return new Response(JSON.stringify({ error: 'Failed to update inquiry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
