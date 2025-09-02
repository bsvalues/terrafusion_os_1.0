/**
 * Global Setup for E2E Tests
 * Supreme Claude Code Testing Orchestrator
 */

import { chromium, FullConfig } from '@playwright/test';
import { fixtures } from '../fixtures';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Terrafusion OS E2E Test Suite Global Setup');
  
  // Create test directories
  const fs = require('fs').promises;
  const path = require('path');
  
  const directories = [
    'tests/e2e/states',
    'test-results',
    'test-results/playwright-report',
    'test-results/traces',
    'test-results/screenshots',
    'test-results/videos'
  ];
  
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
  
  // Pre-warm the application
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to app to ensure it's running
    await page.goto('http://localhost:3000', { timeout: 60000 });
    
    // Wait for AI swarm initialization
    await page.waitForSelector('[data-testid="ai-swarm-status"]', { timeout: 30000 });
    
    // Verify compliance systems
    await page.waitForSelector('[data-testid="compliance-status"]', { timeout: 10000 });
    
    console.log('✅ Application pre-warmed and ready for testing');
    
  } catch (error) {
    console.error('❌ Failed to pre-warm application:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  // Initialize test data
  console.log('📊 Initializing test data...');
  
  // Create mock database entries
  const mockData = {
    counties: fixtures.counties,
    properties: fixtures.properties,
    users: fixtures.users,
    aiSwarm: fixtures.aiSwarmMetrics,
    quantumMetrics: fixtures.quantumMetrics
  };
  
  await fs.writeFile(
    'test-results/mock-data.json',
    JSON.stringify(mockData, null, 2)
  );
  
  console.log('✅ Global setup complete - Ready for E2E testing');
}

export default globalSetup;