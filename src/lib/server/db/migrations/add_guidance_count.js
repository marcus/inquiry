import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

export async function addGuidanceCountColumn(db) {
  console.log('Running migration: Adding guidance_count column to aiResponses table');
  
  try {
    // Create a direct connection to the SQLite database
    const sqlite = new Database(env.DATABASE_URL);
    
    // Check if the column already exists
    const tableInfo = sqlite.prepare("PRAGMA table_info(ai_responses)").all();
    const columnExists = tableInfo.some(column => column.name === 'guidance_count');
    
    if (!columnExists) {
      // Add the guidance_count column with a default value of 1 for existing records
      sqlite.prepare("ALTER TABLE ai_responses ADD COLUMN guidance_count INTEGER DEFAULT 1 NOT NULL").run();
      console.log('Successfully added guidance_count column to aiResponses table');
    } else {
      console.log('guidance_count column already exists in aiResponses table');
    }
    
    // Close the database connection
    sqlite.close();
  } catch (error) {
    console.error('Error adding guidance_count column:', error);
    throw error;
  }
}
