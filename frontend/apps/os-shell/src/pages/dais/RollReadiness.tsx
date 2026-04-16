/**
 * Roll Readiness Dashboard (TFR-065)
 * ===================================================================
 * Certification pipeline visualization. Shows counties/areas by
 * completion %. Progress bars, readiness scores, deadline tracking.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { invokeTool } from '@/api/pilotApi';
import {
  type CertificationStatus,
  getCertificationStatus,
} from '../../services/suites/daisService';

interface CertExportResult {
  payloadRef: string;
  packageRef: string;
  artifactCount: number;
  checklist: string[];
}

// ============================================================================
// Summary Cards
// ============================================================================

function SummaryCards({ statuses }: { statuses: CertificationStatus[] }) {
  const total = statuses.reduce((acc, s) => acc + s.totalParcels, 0);
  const completed = statuses.reduce((acc, s) => acc + s.completedParcels, 0);
  const overallPct = total > 0 ? (completed / total) * 100 : 0;
  const onTrack = statuses.filter((s) => s.status === 'on-track').length;
  const atRisk = statuses.filter((s) => s.status === 'at-risk').length;
  const overdue = statuses.filter((s) => s.status === 'overdue').length;

  const cards = [
    {
      label: 'Overall Readiness',
      value: `${overallPct.toFixed(1)}%`,
      sub: `${completed.toLocaleString()} / ${total.toLocaleString()} parcels`,
    },
    {
      label: 'On Track',
      value: onTrack.toString(),
      sub: 'areas meeting deadlines',
      color: 'text-green-400',
    },
    {
      label: 'At Risk',
      value: atRisk.toString(),
      sub: 'areas needing attention',
      color: 'text-yellow-400',
    },
    {
      label: 'Overdue',
      value: overdue.toString(),
      sub: 'areas past deadline',
      color: 'text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4" data-testid="readiness-summary">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg bg-card p-4"
          style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }}
          data-material="bento"
        >
          <div className="text-sm text-muted-foreground">{card.label}</div>
          <div className={`mt-1 text-2xl font-bold ${card.color || ''}`}>
            {card.value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Area Row
// ============================================================================

function AreaRow({ status }: { status: CertificationStatus }) {
  const daysUntilDeadline = Math.ceil(
    (new Date(status.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const barColor =
    status.percentComplete >= 90
      ? 'bg-green-600'
      : status.percentComplete >= 70
        ? 'bg-yellow-500'
        : 'bg-destructive';

  const statusVariants: Record<string, string> = {
    'on-track': 'bg-primary text-primary-foreground',
    'at-risk': 'bg-secondary text-secondary-foreground',
    overdue: 'bg-destructive text-destructive-foreground',
  };

  return (
    <div
      className="rounded-lg bg-card p-4"
      style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }}
      role="link"
      data-material="bento"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{status.area}</h4>
          <div className="mt-1 text-sm text-muted-foreground">
            {status.completedParcels.toLocaleString()} of{' '}
            {status.totalParcels.toLocaleString()} parcels completed
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${statusVariants[status.status] || 'bg-white/10 text-muted-foreground'}`}
          >
            {status.status}
          </span>
          <div className="text-right">
            <div className="text-sm font-medium">
              {daysUntilDeadline > 0
                ? `${daysUntilDeadline} days remaining`
                : `${Math.abs(daysUntilDeadline)} days overdue`}
            </div>
            <div className="text-xs text-muted-foreground">
              Due: {new Date(status.deadline).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{status.percentComplete.toFixed(1)}%</span>
        </div>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(status.percentComplete, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function RollReadiness() {
  const [statuses, setStatuses] = useState<CertificationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'area' | 'progress' | 'deadline'>('progress');
  const [draftVersion, setDraftVersion] = useState('benton-2026-working');
  const [certConfirmed, setCertConfirmed] = useState(false);
  const [certState, setCertState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    result?: CertExportResult;
    correlationId?: string;
    error?: string;
  }>({ status: 'idle' });

  const hasOverdue = statuses.some((s) => s.status === 'overdue');

  const handleExportCertification = useCallback(async () => {
    if (!certConfirmed) return;
    setCertState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'export_equalization_package',
        params: { county: 'benton', taxYear: 2026, draftVersion },
      });
      if (response.success && response.result) {
        const raw = response.result.output;
        const parsed: CertExportResult =
          typeof raw === 'string' ? (JSON.parse(raw) as CertExportResult) : (raw as CertExportResult);
        setCertState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setCertState({
          status: 'error',
          correlationId: response.correlationId,
          error: response.error?.message || 'Failed to export certification package.',
        });
      }
    } catch (err) {
      setCertState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: err instanceof Error ? err.message : 'Failed to export certification package.',
      });
    }
  }, [certConfirmed, draftVersion]);

  useEffect(() => {
    setLoading(true);
    getCertificationStatus()
      .then(setStatuses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...statuses].sort((a, b) => {
    switch (sortBy) {
      case 'area':
        return a.area.localeCompare(b.area);
      case 'progress':
        return a.percentComplete - b.percentComplete;
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6 p-6" data-testid="roll-readiness" style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Roll Readiness Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Certification pipeline visualization and deadline tracking
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/20 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading certification data...
        </div>
      )}

      {!loading && statuses.length > 0 && (
        <>
          {/* Summary */}
          <SummaryCards statuses={statuses} />

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            {(['progress', 'area', 'deadline'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={`rounded-md px-3 py-1 text-sm ${
                  sortBy === opt
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>

          {/* Area Cards */}
          <div className="space-y-3">
            {sorted.map((s) => (
              <AreaRow key={s.area} status={s} />
            ))}
          </div>
        </>
      )}

      {/* Certification Export Gate */}
      {!loading && statuses.length > 0 && (
        <div
          className="rounded-lg p-5 space-y-4"
          style={{ border: '1px solid hsl(var(--tf-border) / 0.2)', background: 'hsl(var(--tf-bg-elevated) / 0.5)' }}
          data-testid="roll-certification-gate"
          data-material="bento"
        >
          <div>
            <h2 className="text-base font-semibold">Certification Export Gate</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              TerraDais routes the certification package through TerraPilot. A human operator must
              confirm readiness before the export is triggered. Forge owns any calibration corrections;
              Workbench owns parcel-level repairs. This action only bundles evidence — it does not
              approve the roll.
            </p>
          </div>

          {hasOverdue && certState.status !== 'success' && (
            <div
              className="flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
              style={{ borderColor: 'hsl(var(--tf-warning-hs) 55% / 0.4)', background: 'hsl(var(--tf-warning-hs) 55% / 0.08)', color: 'hsl(var(--tf-warning-hs) 65%)' }}
              data-testid="cert-gate-overdue-warning"
            >
              <span className="mt-0.5 text-base leading-none">⚠️</span>
              <span>
                <strong>Overdue areas detected.</strong> Certification export proceeds only when all areas are on-track or at-risk. Resolve overdue areas in TerraDais Workflows first, or confirm you are exporting a partial roll.
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground" htmlFor="cert-draft-version">
              Draft version
            </label>
            <input
              id="cert-draft-version"
              type="text"
              value={draftVersion}
              onChange={(e) => setDraftVersion(e.target.value)}
              className="rounded border bg-background px-2 py-1 text-xs font-mono"
              style={{ borderColor: 'hsl(var(--tf-border) / 0.3)', minWidth: '18rem' }}
              data-testid="cert-draft-version-input"
            />
          </div>

          {certState.status !== 'success' && (
            <label className="flex items-start gap-2 cursor-pointer" data-testid="cert-gate-confirm-label">
              <input
                type="checkbox"
                checked={certConfirmed}
                onChange={(e) => setCertConfirmed(e.target.checked)}
                className="mt-0.5"
                data-testid="cert-gate-checkbox"
              />
              <span className="text-xs text-muted-foreground">
                I have reviewed all area readiness statuses and confirm this roll is ready for the
                certification package export. I understand this action bundles evidence but does not
                approve the roll.
              </span>
            </label>
          )}

          {certState.status !== 'success' && (
            <button
              type="button"
              onClick={handleExportCertification}
              disabled={!certConfirmed || certState.status === 'loading'}
              className="rounded border px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                borderColor: certConfirmed ? 'hsl(var(--tf-network-blue-hs) 55% / 0.5)' : 'hsl(var(--tf-border) / 0.2)',
                background: certConfirmed ? 'hsl(var(--tf-network-blue-hs) 55% / 0.12)' : 'transparent',
                color: certConfirmed ? 'hsl(var(--tf-network-blue-hs) 65%)' : 'hsl(var(--tf-muted))',
                cursor: certConfirmed ? 'pointer' : 'not-allowed',
              }}
              data-testid="cert-gate-export-btn"
            >
              {certState.status === 'loading' ? 'Exporting…' : 'Export Certification Package'}
            </button>
          )}

          {certState.status === 'error' && (
            <div className="rounded-md bg-destructive/20 px-3 py-2 text-xs text-red-400" data-testid="cert-gate-error">
              <span className="font-semibold">Export failed:</span> {certState.error}
              {certState.correlationId && (
                <span className="ml-2 opacity-60">({certState.correlationId})</span>
              )}
            </div>
          )}

          {certState.status === 'success' && certState.result && (
            <div className="space-y-3 rounded-md border px-4 py-3 text-xs" style={{ borderColor: 'hsl(var(--tf-network-blue-hs) 55% / 0.3)', background: 'hsl(var(--tf-network-blue-hs) 55% / 0.06)' }} data-testid="cert-gate-success">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">✅</span>
                <span className="font-semibold" style={{ color: 'hsl(var(--tf-network-blue-hs) 65%)' }}>Certification package exported</span>
                {certState.correlationId && (
                  <span className="ml-auto font-mono text-muted-foreground opacity-60">{certState.correlationId}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="uppercase tracking-wider text-muted-foreground">Package ref</span>
                  <p className="mt-0.5 font-mono">{certState.result.packageRef}</p>
                </div>
                <div>
                  <span className="uppercase tracking-wider text-muted-foreground">Artifacts</span>
                  <p className="mt-0.5 font-semibold">{certState.result.artifactCount}</p>
                </div>
              </div>
              {certState.result.checklist.length > 0 && (
                <ul className="space-y-1" data-testid="cert-gate-checklist">
                  {certState.result.checklist.map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-muted-foreground">
                      <span style={{ color: 'hsl(var(--tf-network-blue-hs) 65%)' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && statuses.length === 0 && !error && (
        <div className="rounded-lg p-8 text-center text-muted-foreground" style={{ border: '1px dashed hsl(var(--tf-border) / 0.15)' }}>
          No certification data available.
        </div>
      )}
    </div>
  );
}
