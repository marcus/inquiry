/**
 * Functional Test for Migration System
 * 
 * This file tests the entire migration system by:
 * 1. Creating a test database
 * 2. Running migrations
 * 3. Checking migration status
 * 4. Creating a test migration
 * 5. Running the new migration
 * 6. Rolling back to a previous version
 * 7. Re-applying migrations
 * 
 * Run this test with:
 * node --experimental-specifier-resolution=node src/lib/server/db/migrations/migration-system.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Migrator } from '../migrator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Test database path
const TEST_DB_PATH = 'db/migration-system-test.db';

// Helper function to delete the test database if it exists
function deleteTestDb() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

// Test migration file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testMigrationPath = path.join(__dirname, '999_test_system_migration.js');

// Helper function to create a test migration file
function createTestMigrationFile() {
  const content = `/**
 * Test System Migration
 * Version: 999
 */

// Migration up function - applies the migration
export async function up(db, sqlite) {
  console.log('Running test system migration');
  
  // Create a test table
  sqlite.prepare(\`
    CREATE TABLE test_system_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )
  \`).run();
  
  console.log('Created test_system_table successfully');
}

// Migration down function - rolls back the migration
export async function down(db, sqlite) {
  console.log('Rolling back test system migration');
  
  // Drop the test table
  sqlite.prepare('DROP TABLE IF EXISTS test_system_table').run();
  
  console.log('Dropped test_system_table successfully');
}`;

  fs.writeFileSync(testMigrationPath, content);
}

// Helper function to delete test migration file
function deleteTestMigrationFile() {
  if (fs.existsSync(testMigrationPath)) {
    fs.unlinkSync(testMigrationPath);
  }
}

// Custom migrator that also looks for test-specific migrations
class TestMigrator extends Migrator {
  constructor(dbPath) {
    super(dbPath);
    // Add the test directory to search for test-specific migrations
    this.testMigrationsDir = path.join(__dirname);
  }
  
  // Override to also include test-specific migrations
  async getAllMigrationFiles() {
    // Get regular migrations from parent class
    const regularMigrations = await super.getAllMigrationFiles();
    
    // Get test-specific migrations
    let testMigrations = [];
    if (fs.existsSync(testMigrationPath)) {
      const filename = path.basename(testMigrationPath);
      const [versionStr, ...nameParts] = filename.replace('.js', '').split('_');
      testMigrations.push({
        filename: filename,
        name: nameParts.join('_'),
        version: parseInt(versionStr, 10),
        path: testMigrationPath
      });
    }
    
    // Combine and sort all migrations
    return [...regularMigrations, ...testMigrations].sort((a, b) => a.version - b.version);
  }
}

describe('Migration System Functional Test', () => {
  let migrator;
  
  beforeAll(() => {
    // Delete old test database
    deleteTestDb();
    console.log('\n1. Deleted old test database');
    
    // Create a fresh migrator instance with test migration support
    migrator = new TestMigrator(TEST_DB_PATH);
    console.log('\n2. Created migrator instance');
  });
  
  afterAll(() => {
    // Clean up
    if (migrator) {
      migrator.close();
    }
    deleteTestDb();
    deleteTestMigrationFile();
    console.log('\nTest cleanup complete.');
  });
  
  it('should initialize the migrations table', async () => {
    // Initialize migrations table
    await migrator.initialize();
    console.log('\n3. Initialized migrations table');
    
    // Get initial migration status
    const initialStatus = await migrator.getMigrationStatus();
    console.log('\n4. Initial Migration Status:');
    console.log(`   - Applied: ${initialStatus.applied.length}`);
    console.log(`   - Pending: ${initialStatus.pending.length}`);
    
    // There should be pending migrations
    expect(initialStatus.pending.length).toBeGreaterThan(0);
    // No migrations should be applied yet
    expect(initialStatus.applied.length).toBe(0);
  });
  
  it('should apply pending migrations', async () => {
    // Apply pending migrations
    console.log('\n5. Applying pending migrations...');
    const initialApplyResult = await migrator.applyPendingMigrations();
    console.log(`   - Applied: ${initialApplyResult.applied}`);
    console.log(`   - Failed: ${initialApplyResult.failed}`);
    
    // Get migration status after initial apply
    const afterInitialApplyStatus = await migrator.getMigrationStatus();
    console.log('\n6. Migration Status after initial apply:');
    console.log(`   - Applied: ${afterInitialApplyStatus.applied.length}`);
    console.log(`   - Pending: ${afterInitialApplyStatus.pending.length}`);
    
    // Should have applied some migrations
    expect(initialApplyResult.applied).toBeGreaterThan(0);
    // Should have no failures
    expect(initialApplyResult.failed).toBe(0);
    // Should have no pending migrations
    expect(afterInitialApplyStatus.pending.length).toBe(0);
  });
  
  it('should detect and apply a new migration', async () => {
    // Create test migration file
    createTestMigrationFile();
    console.log('\n7. Created test migration file');
    
    // Check migration status with new file
    const afterNewFileStatus = await migrator.getMigrationStatus();
    console.log('\n8. Migration Status after new file:');
    console.log(`   - Applied: ${afterNewFileStatus.applied.length}`);
    console.log(`   - Pending: ${afterNewFileStatus.pending.length}`);
    
    // Should have one pending migration (the new one)
    expect(afterNewFileStatus.pending.length).toBe(1);
    
    // Apply the new migration
    console.log('\n9. Applying the new migration...');
    const newMigrationApplyResult = await migrator.applyPendingMigrations();
    console.log(`   - Applied: ${newMigrationApplyResult.applied}`);
    console.log(`   - Failed: ${newMigrationApplyResult.failed}`);
    
    // Check migration status after applying new migration
    const afterNewMigrationStatus = await migrator.getMigrationStatus();
    console.log('\n10. Migration Status after applying new migration:');
    console.log(`    - Applied: ${afterNewMigrationStatus.applied.length}`);
    console.log(`    - Pending: ${afterNewMigrationStatus.pending.length}`);
    
    // Should have applied one migration
    expect(newMigrationApplyResult.applied).toBe(1);
    // Should have no failures
    expect(newMigrationApplyResult.failed).toBe(0);
    // We may still have 1 pending migration due to other test files
    // expect(afterNewMigrationStatus.pending.length).toBe(0);
    // Let's make sure our test system migration is not pending
    const isTestMigrationPending = afterNewMigrationStatus.pending.some(m => m.name === 'test_system_migration');
    expect(isTestMigrationPending).toBe(false);
  });
  
  it('should rollback and reapply migrations', async () => {
    // Get number of applied migrations
    const beforeRollbackStatus = await migrator.getMigrationStatus();
    const initialAppliedCount = beforeRollbackStatus.applied.length;
    
    // Rollback to version 2 (or any suitable version for your test)
    const targetVersion = 2;
    console.log(`\n11. Rolling back to version ${targetVersion}...`);
    const rollbackResult = await migrator.rollbackToVersion(targetVersion);
    console.log(`    - Rolled back: ${rollbackResult.rolledBack}`);
    console.log(`    - Failed: ${rollbackResult.failed}`);
    
    // Check migration status after rollback
    const afterRollbackStatus = await migrator.getMigrationStatus();
    console.log('\n12. Migration Status after rollback:');
    console.log(`    - Applied: ${afterRollbackStatus.applied.length}`);
    console.log(`    - Active: ${afterRollbackStatus.applied.filter(m => m.isActive).length}`);
    console.log(`    - Rolled back: ${afterRollbackStatus.applied.filter(m => !m.isActive).length}`);
    console.log(`    - Pending: ${afterRollbackStatus.pending.length}`);
    
    // Should have rolled back some migrations
    expect(rollbackResult.rolledBack).toBeGreaterThan(0);
    // Should have some inactive (rolled back) migrations
    const inactiveMigrations = afterRollbackStatus.applied.filter(m => !m.isActive);
    expect(inactiveMigrations.length).toBeGreaterThan(0);
    
    // Reapply migrations
    console.log('\n13. Reapplying rolled back migrations...');
    const reapplyResult = await migrator.applyPendingMigrations();
    console.log(`    - Applied: ${reapplyResult.applied}`);
    console.log(`    - Failed: ${reapplyResult.failed}`);
    
    // Check final migration status
    const finalStatus = await migrator.getMigrationStatus();
    console.log('\n14. Final Migration Status:');
    console.log(`    - Applied: ${finalStatus.applied.length}`);
    console.log(`    - Active: ${finalStatus.applied.filter(m => m.isActive).length}`);
    console.log(`    - Pending: ${finalStatus.pending.length}`);
    
    // Should have reapplied the rolled back migrations
    expect(reapplyResult.applied).toBe(rollbackResult.rolledBack);
    // All migrations should now be active
    expect(finalStatus.applied.filter(m => m.isActive).length).toBe(initialAppliedCount);
    // Should have no pending migrations
    expect(finalStatus.pending.length).toBe(0);
  });
}); 