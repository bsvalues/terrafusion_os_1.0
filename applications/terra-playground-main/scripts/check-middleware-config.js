/**
 * Middleware & Server Configuration Checker
 *
 * This script analyzes the middleware stack and server configuration
 * to detect issues like missing CORS settings, incorrect route registration,
 * or other middleware-related problems.
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Determine the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if CORS middleware is properly configured
 */
async function checkCorsConfiguration() {
  console.log('Checking CORS configuration...');

  // Try to find app.js or server.js or main server file
  const serverFilesSearch = [
    './server/app.js',
    './server/index.js',
    './server/server.js',
    './app.js',
    './index.js',
    './server.js',
  ];

  let corsConfigFound = false;
  let corsPackageImported = false;

  for (const filePath of serverFilesSearch) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`Found server file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for cors package import
        if (content.includes('import cors from') || content.includes("require('cors')")) {
          console.log('CORS package import found');
          corsPackageImported = true;
        }

        // Check for CORS middleware usage
        if (content.includes('app.use(cors') || content.includes('.use(cors')) {
          console.log('CORS middleware configuration found');
          corsConfigFound = true;

          // Check if CORS has headers configured
          if (
            content.includes('origin:') ||
            content.includes('methods:') ||
            content.includes('allowedHeaders:') ||
            content.includes('credentials:')
          ) {
            console.log('CORS header configuration found');
          } else {
            console.warn('CORS middleware is used but may not have specific configuration');
          }
        }
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  if (!corsPackageImported) {
    console.error('CORS package might not be imported');
  }

  if (!corsConfigFound) {
    console.error('CORS middleware configuration not found');
  }

  return corsConfigFound;
}

/**
 * Check if routes are registered in the correct order
 */
async function checkRouteRegistration() {
  console.log('\nChecking route registration...');

  const serverFilesSearch = [
    './server/app.js',
    './server/index.js',
    './server/server.js',
    './app.js',
    './index.js',
    './server.js',
  ];

  for (const filePath of serverFilesSearch) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`Examining routes in: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for route registrations
        const routeMatches = content.match(/app\.use\(['"]\/(.*?)['"]/g) || [];
        if (routeMatches.length > 0) {
          console.log('Route registrations found:');
          routeMatches.forEach(route => {
            console.log(` - ${route}`);
          });

          // Look for catchall routes that might interfere with API routes
          const catchAllMatches =
            content.match(
              /app\.use\(\s*['"]?\*['"]?|app\.use\(\s*\(req,\s*res\)\s*=>|app\.use\(\s*function\s*\(req,\s*res\)/g
            ) || [];
          if (catchAllMatches.length > 0) {
            console.warn(
              'Potential catchall route handlers found that might intercept API requests:'
            );
            catchAllMatches.forEach(match => {
              console.warn(` - ${match}`);
            });
          }
        } else {
          console.warn('No explicit route registrations found in this file');
        }
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }
}

/**
 * Check route handlers in specific route files
 */
async function checkRouteHandlers() {
  console.log('\nChecking route handlers...');

  // Directory paths where route files might be located
  const routeDirs = ['./server/routes', './routes'];

  for (const dirPath of routeDirs) {
    try {
      if (fs.existsSync(dirPath)) {
        console.log(`Found routes directory: ${dirPath}`);

        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          if (file.endsWith('.js') || file.endsWith('.ts')) {
            console.log(`Examining route file: ${file}`);
            const filePath = path.join(dirPath, file);
            const content = fs.readFileSync(filePath, 'utf8');

            // Count route handlers
            const getHandlers = (content.match(/\.(get|GET)\(/g) || []).length;
            const postHandlers = (content.match(/\.(post|POST)\(/g) || []).length;
            const putHandlers = (content.match(/\.(put|PUT)\(/g) || []).length;
            const deleteHandlers = (content.match(/\.(delete|DELETE)\(/g) || []).length;

            console.log(`Route handlers in ${file}:`);
            console.log(` - GET: ${getHandlers}`);
            console.log(` - POST: ${postHandlers}`);
            console.log(` - PUT: ${putHandlers}`);
            console.log(` - DELETE: ${deleteHandlers}`);

            // Look for error handling
            const hasErrorHandling =
              content.includes('catch') &&
              (content.includes('next(error)') ||
                content.includes('res.status') ||
                content.includes('res.json'));

            if (!hasErrorHandling) {
              console.warn(`Warning: ${file} may lack proper error handling in routes`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error analyzing routes directory ${dirPath}:`, error);
    }
  }
}

/**
 * Check WebSocket configuration
 */
async function checkWebSocketConfiguration() {
  console.log('\nChecking WebSocket configuration...');

  const serverFilesSearch = [
    './server/app.js',
    './server/index.js',
    './server/server.js',
    './server/socket.js',
    './server/websocket.js',
    './app.js',
    './index.js',
    './server.js',
  ];

  let wsConfigFound = false;

  for (const filePath of serverFilesSearch) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`Examining WebSocket config in: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for WebSocket imports
        if (
          content.includes('import WebSocket') ||
          content.includes("require('ws')") ||
          content.includes('import * as WebSocket') ||
          content.includes('import { WebSocketServer }')
        ) {
          console.log('WebSocket import found');

          // Check for WebSocket server creation
          if (
            content.includes('new WebSocket.Server') ||
            content.includes('new WebSocketServer') ||
            content.includes('socket.io')
          ) {
            console.log('WebSocket server initialization found');
            wsConfigFound = true;

            // Check for specific paths
            const pathMatches = content.match(/path\s*:\s*['"]\/(.+?)['"]/g) || [];
            if (pathMatches.length > 0) {
              console.log('WebSocket paths:');
              pathMatches.forEach(path => {
                console.log(` - ${path}`);
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  if (!wsConfigFound) {
    console.error('No WebSocket server configuration found');
  }

  return wsConfigFound;
}

/**
 * Check if there's a frontend proxy configuration
 */
async function checkFrontendProxyConfig() {
  console.log('\nChecking frontend proxy configuration...');

  // Check in common proxy config files
  const proxyConfigFiles = [
    './vite.config.js',
    './vite.config.ts',
    './server/vite.ts',
    './client/vite.config.js',
    './client/vite.config.ts',
  ];

  let proxyConfigFound = false;

  for (const filePath of proxyConfigFiles) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`Found potential proxy config file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for proxy configuration
        if (
          content.includes('proxy:') ||
          (content.includes('server: {') && content.includes('proxy:'))
        ) {
          console.log('Frontend proxy configuration found');
          proxyConfigFound = true;

          // Check for specific API routes
          const apiProxyMatches = content.match(/['"]\/api\/.+?['"]/g) || [];
          if (apiProxyMatches.length > 0) {
            console.log('API proxy routes:');
            apiProxyMatches.forEach(route => {
              console.log(` - ${route}`);
            });
          } else {
            console.warn('No specific API proxy routes found');
          }
        }
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  if (!proxyConfigFound) {
    console.warn('No frontend proxy configuration found in Vite config files');
  }

  return proxyConfigFound;
}

/**
 * Check for any agent system configuration issues
 */
async function checkAgentSystemConfig() {
  console.log('\nChecking agent system configuration...');

  const agentSystemFiles = [
    './server/services/agent-system.ts',
    './server/services/agent-system.js',
  ];

  for (const filePath of agentSystemFiles) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`Found agent system file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for essential components
        if (content.includes('initialize') || content.includes('init')) {
          console.log('Agent system initialization method found');
        } else {
          console.warn('No clear initialization method found for agent system');
        }

        if (content.includes('WebSocket') || content.includes('socket.io')) {
          console.log('Agent system WebSocket integration found');
        } else {
          console.warn('No WebSocket integration found in agent system');
        }

        if (content.includes('registerAgent') || content.includes('addAgent')) {
          console.log('Agent registration method found');
        } else {
          console.warn('No clear agent registration method found');
        }
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }
}

// Run all checks
async function runAllChecks() {
  console.log('===== STARTING SERVER CONFIGURATION CHECKS =====\n');

  try {
    await checkCorsConfiguration();
    await checkRouteRegistration();
    await checkRouteHandlers();
    await checkWebSocketConfiguration();
    await checkFrontendProxyConfig();
    await checkAgentSystemConfig();

    console.log('\n===== SERVER CONFIGURATION CHECKS COMPLETED =====');
  } catch (error) {
    console.error('\nUnexpected error during configuration checks:', error);
  }
}

// Run all checks
runAllChecks().catch(console.error);
