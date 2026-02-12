/**
 * Direct PACS Module Importer
 *
 * This script provides a direct way to import PACS modules from the CSV file
 * directly into the database, bypassing the MCP API. This can be useful if there
 * are issues with the authentication or API endpoints.
 *
 * Usage: node scripts/direct-import-pacs-modules.js
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the Pool class from pg
const { Pool } = pg;

// Configuration
const CSV_FILE_PATH = path.join(process.cwd(), 'attached_assets', 'PACS_Agent_Module_Map.csv');

// Database connection from environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to read and parse the CSV file
function readPacsModulesCsv() {
  try {
    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    return records;
  } catch (error) {
    console.error('Error reading or parsing CSV file:', error);
    return [];
  }
}

// Function to enhance module data
function enhanceModuleData(modules) {
  // Add default status and category if missing
  return modules.map(module => {
    const moduleName = module.module_name;
    const category = determineCategory(moduleName);

    // Create API endpoints template
    const apiEndpoints = {
      get: {
        path: `/api/pacs/${moduleName.toLowerCase().replace(/\s+/g, '-')}`,
        params: {
          id: 'string',
          filter: 'object',
        },
        description: `Retrieve ${moduleName} data`,
      },
      post: {
        path: `/api/pacs/${moduleName.toLowerCase().replace(/\s+/g, '-')}`,
        body: {
          type: 'object',
        },
        description: `Create new ${moduleName} record`,
      },
      put: null,
      delete: null,
    };

    // Create data schema template
    const dataSchema = {
      fields: [
        {
          name: 'id',
          type: 'string',
          description: 'Unique identifier',
        },
        {
          name: 'createdAt',
          type: 'datetime',
          description: 'Creation timestamp',
        },
      ],
      relationships: [],
    };

    return {
      moduleName: moduleName,
      source: module.source || 'PACS WA',
      integration: module.integration || 'pending',
      description: generateDescription(moduleName),
      category: category,
      apiEndpoints: apiEndpoints,
      dataSchema: dataSchema,
      syncStatus: 'pending',
      lastSyncTimestamp: null,
    };
  });
}

// Helper function to determine module category based on name
function determineCategory(moduleName) {
  const lowerName = moduleName.toLowerCase();

  if (lowerName.includes('appraisal') || lowerName.includes('valuation')) {
    return 'Valuation';
  } else if (lowerName.includes('report') || lowerName.includes('export')) {
    return 'Reporting';
  } else if (lowerName.includes('gis') || lowerName.includes('map')) {
    return 'Mapping';
  } else if (lowerName.includes('tax') || lowerName.includes('payment')) {
    return 'Taxation';
  } else if (lowerName.includes('admin') || lowerName.includes('user')) {
    return 'Administration';
  } else if (lowerName.includes('property') || lowerName.includes('parcel')) {
    return 'Property Management';
  } else if (lowerName.includes('exemption') || lowerName.includes('appeal')) {
    return 'Appeals and Exemptions';
  } else {
    return 'Other';
  }
}

// Helper function to generate a description based on module name
function generateDescription(moduleName) {
  const category = determineCategory(moduleName);

  const descriptions = {
    Valuation: `Handles property valuation processes for ${moduleName.toLowerCase()} functions in PACS.`,
    Reporting: `Generates reports and exports data related to ${moduleName.toLowerCase()} in PACS.`,
    Mapping: `Provides GIS and mapping capabilities for ${moduleName.toLowerCase()} in PACS.`,
    Taxation: `Manages tax calculation and processing for ${moduleName.toLowerCase()} in PACS.`,
    Administration: `Provides administrative functions for ${moduleName.toLowerCase()} in PACS.`,
    'Property Management': `Handles property record management for ${moduleName.toLowerCase()} in PACS.`,
    'Appeals and Exemptions': `Manages the processing of ${moduleName.toLowerCase()} in PACS.`,
    Other: `Provides functionality for ${moduleName.toLowerCase()} in the PACS system.`,
  };

  return descriptions[category];
}

// Function to import modules directly to database
async function importPacsModules() {
  const client = await pool.connect();

  try {
    console.log('Starting direct PACS module import...');

    // Read the CSV file
    const rawModules = readPacsModulesCsv();
    console.log(`Read ${rawModules.length} modules from CSV`);

    // Enhance the module data
    const enhancedModules = enhanceModuleData(rawModules);

    // Begin transaction
    await client.query('BEGIN');

    let successCount = 0;
    let errorCount = 0;

    // For each module, insert or update in the database
    for (const module of enhancedModules) {
      try {
        // Use an UPSERT query to either insert or update the module
        const query = `
          INSERT INTO pacs_modules (
            module_name, source, integration, description, 
            category, api_endpoints, data_schema, sync_status, last_sync_timestamp
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (module_name) 
          DO UPDATE SET
            source = $2,
            integration = $3,
            description = $4,
            category = $5,
            api_endpoints = $6,
            data_schema = $7,
            sync_status = $8,
            last_sync_timestamp = $9
          RETURNING id, module_name
        `;

        const values = [
          module.moduleName,
          module.source,
          module.integration,
          module.description,
          module.category,
          module.apiEndpoints,
          module.dataSchema,
          module.syncStatus,
          module.lastSyncTimestamp,
        ];

        const result = await client.query(query, values);

        if (result.rows.length > 0) {
          console.log(
            `✓ Imported module: ${result.rows[0].module_name} (ID: ${result.rows[0].id})`
          );
          successCount++;
        } else {
          console.error(`✗ Failed to import module: ${module.moduleName}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error importing module ${module.moduleName}:`, error);
        errorCount++;
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\nImport completed:');
    console.log(`- Total modules: ${enhancedModules.length}`);
    console.log(`- Successfully imported: ${successCount}`);
    console.log(`- Failed: ${errorCount}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during PACS module import:', error);
  } finally {
    client.release();
  }
}

// Run the import
importPacsModules();
