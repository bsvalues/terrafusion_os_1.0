/**
 * TeachMeWhyPanel — shared, data-honest reasoning slide-over.
 *
 * Presents AUTHORED institutional doctrine as an ordered chain of reasoning
 * steps. It is intentionally presentational: it renders only the content a
 * caller passes in and never fabricates live operational status, confidence
 * scores, or county metrics.
 *
 * HONESTY POSTURE:
 * - `eyebrow` defaults to "Authored doctrine" so the reader always knows this
 *   is institutional guidance, not a live data read.
 * - `sourceNote` is REQUIRED and rendered as visible attribution. There is no
 *   way to show a reasoning chain here without disclosing where it came from.
 * - No confidence bars, no live counts, no proof-chain numbers. If a future
 *   caller wants live evidence, it must pass authored text or wire a separate
 *   governed data contract — this component will not invent it.
 *
 * Distinct from `ExplainPanel` (components/common/ExplainPanel.tsx), which
 * renders live explainApi responses. This panel is for static, authored
 * doctrine only.
 *
 * @module components/common/TeachMeWhyPanel
 */

import React, { useCallback, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TeachMeWhyStep {
  /** Short heading for the reasoning step. */
  title: string;
  /** Authored explanation for the step. */
  body: string;
}

export interface TeachMeWhyPanelProps {
  /** Whether the panel is open. Controlled by the caller. */
  open: boolean;
  /** Close handler (scrim click, close button, Escape). */
  onClose: () => void;
  /** Headline of the reasoning chain. */
  title: string;
  /** Ordered authored reasoning steps. */
  steps: TeachMeWhyStep[];
  /**
   * REQUIRED attribution. Keeps the panel honest: the reader is always told
   * this is authored guidance and where it comes from.
   */
  sourceNote: string;
  /** Optional lead-in sentence under the title. */
  lede?: string;
  /**
   * Provenance label shown in the eyebrow. Defaults to "Authored doctrine".
   * Do not pass anything that implies a live data read unless that is true.
   */
  eyebrow?: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TeachMeWhyPanel({
  open,
  onClose,
  title,
  steps,
  sourceNote,
  lede,
  eyebrow = 'Authored doctrine',
  className,
}: TeachMeWhyPanelProps): React.ReactElement | null {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Escape-to-close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Move focus to the close control when opened
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  if (!open) return null;

  return (
    <div
      data-testid="teach-me-why-scrim"
      onClick={onClose}
      className="fixed inset-0 flex justify-end"
      style={{
        zIndex: 2000,
        background: 'hsl(var(--tf-text) / 0.45)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <aside
        data-testid="teach-me-why-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={stop}
        className={cn('h-full overflow-y-auto', className)}
        style={{
          width: 'min(440px, 92vw)',
          background: 'hsl(var(--tf-surface))',
          borderLeft: '1px solid hsl(var(--tf-border))',
          boxShadow: '-30px 0 60px hsl(var(--tf-text) / 0.25)',
          padding: '30px 30px 40px',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'hsl(var(--tf-accent))' }}
          >
            {eyebrow}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 grid place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2"
            style={{
              width: 34,
              height: 34,
              border: '1px solid hsl(var(--tf-border))',
              color: 'hsl(var(--tf-muted))',
              background: 'hsl(var(--tf-text) / 0.04)',
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3
          id={titleId}
          className="mt-3 text-2xl font-semibold leading-tight"
          style={{ color: 'hsl(var(--tf-text))' }}
        >
          {title}
        </h3>

        {lede && (
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
            {lede}
          </p>
        )}

        <ol className="mt-6 list-none p-0">
          {steps.map((step, i) => (
            <li
              key={`${step.title}-${i}`}
              className="flex gap-3.5 py-3.5"
              style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.6)' }}
            >
              <span
                className="shrink-0 grid place-items-center rounded-full text-[13px] font-bold"
                style={{
                  width: 26,
                  height: 26,
                  color: 'hsl(var(--tf-accent))',
                  border: '1px solid hsl(var(--tf-accent))',
                  background: 'hsl(var(--tf-accent) / 0.12)',
                }}
              >
                {i + 1}
              </span>
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                  {step.title}
                </h4>
                <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: 'hsl(var(--tf-muted))' }}>
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p
          data-testid="teach-me-why-source"
          className="mt-6 pt-5 text-xs leading-relaxed"
          style={{
            color: 'hsl(var(--tf-muted))',
            borderTop: '1px solid hsl(var(--tf-border) / 0.6)',
          }}
        >
          {sourceNote}
        </p>
      </aside>
    </div>
  );
}

export default TeachMeWhyPanel;
