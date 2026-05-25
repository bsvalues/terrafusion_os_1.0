import type { ClassificationType, RemovalType } from '../../types/currentUseTypes';

export interface TaxYearValue {
  taxYear: number;
  value: number;
}

export interface LevyRate {
  taxYear: number;
  ratePerThousand: number;
}

export interface InterestRate {
  taxYear: number;
  annualRate: number;
}

export type PenaltySuppressionReason =
  | 'QUALIFYING_VOLUNTARY_WITHDRAWAL'
  | 'STATUTORY_EXCEPTION'
  | 'AUTHORIZED_STAFF_OVERRIDE'
  | 'NOT_APPLICABLE';

export type StatutoryExceptionReason =
  | 'GOVERNMENT_TRANSFER_EXCHANGE'
  | 'EMINENT_DOMAIN'
  | 'NATURAL_DISASTER'
  | 'OFFICIAL_ACTION_DISALLOWS_USE'
  | 'CHURCH_TRANSFER_EXEMPTION'
  | 'QUALIFIED_CONSERVATION_ACQUISITION'
  | 'FARM_AG_CONSERVATION_REMOVAL'
  | 'NEW_STATUTORY_EXEMPTION'
  | 'FORESTRY_RIPARIAN_EASEMENT'
  | 'CONSERVATION_EASEMENT'
  | 'POST_DEATH_TRANSFER_RULE'
  | 'ERROR_NO_FAULT_OF_OWNER'
  | 'GOVERNMENT_TIMBER_MANAGEMENT_TRANSFER'
  | 'NONE';

export interface RollbackCalculationInput {
  parcelId: string;
  countyId: string;
  removalDate: string;
  taxYearOfRemoval: number;
  classificationType: ClassificationType;
  removalType: RemovalType;
  currentUseAssessedValuesByYear: TaxYearValue[];
  trueAndFairValuesByYear: TaxYearValue[];
  levyRatesByYear: LevyRate[];
  interestRatesByYear: InterestRate[];
  penaltySuppressionReason?: PenaltySuppressionReason;
  statutoryExceptionReason?: StatutoryExceptionReason;
  partialRemovalAcres?: number;
  totalClassifiedAcres?: number;
  createdBy: string;
}

export interface RollbackExplanationLine {
  taxYear: number | 'SUMMARY';
  label: string;
  formula?: string;
  amount?: number;
  note?: string;
}

export interface RollbackCalculationResult {
  calculationId: string;
  parcelId: string;
  rollbackYears: number[];
  additionalTaxSubtotal: number;
  interestSubtotal: number;
  penaltyAmount: number;
  totalDue: number;
  penaltyApplied: boolean;
  penaltySuppressionReason?: PenaltySuppressionReason;
  statutoryExceptionApplied: boolean;
  statutoryExceptionReason?: StatutoryExceptionReason;
  calculationVersion: string;
  explanation: RollbackExplanationLine[];
  createdAt: string;
  createdBy: string;
}
