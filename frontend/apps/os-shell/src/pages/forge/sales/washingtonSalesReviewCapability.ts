/**
 * Forge-owned launch contract for the Washington public sales-review package.
 *
 * The OS shell may present this result and navigate to SalesForge, but it does
 * not interpret staged-sales or shard-route fields as suite capability rules.
 */

import type { WashingtonReferencePackageSource } from '@/lib/washingtonAssessorReferencePackage';
import {
  isWashingtonLaunchDataEnabled,
  WASHINGTON_COUNTIES,
} from './washingtonLaunchApi';

export interface WashingtonSalesReviewCapabilityInput {
  county: string;
  countyCode: string;
  primarySourceMode: string;
  prometheusStatus: string;
  latestSaleDate: string | null;
  stagedSales: number;
  needsReview: number;
  confidence: {
    rawStatus: string;
    rawDriftDetected: boolean;
  };
  staticRoutes: {
    salesShard: string;
  };
}

export type WashingtonSalesReviewCapabilityStatus =
  | 'available'
  | 'county-context-invalid'
  | 'reference-demo-only'
  | 'source-posture-unavailable'
  | 'no-staged-sales'
  | 'sales-shard-unavailable';

export interface WashingtonSalesReviewCapability {
  eligible: boolean;
  status: WashingtonSalesReviewCapabilityStatus;
  statusLabel: string;
  unavailableMessage: string | null;
  referenceData: WashingtonSalesReviewReferenceData;
}

export interface WashingtonSalesReviewObservedReference {
  recordCount: number;
  latestSaleDate: string | null;
  needsReview: number;
  runtimePosture: string;
  sourceStatus: string;
  sourceDriftDetected: boolean;
}

export interface WashingtonSalesReviewReferenceData {
  posture: string;
  isSyntheticReference: boolean;
  observed: WashingtonSalesReviewObservedReference | null;
}

export type WashingtonSalesReviewAvailability = 'available' | 'unavailable';

export interface WashingtonCountiesHubHandoff {
  countyCode: string;
  countyName: string;
  resetValuationScope: true;
  launchContext: 'washington-counties-hub';
  dataTrustTier: 'public-reference-not-county-certified';
  referencePackageSource: WashingtonReferencePackageSource;
  referenceDataPosture: string;
  referenceRecordCount: number | null;
  latestReferenceSaleDate: string | null;
  salesReviewAvailability: WashingtonSalesReviewAvailability;
  salesReviewUnavailableMessage: string | null;
}

const REPOSITORY_REFERENCE_DEMO_POSTURE = 'repository_reference_demo';

function normalizeReferenceDataPosture(value: string): string {
  return value.trim().toLowerCase();
}

function isRepositoryReferenceDemoPosture(value: string): boolean {
  return normalizeReferenceDataPosture(value) === REPOSITORY_REFERENCE_DEMO_POSTURE;
}

function isUnavailableReferenceDataPosture(value: string): boolean {
  const normalizedPosture = normalizeReferenceDataPosture(value);
  return normalizedPosture.length === 0 || normalizedPosture === 'unavailable';
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null
    || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

/**
 * Validate the shell-to-Forge county-context handoff before any suite uses it.
 * This is navigation context only; it never substitutes for authenticated
 * county authority on protected TerraFusion APIs.
 */
export function parseWashingtonCountiesHubHandoff(
  metadata: Record<string, unknown> | undefined,
): WashingtonCountiesHubHandoff | null {
  if (
    !metadata
    || metadata.launchContext !== 'washington-counties-hub'
    || metadata.dataTrustTier !== 'public-reference-not-county-certified'
    || typeof metadata.countyCode !== 'string'
    || typeof metadata.countyName !== 'string'
    || metadata.resetValuationScope !== true
    || (
      metadata.referencePackageSource !== 'hosted'
      && metadata.referencePackageSource !== 'repository-reference'
    )
    || typeof metadata.referenceDataPosture !== 'string'
    || !(
      metadata.referenceRecordCount === undefined
      || isNullableFiniteNumber(metadata.referenceRecordCount)
    )
    || !(
      metadata.latestReferenceSaleDate === undefined
      || isNullableString(metadata.latestReferenceSaleDate)
    )
    || (
      metadata.salesReviewAvailability !== undefined
      && metadata.salesReviewAvailability !== 'available'
      && metadata.salesReviewAvailability !== 'unavailable'
    )
    || !(
      metadata.salesReviewUnavailableMessage === undefined
      || isNullableString(metadata.salesReviewUnavailableMessage)
    )
  ) {
    return null;
  }

  const countyName = metadata.countyName.replace(/\s+county$/i, '').trim();
  const registeredCounty = WASHINGTON_COUNTIES.find(
    (county) => county.code === metadata.countyCode
      && county.name.toLowerCase() === countyName.toLowerCase(),
  );
  if (!registeredCounty) return null;

  const referenceRecordCount = typeof metadata.referenceRecordCount === 'number'
    ? metadata.referenceRecordCount
    : null;
  const latestReferenceSaleDate = typeof metadata.latestReferenceSaleDate === 'string'
    ? metadata.latestReferenceSaleDate
    : null;
  const salesReviewAvailability = metadata.salesReviewAvailability === 'available'
    ? 'available'
    : 'unavailable';
  const salesReviewUnavailableMessage = typeof metadata.salesReviewUnavailableMessage === 'string'
    ? metadata.salesReviewUnavailableMessage
    : null;

  if (
    salesReviewAvailability === 'available'
    && (
      referenceRecordCount === null
      || referenceRecordCount <= 0
      || isUnavailableReferenceDataPosture(metadata.referenceDataPosture)
      || isRepositoryReferenceDemoPosture(metadata.referenceDataPosture)
    )
  ) {
    return null;
  }

  return {
    countyCode: registeredCounty.code,
    countyName: registeredCounty.name,
    resetValuationScope: true,
    launchContext: 'washington-counties-hub',
    dataTrustTier: 'public-reference-not-county-certified',
    referencePackageSource: metadata.referencePackageSource,
    referenceDataPosture: metadata.referenceDataPosture,
    referenceRecordCount,
    latestReferenceSaleDate,
    salesReviewAvailability,
    salesReviewUnavailableMessage,
  };
}

export function getWashingtonSalesReviewCapability(
  input: WashingtonSalesReviewCapabilityInput,
): WashingtonSalesReviewCapability {
  const observedName = input.county.replace(/\s+county$/i, '').trim().toLowerCase();
  const registeredCounty = WASHINGTON_COUNTIES.some(
    (county) => county.code === input.countyCode && county.name.toLowerCase() === observedName,
  );
  const normalizedPosture = normalizeReferenceDataPosture(input.primarySourceMode);
  const isSyntheticReference = isRepositoryReferenceDemoPosture(input.primarySourceMode);
  const isSourcePostureUnavailable = isUnavailableReferenceDataPosture(input.primarySourceMode);
  const referenceData: WashingtonSalesReviewReferenceData = {
    posture: normalizedPosture || 'unavailable',
    isSyntheticReference,
    observed: registeredCounty && !isSyntheticReference && !isSourcePostureUnavailable
      ? {
          recordCount: input.stagedSales,
          latestSaleDate: input.latestSaleDate,
          needsReview: input.needsReview,
          runtimePosture: input.prometheusStatus,
          sourceStatus: input.confidence.rawStatus,
          sourceDriftDetected: input.confidence.rawDriftDetected,
        }
      : null,
  };

  if (!registeredCounty) {
    return {
      eligible: false,
      status: 'county-context-invalid',
      statusLabel: 'Registry mismatch',
      unavailableMessage:
        'The observed county name and code do not match the Washington registry. '
        + 'Sales review remains unavailable instead of guessing a county context.',
      referenceData,
    };
  }

  if (isSyntheticReference) {
    return {
      eligible: false,
      status: 'reference-demo-only',
      statusLabel: 'Reference demo only',
      unavailableMessage:
        'Only invented repository reference records are available for this county. '
        + 'They remain visible as test evidence but cannot enable an assessor sales workflow.',
      referenceData,
    };
  }

  if (isSourcePostureUnavailable) {
    return {
      eligible: false,
      status: 'source-posture-unavailable',
      statusLabel: 'Source gap',
      unavailableMessage:
        'The governed source posture is unavailable for this county. '
        + 'Sales review remains unavailable instead of inferring public-data trust.',
      referenceData,
    };
  }

  if (input.stagedSales <= 0) {
    return {
      eligible: false,
      status: 'no-staged-sales',
      statusLabel: 'Source gap',
      unavailableMessage:
        'No governed staged sales are available for this county. '
        + 'Sales review remains unavailable instead of falling back to another county.',
      referenceData,
    };
  }

  if (!input.staticRoutes.salesShard.trim()) {
    return {
      eligible: false,
      status: 'sales-shard-unavailable',
      statusLabel: 'Source gap',
      unavailableMessage:
        'The governed TerraForge sales package is unavailable for this county. '
        + 'Sales review remains unavailable instead of falling back to another county.',
      referenceData,
    };
  }

  return {
    eligible: true,
    status: 'available',
    statusLabel: 'Sales review available',
    unavailableMessage: null,
    referenceData,
  };
}

export function isWashingtonSalesReviewLaunchEnabled(options?: {
  explicitReferenceHandoff?: boolean;
}): boolean {
  return options?.explicitReferenceHandoff === true || isWashingtonLaunchDataEnabled();
}
