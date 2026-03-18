/**
 * Audit Tab Component (TFT-119)
 * ===================================================================
 * Shows assessment audit trail for a parcel. Timeline of changes
 * with who/when/what. Uses TerraTrace events.
 */

import React, { useEffect, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface AuditEvent {
  eventId: string;
  parcelId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: 'assessment' | 'appeal' | 'permit' | 'exemption' | 'document' | 'field' | 'system';
  details: string;
  previousValue?: string;
  newValue?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const CATEGORY_COLORS: Record<AuditEvent['category'], string> = {
  assessment: 'bg-blue-600 text-white',
  appeal: 'bg-purple-600 text-white',
  permit: 'bg-green-600 text-white',
  exemption: 'bg-yellow-600 text-white',
  document: 'bg-cyan-600 text-white',
  field: 'bg-orange-600 text-white',
  system: 'bg-gray-600 text-white',
};

async function fetchAuditTrail(parcelId: string): Promise<AuditEvent[]> {
  const res = await fetch(
    `/api/audit/trail?parcelId=${encodeURIComponent(parcelId)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch audit trail: ${res.statusText}`);
  return res.json();
}

// ============================================================================
// Timeline Item
// ============================================================================

function TimelineItem({ event }: { event: AuditEvent }) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full bg-primary" />
        <div className="w-0.5 flex-1 bg-border" />
      </div>

      {/* Content */}
      <div className="-mt-0.5 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[event.category]}`}
          >
            {event.category}
          </span>
          <span className="text-sm font-medium">{event.action}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{event.details}</p>
        {(event.previousValue || event.newValue) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {event.previousValue && (
              <span className="rounded bg-red-900/30 px-1.5 py-0.5 text-red-400 line-through">
                {event.previousValue}
              </span>
            )}
            {event.previousValue && event.newValue && (
              <span className="text-muted-foreground">&rarr;</span>
            )}
            {event.newValue && (
              <span className="rounded bg-green-900/30 px-1.5 py-0.5 text-green-400">
                {event.newValue}
              </span>
            )}
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{event.userName}</span>
          <span>|</span>
          <span>{new Date(event.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AuditTab Component
// ============================================================================

export interface AuditTabProps {
  parcelId: string;
}

export default function AuditTab({ parcelId }: AuditTabProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (!parcelId) return;
    setLoading(true);
    setError(null);
    fetchAuditTrail(parcelId)
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [parcelId]);

  const categories = ['all', ...new Set(events.map((e) => e.category))];
  const filtered =
    filterCategory === 'all'
      ? events
      : events.filter((e) => e.category === filterCategory);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Audit Trail</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-4 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading audit trail...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-900/20 p-3 text-sm text-red-400">{error}</div>
      )}

      {/* Timeline */}
      {!loading && filtered.length > 0 && (
        <div className="pl-1">
          {filtered.map((event) => (
            <TimelineItem key={event.eventId} event={event} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && !error && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No audit events found
          {filterCategory !== 'all' ? ` for category "${filterCategory}"` : ''}.
        </div>
      )}
    </div>
  );
}
