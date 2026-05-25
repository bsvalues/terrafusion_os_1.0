import React, { useEffect, useState } from 'react';
import { getCurrentUseOverview, runRollback, type CurrentUseOverview } from '../api/currentUseApi';
import type { RollbackResult } from '../domain/rollback/rollbackTypes';

export function CurrentUseAlphaTab({ parcelId }: { parcelId: string }) {
  const [overview, setOverview] = useState<CurrentUseOverview | null>(null);
  const [rollback, setRollback] = useState<RollbackResult | null>(null);

  useEffect(() => {
    getCurrentUseOverview(parcelId).then(setOverview);
  }, [parcelId]);

  async function handleRunRollback() {
    const result = await runRollback({
      parcelId,
      classificationType: 'FARM_AND_AGRICULTURAL',
      removalDate: '2026-03-15',
      taxYearOfRemoval: 2026,
    });

    setRollback(result);
  }

  if (!overview) {
    return <div className="p-6 text-sm text-slate-600">Loading Current Use...</div>;
  }

  return (
    <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
      <header>
        <div className="text-sm uppercase tracking-wide text-slate-500">TerraForge</div>
        <h1 className="text-2xl font-semibold">Current Use Command Center</h1>
        <p className="text-sm text-slate-600">
          Parcel {overview.parcelId} · {overview.ownerName}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card label="Classification" value={overview.classificationType} />
        <Card label="Lifecycle" value={overview.lifecycleState} />
        <Card label="Classified Acres" value={String(overview.classifiedAcres)} />
      </section>

      <button
        type="button"
        className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm"
        onClick={handleRunRollback}
      >
        Run Rollback Calculation
      </button>

      {rollback && (
        <section className="rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Rollback Result</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Card label="Policy" value={rollback.policyVersion} />
            <Card label="Calculation" value={rollback.calculationVersion} />
            <Card label="Years" value={rollback.rollbackYears.join(', ')} />
            <Card label="Total Due" value={`$${rollback.totalDue.toFixed(2)}`} />
          </div>

          <h3 className="mt-4 font-semibold">Explanation Ledger</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {rollback.explanation.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-dashed p-4">
        <h2 className="font-semibold">Notice Preview</h2>
        <p className="mt-2 text-sm text-slate-600">
          Draft preview only. Final notices require authorized human review and approval.
        </p>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
