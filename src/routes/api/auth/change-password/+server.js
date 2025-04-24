import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, hashPassword } from '$lib/server/auth';

export async function POST({ request, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const { currentPassword, newPassword } = await request.json();
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return json({ error: 'Current password and new password are required' }, { status: 400 });
    }
    
    // Get user with password hash
    const result = await db.select().from(users).where(eq(users.id, locals.user.id));
    if (!result.length) {
      return json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = result[0];
    
    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return json({ error: 'Current password is incorrect' }, { status: 401 });
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    
    // Update password
    await db.update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, locals.user.id));
    
    return json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return json({ error: 'Failed to change password' }, { status: 500 });
  }
}
