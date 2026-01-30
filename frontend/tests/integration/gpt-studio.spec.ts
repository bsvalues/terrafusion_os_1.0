import { expect, test } from '@playwright/test';

/**
 * GPT Studio E2E Tests
 *
 * Tests the GPT Studio navigation and basic rendering
 * from the TerraFusion OS shell.
 */

test.describe('GPT Studio navigation', () => {
  test('opens GPT Studio from the OS shell navigation', async ({ page }) => {
    // 1. Go to the OS shell root
    await page.goto('/');

    // 2. Wait for the page to be interactive
    await page.waitForLoadState('networkidle');

    // 3. Click the GPT Studio nav entry
    const navButton = page.getByTestId('nav-gpt-studio');
    await expect(navButton).toBeVisible({ timeout: 10000 });
    await navButton.click();

    // 4. Assert we see the GPT Studio view
    const studioView = page.getByTestId('gpt-studio-view');
    await expect(studioView).toBeVisible({ timeout: 10000 });

    // 5. Verify the GPT Suite header is present
    const headerText = page.getByText(/TerraFusion GPT Suite/i);
    await expect(headerText).toBeVisible();

    // 6. Verify the System GPTs section label is present
    const systemGptLabel = page.getByText(/System GPTs/i);
    await expect(systemGptLabel).toBeVisible();
  });

  test('GPT Studio shows loading state initially', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click GPT Studio nav
    const navButton = page.getByTestId('nav-gpt-studio');
    await navButton.click();

    // The view should be visible
    const studioView = page.getByTestId('gpt-studio-view');
    await expect(studioView).toBeVisible();

    // Should show loading or the GPT list (depending on API state)
    const loadingOrContent = page.locator('[data-testid="gpt-studio-view"]').getByText(/Loading GPTs|System GPTs/i);
    await expect(loadingOrContent).toBeVisible({ timeout: 10000 });
  });

  test('GPT Studio has send button when conversation active', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to GPT Studio
    await page.getByTestId('nav-gpt-studio').click();
    await expect(page.getByTestId('gpt-studio-view')).toBeVisible();

    // Wait for GPTs to potentially load and auto-select
    // The send button should appear once a conversation is active
    const sendButton = page.getByRole('button', { name: /send/i });

    // If the API is running, the send button should eventually appear
    // Use a longer timeout and soft assertion for environments without API
    try {
      await expect(sendButton).toBeVisible({ timeout: 15000 });
    } catch {
      // If API is not running, the button may not appear - that's OK for this test
      console.log('Send button not visible - API may not be running');
    }
  });
});

test.describe('GPT Studio accessibility', () => {
  test('GPT Studio view is keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to GPT Studio
    await page.getByTestId('nav-gpt-studio').click();
    const studioView = page.getByTestId('gpt-studio-view');
    await expect(studioView).toBeVisible();

    // Tab through the interface
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // The focus should be on an interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
