/**
 * Migration to add the guidance_count column to ai_responses table
 */

// Migration up function - applies the migration
export async function up(db, sqlite) {
  console.log('Running migration: Adding guidance_count column to ai_responses table');
  
  // Check if the ai_responses table exists
  const tableExists = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='ai_responses'
  `).all();
  
  if (tableExists.length === 0) {
    console.log('ai_responses table does not exist yet, creating it');
    
    // Create the ai_responses table with the guidance_count column
    sqlite.prepare(`
      CREATE TABLE ai_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inquiry_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        guidance_count INTEGER DEFAULT 1 NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `).run();
    
    console.log('ai_responses table created successfully with guidance_count column');
  } else {
    // Check if the column already exists
    const tableInfo = sqlite.prepare("PRAGMA table_info(ai_responses)").all();
    const columnExists = tableInfo.some(column => column.name === 'guidance_count');
    
    if (!columnExists) {
      // Add the guidance_count column with a default value of 1 for existing records
      sqlite.prepare("ALTER TABLE ai_responses ADD COLUMN guidance_count INTEGER DEFAULT 1 NOT NULL").run();
      console.log('Successfully added guidance_count column to ai_responses table');
    } else {
      console.log('guidance_count column already exists in ai_responses table, skipping');
    }
  }
}

// Migration down function - rolls back the migration
export async function down(db, sqlite) {
  console.log('Rolling back migration: Removing guidance_count column (creating new table without the column)');
  
  // Check if ai_responses table exists
  const tableExists = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='ai_responses'
  `).all();
  
  if (tableExists.length > 0) {
    // SQLite doesn't support dropping columns directly, so we need to:
    // 1. Create a new table without the column
    // 2. Copy data from the old table
    // 3. Drop the old table
    // 4. Rename the new table
    
    // Create a new table without the guidance_count column
    sqlite.prepare(`
      CREATE TABLE ai_responses_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inquiry_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `).run();
    
    // Copy data from the old table, excluding the guidance_count column
    sqlite.prepare(`
      INSERT INTO ai_responses_new (id, inquiry_id, content, created_at)
      SELECT id, inquiry_id, content, created_at FROM ai_responses
    `).run();
    
    // Drop the old table
    sqlite.prepare('DROP TABLE ai_responses').run();
    
    // Rename the new table
    sqlite.prepare('ALTER TABLE ai_responses_new RENAME TO ai_responses').run();
    
    console.log('Successfully removed guidance_count column from ai_responses table');
  } else {
    console.log('ai_responses table does not exist, nothing to roll back');
  }
} 