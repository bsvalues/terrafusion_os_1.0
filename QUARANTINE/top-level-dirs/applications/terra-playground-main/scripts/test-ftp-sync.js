/**
 * Test FTP Synchronization Script
 *
 * This script tests the FTP synchronization functionality by connecting to
 * the Benton County FTP server and syncing a small directory.
 */

import { FtpService } from '../server/services/ftp-service.js';
import { synchronizeBentonCountyFTP } from './synchronize-benton-county-ftp.js'; // Keep as .js extension since this refers to the JavaScript file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Process command line arguments
const args = process.argv.slice(2);

// Test configuration with defaults
const testOptions = {
  // Default to running all tests except full sync unless specified
  smallSync:
    args.includes('--small-sync') ||
    (!args.includes('--no-small-sync') && !args.includes('--full-sync-only')),
  checkDownloadDir:
    args.includes('--check-dirs') ||
    (!args.includes('--no-check-dirs') &&
      !args.includes('--small-sync-only') &&
      !args.includes('--full-sync-only')),
  fullSync: args.includes('--full-sync') || args.includes('--full-sync-only'),
};

/**
 * Run a small test sync to a test directory
 */
async function testSmallSync() {
  console.log('=== Testing small directory sync ===');

  // Create a temporary test directory
  const testDownloadPath = path.join(rootDir, 'downloads', 'test-sync');
  if (!fs.existsSync(testDownloadPath)) {
    fs.mkdirSync(testDownloadPath, { recursive: true });
  }

  // Create FTP service with test configuration
  const ftpService = new FtpService({
    host: process.env.FTP_HOST || 'ftp.bentoncounty.spatialest.com',
    port: parseInt(process.env.FTP_PORT || '21', 10),
    user: process.env.FTP_USER || 'bcftp',
    password: process.env.FTP_PASSWORD || 'anonymous',
    secure: process.env.FTP_SECURE === 'true',
    downloadPath: testDownloadPath,
  });

  try {
    // Initialize and connect
    await ftpService.initialize();
    await ftpService.connect();
    console.log('Connected to FTP server for test');

    // Sync a small directory (metadata only)
    const testResult = await ftpService.syncDirectory('/property-assessment-data/metadata', {
      recursive: false,
      deleteLocal: false,
      maxFiles: 5, // Limit to 5 files for quick test
    });

    console.log(`Test sync completed: ${testResult.filesDownloaded} files downloaded`);
    console.log(`Total size: ${(testResult.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);

    return testResult;
  } catch (error) {
    console.error(`Test sync error: ${error.message}`);
    throw error;
  } finally {
    try {
      await ftpService.disconnect();
    } catch (error) {
      console.warn(`Error during test disconnect: ${error.message}`);
    }
  }
}

/**
 * Check that download directories exist and have expected structure
 */
function checkDownloadDirectories() {
  console.log('=== Checking download directories ===');

  const mainDownloadPath = path.join(rootDir, 'downloads', 'benton-county');
  const testDownloadPath = path.join(rootDir, 'downloads', 'test-sync');

  // Check main download directory
  if (fs.existsSync(mainDownloadPath)) {
    console.log(`✓ Main download directory exists: ${mainDownloadPath}`);
  } else {
    console.log(`✗ Main download directory missing: ${mainDownloadPath}`);
  }

  // Check test download directory
  if (fs.existsSync(testDownloadPath)) {
    console.log(`✓ Test download directory exists: ${testDownloadPath}`);

    // Check if there are files in the test directory
    const files = fs.readdirSync(testDownloadPath);
    console.log(`  Found ${files.length} files/directories in test directory`);

    if (files.length > 0) {
      // List a few files as example
      const sampleFiles = files.slice(0, 3);
      console.log(`  Sample files: ${sampleFiles.join(', ')}${files.length > 3 ? '...' : ''}`);
    }
  } else {
    console.log(`✗ Test download directory missing: ${testDownloadPath}`);
  }
}

/**
 * Run full synchronization test
 */
async function runFullSyncTest() {
  console.log('=== Running full synchronization test ===');
  try {
    const result = await synchronizeBentonCountyFTP();
    console.log(`Full sync completed: ${result.filesDownloaded} files downloaded`);
    console.log(`Total size: ${(result.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    return result;
  } catch (error) {
    console.error(`Full sync test error: ${error.message}`);
    throw error;
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log('FTP Synchronization Test Script');
  console.log('');
  console.log('Available command-line options:');
  console.log('  --help             Display this help message');
  console.log('  --small-sync       Run the small sync test only');
  console.log('  --no-small-sync    Skip the small sync test');
  console.log('  --check-dirs       Check download directories only');
  console.log('  --no-check-dirs    Skip checking download directories');
  console.log('  --full-sync        Run a full synchronization test');
  console.log('  --full-sync-only   Run only the full synchronization test');
  console.log('  --small-sync-only  Run only the small sync test');
  console.log('');
  console.log('By default, small sync and directory checks are enabled, full sync is disabled');
}

/**
 * Run all selected tests
 */
async function runTests() {
  // Show help if requested
  if (args.includes('--help')) {
    showHelp();
    return;
  }

  console.log('Starting FTP synchronization tests...');
  console.log(`Test configuration: ${JSON.stringify(testOptions, null, 2)}`);

  try {
    // Run tests based on configuration
    if (testOptions.smallSync) {
      await testSmallSync();
    }

    if (testOptions.checkDownloadDir) {
      checkDownloadDirectories();
    }

    if (testOptions.fullSync) {
      await runFullSyncTest();
    }

    console.log('All FTP synchronization tests completed successfully');
  } catch (error) {
    console.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests, testSmallSync, checkDownloadDirectories, runFullSyncTest };
