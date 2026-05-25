import type {
  CurrentUseClassificationType,
  RollbackInput,
  RollbackResult,
  RollbackYearResult,
} from './currentUseTypes';

export const CURRENT_USE_POLICY_VERSION = '2025.09.01';
export const CURRENT_USE_CALCULATION_VERSION = 'CU_ROLLBACK_ENGINE_v2026_05_ALPHA';

export function getRollbackYearCount(
  classificationType: CurrentUseClassificationType,
  removalDate: string,
): number {
  const removal = new Date(removalDate);
  const cutover = new Date('2025-09-01');

  if (classificationType === 'FARM_AND_AGRICULTURAL' && removal >= cutover) {
    return 4;
  }

  return 7;
}

export function getRollbackYears(input: RollbackInput): number[] {
  const count = getRollbackYearCount(input.classificationType, input.removalDate);
  return Array.from({ length: count }, (_, index) => input.taxYearOfRemoval - count + index);
}

export function calculateRollback(input: RollbackInput): RollbackResult {
  const rollbackYears = getRollbackYears(input);
  const selectedYears = input.taxYears.filter((row) => rollbackYears.includes(row.taxYear));

  const yearResults: RollbackYearResult[] = selectedYears.map((row) => {
    const taxableDifference = Math.max(row.trueAndFairValue - row.currentUseValue, 0);
    const additionalTax = roundCurrency((taxableDifference / 1000) * row.levyRatePerThousand);
    const interest = roundCurrency(additionalTax * row.annualInterestRate);
    return { taxYear: row.taxYear, additionalTax, interest };
  });

  const additionalTaxSubtotal = roundCurrency(yearResults.reduce((sum, row) => sum + row.additionalTax, 0));
  const interestSubtotal = roundCurrency(yearResults.reduce((sum, row) => sum + row.interest, 0));
  const penaltyAmount = input.penaltySuppressed ? 0 : roundCurrency(additionalTaxSubtotal * 0.2);
  const totalDue = roundCurrency(additionalTaxSubtotal + interestSubtotal + penaltyAmount);

  return {
    parcelId: input.parcelId,
    rollbackYears,
    calculationVersion: CURRENT_USE_CALCULATION_VERSION,
    policyVersion: CURRENT_USE_POLICY_VERSION,
    yearResults,
    additionalTaxSubtotal,
    interestSubtotal,
    penaltyAmount,
    totalDue,
    explanation: [
      `Policy version ${CURRENT_USE_POLICY_VERSION} resolved rollback years for ${input.classificationType}.`,
      `Rollback years selected: ${rollbackYears.join(', ')}.`,
      'Additional tax = (true and fair value - current use value) ÷ 1000 × levy rate.',
      'Interest is shown as alpha annual estimate pending final statutory interest validation.',
      input.penaltySuppressed
        ? 'Penalty is suppressed because staff selected a qualifying suppression condition.'
        : 'Penalty is calculated as 20% of additional tax subtotal.',
      'Final review remains with authorized county staff.',
    ],
  };
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
