#!/usr/bin/env node
/**
 * Benton County FTP Data Importer
 * 
 * This script connects directly to the Benton County FTP server at ftp.spatialest.com,
 * downloads the latest property data files, and imports them into the application database.
 * 
 * IMPORTANT: This script only uses genuine Benton County property data,
 * never mock or demo data.
 */
import { FtpService } from '../server/services/ftp-service.js';
import { MemStorage } from '../server/storage.js';
import { DataImportService } from '../server/services/data-import-service.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Calculate __dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create temporary directory for downloads
const TEMP_DIR = path.join(__dirname, '..', 'uploads', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Initialize storage and services
const storage = new MemStorage();
const ftpService = new FtpService(storage);
const dataImportService = new DataImportService(storage);

async function importPropertyData() {
  console.log('Starting Benton County property data import process...');
  
  try {
    // Test FTP connection
    console.log('Testing connection to Benton County FTP server...');
    const connected = await ftpService.testConnection();
    
    if (!connected) {
      throw new Error('Failed to connect to Benton County FTP server. Check credentials and try again.');
    }
    
    console.log('Successfully connected to FTP server.');
    
    // List available files
    console.log('Listing property data files...');
    const remoteDir = '/';  // Adjust this path based on your FTP structure
    const files = await ftpService.listFiles(remoteDir);
    
    // Filter for property data files (CSV files)
    const propertyDataFiles = files.filter(file => 
      file.type === 1 && // File (not directory)
      (file.name.toLowerCase().includes('property') || 
       file.name.toLowerCase().includes('parcel') ||
       file.name.toLowerCase().includes('assessment')) &&
      file.name.toLowerCase().endsWith('.csv')
    );
    
    if (propertyDataFiles.length === 0) {
      console.log('No property data files found on the FTP server.');
      return;
    }
    
    console.log(`Found ${propertyDataFiles.length} property data files.`);
    
    // Download and import each file
    for (const file of propertyDataFiles) {
      const remotePath = `${remoteDir}${file.name}`;
      const localPath = path.join(TEMP_DIR, file.name);
      
      console.log(`Downloading ${file.name}...`);
      const downloaded = await ftpService.downloadFile(remotePath, localPath);
      
      if (!downloaded) {
        console.error(`Failed to download ${file.name}. Skipping.`);
        continue;
      }
      
      console.log(`Successfully downloaded ${file.name}.`);
      
      // Import the file into the staging table
      console.log(`Importing data from ${file.name}...`);
      try {
        const importResult = await dataImportService.stageImport(
          fs.createReadStream(localPath),
          'properties',
          file.name
        );
        
        console.log(`Staged ${importResult.rowCount} properties for import.`);
        
        // Get staged IDs
        const stagedIds = await dataImportService.getStagedProperties(importResult.importId);
        console.log(`Retrieved ${stagedIds.length} staged property IDs.`);
        
        // Commit the staged properties to production
        const commitResult = await dataImportService.commitStagedProperties(stagedIds.map(p => p.id));
        console.log(`Imported ${commitResult.successCount} properties into the system.`);
        console.log(`Failed to import ${commitResult.failureCount} properties.`);
        
        if (commitResult.errors && commitResult.errors.length > 0) {
          console.log('First few errors:');
          commitResult.errors.slice(0, 3).forEach(error => {
            console.log(`- ${error}`);
          });
        }
        
        // Create a detailed log file
        const logPath = path.join(TEMP_DIR, `import-log-${Date.now()}.json`);
        const logData = {
          file: file.name,
          importTime: new Date().toISOString(),
          totalRecords: importResult.rowCount,
          successfulImports: commitResult.successCount,
          failedImports: commitResult.failureCount,
          errors: commitResult.errors
        };
        
        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
        console.log(`Import log saved to ${logPath}`);
      } catch (error) {
        console.error(`Error importing data from ${file.name}:`, error.message);
      }
    }
    
    console.log('Benton County property data import completed.');
  } catch (error) {
    console.error('Import process failed:', error.message);
  }
}

// Run the import process
importPropertyData()
  .then(() => {
    console.log('Script execution completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error during execution:', error);
    process.exit(1);
  });