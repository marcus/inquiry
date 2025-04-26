import { env } from '$env/dynamic/private';
import { Migrator } from './migrator.js';

export async function runMigrations() {
  // Create a migrator instance with the database path from environment
  const migrator = new Migrator(env.DATABASE_URL);
  
  try {
    // Apply all pending migrations
    const result = await migrator.applyPendingMigrations();
    
    if (result.applied > 0) {
      console.log(`Successfully applied ${result.applied} migrations`);
    }
    
    if (result.failed > 0) {
      console.error(`Failed to apply ${result.failed} migrations`);
    }
    
    // Display migration status
    const status = await migrator.getMigrationStatus();
    console.log(`Current migration status: ${status.applied.length} applied, ${status.pending.length} pending`);
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    // Close the database connection
    migrator.close();
  }
}

// Re-export the Migrator class to be used elsewhere
export { Migrator } from './migrator.js';
