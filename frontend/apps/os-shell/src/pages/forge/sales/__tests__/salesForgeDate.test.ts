import { describe, expect, it } from 'vitest';

import { formatSaleDate } from '../salesForgeDate';

describe('formatSaleDate', () => {
  it('preserves the assessor calendar date for canonical date-only values', () => {
    expect(
      formatSaleDate('2025-07-31', { month: 'short', day: 'numeric', year: '2-digit' })
    ).toBe('Jul 31, 25');
  });

  it('keeps null and invalid values truthful', () => {
    expect(formatSaleDate(null)).toBe('—');
    expect(formatSaleDate('not-a-date')).toBe('not-a-date');
  });
});
