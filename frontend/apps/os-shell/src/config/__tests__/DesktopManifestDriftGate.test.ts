/**
 * Phase 22 — Desktop Manifest Drift Gate
 *
 * Mechanical enforcement: every desktop icon entry must map to a
 * canonical suite or OS feature ID from suiteRegistry.ts.
 *
 * This gate FAILS if:
 * - A desktop icon references an ID not in CONSTITUTIONAL_SUITES or OS_FEATURES
 * - A desktop icon ID appears more than once (duplicates)
 * - getDesktopIcons() returns an empty array (registry disconnected)
 */

import { CONSTITUTIONAL_SUITES, OS_FEATURES, OS_SURFACES } from '../suiteRegistry';
import { getDesktopIcons } from '../desktopManifest';

describe('DesktopManifestDriftGate', () => {
  const canonicalSuiteIds = CONSTITUTIONAL_SUITES.map((s) => s.id);
  const canonicalFeatureIds = OS_FEATURES.map((f) => f.id);
  const canonicalSurfaceIds = OS_SURFACES.map((s) => `surface-${s.id}`);
  const allCanonicalIds = [...canonicalSuiteIds, ...canonicalFeatureIds, ...canonicalSurfaceIds];

  const desktopIcons = getDesktopIcons();
  const desktopIds = desktopIcons.map((d) => d.id);

  it('desktop manifest is non-empty', () => {
    expect(desktopIcons.length).toBeGreaterThan(0);
  });

  it('every desktop icon ID exists in canonical suites or OS features', () => {
    const unknown = desktopIds.filter((id) => !allCanonicalIds.includes(id));
    expect(unknown).toEqual([]);
  });

  it('no duplicate desktop icon IDs', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of desktopIds) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(duplicates).toEqual([]);
  });

  it('every desktop icon has required fields', () => {
    for (const icon of desktopIcons) {
      expect(icon.id).toBeTruthy();
      expect(icon.name).toBeTruthy();
      expect(icon.iconName).toBeTruthy();
      expect(icon.route).toBeTruthy();
    }
  });

  it('all workbench suites appear on desktop', () => {
    const workbenchSuiteIds = CONSTITUTIONAL_SUITES.filter((s) => s.workbenchTab).map((s) => s.id);
    const missing = workbenchSuiteIds.filter((id) => !desktopIds.includes(id));
    expect(missing).toEqual([]);
  });
});
