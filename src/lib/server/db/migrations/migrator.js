import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrations } from '../schema.js';
import { eq, and } from 'drizzle-orm';

// Migration status constants
export const MIGRATION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled-back',
  PENDING: 'pending'
};

export class Migrator {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite);
    this.migrationsDir = path.join(process.cwd(), 'src', 'lib', 'server', 'db', 'migrations');
  }

  // Close the database connection
  close() {
    if (this.sqlite) {
      this.sqlite.close();
    }
  }

  // Initialize migrations table if it doesn't exist
  async initialize() {
    const tableExists = this.sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='migrations'
    `).all();

    if (tableExists.length === 0) {
      console.log('Creating migrations table...');
      
      this.sqlite.prepare(`
        CREATE TABLE migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          version INTEGER NOT NULL,
          applied_at INTEGER DEFAULT (unixepoch()),
          status TEXT NOT NULL,
          error_message TEXT,
          rollback_status TEXT,
          is_active INTEGER NOT NULL DEFAULT 1
        )
      `).run();
      
      console.log('Migrations table created successfully.');
    }
    
    // Log the migration files found to help with debugging
    const migrationFiles = await this.getAllMigrationFiles();
    console.log(`Found ${migrationFiles.length} migration files:`, 
      migrationFiles.map(m => `${m.version}:${m.name}`).join(', '));
  }

  // Get a list of all available migration files
  async getAllMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.error(`Migrations directory not found: ${this.migrationsDir}`);
      return [];
    }
    
    const migrationFiles = fs.readdirSync(this.migrationsDir)
      .filter(file => {
        // Only include JavaScript files that follow the pattern: 001_migration_name.js
        // No need to exclude test files anymore as they're in a separate directory
        return file.match(/^\d+_.*\.js$/) && 
               !['index.js', 'migrator.js'].includes(file);
      });

    console.log(`Found migration files: ${migrationFiles.join(', ')}`);
    
    return migrationFiles.map(file => {
      const [versionStr, ...nameParts] = file.replace('.js', '').split('_');
      return {
        filename: file,
        name: nameParts.join('_'),
        version: parseInt(versionStr, 10),
        path: path.join(this.migrationsDir, file)
      };
    }).sort((a, b) => a.version - b.version);
  }

  // Get all applied migrations from the database
  async getAppliedMigrations() {
    return await this.db.select().from(migrations).orderBy(migrations.version);
  }

  // Get pending migrations (not yet applied)
  async getPendingMigrations() {
    const applied = await this.getAppliedMigrations();
    const appliedNames = new Set(applied.map(m => m.name));
    
    const allMigrations = await this.getAllMigrationFiles();
    return allMigrations.filter(m => !appliedNames.has(m.name));
  }

  // Get rolled back migrations that could be reapplied
  async getRolledBackMigrations() {
    const applied = await this.getAppliedMigrations();
    const rolledBack = applied.filter(m => 
      m.status === MIGRATION_STATUS.ROLLED_BACK && 
      !m.isActive
    );
    
    // Match with existing migration files
    const allMigrationFiles = await this.getAllMigrationFiles();
    
    return rolledBack
      .map(m => {
        const matchingFile = allMigrationFiles.find(f => f.name === m.name);
        if (matchingFile) {
          return { ...matchingFile, wasRolledBack: true, id: m.id };
        }
        return null;
      })
      .filter(m => m !== null)
      .sort((a, b) => a.version - b.version);
  }

  // Apply a single migration
  async applyMigration(migration) {
    console.log(`Applying migration ${migration.version}: ${migration.name}`);
    
    try {
      // Import the migration module
      const migrationModule = await import(migration.path);
      
      // Begin transaction
      this.sqlite.prepare('BEGIN TRANSACTION').run();

      // Check if migration has an up function
      if (typeof migrationModule.up !== 'function') {
        throw new Error(`Migration ${migration.name} does not have an 'up' function`);
      }

      // Apply the migration
      await migrationModule.up(this.db, this.sqlite);

      // Record the migration in the database
      await this.db.insert(migrations).values({
        name: migration.name,
        version: migration.version,
        status: MIGRATION_STATUS.SUCCESS,
        isActive: 1
      });

      // Commit transaction
      this.sqlite.prepare('COMMIT').run();
      
      console.log(`Successfully applied migration ${migration.name}`);
      return true;
    } catch (error) {
      // Rollback transaction
      this.sqlite.prepare('ROLLBACK').run();
      
      console.error(`Error applying migration ${migration.name}:`, error);
      
      // Record the failed migration
      await this.db.insert(migrations).values({
        name: migration.name,
        version: migration.version,
        status: MIGRATION_STATUS.FAILED,
        errorMessage: error.message,
        isActive: 0
      });
      
      throw error;
    }
  }

  // Rollback a specific migration
  async rollbackMigration(migrationName) {
    console.log(`Rolling back migration: ${migrationName}`);
    
    // Get the migration record
    const migrationRecord = await this.db.select()
      .from(migrations)
      .where(eq(migrations.name, migrationName))
      .limit(1);

    if (!migrationRecord || migrationRecord.length === 0) {
      throw new Error(`Migration ${migrationName} not found in the database`);
    }

    const migration = migrationRecord[0];
    
    // Find the migration file
    const migrationFiles = await this.getAllMigrationFiles();
    const migrationFile = migrationFiles.find(m => m.name === migrationName);
    
    if (!migrationFile) {
      throw new Error(`Migration file for ${migrationName} not found`);
    }

    try {
      // Import the migration module
      const migrationModule = await import(migrationFile.path);
      
      // Begin transaction
      this.sqlite.prepare('BEGIN TRANSACTION').run();

      // Check if migration has a down function
      if (typeof migrationModule.down !== 'function') {
        throw new Error(`Migration ${migrationName} does not have a 'down' function for rollback`);
      }

      // Apply the rollback
      await migrationModule.down(this.db, this.sqlite);

      // Update the migration record
      await this.db.update(migrations)
        .set({ 
          status: MIGRATION_STATUS.ROLLED_BACK,
          rollbackStatus: MIGRATION_STATUS.SUCCESS,
          isActive: 0
        })
        .where(eq(migrations.id, migration.id));

      // Commit transaction
      this.sqlite.prepare('COMMIT').run();
      
      console.log(`Successfully rolled back migration ${migrationName}`);
      return true;
    } catch (error) {
      // Rollback transaction
      this.sqlite.prepare('ROLLBACK').run();
      
      console.error(`Error rolling back migration ${migrationName}:`, error);
      
      // Update the migration record with the failure
      await this.db.update(migrations)
        .set({ 
          rollbackStatus: MIGRATION_STATUS.FAILED,
          errorMessage: `Rollback failed: ${error.message}`
        })
        .where(eq(migrations.id, migration.id));
      
      throw error;
    }
  }

  // Apply all pending migrations
  async applyPendingMigrations() {
    await this.initialize();
    
    // Get new pending migrations (never applied)
    const pendingMigrations = await this.getPendingMigrations();
    
    // Get previously rolled back migrations that can be reapplied
    const rolledBackMigrations = await this.getRolledBackMigrations();
    
    if (pendingMigrations.length === 0 && rolledBackMigrations.length === 0) {
      console.log('No pending migrations to apply');
      return { applied: 0, failed: 0 };
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations to apply`);
    if (rolledBackMigrations.length > 0) {
      console.log(`Found ${rolledBackMigrations.length} rolled back migrations to reapply`);
    }
    
    let applied = 0;
    let failed = 0;
    
    // Apply new migrations first
    for (const migration of pendingMigrations) {
      try {
        await this.applyMigration(migration);
        applied++;
      } catch (error) {
        failed++;
        console.error(`Failed to apply migration ${migration.name}:`, error);
        break; // Stop on first failure
      }
    }
    
    // Then reapply previously rolled back migrations
    for (const migration of rolledBackMigrations) {
      try {
        // Import the migration module
        const migrationModule = await import(migration.path);
        
        // Begin transaction
        this.sqlite.prepare('BEGIN TRANSACTION').run();
  
        // Check if migration has an up function
        if (typeof migrationModule.up !== 'function') {
          throw new Error(`Migration ${migration.name} does not have an 'up' function`);
        }
  
        // Apply the migration
        await migrationModule.up(this.db, this.sqlite);
  
        // Update the migration record in the database to mark it as active
        await this.db.update(migrations)
          .set({
            status: MIGRATION_STATUS.SUCCESS,
            isActive: 1,
            appliedAt: new Date()
          })
          .where(eq(migrations.id, migration.id));
  
        // Commit transaction
        this.sqlite.prepare('COMMIT').run();
        
        console.log(`Successfully reapplied rolled back migration ${migration.name}`);
        applied++;
      } catch (error) {
        // Rollback transaction
        this.sqlite.prepare('ROLLBACK').run();
        
        console.error(`Error reapplying migration ${migration.name}:`, error);
        failed++;
        break; // Stop on first failure
      }
    }
    
    return { applied, failed };
  }

  // Rollback migrations to a specific version
  async rollbackToVersion(targetVersion) {
    await this.initialize();
    
    // Get all active migrations with version greater than target
    const migrationsToRollback = await this.db.select()
      .from(migrations)
      .where(
        and(
          eq(migrations.isActive, 1),
          sql`${migrations.version} > ${targetVersion}`
        )
      )
      .orderBy(migrations.version, 'desc'); // Roll back in reverse order
    
    if (migrationsToRollback.length === 0) {
      console.log(`No migrations to roll back to version ${targetVersion}`);
      
      // Check if there are any active migrations with versions higher than the target
      // This is to help debug cases where migrations might exist but aren't being found
      const allActiveMigrations = await this.db.select()
        .from(migrations)
        .where(eq(migrations.isActive, 1))
        .orderBy(migrations.version);
      
      console.log(`Current active migrations: ${allActiveMigrations.map(m => `${m.version}:${m.name}`).join(', ')}`);
      console.log(`Target version: ${targetVersion}`);
      
      return { rolledBack: 0, failed: 0 };
    }
    
    console.log(`Rolling back ${migrationsToRollback.length} migrations to version ${targetVersion}`);
    console.log(`Migrations to roll back: ${migrationsToRollback.map(m => `${m.version}:${m.name}`).join(', ')}`);
    
    let rolledBack = 0;
    let failed = 0;
    
    // Get all migration files to check for existence
    const migrationFiles = await this.getAllMigrationFiles();
    const migrationFileMap = new Map(migrationFiles.map(m => [m.name, m]));
    
    for (const migration of migrationsToRollback) {
      try {
        // Check if migration file exists before attempting rollback
        if (!migrationFileMap.has(migration.name)) {
          console.warn(`Warning: Migration file for ${migration.name} not found. Marking as rolled back without executing down function.`);
          
          // Mark the migration as rolled back in the database even though we can't execute the down function
          await this.db.update(migrations)
            .set({ 
              status: MIGRATION_STATUS.ROLLED_BACK,
              rollbackStatus: 'skipped - no migration file',
              isActive: 0
            })
            .where(eq(migrations.id, migration.id));
          
          rolledBack++;
          continue;
        }
        
        await this.rollbackMigration(migration.name);
        rolledBack++;
      } catch (error) {
        failed++;
        console.error(`Failed to roll back migration ${migration.name}:`, error);
        break; // Stop on first failure
      }
    }
    
    return { rolledBack, failed };
  }

  // Get migration status report
  async getMigrationStatus() {
    await this.initialize();
    
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();
    
    return {
      applied: applied.map(m => ({
        name: m.name,
        version: m.version,
        status: m.status,
        appliedAt: new Date(m.appliedAt),
        isActive: Boolean(m.isActive)
      })),
      pending: pending.map(m => ({
        name: m.name,
        version: m.version
      }))
    };
  }
} 