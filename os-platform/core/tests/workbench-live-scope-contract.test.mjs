import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
const read = (relativePath) => readFileSync(join(repoRoot, relativePath), 'utf8');

test('weak Workbench lanes have explicit live-scope decisions', () => {
  const configPath = 'frontend/apps/os-shell/src/config/workbenchLiveScope.ts';
  assert.equal(existsSync(join(repoRoot, configPath)), true, 'workbenchLiveScope.ts must exist');

  const config = read(configPath);
  for (const lane of [
    'pilot',
    'dais-permits',
    'forge-income',
    'atlas-enrichment-layers',
    'clerk-title-chain',
    'parcel-specific-audit',
  ]) {
    assert.match(config, new RegExp(`lane:\\s*'${lane}'`), `${lane} missing from live-scope config`);
    assert.match(config, new RegExp(`lane:\\s*'${lane}'[\\s\\S]*classification:\\s*'DEFERRED'`), `${lane} must be explicitly DEFERRED`);
    assert.match(config, new RegExp(`lane:\\s*'${lane}'[\\s\\S]*blockerType:`), `${lane} needs blockerType`);
    assert.match(config, new RegExp(`lane:\\s*'${lane}'[\\s\\S]*smallestSafeAction:`), `${lane} needs smallestSafeAction`);
  }

  assert.doesNotMatch(config, /classification:\s*'LIVE-NOW'/);
});

test('deferred lanes have visible Workbench honesty labels outside Atlas-tab implementation', () => {
  const pilot = read('frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx');
  const dais = read('frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx');
  const income = read('frontend/apps/os-shell/src/pages/workbench/tabs/forge/IncomeApproach.tsx');
  const clerk = read('frontend/apps/os-shell/src/pages/workbench/tabs/PropertyClerk.tsx');
  const audit = read('frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAudit.tsx');

  assert.match(pilot, /pilot-runtime-not-live/);
  assert.match(dais, /dais-permits-lane-disclosure/);
  assert.match(income, /forge-income-deferred-disclosure/);
  assert.match(clerk, /Title-chain records are not projected/);
  assert.match(audit, /audit-parcel-specific-disclosure/);
});
