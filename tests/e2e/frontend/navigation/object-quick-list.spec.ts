import { test, expect } from '@playwright/test';

test.describe('OS Object Quick List', () => {
  test('selecting an object surfaces context panels in the right rail', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="object-quick-list"]');

    const rows = page.locator('[data-testid="object-quick-list-row"]');
    await expect(rows.first()).toBeVisible();

    await rows.first().click();

    const panels = page.locator('[data-testid="context-panel"]');
    await expect(panels.first()).toBeVisible();

    const intentLabel = page.locator('[data-testid="right-context-rail-intent"]');
    await expect(intentLabel).toContainText('object_selected');
  });
});
