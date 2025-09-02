/**
 * AI Swarm Coordination Integration Tests
 * Tests real AI swarm service integration and coordination via API
 */

import { test, expect } from '@playwright/test';

test.describe('AI Swarm API Integration', () => {
  const baseURL = 'http://127.0.0.1:5000';

  test('AI Swarm status endpoint returns valid data', async ({ request }) => {
    // Test actual API endpoint
    const response = await request.get(`${baseURL}/api/swarm/status`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('totalAgents');
    expect(data).toHaveProperty('activeAgents');
    expect(data).toHaveProperty('health');
    expect(data.totalAgents).toBeGreaterThan(0);
    expect(typeof data.totalAgents).toBe('number');
    expect(typeof data.activeAgents).toBe('number');
  });

  test('AI Swarm modules endpoint returns module data', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/swarm/modules`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('status');
    }
  });

  test('AI Swarm MCP tools endpoint returns tool data', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/swarm/mcp-tools`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('totalTools');
    expect(data).toHaveProperty('activeTools');
    expect(typeof data.totalTools).toBe('number');
  });

  test('Health endpoint returns system status', async ({ request }) => {
    const response = await request.get(`${baseURL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('modules');
    expect(data.status).toBe('healthy');
  });

  test('Modules endpoint returns module list', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/modules`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('Database status endpoint works', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/database/status`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('isConnected');
    expect(data).toHaveProperty('migrationStatus');
  });

  test('Root endpoint returns API information', async ({ request }) => {
    const response = await request.get(`${baseURL}/`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('version');
    expect(data.name).toContain('Terrafusion');
  });

  test('Test endpoint works', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/test`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('test');
  });
});