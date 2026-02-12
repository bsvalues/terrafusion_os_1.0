#!/usr/bin/env node
/**
 * TerraFusionPro Start All Services
 * 
 * This script starts all core services in the correct order
 * with proper environment variable configuration.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting TerraFusionPro Platform...');

// Define services to start and their ports
const services = [
  { name: 'API Gateway', command: 'node', args: ['packages/api/index.js'], port: 5002 },
  { name: 'Property Service', command: 'node', args: ['services/property-service/index.js'], port: 5003 },
  { name: 'User Service', command: 'node', args: ['services/user-service/index.js'], port: 5004 },
  { name: 'Form Service', command: 'node', args: ['services/form-service/index.js'], port: 5005 },
  { name: 'Analysis Service', command: 'node', args: ['services/analysis-service/index.js'], port: 5006 },
  { name: 'Report Service', command: 'node', args: ['services/report-service/index.js'], port: 5007 },
  { name: 'Apollo Federation Gateway', command: 'node', args: ['apps/core-gateway/src/index.js'], port: 4000 },
  { name: 'Web Client', command: 'node', args: ['packages/web-client/index.js'], port: 5000 }
];

// Map to store running processes
const processes = new Map();

// Function to start a service
function startService(service) {
  console.log(`Starting ${service.name} on port ${service.port}...`);
  
  const env = {
    ...process.env,
    PORT: service.port,
    NODE_ENV: 'development',
  };
  
  const proc = spawn(service.command, service.args, {
    env,
    stdio: 'pipe',
    shell: true
  });
  
  processes.set(service.name, proc);
  
  proc.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`[${service.name} ERROR] ${data.toString().trim()}`);
  });
  
  proc.on('close', (code) => {
    console.log(`${service.name} exited with code ${code}`);
    processes.delete(service.name);
    
    // Check if we need to restart the service
    if (code !== 0 && !shuttingDown) {
      console.log(`Restarting ${service.name}...`);
      setTimeout(() => startService(service), 5000);
    }
  });
}

// Start all services
services.forEach(startService);

let shuttingDown = false;

// Handle graceful shutdown
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  
  console.log('\nShutting down all services...');
  
  // Send SIGTERM to all processes
  for (const [name, proc] of processes.entries()) {
    console.log(`Stopping ${name}...`);
    proc.kill('SIGTERM');
  }
  
  // Exit after a timeout
  setTimeout(() => {
    console.log('Shutdown complete');
    process.exit(0);
  }, 5000);
}

// Handle termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

console.log('\n✅ All services started successfully');
console.log('💡 Press Ctrl+C to stop all services');