
import React, { useEffect, useState } from 'react';
import { getCurrentUseSubmissionBatchMock } from '../reporting/currentUseReportingApi';

export function CurrentUseStateReportingPanel() {
  const [batch, setBatch] = useState<any | null>(null);

  useEffect(() => {
    getCurrentUseSubmissionBatchMock().then(setBatch);
  }, []);

  if (!batch) {
    return <div>Loading reporting batch...</div>;
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">State Reporting Export</h2>

      <div className="mt-4 rounded-xl border p-4">
        <div className="flex justify-between">
          <span>Status</span>
          <span>{batch.status}</span>
        </div>

        <div className="flex justify-between mt-2">
          <span>Reporting Year</span>
          <span>{batch.reportingYear}</span>
        </div>

        <div className="flex justify-between mt-2">
          <span>Records</span>
          <span>{batch.recordCount}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {batch.rows.map((row: any) => (
          <div key={row.parcelId} className="rounded-xl border p-3">
            <div className="font-medium">{row.parcelId}</div>
            <div className="text-sm text-slate-600">
              {row.classificationType} · {row.lifecycleState}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-dashed p-4">
        <p className="text-sm text-slate-600">
          Reporting exports are operational support artifacts and should be validated before submission.
        </p>
      </div>
    </section>
  );
}
