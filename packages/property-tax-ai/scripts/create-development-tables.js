/**
 * Development Platform Database Tables Setup Script
 * 
 * This script creates all the required database tables for the TaxI_AI Development Platform.
 * It sets up the dev_projects, dev_project_files, and dev_preview_settings tables.
 * 
 * Usage: node scripts/create-development-tables.js
 */

const { Pool } = require('pg');
const { config } = require('../server/config');

async function createDevelopmentTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || config.databaseUrl,
  });

  try {
    // Create dev_projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dev_projects (
        project_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        language TEXT NOT NULL,
        framework TEXT,
        status TEXT DEFAULT 'DRAFT',
        created_by INTEGER,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created dev_projects table');

    // Create dev_project_files table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dev_project_files (
        file_id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES dev_projects(project_id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT,
        size INTEGER,
        parent_path TEXT,
        created_by INTEGER,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, path)
      );
    `);
    console.log('Created dev_project_files table');

    // Create dev_preview_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dev_preview_settings (
        project_id TEXT PRIMARY KEY REFERENCES dev_projects(project_id) ON DELETE CASCADE,
        port INTEGER,
        start_command TEXT,
        environment_variables JSONB,
        status TEXT DEFAULT 'STOPPED',
        last_started TIMESTAMP WITH TIME ZONE,
        last_stopped TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('Created dev_preview_settings table');

    console.log('Successfully created all development platform tables');
  } catch (error) {
    console.error('Error creating development tables:', error);
  } finally {
    await pool.end();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createDevelopmentTables()
    .then(() => {
      console.log('Development tables creation complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create development tables:', error);
      process.exit(1);
    });
}

module.exports = { createDevelopmentTables };