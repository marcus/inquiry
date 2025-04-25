import { db } from '../index.js';
import { addGuidanceCountColumn } from './add_guidance_count.js';

export async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Run migrations in sequence
    await addGuidanceCountColumn(db);
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}
