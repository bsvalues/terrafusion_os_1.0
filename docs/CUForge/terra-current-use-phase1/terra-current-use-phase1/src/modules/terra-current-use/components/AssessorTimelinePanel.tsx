import React from 'react';
import type { CurrentUseTimelineEvent } from '../types/currentUseTypes';
import { formatEnum, Panel } from './shared';

export function AssessorTimelinePanel({ events }: { events: CurrentUseTimelineEvent[] }) {
  return (
    <Panel title="Assessor Timeline">
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="border-l-2 pl-3">
            <div className="text-xs text-slate-500">
              {event.eventDate} · {event.actorDisplayName}
            </div>
            <div className="text-sm font-medium">{formatEnum(event.eventType)}</div>
            <p className="text-sm text-slate-600">{event.summary}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
