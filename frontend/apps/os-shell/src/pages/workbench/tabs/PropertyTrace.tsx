import React from 'react';
import { Activity, RefreshCw, ShieldCheck } from 'lucide-react';
import { EvidenceRail } from '../../../components/pilot/EvidenceRail';
import { usePilotTraceList } from '../../../hooks/usePilotTraceList';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';

export const PropertyTrace: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const traceList = usePilotTraceList({ parcelId });

  return (
    <div className="tf-card h-full overflow-auto p-6 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold tf-text-muted uppercase tracking-wide">
            <Activity size={16} aria-hidden="true" />
            TerraTrace
          </div>
          <h2 className="mt-2 text-2xl font-semibold tf-text">Parcel Evidence Trail</h2>
          <p className="mt-1 max-w-3xl tf-text-dim">
            Parcel-scoped trace events, tool invocations, approvals, and evidence breadcrumbs for this workbench session.
          </p>
        </div>
        <button
          type="button"
          onClick={traceList.refresh}
          className="tf-button-secondary inline-flex items-center gap-2"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="tf-panel p-4">
          <div className="flex items-center gap-2 tf-text-muted text-sm">
            <ShieldCheck size={16} aria-hidden="true" />
            Scope
          </div>
          <div className="mt-2 font-mono text-sm tf-text">{parcelId}</div>
        </div>
        <div className="tf-panel p-4">
          <div className="tf-text-muted text-sm">Status</div>
          <div className="mt-2 text-lg font-semibold tf-text capitalize">{traceList.phase}</div>
        </div>
        <div className="tf-panel p-4">
          <div className="tf-text-muted text-sm">Events</div>
          <div className="mt-2 text-lg font-semibold tf-text">{traceList.events.length}</div>
        </div>
      </section>

      <EvidenceRail
        phase={traceList.phase}
        events={traceList.events}
        error={traceList.error}
        onRetry={traceList.refresh}
      />
    </div>
  );
};

export default PropertyTrace;
