/**
 * PACS Module Schema Upgrade Script
 *
 * This script upgrades the pacs_modules table schema to add new columns
 * for enhanced PACS module integration.
 *
 * Usage: node scripts/upgrade-pacs-module-schema.js
 */

import pg from 'pg';

const { Pool } = pg;

async function upgradePacsModuleSchema() {
  console.log('Starting PACS Module schema upgrade...');

  try {
    // Connect to database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    console.log('Connected to database successfully');

    // Check if columns exist
    const client = await pool.connect();
    try {
      // Check if the category column exists
      const categoryExists = await checkColumnExists(client, 'pacs_modules', 'category');
      const apiEndpointsExists = await checkColumnExists(client, 'pacs_modules', 'api_endpoints');
      const dataSchemaExists = await checkColumnExists(client, 'pacs_modules', 'data_schema');
      const syncStatusExists = await checkColumnExists(client, 'pacs_modules', 'sync_status');
      const lastSyncTimestampExists = await checkColumnExists(
        client,
        'pacs_modules',
        'last_sync_timestamp'
      );

      // Add category column if it doesn't exist
      if (!categoryExists) {
        console.log('Adding category column...');
        await client.query(`
          ALTER TABLE pacs_modules
          ADD COLUMN category TEXT
        `);
        console.log('Category column added successfully');
      } else {
        console.log('Category column already exists');
      }

      // Add api_endpoints column if it doesn't exist
      if (!apiEndpointsExists) {
        console.log('Adding api_endpoints column...');
        await client.query(`
          ALTER TABLE pacs_modules
          ADD COLUMN api_endpoints JSONB
        `);
        console.log('api_endpoints column added successfully');
      } else {
        console.log('api_endpoints column already exists');
      }

      // Add data_schema column if it doesn't exist
      if (!dataSchemaExists) {
        console.log('Adding data_schema column...');
        await client.query(`
          ALTER TABLE pacs_modules
          ADD COLUMN data_schema JSONB
        `);
        console.log('data_schema column added successfully');
      } else {
        console.log('data_schema column already exists');
      }

      // Add sync_status column if it doesn't exist
      if (!syncStatusExists) {
        console.log('Adding sync_status column...');
        await client.query(`
          ALTER TABLE pacs_modules
          ADD COLUMN sync_status TEXT DEFAULT 'pending'
        `);
        console.log('sync_status column added successfully');
      } else {
        console.log('sync_status column already exists');
      }

      // Add last_sync_timestamp column if it doesn't exist
      if (!lastSyncTimestampExists) {
        console.log('Adding last_sync_timestamp column...');
        await client.query(`
          ALTER TABLE pacs_modules
          ADD COLUMN last_sync_timestamp TIMESTAMP
        `);
        console.log('last_sync_timestamp column added successfully');
      } else {
        console.log('last_sync_timestamp column already exists');
      }

      console.log('Categorizing existing PACS modules...');

      // Initialize categories for existing PACS modules
      await client.query(`
        UPDATE pacs_modules
        SET category = 
          CASE 
            WHEN module_name ILIKE '%parcel%' OR module_name ILIKE '%land%' THEN 'Land Management'
            WHEN module_name ILIKE '%property%' OR module_name ILIKE '%asset%' THEN 'Property Records'
            WHEN module_name ILIKE '%tax%' OR module_name ILIKE '%payment%' OR module_name ILIKE '%fee%' THEN 'Tax Administration'
            WHEN module_name ILIKE '%user%' OR module_name ILIKE '%account%' OR module_name ILIKE '%auth%' THEN 'User Management'
            WHEN module_name ILIKE '%report%' OR module_name ILIKE '%analytic%' OR module_name ILIKE '%dashboard%' THEN 'Reporting & Analytics'
            WHEN module_name ILIKE '%valuation%' OR module_name ILIKE '%appraisal%' OR module_name ILIKE '%assess%' THEN 'Valuation'
            WHEN module_name ILIKE '%appeal%' OR module_name ILIKE '%dispute%' OR module_name ILIKE '%protest%' THEN 'Appeals Management'
            WHEN module_name ILIKE '%workflow%' OR module_name ILIKE '%task%' OR module_name ILIKE '%process%' THEN 'Workflow Management'
            WHEN module_name ILIKE '%gis%' OR module_name ILIKE '%map%' OR module_name ILIKE '%spatial%' THEN 'GIS Integration'
            WHEN module_name ILIKE '%document%' OR module_name ILIKE '%file%' OR module_name ILIKE '%attachment%' THEN 'Document Management'
            WHEN module_name ILIKE '%export%' OR module_name ILIKE '%import%' OR module_name ILIKE '%integration%' THEN 'Data Integration'
            WHEN module_name ILIKE '%mobile%' OR module_name ILIKE '%field%' OR module_name ILIKE '%collect%' THEN 'Field Operations'
            WHEN module_name ILIKE '%schedule%' OR module_name ILIKE '%calendar%' THEN 'Scheduling'
            WHEN module_name ILIKE '%form%' OR module_name ILIKE '%template%' THEN 'Forms & Templates'
            ELSE 'Miscellaneous'
          END
        WHERE category IS NULL
      `);

      console.log('PACS Module categories initialized successfully');

      // Set default API endpoints structure
      await client.query(`
        UPDATE pacs_modules
        SET api_endpoints = '{"get": null, "post": null, "put": null, "delete": null}' :: JSONB
        WHERE api_endpoints IS NULL
      `);

      console.log('PACS Module API endpoints initialized successfully');

      // Set default data schema structure
      await client.query(`
        UPDATE pacs_modules
        SET data_schema = '{"fields": [], "relationships": []}' :: JSONB
        WHERE data_schema IS NULL
      `);

      console.log('PACS Module data schemas initialized successfully');

      console.log('PACS Module schema upgrade completed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error upgrading PACS Module schema:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
  }
}

// Helper function to check if a column exists in a table
async function checkColumnExists(client, tableName, columnName) {
  const query = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2
  `;
  const result = await client.query(query, [tableName, columnName]);
  return result.rows.length > 0;
}

// Run the upgrade function
upgradePacsModuleSchema();
