/**
 * SaleQualificationQueue — page-clamp regression tests (Slice 1.4)
 *
 * Key invariant: when a PATCH decision removes the last item from the
 * current page and earlier pages still exist, the component must:
 *   1. Detect items.length === 0 && page > 1 in fetchPage
 *   2. Dispatch SET_PAGE(max(1, newTotalPages)) instead of FETCH_OK
 *   3. Re-fetch the clamped page and render its items
 *
 * Must NOT:
 *   - Flash "No pending sales…" for a non-empty queue
 *   - Show an impossible page indicator (e.g. "2 / 1")
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';
import { computeClampedPage, PAGE_SIZE } from '../SaleQualificationQueue';

describe('SaleQualificationQueue', () => {
  describe('PAGE_SIZE', () => {
    it('is 15', () => {
      expect(PAGE_SIZE).toBe(15);
    });
  });

  describe('computeClampedPage', () => {
    it('returns null when items are present — no clamp needed', () => {
      expect(computeClampedPage(1, 16, 2)).toBeNull();
      expect(computeClampedPage(15, 30, 1)).toBeNull();
    });

    it('returns null on page 1 with no items — real empty queue, not a clamp', () => {
      expect(computeClampedPage(0, 0, 1)).toBeNull();
      expect(computeClampedPage(0, 14, 1)).toBeNull();
    });

    it('returns 1 when PATCH empties the last item on page 2, total now fits in 1 page', () => {
      // 15 items remain → ceil(15/15) = 1 page → clamp to page 1
      expect(computeClampedPage(0, 15, 2)).toBe(1);
    });

    it('returns the last valid page when items spill across multiple pages', () => {
      // 30 items remain → ceil(30/15) = 2 pages → clamp page 3 to page 2
      expect(computeClampedPage(0, 30, 3)).toBe(2);
    });

    it('returns 1 when queue becomes fully empty on page > 1', () => {
      // 0 items total → ceil(0/15) = 0 → max(1, 0) = 1
      expect(computeClampedPage(0, 0, 2)).toBe(1);
    });

    it('returns 1 when total is not yet a full page and we are on page 2', () => {
      // 7 items remain → ceil(7/15) = 1 → page 2 is invalid
      expect(computeClampedPage(0, 7, 2)).toBe(1);
    });

    it('never returns a page below 1', () => {
      // Defensive: even if total=0, clamp floor is 1
      const result = computeClampedPage(0, 0, 5);
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });
});
