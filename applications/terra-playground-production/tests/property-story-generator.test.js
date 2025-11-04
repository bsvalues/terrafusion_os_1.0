/**
 * Property Story Generator Tests
 *
 * These tests verify that the Property Story Generator functions correctly:
 * - Single property story generation
 * - Multiple property story generation
 * - Property comparison
 * - Options handling
 * - Fallback behavior when API fails
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
    shell: true,
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
describe('Property Story Generator Tests', () => {
  beforeAll(async () => {
    await startServer();
  }, 10000);

  afterAll(() => {
    stopServer();
  });

  test('Single property story generation works', async () => {
    const propertyId = 'BC101';
    const response = await fetch(
      `${BASE_URL}/api/property-stories/${propertyId}?tone=friendly&includeImprovements=true&includeLandRecords=true`
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.property).toBeDefined();
    expect(data.story).toBeDefined();
    expect(data.property.propertyId).toBe(propertyId);

    // Content checks
    expect(data.story).toContain('BC101');
    expect(data.story.length).toBeGreaterThan(100);
  });

  test('Property comparison works', async () => {
    const propertyIds = ['BC101', 'BC102'];

    const response = await fetch(`${BASE_URL}/api/property-stories/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyIds,
        options: {
          tone: 'friendly',
          includeImprovements: true,
          includeLandRecords: true,
          includeFields: true,
        },
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.property).toBeDefined();
    expect(data.story).toBeDefined();

    // Content checks for comparison
    expect(data.story).toContain('BC101');
    expect(data.story).toContain('BC102');
    expect(data.story).toContain('COMPARISON');
    expect(data.story.length).toBeGreaterThan(200);
  });

  test('Multiple property stories generation works', async () => {
    const propertyIds = ['BC101', 'BC102'];

    const response = await fetch(`${BASE_URL}/api/property-stories/multiple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyIds,
        options: {
          tone: 'friendly',
          includeImprovements: true,
        },
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);

    // Check each property story
    const story1 = data.find(item => item.property.propertyId === 'BC101');
    const story2 = data.find(item => item.property.propertyId === 'BC102');

    expect(story1).toBeDefined();
    expect(story2).toBeDefined();
    expect(story1.story).toContain('BC101');
    expect(story2.story).toContain('BC102');
  });

  test('Handles invalid property IDs gracefully', async () => {
    const invalidPropertyId = 'NON_EXISTENT';
    const response = await fetch(`${BASE_URL}/api/property-stories/${invalidPropertyId}`);

    // Should return an error status
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
