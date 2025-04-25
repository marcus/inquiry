/**
 * Transaction Handling Test
 * 
 * This test verifies that the migration system correctly handles transactions,
 * especially during rollbacks when a transaction might already be active.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Migrator, MIGRATION_STATUS } from '../migrator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3';

// Test database path
const TEST_DB_PATH = 'db/transaction-test.db';

// Helper function to delete the test database if it exists
function deleteTestDb() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

// Test migration file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testMigration1Path = path.join(__dirname, '8001_transaction_test_1.js');
const testMigration2Path = path.join(__dirname, '8002_transaction_test_2.js');

// Helper function to create test migration files
function createTestMigrationFiles() {
  // First migration - creates a table
  const content1 = `/**
 * Transaction Test Migration 1
 * Version: 8001
 */

// Migration up function - applies the migration
export async function up(db, sqlite) {
  console.log('Running transaction test migration 1');
  
  // Start a transaction
  db.exec('BEGIN TRANSACTION');
  
  try {
    // Create a test table
    sqlite.prepare(\`
      CREATE TABLE transaction_test_table_1 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )
    \`).run();
    
    // Insert some data
    sqlite.prepare(\`
      INSERT INTO transaction_test_table_1 (name) VALUES (?)
    \`).run('Test data');
    
    // Commit transaction
    db.exec('COMMIT');
    console.log('Created transaction_test_table_1 successfully');
  } catch (error) {
    // Rollback transaction on error
    db.exec('ROLLBACK');
    throw error;
  }
}

// Migration down function - rolls back the migration
export async function down(db, sqlite) {
  console.log('Rolling back transaction test migration 1');
  
  // Check if we're already in a transaction
  let isTransactionActive = false;
  try {
    // If this succeeds, we're not in a transaction
    sqlite.prepare("SELECT 1 FROM sqlite_master LIMIT 0").run();
    
    // Start a transaction since one isn't active
    db.exec('BEGIN TRANSACTION');
    isTransactionActive = true;
  } catch (error) {
    // If an error occurred, we're already in a transaction
    console.log('Already in a transaction, continuing without starting a new one');
  }
  
  try {
    // Drop the test table
    sqlite.prepare('DROP TABLE IF EXISTS transaction_test_table_1').run();
    
    // Commit transaction if we started one
    if (isTransactionActive) {
      db.exec('COMMIT');
    }
    console.log('Dropped transaction_test_table_1 successfully');
  } catch (error) {
    // Rollback transaction if we started one
    if (isTransactionActive) {
      db.exec('ROLLBACK');
    }
    throw error;
  }
}`;

  // Second migration - creates another table
  const content2 = `/**
 * Transaction Test Migration 2
 * Version: 8002
 */

// Migration up function - applies the migration
export async function up(db, sqlite) {
  console.log('Running transaction test migration 2');
  
  // Start a transaction
  db.exec('BEGIN TRANSACTION');
  
  try {
    // Create a test table
    sqlite.prepare(\`
      CREATE TABLE transaction_test_table_2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )
    \`).run();
    
    // Insert some data
    sqlite.prepare(\`
      INSERT INTO transaction_test_table_2 (value) VALUES (?)
    \`).run(42);
    
    // Commit transaction
    db.exec('COMMIT');
    console.log('Created transaction_test_table_2 successfully');
  } catch (error) {
    // Rollback transaction on error
    db.exec('ROLLBACK');
    throw error;
  }
}

// Migration down function - rolls back the migration
export async function down(db, sqlite) {
  console.log('Rolling back transaction test migration 2');
  
  // Check if we're already in a transaction
  let isTransactionActive = false;
  try {
    // If this succeeds, we're not in a transaction
    sqlite.prepare("SELECT 1 FROM sqlite_master LIMIT 0").run();
    
    // Start a transaction since one isn't active
    db.exec('BEGIN TRANSACTION');
    isTransactionActive = true;
  } catch (error) {
    // If an error occurred, we're already in a transaction
    console.log('Already in a transaction, continuing without starting a new one');
  }
  
  try {
    // Drop the test table
    sqlite.prepare('DROP TABLE IF EXISTS transaction_test_table_2').run();
    
    // Commit transaction if we started one
    if (isTransactionActive) {
      db.exec('COMMIT');
    }
    console.log('Dropped transaction_test_table_2 successfully');
  } catch (error) {
    // Rollback transaction if we started one
    if (isTransactionActive) {
      db.exec('ROLLBACK');
    }
    throw error;
  }
}`;

  fs.writeFileSync(testMigration1Path, content1);
  fs.writeFileSync(testMigration2Path, content2);
}

// Helper function to delete test migration files
function deleteTestMigrationFiles() {
  if (fs.existsSync(testMigration1Path)) {
    fs.unlinkSync(testMigration1Path);
  }
  if (fs.existsSync(testMigration2Path)) {
    fs.unlinkSync(testMigration2Path);
  }
}

describe('Transaction Handling Test', () => {
  let migrator;
  
  beforeAll(() => {
    // Delete old test database
    deleteTestDb();
    
    // Create test migration files
    createTestMigrationFiles();
    
    // Create a fresh migrator instance
    migrator = new Migrator(TEST_DB_PATH);
  });
  
  afterAll(() => {
    // Clean up
    if (migrator) {
      migrator.close();
    }
    deleteTestDb();
    deleteTestMigrationFiles();
  });
  
  it('should handle transactions during rollback correctly', async () => {
    // Initialize migrations table
    await migrator.initialize();
    
    // Apply the test migrations
    const applyResult = await migrator.applyPendingMigrations();
    
    // Verify both migrations were applied
    expect(applyResult.applied).toBe(2);
    expect(applyResult.failed).toBe(0);
    
    // Check migration status
    const statusBeforeRollback = await migrator.getMigrationStatus();
    expect(statusBeforeRollback.applied.length).toBe(2);
    expect(statusBeforeRollback.pending.length).toBe(0);
    
    // Rollback to version 8001 (first migration)
    const rollbackResult = await migrator.rollbackToVersion(8001);
    
    // Verify rollback worked as expected
    expect(rollbackResult.rolledBack).toBe(1); // Should have rolled back one migration
    expect(rollbackResult.failed).toBe(0);     // With no failures
    
    // Check migration status after rollback
    const statusAfterRollback = await migrator.getMigrationStatus();
    
    // Should have 2 applied migrations, but one is inactive (rolled back)
    expect(statusAfterRollback.applied.length).toBe(2);
    expect(statusAfterRollback.applied.filter(m => m.isActive).length).toBe(1);
    expect(statusAfterRollback.applied.filter(m => !m.isActive).length).toBe(1);
    
    // Verify the active migration has the correct version
    const activeMigration = statusAfterRollback.applied.find(m => m.isActive);
    expect(activeMigration.version).toBe(8001);
    
    // Reapply the rolled back migration
    const reapplyResult = await migrator.applyPendingMigrations();
    
    // Verify reapplication worked
    expect(reapplyResult.applied).toBe(1);
    expect(reapplyResult.failed).toBe(0);
    
    // Final migration status check
    const finalStatus = await migrator.getMigrationStatus();
    expect(finalStatus.applied.length).toBe(2);
    expect(finalStatus.applied.filter(m => m.isActive).length).toBe(2);
    expect(finalStatus.pending.length).toBe(0);
  });
}); 