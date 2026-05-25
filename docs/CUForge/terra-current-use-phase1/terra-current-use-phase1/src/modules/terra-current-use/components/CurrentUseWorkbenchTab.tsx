import React, { useEffect, useState } from 'react';
import { currentUseApi } from '../api/currentUseApi';
import { mockRollbackInput } from '../data/currentUseMockAdapter';
import type { RollbackCalculationResult } from '../domain/rollback/rollbackTypes';
import type {
  CurrentUseEvidenceItem,
  CurrentUseParcelOverview,
  CurrentUseTimelineEvent,
} from '../types/currentUseTypes';
import { AssessorTimelinePanel } from './AssessorTimelinePanel';
import { CurrentUseOverviewCards } from './CurrentUseOverviewCards';
import { EvidenceChecklistPanel } from './EvidenceChecklistPanel';
import { NoticePreviewPanel } from './NoticePreviewPanel';
import { RollbackCalculatorPanel, RollbackExplanationPanel } from './RollbackCalculatorPanel';
import { KeyValue, Panel } from './shared';

interface CurrentUseWorkbenchTabProps {
  parcelId: string;
}

export function CurrentUseWorkbenchTab({ parcelId }: CurrentUseWorkbenchTabProps) {
  const [overview, setOverview] = useState<CurrentUseParcelOverview | null>(null);
  const [evidenceItems, setEvidenceItems] = useState<CurrentUseEvidenceItem[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<CurrentUseTimelineEvent[]>([]);
  const [rollbackResult, setRollbackResult] = useState<RollbackCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [overviewResult, evidenceResult, timelineResult] = await Promise.all([
          currentUseApi.getOverview(parcelId),
          currentUseApi.getEvidence(parcelId),
          currentUseApi.getTimeline(parcelId),
        ]);

        if (!mounted) return;

        setOverview(overviewResult);
        setEvidenceItems(evidenceResult);
        setTimelineEvents(timelineResult);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load Current Use data.');
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [parcelId]);

  async function runRollbackCalculation() {
    try {
      const result = await currentUseApi.calculateRollback({
        ...mockRollbackInput,
        parcelId,
      });
      setRollbackResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run rollback calculation.');
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Panel title="Current Use Error">
          <p className="text-sm text-red-700">{error}</p>
        </Panel>
      </div>
    );
  }

  if (!overview) {
    return <div className="p-6 text-sm text-slate-600">Loading Current Use review...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <div className="text-sm uppercase tracking-wide text-slate-500">TerraForge</div>
        <h1 className="text-2xl font-semibold">Current Use Command Center</h1>
        <p className="text-sm text-slate-600">
          Parcel classification lifecycle, evidence readiness, and rollback exposure review.
        </p>
      </header>

      <CurrentUseOverviewCards overview={overview} evidenceItems={evidenceItems} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Parcel Snapshot">
          <KeyValue label="Parcel" value={overview.parcelId} />
          <KeyValue label="Owner" value={overview.ownerName} />
          <KeyValue label="Operator" value={overview.operatorName ?? 'Owner operated'} />
          <KeyValue label="Classified Acres" value={overview.classifiedAcres.toFixed(2)} />
          <KeyValue label="Total Acres" value={overview.totalParcelAcres.toFixed(2)} />
          <KeyValue label="Homesite Excluded" value={`${overview.homesiteExcludedAcres ?? 0} acres`} />
          <KeyValue label="Contiguous Group" value={overview.contiguousGroupId ?? 'None'} />
        </Panel>

        <EvidenceChecklistPanel items={evidenceItems} />
        <AssessorTimelinePanel events={timelineEvents} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RollbackCalculatorPanel result={rollbackResult} onRun={runRollbackCalculation} />
        <RollbackExplanationPanel result={rollbackResult} />
      </section>

      <NoticePreviewPanel />
    </div>
  );
}
