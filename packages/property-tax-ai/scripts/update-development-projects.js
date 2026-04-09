/**
 * Update Development Projects Table Script
 * 
 * This script updates the dev_projects table to match the schema defined in shared/schema.ts
 * It renames the table to development_projects and adds an id column as primary key.
 * 
 * Run this script only once to update the database schema.
 * 
 * Usage: node scripts/update-development-projects.js
 */

import pg from 'pg';
const { Pool } = pg;

async function updateDevelopmentProjects() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting to update development projects table...');
    
    // Check if dev_projects table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'dev_projects'
      );
    `);
    
    // If dev_projects doesn't exist, we'll create development_projects directly
    if (!tableCheck.rows[0].exists) {
      console.log('dev_projects table does not exist, creating development_projects table...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS development_projects (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          language TEXT NOT NULL,
          framework TEXT,
          template TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          config JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          is_public BOOLEAN DEFAULT false
        );
      `);
      
      console.log('Created development_projects table');
    } else {
      // Begin transaction
      await pool.query('BEGIN');
      
      console.log('dev_projects table exists, preparing to update...');
      
      // First, check if development_projects table already exists
      const newTableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = 'development_projects'
        );
      `);
      
      if (newTableCheck.rows[0].exists) {
        console.log('development_projects table already exists, dropping it first...');
        await pool.query('DROP TABLE development_projects CASCADE;');
      }
      
      // Rename dev_projects to development_projects
      console.log('Renaming dev_projects to development_projects...');
      await pool.query('ALTER TABLE dev_projects RENAME TO development_projects;');
      
      // Update project_id to be TEXT (if it's not already)
      console.log('Ensuring project_id is TEXT...');
      await pool.query(`
        ALTER TABLE development_projects 
        ALTER COLUMN project_id TYPE TEXT;
      `);
      
      // Add id column if it doesn't exist
      console.log('Adding id column if it does not exist...');
      
      // Find the constraint name first
      const constraintCheck = await pool.query(`
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'development_projects'::regclass
        AND contype = 'p';
      `);
      
      if (constraintCheck.rows.length > 0) {
        const constraintName = constraintCheck.rows[0].conname;
        console.log(`Dropping primary key constraint: ${constraintName}`);
        await pool.query(`
          ALTER TABLE development_projects 
          DROP CONSTRAINT "${constraintName}";
        `);
      }
      
      // Check if id column exists
      const columnCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'development_projects' AND column_name = 'id'
        );
      `);
      
      if (!columnCheck.rows[0].exists) {
        console.log('Adding id column to development_projects...');
        await pool.query(`
          ALTER TABLE development_projects 
          ADD COLUMN id SERIAL PRIMARY KEY;
        `);
      } else {
        console.log('id column already exists in development_projects');
        
        // Make sure id is the primary key
        const idPrimaryKeyCheck = await pool.query(`
          SELECT a.attname
          FROM   pg_index i
          JOIN   pg_attribute a ON a.attrelid = i.indrelid
                               AND a.attnum = ANY(i.indkey)
          WHERE  i.indrelid = 'development_projects'::regclass
          AND    i.indisprimary;
        `);
        
        if (idPrimaryKeyCheck.rows.length === 0 || idPrimaryKeyCheck.rows[0].attname !== 'id') {
          console.log('Setting id as primary key...');
          await pool.query(`
            ALTER TABLE development_projects 
            ADD PRIMARY KEY (id);
          `);
        }
      }
      
      // Adding other columns that might be missing
      const columnsToCheck = [
        { name: 'template', type: 'TEXT', default: 'NULL' },
        { name: 'config', type: 'JSONB', default: '\'{}\'' },
        { name: 'metadata', type: 'JSONB', default: '\'{}\'' },
        { name: 'is_public', type: 'BOOLEAN', default: 'false' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'CURRENT_TIMESTAMP' }
      ];
      
      for (const column of columnsToCheck) {
        const columnExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'development_projects' AND column_name = $1
          );
        `, [column.name]);
        
        if (!columnExists.rows[0].exists) {
          console.log(`Adding ${column.name} column to development_projects...`);
          await pool.query(`
            ALTER TABLE development_projects 
            ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default};
          `);
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      console.log('Transaction committed');
    }
    
    console.log('Successfully updated development_projects table');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating development projects table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the function
updateDevelopmentProjects()
  .then(() => {
    console.log('Development projects table update complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update development projects table:', error);
    process.exit(1);
  });

// Export the function
export { updateDevelopmentProjects };