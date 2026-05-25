import React, { useEffect, useState } from 'react';
import { getCurrentUseImportBatchesMock } from '../import/currentUseImportApi';
import type { CurrentUseImportBatch } from '../import/currentUseImportTypes';

export function CurrentUseImportMigrationPanel({ countyId }: { countyId: string }) {
  const [batches, setBatches] = useState<CurrentUseImportBatch[]>([]);

  useEffect(() => {
    getCurrentUseImportBatchesMock(countyId).then(setBatches);
  }, [countyId]);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Legacy Import & Migration</h2>
      <p className="mt-2 text-sm text-slate-600">
        Validate legacy Current Use spreadsheets before importing into governed records.
      </p>

      <div className="mt-4 space-y-3">
        {batches.map((batch) => (
          <div key={batch.importBatchId} className="rounded-xl border p-4">
            <div className="flex flex-col justify-between gap-2 md:flex-row">
              <div>
                <div className="font-semibold">{batch.sourceFileName}</div>
                <div className="text-sm text-slate-600">
                  {batch.importType.replaceAll('_', ' ')} · {batch.status.replaceAll('_', ' ')}
                </div>
              </div>

              <div className="text-right text-sm">
                <div>{batch.validRows}/{batch.totalRows} valid</div>
                <div>{batch.errorRows} errors · {batch.warningRows} warnings</div>
              </div>
            </div>

            {batch.issues.length > 0 && (
              <div className="mt-3 space-y-2">
                {batch.issues.map((issue) => (
                  <div key={`${batch.importBatchId}-${issue.rowNumber}-${issue.fieldName}`} className="rounded-xl border p-3">
                    <div className={issue.severity === 'ERROR' ? 'font-medium text-red-700' : 'font-medium'}>
                      Row {issue.rowNumber} · {issue.fieldName} · {issue.severity}
                    </div>
                    <p className="text-sm text-slate-700">{issue.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-dashed p-4">
        <p className="text-sm text-slate-600">
          Imports must validate before commit. Dry-run first; preserve source files in Dossier.
        </p>
      </div>
    </section>
  );
}
