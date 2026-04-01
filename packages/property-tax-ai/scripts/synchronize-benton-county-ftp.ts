#!/usr/bin/env node
/**
 * Benton County FTP Synchronization Script
 * 
 * This script provides a command-line interface for synchronizing data from the
 * Benton County SpatialEst FTP server. It includes options for scheduling,
 * manual synchronization, and detailed status reporting.
 * 
 * Usage:
 *   ts-node scripts/synchronize-benton-county-ftp.ts [options] [command]
 * 
 * Commands:
 *   sync [path]             Synchronize data from specified path (or all if not specified)
 *   status                  Show current FTP connection and sync status
 *   schedule [options]      Configure automatic synchronization schedule
 * 
 * Options:
 *   --silent                Run with minimal output (useful for cron jobs)
 *   --verbose               Show detailed debug information
 *   --force                 Force synchronization even if already in progress
 *   --dryrun                Show what would be synchronized without downloading
 *   --retry=N               Set maximum retry attempts (default: 3)
 *   --timeout=N             Set connection timeout in seconds (default: 30)
 * 
 * Schedule Options:
 *   --enable                Enable scheduled synchronization
 *   --disable               Disable scheduled synchronization
 *   --interval=N            Set interval in hours (1-168)
 *   --once                  Run once immediately then exit
 * 
 * Examples:
 *   ts-node scripts/synchronize-benton-county-ftp.ts sync /valuations
 *   ts-node scripts/synchronize-benton-county-ftp.ts schedule --enable --interval=24
 *   ts-node scripts/synchronize-benton-county-ftp.ts --silent sync
 */

import path from 'path';
import fs from 'fs';
import { FtpDataAgent } from '../server/services/agents/ftp-data-agent';
import { logger } from '../server/utils/logger';
import { config } from '../server/config';
import { StorageFactory } from '../server/storage-factory';

// Configure logger
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: Record<string, any> = {
  silent: false,
  verbose: false,
  force: false,
  dryrun: false,
  retry: 3,
  timeout: 30,
  enable: false,
  disable: false,
  interval: null,
  once: false
};

// Command and path variables
let command: string | null = null;
let remotePath: string | null = null;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  // Parse options (start with --)
  if (arg.startsWith('--')) {
    const optionName = arg.substring(2);
    if (optionName.includes('=')) {
      const [name, value] = optionName.split('=');
      options[name] = value;
    } else {
      options[optionName] = true;
    }
    continue;
  }
  
  // Parse command and path
  if (!command) {
    command = arg;
  } else if (command === 'sync' && !remotePath) {
    remotePath = arg;
  }
}

// Configure logging based on options
if (options.silent) {
  logger.level = 'error';
} else if (options.verbose) {
  logger.level = 'debug';
} else {
  logger.level = 'info';
}

// Verify FTP environment variables
function checkEnvironment(): boolean {
  const requiredVars = ['FTP_HOST', 'FTP_USERNAME', 'FTP_PASSWORD'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error(`Error: Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please ensure these variables are set in your environment or .env file.');
    return false;
  }
  
  return true;
}

// Initialize FTP agent
async function initializeAgent(): Promise<FtpDataAgent> {
  const storage = await StorageFactory.createStorage();
  
  // Initialize FTP agent with config options
  const ftpAgent = new FtpDataAgent(storage);
  await ftpAgent.initialize();
  
  // Apply command line options to agent config
  if (options.retry) {
    ftpAgent.setRetryAttempts(parseInt(options.retry, 10));
  }
  
  if (options.timeout) {
    ftpAgent.setTimeout(parseInt(options.timeout, 10) * 1000);
  }
  
  return ftpAgent;
}

// Format time for display
function formatTime(date: Date | null): string {
  if (!date) return 'Never';
  return date.toLocaleString();
}

// Format duration for display
function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

// Show current FTP agent status
async function showStatus(ftpAgent: FtpDataAgent): Promise<void> {
  if (options.silent) return;
  
  const status = await ftpAgent.getFtpStatus();
  const scheduleInfo = await ftpAgent.getSyncScheduleInfo();
  
  console.log('\n=== Benton County FTP Synchronization Status ===\n');
  
  // Connection status
  console.log('Connection:');
  console.log(`  Status: ${status.connected ? 'Connected' : 'Disconnected'}`);
  console.log(`  Host: ${process.env.FTP_HOST || 'Not configured'}`);
  console.log(`  Last connection: ${formatTime(status.lastConnectionTime)}`);
  
  // Synchronization status
  console.log('\nSynchronization:');
  console.log(`  Status: ${status.inProgress ? 'In Progress' : 'Idle'}`);
  console.log(`  Last sync: ${formatTime(status.lastSyncTime)}`);
  if (status.lastSyncDuration) {
    console.log(`  Last duration: ${formatDuration(status.lastSyncDuration)}`);
  }
  console.log(`  Success rate: ${status.successRate || 0}%`);
  
  // Schedule information
  console.log('\nSchedule:');
  console.log(`  Status: ${scheduleInfo.enabled ? 'Enabled' : 'Disabled'}`);
  if (scheduleInfo.enabled) {
    console.log(`  Interval: ${scheduleInfo.intervalHours} hours`);
    console.log(`  Next sync: ${formatTime(scheduleInfo.nextScheduledSync)}`);
  }
  
  // Statistics
  console.log('\nStatistics:');
  console.log(`  Files downloaded: ${status.filesDownloaded || 0}`);
  console.log(`  Bytes transferred: ${status.bytesTransferred ? (status.bytesTransferred / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'}`);
  console.log(`  Successful syncs: ${status.successfulSyncs || 0}`);
  console.log(`  Failed syncs: ${status.failedSyncs || 0}`);
  
  console.log('\n');
}

// Configure synchronization schedule
async function configureSchedule(ftpAgent: FtpDataAgent): Promise<void> {
  const scheduleOptions: any = {};
  
  if (options.enable) {
    scheduleOptions.enabled = true;
  }
  
  if (options.disable) {
    scheduleOptions.enabled = false;
  }
  
  if (options.interval) {
    const interval = parseInt(options.interval, 10);
    if (isNaN(interval) || interval < 1 || interval > 168) {
      console.error('Error: Interval must be a number between 1 and 168 hours');
      process.exit(1);
    }
    scheduleOptions.intervalHours = interval;
  }
  
  if (options.once) {
    scheduleOptions.runOnce = true;
  }
  
  try {
    await ftpAgent.scheduleFtpSync(scheduleOptions);
    
    if (!options.silent) {
      console.log('Schedule configuration updated successfully.');
      await showStatus(ftpAgent);
    }
  } catch (error: any) {
    logger.error('Failed to configure schedule:', error);
    console.error(`Error: Failed to configure schedule: ${error.message}`);
    process.exit(1);
  }
}

// Synchronize data from FTP server
async function synchronizeData(ftpAgent: FtpDataAgent, path: string | null): Promise<void> {
  try {
    if (!options.silent) {
      console.log(`Starting synchronization${path ? ` for ${path}` : ''}...`);
    }
    
    const syncOptions = {
      path: path || '/',
      force: options.force || false,
      dryRun: options.dryrun || false
    };
    
    const result = await ftpAgent.synchronizeFtpData(syncOptions);
    
    if (!options.silent) {
      console.log('Synchronization completed successfully.');
      console.log(`Files processed: ${result.filesProcessed}`);
      console.log(`Files downloaded: ${result.filesDownloaded}`);
      console.log(`Bytes transferred: ${(result.bytesTransferred / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Duration: ${formatDuration(result.duration)}`);
      
      if (options.dryrun) {
        console.log('\nNote: This was a dry run. No files were actually downloaded.');
      }
    }
  } catch (error: any) {
    logger.error('Synchronization failed:', error);
    console.error(`Error: Synchronization failed: ${error.message}`);
    process.exit(1);
  }
}

// Main function to execute the command
async function main(): Promise<void> {
  // Check environment variables
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  try {
    // Initialize FTP agent
    const ftpAgent = await initializeAgent();
    
    // Execute the appropriate command
    switch (command) {
      case 'sync':
        await synchronizeData(ftpAgent, remotePath);
        break;
      
      case 'status':
        await showStatus(ftpAgent);
        break;
      
      case 'schedule':
        await configureSchedule(ftpAgent);
        break;
      
      default:
        // Default to showing status if no command provided
        if (!command) {
          await showStatus(ftpAgent);
        } else {
          console.error(`Error: Unknown command '${command}'`);
          console.error('Valid commands: sync, status, schedule');
          process.exit(1);
        }
        break;
    }
    
    // Exit cleanly
    process.exit(0);
  } catch (error: any) {
    logger.error('Error executing command:', error);
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error('Unhandled error:', error);
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});