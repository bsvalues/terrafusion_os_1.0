import React from 'react';
import type {
  RollbackCalculationInput,
  RollbackCalculationResult,
} from '../domain/rollback/rollbackTypes';
import { currency, KeyValue, Panel } from './shared';

export function RollbackCalculatorPanel({
  result,
  onRun,
}: {
  result: RollbackCalculationResult | null;
  onRun: () => void;
}) {
  return (
    <Panel title="Rollback Calculator">
      <p className="mb-4 text-sm text-slate-600">
        Phase 1 deterministic rollback estimate using mocked tax-year values. Production must wire true
        levy, valuation, and statutory interest sources before final notice issuance.
      </p>

      <button
        type="button"
        onClick={onRun}
        className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
      >
        Run Rollback Calculation
      </button>

      {result && (
        <div className="mt-4 space-y-2 rounded-xl border p-4">
          <KeyValue label="Calculation Version" value={result.calculationVersion} />
          <KeyValue label="Rollback Years" value={result.rollbackYears.join(', ')} />
          <KeyValue label="Additional Tax" value={currency(result.additionalTaxSubtotal)} />
          <KeyValue label="Interest" value={currency(result.interestSubtotal)} />
          <KeyValue label="Penalty" value={currency(result.penaltyAmount)} />
          <KeyValue label="Total Due" value={currency(result.totalDue)} strong />
        </div>
      )}
    </Panel>
  );
}

export function RollbackExplanationPanel({ result }: { result: RollbackCalculationResult | null }) {
  return (
    <Panel title="Calculation Explanation">
      {!result ? (
        <p className="text-sm text-slate-600">
          Run the rollback calculation to generate explainable ledger lines.
        </p>
      ) : (
        <div className="space-y-3">
          {result.explanation.map((line, index) => (
            <div key={`${line.taxYear}-${index}`} className="rounded-xl border p-3">
              <div className="text-xs text-slate-500">{line.taxYear}</div>
              <div className="font-medium">{line.label}</div>
              {line.formula && <code className="mt-2 block text-xs">{line.formula}</code>}
              {typeof line.amount === 'number' && (
                <div className="mt-2 text-sm">{currency(line.amount)}</div>
              )}
              {line.note && <p className="mt-2 text-sm text-slate-600">{line.note}</p>}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
