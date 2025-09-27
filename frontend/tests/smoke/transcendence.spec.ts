import { test, expect } from '@playwright/test';

test('Transcendence toggle toggles', async ({ page }) => {
  const frontendPort = process.env.TF_FRONTEND_PORT || '3000';
  await page.goto(`http://localhost:${frontendPort}`);
  const btn = page.getByRole('button', { name: /transcendence/i });
  await expect(btn).toBeVisible();
  const before = await btn.textContent();
  await btn.click();
  await expect(btn).not.toHaveText(before ?? '');
});