/**
 * Frontend Error Testing Script
 *
 * This script checks for any frontend errors by accessing different routes
 * and monitoring the console for errors or warnings.
 */

import puppeteer from 'puppeteer';

async function testFrontendForErrors() {
  console.log('Starting frontend error test...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Collect console logs
    page.on('console', message => {
      const type = message.type();
      const text = message.text();

      if (type === 'error' || type === 'warning') {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });

    // Collect JavaScript errors
    page.on('pageerror', error => {
      console.log('[JS ERROR]', error.message);
    });

    // Collect failed network requests
    page.on('requestfailed', request => {
      console.log(`[NETWORK ERROR] ${request.url()} - ${request.failure().errorText}`);
    });

    // Test main pages
    const routesToTest = ['/', '/map', '/properties', '/agents', '/dashboard', '/system'];

    for (const route of routesToTest) {
      try {
        console.log(`Testing route: ${route}`);
        await page.goto(`http://localhost:5000${route}`, {
          timeout: 30000,
          waitUntil: 'networkidle2',
        });
        console.log(`Loaded route: ${route}`);

        // Check for specific DOM errors by evaluating in the page context
        const domErrors = await page.evaluate(() => {
          const errors = [];

          // Check for common React DOM errors
          const reactWarningElements = document.querySelectorAll('[data-warning]');
          if (reactWarningElements.length > 0) {
            errors.push('React warning elements detected');
          }

          // Check for elements with invalid props
          const invalidElements = document.querySelectorAll('[aria-invalid="true"]');
          if (invalidElements.length > 0) {
            errors.push(`${invalidElements.length} elements with invalid attributes detected`);
          }

          return errors;
        });

        if (domErrors.length > 0) {
          console.log(`[DOM ERRORS] on ${route}:`, domErrors);
        } else {
          console.log(`No DOM errors detected on ${route}`);
        }

        // Wait a moment to collect any async errors
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error(`Error loading route ${route}:`, error.message);
      }
    }

    console.log('Frontend error test completed');
  } finally {
    await browser.close();
  }
}

// Execute the test
testFrontendForErrors().catch(console.error);
