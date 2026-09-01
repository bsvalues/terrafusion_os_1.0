import { expect, test } from '@playwright/test';

test('keeps the 39-county assessor journey usable when hosted status stalls', async ({ page }) => {
  let hostedStatusRequested = false;

  await page.route('**/launch-data/washington/counties/status.json', async (route) => {
    hostedStatusRequested = true;
    await new Promise((resolve) => globalThis.setTimeout(resolve, 12_000));
    await route.abort('timedout').catch(() => undefined);
  });

  await page.goto('/counties');

  await expect(page.getByRole('heading', { name: 'Washington Counties Hub' })).toBeVisible();
  await expect(page.getByTestId('counties-hub').getByRole('status')).toContainText(
    'Loading governed Washington county status'
  );
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });
  expect(hostedStatusRequested).toBe(true);

  await expect(
    page.getByText(/A valid same-origin Washington public sales package was not available/i)
  ).toBeVisible();
  await expect(page.getByText('39 Washington counties', { exact: true })).toBeVisible();
  await expect(page.getByText('0 with verified observed status', { exact: true })).toBeVisible();

  const adams = page.getByRole('option', { name: 'Select Adams County' });
  await adams.click();
  await expect(adams).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('selected-county-context')).toContainText('Adams County');
  await expect(page.getByTestId('selected-county-context')).toContainText(
    'No governed public sales state is available for Adams County'
  );

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: /TerraForge/i }).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Adams County/).first()).toBeVisible();
  await expect(
    page.getByText(/sales review.*unavailable|unavailable.*sales review/i).first()
  ).toBeVisible();
});
