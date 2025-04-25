import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Migrator, MIGRATION_STATUS } from '../migrator.js';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Test database path
const TEST_DB_PATH = 'db/test-migration.db';

// Helper function to delete the test database if it exists
function deleteTestDb() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

describe('Migrator', () => {
  let migrator;
  
  beforeEach(() => {
    // Delete test database before each test
    deleteTestDb();
    
    // Create a fresh migrator instance for each test
    migrator = new Migrator(TEST_DB_PATH);
  });
  
  afterEach(() => {
    // Close the database connection after each test
    if (migrator) {
      migrator.close();
    }
    
    // Delete the test database after each test
    deleteTestDb();
  });
  
  it('should initialize the migrations table if it does not exist', async () => {
    // Initialize the migrations table
    await migrator.initialize();
    
    // Check if the migrations table was created
    const sqlite = new Database(TEST_DB_PATH);
    const tableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='migrations'
    `).all();
    
    expect(tableExists.length).toBe(1);
    sqlite.close();
  });
  
  it('should detect available migration files', async () => {
    // The test should detect the migration files we created
    const migrations = await migrator.getAllMigrationFiles();
    
    // We should have at least our two initial migrations
    expect(migrations.length).toBeGreaterThanOrEqual(2);
    
    // Check if our migrations have the correct format
    const initialMigration = migrations.find(m => m.version === 1);
    expect(initialMigration).toBeDefined();
    expect(initialMigration.name).toBe('initial_users_table');
    
    const guidanceCountMigration = migrations.find(m => m.version === 2);
    expect(guidanceCountMigration).toBeDefined();
    expect(guidanceCountMigration.name).toBe('add_guidance_count');
  });
  
  it('should apply pending migrations in the correct order', async () => {
    // Initialize the migrator
    await migrator.initialize();
    
    // Apply pending migrations
    const result = await migrator.applyPendingMigrations();
    
    // Should have applied at least 2 migrations
    expect(result.applied).toBeGreaterThanOrEqual(2);
    expect(result.failed).toBe(0);
    
    // Check if migrations were recorded in the database
    const appliedMigrations = await migrator.getAppliedMigrations();
    expect(appliedMigrations.length).toBeGreaterThanOrEqual(2);
    
    // Check if migrations were applied in the correct order
    const versions = appliedMigrations.map(m => m.version);
    const sortedVersions = [...versions].sort((a, b) => a - b);
    expect(versions).toEqual(sortedVersions);
    
    // Check if users table was created by the migration
    const sqlite = new Database(TEST_DB_PATH);
    const usersTableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).all();
    
    expect(usersTableExists.length).toBe(1);
    sqlite.close();
  });
  
  it('should correctly identify pending migrations', async () => {
    // Initialize the migrator
    await migrator.initialize();
    
    // Get initial pending migrations count
    const initialPending = await migrator.getPendingMigrations();
    const initialCount = initialPending.length;
    
    // Apply the migrations
    await migrator.applyPendingMigrations();
    
    // Get pending migrations after applying
    const pendingAfterApplying = await migrator.getPendingMigrations();
    
    // No migrations should be pending after applying
    expect(pendingAfterApplying.length).toBe(0);
    
    // Create a mock migration file for testing rollback
    const testMigrationVersion = 9999;
    const testMigrationName = 'test_migration_vitest';
    const testMigrationFile = `${testMigrationVersion.toString().padStart(4, '0')}_${testMigrationName}.js`;
    const testMigrationPath = path.join(migrator.migrationsDir, testMigrationFile);
    
    // Write a test migration file
    const testMigrationContent = `/**
 * Test migration for vitest
 * Version: ${testMigrationVersion}
 */

// Migration up function - applies the migration
export async function up(db, sqlite) {
  console.log('Test migration up');
}

// Migration down function - rolls back the migration
export async function down(db, sqlite) {
  console.log('Test migration down');
}
`;
    
    fs.writeFileSync(testMigrationPath, testMigrationContent);
    
    try {
      // Get pending migrations again after creating the new file
      const pendingAfterNewFile = await migrator.getPendingMigrations();
      
      // Should have one new pending migration
      expect(pendingAfterNewFile.length).toBe(1);
      expect(pendingAfterNewFile[0].name).toBe(testMigrationName);
      expect(pendingAfterNewFile[0].version).toBe(testMigrationVersion);
    } finally {
      // Clean up test migration file
      if (fs.existsSync(testMigrationPath)) {
        fs.unlinkSync(testMigrationPath);
      }
    }
  });
  
  it('should provide migration status information', async () => {
    // Initialize the migrator
    await migrator.initialize();
    
    // Get initial status
    const initialStatus = await migrator.getMigrationStatus();
    
    // Initially, we should have no applied migrations
    expect(initialStatus.applied.length).toBe(0);
    
    // We should have some pending migrations
    expect(initialStatus.pending.length).toBeGreaterThan(0);
    
    // Apply migrations
    await migrator.applyPendingMigrations();
    
    // Get status again
    const afterStatus = await migrator.getMigrationStatus();
    
    // After applying, we should have some applied migrations
    expect(afterStatus.applied.length).toBeGreaterThan(0);
    
    // After applying, we should have no pending migrations
    expect(afterStatus.pending.length).toBe(0);
    
    // Each applied migration should have the required fields
    afterStatus.applied.forEach(migration => {
      expect(migration).toHaveProperty('name');
      expect(migration).toHaveProperty('version');
      expect(migration).toHaveProperty('status');
      expect(migration).toHaveProperty('appliedAt');
      expect(migration).toHaveProperty('isActive');
      expect(migration.status).toBe(MIGRATION_STATUS.SUCCESS);
      expect(migration.isActive).toBe(true);
    });
  });
}); 