/**
 * Development Tools Database Setup Script
 * 
 * This script creates all the required database tables for the TaxI_AI Development Platform.
 * It sets up the following:
 * 1. Code Snippets Library tables
 * 2. Data Visualization Workshop tables
 * 3. UI Component Playground tables
 * 
 * Usage: node setup-development-tools-db.js
 */

// Import required modules
const { exec } = require('child_process');
const path = require('path');

console.log('Setting up Development Tools Database...');

// Step 1: Run the create-development-tools-tables.js script
console.log('\nStep 1: Creating development tools tables...');
exec('node scripts/create-development-tools-tables.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error creating tables: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`${stdout}`);
  console.log('Development tools tables created successfully.');
  
  // Step 2: Push schema changes to the database
  console.log('\nStep 2: Pushing schema changes...');
  exec('npm run db:push', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error pushing schema: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    
    console.log(`${stdout}`);
    console.log('Schema changes pushed successfully.');
    
    // Step 3: Verify tables were created by checking a few key tables
    console.log('\nStep 3: Verifying tables...');
    verifyTables();
  });
});

/**
 * Verify that the development tools tables were created successfully
 */
function verifyTables() {
  // Connect to database and check tables
  const { Pool } = require('pg');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  // Tables to verify
  const tables = [
    'code_snippets',
    'data_visualizations',
    'ui_component_templates',
  ];
  
  console.log('Checking for tables in database:');
  
  let tablesToCheck = tables.length;
  let tablesFound = 0;
  
  tables.forEach(table => {
    pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public'
         AND table_name = $1
       )`,
      [table],
      (err, res) => {
        if (err) {
          console.error(`Error checking table ${table}:`, err);
        } else {
          const exists = res.rows[0].exists;
          console.log(`- ${table}: ${exists ? 'Found ✓' : 'Missing ✗'}`);
          
          if (exists) {
            tablesFound++;
          }
        }
        
        tablesToCheck--;
        
        if (tablesToCheck === 0) {
          console.log(`\nVerification complete: ${tablesFound}/${tables.length} tables found.`);
          
          if (tablesFound === tables.length) {
            console.log('\nSetup complete! Development Tools Database is ready.');
          } else {
            console.log('\nSome tables are missing. Please check the errors above.');
          }
          
          pool.end();
        }
      }
    );
  });
}