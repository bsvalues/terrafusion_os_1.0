/**
 * Audit Trail Page (TFT-146)
 * ===================================================================
 * Full-page audit trail viewer with filtering by date range, user,
 * action type. DataTable + timeline view toggle.
 */

import React, { useEffect, useState, useCallback } from 'react';
import type { AuditEvent } from '../../components/dais/AuditTab';
import { Badge } from '../../components/ui/badge';
import type { BadgeProps } from '../../components/ui/badge';

// ============================================================================
// API
// ============================================================================

interface AuditFilters {
  parcelId?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  category?: string;
  action?: string;
}

async function searchAuditTrail(filters: AuditFilters): Promise<AuditEvent[]> {
  const params = new URLSearchParams();
  if (filters.parcelId) params.set('parcelId', filters.parcelId);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.category) params.set('category', filters.category);
  if (filters.action) params.set('action', filters.action);

  const res = await fetch(`/api/audit/search?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to search audit trail: ${res.statusText}`);
  return res.json();
}

// ============================================================================
// Category Colors
// ============================================================================

const CATEGORY_BADGE_VARIANT: Record<string, BadgeProps['variant']> = {
  assessment: 'default',
  appeal: 'secondary',
  permit: 'default',
  exemption: 'secondary',
  document: 'outline',
  field: 'outline',
  system: 'destructive',
};

// ============================================================================
// Filters Panel
// ============================================================================

function FiltersPanel({
  filters,
  onChange,
  onSearch,
}: {
  filters: AuditFilters;
  onChange: (f: AuditFilters) => void;
  onSearch: () => void;
}) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.5)' }} data-testid="audit-filters" data-material="bento">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Filters
      </h3>
      <div className="grid grid-cols-6 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Parcel ID</label>
          <input
            type="text"
            value={filters.parcelId || ''}
            onChange={(e) => onChange({ ...filters, parcelId: e.target.value || undefined })}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="Any"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Start Date</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value || undefined })}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">End Date</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value || undefined })}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">User</label>
          <input
            type="text"
            value={filters.userId || ''}
            onChange={(e) => onChange({ ...filters, userId: e.target.value || undefined })}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="Any"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="assessment">Assessment</option>
            <option value="appeal">Appeal</option>
            <option value="permit">Permit</option>
            <option value="exemption">Exemption</option>
            <option value="document">Document</option>
            <option value="field">Field</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onSearch}
            className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Table View
// ============================================================================

function TableView({ events }: { events: AuditEvent[] }) {
  return (
    <div className="rounded-lg border" style={{ borderColor: 'hsl(var(--tf-border) / 0.15)' }} data-testid="audit-table" data-material="bento">
      <table className="w-full">
        <thead>
          <tr className="border-b" style={{ borderColor: 'hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
            <th className="px-4 py-3 text-left text-sm font-medium">Timestamp</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Parcel</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
            <th className="px-4 py-3 text-left text-sm font-medium">User</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Changes</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.eventId} className="border-b last:border-0 hover:bg-white/5" style={{ borderColor: 'hsl(var(--tf-border) / 0.15)' }}>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                {new Date(event.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3 font-mono text-sm">{event.parcelId}</td>
              <td className="px-4 py-3">
                <Badge variant={CATEGORY_BADGE_VARIANT[event.category] || 'outline'}>
                  {event.category}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm">{event.action}</td>
              <td className="px-4 py-3 text-sm">{event.userName}</td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-muted-foreground">
                {event.details}
              </td>
              <td className="px-4 py-3">
                {(event.previousValue || event.newValue) && (
                  <div className="flex items-center gap-1 text-xs">
                    {event.previousValue && (
                      <span className="rounded px-1 py-0.5 line-through" style={{ background: 'hsl(var(--tf-border) / 0.15)', color: 'hsl(var(--tf-muted))' }}>
                        {event.previousValue}
                      </span>
                    )}
                    {event.previousValue && event.newValue && (
                      <span className="text-muted-foreground">&rarr;</span>
                    )}
                    {event.newValue && (
                      <span className="rounded px-1 py-0.5" style={{ background: 'hsl(var(--tf-border) / 0.15)', color: 'hsl(var(--tf-fg))' }}>
                        {event.newValue}
                      </span>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Timeline View
// ============================================================================

function TimelineView({ events }: { events: AuditEvent[] }) {
  return (
    <div className="pl-1" data-testid="audit-timeline">
      {events.map((event) => (
        <div key={event.eventId} className="relative flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <div className="w-0.5 flex-1 bg-border" />
          </div>
          <div className="-mt-0.5 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={CATEGORY_BADGE_VARIANT[event.category] || 'outline'}>
                {event.category}
              </Badge>
              <span className="text-sm font-medium">{event.action}</span>
              <span className="text-xs text-muted-foreground">
                {event.parcelId}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{event.details}</p>
            {(event.previousValue || event.newValue) && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                {event.previousValue && (
                  <span className="rounded px-1.5 py-0.5 line-through" style={{ background: 'hsl(var(--tf-border) / 0.15)', color: 'hsl(var(--tf-muted))' }}>
                    {event.previousValue}
                  </span>
                )}
                {event.previousValue && event.newValue && (
                  <span className="text-muted-foreground">&rarr;</span>
                )}
                {event.newValue && (
                  <span className="rounded px-1.5 py-0.5" style={{ background: 'hsl(var(--tf-border) / 0.15)', color: 'hsl(var(--tf-fg))' }}>
                    {event.newValue}
                  </span>
                )}
              </div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">
              {event.userName} | {new Date(event.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function AuditTrailPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchAuditTrail(filters);
      setEvents(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search audit trail');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    handleSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 p-6" data-testid="audit-trail" style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Complete audit history with FISMA-compliant event tracking
          </p>
        </div>
        <div className="flex gap-1 rounded-md p-1" style={{ background: 'hsl(var(--tf-card-bg) / 0.5)' }}>
          <button
            onClick={() => setViewMode('table')}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              viewMode === 'table'
                ? 'bg-background shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              viewMode === 'timeline'
                ? 'bg-background shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Filters */}
      <FiltersPanel
        filters={filters}
        onChange={setFilters}
        onSearch={handleSearch}
      />

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-900/20 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Searching audit trail...
        </div>
      )}

      {/* Results Count */}
      {!loading && events.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {events.length} event{events.length !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Content */}
      {!loading && events.length > 0 && (
        viewMode === 'table' ? (
          <TableView events={events} />
        ) : (
          <TimelineView events={events} />
        )
      )}

      {/* Empty */}
      {!loading && events.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No audit events match the current filters.
        </div>
      )}
    </div>
  );
}
