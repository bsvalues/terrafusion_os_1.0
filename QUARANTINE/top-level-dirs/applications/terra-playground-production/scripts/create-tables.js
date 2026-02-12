/**
 * Database Schema Setup Script
 *
 * This script creates all the required database tables for the application.
 * Run this script when setting up a new database instance.
 *
 * Usage: node scripts/create-tables.js
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the Pool class from pg
const { Pool } = pg;

// Database connection from environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  const client = await pool.connect();

  try {
    console.log('Starting database schema setup...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await client.query(sqlContent);

    console.log('Database schema setup completed successfully.');
  } catch (error) {
    console.error('Error setting up database schema:', error);
  } finally {
    client.release();
  }
}

// Run the script
createTables()
  .then(() => {
    console.log('Database setup script finished.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error in database setup script:', err);
    process.exit(1);
  });
