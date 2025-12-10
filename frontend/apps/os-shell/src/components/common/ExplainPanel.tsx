/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION EXPLAIN PANEL COMPONENT
 * Phase 13: "Explain This" - Reusable Explanation Overlay
 * Phase 25: V2 - Source Highlighting & Trace Carousel
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useMemo, useState } from 'react';
import type {
  ExplainResponseV2,
  ExplainSegment,
  ExplainSourceAttribution,
  ExplainStep,
} from '../../api/explainApi';

// ═══════════════════════════════════════════════════════════════
// STATE TYPES (V1 backward-compatible + V2)
// ═══════════════════════════════════════════════════════════════

export type ExplainPanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; text: string; keyPoints?: string[]; summary?: string } // V1
  | { status: 'ready-v2'; data: ExplainResponseV2 }; // V2

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
// SUB-COMPONENTS - Source Card
// ═══════════════════════════════════════════════════════════════

interface SourceCardProps {
  source: ExplainSourceAttribution;
  isHighlighted: boolean;
  onClick: () => void;
}

const SourceCard: React.FC<SourceCardProps> = ({ source, isHighlighted, onClick }) => {
  const typeColors: Record<string, string> = {
    documentation: 'border-sky-500/40 bg-sky-500/10',
    policy: 'border-amber-500/40 bg-amber-500/10',
    'system-config': 'border-purple-500/40 bg-purple-500/10',
    'knowledge-base': 'border-emerald-500/40 bg-emerald-500/10',
    'data-record': 'border-cyan-500/40 bg-cyan-500/10',
    regulation: 'border-rose-500/40 bg-rose-500/10',
    database: 'border-indigo-500/40 bg-indigo-500/10',
    technical: 'border-violet-500/40 bg-violet-500/10',
  };

  const colorClass = typeColors[source.sourceType] || 'border-slate-500/40 bg-slate-500/10';

  return (
    <button
      type='button'
      onClick={onClick}
      className={`
        w-full rounded-lg border p-2 text-left transition-all duration-200
        ${colorClass}
        ${isHighlighted ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950' : ''}
        hover:border-opacity-60 hover:bg-opacity-20
      `}
    >
      <div className='flex items-center gap-1.5 text-xs font-medium text-slate-200'>
        <span>📄</span>
        <span className='truncate'>{source.sourceTitle}</span>
      </div>
      <div className='mt-1 text-[0.65rem] text-slate-400 line-clamp-2'>{source.snippet}</div>
      <div className='mt-1.5 inline-block rounded bg-slate-800/60 px-1.5 py-0.5 text-[0.6rem] text-slate-500'>
        {source.sourceType}
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS - Trace Step Card
// ═══════════════════════════════════════════════════════════════

interface StepCardProps {
  step: ExplainStep;
  stepNumber: number;
  isActive: boolean;
  onClick: () => void;
}

const StepCard: React.FC<StepCardProps> = ({ step, stepNumber, isActive, onClick }) => {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`
        flex-shrink-0 rounded-lg border p-2 text-left transition-all duration-200 w-36
        ${
          isActive
            ? 'border-cyan-400/60 bg-cyan-500/15 ring-1 ring-cyan-400/50'
            : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600/60'
        }
      `}
    >
      <div className='flex items-center gap-1.5'>
        <span
          className={`
          flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold
          ${isActive ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700 text-slate-300'}
        `}
        >
          {stepNumber}
        </span>
        <span className='text-xs font-medium text-slate-200 truncate'>{step.title}</span>
      </div>
      <p className='mt-1 text-[0.6rem] text-slate-400 line-clamp-2'>{step.description}</p>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS - Segmented Text
// ═══════════════════════════════════════════════════════════════

interface SegmentedTextProps {
  segments: ExplainSegment[];
  highlightedSourceIds: string[];
  onSegmentHover: (segmentId: string | null) => void;
}

const SegmentedText: React.FC<SegmentedTextProps> = ({
  segments,
  highlightedSourceIds,
  onSegmentHover,
}) => {
  return (
    <div className='text-sm leading-relaxed text-slate-300 whitespace-pre-wrap'>
      {segments.map((segment, idx) => {
        const isHighlighted = segment.sourceIds.some((sid) => highlightedSourceIds.includes(sid));
        return (
          <span
            key={segment.segmentId}
            className={`
              inline transition-colors duration-200
              ${isHighlighted ? 'bg-cyan-500/25 text-cyan-200 rounded px-0.5' : ''}
            `}
            onMouseEnter={() => onSegmentHover(segment.segmentId)}
            onMouseLeave={() => onSegmentHover(null)}
          >
            {segment.text}
            {idx < segments.length - 1 && ' '}
          </span>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * ExplainPanel - Renders explanation content in a consistent overlay
 * V2: Supports segmented text, source rail, and trace carousel
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
  // V2 state
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

  // Compute highlighted source IDs based on selection
  const highlightedSourceIds = useMemo(() => {
    if (state.status !== 'ready-v2') return [];
    const ids: string[] = [];
    if (selectedSourceId) ids.push(selectedSourceId);
    if (activeStepId) {
      const step = state.data.steps.find((s) => s.stepId === activeStepId);
      if (step) ids.push(...step.sourceIds);
    }
    if (hoveredSegmentId) {
      const seg = state.data.segments.find((s) => s.segmentId === hoveredSegmentId);
      if (seg) ids.push(...seg.sourceIds);
    }
    return [...new Set(ids)];
  }, [state, selectedSourceId, activeStepId, hoveredSegmentId]);

  const handleSourceClick = useCallback((sourceId: string) => {
    setSelectedSourceId((prev) => (prev === sourceId ? null : sourceId));
    setActiveStepId(null);
  }, []);

  const handleStepClick = useCallback((stepId: string) => {
    setActiveStepId((prev) => (prev === stepId ? null : stepId));
    setSelectedSourceId(null);
  }, []);

  // Don't render anything when idle
  if (state.status === 'idle') return null;

  const isV2 = state.status === 'ready-v2';

  return (
    <aside
      className={`
        tf-explain-panel fixed bottom-4 right-4 z-50 rounded-2xl border border-slate-700/60
        bg-slate-950/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl
        ${isV2 ? 'w-[32rem] max-w-[calc(100vw-2rem)]' : 'w-96 max-w-[calc(100vw-2rem)]'}
      `}
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
          {isV2 && (
            <span className='rounded bg-cyan-500/20 px-1.5 py-0.5 text-[0.6rem] font-medium text-cyan-300'>
              V2
            </span>
          )}
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

      {/* V1 Ready State (backward compatible) */}
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

      {/* V2 Ready State - Full experience */}
      {state.status === 'ready-v2' && (
        <div className='tf-explain-panel__body-v2 space-y-4'>
          {/* Summary */}
          {state.data.summary && (
            <p className='text-sm font-medium text-cyan-300/90'>{state.data.summary}</p>
          )}

          {/* Segmented Explanation with Source Highlighting */}
          <div className='rounded-xl border border-slate-800/60 bg-slate-900/40 p-3'>
            <div className='mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500'>
              Explanation
            </div>
            {state.data.segments.length > 0 ? (
              <SegmentedText
                segments={state.data.segments}
                highlightedSourceIds={highlightedSourceIds}
                onSegmentHover={setHoveredSegmentId}
              />
            ) : (
              <p className='text-sm leading-relaxed text-slate-300 whitespace-pre-wrap'>
                {state.data.fullText}
              </p>
            )}
          </div>

          {/* Sources Rail */}
          {state.data.sources.length > 0 && (
            <div className='rounded-xl border border-slate-800/60 bg-slate-900/40 p-3'>
              <div className='mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500'>
                Sources ({state.data.sources.length})
              </div>
              <div className='grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1'>
                {state.data.sources.map((source) => (
                  <SourceCard
                    key={source.sourceId}
                    source={source}
                    isHighlighted={highlightedSourceIds.includes(source.sourceId)}
                    onClick={() => handleSourceClick(source.sourceId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trace Steps Carousel */}
          {state.data.steps.length > 0 && (
            <div className='rounded-xl border border-slate-800/60 bg-slate-900/40 p-3'>
              <div className='mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500'>
                Trace Steps
              </div>
              <div className='flex gap-2 overflow-x-auto pb-2'>
                {state.data.steps.map((step, idx) => (
                  <StepCard
                    key={step.stepId}
                    step={step}
                    stepNumber={idx + 1}
                    isActive={activeStepId === step.stepId}
                    onClick={() => handleStepClick(step.stepId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Metadata Footer */}
          <div className='flex items-center justify-between text-[0.6rem] text-slate-500'>
            <span>
              Confidence: {Math.round((state.data.confidence ?? 0) * 100)}% ·{' '}
              {state.data.processingTimeMs}ms
            </span>
            <span>ID: {state.data.explanationId?.slice(0, 8) ?? 'n/a'}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className='mt-3 border-t border-slate-800/60 pt-2 text-[0.65rem] text-slate-500'>
        {isV2 ? 'Phase 25 · ExplainGPT V2' : 'Phase 13 · ExplainGPT'} · TerraFusion OS
      </div>
    </aside>
  );
};

export default ExplainPanel;
