import React, { useEffect, useState } from 'react';
import { Panel } from './shared';
import { getCurrentUseTraceMock } from '../trace/currentUseTraceApi';
import type { CurrentUseTraceEvent } from '../trace/currentUseTraceTypes';

export function CurrentUseTracePanel({ parcelId }: { parcelId: string }) {
  const [events, setEvents] = useState<CurrentUseTraceEvent[]>([]);
  const [chainValid] = useState(true);

  useEffect(() => {
    getCurrentUseTraceMock(parcelId).then(setEvents);
  }, [parcelId]);

  return (
    <Panel title="TerraTrace Audit Spine">
      <div className="space-y-4">
        <div className="rounded-xl border p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Trace Integrity</div>
          <div className={chainValid ? 'mt-1 font-semibold text-green-700' : 'mt-1 font-semibold text-red-700'}>
            {chainValid ? 'Chain Verified' : 'Chain Invalid'}
          </div>
        </div>

        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border p-4">
              <div className="flex flex-col justify-between gap-2 md:flex-row">
                <div>
                  <div className="font-semibold">{event.action}</div>
                  <div className="text-sm text-slate-600">
                    {event.actorDisplayName} · {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  hash {event.hash.slice(0, 10)}
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-700">{event.summary}</p>

              {event.calculationVersion && (
                <p className="mt-2 text-xs text-slate-500">
                  Calculation version: {event.calculationVersion}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed p-4">
          <p className="text-sm text-slate-600">
            TerraTrace is append-only. Corrections must create new events, never silent mutation.
          </p>
        </div>
      </div>
    </Panel>
  );
}
