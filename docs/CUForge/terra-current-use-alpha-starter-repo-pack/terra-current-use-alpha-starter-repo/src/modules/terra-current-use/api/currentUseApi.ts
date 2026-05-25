import { calculateRollback } from '../domain/rollback/rollbackEngine';
import type { RollbackInput, RollbackResult } from '../domain/rollback/rollbackTypes';

export interface CurrentUseOverview {
  parcelId: string;
  countyId: string;
  ownerName: string;
  classificationType: string;
  lifecycleState: string;
  classifiedAcres: number;
}

export async function getCurrentUseOverview(parcelId: string): Promise<CurrentUseOverview> {
  return {
    parcelId,
    countyId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    ownerName: 'Sample Owner',
    classificationType: 'FARM_AND_AGRICULTURAL',
    lifecycleState: 'OWNER_WITHDRAWAL_REQUESTED',
    classifiedAcres: 18.42,
  };
}

export async function runRollback(input: RollbackInput): Promise<RollbackResult> {
  return calculateRollback(input);
}
