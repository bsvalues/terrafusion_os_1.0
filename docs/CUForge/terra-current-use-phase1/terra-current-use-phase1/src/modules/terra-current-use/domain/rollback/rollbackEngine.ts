import { randomUUID } from 'crypto';
import {
  buildRollbackYears,
  CURRENT_USE_ROLLBACK_ENGINE_VERSION,
  determineRollbackYearCount,
  shouldSuppressPenalty,
} from './rollbackRules';
import type {
  RollbackCalculationInput,
  RollbackCalculationResult,
  RollbackExplanationLine,
} from './rollbackTypes';

function makeId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return randomUUID();
}

function findValue<T extends { taxYear: number }>(rows: T[], taxYear: number): T | undefined {
  return rows.find((row) => row.taxYear === taxYear);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateTax(value: number, ratePerThousand: number): number {
  return (value / 1000) * ratePerThousand;
}

function calculateSimpleInterest(additionalTax: number, annualRate: number): number {
  // Phase 1 placeholder.
  // Production must compute statutory date-based interest from due date to removal date.
  return additionalTax * annualRate;
}

export function calculateRollback(input: RollbackCalculationInput): RollbackCalculationResult {
  const rollbackYearCount = determineRollbackYearCount(input.classificationType, input.removalDate);
  const rollbackYears = buildRollbackYears(input.taxYearOfRemoval, rollbackYearCount);

  const explanation: RollbackExplanationLine[] = [];
  let additionalTaxSubtotal = 0;
  let interestSubtotal = 0;

  for (const taxYear of rollbackYears) {
    const currentUseValue = findValue(input.currentUseAssessedValuesByYear, taxYear)?.value;
    const trueAndFairValue = findValue(input.trueAndFairValuesByYear, taxYear)?.value;
    const levyRate = findValue(input.levyRatesByYear, taxYear)?.ratePerThousand;
    const interestRate = findValue(input.interestRatesByYear, taxYear)?.annualRate ?? 0;

    if (currentUseValue == null || trueAndFairValue == null || levyRate == null) {
      explanation.push({
        taxYear,
        label: 'Skipped year — missing required value or levy rate',
        note: 'Current-use value, true and fair value, and levy rate are required.',
      });
      continue;
    }

    const currentUseTax = calculateTax(currentUseValue, levyRate);
    const trueAndFairTax = calculateTax(trueAndFairValue, levyRate);
    const additionalTax = Math.max(0, trueAndFairTax - currentUseTax);
    const interest = calculateSimpleInterest(additionalTax, interestRate);

    additionalTaxSubtotal += additionalTax;
    interestSubtotal += interest;

    explanation.push({
      taxYear,
      label: 'Additional tax difference',
      formula: `(${trueAndFairValue} / 1000 × ${levyRate}) - (${currentUseValue} / 1000 × ${levyRate})`,
      amount: roundCurrency(additionalTax),
    });

    explanation.push({
      taxYear,
      label: 'Estimated statutory interest',
      formula: `${roundCurrency(additionalTax)} × ${interestRate}`,
      amount: roundCurrency(interest),
      note: 'Phase 1 uses simplified annual interest. Production must compute statutory date-based interest.',
    });
  }

  const statutoryExceptionApplied = Boolean(
    input.statutoryExceptionReason && input.statutoryExceptionReason !== 'NONE',
  );

  const penaltyApplied = !shouldSuppressPenalty(input);
  const penaltyBase = additionalTaxSubtotal + interestSubtotal;
  const penaltyAmount = penaltyApplied ? penaltyBase * 0.2 : 0;
  const totalDue = statutoryExceptionApplied ? 0 : penaltyBase + penaltyAmount;

  explanation.push({
    taxYear: 'SUMMARY',
    label: 'Rollback period',
    note: `${rollbackYearCount} rollback year(s) applied for ${input.classificationType}.`,
  });

  explanation.push({
    taxYear: 'SUMMARY',
    label: penaltyApplied ? '20% penalty applied' : '20% penalty suppressed',
    formula: penaltyApplied ? `(${roundCurrency(penaltyBase)}) × 0.20` : undefined,
    amount: roundCurrency(penaltyAmount),
    note: input.penaltySuppressionReason ?? input.statutoryExceptionReason ?? undefined,
  });

  if (statutoryExceptionApplied) {
    explanation.push({
      taxYear: 'SUMMARY',
      label: 'Statutory exception applied',
      amount: 0,
      note: `Total due set to $0 because exception reason was marked: ${input.statutoryExceptionReason}`,
    });
  }

  return {
    calculationId: makeId(),
    parcelId: input.parcelId,
    rollbackYears,
    additionalTaxSubtotal: roundCurrency(additionalTaxSubtotal),
    interestSubtotal: roundCurrency(interestSubtotal),
    penaltyAmount: roundCurrency(penaltyAmount),
    totalDue: roundCurrency(totalDue),
    penaltyApplied,
    penaltySuppressionReason: input.penaltySuppressionReason,
    statutoryExceptionApplied,
    statutoryExceptionReason: input.statutoryExceptionReason,
    calculationVersion: CURRENT_USE_ROLLBACK_ENGINE_VERSION,
    explanation,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };
}
