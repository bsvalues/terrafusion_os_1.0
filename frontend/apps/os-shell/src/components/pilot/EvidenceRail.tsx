import React, { useMemo } from 'react';
import type { PilotTraceEvent } from '../../api/pilotApi';
import { useTraceByCorrelationId } from '../../hooks/useTraceByCorrelationId';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';

export interface EvidenceRailProps {
  correlationIds: string[];
  parcelId?: string;
  title?: string;
}

function eventIcon(type: string): string {
  if (type.includes('failed')) return '❌';
  if (type.includes('completed')) return '✅';
  if (type.includes('invoked')) return '⚡';
  return '🧾';
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function EventCard({ event }: { event: PilotTraceEvent }) {
  return (
    <div className='rounded-lg border border-white/10 bg-white/5 p-3 space-y-2' data-testid='evidence-event'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <span aria-hidden='true'>{eventIcon(event.type)}</span>
          <div className='min-w-0'>
            <p className='text-sm text-white truncate'>{event.toolId}</p>
            <p className='text-xs text-white/50 truncate'>{event.type}</p>
          </div>
        </div>
        <span className='text-[11px] text-white/50 shrink-0'>{formatTimestamp(event.timestamp)}</span>
      </div>

      <p className='text-xs text-white/70 whitespace-pre-wrap'>{event.summary}</p>

      <div className='flex items-center justify-between gap-2'>
        <code className='text-[11px] text-white/50 bg-black/30 px-2 py-0.5 rounded'>
          {event.correlationId}
        </code>
        {event.payloadRef ? (
          <a
            href={`/property/${encodeURIComponent(event.context?.parcelId ?? '')}/dossier`}
            className='text-xs text-cyan-300 hover:text-cyan-200 underline'
            data-testid='payload-ref-link'
          >
            View in Dossier
          </a>
        ) : null}
      </div>
    </div>
  );
}

export const EvidenceRail: React.FC<EvidenceRailProps> = ({
  correlationIds,
  parcelId,
  title = 'Evidence Rail',
}) => {
  const { events, loading, error, refresh } = useTraceByCorrelationId({ correlationIds, parcelId });
  const hasCorrelations = useMemo(() => correlationIds.length > 0, [correlationIds.length]);

  return (
    <LiquidPanel variant='infrastructure' radius='xl' className='p-4 space-y-3' data-testid='evidence-rail'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-sm font-semibold text-white'>{title}</h3>
        <button
          onClick={() => void refresh()}
          className='text-xs text-white/60 hover:text-white/90 transition-colors'
          data-testid='evidence-refresh'
        >
          Refresh
        </button>
      </div>

      {!hasCorrelations && (
        <p className='text-xs text-white/50'>No tool invocations for this parcel yet.</p>
      )}

      {loading && <p className='text-xs text-white/60'>Loading trace events…</p>}

      {error && (
        <p className='text-xs text-red-300' data-testid='evidence-error'>
          {error}
        </p>
      )}

      {!loading && !error && hasCorrelations && (
        <div className='max-h-[28rem] overflow-y-auto space-y-2 pr-1' data-testid='evidence-list'>
          {events.length === 0 ? (
            <p className='text-xs text-white/50'>No trace events available.</p>
          ) : (
            events.map((event) => <EventCard key={event.eventId} event={event} />)
          )}
        </div>
      )}
    </LiquidPanel>
  );
};

export default EvidenceRail;

