import { expect, test } from '@playwright/test';

test('uses the authenticated Kitsap public-sales package without lending it to another county', async ({
  page,
}) => {
  const requestedSalesShards: string[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes('/launch-data/washington/sales/by-county/')) {
      requestedSalesShards.push(url.pathname);
    }
  });

  await page.goto('/counties');

  await expect(page.getByRole('heading', { name: 'Washington Counties Hub' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });
  await expect(page.getByText('39 Washington counties', { exact: true })).toBeVisible();
  await expect(page.getByText('0 with verified observed status', { exact: true })).toBeVisible();

  const kitsap = page.getByRole('option', { name: 'Select Kitsap County' });
  await kitsap.click();
  await expect(kitsap).toHaveAttribute('aria-selected', 'true');

  const context = page.getByTestId('selected-county-context');
  await expect(context).toContainText('Kitsap County');
  await expect(context).toContainText('24,585', { timeout: 45_000 });
  await expect(context).toContainText('2026-07-15');
  await expect(context).not.toContainText('No governed public sales state is available');
  await expect(page.getByText('1 with verified observed status', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('24,585');
  const kitsapSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(kitsapSalesForge).toBeEnabled();
  await kitsapSalesForge.click();

  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  const salesForge = page.locator('.sf-workspace');
  await expect(salesForge.getByText('Kitsap County', { exact: true })).toBeVisible();
  await expect(
    salesForge.getByText('Washington launch data package', { exact: true })
  ).toBeVisible();
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  await expect(salesForge.getByRole('tab', { name: 'Queue', exact: true })).toBeVisible();

  await page.goto('/counties');
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });

  const adams = page.getByRole('option', { name: 'Select Adams County' });
  await adams.click();
  await expect(adams).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('selected-county-context')).toContainText('Adams County');
  await expect(page.getByTestId('selected-county-context')).toContainText(
    'No governed public sales state is available for Adams County'
  );

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('Adams County');
  const adamsSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(adamsSalesForge).toBeDisabled();
  await expect(page.getByTestId('forge-county-context')).not.toContainText('24,585');

  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/035.json');
  expect(requestedSalesShards).not.toContain('/launch-data/washington/sales/by-county/001.json');
});
