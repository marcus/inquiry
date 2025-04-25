/**
 * Version Ordering Test
 * 
 * This test verifies that the migration system correctly handles
 * version ordering when applying and rolling back migrations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Migrator, MIGRATION_STATUS } from '../migrator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3';

// Test database path
const TEST_DB_PATH = 'db/version-ordering-test.db';

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
  path.join(__dirname, '7001_first_migration.js'),
  path.join(__dirname, '7003_third_migration.js'),
  path.join(__dirname, '7002_second_migration.js'),
  path.join(__dirname, '7005_fifth_migration.js'),
  path.join(__dirname, '7004_fourth_migration.js')
];

// Helper function to create test migration files with different version numbers
function createTestMigrationFiles() {
  const migrationContents = [
    // 7001_first_migration.js
    `/**
 * First Migration (7001)
 */
export async function up(db, sqlite) {
  console.log('Running first migration (7001)');
  sqlite.prepare(\`
    CREATE TABLE table_7001 (
      id INTEGER PRIMARY KEY,
      value TEXT
    )
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back first migration (7001)');
  sqlite.prepare('DROP TABLE IF EXISTS table_7001').run();
}`,
    
    // 7003_third_migration.js
    `/**
 * Third Migration (7003)
 */
export async function up(db, sqlite) {
  console.log('Running third migration (7003)');
  sqlite.prepare(\`
    CREATE TABLE table_7003 (
      id INTEGER PRIMARY KEY,
      value TEXT
    )
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back third migration (7003)');
  sqlite.prepare('DROP TABLE IF EXISTS table_7003').run();
}`,
    
    // 7002_second_migration.js
    `/**
 * Second Migration (7002)
 */
export async function up(db, sqlite) {
  console.log('Running second migration (7002)');
  sqlite.prepare(\`
    CREATE TABLE table_7002 (
      id INTEGER PRIMARY KEY,
      value TEXT
    )
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back second migration (7002)');
  sqlite.prepare('DROP TABLE IF EXISTS table_7002').run();
}`,
    
    // 7005_fifth_migration.js
    `/**
 * Fifth Migration (7005)
 */
export async function up(db, sqlite) {
  console.log('Running fifth migration (7005)');
  sqlite.prepare(\`
    CREATE TABLE table_7005 (
      id INTEGER PRIMARY KEY,
      value TEXT
    )
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back fifth migration (7005)');
  sqlite.prepare('DROP TABLE IF EXISTS table_7005').run();
}`,
    
    // 7004_fourth_migration.js
    `/**
 * Fourth Migration (7004)
 */
export async function up(db, sqlite) {
  console.log('Running fourth migration (7004)');
  sqlite.prepare(\`
    CREATE TABLE table_7004 (
      id INTEGER PRIMARY KEY,
      value TEXT
    )
  \`).run();
}

export async function down(db, sqlite) {
  console.log('Rolling back fourth migration (7004)');
  sqlite.prepare('DROP TABLE IF EXISTS table_7004').run();
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
  try {
    const result = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='${tableName}'
    `).get();
    
    return !!result;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

describe('Version Ordering Test', () => {
  let migrator;
  
  beforeEach(() => {
    // Delete old test database
    deleteTestDb();
    
    // Create test migration files
    createTestMigrationFiles();
    
    // Create a fresh migrator instance
    migrator = new Migrator(TEST_DB_PATH);
  });
  
  afterEach(() => {
    // Clean up
    if (migrator) {
      migrator.close();
    }
    deleteTestDb();
    deleteTestMigrationFiles();
  });
  
  it('should apply migrations in version order despite file creation order', async () => {
    // Initialize migrations table
    await migrator.initialize();
    
    // Apply all migrations
    const applyResult = await migrator.applyPendingMigrations();
    
    // All 5 migrations should be applied
    expect(applyResult.applied).toBe(5);
    expect(applyResult.failed).toBe(0);
    
    // Check migration status
    const status = await migrator.getMigrationStatus();
    
    // All 5 migrations should be in the applied list
    expect(status.applied.length).toBe(5);
    
    // Verify that migrations were applied in version order
    const appliedVersions = status.applied.map(m => m.version);
    expect(appliedVersions).toEqual([7001, 7002, 7003, 7004, 7005]);
    
    // Verify that all tables exist
    const db = migrator.getDatabase();
    const tables = ['table_7001', 'table_7002', 'table_7003', 'table_7004', 'table_7005'];
    
    for (const table of tables) {
      const exists = await tableExists(db, table);
      expect(exists).toBe(true);
    }
  });
  
  it('should roll back migrations in reverse version order', async () => {
    // Roll back to version 7002 (keeping 7001 and 7002)
    const rollbackResult = await migrator.rollbackToVersion(7002);
    
    // 3 migrations should be rolled back
    expect(rollbackResult.rolledBack).toBe(3);
    expect(rollbackResult.failed).toBe(0);
    
    // Check migration status
    const status = await migrator.getMigrationStatus();
    
    // 2 active and 3 inactive migrations
    const activeVersions = status.applied.filter(m => m.isActive).map(m => m.version);
    expect(activeVersions).toEqual([7001, 7002]);
    
    const inactiveVersions = status.applied.filter(m => !m.isActive).map(m => m.version);
    expect(inactiveVersions).toEqual([7003, 7004, 7005]);
    
    // Verify that tables 7001 and 7002 still exist
    const db = migrator.getDatabase();
    
    expect(await tableExists(db, 'table_7001')).toBe(true);
    expect(await tableExists(db, 'table_7002')).toBe(true);
    
    // Verify that tables 7003, 7004, and 7005 don't exist anymore
    expect(await tableExists(db, 'table_7003')).toBe(false);
    expect(await tableExists(db, 'table_7004')).toBe(false);
    expect(await tableExists(db, 'table_7005')).toBe(false);
  });
  
  it('should reapply rolled back migrations in correct version order', async () => {
    // Reapply all pending migrations
    const reapplyResult = await migrator.applyPendingMigrations();
    
    // 3 migrations should be reapplied
    expect(reapplyResult.applied).toBe(3);
    expect(reapplyResult.failed).toBe(0);
    
    // Check final migration status
    const finalStatus = await migrator.getMigrationStatus();
    
    // All 5 migrations should be active again
    expect(finalStatus.applied.length).toBe(5);
    expect(finalStatus.applied.every(m => m.isActive)).toBe(true);
    
    // Verify that all tables exist again
    const db = migrator.getDatabase();
    const tables = ['table_7001', 'table_7002', 'table_7003', 'table_7004', 'table_7005'];
    
    for (const table of tables) {
      const exists = await tableExists(db, table);
      expect(exists).toBe(true);
    }
    
    // Verify that versions are in correct order
    const appliedVersions = finalStatus.applied.map(m => m.version);
    expect(appliedVersions).toEqual([7001, 7002, 7003, 7004, 7005]);
  });
}); 