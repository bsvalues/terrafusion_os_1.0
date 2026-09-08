import { createHash } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Actual Atlas candidate acceptance requires ${name}.`);
  return value;
}
async function openReview(page: Page, base = required('ATLAS_BASE_URL')) {
  await page.goto(`${base.replace(/\/$/, '')}/atlas`);
  await expect(page.getByTestId('atlas-spatial-anomaly-panel')).toBeVisible();
}
async function runReview(page: Page, year: string) {
  await page.getByLabel('Assessment year').fill(year);
  const response = page.waitForResponse(
    r => r.url().includes('/pilot/invoke') && r.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Run spatial review' }).click();
  const envelope = await (await response).json();
  const output = envelope.result?.output;
  return { envelope, judgment: typeof output === 'string' ? JSON.parse(output) : output };
}

test.beforeAll(() => {
  for (const name of [
    'ATLAS_BASE_URL',
    'ATLAS_AUTH_STATE',
    'ATLAS_OTHER_AUTH_STATE',
    'ATLAS_VALID_YEAR',
    'ATLAS_EMPTY_YEAR',
    'ATLAS_FAILURE_BASE_URL',
    'ATLAS_PROTECTED_COMMIT',
  ])
    required(name);
  for (const name of ['ATLAS_BASE_URL', 'ATLAS_FAILURE_BASE_URL']) {
    const url = new URL(required(name));
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(url.hostname);
  }
});

test('actual source produces protected canonical judgment, inspectable provenance and repeat after reload', async ({
  page,
}) => {
  await openReview(page);
  const first = await runReview(page, required('ATLAS_VALID_YEAR'));
  expect(first.envelope.success).toBe(true);
  expect(first.judgment.status).toBe('OK');
  expect(first.judgment.hotspotCount).toBeGreaterThan(0);
  expect(first.judgment.canonicalProvenance.sourceCommit).toBe(required('ATLAS_PROTECTED_COMMIT'));
  expect(first.judgment.sourceEvidence.responseSha256).toBe(
    createHash('sha256').update(first.judgment.sourceEvidence.responseBody).digest('hex')
  );
  await expect(page.getByText(first.envelope.correlationId, { exact: true })).toBeVisible();
  await page.getByText('Inspect source observations', { exact: true }).click();
  await expect(page.getByTestId('atlas-source-response')).toContainText(
    first.judgment.sourceEvidence.responseBody
  );
  await page.reload();
  await expect(page.getByText(first.envelope.correlationId, { exact: true })).toHaveCount(0);
  const reloaded = await runReview(page, required('ATLAS_VALID_YEAR'));
  expect(reloaded.judgment.request).toEqual(first.judgment.request);
  expect(reloaded.judgment.finding).toEqual(first.judgment.finding);
});

test('empty actual backing scope produces insufficient data without a finding', async ({
  page,
}) => {
  await openReview(page);
  const { judgment } = await runReview(page, required('ATLAS_EMPTY_YEAR'));
  expect(judgment.status).toBe('INSUFFICIENT_DATA');
  expect(judgment.finding).toBeNull();
  expect(judgment.hotspotCount).toBe(0);
  await expect(page.getByText(judgment.reason, { exact: true })).toBeVisible();
});

test('another authorized county remains isolated through the actual source', async ({
  browser,
  page,
}) => {
  await openReview(page);
  const first = await runReview(page, required('ATLAS_VALID_YEAR'));
  const otherContext = await browser.newContext({
    storageState: required('ATLAS_OTHER_AUTH_STATE'),
  });
  try {
    const other = await otherContext.newPage();
    await openReview(other);
    const second = await runReview(other, required('ATLAS_VALID_YEAR'));
    expect(second.envelope.success).toBe(true);
    expect(second.judgment.request.countyId).not.toBe(first.judgment.request.countyId);
    for (const source of second.judgment.sourceRefs)
      expect(source.countyId).toBe(second.judgment.request.countyId);
    expect(second.judgment.sourceEvidence.requestQuery).not.toContain(
      first.judgment.request.countyId
    );
  } finally {
    await otherContext.close();
  }
});

test('actual unavailable backing service shows error and CID without demo replacement', async ({
  page,
}) => {
  // A separately reserved candidate with its real backing service unavailable; no request interception.
  await openReview(page, required('ATLAS_FAILURE_BASE_URL'));
  const { envelope } = await runReview(page, required('ATLAS_VALID_YEAR'));
  expect(envelope.success).toBe(false);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByText(envelope.correlationId, { exact: true })).toBeVisible();
  await expect(page.getByTestId('atlas-spatial-result')).toHaveCount(0);
});
