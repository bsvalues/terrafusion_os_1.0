import { describe, expect, it } from 'vitest';
import {
  getWashingtonSalesReviewCapability,
  isWashingtonSalesReviewLaunchEnabled,
  parseWashingtonCountiesHubHandoff,
} from '../washingtonSalesReviewCapability';

const SPOKANE_CAPABILITY_INPUT = {
  county: 'Spokane',
  countyCode: '063',
  primarySourceMode: 'public_recorder_export',
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

  it('does not mistake invented repository demo records for assessor-ready public data', () => {
    expect(getWashingtonSalesReviewCapability({
      ...SPOKANE_CAPABILITY_INPUT,
      primarySourceMode: 'repository_reference_demo',
    })).toMatchObject({
      eligible: false,
      status: 'reference-demo-only',
      statusLabel: 'Reference demo only',
    });
  });

  it('validates an exact Counties Hub handoff without granting county authority', () => {
    expect(parseWashingtonCountiesHubHandoff({
      countyCode: '063',
      countyName: 'Spokane',
      resetValuationScope: true,
      launchContext: 'washington-counties-hub',
      dataTrustTier: 'public-reference-not-county-certified',
      referencePackageSource: 'hosted',
      referenceDataPosture: 'public_recorder_export',
      referenceRecordCount: 12,
      latestReferenceSaleDate: '2025-12-31',
      salesReviewAvailability: 'available',
      salesReviewUnavailableMessage: null,
    })).toMatchObject({
      countyCode: '063',
      countyName: 'Spokane',
      salesReviewAvailability: 'available',
    });

    expect(parseWashingtonCountiesHubHandoff({
      countyCode: '063',
      countyName: 'Adams',
      resetValuationScope: true,
      launchContext: 'washington-counties-hub',
      dataTrustTier: 'public-reference-not-county-certified',
      referencePackageSource: 'hosted',
      referenceDataPosture: 'public_recorder_export',
      referenceRecordCount: 12,
      latestReferenceSaleDate: null,
      salesReviewAvailability: 'available',
      salesReviewUnavailableMessage: null,
    })).toBeNull();

    expect(parseWashingtonCountiesHubHandoff({
      countyCode: '063',
      countyName: 'Spokane',
      resetValuationScope: true,
      launchContext: 'washington-counties-hub',
      dataTrustTier: 'public-reference-not-county-certified',
      referencePackageSource: 'repository-reference',
      referenceDataPosture: 'repository_reference_demo',
      referenceRecordCount: 3,
      latestReferenceSaleDate: '2025-11-06',
      salesReviewAvailability: 'available',
      salesReviewUnavailableMessage: null,
    })).toBeNull();
  });
});
