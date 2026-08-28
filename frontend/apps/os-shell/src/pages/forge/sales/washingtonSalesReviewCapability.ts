/**
 * Forge-owned launch contract for the Washington public sales-review package.
 *
 * The OS shell may present this result and navigate to SalesForge, but it does
 * not interpret staged-sales or shard-route fields as suite capability rules.
 */

import {
  isWashingtonLaunchDataEnabled,
  WASHINGTON_COUNTIES,
} from './washingtonLaunchApi';

export interface WashingtonSalesReviewCapabilityInput {
  county: string;
  countyCode: string;
  stagedSales: number;
  staticRoutes: {
    salesShard: string;
  };
}

export type WashingtonSalesReviewCapabilityStatus =
  | 'available'
  | 'county-context-invalid'
  | 'no-staged-sales'
  | 'sales-shard-unavailable';

export interface WashingtonSalesReviewCapability {
  eligible: boolean;
  status: WashingtonSalesReviewCapabilityStatus;
  statusLabel: string;
  unavailableMessage: string | null;
}

export function getWashingtonSalesReviewCapability(
  input: WashingtonSalesReviewCapabilityInput,
): WashingtonSalesReviewCapability {
  const observedName = input.county.replace(/\s+county$/i, '').trim().toLowerCase();
  const registeredCounty = WASHINGTON_COUNTIES.some(
    (county) => county.code === input.countyCode && county.name.toLowerCase() === observedName,
  );

  if (!registeredCounty) {
    return {
      eligible: false,
      status: 'county-context-invalid',
      statusLabel: 'Registry mismatch',
      unavailableMessage:
        'The observed county name and code do not match the Washington registry. '
        + 'TerraForge remains disabled instead of guessing a county context.',
    };
  }

  if (input.stagedSales <= 0) {
    return {
      eligible: false,
      status: 'no-staged-sales',
      statusLabel: 'Source gap',
      unavailableMessage:
        'No governed staged sales are available for this county. '
        + 'TerraForge remains disabled instead of falling back to another county.',
    };
  }

  if (!input.staticRoutes.salesShard.trim()) {
    return {
      eligible: false,
      status: 'sales-shard-unavailable',
      statusLabel: 'Source gap',
      unavailableMessage:
        'The governed TerraForge sales package is unavailable for this county. '
        + 'TerraForge remains disabled instead of falling back to another county.',
    };
  }

  return {
    eligible: true,
    status: 'available',
    statusLabel: 'Sales review available',
    unavailableMessage: null,
  };
}

export function isWashingtonSalesReviewLaunchEnabled(): boolean {
  return isWashingtonLaunchDataEnabled();
}
