/**
 * Authentication Setup for E2E Tests
 * Creates storage states for different user roles
 */

import { test as setup, expect } from '@playwright/test';
import { fixtures } from '../fixtures';

// Admin user setup
setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[data-testid="email-input"]', fixtures.users.admin.email);
  await page.fill('[data-testid="password-input"]', 'admin-password');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-role"]')).toContainText('EnterpriseAdmin');

  await page.context().storageState({ path: 'tests/e2e/states/admin.json' });
});

// Assessor user setup
setup('authenticate as assessor', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[data-testid="email-input"]', fixtures.users.assessor.email);
  await page.fill('[data-testid="password-input"]', 'assessor-password');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-role"]')).toContainText('Assessor');

  await page.context().storageState({ path: 'tests/e2e/states/assessor.json' });
});

// Viewer user setup
setup('authenticate as viewer', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[data-testid="email-input"]', fixtures.users.viewer.email);
  await page.fill('[data-testid="password-input"]', 'viewer-password');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-role"]')).toContainText('User');

  await page.context().storageState({ path: 'tests/e2e/states/viewer.json' });
});

// Guest user setup (no authentication)
setup('setup guest access', async ({ page }) => {
  await page.goto('/');

  // Accept any terms/conditions
  const acceptButton = page.locator('[data-testid="accept-terms-btn"]');
  if ((await acceptButton.count()) > 0) {
    await acceptButton.click();
  }

  await page.context().storageState({ path: 'tests/e2e/states/guest.json' });
});
