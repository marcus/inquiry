import { db } from '$lib/server/db';
import { inquiries } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function GET({ locals }) {
  try {
    // If user is authenticated, return only their inquiries
    if (locals.user) {
      const userInquiries = await db.select()
        .from(inquiries)
        .where(eq(inquiries.userId, locals.user.id))
        .orderBy(inquiries.createdAt, 'desc');
      return json(userInquiries);
    } else {
      // For unauthenticated users, return empty array
      return json([]);
    }
  } catch (error) {
    console.error('Failed to get inquiries:', error);
    return new Response(JSON.stringify({ error: 'Failed to get inquiries' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request, locals }) {
  try {
    // Require authentication to create inquiries
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Authentication required to create inquiries' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const inquiry = await request.json();
    const result = await db.insert(inquiries).values({
      userId: locals.user.id, // Associate with authenticated user
      belief: inquiry.belief || '',
      isTrue: inquiry.isTrue || null,
      absolutelyTrue: inquiry.absolutelyTrue || null,
      reaction: inquiry.reaction || null,
      withoutThought: inquiry.withoutThought || null,
      turnaround1: inquiry.turnaround1 || null,
      turnaround2: inquiry.turnaround2 || null,
      turnaround3: inquiry.turnaround3 || null
    }).returning({ id: inquiries.id });

    return json({ id: result[0].id, success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to create inquiry:', error);
    return new Response(JSON.stringify({ error: 'Failed to create inquiry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
