/**
 * TFR-069: Trust Registry Page
 *
 * Shows data lineage, provenance badges, and trust boundary markers.
 * Provides an at-a-glance view of which external connectors are healthy,
 * stale, or failing.
 */

import React from 'react';
import { useParcelCount } from '../../hooks/useParcelCount';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConnectorStatus {
  id: string;
  name: string;
  source: string;
  lastSync: string | null;
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F' | 'unverified';
  status: 'healthy' | 'degraded' | 'offline' | 'unverified';
  recordCount: number;
}

interface ProvenanceBadgeProps {
  source: string;
  lastSync: string | null;
  qualityGrade: ConnectorStatus['qualityGrade'];
}

interface TrustBoundaryProps {
  label: string;
  trusted: boolean;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-600',
  B: 'bg-blue-600',
  C: 'bg-yellow-600',
  D: 'bg-orange-600',
  F: 'bg-red-600',
  unverified: 'bg-slate-500',
};

const STATUS_COLORS: Record<string, string> = {
  healthy: 'text-green-400',
  degraded: 'text-yellow-400',
  offline: 'text-red-400',
  unverified: 'text-slate-400',
};

export function ProvenanceBadge({ source, lastSync, qualityGrade }: ProvenanceBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
      <span className={`inline-block h-2 w-2 rounded-full ${GRADE_COLORS[qualityGrade]}`} />
      <span className="font-medium">{source}</span>
      <span className="text-white/50">|</span>
      <span className="text-white/50">
        {lastSync ? new Date(lastSync).toLocaleDateString() : 'Sync time not reported'}
      </span>
      <span className="text-white/50">|</span>
      <span className="font-semibold">{qualityGrade}</span>
    </span>
  );
}

export function TrustBoundary({ label, trusted, children }: TrustBoundaryProps) {
  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        trusted ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
        <span>{trusted ? 'TRUSTED' : 'UNTRUSTED'}</span>
        <span className="text-white/30">-</span>
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}



// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TrustRegistry() {
  const { data: statsData } = useParcelCount();
  const parcelCount = statsData?.totalParcels ?? 0;

  const connectors: ConnectorStatus[] = statsData
    ? [
        {
          id: 'county-assessment-source',
          name: 'County Assessment Source',
          source: statsData.dataSource || 'government/stats',
          lastSync: null,
          qualityGrade: 'unverified',
          status: statsData.stubbed ? 'degraded' : 'healthy',
          recordCount: parcelCount,
        },
      ]
    : [];

  const healthyCount = connectors.filter((c) => c.status === 'healthy').length;
  const degradedCount = connectors.filter((c) => c.status === 'degraded').length;
  const offlineCount = connectors.filter((c) => c.status === 'offline').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Trust Registry</h1>
        <p className="mt-1 text-sm text-white/60">
          Data lineage, provenance, and connector health across the OS.
        </p>
      </div>

      {/* Health summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-3xl font-bold text-green-400">{healthyCount}</div>
          <div className="text-xs text-white/50 uppercase tracking-wider">Healthy</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-3xl font-bold text-yellow-400">{degradedCount}</div>
          <div className="text-xs text-white/50 uppercase tracking-wider">Degraded</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-3xl font-bold text-red-400">{offlineCount}</div>
          <div className="text-xs text-white/50 uppercase tracking-wider">Offline</div>
        </div>
      </div>

      {/* Connector table */}
      <TrustBoundary label="Internal & Verified Sources" trusted={true}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase text-white/40">
              <th className="pb-2">Connector</th>
              <th className="pb-2">Source</th>
              <th className="pb-2">Last Sync</th>
              <th className="pb-2">Records</th>
              <th className="pb-2">Grade</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {connectors.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="py-2 font-medium text-white">{c.name}</td>
                <td className="py-2 text-white/60">{c.source}</td>
                <td className="py-2 text-white/60">
                  {c.lastSync ? new Date(c.lastSync).toLocaleString() : 'Not reported'}
                </td>
                <td className="py-2 text-white/60">{c.recordCount.toLocaleString()}</td>
                <td className="py-2">
                  <ProvenanceBadge source={c.source} lastSync={c.lastSync} qualityGrade={c.qualityGrade} />
                </td>
                <td className={`py-2 font-medium ${STATUS_COLORS[c.status]}`}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </td>
              </tr>
            ))}
            {connectors.length === 0 && (
              <tr>
                <td className="py-4 text-white/60" colSpan={6}>
                  No connector evidence has been returned by the backend yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TrustBoundary>
    </div>
  );
}
