import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow login with valid credentials', async ({ page }) => {
    // Go to the login page
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard or home page
    await expect(page).toHaveURL(/.*dashboard|home.*/);

    // Verify user is logged in (look for user-specific element)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Go to the login page
    await page.goto('/login');

    // Fill in login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL(/.*login.*/);

    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(
      /invalid credentials|incorrect password/i
    );
  });
});
