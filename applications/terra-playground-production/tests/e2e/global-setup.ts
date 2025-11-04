/**
 * Global setup for E2E tests
 *
 * This file runs before tests to set up the environment
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Create a browser and context for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the application
  console.log(`Setting up test environment with baseURL: ${baseURL}`);
  await page.goto(baseURL as string);

  // Add a test property for offline sync tests if needed
  // This ensures we have consistent test data
  try {
    // Check if we're logged in, if not, log in
    if (await page.getByRole('button', { name: 'Login' }).isVisible()) {
      await page.getByRole('button', { name: 'Login' }).click();
      await page.getByLabel('Username').fill('testuser');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Submit' }).click();

      // Wait for login to complete
      await page.waitForSelector('.user-profile', { timeout: 5000 });
    }

    // Navigate to create property page
    await page.goto(`${baseURL}/properties/new`);

    // Create a test property for offline sync tests
    await page.getByLabel('Property ID').fill('test-property-123');
    await page.getByLabel('Address').fill('123 Test St');
    await page.getByLabel('Owner').fill('John Doe');
    await page.getByLabel('Value').fill('250000');
    await page.getByLabel('Last Inspection').fill('2025-01-15');
    await page.getByLabel('Features').fill('3 bedrooms, 2 baths, garage');
    await page.getByLabel('Notes').fill('Test property');

    // Save the property
    await page.getByRole('button', { name: 'Save Property' }).click();

    // Wait for save confirmation
    await page.waitForSelector('.save-confirmation', { timeout: 5000 });

    console.log('Successfully created test property for offline sync tests');
  } catch (error) {
    console.error('Error setting up test property:', error);
  }

  // Close the browser
  await browser.close();
}

export default globalSetup;
