import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, inquiries, aiResponses } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ request, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const userId = locals.user.id;
    
    // Begin transaction to delete all user data
    await db.transaction(async (tx) => {
      // Delete AI responses related to user's inquiries
      const userInquiries = await tx.select({ id: inquiries.id })
        .from(inquiries)
        .where(eq(inquiries.userId, userId));
      
      const inquiryIds = userInquiries.map(inquiry => inquiry.id);
      
      if (inquiryIds.length > 0) {
        // Delete AI responses related to user's inquiries
        await tx.delete(aiResponses)
          .where(
            inquiryIds.length === 1 
              ? eq(aiResponses.inquiryId, inquiryIds[0]) 
              : aiResponses.inquiryId.in(inquiryIds)
          );
      }
      
      // Delete user's inquiries
      await tx.delete(inquiries)
        .where(eq(inquiries.userId, userId));
      
      // Finally, delete the user
      await tx.delete(users)
        .where(eq(users.id, userId));
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return json({ error: 'Failed to delete account' }, { status: 500 });
  }
} 