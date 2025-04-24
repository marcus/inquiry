import { db } from '$lib/server/db';
import { inquiries } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

// GET a single inquiry by ID
export async function GET({ params, locals }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid inquiry ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Build query
    let query = eq(inquiries.id, id);
    
    // If user is authenticated, only allow access to their own inquiries
    if (locals.user) {
      query = and(query, eq(inquiries.userId, locals.user.id));
    } else {
      // For anonymous inquiries, only allow access if userId is null
      query = and(query, eq(inquiries.userId, null));
    }
    
    const result = await db.select().from(inquiries).where(query);
    
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

export async function DELETE({ params, locals }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid inquiry ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Only allow users to delete their own inquiries
    let query = eq(inquiries.id, id);
    
    if (locals.user) {
      query = and(query, eq(inquiries.userId, locals.user.id));
    } else {
      // For anonymous inquiries, only allow deletion if userId is null
      query = and(query, eq(inquiries.userId, null));
    }
    
    await db.delete(inquiries).where(query);
    
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
export async function PATCH({ params, request, locals }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid inquiry ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Only allow users to update their own inquiries
    let query = eq(inquiries.id, id);
    
    if (locals.user) {
      query = and(query, eq(inquiries.userId, locals.user.id));
    } else {
      // For anonymous inquiries, only allow updates if userId is null
      query = and(query, eq(inquiries.userId, null));
    }
    
    const updates = await request.json();
    await db.update(inquiries).set(updates).where(query);
    return json({ success: true });
  } catch (error) {
    console.error('Failed to update inquiry:', error);
    return new Response(JSON.stringify({ error: 'Failed to update inquiry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
