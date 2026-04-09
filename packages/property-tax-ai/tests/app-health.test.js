/**
 * Application Health Tests
 * 
 * These tests verify that the core application is functioning correctly:
 * - Server starts up
 * - Basic API endpoints respond properly
 * - Database connection is working
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
  
  // Log server output for debugging
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server stdout: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data}`);
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
describe('Application Health Tests', () => {
  beforeAll(async () => {
    await startServer();
  }, 10000);
  
  afterAll(() => {
    stopServer();
  });
  
  test('Server responds to basic API request', async () => {
    const response = await fetch(`${BASE_URL}/api/properties`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
  
  test('Server has database connection', async () => {
    // This test assumes the /api/properties endpoint works if DB is connected
    const response = await fetch(`${BASE_URL}/api/properties`);
    expect(response.status).toBe(200);
  });
  
  test('System activities endpoint works', async () => {
    const response = await fetch(`${BASE_URL}/api/system-activities`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
  
  test('AI agents endpoint works', async () => {
    const response = await fetch(`${BASE_URL}/api/ai-agents`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});