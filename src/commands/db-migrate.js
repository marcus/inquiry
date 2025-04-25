#!/usr/bin/env node

import { Migrator } from '../lib/server/db/migrations/migrator.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

// Calculate the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Command line help text
const helpText = `
Inquiry Database Migration CLI

Usage:
  node db-migrate.js [command] [options]

Commands:
  status              - Show migration status
  up                  - Apply all pending migrations
  rollback <version>  - Rollback to a specific version (all migrations after the version will be rolled back)
  create <name>       - Create a new migration file
  help                - Show this help text

Options:
  --db <path>         - Path to the database file (default: ./db/inquiry.db or env DATABASE_URL)

Examples:
  node db-migrate.js status
  node db-migrate.js up
  node db-migrate.js rollback 3
  node db-migrate.js create add_user_roles
  node db-migrate.js status --db ./db/test.db
`;

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    console.log(helpText);
    process.exit(0);
  }
  
  const command = args[0];
  
  // Parse options
  let dbPath = process.env.DATABASE_URL || path.join(projectRoot, 'db', 'inquiry.db');
  let migrationName = '';
  let version = -1;
  
  // Parse command-line arguments
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--db' && i + 1 < args.length) {
      dbPath = args[i + 1];
      i++; // Skip the next argument
    } else if (command === 'create' && i === 1) {
      migrationName = args[i];
    } else if (command === 'rollback' && i === 1) {
      version = parseInt(args[i], 10);
      if (isNaN(version)) {
        console.error('Invalid version number for rollback command');
        process.exit(1);
      }
    }
  }
  
  // Make sure the database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Initialize migrator
  const migrator = new Migrator(dbPath);
  
  try {
    switch (command) {
      case 'status': {
        const status = await migrator.getMigrationStatus();
        console.log('\nMigration Status:');
        console.log('=================');
        console.log(`\nApplied migrations (${status.applied.length}):`);
        if (status.applied.length === 0) {
          console.log('  No migrations applied yet');
        } else {
          status.applied.forEach(m => {
            console.log(`  - V${m.version}: ${m.name} (${m.status}) [${m.isActive ? 'ACTIVE' : 'INACTIVE'}]`);
          });
        }
        
        console.log(`\nPending migrations (${status.pending.length}):`);
        if (status.pending.length === 0) {
          console.log('  No pending migrations');
        } else {
          status.pending.forEach(m => {
            console.log(`  - V${m.version}: ${m.name}`);
          });
        }
        console.log('\n');
        break;
      }
      
      case 'up': {
        console.log('Applying pending migrations...');
        const result = await migrator.applyPendingMigrations();
        
        if (result.applied === 0 && result.failed === 0) {
          console.log('No migrations to apply');
        } else {
          console.log(`Applied: ${result.applied}, Failed: ${result.failed}`);
        }
        break;
      }
      
      case 'rollback': {
        if (version < 0) {
          console.error('Please provide a version number to roll back to');
          process.exit(1);
        }
        
        console.log(`Rolling back migrations to version ${version}...`);
        const result = await migrator.rollbackToVersion(version);
        
        if (result.rolledBack === 0 && result.failed === 0) {
          console.log('No migrations to roll back');
        } else {
          console.log(`Rolled back: ${result.rolledBack}, Failed: ${result.failed}`);
        }
        break;
      }
      
      case 'create': {
        if (!migrationName) {
          console.error('Please provide a name for the migration');
          process.exit(1);
        }
        
        // Get all existing migrations to determine the next version number
        const migrations = await migrator.getAllMigrationFiles();
        const nextVersion = migrations.length > 0 
          ? Math.max(...migrations.map(m => m.version)) + 1 
          : 1;
        
        // Format version number with leading zeros
        const versionStr = nextVersion.toString().padStart(3, '0');
        const filename = `${versionStr}_${migrationName}.js`;
        const filePath = path.join(migrator.migrationsDir, filename);
        
        // Create migration template
        const template = `/**
 * Migration: ${migrationName}
 * Version: ${nextVersion}
 */

// Migration up function - applies the migration
export async function up(db, sqlite) {
  console.log('Running migration: ${migrationName}');
  
  // TODO: Implement migration logic here
  // Example:
  // sqlite.prepare('CREATE TABLE example (id INTEGER PRIMARY KEY)').run();
}

// Migration down function - rolls back the migration
export async function down(db, sqlite) {
  console.log('Rolling back migration: ${migrationName}');
  
  // TODO: Implement rollback logic here
  // Example:
  // sqlite.prepare('DROP TABLE example').run();
}
`;
        
        fs.writeFileSync(filePath, template);
        console.log(`Created new migration file: ${filename}`);
        break;
      }
      
      default:
        console.error(`Unknown command: ${command}`);
        console.log(helpText);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    migrator.close();
  }
}

// Run the main function
main(); 