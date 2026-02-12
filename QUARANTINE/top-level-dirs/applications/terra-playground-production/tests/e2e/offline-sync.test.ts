/**
 * E2E Tests for Offline Sync and Conflict Resolution
 *
 * This test suite validates offline-first functionality, including:
 * - Editing properties while offline and syncing when reconnected
 * - Conflict detection and resolution when changes collide
 * - UI components for handling conflicts across platforms
 */

import { test, expect, Page } from '@playwright/test';

// Test default property data
const testProperty = {
  id: 'test-property-123',
  address: '123 Test St',
  owner: 'John Doe',
  value: 250000,
  lastInspection: '2025-01-15',
  features: ['3 bedrooms', '2 baths', 'garage'],
  notes: 'Test property',
};

// Updated property data for offline changes
const offlineChanges = {
  address: '123 Updated St',
  owner: 'Jane Smith',
  value: 275000,
  notes: 'Updated offline',
};

// Concurrent changes simulating another user's updates
const concurrentChanges = {
  address: '123 Conflict St',
  owner: 'Bob Johnson',
  value: 300000,
  notes: 'Updated concurrently',
};

// Test setup helper to create a property
async function setupTestProperty(page: Page) {
  // Navigate to property creation page
  await page.goto('/properties/new');

  // Fill in property details
  await page.getByLabel('Property ID').fill(testProperty.id);
  await page.getByLabel('Address').fill(testProperty.address);
  await page.getByLabel('Owner').fill(testProperty.owner);
  await page.getByLabel('Value').fill(testProperty.value.toString());
  await page.getByLabel('Last Inspection').fill(testProperty.lastInspection);
  await page.getByLabel('Features').fill(testProperty.features.join(', '));
  await page.getByLabel('Notes').fill(testProperty.notes);

  // Save the property
  await page.getByRole('button', { name: 'Save Property' }).click();

  // Wait for save confirmation
  await page.waitForSelector('.save-confirmation');
}

test.describe('Offline Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Log in and navigate to properties page
    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Create test property
    await setupTestProperty(page);
  });

  test('edits property while offline and syncs when reconnected', async ({ page, context }) => {
    // Navigate to property editor
    await page.goto(`/properties/edit/${testProperty.id}`);

    // Make sure property loaded correctly
    await expect(page.getByLabel('Address')).toHaveValue(testProperty.address);

    // Go offline
    await context.setOffline(true);

    // Make changes while offline
    await page.getByLabel('Address').fill(offlineChanges.address);
    await page.getByLabel('Owner').fill(offlineChanges.owner);
    await page.getByLabel('Value').fill(offlineChanges.value.toString());
    await page.getByLabel('Notes').fill(offlineChanges.notes);

    // Save while offline
    await page.getByRole('button', { name: 'Save Property' }).click();

    // Verify offline indicator appears
    await expect(page.getByTestId('sync-status-indicator')).toHaveText('Offline');

    // Go back online
    await context.setOffline(false);

    // Wait for sync to complete
    await expect(page.getByTestId('sync-status-indicator')).toHaveText('Synced');

    // Navigate away and back to verify data persisted
    await page.goto('/properties');
    await page.goto(`/properties/edit/${testProperty.id}`);

    // Verify changes were saved and synced
    await expect(page.getByLabel('Address')).toHaveValue(offlineChanges.address);
    await expect(page.getByLabel('Owner')).toHaveValue(offlineChanges.owner);
    await expect(page.getByLabel('Value')).toHaveValue(offlineChanges.value.toString());
    await expect(page.getByLabel('Notes')).toHaveValue(offlineChanges.notes);
  });

  test('detects and resolves conflicts with UI', async ({ page, context, browser }) => {
    // Open first browser context for initial edits
    await page.goto(`/properties/edit/${testProperty.id}`);

    // Create second browser context for concurrent edits
    const newContext = await browser.newContext();
    const secondPage = await newContext.newPage();

    // Log in on second context
    await secondPage.goto('/');
    await secondPage.getByRole('button', { name: 'Login' }).click();
    await secondPage.getByLabel('Username').fill('testuser2');
    await secondPage.getByLabel('Password').fill('password123');
    await secondPage.getByRole('button', { name: 'Submit' }).click();

    // Navigate to same property
    await secondPage.goto(`/properties/edit/${testProperty.id}`);

    // First user goes offline and makes changes
    await context.setOffline(true);
    await page.getByLabel('Address').fill(offlineChanges.address);
    await page.getByLabel('Owner').fill(offlineChanges.owner);
    await page.getByLabel('Value').fill(offlineChanges.value.toString());
    await page.getByLabel('Notes').fill(offlineChanges.notes);
    await page.getByRole('button', { name: 'Save Property' }).click();

    // Second user makes concurrent changes online
    await secondPage.getByLabel('Address').fill(concurrentChanges.address);
    await secondPage.getByLabel('Owner').fill(concurrentChanges.owner);
    await secondPage.getByLabel('Value').fill(concurrentChanges.value.toString());
    await secondPage.getByLabel('Notes').fill(concurrentChanges.notes);
    await secondPage.getByRole('button', { name: 'Save Property' }).click();

    // Wait for second user's changes to save
    await expect(secondPage.getByTestId('sync-status-indicator')).toHaveText('Synced');

    // First user comes back online
    await context.setOffline(false);

    // Conflict UI should appear
    await expect(page.getByTestId('conflict-manager')).toBeVisible();
    await expect(page.getByText('Conflict Detected')).toBeVisible();

    // Verify both versions are displayed
    await expect(page.getByTestId('local-change-address')).toHaveText(offlineChanges.address);
    await expect(page.getByTestId('remote-change-address')).toHaveText(concurrentChanges.address);

    // Resolve conflicts by selecting specific fields from each version
    // Choose local address
    await page.getByTestId('select-local-address').click();
    // Choose remote owner
    await page.getByTestId('select-remote-owner').click();
    // Choose local value
    await page.getByTestId('select-local-value').click();
    // Choose remote notes
    await page.getByTestId('select-remote-notes').click();

    // Resolve conflict
    await page.getByRole('button', { name: 'Resolve Conflict' }).click();

    // Wait for resolution to complete
    await expect(page.getByTestId('sync-status-indicator')).toHaveText('Synced');

    // Verify merged data
    await expect(page.getByLabel('Address')).toHaveValue(offlineChanges.address);
    await expect(page.getByLabel('Owner')).toHaveValue(concurrentChanges.owner);
    await expect(page.getByLabel('Value')).toHaveValue(offlineChanges.value.toString());
    await expect(page.getByLabel('Notes')).toHaveValue(concurrentChanges.notes);

    // Clean up
    await newContext.close();
  });
});
