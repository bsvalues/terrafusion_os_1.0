/**
 * PACS Module Integration Tests
 * 
 * These tests verify that the PACS Module integration functions correctly:
 * - Retrieving PACS modules
 * - Retrieving categorized PACS modules
 * - Getting PACS module details
 * - Module synchronization
 */
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

let serverProcess;
const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to start the server
async function startServer() {
  console.log('Starting test server...');
  
  serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  });
  
  // Wait for server to start
  await setTimeout(5000);
  
  return serverProcess;
}

// Helper to stop the server
function stopServer() {
  if (serverProcess) {
    console.log('Stopping test server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// Tests
describe('PACS Module Integration Tests', () => {
  beforeAll(async () => {
    await startServer();
  }, 10000);
  
  afterAll(() => {
    stopServer();
  });
  
  test('PACS modules endpoint returns modules', async () => {
    const response = await fetch(`${BASE_URL}/api/pacs-modules`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    
    // If we have modules, check their structure
    if (data.length > 0) {
      const module = data[0];
      expect(module.id).toBeDefined();
      expect(module.moduleName).toBeDefined();
      expect(module.source).toBeDefined();
      expect(module.integration).toBeDefined();
    }
  });
  
  test('PACS modules by category endpoint works', async () => {
    const response = await fetch(`${BASE_URL}/api/pacs-modules/by-category`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
  
  test('PACS module detail endpoint works', async () => {
    // First get all modules to find a valid ID
    const modulesResponse = await fetch(`${BASE_URL}/api/pacs-modules`);
    const modules = await modulesResponse.json();
    
    // Skip if no modules are available
    if (modules.length === 0) {
      console.log('Skipping module detail test - no modules available');
      return;
    }
    
    const moduleId = modules[0].id;
    const response = await fetch(`${BASE_URL}/api/pacs-modules/${moduleId}`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.id).toBe(moduleId);
    expect(data.moduleName).toBeDefined();
  });
  
  test('PACS MCP tool execution endpoint works', async () => {
    const response = await fetch(`${BASE_URL}/api/mcp/tools`);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});