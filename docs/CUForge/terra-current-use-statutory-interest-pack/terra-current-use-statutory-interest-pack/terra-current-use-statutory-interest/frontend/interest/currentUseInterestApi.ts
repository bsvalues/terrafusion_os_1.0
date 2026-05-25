import type { CurrentUseInterestAccrualResult } from './currentUseInterestTypes';

export async function calculateCurrentUseInterestMock(): Promise<CurrentUseInterestAccrualResult> {
  return {
    taxYear: 2025,
    additionalTax: 2671.75,
    accrualStartDate: '2025-04-30',
    accrualEndDate: '2026-03-15',
    interestTotal: 280.03,
    segments: [
      {
        taxYear: 2025,
        startDate: '2025-04-30',
        endDate: '2026-03-15',
        dayCount: 319,
        annualRate: 0.12,
        interestAmount: 280.03,
        formula: '2671.75 × 0.12 × 319 / 365',
      },
    ],
  };
}
