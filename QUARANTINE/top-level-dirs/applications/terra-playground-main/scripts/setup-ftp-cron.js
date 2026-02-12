/**
 * FTP Cron Job Setup Script
 *
 * This script sets up a scheduled task to run the FTP synchronization process
 * at regular intervals. It uses node-cron to handle the scheduling.
 */

import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { synchronizeBentonCountyFTP } from './synchronize-benton-county-ftp.js';
import { logger } from '../server/utils/logger.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Create locks directory if it doesn't exist
const locksDir = path.join(rootDir, 'logs', 'locks');
if (!fs.existsSync(locksDir)) {
  fs.mkdirSync(locksDir, { recursive: true });
}

// Lock file path for preventing overlapping jobs
const lockFilePath = path.join(locksDir, 'ftp-sync.lock');

// Flag for tracking if a job is already running
let isJobRunning = false;

/**
 * Run the FTP sync process
 *
 * @param {boolean} oneTimeSync If true, this is a one-time sync rather than a scheduled job
 */
function runFtpSync(oneTimeSync = false) {
  // Check if a job is already running
  if (isJobRunning) {
    logger.warn('FTP sync job is already running, skipping this execution');
    return;
  }

  // Check if lock file exists (additional safety check for multiple processes)
  if (fs.existsSync(lockFilePath)) {
    const lockStats = fs.statSync(lockFilePath);
    const lockAgeHours = (Date.now() - lockStats.mtimeMs) / (1000 * 60 * 60);

    // If lock file is older than 6 hours, it's likely a stale lock
    if (lockAgeHours < 6) {
      logger.warn(
        `FTP sync lock file exists (created ${lockAgeHours.toFixed(2)} hours ago), skipping this execution`
      );
      return;
    } else {
      logger.warn(`Removing stale FTP sync lock file (${lockAgeHours.toFixed(2)} hours old)`);
      try {
        fs.unlinkSync(lockFilePath);
      } catch (error) {
        logger.error(`Failed to remove stale lock file: ${error.message}`);
        return;
      }
    }
  }

  // Set running flag and create lock file
  isJobRunning = true;
  try {
    fs.writeFileSync(lockFilePath, new Date().toISOString());
  } catch (error) {
    logger.error(`Failed to create lock file: ${error.message}`);
    isJobRunning = false;
    return;
  }

  // Log the start of synchronization
  logger.info(`Starting ${oneTimeSync ? 'one-time' : 'scheduled'} FTP synchronization`);

  // Run the synchronization
  synchronizeBentonCountyFTP()
    .then(result => {
      logger.info(`FTP synchronization completed: ${result.filesDownloaded} files synchronized`);
    })
    .catch(error => {
      logger.error(`FTP synchronization failed: ${error.message}`);
    })
    .finally(() => {
      // Remove lock file and reset running flag
      try {
        if (fs.existsSync(lockFilePath)) {
          fs.unlinkSync(lockFilePath);
        }
      } catch (unlinkError) {
        logger.warn(`Failed to remove lock file: ${unlinkError.message}`);
      }

      isJobRunning = false;
      logger.info('FTP synchronization job finished');
    });
}

/**
 * Schedule the FTP sync job using a cron expression
 *
 * @param {string} cronExpression The cron expression for scheduling
 */
function scheduleFtpSync(cronExpression = '0 */6 * * *') {
  // Default: Every 6 hours
  // Validate the cron expression
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  logger.info(`Scheduling FTP synchronization with cron expression: ${cronExpression}`);

  // Schedule the job
  const job = cron.schedule(cronExpression, () => {
    logger.info(`Running scheduled FTP synchronization (schedule: ${cronExpression})`);
    runFtpSync(false);
  });

  return job;
}

/**
 * Run a one-time sync immediately
 */
function runOneTimeSync() {
  logger.info('Running one-time FTP synchronization');
  runFtpSync(true);
}

// If this script is run directly, start the scheduled job
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check for command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--now') || args.includes('-n')) {
    // Run a one-time sync now
    runOneTimeSync();
  } else if (args.includes('--schedule') || args.includes('-s')) {
    // Get custom schedule if provided
    const scheduleIndex = Math.max(args.indexOf('--schedule'), args.indexOf('-s'));

    let cronExpression = '0 */6 * * *'; // Default: every 6 hours

    if (scheduleIndex !== -1 && args.length > scheduleIndex + 1) {
      cronExpression = args[scheduleIndex + 1];
    }

    // Schedule the job
    const job = scheduleFtpSync(cronExpression);

    // Keep the script running
    console.log(`FTP synchronization scheduled with expression: ${cronExpression}`);
    console.log('Press Ctrl+C to stop the scheduler');
  } else {
    // Print usage
    console.log('Usage:');
    console.log('  node setup-ftp-cron.js --now | -n     Run a one-time sync immediately');
    console.log(
      '  node setup-ftp-cron.js --schedule | -s [expression]   Schedule sync with optional cron expression'
    );
    console.log('Default cron expression (runs every 6 hours): 0 */6 * * *');
  }
}

export { scheduleFtpSync, runOneTimeSync };
