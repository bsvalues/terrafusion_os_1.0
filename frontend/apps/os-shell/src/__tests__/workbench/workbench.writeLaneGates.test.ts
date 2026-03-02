/// <reference types="vitest" />
/**
 * workbench.writeLaneGates.test.ts
 *
 * Phase J Gate 3: Write-Lane Assertions
 *
 * Validates that each suite's write operations stay within their
 * authorized write lanes as defined in the Suite Boundaries spec.
 *
 * @see 04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md — Lane matrix
 * @see contracts/workbench.ts — TabOwner type
 */

import { CONSTITUTIONAL_SUITES } from '../../config/suiteRegistry';

// ============================================================================
// Write Lane Matrix (from spec 04)
// ============================================================================

/** Each suite ID → the domains it is authorized to write to */
const WRITE_LANE_MATRIX: Record<string, readonly string[]> = {
  forge: ['valuation-artifacts', 'cost-data', 'income-data', 'sales-data'],
  atlas: ['gis-layers', 'boundaries', 'annotations'],
  dais: ['permits', 'exemptions', 'appeals', 'notices', 'cert', 'queues'],
  dossier: ['documents', 'narratives', 'evidence', 'packets'],
  gpt: ['gpt-configs', 'rag-datasets', 'conversations'],
};

// ============================================================================
// Tests
// ============================================================================

describe('Gate: Write-Lane Matrix Integrity', () => {
  it('every constitutional suite has a write-lane entry', () => {
    for (const suite of CONSTITUTIONAL_SUITES) {
      expect(WRITE_LANE_MATRIX[suite.id]).toBeDefined();
      expect(WRITE_LANE_MATRIX[suite.id].length).toBeGreaterThan(0);
    }
  });

  it('no suite claims write access to another suite\'s lanes', () => {
    const suiteIds = Object.keys(WRITE_LANE_MATRIX);
    for (const suiteA of suiteIds) {
      for (const suiteB of suiteIds) {
        if (suiteA === suiteB) continue;
        const lanesA = new Set(WRITE_LANE_MATRIX[suiteA]);
        const lanesB = WRITE_LANE_MATRIX[suiteB];
        for (const lane of lanesB) {
          expect(lanesA.has(lane)).toBe(false);
        }
      }
    }
  });

  it('write-lane matrix covers exactly the 5 constitutional suites', () => {
    const matrixKeys = Object.keys(WRITE_LANE_MATRIX).sort();
    const suiteKeys = CONSTITUTIONAL_SUITES.map((s) => s.id).sort();
    expect(matrixKeys).toEqual(suiteKeys);
  });
});
