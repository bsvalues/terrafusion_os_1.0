/**
 * Audit Trail Page (TFT-146)
 * ===================================================================
 * Full-page audit trail viewer with filtering by date range, user,
 * action type. DataTable + timeline view toggle.
 */

import React, { useEffect, useState, useCallback } from 'react';
import type { AuditEvent } from '../../components/dais/AuditTab';

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

const CATEGORY_COLORS: Record<string, string> = {
  assessment: 'bg-blue-600 text-white',
  appeal: 'bg-purple-600 text-white',
  permit: 'bg-green-600 text-white',
  exemption: 'bg-yellow-600 text-white',
  document: 'bg-cyan-600 text-white',
  field: 'bg-orange-600 text-white',
  system: 'bg-gray-600 text-white',
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
    <div className="rounded-lg border border-border bg-card p-4">
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
    <div className="rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
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
            <tr key={event.eventId} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                {new Date(event.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3 font-mono text-sm">{event.parcelId}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[event.category] || 'bg-gray-600 text-white'}`}
                >
                  {event.category}
                </span>
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
                      <span className="rounded bg-red-900/30 px-1 py-0.5 text-red-400 line-through">
                        {event.previousValue}
                      </span>
                    )}
                    {event.previousValue && event.newValue && (
                      <span className="text-muted-foreground">&rarr;</span>
                    )}
                    {event.newValue && (
                      <span className="rounded bg-green-900/30 px-1 py-0.5 text-green-400">
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
    <div className="pl-1">
      {events.map((event) => (
        <div key={event.eventId} className="relative flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <div className="w-0.5 flex-1 bg-border" />
          </div>
          <div className="-mt-0.5 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[event.category] || 'bg-gray-600 text-white'}`}
              >
                {event.category}
              </span>
              <span className="text-sm font-medium">{event.action}</span>
              <span className="text-xs text-muted-foreground">
                {event.parcelId}
              </span>
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Complete audit history with FISMA-compliant event tracking
          </p>
        </div>
        <div className="flex gap-1 rounded-md bg-muted p-1">
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
