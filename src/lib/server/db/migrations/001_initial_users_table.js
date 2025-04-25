/**
 * Initial migration to create the users table
 */

// Migration up function - applies the migration
export async function up(db, sqlite) {
  console.log('Running migration: Creating users table');

  // Check if users table exists
  const tableExists = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='users'
  `).all();
  
  if (tableExists.length === 0) {
    // Create users table if it doesn't exist
    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `).run();
    console.log('Users table created successfully');
  } else {
    console.log('Users table already exists, skipping creation');
  }
}

// Migration down function - rolls back the migration
export async function down(db, sqlite) {
  console.log('Rolling back migration: Dropping users table');
  
  // Check if users table exists before attempting to drop
  const tableExists = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='users'
  `).all();
  
  if (tableExists.length > 0) {
    // Drop the users table
    sqlite.prepare('DROP TABLE users').run();
    console.log('Users table dropped successfully');
  } else {
    console.log('Users table does not exist, nothing to drop');
  }
} 