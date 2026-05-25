import React, { useEffect, useState } from 'react';
import { Panel } from './shared';
import { getCurrentUseComplianceSummaryMock } from '../compliance/currentUseComplianceApi';
import type { CurrentUseComplianceSummary } from '../compliance/currentUseComplianceTypes';

export function CurrentUseCompliancePanel({ parcelId }: { parcelId: string }) {
  const [summary, setSummary] = useState<CurrentUseComplianceSummary | null>(null);

  useEffect(() => {
    getCurrentUseComplianceSummaryMock(parcelId).then(setSummary);
  }, [parcelId]);

  if (!summary) {
    return (
      <Panel title="Compliance Monitoring">
        <p className="text-sm text-slate-600">Loading compliance summary...</p>
      </Panel>
    );
  }

  return (
    <Panel title="Compliance Monitoring">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ComplianceMetric label="Status" value={summary.status.replaceAll('_', ' ')} />
          <ComplianceMetric label="Risk Score" value={String(summary.riskScore)} />
          <ComplianceMetric label="Next Inspection" value={summary.nextInspectionDueDate ?? 'Not scheduled'} />
        </div>

        {summary.riskReasons.length > 0 && (
          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">Risk Reasons</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              {summary.riskReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {summary.recentInspections.map((inspection) => (
            <div key={inspection.inspectionId} className="rounded-xl border p-4">
              <div className="flex flex-col justify-between gap-2 md:flex-row">
                <div>
                  <div className="font-semibold">{inspection.status.replaceAll('_', ' ')}</div>
                  <div className="text-sm text-slate-600">
                    {inspection.inspectorName ?? 'Unassigned'} · {inspection.completedDate ?? inspection.scheduledDate}
                  </div>
                </div>
                <div className="text-right text-sm">
                  {inspection.findings.filter((finding) => finding.riskFlag).length} risk findings
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {inspection.findings.map((finding) => (
                  <div key={`${finding.findingType}-${finding.summary}`} className="rounded-xl border p-3">
                    <div className={finding.riskFlag ? 'font-medium text-red-700' : 'font-medium'}>
                      {finding.findingType}
                    </div>
                    <p className="text-sm text-slate-700">{finding.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed p-4">
          <p className="text-sm text-slate-600">
            Compliance monitoring supports staff review. It does not automatically remove classification.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function ComplianceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
