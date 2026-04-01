/**
 * Benton County FTP Synchronization Script
 * 
 * This script connects to the Benton County FTP server and synchronizes
 * all property assessment data files to the local downloads directory.
 */

import { FtpService } from '../server/services/ftp-service.js';
// Use console.log instead of logger for simplicity in the JS version
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  debug: (msg) => console.log(`[DEBUG] ${msg}`)
};
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the root directory and download path
const rootDir = path.join(__dirname, '..');
const downloadPath = path.join(rootDir, 'downloads', 'benton-county');

// Ensure download directory exists
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
  logger.info(`Created download directory: ${downloadPath}`);
}

/**
 * Main synchronization function
 */
async function synchronizeBentonCountyFTP() {
  logger.info('Starting Benton County FTP synchronization...');
  
  // Create FTP service instance
  const ftpService = new FtpService({
    host: process.env.FTP_HOST || 'ftp.bentoncounty.spatialest.com',
    port: parseInt(process.env.FTP_PORT || '21', 10),
    user: process.env.FTP_USER || 'bcftp',
    password: process.env.FTP_PASSWORD || 'anonymous',
    secure: process.env.FTP_SECURE === 'true', // Use secure connection if specified
    downloadPath: downloadPath
  });
  
  try {
    // Initialize the FTP service
    await ftpService.initialize();
    logger.info('FTP service initialized successfully');
    
    // Connect to the FTP server
    await ftpService.connect();
    logger.info('Connected to Benton County FTP server');
    
    // Synchronize property assessment data
    const result = await ftpService.syncDirectory('/property-assessment-data', {
      recursive: true,
      deleteLocal: false, // Don't delete local files that don't exist on server
      retryOptions: {
        maxRetries: 3,
        retryDelay: 2000, // 2 seconds
        exponentialBackoff: true
      }
    });
    
    // Log detailed summary
    logger.info('Synchronization completed successfully');
    logger.info(`Files synchronized: ${result.filesDownloaded}`);
    logger.info(`Total size: ${(result.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    
    // Log skipped and failed files if any
    if (result.skippedFiles.length > 0) {
      logger.info(`Skipped files: ${result.skippedFiles.length}`);
      for (const file of result.skippedFiles) {
        logger.debug(`Skipped: ${file}`);
      }
    }
    
    if (result.failedFiles.length > 0) {
      logger.warn(`Failed files: ${result.failedFiles.length}`);
      for (const file of result.failedFiles) {
        logger.warn(`Failed: ${file.path} - ${file.error}`);
      }
    }
    
    // Return the result for any caller
    return result;
  } catch (error) {
    logger.error(`FTP synchronization error: ${error.message}`);
    throw error;
  } finally {
    // Always disconnect from the FTP server
    try {
      await ftpService.disconnect();
      logger.info('Disconnected from FTP server');
    } catch (disconnectError) {
      logger.warn(`Error during FTP disconnect: ${disconnectError.message}`);
    }
  }
}

// Run the synchronization if the script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  synchronizeBentonCountyFTP()
    .then((result) => {
      console.log(`Synchronization completed: ${result.filesDownloaded} files downloaded`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`Synchronization failed: ${error.message}`);
      process.exit(1);
    });
}

// Export the function for use in other modules
export { synchronizeBentonCountyFTP };