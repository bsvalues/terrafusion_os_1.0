/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 1
 * Write-Lane Enforcement Contract
 *
 * Validates the constitutional ownership matrix: Dossier owns document,
 * photo, note, sketch, permit, parcel_identity, parcel_ownership.
 * Cross-lane writes must throw.
 */

import { describe, it, expect } from 'vitest';
import {
  assertWriteLane,
  checkWriteLane,
  WRITE_LANE_MATRIX,
} from '../../services/writeLane';

describe('Write-Lane Enforcement Contract', () => {
  describe('checkWriteLane', () => {
    it('returns true when dossier checks document domain', () => {
      expect(checkWriteLane('dossier', 'document')).toBe(true);
    });

    it('returns true when dossier checks photo domain', () => {
      expect(checkWriteLane('dossier', 'photo')).toBe(true);
    });

    it('returns true when dossier checks parcel_identity domain', () => {
      expect(checkWriteLane('dossier', 'parcel_identity')).toBe(true);
    });

    it('returns false when dais checks document domain', () => {
      expect(checkWriteLane('dais', 'document')).toBe(false);
    });

    it('returns false when forge checks parcel_identity domain', () => {
      expect(checkWriteLane('forge', 'parcel_identity')).toBe(false);
    });
  });

  describe('assertWriteLane', () => {
    it('does not throw when dossier writes to document', () => {
      expect(() => assertWriteLane('dossier', 'document')).not.toThrow();
    });

    it('does not throw when dossier writes to photo', () => {
      expect(() => assertWriteLane('dossier', 'photo')).not.toThrow();
    });

    it('does not throw when dossier writes to sketch', () => {
      expect(() => assertWriteLane('dossier', 'sketch')).not.toThrow();
    });

    it('throws when dais writes to document domain', () => {
      expect(() => assertWriteLane('dais', 'document')).toThrow(
        '[WriteLane Violation]',
      );
    });

    it('throws when forge writes to parcel_identity domain', () => {
      expect(() => assertWriteLane('forge', 'parcel_identity')).toThrow(
        '[WriteLane Violation]',
      );
    });

    it('includes owner module in violation message', () => {
      expect(() => assertWriteLane('dais', 'document')).toThrow(
        'owned by "dossier"',
      );
    });
  });

  describe('WRITE_LANE_MATRIX completeness', () => {
    const DOSSIER_DOMAINS = [
      'parcel_identity',
      'parcel_ownership',
      'photo',
      'document',
      'note',
      'sketch',
      'permit',
    ] as const;

    it.each(DOSSIER_DOMAINS)('dossier owns %s', (domain) => {
      expect(WRITE_LANE_MATRIX[domain]).toBe('dossier');
    });
  });
});
