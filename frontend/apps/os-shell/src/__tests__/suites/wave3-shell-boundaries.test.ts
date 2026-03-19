/**
 * Wave 3 — Shell Boundary Validation Contract
 *
 * Proves that validateSuiteRendering() returns null (no violation) for
 * all 4 constitutional suite IDs. If any suite loses its suite-workspace
 * classification, this test will catch it before it ships.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { validateSuiteRendering } from '../../contracts/objectPlacement';

describe('Wave 3 — Shell Boundary Validation', () => {
  it('validateSuiteRendering returns null for all 4 constitutional suites', () => {
    const suites = ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier'];
    for (const moduleId of suites) {
      const violation = validateSuiteRendering(moduleId);
      expect(violation, `${moduleId} should not have a suite boundary violation`).toBeNull();
    }
  });

  it('validateSuiteRendering returns null for non-suite module IDs (enforced by launcher routing)', () => {
    // The validator only enforces suite-workspace classification on known suite module IDs.
    // Non-suite modules (workbench, tools) are handled by launcher routing (Phase 6),
    // not by suite boundary enforcement. This is intentional — not a gap.
    const violation = validateSuiteRendering('property-workbench');
    expect(violation).toBeNull(); // workbench is not in SUITE_MODULE_IDS — validator skips it
  });
});
