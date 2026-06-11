import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const ROUTE_WORKBENCH_PATH = resolve(
  ROOT,
  'frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx',
);
const ROUTE_SRC = readFileSync(ROUTE_WORKBENCH_PATH, 'utf8');

describe('Property Workbench route bridge contract', () => {
  it('route Workbench activates the canonical property-workbench through Cortex orchestration', () => {
    assert.match(
      ROUTE_SRC,
      /activateModule\s*\(\s*['"]property-workbench['"]\s*,/,
      '/property/:parcelId[/tab] must bridge through activateModule, not a direct window helper',
    );
    assert.match(
      ROUTE_SRC,
      /source:\s*['"]route['"]/,
      'route bridge must identify route activation to the Cortex activation path',
    );
    assert.match(
      ROUTE_SRC,
      /metadata:\s*\{\s*parcelId,\s*tabId:\s*routedTabId/s,
      'route bridge must pass parcel/tab intent as metadata, not mutate parcel/window stores',
    );
  });

  it('route Workbench does not bypass Cortex through openWorkbenchWindow', () => {
    assert.doesNotMatch(
      ROUTE_SRC,
      /openWorkbenchWindow/,
      'route bridge must not import or call openWorkbenchWindow directly',
    );
  });

  it('route Workbench does not render a second tab host', () => {
    assert.doesNotMatch(
      ROUTE_SRC,
      /<\s*Outlet\b/,
      'route bridge must not render nested tab routes as a second Workbench host',
    );
    assert.doesNotMatch(
      ROUTE_SRC,
      /<\s*WorkbenchRail\b/,
      'route bridge must not render its own Workbench rail',
    );
    assert.doesNotMatch(
      ROUTE_SRC,
      /<\s*ContextRibbon\b/,
      'route bridge must not render its own Workbench context ribbon',
    );
    assert.doesNotMatch(
      ROUTE_SRC,
      /<\s*ActivityFeed\b/,
      'route bridge must not render its own Workbench activity lifecycle',
    );
  });
});
