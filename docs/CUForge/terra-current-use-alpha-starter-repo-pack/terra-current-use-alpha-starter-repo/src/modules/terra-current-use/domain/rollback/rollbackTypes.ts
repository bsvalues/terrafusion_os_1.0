export type ClassificationType =
  | 'FARM_AND_AGRICULTURAL'
  | 'OPEN_SPACE'
  | 'TIMBER_LAND'
  | 'DESIGNATED_FORESTLAND';

export interface RollbackInput {
  parcelId: string;
  classificationType: ClassificationType;
  removalDate: string;
  taxYearOfRemoval: number;
}

export interface RollbackResult {
  rollbackYears: number[];
  calculationVersion: string;
  policyVersion: string;
  additionalTaxSubtotal: number;
  interestSubtotal: number;
  penaltyAmount: number;
  totalDue: number;
  explanation: string[];
}
