export interface CurrentUseInterestAccrualSegment {
  taxYear: number;
  startDate: string;
  endDate: string;
  dayCount: number;
  annualRate: number;
  interestAmount: number;
  formula: string;
}

export interface CurrentUseInterestAccrualResult {
  taxYear: number;
  additionalTax: number;
  accrualStartDate: string;
  accrualEndDate: string;
  interestTotal: number;
  segments: CurrentUseInterestAccrualSegment[];
}
