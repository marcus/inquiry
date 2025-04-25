import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Migrator, MIGRATION_STATUS } from '../migrator.js';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Test database path
const TEST_DB_PATH = 'db/test-rollback.db';

// Helper function to delete the test database if it exists
function deleteTestDb() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

describe('Migration Rollback', () => {
  let migrator;
  
  beforeEach(async () => {
    // Delete test database before each test
    deleteTestDb();
    
    // Create a fresh migrator instance for each test
    migrator = new Migrator(TEST_DB_PATH);
    
    // Initialize and apply migrations
    await migrator.initialize();
    await migrator.applyPendingMigrations();
  });
  
  afterEach(() => {
    // Close the database connection after each test
    if (migrator) {
      migrator.close();
    }
    
    // Delete the test database after each test
    deleteTestDb();
  });
  
  it('should correctly rollback to a specific version', async () => {
    // Get the current applied migrations
    const initialMigrations = await migrator.getAppliedMigrations();
    expect(initialMigrations.length).toBeGreaterThanOrEqual(2);
    
    // Target version to rollback to (first migration)
    const targetVersion = 1;
    
    // Rollback to version 1
    const result = await migrator.rollbackToVersion(targetVersion);
    
    // Check if we rolled back at least one migration
    expect(result.rolledBack).toBeGreaterThanOrEqual(1);
    expect(result.failed).toBe(0);
    
    // Get migrations after rollback
    const afterRollbackMigrations = await migrator.getAppliedMigrations();
    
    // Filter active migrations
    const activeMigrations = afterRollbackMigrations.filter(m => m.isActive);
    
    // Check that all active migrations have versions less than or equal to target
    activeMigrations.forEach(migration => {
      expect(migration.version).toBeLessThanOrEqual(targetVersion);
    });
    
    // Check that migrations with versions > target are marked as rolled back
    const rolledBackMigrations = afterRollbackMigrations.filter(m => !m.isActive);
    rolledBackMigrations.forEach(migration => {
      expect(migration.version).toBeGreaterThan(targetVersion);
      expect(migration.status).toBe(MIGRATION_STATUS.ROLLED_BACK);
    });
  });
  
  it('should throw an error when trying to rollback a migration that does not exist', async () => {
    // Get all migrations
    const migrations = await migrator.getAppliedMigrations();
    
    // Use a non-existent migration name
    const nonExistentName = 'non_existent_migration';
    
    // Expect the rollback to throw an error
    await expect(migrator.rollbackMigration(nonExistentName)).rejects.toThrow();
  });
  
  it('should be able to apply migrations after rollback', async () => {
    // Get initial migrations
    const initialMigrations = await migrator.getAppliedMigrations();
    const initialCount = initialMigrations.length;
    
    // Rollback to version 1
    await migrator.rollbackToVersion(1);
    
    // Get migrations after rollback
    const afterRollbackMigrations = await migrator.getAppliedMigrations();
    const activeAfterRollback = afterRollbackMigrations.filter(m => m.isActive).length;
    
    // Apply migrations again
    const applyResult = await migrator.applyPendingMigrations();
    
    // Should have applied the rolled back migrations
    expect(applyResult.applied).toBe(initialCount - activeAfterRollback);
    
    // Get final migrations
    const finalMigrations = await migrator.getAppliedMigrations();
    const activeFinal = finalMigrations.filter(m => m.isActive).length;
    
    // Should have the same number of active migrations as initially
    expect(activeFinal).toBe(initialCount);
  });
}); 