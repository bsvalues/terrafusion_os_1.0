import { expect, test } from '@playwright/test';

test('uses the authenticated Chelan, Clark, Kitsap, Lewis, Pierce, Skagit, Snohomish, Thurston, and Whatcom public-sales package without lending it to another county', async ({
  page,
}) => {
  const requestedSalesShards: string[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes('/launch-data/washington/sales/by-county/')) {
      requestedSalesShards.push(url.pathname);
    }
  });

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Washington Counties Hub' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });
  await expect(page.getByText('39 Washington counties', { exact: true })).toBeVisible();
  await expect(page.getByText('0 with verified observed status', { exact: true })).toBeVisible();

  const chelan = page.getByRole('option', { name: 'Select Chelan County' });
  await chelan.click();
  await expect(chelan).toHaveAttribute('aria-selected', 'true');
  const context = page.getByTestId('selected-county-context');
  await expect(context).toContainText('Chelan County');
  await expect(context).toContainText('908', { timeout: 45_000 });
  await expect(context).toContainText('2026-07-31');
  await expect(context).not.toContainText('No governed public sales state is available');

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('908', {
    timeout: 45_000,
  });
  const chelanSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(chelanSalesForge).toBeEnabled();
  await chelanSalesForge.click();
  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  const salesForge = page.locator('.sf-workspace');
  await expect(salesForge.getByText('Chelan County', { exact: true })).toBeVisible();
  await expect(salesForge.getByText('Washington launch data package', { exact: true })).toBeVisible(
    { timeout: 20_000 }
  );
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  await expect(salesForge.getByRole('tab', { name: 'Queue', exact: true })).toBeVisible();

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });

  const clark = page.getByRole('option', { name: 'Select Clark County' });
  await clark.click();
  await expect(clark).toHaveAttribute('aria-selected', 'true');
  await expect(context).toContainText('Clark County');
  await expect(context).toContainText('5,476', { timeout: 45_000 });
  await expect(context).toContainText('2025-12-31');
  await expect(context).not.toContainText('No governed public sales state is available');

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('5,476', {
    timeout: 45_000,
  });
  const clarkSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(clarkSalesForge).toBeEnabled();
  await clarkSalesForge.click();
  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  await expect(salesForge.getByText('Clark County', { exact: true })).toBeVisible();
  await expect(salesForge.getByText('Washington launch data package', { exact: true })).toBeVisible(
    { timeout: 20_000 }
  );
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  const firstClarkSaleRow = salesForge
    .getByRole('table', { name: 'Sale qualification queue' })
    .getByRole('row')
    .nth(1);
  await expect(firstClarkSaleRow).toContainText('986046773', { timeout: 20_000 });
  await expect(firstClarkSaleRow).toContainText('Dec 31, 25');
  await firstClarkSaleRow.click();
  const clarkAddress = salesForge.locator('.sf-detail-field').filter({ hasText: 'Address' });
  await expect(clarkAddress).toHaveText('Address18505 NE 78TH WAY VANCOUVER, WA 98682');
  const clarkYearBuilt = salesForge
    .locator('.sf-detail-field')
    .filter({ hasText: 'Year built (current)' });
  await expect(clarkYearBuilt).toContainText('2018');
  const clarkQualityGrade = salesForge
    .locator('.sf-detail-field')
    .filter({ hasText: 'Quality grade' });
  await expect(clarkQualityGrade).toContainText('Good');
  const clarkLandAcres = salesForge
    .locator('.sf-detail-field')
    .filter({ hasText: 'Land (acres, ToS)' });
  await expect(clarkLandAcres).toContainText('0.2317');
  const clarkLandSqft = salesForge
    .locator('.sf-detail-field')
    .filter({ hasText: 'Land (sqft, ToS)' });
  await expect(clarkLandSqft).toContainText('10,092 sf');

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });

  const kitsap = page.getByRole('option', { name: 'Select Kitsap County' });
  await kitsap.click();
  await expect(kitsap).toHaveAttribute('aria-selected', 'true');

  await expect(context).toContainText('Kitsap County');
  await expect(context).toContainText('24,585', { timeout: 45_000 });
  await expect(context).toContainText('2026-07-15');
  await expect(context).not.toContainText('No governed public sales state is available');
  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('24,585', {
    timeout: 45_000,
  });
  const kitsapSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(kitsapSalesForge).toBeEnabled();
  await kitsapSalesForge.click();

  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  await expect(salesForge.getByText('Kitsap County', { exact: true })).toBeVisible();
  await expect(salesForge.getByText('Washington launch data package', { exact: true })).toBeVisible(
    { timeout: 20_000 }
  );
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  await expect(salesForge.getByRole('tab', { name: 'Queue', exact: true })).toBeVisible();

  const firstSaleRow = salesForge
    .getByRole('table', { name: 'Sale qualification queue' })
    .getByRole('row')
    .nth(1);
  await expect(firstSaleRow).toContainText('9000-006-408-0006', { timeout: 20_000 });
  await firstSaleRow.click();
  const conditionField = salesForge.locator('.sf-detail-field').filter({ hasText: 'Condition' });
  await expect(conditionField).toContainText('AV');

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });

  const pierce = page.getByRole('option', { name: 'Select Pierce County' });
  await pierce.click();
  await expect(pierce).toHaveAttribute('aria-selected', 'true');
  await expect(context).toContainText('Pierce County');
  await expect(context).toContainText('12,738', { timeout: 45_000 });
  await expect(context).toContainText('2026-08-05');
  await expect(context).not.toContainText('No governed public sales state is available');

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('12,738', {
    timeout: 45_000,
  });
  const pierceSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(pierceSalesForge).toBeEnabled();
  await pierceSalesForge.click();
  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  await expect(salesForge.getByText('Pierce County', { exact: true })).toBeVisible();
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  const firstPierceSaleRow = salesForge
    .getByRole('table', { name: 'Sale qualification queue' })
    .getByRole('row')
    .nth(1);
  await expect(firstPierceSaleRow).toContainText('9210000130', { timeout: 20_000 });
  await expect(firstPierceSaleRow).toContainText('Dec 31, 25');
  await expect(firstPierceSaleRow).toContainText('$610k');
  await firstPierceSaleRow.click();
  const pierceAddress = salesForge.locator('.sf-detail-field').filter({ hasText: 'Address' });
  await expect(pierceAddress).toContainText('824 S 28TH ST');
  const pierceDeedType = salesForge.locator('.sf-detail-field').filter({ hasText: 'Deed type' });
  await expect(pierceDeedType).toContainText('Statutory Warranty Deed');

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });

  const skagit = page.getByRole('option', { name: 'Select Skagit County' });
  await skagit.click();
  await expect(skagit).toHaveAttribute('aria-selected', 'true');
  await expect(context).toContainText('Skagit County');
  await expect(context).toContainText('3,877', { timeout: 45_000 });
  await expect(context).toContainText('2026-08-26');
  await expect(context).not.toContainText('No governed public sales state is available');

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('3,877', {
    timeout: 45_000,
  });
  const skagitSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(skagitSalesForge).toBeEnabled();
  await skagitSalesForge.click();
  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  await expect(salesForge.getByText('Skagit County', { exact: true })).toBeVisible();
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  const firstSkagitSaleRow = salesForge
    .getByRole('table', { name: 'Sale qualification queue' })
    .getByRole('row')
    .nth(1);
  await expect(firstSkagitSaleRow).toContainText('P125708', { timeout: 20_000 });
  await expect(firstSkagitSaleRow).toContainText('Dec 31, 25');
  await expect(firstSkagitSaleRow).toContainText('$520k');
  await firstSkagitSaleRow.click();
  const skagitAddress = salesForge.locator('.sf-detail-field').filter({ hasText: 'Address' });
  await expect(skagitAddress).toContainText('214 DALLAS STREET, MOUNT VERNON, 98274');
  const skagitDeedType = salesForge.locator('.sf-detail-field').filter({ hasText: 'Deed type' });
  await expect(skagitDeedType).toContainText('WARRANTY DEED');

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });

  const snohomish = page.getByRole('option', { name: 'Select Snohomish County' });
  await snohomish.click();
  await expect(snohomish).toHaveAttribute('aria-selected', 'true');
  await expect(context).toContainText('Snohomish County');
  await expect(context).toContainText('21,792', { timeout: 45_000 });
  await expect(context).toContainText('2026-04-01');
  await expect(context).not.toContainText('No governed public sales state is available');

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('21,792', {
    timeout: 45_000,
  });
  const snohomishSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(snohomishSalesForge).toBeEnabled();
  await snohomishSalesForge.click();
  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  await expect(salesForge.getByText('Snohomish County', { exact: true })).toBeVisible();
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  const firstSnohomishSaleRow = salesForge
    .getByRole('table', { name: 'Sale qualification queue' })
    .getByRole('row')
    .nth(1);
  await expect(firstSnohomishSaleRow).toContainText('535400003102', { timeout: 20_000 });
  await expect(firstSnohomishSaleRow).toContainText('Dec 31, 25');
  await expect(firstSnohomishSaleRow).toContainText('$2500k');
  await firstSnohomishSaleRow.click();
  const snohomishAddress = salesForge.locator('.sf-detail-field').filter({ hasText: 'Address' });
  await expect(snohomishAddress).toContainText('2330 106TH ST SW, EVERETT, 98204-3625');
  const snohomishDeedType = salesForge.locator('.sf-detail-field').filter({ hasText: 'Deed type' });
  await expect(snohomishDeedType).toContainText('W');

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });

  const thurston = page.getByRole('option', { name: 'Select Thurston County' });
  await thurston.click();
  await expect(thurston).toHaveAttribute('aria-selected', 'true');
  await expect(context).toContainText('Thurston County');
  await expect(context).toContainText('9,550', { timeout: 45_000 });
  await expect(context).toContainText('2026-07-29');
  await expect(context).not.toContainText('No governed public sales state is available');

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('9,550', {
    timeout: 45_000,
  });
  const thurstonSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(thurstonSalesForge).toBeEnabled();
  await thurstonSalesForge.click();
  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  await expect(salesForge.getByText('Thurston County', { exact: true })).toBeVisible();
  await expect(salesForge.getByText('Washington launch data package', { exact: true })).toBeVisible(
    { timeout: 20_000 }
  );
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  const firstThurstonSaleRow = salesForge
    .getByRole('table', { name: 'Sale qualification queue' })
    .getByRole('row')
    .nth(1);
  await expect(firstThurstonSaleRow).toContainText('68600400200', { timeout: 20_000 });
  await expect(firstThurstonSaleRow).toContainText('Dec 31, 25');
  await expect(firstThurstonSaleRow).toContainText('$875k');
  await firstThurstonSaleRow.click();
  const thurstonAddress = salesForge.locator('.sf-detail-field').filter({ hasText: 'Address' });
  await expect(thurstonAddress).toContainText('805 5TH AVE SW, OLYMPIA, 98502');

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });

  const lewis = page.getByRole('option', { name: 'Select Lewis County' });
  await lewis.click();
  await expect(lewis).toHaveAttribute('aria-selected', 'true');
  await expect(context).toContainText('Lewis County');
  await expect(context).toContainText('909', { timeout: 45_000 });
  await expect(context).toContainText('2024-12-31');
  await expect(context).not.toContainText('No governed public sales state is available');

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('909', {
    timeout: 45_000,
  });
  const lewisSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(lewisSalesForge).toBeEnabled();
  await lewisSalesForge.click();
  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  await expect(salesForge.getByText('Lewis County', { exact: true })).toBeVisible();
  await expect(salesForge.getByText('Washington launch data package', { exact: true })).toBeVisible(
    { timeout: 20_000 }
  );
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  const firstLewisSaleRow = salesForge
    .getByRole('table', { name: 'Sale qualification queue' })
    .getByRole('row')
    .nth(1);
  await expect(firstLewisSaleRow).toContainText('018106003002', { timeout: 20_000 });
  await expect(firstLewisSaleRow).toContainText('Dec 31, 24');
  await expect(firstLewisSaleRow).toContainText('$283k');
  await firstLewisSaleRow.click();
  const lewisAddress = salesForge.locator('.sf-detail-field').filter({ hasText: 'Address' });
  await expect(lewisAddress).toContainText('481 KIRKLAND RD');
  await expect(lewisAddress).not.toContainText('CHEHALIS');

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('option')).toHaveCount(39, { timeout: 20_000 });

  const whatcom = page.getByRole('option', { name: 'Select Whatcom County' });
  await whatcom.click();
  await expect(whatcom).toHaveAttribute('aria-selected', 'true');

  await expect(page.getByTestId('selected-county-context')).toContainText('Whatcom County');
  await expect(page.getByTestId('selected-county-context')).toContainText('5,109', {
    timeout: 45_000,
  });
  await expect(page.getByTestId('selected-county-context')).toContainText('2025-07-31');
  await expect(page.getByTestId('selected-county-context')).not.toContainText(
    'No governed public sales state is available'
  );

  await page.getByRole('button', { name: 'Open TerraForge' }).click();
  await expect(page.getByRole('heading', { name: 'TerraForge', exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('forge-county-context')).toContainText('5,109', {
    timeout: 45_000,
  });
  const whatcomSalesForge = page
    .getByTestId('forge-primary-applications')
    .getByRole('button', { name: /SalesForge/i });
  await expect(whatcomSalesForge).toBeEnabled();
  await whatcomSalesForge.click();

  await expect(page.getByRole('heading', { name: 'SalesForge' })).toBeVisible({ timeout: 20_000 });
  await expect(salesForge.getByText('Whatcom County', { exact: true })).toBeVisible();
  await expect(salesForge.getByText('Washington launch data package', { exact: true })).toBeVisible(
    { timeout: 20_000 }
  );
  await expect(salesForge.getByTestId('salesforge-data-unavailable')).toHaveCount(0);
  const firstWhatcomSaleRow = salesForge
    .getByRole('table', { name: 'Sale qualification queue' })
    .getByRole('row')
    .nth(1);
  await expect(firstWhatcomSaleRow).toContainText('3802121755000159', { timeout: 20_000 });
  await expect(firstWhatcomSaleRow).toContainText('Jul 31, 25');
  await expect(firstWhatcomSaleRow).toContainText('$323k');
  await firstWhatcomSaleRow.click();
  const whatcomAddress = salesForge.locator('.sf-detail-field').filter({ hasText: 'Address' });
  await expect(whatcomAddress).toContainText('4247 WINTERGREEN LN #209, BELLINGHAM');
  await expect(whatcomAddress).not.toContainText('BELLINGHAM, BELLINGHAM');
  const whatcomSaleType = salesForge.locator('.sf-detail-field').filter({ hasText: 'Deed type' });
  await expect(whatcomSaleType).toContainText('Q');

  await page.goto('/counties', { waitUntil: 'domcontentloaded' });
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
  await expect(page.getByTestId('forge-county-context')).not.toContainText('5,109');
  await expect(page.getByTestId('forge-county-context')).not.toContainText('5,476');
  await expect(page.getByTestId('forge-county-context')).not.toContainText('12,738');
  await expect(page.getByTestId('forge-county-context')).not.toContainText('3,877');
  await expect(page.getByTestId('forge-county-context')).not.toContainText('21,792');
  await expect(page.getByTestId('forge-county-context')).not.toContainText('9,550');
  await expect(page.getByTestId('forge-county-context')).not.toContainText('909');

  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/035.json');
  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/041.json');
  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/073.json');
  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/007.json');
  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/011.json');
  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/053.json');
  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/057.json');
  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/061.json');
  expect(requestedSalesShards).toContain('/launch-data/washington/sales/by-county/067.json');
  expect(requestedSalesShards).not.toContain('/launch-data/washington/sales/by-county/001.json');
});
