/**
 * EvidenceSnapshotPanel — CX-26 Evidence Snapshot UI
 *
 * Renders the CX-25 evidence snapshot data for a parcel.
 * Contract requirements:
 * - No assumption that note bodies exist (counts + types only)
 * - No assumption that hash is stable across time (explicit wording)
 * - Safe rendering of nullable sections (valuation may be null)
 * - CorrelationId surfaced for operator copy/paste into trace workflows
 * - Resource links rendered as navigable references
 */

import React, { useCallback, useState } from 'react';
import type { EvidenceSnapshot } from '../../services/dossierService';

// ============================================================================
// Sub-components
// ============================================================================

/** Copyable correlation ID with click-to-copy */
const CorrelationIdDisplay: React.FC<{ correlationId: string; label?: string }> = ({
  correlationId,
  label = 'Correlation ID',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(correlationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
    }
  }, [correlationId]);

  return (
    <div className="flex items-center gap-2" data-testid="correlation-id-display">
      <span className="tf-text-dim text-xs">{label}:</span>
      <button
        onClick={handleCopy}
        className="tf-mono text-xs px-2 py-0.5 rounded tf-hover-surface cursor-pointer"
        title="Click to copy — use in trace query workflows"
        data-testid="correlation-id-copy"
      >
        <code>{correlationId}</code>
      </button>
      {copied && <span className="text-xs" style={{ color: 'hsl(var(--tf-success))' }}>Copied</span>}
    </div>
  );
};

/** Section header */
const SectionHeader: React.FC<{ icon: string; title: string; count?: number }> = ({
  icon,
  title,
  count,
}) => (
  <div className="flex items-center gap-2 mb-2">
    <span>{icon}</span>
    <h4 className="tf-text font-semibold text-sm">{title}</h4>
    {count !== undefined && (
      <span className="tf-text-dim text-xs">({count})</span>
    )}
  </div>
);

/** Flat key-value row */
const DataRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-baseline py-1">
    <span className="tf-text-dim text-xs">{label}</span>
    <span className="tf-text text-sm font-medium">{value ?? '—'}</span>
  </div>
);

/** Currency formatter */
function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

// ============================================================================
// Main component
// ============================================================================

export interface EvidenceSnapshotPanelProps {
  snapshot: EvidenceSnapshot;
  headerCorrelationId: string | null;
}

export const EvidenceSnapshotPanel: React.FC<EvidenceSnapshotPanelProps> = ({
  snapshot,
  headerCorrelationId,
}) => {
  const ts = new Date(snapshot.snapshotTimestamp);
  const formattedTimestamp = ts.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return (
    <div className="space-y-4" data-testid="evidence-snapshot-panel">
      {/* ── Snapshot metadata bar ────────────────────────────── */}
      <div className="tf-panel p-3 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🔏</span>
            <span className="tf-text font-semibold text-sm">Evidence Snapshot</span>
          </div>
          <span className="tf-text-dim text-xs">{formattedTimestamp}</span>
        </div>

        {/* Correlation ID — primary audit affordance */}
        <CorrelationIdDisplay correlationId={snapshot.correlationId} />
        {headerCorrelationId && headerCorrelationId !== snapshot.correlationId && (
          <CorrelationIdDisplay
            correlationId={headerCorrelationId}
            label="Header Correlation ID"
          />
        )}

        {/* Content hash — with explicit snapshot-time-bound explanation */}
        <div className="tf-panel p-2 rounded space-y-1" data-testid="content-hash-section">
          <div className="flex items-center gap-2">
            <span className="text-xs">🔐</span>
            <span className="tf-text-dim text-xs">Content Hash (SHA-256)</span>
          </div>
          <code className="tf-mono text-[10px] break-all block tf-text-tertiary">
            {snapshot.contentHash}
          </code>
          <p className="tf-text-dim text-[10px] italic">
            Snapshot hash — includes timestamp. Each snapshot produces a unique hash
            even if data hasn't changed. Not a content-only digest.
          </p>
        </div>
      </div>

      {/* ── Property summary ─────────────────────────────────── */}
      <div className="tf-panel p-3 rounded-lg">
        <SectionHeader icon="🏠" title="Property" />
        <DataRow label="Parcel" value={snapshot.property.parcelNumber} />
        <DataRow label="Address" value={snapshot.property.address} />
        {snapshot.property.propertyType && (
          <DataRow label="Type" value={snapshot.property.propertyType} />
        )}
        <DataRow label="Assessed Value" value={fmtCurrency(snapshot.property.assessedValue)} />
        <DataRow label="Market Value" value={fmtCurrency(snapshot.property.marketValue)} />
        <DataRow label="Land" value={fmtCurrency(snapshot.property.landValue)} />
        <DataRow label="Improvements" value={fmtCurrency(snapshot.property.improvementValue)} />
        <DataRow label="Tax Year" value={snapshot.property.taxYear} />
      </div>

      {/* ── Valuation summary (nullable) ─────────────────────── */}
      <div className="tf-panel p-3 rounded-lg">
        <SectionHeader icon="📊" title="Valuation" />
        {snapshot.valuation ? (
          <>
            <DataRow label="Total Value" value={fmtCurrency(snapshot.valuation.totalValue)} />
            <DataRow label="Categories" value={snapshot.valuation.categoryCount} />
          </>
        ) : (
          <p className="tf-text-dim text-xs italic" data-testid="valuation-unavailable">
            Valuation data not available for this snapshot.
          </p>
        )}
      </div>

      {/* ── Levy summary ─────────────────────────────────────── */}
      <div className="tf-panel p-3 rounded-lg">
        <SectionHeader icon="💰" title="Levies" count={snapshot.levies.totalCount} />
        <DataRow label="Active Levies" value={snapshot.levies.includedCount} />
        <DataRow label="Total Levy Amount" value={fmtCurrency(snapshot.levies.totalLevyAmount)} />
      </div>

      {/* ── Note summary (counts + types only — no content) ──── */}
      <div className="tf-panel p-3 rounded-lg">
        <SectionHeader icon="📝" title="Notes" count={snapshot.notes.totalCount} />
        <DataRow label="Included" value={snapshot.notes.includedCount} />
        {snapshot.notes.noteTypes.length > 0 ? (
          <div className="mt-2">
            <span className="tf-text-dim text-xs">Types: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {snapshot.notes.noteTypes.map((type) => (
                <span
                  key={type}
                  className="tf-text-tertiary text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'hsl(var(--tf-surface-2))' }}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="tf-text-dim text-xs italic">No notes recorded.</p>
        )}
      </div>

      {/* ── Resource links ───────────────────────────────────── */}
      <div className="tf-panel p-3 rounded-lg">
        <SectionHeader icon="🔗" title="Resource Links" />
        <div className="space-y-1">
          {snapshot.links.self && (
            <DataRow label="Self" value={<code className="tf-mono text-[10px]">{snapshot.links.self}</code>} />
          )}
          {snapshot.links.summary && (
            <DataRow label="Summary" value={<code className="tf-mono text-[10px]">{snapshot.links.summary}</code>} />
          )}
          {snapshot.links.details && (
            <DataRow label="Details" value={<code className="tf-mono text-[10px]">{snapshot.links.details}</code>} />
          )}
          <DataRow label="Notes" value={<code className="tf-mono text-[10px]">{snapshot.links.notes}</code>} />
          <DataRow label="Casefile" value={<code className="tf-mono text-[10px]">{snapshot.links.casefile}</code>} />
        </div>
      </div>
    </div>
  );
};

export default EvidenceSnapshotPanel;
