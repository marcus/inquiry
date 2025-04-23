import { db } from '$lib/server/db';
import { inquiries } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    const allInquiries = await db.select().from(inquiries).orderBy(inquiries.createdAt, 'desc');
    return json(allInquiries);
  } catch (error) {
    console.error('Failed to get inquiries:', error);
    return new Response(JSON.stringify({ error: 'Failed to get inquiries' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  try {
    const inquiry = await request.json();
    const result = await db.insert(inquiries).values({
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
