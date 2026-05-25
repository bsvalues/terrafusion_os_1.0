import React, { useEffect, useState } from 'react';
import { calculateCurrentUseInterestMock } from '../interest/currentUseInterestApi';
import type { CurrentUseInterestAccrualResult } from '../interest/currentUseInterestTypes';

export function CurrentUseInterestLedgerPanel() {
  const [result, setResult] = useState<CurrentUseInterestAccrualResult | null>(null);

  useEffect(() => {
    calculateCurrentUseInterestMock().then(setResult);
  }, []);

  if (!result) {
    return (
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Interest Ledger</h2>
        <p className="mt-2 text-sm text-slate-600">Loading interest ledger...</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Interest Ledger</h2>
      <p className="mt-2 text-sm text-slate-600">
        Date-based statutory interest accrual from {result.accrualStartDate} to {result.accrualEndDate}.
      </p>

      <div className="mt-4 rounded-xl border p-4">
        <div className="flex justify-between">
          <span>Tax Year</span>
          <span>{result.taxYear}</span>
        </div>
        <div className="flex justify-between">
          <span>Additional Tax</span>
          <span>{currency(result.additionalTax)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Interest Total</span>
          <span>{currency(result.interestTotal)}</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {result.segments.map((segment) => (
          <div key={`${segment.startDate}-${segment.endDate}`} className="rounded-xl border p-3">
            <div className="font-medium">
              {segment.startDate} → {segment.endDate}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {segment.dayCount} days · annual rate {segment.annualRate}
            </div>
            <code className="mt-2 block text-xs">{segment.formula}</code>
            <div className="mt-2 text-sm font-semibold">{currency(segment.interestAmount)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
