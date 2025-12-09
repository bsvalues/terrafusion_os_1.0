/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION EXPLAIN PANEL COMPONENT
 * Phase 13: "Explain This" - Reusable Explanation Overlay
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';

// ═══════════════════════════════════════════════════════════════
// STATE TYPE
// ═══════════════════════════════════════════════════════════════

export type ExplainPanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; text: string; keyPoints?: string[]; summary?: string };

// ═══════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════

interface ExplainPanelProps {
  /** Current state of the explain panel */
  state: ExplainPanelState;
  /** Callback when user closes the panel */
  onClose: () => void;
  /** Optional title override (defaults to "Explain this") */
  title?: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * ExplainPanel - Renders explanation content in a consistent overlay
 *
 * Usage:
 * ```tsx
 * <ExplainPanel
 *   state={explainState}
 *   onClose={() => setExplainState({ status: 'idle' })}
 * />
 * ```
 */
export const ExplainPanel: React.FC<ExplainPanelProps> = ({
  state,
  onClose,
  title = 'Explain this',
}) => {
  // Don't render anything when idle
  if (state.status === 'idle') return null;

  return (
    <aside
      className='tf-explain-panel fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700/60 bg-slate-950/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl'
      role='complementary'
      aria-label='Explanation panel'
    >
      {/* Header */}
      <div className='tf-explain-panel__header mb-3 flex items-center justify-between border-b border-slate-800/60 pb-2'>
        <div className='flex items-center gap-2'>
          <span className='text-lg'>💡</span>
          <h3 className='text-sm font-semibold uppercase tracking-[0.15em] text-slate-200'>
            {title}
          </h3>
        </div>
        <button
          type='button'
          className='tf-explain-panel__close rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-800/50 hover:text-slate-200'
          onClick={onClose}
          aria-label='Close explanation'
        >
          ✕
        </button>
      </div>

      {/* Loading State */}
      {state.status === 'loading' && (
        <div className='tf-explain-panel__body flex items-center gap-3 text-sm text-slate-400'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent' />
          <span>Generating explanation…</span>
        </div>
      )}

      {/* Error State */}
      {state.status === 'error' && (
        <div className='tf-explain-panel__body tf-explain-panel__body--error rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200'>
          <div className='mb-1 flex items-center gap-2 font-medium'>
            <span>⚠️</span>
            <span>Unable to explain</span>
          </div>
          <p className='text-rose-300/80'>{state.message}</p>
        </div>
      )}

      {/* Ready State */}
      {state.status === 'ready' && (
        <div className='tf-explain-panel__body space-y-3'>
          {/* Summary (if available) */}
          {state.summary && <p className='text-sm font-medium text-cyan-300/90'>{state.summary}</p>}

          {/* Main explanation */}
          <p className='text-sm leading-relaxed text-slate-300 whitespace-pre-wrap'>{state.text}</p>

          {/* Key points (if available) */}
          {state.keyPoints && state.keyPoints.length > 0 && (
            <div className='mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3'>
              <div className='mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400'>
                Key Points
              </div>
              <ul className='space-y-1.5'>
                {state.keyPoints.map((point, idx) => (
                  <li key={idx} className='flex items-start gap-2 text-xs text-slate-300'>
                    <span className='mt-0.5 text-emerald-400'>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className='mt-3 border-t border-slate-800/60 pt-2 text-[0.65rem] text-slate-500'>
        Phase 13 · ExplainGPT · TerraFusion OS
      </div>
    </aside>
  );
};

export default ExplainPanel;
