/**
 * Migration Error Handling Test
 * 
 * This test verifies that the migration system properly handles errors
 * during migration operations and maintains database integrity.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Migrator, MIGRATION_STATUS } from '../migrator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3';

// Test database path
const TEST_DB_PATH = 'db/error-handling-test.db';

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
  path.join(__dirname, '9001_successful.js'),
  path.join(__dirname, '9002_error_up.js'),
  path.join(__dirname, '9003_error_down.js'),
  path.join(__dirname, '9004_last_migration.js')
];

// Helper function to create test migration files
function createTestMigrationFiles() {
  const migrationContents = [
    // 9001_successful.js
    `/**
 * Successful Migration (9001)
 */
export async function up(db, sqlite) {
  console.log('Creating first table in error handling test');
  sqlite.prepare(\`
    CREATE TABLE error_test_users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT
    )
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back first table in error handling test');
  sqlite.prepare('DROP TABLE IF EXISTS error_test_users').run();
}`,
    
    // 9002_error_up.js
    `/**
 * Error Up Migration (9002)
 * This migration will throw an error during the up operation
 */
export async function up(db, sqlite) {
  console.log('Starting error migration (up operation)');
  
  // First create a valid table
  sqlite.prepare(\`
    CREATE TABLE error_test_valid (
      id INTEGER PRIMARY KEY,
      name TEXT
    )
  \`).run();
  
  // Now throw an error to simulate a failed migration
  if (db._skipErrors !== true) {
    throw new Error('Simulated error during up migration');
  }
  
  // This should not execute if there's an error
  sqlite.prepare(\`
    CREATE TABLE error_test_should_not_exist (
      id INTEGER PRIMARY KEY,
      data TEXT
    )
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back error migration');
  sqlite.prepare('DROP TABLE IF EXISTS error_test_should_not_exist').run();
  sqlite.prepare('DROP TABLE IF EXISTS error_test_valid').run();
}`,
    
    // 9003_error_down.js
    `/**
 * Error Down Migration (9003)
 * This migration will work fine during up but throw an error during down
 */
export async function up(db, sqlite) {
  console.log('Creating table that will have rollback errors');
  sqlite.prepare(\`
    CREATE TABLE error_test_rollback_problem (
      id INTEGER PRIMARY KEY,
      name TEXT
    )
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Attempting to roll back table with simulated error');
  
  // First do something valid
  sqlite.prepare('DELETE FROM error_test_rollback_problem').run();
  
  // Then throw an error during rollback
  if (db._skipErrors !== true) {
    throw new Error('Simulated error during down migration');
  }
  
  // This should not execute if there's an error
  sqlite.prepare('DROP TABLE IF EXISTS error_test_rollback_problem').run();
}`,
    
    // 9004_last_migration.js
    `/**
 * Last Migration (9004)
 * This will only be applied if error handling works correctly
 */
export async function up(db, sqlite) {
  console.log('Creating last table in error handling test');
  sqlite.prepare(\`
    CREATE TABLE error_test_last (
      id INTEGER PRIMARY KEY,
      status TEXT
    )
  \`).run();
  
  // Insert a success record
  sqlite.prepare(\`
    INSERT INTO error_test_last (status)
    VALUES ('success')
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back last table in error handling test');
  sqlite.prepare('DROP TABLE IF EXISTS error_test_last').run();
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

describe('Migration Error Handling Test', () => {
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
  
  it('should handle errors during up migrations', async () => {
    // Create a fresh migrator instance
    migrator = new Migrator(TEST_DB_PATH);
    
    // Initialize migrations table
    await migrator.initialize();
    
    // Try to apply all migrations
    const applyResult = await migrator.applyAllMigrations();
    
    // We expect migration 9002 to fail, but 9001 should succeed
    expect(applyResult.applied).toBeGreaterThan(0);
    expect(applyResult.failed).toBeGreaterThan(0);
    
    // Check migration status
    const status = await migrator.getMigrationStatus();
    
    // The first migration should be applied
    const appliedVersions = status.applied.map(m => m.version);
    expect(appliedVersions).toContain('9001');
    
    // Check that tables exist/don't exist as expected
    const db = migrator.getDatabase();
    
    // Tables from successful migrations should exist
    expect(await tableExists(db, 'error_test_users')).toBe(true);
    
    // Tables from partially executed migrations might exist
    expect(await tableExists(db, 'error_test_valid')).toBe(true);
    
    // Tables that should not have been created due to errors
    expect(await tableExists(db, 'error_test_should_not_exist')).toBe(false);
    expect(await tableExists(db, 'error_test_rollback_problem')).toBe(false);
    expect(await tableExists(db, 'error_test_last')).toBe(false);
    
    // Close the database
    migrator.close();
  });
  
  it('should allow error skipping to complete migrations', async () => {
    // Create a new migrator instance with error skipping
    migrator = new Migrator(TEST_DB_PATH);
    
    // Set flag to skip errors
    migrator.getDatabase()._skipErrors = true;
    
    // Initialize
    await migrator.initialize();
    
    // Apply all migrations
    const applyResult = await migrator.applyAllMigrations();
    
    // All migrations should be applied when errors are skipped
    expect(applyResult.failed).toBe(0);
    
    // Check that all tables exist now
    const db = migrator.getDatabase();
    expect(await tableExists(db, 'error_test_users')).toBe(true);
    expect(await tableExists(db, 'error_test_valid')).toBe(true);
    expect(await tableExists(db, 'error_test_should_not_exist')).toBe(true);
    expect(await tableExists(db, 'error_test_rollback_problem')).toBe(true);
    expect(await tableExists(db, 'error_test_last')).toBe(true);
    
    // Check migration status
    const status = await migrator.getMigrationStatus();
    
    // All versions should be applied
    const appliedVersions = status.applied.map(m => m.version);
    expect(appliedVersions).toContain('9001');
    expect(appliedVersions).toContain('9002');
    expect(appliedVersions).toContain('9003');
    expect(appliedVersions).toContain('9004');
    
    // Close the database
    migrator.close();
  });
  
  it('should handle errors during down migrations', async () => {
    // Create a new migrator instance
    migrator = new Migrator(TEST_DB_PATH);
    
    // Turn off error skipping for this test
    migrator.getDatabase()._skipErrors = false;
    
    // Initialize
    await migrator.initialize();
    
    // Attempt to roll back to version 9001
    const rollbackResult = await migrator.rollbackMigrationsToVersion('9001');
    
    // We expect some rollbacks to fail
    expect(rollbackResult.rolledBack).toBeGreaterThan(0);
    expect(rollbackResult.failed).toBeGreaterThan(0);
    
    // Check database state
    const db = migrator.getDatabase();
    
    // The first migration should still be applied
    expect(await tableExists(db, 'error_test_users')).toBe(true);
    
    // The table with rollback issues should still exist since down failed
    expect(await tableExists(db, 'error_test_rollback_problem')).toBe(true);
    
    // The last table should have been rolled back
    expect(await tableExists(db, 'error_test_last')).toBe(false);
    
    // Close this database
    migrator.close();
  });
  
  it('should allow complete rollback with error skipping', async () => {
    // Create a new migrator instance with error skipping
    migrator = new Migrator(TEST_DB_PATH);
    
    // Set flag to skip errors
    migrator.getDatabase()._skipErrors = true;
    
    // Initialize
    await migrator.initialize();
    
    // Roll back all migrations
    const rollbackResult = await migrator.rollbackAllMigrations();
    
    // No rollbacks should fail
    expect(rollbackResult.failed).toBe(0);
    
    // Check database state - no tables should exist
    const db = migrator.getDatabase();
    expect(await tableExists(db, 'error_test_users')).toBe(false);
    expect(await tableExists(db, 'error_test_valid')).toBe(false);
    expect(await tableExists(db, 'error_test_should_not_exist')).toBe(false);
    expect(await tableExists(db, 'error_test_rollback_problem')).toBe(false);
    expect(await tableExists(db, 'error_test_last')).toBe(false);
    
    // Check migration status
    const status = await migrator.getMigrationStatus();
    
    // No active migrations should remain
    expect(status.applied.filter(m => m.isActive).length).toBe(0);
  });
}); 