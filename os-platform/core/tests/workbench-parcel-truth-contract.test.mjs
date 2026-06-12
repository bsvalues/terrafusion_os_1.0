import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const STORE_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/stores/propertyStore.ts');
const PARCEL_CONTEXT_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/context/parcelContext.ts');
const SURFACE_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchSurface.tsx');
const ACTIVATION_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/orchestration/moduleActivation.ts');

const STORE_SRC = readFileSync(STORE_PATH, 'utf8');
const PARCEL_CONTEXT_SRC = readFileSync(PARCEL_CONTEXT_PATH, 'utf8');
const SURFACE_SRC = readFileSync(SURFACE_PATH, 'utf8');
const ACTIVATION_SRC = readFileSync(ACTIVATION_PATH, 'utf8');
const OPEN_WORKBENCH_BODY = PARCEL_CONTEXT_SRC.match(
  /export function openWorkbenchWindow[\s\S]*?(?=\n}\n*$|\nexport )/,
)?.[0] ?? '';

describe('Property Workbench parcel truth contract', () => {
  it('property store exposes a parcel-load error instead of silent null fallback', () => {
    assert.match(
      STORE_SRC,
      /activeParcelError:\s*string\s*\|\s*null/,
      'property store must expose activeParcelError for governed Workbench paths',
    );
    assert.match(
      STORE_SRC,
      /activeParcelError:\s*null/,
      'property store must initialize and clear activeParcelError explicitly',
    );
    assert.match(
      STORE_SRC,
      /Parcel\s+\$\{parcelId\}\s+was not found/,
      'missing parcels must produce a visible not-found error, not an active fake parcel shell',
    );
  });

  it('Workbench surface consumes parcel-load errors before rendering tab content', () => {
    assert.match(
      SURFACE_SRC,
      /activeParcelError/,
      'canonical Workbench surface must read activeParcelError',
    );
    assert.match(
      SURFACE_SRC,
      /data-testid="workbench-parcel-load-error"/,
      'canonical Workbench surface must render a visible parcel-load error state',
    );
  });

  it('reopening an existing workbench window updates tab metadata through Cortex orchestration', () => {
    assert.match(
      ACTIVATION_SRC,
      /updateWindowMetadata\s*\(\s*existingWindowId\s*,\s*metadata\s*\)/,
      'activateModule must refresh existing window metadata before focusing route-reactivated Workbench',
    );
    assert.doesNotMatch(
      OPEN_WORKBENCH_BODY,
      /useDesktopStore\.setState|openWindow\s*\(|focusWindow\s*\(|selectParcel\s*\(|recordRecent\s*\(/,
      'openWorkbenchWindow compatibility helper must not own window, parcel truth, or recents mutation',
    );
  });
});
