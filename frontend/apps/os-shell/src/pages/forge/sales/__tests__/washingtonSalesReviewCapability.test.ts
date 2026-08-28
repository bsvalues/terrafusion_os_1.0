import { describe, expect, it } from 'vitest';
import {
  getWashingtonSalesReviewCapability,
  isWashingtonSalesReviewLaunchEnabled,
} from '../washingtonSalesReviewCapability';

const SPOKANE_CAPABILITY_INPUT = {
  county: 'Spokane',
  countyCode: '063',
  stagedSales: 12,
  staticRoutes: {
    salesShard: '/launch-data/washington/sales/by-county/063.json',
  },
};

describe('Forge-owned Washington sales-review capability', () => {
  it('allows an explicit read-only Counties Hub handoff without enabling live-suite fallback', () => {
    expect(isWashingtonSalesReviewLaunchEnabled({ explicitReferenceHandoff: true })).toBe(true);
  });

  it('exposes an eligible contract only for a registered county with staged sales and a shard', () => {
    expect(getWashingtonSalesReviewCapability(SPOKANE_CAPABILITY_INPUT)).toEqual({
      eligible: true,
      status: 'available',
      statusLabel: 'Sales review available',
      unavailableMessage: null,
    });
  });

  it('fails closed when observed county identity is mismatched', () => {
    expect(getWashingtonSalesReviewCapability({
      ...SPOKANE_CAPABILITY_INPUT,
      county: 'Adams',
    })).toMatchObject({
      eligible: false,
      status: 'county-context-invalid',
      statusLabel: 'Registry mismatch',
    });
  });

  it('owns staged-sales and shard availability semantics', () => {
    expect(getWashingtonSalesReviewCapability({
      ...SPOKANE_CAPABILITY_INPUT,
      stagedSales: 0,
    })).toMatchObject({
      eligible: false,
      status: 'no-staged-sales',
      statusLabel: 'Source gap',
    });
    expect(getWashingtonSalesReviewCapability({
      ...SPOKANE_CAPABILITY_INPUT,
      staticRoutes: { salesShard: '   ' },
    })).toMatchObject({
      eligible: false,
      status: 'sales-shard-unavailable',
      statusLabel: 'Source gap',
    });
  });
});
