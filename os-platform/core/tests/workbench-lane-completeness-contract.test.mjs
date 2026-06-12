import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
const read = (relativePath) => readFileSync(join(repoRoot, relativePath), 'utf8');

test('Pilot fallback is explicitly non-live, not exposed as an operational stub', () => {
  const controller = read('backend/src/TerraFusion.API/Controllers/PilotController.cs');
  const pilotTab = read('frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx');

  assert.doesNotMatch(controller, /source\s*=\s*"stub"/);
  assert.match(controller, /source\s*=\s*"not-live:pilot-runtime-offline"/);
  assert.match(controller, /X-Pilot-Source/);
  assert.match(pilotTab, /runtimeOnline/);
  assert.match(pilotTab, /Pilot runtime is not live/);
});

test('Dais permits preserves the backend not-live source through the frontend service', () => {
  const service = read('frontend/apps/os-shell/src/services/suites/daisService.ts');
  const daisTab = read('frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx');

  assert.match(service, /PermitsLaneResult/);
  assert.match(service, /x-dais-permits-source/i);
  assert.match(service, /not-live:permit-records-not-projected/);
  assert.match(daisTab, /permit-records-not-projected/);
});

test('Clerk title-chain empty results are explicitly classified as unavailable/thin', () => {
  const controller = read('backend/src/TerraFusion.API/Controllers/ClerkController.cs');
  const clerkTab = read('frontend/apps/os-shell/src/pages/workbench/tabs/PropertyClerk.tsx');

  assert.match(controller, /Parcel '\{parcelId\}' not found/);
  assert.match(controller, /X-Clerk-Title-Chain-Source/);
  assert.match(controller, /not-live:title-chain-records-not-projected|partial:title-chain-empty/);
  assert.match(clerkTab, /Title-chain records are not projected/);
});

test('Audit tab does not present county/static audit contracts as parcel-specific proof', () => {
  const auditTab = read('frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAudit.tsx');

  assert.doesNotMatch(auditTab, /Financial compliance & audit for \$\{parcelId\}/);
  assert.match(auditTab, /County audit controls with parcel context/);
  assert.match(auditTab, /parcel-specific audit backend is not live/);
});
