/**
 * PACS Module Importer
 *
 * This script imports PACS modules from a CSV file into the database.
 * It reads the PACS_Agent_Module_Map.csv file and inserts the modules into the database.
 *
 * Usage: node scripts/import-pacs-modules.js
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_FILE_PATH = path.join(process.cwd(), 'attached_assets', 'PACS_Agent_Module_Map.csv');
const API_URL = 'http://localhost:3000/api'; // Default port for the Express server
const API_KEY = 'api-key-admin-1a2b3c4d5e6f7g8h9i0j'; // Admin API key with full access

// Helper function to get JWT token
async function getToken() {
  const response = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: API_KEY }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
  }

  const { token } = await response.json();
  return token;
}

// Helper function to execute MCP tool
async function executeTool(token, toolName, parameters = {}) {
  const response = await fetch(`${API_URL}/mcp/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ toolName, parameters }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error(`Failed to execute tool ${toolName}:`, result);
    return null;
  }

  return result;
}

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
  return modules.map(module => ({
    name: module.module_name,
    source: module.source || 'PACS WA',
    status: module.integration || 'pending',
    category: determineCategory(module.module_name),
    description: module.description || generateDescription(module.module_name),
    version: '1.0',
    lastUpdated: new Date().toISOString(),
  }));
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

// Main function to import PACS modules
async function importPacsModules() {
  try {
    console.log('Starting PACS module import...');

    // Read the CSV file
    const rawModules = readPacsModulesCsv();
    console.log(`Read ${rawModules.length} modules from CSV`);

    // Enhance the module data
    const enhancedModules = enhanceModuleData(rawModules);

    // Get JWT token for API access
    const token = await getToken();
    console.log('Successfully obtained JWT token');

    // Import each module using the MCP API
    let successCount = 0;
    let errorCount = 0;

    for (const module of enhancedModules) {
      try {
        // Create tool parameters for module import
        const params = {
          name: module.name,
          source: module.source,
          status: module.status,
          category: module.category,
          description: module.description,
          version: module.version,
          lastUpdated: module.lastUpdated,
        };

        // Execute the importPacsModule tool
        const result = await executeTool(token, 'importPacsModule', params);

        if (result && result.success) {
          console.log(`✓ Imported module: ${module.name}`);
          successCount++;
        } else {
          console.error(`✗ Failed to import module: ${module.name}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error importing module ${module.name}:`, error);
        errorCount++;
      }

      // Add a small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\nImport completed:');
    console.log(`- Total modules: ${enhancedModules.length}`);
    console.log(`- Successfully imported: ${successCount}`);
    console.log(`- Failed: ${errorCount}`);
  } catch (error) {
    console.error('Error during PACS module import:', error);
  }
}

// Run the import
importPacsModules();
