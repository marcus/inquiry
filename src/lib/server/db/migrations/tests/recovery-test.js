/**
 * Migration Recovery Test
 * 
 * This test verifies that the migration system can recover from
 * partially completed migrations and manage migration state correctly.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Migrator, MIGRATION_STATUS } from '../migrator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3';

// Test database path
const TEST_DB_PATH = 'db/recovery-test.db';

// Helper function to delete the test database if it exists
function deleteTestDb() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

// Test migration file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationPaths = [
  path.join(__dirname, '8001_initial_table.js'),
  path.join(__dirname, '8002_second_table.js'),
  path.join(__dirname, '8003_partial_migration.js')
];

// Helper function to create test migration files
function createTestMigrationFiles() {
  const migrationContents = [
    // 8001_initial_table.js
    `/**
 * Initial Table Migration (8001)
 */
export async function up(db, sqlite) {
  console.log('Creating initial table');
  sqlite.prepare(\`
    CREATE TABLE recovery_test_users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT
    )
  \`).run();
  
  // Insert some test data
  sqlite.prepare(\`
    INSERT INTO recovery_test_users (name, email)
    VALUES ('John Doe', 'john@example.com')
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back initial table');
  sqlite.prepare('DROP TABLE IF EXISTS recovery_test_users').run();
}`,
    
    // 8002_second_table.js
    `/**
 * Second Table Migration (8002)
 */
export async function up(db, sqlite) {
  console.log('Creating second table');
  sqlite.prepare(\`
    CREATE TABLE recovery_test_posts (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      FOREIGN KEY (user_id) REFERENCES recovery_test_users(id)
    )
  \`).run();
  
  // Insert test post
  sqlite.prepare(\`
    INSERT INTO recovery_test_posts (user_id, title, content)
    VALUES (1, 'First Post', 'This is the first post content')
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back second table');
  sqlite.prepare('DROP TABLE IF EXISTS recovery_test_posts').run();
}`,
    
    // 8003_partial_migration.js
    `/**
 * Partial Migration (8003) - This one creates multiple tables but the last one will be incomplete
 * if the migration is interrupted
 */
export async function up(db, sqlite) {
  console.log('Running partial migration (step 1)');
  
  // First table will be created
  sqlite.prepare(\`
    CREATE TABLE recovery_test_comments (
      id INTEGER PRIMARY KEY,
      post_id INTEGER,
      content TEXT,
      created_at TEXT,
      FOREIGN KEY (post_id) REFERENCES recovery_test_posts(id)
    )
  \`).run();
  
  // Insert a comment
  sqlite.prepare(\`
    INSERT INTO recovery_test_comments (post_id, content, created_at)
    VALUES (1, 'Great post!', '2023-01-01')
  \`).run();
  
  // Simulate a partial migration by including a check in the code
  // that will let us control whether this part runs or not
  if (db._allowComplete !== false) {
    console.log('Running partial migration (step 2)');
    
    // Second table will only be created if the migration completes
    sqlite.prepare(\`
      CREATE TABLE recovery_test_categories (
        id INTEGER PRIMARY KEY,
        name TEXT
      )
    \`).run();
    
    // Insert some categories
    sqlite.prepare(\`
      INSERT INTO recovery_test_categories (name)
      VALUES ('Technology')
    \`).run();
    
    sqlite.prepare(\`
      INSERT INTO recovery_test_categories (name)
      VALUES ('Science')
    \`).run();
  }
}

export async function down(db, sqlite) {
  console.log('Rolling back partial migration');
  sqlite.prepare('DROP TABLE IF EXISTS recovery_test_categories').run();
  sqlite.prepare('DROP TABLE IF EXISTS recovery_test_comments').run();
}`
  ];
  
  // Create each migration file
  for (let i = 0; i < migrationPaths.length; i++) {
    fs.writeFileSync(migrationPaths[i], migrationContents[i]);
  }
}

// Helper function to delete test migration files
function deleteTestMigrationFiles() {
  migrationPaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

// Helper function to check if a table exists in the database
async function tableExists(db, tableName) {
  const result = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='${tableName}'
  `).get();
  
  return !!result;
}

describe('Migration Recovery Test', () => {
  let migrator;
  
  beforeAll(() => {
    // Delete old test database
    deleteTestDb();
    
    // Create test migration files
    createTestMigrationFiles();
  });
  
  afterAll(() => {
    // Clean up
    if (migrator) {
      migrator.close();
    }
    deleteTestDb();
    deleteTestMigrationFiles();
  });
  
  it('should handle complete migrations correctly', async () => {
    // Create a fresh migrator instance
    migrator = new Migrator(TEST_DB_PATH);
    
    // Initialize migrations table
    await migrator.initialize();
    
    // Apply first two migrations
    const applyResult = await migrator.applyMigrationsToVersion(8002);
    expect(applyResult.applied).toBe(2);
    expect(applyResult.failed).toBe(0);
    
    // Check migration status
    const status = await migrator.getMigrationStatus();
    expect(status.applied.length).toBe(2);
    
    // Check that tables exist
    const db = migrator.getDatabase();
    expect(await tableExists(db, 'recovery_test_users')).toBe(true);
    expect(await tableExists(db, 'recovery_test_posts')).toBe(true);
    
    // Close the database
    migrator.close();
  });
  
  it('should handle partial migrations and recover properly', async () => {
    // Create a new migrator instance that will simulate an interrupted migration
    migrator = new Migrator(TEST_DB_PATH);
    
    // Add a flag to prevent the migration from completing fully
    migrator.getDatabase()._allowComplete = false;
    
    try {
      // Try to apply the third migration (which will be partial)
      await migrator.applyPendingMigrations();
    } catch (error) {
      // We expect this to fail or be incomplete
      console.log('Migration was interrupted as expected');
    }
    
    // Close the database connection to simulate a restart
    migrator.close();
    
    // Create a new migrator instance to simulate application restart
    migrator = new Migrator(TEST_DB_PATH);
    await migrator.initialize();
    
    // Check migration status after restart
    const statusAfterRestart = await migrator.getMigrationStatus();
    
    // Migration 8003 might be marked as applied but incomplete, or not applied at all
    // depending on how the migrator handles partial migrations
    
    const db = migrator.getDatabase();
    
    // The first table from migration 8003 should exist
    expect(await tableExists(db, 'recovery_test_comments')).toBe(true);
    
    // The second table from migration 8003 should not exist
    expect(await tableExists(db, 'recovery_test_categories')).toBe(false);
    
    // Now allow the migration to complete
    db._allowComplete = true;
    
    // Run recovery mode or pending migrations
    const recoveryResult = await migrator.applyPendingMigrations();
    
    // Check final status
    const finalStatus = await migrator.getMigrationStatus();
    expect(finalStatus.pending.length).toBe(0);
    
    // Now all tables should exist
    expect(await tableExists(db, 'recovery_test_users')).toBe(true);
    expect(await tableExists(db, 'recovery_test_posts')).toBe(true);
    expect(await tableExists(db, 'recovery_test_comments')).toBe(true);
    expect(await tableExists(db, 'recovery_test_categories')).toBe(true);
  });
  
  it('should roll back migrations in correct order after recovery', async () => {
    // Create a new migrator instance
    migrator = new Migrator(TEST_DB_PATH);
    
    // Roll back all migrations
    const rollbackResult = await migrator.rollbackAllMigrations();
    
    // Check that all 3 migrations were rolled back
    expect(rollbackResult.rolledBack).toBe(3);
    expect(rollbackResult.failed).toBe(0);
    
    // Check final status
    const finalStatus = await migrator.getMigrationStatus();
    
    // No active migrations should remain
    expect(finalStatus.applied.filter(m => m.isActive).length).toBe(0);
    
    // Check that all tables were removed
    const db = migrator.getDatabase();
    expect(await tableExists(db, 'recovery_test_users')).toBe(false);
    expect(await tableExists(db, 'recovery_test_posts')).toBe(false);
    expect(await tableExists(db, 'recovery_test_comments')).toBe(false);
    expect(await tableExists(db, 'recovery_test_categories')).toBe(false);
  });
}); 