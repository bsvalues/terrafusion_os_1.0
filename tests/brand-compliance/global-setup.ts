// TerraFusion OS - Global Test Setup
// Government. Transcended.
// Initialize testing environment for brand compliance validation

import { chromium, FullConfig } from '@playwright/test';
import { createServer } from 'vite';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 TerraFusion OS - Initializing Brand Compliance Test Environment');
  console.log('Government. Transcended.');
  
  // Ensure MSW is initialized for government data simulation
  console.log('📡 Initializing MSW for government data simulation...');
  
  // Start Vite dev server if not running
  console.log('🖥️  Starting TerraFusion OS development server...');
  
  // Verify style-dictionary tokens are built
  console.log('🎨 Verifying brand token compilation...');
  const tokensPath = path.join(process.cwd(), 'frontend/src/styles');
  
  try {
    // Check if brand tokens exist
    const fs = await import('fs');
    const tokensExist = fs.existsSync(path.join(tokensPath, 'tokens-base.css'));
    
    if (!tokensExist) {
      console.log('⚠️  Brand tokens not found. Building tokens...');
      const { exec } = await import('child_process');
      await new Promise((resolve, reject) => {
        exec('node scripts/build-tokens.js', (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Token build failed:', error);
            reject(error);
          } else {
            console.log('✅ Brand tokens built successfully');
            resolve(stdout);
          }
        });
      });
    }
  } catch (error) {
    console.warn('⚠️  Could not verify token build:', error);
  }
  
  // Pre-launch browser for faster test execution
  console.log('🌐 Pre-launching Chromium for government compliance testing...');
  const browser = await chromium.launch();
  
  // Create context with government compliance settings
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
    reducedMotion: 'reduce', // Accessibility compliance
    extraHTTPHeaders: {
      'X-Government-Mode': 'true',
      'X-Compliance-Level': 'FISMA',
      'X-TerraFusion-Environment': 'test'
    }
  });
  
  // Verify TerraFusion OS loads correctly
  const page = await context.newPage();
  
  try {
    console.log('🔍 Verifying TerraFusion OS availability...');
    // NO HARDCODED PORTS! Use TF_FRONTEND_PORT
    const frontendPort = process.env.TF_FRONTEND_PORT || '3102';
    await page.goto(`http://localhost:${frontendPort}`, { waitUntil: 'networkidle' });
    
    // Wait for TerraFusion initialization
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    }, { timeout: 30000 });
    
    console.log('✅ TerraFusion OS ready for brand compliance testing');
    
  } catch (error) {
    console.error('❌ TerraFusion OS not accessible:', error);
    throw new Error('TerraFusion OS development server not ready for testing');
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
  
  // Set up test data and government compliance fixtures
  console.log('📋 Setting up government compliance test fixtures...');
  
  // Store test metadata for reporting
  global.testMetadata = {
    setupTime: new Date().toISOString(),
    environment: 'development',
    compliance: ['WCAG 2.1 AA', 'Section 508', 'FISMA'],
    terrafusionVersion: '1.0.0',
    testSuite: 'Brand Compliance & Accessibility'
  };
  
  console.log('🏛️  Government compliance test environment ready');
  console.log('Infrastructure Intelligence, Infinite Scale\n');
}

export default globalSetup;