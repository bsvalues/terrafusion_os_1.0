/**
 * ModelReceipt — Proof Layer UI Material (TFR-075)
 * ==========================================================
 * Displays provenance metadata for the assessment model or
 * service that produced a valuation output. Surfaces the
 * "model receipt" required by the Engineering Certainty spec
 * Proof Layer: every AI/service output must carry a visible
 * audit trail of what generated it.
 *
 * NOT a generative AI component. Renders static provenance
 * from the fields passed to it.
 */

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ModelReceiptProps {
  /** Internal identifier for the model or service version */
  modelId: string;
  /** Human-readable name of the model or service */
  modelName: string;
  /** ISO 8601 timestamp of when the output was generated */
  trainedAt: string;
  /** Model accuracy metric (0–1), if available */
  accuracy?: number;
  /** Number of comparable sales or records used, if available */
  sampleSize?: number;
  /** Number of manual overrides applied, if available */
  overrideCount?: number;
  /** URL to export/download the full model report, if available */
  exportUrl?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function formatAccuracy(accuracy: number): string {
  return `${(accuracy * 100).toFixed(1)}%`;
}

// ============================================================================
// Component
// ============================================================================

export function ModelReceipt({
  modelId,
  modelName,
  trainedAt,
  accuracy,
  sampleSize,
  overrideCount,
  exportUrl,
}: ModelReceiptProps) {
  return (
    <div
      className="rounded-md p-3 text-xs"
      style={{
        border: '1px solid hsl(var(--tf-border) / 0.20)',
        background: 'hsl(var(--tf-surface) / 0.5)',
        color: 'hsl(var(--tf-text) / 0.8)',
      }}
      data-testid="model-receipt"
      aria-label={`Model receipt: ${modelName}`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: 'hsl(var(--tf-accent) / 0.12)',
            color: 'hsl(var(--tf-accent))',
          }}
        >
          Model Receipt
        </span>
        <span style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>—</span>
        <span className="font-medium" data-testid="model-receipt-name">{modelName}</span>
      </div>

      {/* Provenance grid */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div>
          <dt style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Model ID</dt>
          <dd className="font-mono" data-testid="model-receipt-id">{modelId}</dd>
        </div>
        <div>
          <dt style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Generated</dt>
          <dd data-testid="model-receipt-generated">{formatTimestamp(trainedAt)}</dd>
        </div>

        {accuracy !== undefined && (
          <div>
            <dt style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Accuracy</dt>
            <dd data-testid="model-receipt-accuracy">{formatAccuracy(accuracy)}</dd>
          </div>
        )}
        {sampleSize !== undefined && (
          <div>
            <dt style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Sample Size</dt>
            <dd data-testid="model-receipt-sample">{sampleSize.toLocaleString()}</dd>
          </div>
        )}
        {overrideCount !== undefined && (
          <div>
            <dt style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Overrides</dt>
            <dd data-testid="model-receipt-overrides">{overrideCount}</dd>
          </div>
        )}
      </dl>

      {/* Export link */}
      {exportUrl && (
        <div className="mt-2 border-t pt-2" style={{ borderColor: 'hsl(var(--tf-border) / 0.15)' }}>
          <a
            href={exportUrl}
            className="underline"
            style={{ color: 'hsl(var(--tf-accent))' }}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="model-receipt-export"
          >
            Export model report ↗
          </a>
        </div>
      )}
    </div>
  );
}

export default ModelReceipt;
