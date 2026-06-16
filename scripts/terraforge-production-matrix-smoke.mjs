#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PRIMARY_CAPABILITIES = [
  ['costforge', 'CostForge'],
  ['compsforge', 'CompsForge'],
  ['salesforge', 'SalesForge'],
  ['incomeforge', 'IncomeForge'],
  ['reconciliation', 'Reconciliation'],
  ['calibration-qc', 'Calibration / QC'],
  ['cama-characteristics', 'CAMA Characteristics'],
  ['valuation-notes-defensibility', 'Valuation Notes / Defensibility'],
];

const SUPPORT_CAPABILITIES = [
  'batch-cost-runs',
  'regression-studio',
  'county-studio',
  'coefficient-preview',
  'current-use-support',
];

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function normalizeBaseUrl(raw) {
  if (!raw) {
    throw new Error('Missing --base-url or TF_PRODUCTION_BASE_URL.');
  }
  const parsed = new URL(raw);
  parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

function requireSecret(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`);
  }
  return value;
}

async function writeEvidence(outputDir, evidence) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, 'terraforge-production-matrix-proof.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputDir, 'terraforge-production-matrix-proof.md'),
    [
      '# TerraForge Production Matrix Proof',
      '',
      `Status: \`${evidence.status}\``,
      `Checked: \`${evidence.checkedAt}\``,
      `Base URL: \`${evidence.baseUrl}\``,
      `Release SHA: \`${evidence.releaseSha ?? 'not-reported'}\``,
      '',
      '## Primary Capabilities',
      '',
      ...evidence.primaryCapabilities.map(
        capability =>
          `- ${capability.label}: card=${capability.cardVisible ? 'visible' : 'missing'}, launch=${capability.launchActionable ? 'actionable' : 'blocked'}`,
      ),
      '',
      '## Support / Deferred',
      '',
      ...evidence.supportCapabilities.map(
        capability =>
          `- ${capability.id}: ${capability.visible ? 'visible outside primary proof' : 'missing'}`,
      ),
      '',
      '## Guardrails',
      '',
      `- Workbench counted as proof: \`${evidence.guardrails.workbenchCountedAsProof}\``,
      `- Endpoint-only proof accepted: \`${evidence.guardrails.endpointOnlyProofAccepted}\``,
      `- PACS-facing runtime text: \`${evidence.guardrails.pacsRuntimeTextFound}\``,
      '',
    ].join('\n'),
  );
}

async function main() {
  const baseUrl = normalizeBaseUrl(readArg('--base-url') ?? process.env.TF_PRODUCTION_BASE_URL);
  const expectedReleaseSha = readArg('--expected-sha') ?? process.env.TF_EXPECTED_RELEASE_SHA;
  const email = requireSecret('TF_PROVISIONED_AUTH_EMAIL');
  const password = requireSecret('TF_PROVISIONED_AUTH_PASSWORD');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir =
    readArg('--output') ?? path.join('artifacts', 'terraforge-production-matrix', stamp);

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: process.env.TF_SMOKE_HEADLESS !== '0' });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const evidence = {
    status: 'FAIL',
    checkedAt: new Date().toISOString(),
    baseUrl,
    releaseSha: null,
    primaryCapabilities: [],
    supportCapabilities: [],
    guardrails: {
      workbenchCountedAsProof: false,
      endpointOnlyProofAccepted: false,
      pacsRuntimeTextFound: false,
    },
    errors: [],
  };

  try {
    const healthResponse = await page.request.get(`${baseUrl}/health`, { timeout: 15000 });
    evidence.releaseSha = healthResponse.headers()['x-release-sha'] ?? null;
    if (!healthResponse.ok()) {
      throw new Error(`/health returned HTTP ${healthResponse.status()}`);
    }
    if (expectedReleaseSha && evidence.releaseSha !== expectedReleaseSha) {
      throw new Error(
        `Expected X-Release-Sha ${expectedReleaseSha}, got ${evidence.releaseSha ?? 'missing'}`,
      );
    }

    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /enter terrafusion os/i }).click();
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);

    await page.goto(`${baseUrl}/forge`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('suite-forge-root').waitFor({ timeout: 30000 });
    await page.getByTestId('forge-primary-applications').waitFor({ timeout: 30000 });
    await page.getByTestId('forge-support-applications').waitFor({ timeout: 30000 });

    const bodyText = await page.locator('body').innerText();
    evidence.guardrails.pacsRuntimeTextFound = /\bPACS\b|\bPacs\b|pacs_/.test(bodyText);
    evidence.guardrails.workbenchCountedAsProof = /\/property\/[^/\s]+\/forge/.test(bodyText);

    for (const [id, label] of PRIMARY_CAPABILITIES) {
      const card = page.locator(
        `[data-terraforge-capability-id="${id}"][data-terraforge-production-proof="primary-required"]`,
      );
      const cardVisible = await card.isVisible();
      let launchActionable = false;
      if (cardVisible) {
        await card.click({ trial: true, timeout: 10000 });
        launchActionable = !(await card.isDisabled());
      }
      evidence.primaryCapabilities.push({ id, label, cardVisible, launchActionable });
    }

    for (const id of SUPPORT_CAPABILITIES) {
      const card = page.locator(
        `[data-terraforge-capability-id="${id}"][data-terraforge-production-proof="support-or-deferred"]`,
      );
      evidence.supportCapabilities.push({ id, visible: await card.isVisible() });
    }

    const missingPrimary = evidence.primaryCapabilities.filter(
      capability => !capability.cardVisible || !capability.launchActionable,
    );
    const missingSupport = evidence.supportCapabilities.filter(capability => !capability.visible);

    if (missingPrimary.length > 0) {
      throw new Error(
        `Primary TerraForge capability proof failed: ${missingPrimary.map(item => item.id).join(', ')}`,
      );
    }
    if (missingSupport.length > 0) {
      throw new Error(
        `Support/deferred TerraForge disclosure missing: ${missingSupport.map(item => item.id).join(', ')}`,
      );
    }
    if (evidence.guardrails.pacsRuntimeTextFound) {
      throw new Error('PACS-facing runtime text found on /forge.');
    }
    if (evidence.guardrails.workbenchCountedAsProof) {
      throw new Error('Workbench parcel-scoped route appeared in TerraForge suite proof.');
    }
    if (pageErrors.length > 0) {
      throw new Error(`Browser page errors: ${pageErrors.join(' | ')}`);
    }

    evidence.status = 'PASS';
  } catch (error) {
    evidence.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await mkdir(outputDir, { recursive: true }).catch(() => undefined);
    await page
      .screenshot({
        path: path.join(outputDir, 'terraforge-production-matrix.png'),
        fullPage: true,
      })
      .catch(() => undefined);
    await browser.close();
    await writeEvidence(outputDir, evidence);
    process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
