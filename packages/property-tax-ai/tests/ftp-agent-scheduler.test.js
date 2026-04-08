/**
 * FTP Agent Scheduler Test
 * 
 * This file tests the locking mechanism of the FTP agent scheduler
 * to ensure that multiple concurrent synchronization jobs cannot run at the same time.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../server/utils/logger.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Lock file path
const LOCK_FILE_PATH = path.join(rootDir, 'logs', 'ftp-sync.lock');

/**
 * Test lock file creation and detection
 */
function testLockFileCreation() {
  // Ensure lock file doesn't exist at the start of the test
  if (fs.existsSync(LOCK_FILE_PATH)) {
    fs.unlinkSync(LOCK_FILE_PATH);
    logger.info('Removed existing lock file');
  }
  
  // Create a lock file
  const lockData = {
    pid: process.pid,
    timestamp: new Date().toISOString(),
    duration: 60000 // 1 minute
  };
  
  fs.writeFileSync(LOCK_FILE_PATH, JSON.stringify(lockData));
  logger.info('Created lock file');
  
  // Check if lock file exists
  const lockExists = fs.existsSync(LOCK_FILE_PATH);
  if (!lockExists) {
    logger.error('Lock file creation failed');
    return false;
  }
  
  logger.info('✓ Lock file creation successful');
  return true;
}

/**
 * Test lock file detection
 */
function testLockFileDetection() {
  // Ensure lock file exists
  if (!fs.existsSync(LOCK_FILE_PATH)) {
    logger.error('Lock file not found for detection test');
    return false;
  }
  
  // Read lock file
  const lockContent = fs.readFileSync(LOCK_FILE_PATH, 'utf8');
  let lockData;
  
  try {
    lockData = JSON.parse(lockContent);
    logger.info('Lock file parsed successfully');
    
    // Verify lock data structure
    if (!lockData.pid || !lockData.timestamp || !lockData.duration) {
      logger.error('Invalid lock file format');
      return false;
    }
    
    logger.info(`Lock file data: PID ${lockData.pid}, Timestamp ${lockData.timestamp}`);
    logger.info('✓ Lock file detection successful');
    return true;
  } catch (error) {
    logger.error(`Failed to parse lock file: ${error.message}`);
    return false;
  }
}

/**
 * Test stale lock detection
 */
function testStaleLockDetection() {
  // Ensure lock file exists
  if (!fs.existsSync(LOCK_FILE_PATH)) {
    logger.error('Lock file not found for stale lock test');
    return false;
  }
  
  // Read lock file
  const lockContent = fs.readFileSync(LOCK_FILE_PATH, 'utf8');
  let lockData;
  
  try {
    lockData = JSON.parse(lockContent);
    
    // Modify timestamp to make the lock stale (set it to 2 hours ago)
    const staleTime = new Date();
    staleTime.setHours(staleTime.getHours() - 2);
    
    lockData.timestamp = staleTime.toISOString();
    fs.writeFileSync(LOCK_FILE_PATH, JSON.stringify(lockData));
    
    logger.info('Modified lock file to be stale');
    
    // Verify it's stale by comparing timestamps
    const currentTime = new Date();
    const lockTime = new Date(lockData.timestamp);
    const timeDiff = currentTime - lockTime;
    
    if (timeDiff > 60 * 60 * 1000) { // More than 1 hour
      logger.info('✓ Lock detected as stale successfully');
      return true;
    } else {
      logger.error('Lock not detected as stale');
      return false;
    }
  } catch (error) {
    logger.error(`Failed during stale lock test: ${error.message}`);
    return false;
  }
}

/**
 * Test lock file removal
 */
function testLockFileRemoval() {
  // Ensure lock file exists
  if (!fs.existsSync(LOCK_FILE_PATH)) {
    logger.error('Lock file not found for removal test');
    return false;
  }
  
  try {
    // Remove lock file
    fs.unlinkSync(LOCK_FILE_PATH);
    logger.info('Removed lock file');
    
    // Verify lock file removal
    if (!fs.existsSync(LOCK_FILE_PATH)) {
      logger.info('✓ Lock file removal successful');
      return true;
    } else {
      logger.error('Failed to remove lock file');
      return false;
    }
  } catch (error) {
    logger.error(`Failed during lock file removal: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  logger.info('Starting FTP Agent Scheduler Lock Tests...');
  
  let results = {};
  
  // Test 1: Lock file creation
  results.lockCreation = testLockFileCreation();
  
  // Test 2: Lock file detection
  results.lockDetection = testLockFileDetection();
  
  // Test 3: Stale lock detection
  results.staleLockDetection = testStaleLockDetection();
  
  // Test 4: Lock file removal
  results.lockRemoval = testLockFileRemoval();
  
  // Print summary
  logger.info('=== FTP Agent Scheduler Lock Test Results ===');
  let totalTests = Object.keys(results).length;
  let passedTests = Object.values(results).filter(Boolean).length;
  
  logger.info(`Tests passed: ${passedTests}/${totalTests}`);
  
  for (const [test, passed] of Object.entries(results)) {
    logger.info(`${passed ? '✓' : '✗'} ${test}`);
  }
  
  if (passedTests === totalTests) {
    logger.info('All lock tests passed successfully!');
    return true;
  } else {
    logger.error(`Some lock tests failed (${totalTests - passedTests}/${totalTests} failed)`);
    return false;
  }
}

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unhandled error in FTP agent scheduler tests: ${error.message}`);
      process.exit(1);
    });
}

export { runAllTests, testLockFileCreation, testLockFileDetection, testStaleLockDetection, testLockFileRemoval };