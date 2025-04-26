import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ request, locals }) {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    const { username, email } = await request.json();
    
    // Validate input
    if (!username || !email) {
      return json({ error: 'Username and email are required' }, { status: 400 });
    }
    
    // Get the current user
    const result = await db.select().from(users).where(eq(users.id, locals.user.id));
    if (!result.length) {
      return json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = result[0];
    
    // Check if this is a Google-authenticated user
    // If it is, only allow changing username, not email
    if (user.googleId && email !== user.email) {
      return json({ 
        error: 'Google-authenticated users cannot change their email address' 
      }, { status: 403 });
    }
    
    // Check if username is already taken (by another user)
    if (username !== user.username) {
      const existingUsername = await db.select()
        .from(users)
        .where(eq(users.username, username));
      
      if (existingUsername.length > 0) {
        return json({ error: 'Username is already taken' }, { status: 400 });
      }
    }
    
    // Check if email is already taken (by another user)
    if (email !== user.email) {
      const existingEmail = await db.select()
        .from(users)
        .where(eq(users.email, email));
      
      if (existingEmail.length > 0) {
        return json({ error: 'Email is already in use' }, { status: 400 });
      }
    }
    
    // Update the user profile
    await db.update(users)
      .set({ 
        username,
        // Only update email if it's different and not a Google user
        ...(email !== user.email && !user.googleId ? { email } : {})
      })
      .where(eq(users.id, locals.user.id));
    
    return json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    return json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 