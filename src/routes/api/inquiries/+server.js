import { db } from '$lib/server/db';
import { inquiries } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';

export async function GET({ locals, url }) {
  try {
    // Get pagination parameters from URL
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const offset = (page - 1) * limit;

    // If user is authenticated, return only their inquiries
    if (locals.user) {
      // Get total count for pagination
      const totalCountResult = await db.select({ 
        count: sql`count(*)` 
      })
      .from(inquiries)
      .where(eq(inquiries.userId, locals.user.id));
      
      // Extract count value safely
      const totalCount = Number(totalCountResult[0]?.count || 0);
      const totalPages = Math.ceil(totalCount / limit);

      // Get paginated inquiries
      const userInquiries = await db.select()
        .from(inquiries)
        .where(eq(inquiries.userId, locals.user.id))
        .orderBy(inquiries.createdAt, 'desc')
        .limit(limit)
        .offset(offset);

      return json({
        inquiries: userInquiries,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      });
    } else {
      // For unauthenticated users, return empty array
      return json({
        inquiries: [],
        pagination: {
          page: 1,
          limit,
          totalCount: 0,
          totalPages: 0
        }
      });
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
