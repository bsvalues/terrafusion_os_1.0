import { calculateRollback } from '../domain/rollbackEngine';
import type { CurrentUseOverview, RollbackInput, RollbackResult } from '../domain/currentUseTypes';

const demoTaxYears = [
  { taxYear: 2022, currentUseValue: 39000, trueAndFairValue: 280000, levyRatePerThousand: 10.1, annualInterestRate: 0.12 },
  { taxYear: 2023, currentUseValue: 40500, trueAndFairValue: 295000, levyRatePerThousand: 9.95, annualInterestRate: 0.12 },
  { taxYear: 2024, currentUseValue: 41750, trueAndFairValue: 307000, levyRatePerThousand: 9.8, annualInterestRate: 0.12 },
  { taxYear: 2025, currentUseValue: 42500, trueAndFairValue: 318000, levyRatePerThousand: 9.7, annualInterestRate: 0.12 },
];

export async function getCurrentUseOverview(parcelId: string): Promise<CurrentUseOverview> {
  return {
    parcelId,
    countyId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    ownerName: 'Sample Owner',
    classificationType: 'FARM_AND_AGRICULTURAL',
    lifecycleState: 'OWNER_WITHDRAWAL_REQUESTED',
    classifiedAcres: 18.42,
    homesiteExcludedAcres: 0.76,
    policyVersion: '2025.09.01',
  };
}

export async function runCurrentUseRollback(parcelId: string): Promise<RollbackResult> {
  const overview = await getCurrentUseOverview(parcelId);
  const input: RollbackInput = {
    parcelId,
    countyId: overview.countyId,
    classificationType: overview.classificationType,
    removalDate: '2026-03-15',
    taxYearOfRemoval: 2026,
    taxYears: demoTaxYears,
    penaltySuppressed: true,
  };

  return calculateRollback(input);
}
