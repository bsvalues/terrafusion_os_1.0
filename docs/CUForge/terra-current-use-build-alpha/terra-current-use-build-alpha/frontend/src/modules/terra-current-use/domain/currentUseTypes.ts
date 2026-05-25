export type CurrentUseClassificationType =
  | 'FARM_AND_AGRICULTURAL'
  | 'OPEN_SPACE'
  | 'TIMBER_LAND'
  | 'DESIGNATED_FORESTLAND';

export interface CurrentUseOverview {
  parcelId: string;
  countyId: string;
  ownerName: string;
  classificationType: CurrentUseClassificationType;
  lifecycleState: string;
  classifiedAcres: number;
  homesiteExcludedAcres: number;
  policyVersion: string;
}

export interface RollbackTaxYearInput {
  taxYear: number;
  currentUseValue: number;
  trueAndFairValue: number;
  levyRatePerThousand: number;
  annualInterestRate: number;
}

export interface RollbackInput {
  parcelId: string;
  countyId: string;
  classificationType: CurrentUseClassificationType;
  removalDate: string;
  taxYearOfRemoval: number;
  taxYears: RollbackTaxYearInput[];
  penaltySuppressed: boolean;
}

export interface RollbackYearResult {
  taxYear: number;
  additionalTax: number;
  interest: number;
}

export interface RollbackResult {
  parcelId: string;
  rollbackYears: number[];
  calculationVersion: string;
  policyVersion: string;
  yearResults: RollbackYearResult[];
  additionalTaxSubtotal: number;
  interestSubtotal: number;
  penaltyAmount: number;
  totalDue: number;
  explanation: string[];
}
