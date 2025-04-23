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
      belief: inquiry.belief,
      isTrue: inquiry.isTrue,
      absolutelyTrue: inquiry.absolutelyTrue,
      reaction: inquiry.reaction,
      withoutThought: inquiry.withoutThought,
      turnaround1: inquiry.turnaround1,
      turnaround2: inquiry.turnaround2,
      turnaround3: inquiry.turnaround3
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to create inquiry:', error);
    return new Response(JSON.stringify({ error: 'Failed to create inquiry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
