/**
 * Migration: test_migration
 * Version: 3
 */

// Migration up function - applies the migration
export async function up(db, sqlite) {
  console.log('Running migration: test_migration');
  
  // Create a test table
  sqlite.prepare(`
    CREATE TABLE test_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `).run();
  
  console.log('Created test_table successfully');
}

// Migration down function - rolls back the migration
export async function down(db, sqlite) {
  console.log('Rolling back migration: test_migration');
  
  // Drop the test table
  sqlite.prepare('DROP TABLE IF EXISTS test_table').run();
  
  console.log('Dropped test_table successfully');
}
