/**
 * TFR-079: Write-Lane Enforcement Tests
 */

import { describe, it, expect } from 'vitest';
import {
  assertWriteLane,
  checkWriteLane,
  WRITE_LANE_MATRIX,
  type OwnerModule,
  type WriteDomain,
} from '../../src/services/writeLane';

// ---------------------------------------------------------------------------
// checkWriteLane
// ---------------------------------------------------------------------------

describe('checkWriteLane', () => {
  it('returns true when module owns the domain', () => {
    expect(checkWriteLane('dossier', 'parcel_identity')).toBe(true);
    expect(checkWriteLane('forge', 'land_valuation')).toBe(true);
    expect(checkWriteLane('dais', 'appeal')).toBe(true);
    expect(checkWriteLane('atlas', 'gis_geometry')).toBe(true);
    expect(checkWriteLane('pilot', 'workflow')).toBe(true);
    expect(checkWriteLane('os', 'system_config')).toBe(true);
  });

  it('returns false when module does NOT own the domain', () => {
    expect(checkWriteLane('forge', 'parcel_identity')).toBe(false);
    expect(checkWriteLane('dossier', 'land_valuation')).toBe(false);
    expect(checkWriteLane('atlas', 'appeal')).toBe(false);
    expect(checkWriteLane('os', 'gis_geometry')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assertWriteLane
// ---------------------------------------------------------------------------

describe('assertWriteLane', () => {
  it('does not throw for valid ownership', () => {
    expect(() => assertWriteLane('forge', 'cost_model')).not.toThrow();
    expect(() => assertWriteLane('dossier', 'document')).not.toThrow();
  });

  it('throws for cross-lane violations with descriptive message', () => {
    expect(() => assertWriteLane('forge', 'appeal')).toThrow(/WriteLane Violation/);
    expect(() => assertWriteLane('forge', 'appeal')).toThrow(/owned by "dais"/);
  });
});

// ---------------------------------------------------------------------------
// Matrix integrity
// ---------------------------------------------------------------------------

describe('WRITE_LANE_MATRIX integrity', () => {
  it('every domain has exactly one owner', () => {
    const domains = Object.keys(WRITE_LANE_MATRIX) as WriteDomain[];
    for (const domain of domains) {
      const owner = WRITE_LANE_MATRIX[domain];
      expect(owner).toBeDefined();
      expect(typeof owner).toBe('string');
    }
  });

  it('every owner is a valid OwnerModule', () => {
    const validModules: OwnerModule[] = ['forge', 'dais', 'atlas', 'dossier', 'os', 'pilot'];
    const owners = new Set(Object.values(WRITE_LANE_MATRIX));
    for (const owner of owners) {
      expect(validModules).toContain(owner);
    }
  });

  it('all six modules own at least one domain', () => {
    const owners = new Set(Object.values(WRITE_LANE_MATRIX));
    expect(owners).toContain('forge');
    expect(owners).toContain('dais');
    expect(owners).toContain('atlas');
    expect(owners).toContain('dossier');
    expect(owners).toContain('os');
    expect(owners).toContain('pilot');
  });
});
