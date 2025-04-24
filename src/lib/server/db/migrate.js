import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

// Initialize the database connection
const sqlite = new Database('inquiry.db');
const db = drizzle(sqlite);

// Run this script to migrate the database
async function migrate() {
  console.log('Starting database migration...');
  
  try {
    // Check if users table exists
    const userTableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).all();
    
    if (userTableExists.length === 0) {
      console.log('Creating users table...');
      
      // Create users table
      sqlite.prepare(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at INTEGER DEFAULT (unixepoch())
        )
      `).run();
      
      console.log('Users table created successfully.');
    } else {
      console.log('Users table already exists.');
    }
    
    // Check if inquiries table has user_id column
    const inquiryColumns = sqlite.prepare(`PRAGMA table_info(inquiries)`).all();
    const hasUserIdColumn = inquiryColumns.some(row => row.name === 'user_id');
    
    if (!hasUserIdColumn) {
      console.log('Adding user_id column to inquiries table...');
      
      // Add user_id column to inquiries table
      sqlite.prepare(`ALTER TABLE inquiries ADD COLUMN user_id INTEGER REFERENCES users(id)`).run();
      
      console.log('user_id column added to inquiries table successfully.');
    } else {
      console.log('user_id column already exists in inquiries table.');
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqlite.close();
    process.exit();
  }
}

migrate();
