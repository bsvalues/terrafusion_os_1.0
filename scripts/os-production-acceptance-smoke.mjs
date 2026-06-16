#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

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

async function loadContract() {
  const contractPath = path.resolve(
    process.cwd(),
    'os-platform/core/pilot/os-production-acceptance-contract.json'
  );
  return JSON.parse(await readFile(contractPath, 'utf8'));
}

async function writeEvidence(outputDir, evidence) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, 'os-production-acceptance-proof.json'),
    `${JSON.stringify(evidence, null, 2)}\n`
  );

  const surfaceLines = evidence.surfaces.map(
    surface =>
      `- ${surface.label} \`${surface.path}\`: ready=${surface.ready ? 'yes' : 'no'}, pacsText=${surface.pacsTextFound ? 'yes' : 'no'}, pageErrors=${surface.pageErrors.length}`
  );

  await writeFile(
    path.join(outputDir, 'os-production-acceptance-proof.md'),
    [
      '# TerraFusion OS Production Acceptance Proof',
      '',
      `Status: \`${evidence.status}\``,
      `Checked: \`${evidence.checkedAt}\``,
      `Base URL: \`${evidence.baseUrl}\``,
      `Release SHA: \`${evidence.releaseSha ?? 'not-reported'}\``,
      `Harness SHA: \`${evidence.harnessSha ?? 'not-reported'}\``,
      '',
      '## Guardrails',
      '',
      `- TerraForge matrix required: \`${evidence.guardrails.terraforgeMatrixProofRequired}\``,
      `- Workbench search support only: \`${evidence.guardrails.workbenchSearchSupportOnly}\``,
      `- Parcel-scoped workbench route visited: \`${evidence.guardrails.workbenchParcelRouteVisited}\``,
      '',
      '## Surfaces',
      '',
      ...surfaceLines,
      '',
      evidence.errors.length > 0 ? '## Errors' : '## Errors',
      '',
      ...(evidence.errors.length > 0 ? evidence.errors.map(error => `- ${error}`) : ['- none']),
      '',
    ].join('\n')
  );
}

async function clickLogin(page) {
  const candidates = [/^sign in$/i, /enter terrafusion os/i];
  for (const candidate of candidates) {
    const button = page.getByRole('button', { name: candidate });
    if (await button.count()) {
      await button.first().click();
      return;
    }
  }
  throw new Error('Login submit button not found with expected labels.');
}

async function main() {
  const contract = await loadContract();
  const baseUrl = normalizeBaseUrl(readArg('--base-url') ?? process.env.TF_PRODUCTION_BASE_URL);
  const expectedReleaseSha = readArg('--expected-sha') ?? process.env.TF_EXPECTED_RELEASE_SHA;
  const email = requireSecret('TF_PROVISIONED_AUTH_EMAIL');
  const password = requireSecret('TF_PROVISIONED_AUTH_PASSWORD');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir =
    readArg('--output') ?? path.join('artifacts', 'os-production-acceptance', stamp);

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
    harnessSha: process.env.GITHUB_SHA ?? null,
    authenticated: false,
    surfaces: [],
    guardrails: {
      terraforgeMatrixProofRequired: contract.guardrails.terraforgeMatrixProofRequired,
      workbenchSearchSupportOnly: contract.guardrails.workbenchSearchSupportOnly,
      workbenchParcelRouteVisited: false,
    },
    errors: [],
  };

  try {
    const healthResponse = await page.request.get(`${baseUrl}${contract.releaseHealth.path}`, {
      timeout: 15000,
    });
    evidence.releaseSha = healthResponse.headers()[contract.releaseHealth.releaseHeader] ?? null;
    if (!healthResponse.ok()) {
      throw new Error(`${contract.releaseHealth.path} returned HTTP ${healthResponse.status()}`);
    }
    if (expectedReleaseSha && evidence.releaseSha !== expectedReleaseSha) {
      throw new Error(
        `Expected ${contract.releaseHealth.releaseHeader} ${expectedReleaseSha}, got ${evidence.releaseSha ?? 'missing'}`
      );
    }

    await page.goto(`${baseUrl}${contract.login.path}`, { waitUntil: 'domcontentloaded' });
    await page.getByTestId(contract.login.rootTestId).waitFor({ timeout: 30000 });
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await clickLogin(page);
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);
    evidence.authenticated = true;

    const requiredSurfaces = [
      ...contract.suiteRoutes.map(route => ({ ...route, family: 'suite' })),
      ...contract.featureRoutes.map(route => ({ ...route, family: 'feature' })),
      ...contract.supportRoutes.map(route => ({ ...route, family: 'support' })),
    ];

    for (const surface of requiredSurfaces) {
      const priorErrorCount = pageErrors.length;
      await page.goto(`${baseUrl}${surface.path}`, { waitUntil: 'domcontentloaded' });
      await page.getByTestId(surface.rootTestId).waitFor({ timeout: 30000 });

      const bodyText = await page.locator('body').innerText();
      if (surface.requiredText && !bodyText.includes(surface.requiredText)) {
        throw new Error(`${surface.path} missing required text "${surface.requiredText}".`);
      }

      const pacsTextFound =
        surface.family !== 'feature' && /\bPACS\b|\bPacs\b|pacs_/.test(bodyText);
      const routePageErrors = pageErrors.slice(priorErrorCount);
      const ready = routePageErrors.length === 0 && !pacsTextFound;

      evidence.guardrails.workbenchParcelRouteVisited =
        evidence.guardrails.workbenchParcelRouteVisited ||
        new RegExp(contract.guardrails.parcelScopedWorkbenchRouteForbiddenPattern).test(
          surface.path
        );

      evidence.surfaces.push({
        id: surface.id,
        label: surface.label,
        family: surface.family,
        path: surface.path,
        ready,
        pacsTextFound,
        pageErrors: routePageErrors,
      });
    }

    const suiteCount = evidence.surfaces.filter(surface => surface.family === 'suite').length;
    const featureCount = evidence.surfaces.filter(surface => surface.family === 'feature').length;
    const supportCount = evidence.surfaces.filter(surface => surface.family === 'support').length;

    if (suiteCount !== contract.guardrails.suiteCount) {
      throw new Error(
        `Expected ${contract.guardrails.suiteCount} suite routes, got ${suiteCount}.`
      );
    }
    if (featureCount !== contract.guardrails.featureCount) {
      throw new Error(
        `Expected ${contract.guardrails.featureCount} feature routes, got ${featureCount}.`
      );
    }
    if (supportCount !== contract.guardrails.supportRouteCount) {
      throw new Error(
        `Expected ${contract.guardrails.supportRouteCount} support routes, got ${supportCount}.`
      );
    }
    if (evidence.guardrails.workbenchParcelRouteVisited) {
      throw new Error('Parcel-scoped Workbench Forge route was used in OS acceptance proof.');
    }

    const failedSurfaces = evidence.surfaces.filter(surface => !surface.ready);
    if (failedSurfaces.length > 0) {
      throw new Error(
        `OS acceptance surface proof failed: ${failedSurfaces.map(surface => surface.id).join(', ')}`
      );
    }

    evidence.status = 'PASS';
  } catch (error) {
    evidence.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await mkdir(outputDir, { recursive: true }).catch(() => undefined);
    await page
      .screenshot({
        path: path.join(outputDir, 'os-production-acceptance.png'),
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
