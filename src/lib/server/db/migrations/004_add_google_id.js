/**
 * Migration to add Google ID column to the users table
 */

export const version = 4; // Use version 4 based on file naming

// Migration up function - applies the migration
export async function up(db, sqlite) {
  console.log('Running migration: Adding google_id column to users table');

  // Check if the column already exists
  const columnExists = sqlite.prepare(`
    PRAGMA table_info(users)
  `).all().some(col => col.name === 'google_id');
  
  if (!columnExists) {
    // Add googleId column to users table
    sqlite.prepare(`
      ALTER TABLE users ADD COLUMN google_id TEXT
    `).run();
    console.log('google_id column added successfully');
  } else {
    console.log('google_id column already exists, skipping addition');
  }
}

// Migration down function - cannot drop columns in SQLite
export async function down(db, sqlite) {
  console.log('Note: SQLite does not support dropping columns directly');
  console.log('This is a no-op migration rollback');
  
  // In SQLite, dropping a column would require:
  // 1. Creating a new table
  // 2. Copying data without the column
  // 3. Dropping the old table
  // 4. Renaming the new table
  
  // For simplicity, we're not implementing that here
  return true;
} 