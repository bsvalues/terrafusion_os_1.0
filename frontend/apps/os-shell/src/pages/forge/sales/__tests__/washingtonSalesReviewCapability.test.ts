import { describe, expect, it } from 'vitest';
import {
  getWashingtonSalesReviewCapability,
  isWashingtonSalesReviewLaunchEnabled,
  parseWashingtonCountiesHubHandoff,
  type WashingtonSalesReviewCapabilityInput,
} from '../washingtonSalesReviewCapability';

const SPOKANE_CAPABILITY_INPUT = {
  county: 'Spokane',
  countyCode: '063',
  packageIdentity: {
    statusSchemaVersion: 'terrafusion.washington.county-status.v1',
    generatedAt: '2026-08-28T00:00:00.000Z',
    sourcePosture: 'public_recorder_export',
  },
  primarySourceMode: 'public_recorder_export',
  prometheusStatus: 'reference_ready',
  latestSaleDate: '2025-12-31',
  stagedSales: 12,
  needsReview: 4,
  salesShardVerification: 'verified',
  confidence: {
    rawStatus: 'observed',
    rawDriftDetected: false,
  },
  staticRoutes: {
    salesShard: '/launch-data/washington/sales/by-county/063.json',
  },
} satisfies WashingtonSalesReviewCapabilityInput;

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
      referenceData: {
        posture: 'public_recorder_export',
        isSyntheticReference: false,
        observed: {
          recordCount: 12,
          latestSaleDate: '2025-12-31',
          needsReview: 4,
          runtimePosture: 'reference_ready',
          sourceStatus: 'observed',
          sourceDriftDetected: false,
        },
      },
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

  it('requires selected-county shard verification before exposing status claims', () => {
    expect(getWashingtonSalesReviewCapability({
      ...SPOKANE_CAPABILITY_INPUT,
      salesShardVerification: 'unverified',
    })).toMatchObject({
      eligible: false,
      status: 'sales-shard-verification-required',
      statusLabel: 'Verification required',
      referenceData: {
        observed: null,
      },
    });
  });

  it('requires selected-county verification even when status claims zero staged sales', () => {
    expect(getWashingtonSalesReviewCapability({
      ...SPOKANE_CAPABILITY_INPUT,
      stagedSales: 0,
      needsReview: 9,
      latestSaleDate: '2099-12-31',
      salesShardVerification: 'unverified',
    })).toMatchObject({
      eligible: false,
      status: 'sales-shard-verification-required',
      statusLabel: 'Verification required',
      referenceData: {
        observed: null,
      },
    });
  });

  it('does not treat not-required as observed public-sales evidence', () => {
    expect(getWashingtonSalesReviewCapability({
      ...SPOKANE_CAPABILITY_INPUT,
      stagedSales: 0,
      needsReview: 9,
      latestSaleDate: '2099-12-31',
      salesShardVerification: 'not-required',
    })).toMatchObject({
      eligible: false,
      status: 'sales-shard-verification-required',
      statusLabel: 'Verification required',
      referenceData: {
        observed: null,
      },
    });
  });

  it('does not mistake invented repository demo records for assessor-ready public data', () => {
    expect(getWashingtonSalesReviewCapability({
      ...SPOKANE_CAPABILITY_INPUT,
      primarySourceMode: ' Repository_Reference_Demo ',
    })).toMatchObject({
      eligible: false,
      status: 'reference-demo-only',
      statusLabel: 'Reference demo only',
      referenceData: {
        posture: 'repository_reference_demo',
        isSyntheticReference: true,
        observed: null,
      },
    });
  });

  it('fails closed when the Forge-owned source posture is unavailable', () => {
    expect(getWashingtonSalesReviewCapability({
      ...SPOKANE_CAPABILITY_INPUT,
      primarySourceMode: '  ',
    })).toMatchObject({
      eligible: false,
      status: 'source-posture-unavailable',
      statusLabel: 'Source gap',
      referenceData: {
        posture: 'unavailable',
        isSyntheticReference: false,
        observed: null,
      },
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
