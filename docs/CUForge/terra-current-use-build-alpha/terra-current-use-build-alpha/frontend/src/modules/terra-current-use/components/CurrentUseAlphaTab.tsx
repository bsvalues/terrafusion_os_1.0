import React, { useEffect, useState } from 'react';
import { getCurrentUseOverview, runCurrentUseRollback } from '../api/currentUseApi';
import type { CurrentUseOverview, RollbackResult } from '../domain/currentUseTypes';

export function CurrentUseAlphaTab({ parcelId }: { parcelId: string }) {
  const [overview, setOverview] = useState<CurrentUseOverview | null>(null);
  const [rollback, setRollback] = useState<RollbackResult | null>(null);

  useEffect(() => {
    getCurrentUseOverview(parcelId).then(setOverview);
  }, [parcelId]);

  if (!overview) return <div className="p-6 text-sm text-slate-600">Loading Current Use...</div>;

  return (
    <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
      <header>
        <div className="text-sm uppercase tracking-wide text-slate-500">TerraForge</div>
        <h1 className="text-2xl font-semibold">Current Use Command Center</h1>
        <p className="text-sm text-slate-600">{overview.ownerName} · Parcel {overview.parcelId}</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Classification" value={overview.classificationType} />
        <Metric label="Lifecycle" value={overview.lifecycleState} />
        <Metric label="Classified Acres" value={overview.classifiedAcres.toString()} />
        <Metric label="Policy" value={overview.policyVersion} />
      </section>

      <button
        type="button"
        onClick={async () => setRollback(await runCurrentUseRollback(parcelId))}
        className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
      >
        Run Rollback Calculation
      </button>

      {rollback && <RollbackResultPanel result={rollback} />}

      <section className="rounded-xl border border-dashed p-4">
        <h2 className="font-semibold">Notice Preview</h2>
        <p className="mt-2 text-sm text-slate-600">
          Draft preview only. Final notices require authorized human review and approval.
        </p>
      </section>
    </div>
  );
}

function RollbackResultPanel({ result }: { result: RollbackResult }) {
  return (
    <section className="rounded-xl border p-5">
      <h2 className="text-lg font-semibold">Rollback Result</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Years" value={result.rollbackYears.join(', ')} />
        <Metric label="Additional Tax" value={currency(result.additionalTaxSubtotal)} />
        <Metric label="Interest" value={currency(result.interestSubtotal)} />
        <Metric label="Total Due" value={currency(result.totalDue)} />
      </div>

      <div className="mt-5 rounded-xl border p-4">
        <h3 className="font-semibold">Explanation Ledger</h3>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
          {result.explanation.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Calculation {result.calculationVersion} · Policy {result.policyVersion}
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
