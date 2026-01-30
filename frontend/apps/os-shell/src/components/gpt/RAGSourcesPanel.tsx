/**
 * RAGSourcesPanel Component
 * Phase 11: Display RAG chunk sources with expandable details
 * Phase 13: ExplainGPT integration - "Explain this view" affordance
 * Constellation: Radiant (UX) + Arc (RAG) + Sentinel (Audit)
 */

import { useState } from 'react';
import { explainContext } from '../../api/explainApi';
import type { RAGChunkDetailDto } from '../../lib/api/gptClient';
import { ExplainPanel, type ExplainPanelState } from '../common/ExplainPanel';

interface RAGSourcesPanelProps {
  chunks: RAGChunkDetailDto[];
  /** Whether the panel is initially expanded */
  defaultExpanded?: boolean;
}

/**
 * Format similarity score as percentage with color coding
 */
function ScoreBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);

  // Color code based on score
  let colorClass = 'text-red-300 border-red-400/40 bg-red-500/10';
  if (percentage >= 90) {
    colorClass = 'text-emerald-300 border-emerald-400/60 bg-emerald-500/20';
  } else if (percentage >= 75) {
    colorClass = 'text-cyan-300 border-cyan-400/50 bg-cyan-500/15';
  } else if (percentage >= 60) {
    colorClass = 'text-amber-300 border-amber-400/40 bg-amber-500/10';
  }

  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 text-[0.6rem] font-semibold ${colorClass}`}
      title={`Similarity: ${percentage}%`}
    >
      {percentage}%
    </span>
  );
}

/**
 * Single chunk display with expandable snippet
 */
function ChunkItem({
  chunk,
  isExpanded,
  onToggle,
}: {
  chunk: RAGChunkDetailDto;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className='border-l-2 border-emerald-400/30 pl-2.5'>
      <button
        type='button'
        onClick={onToggle}
        className='flex w-full items-center justify-between gap-2 text-left'
      >
        <div className='flex items-center gap-2'>
          <span className='text-emerald-400/70'>{isExpanded ? '▼' : '▶'}</span>
          <span className='text-[0.65rem] font-medium text-slate-200'>
            Chunk #{chunk.chunkIndex + 1}
          </span>
          <ScoreBadge score={chunk.score} />
        </div>
      </button>

      {isExpanded && (
        <div className='mt-1.5 space-y-1'>
          <div className='rounded-lg border border-slate-700/50 bg-slate-900/50 p-2'>
            <p className='text-[0.6rem] leading-relaxed text-slate-300/90'>{chunk.textSnippet}</p>
          </div>
          {chunk.sourceUrl && (
            <a
              href={chunk.sourceUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 text-[0.55rem] text-cyan-400/70 hover:text-cyan-300'
            >
              <span>🔗</span>
              <span className='underline'>Source</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Group chunks by document title
 */
function groupChunksByDocument(chunks: RAGChunkDetailDto[]): Map<string, RAGChunkDetailDto[]> {
  const groups = new Map<string, RAGChunkDetailDto[]>();

  for (const chunk of chunks) {
    const title = chunk.documentTitle || 'Unknown Document';
    const existing = groups.get(title) || [];
    existing.push(chunk);
    groups.set(title, existing);
  }

  return groups;
}

/**
 * Document group with expandable chunks
 */
function DocumentGroup({ title, chunks }: { title: string; chunks: RAGChunkDetailDto[] }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set([0])); // First chunk expanded by default

  const avgScore = chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length;

  const toggleChunk = (index: number) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className='rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-2.5'>
      <button
        type='button'
        onClick={() => setIsExpanded((prev) => !prev)}
        className='flex w-full items-center justify-between gap-2 text-left'
      >
        <div className='flex items-center gap-2'>
          <span className='text-lg'>📄</span>
          <span className='text-[0.7rem] font-semibold text-emerald-200'>{title}</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-[0.55rem] text-slate-400'>
            {chunks.length} chunk{chunks.length !== 1 ? 's' : ''}
          </span>
          <ScoreBadge score={avgScore} />
          <span className='text-emerald-400/60'>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className='mt-2 space-y-2'>
          {chunks.map((chunk, idx) => (
            <ChunkItem
              key={`${chunk.chunkId}-${idx}`}
              chunk={chunk}
              isExpanded={expandedChunks.has(idx)}
              onToggle={() => toggleChunk(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * RAGSourcesPanel - Main component for displaying RAG source chunks
 *
 * Features:
 * - Groups chunks by document
 * - Expandable/collapsible sections
 * - Score color coding (green = high, amber = medium, red = low)
 * - Truncated snippets with full text on expand
 */
export function RAGSourcesPanel({ chunks, defaultExpanded = true }: RAGSourcesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [explainState, setExplainState] = useState<ExplainPanelState>({ status: 'idle' });

  /**
   * Handle "Explain this view" action - fetch ExplainGPT context for RAGTracePanel
   */
  const handleExplainThisView = async () => {
    setExplainState({ status: 'loading' });
    try {
      const response = await explainContext({
        contextType: 'Component',
        contextId: 'RAGTracePanel',
        metadata: { chunkCount: chunks.length },
      });
      setExplainState({
        status: 'ready',
        text: response.explanation,
        summary: response.summary,
        keyPoints: response.keyPoints,
      });
    } catch (err) {
      setExplainState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch explanation',
      });
    }
  };

  /**
   * Close the ExplainPanel
   */
  const handleCloseExplain = () => {
    setExplainState({ status: 'idle' });
  };

  if (!chunks || chunks.length === 0) {
    return null;
  }

  const groupedChunks = groupChunksByDocument(chunks);
  const documentCount = groupedChunks.size;
  const avgScore = chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length;

  return (
    <div className='mt-2.5 rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 p-3'>
      {/* Header */}
      <button
        type='button'
        onClick={() => setIsExpanded((prev) => !prev)}
        className='flex w-full items-center justify-between'
      >
        <div className='flex items-center gap-2'>
          <span className='text-lg'>📚</span>
          <span className='text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-200'>
            RAG Sources
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-[0.6rem] text-slate-400'>
            {documentCount} doc{documentCount !== 1 ? 's' : ''} • {chunks.length} chunk
            {chunks.length !== 1 ? 's' : ''}
          </span>
          <ScoreBadge score={avgScore} />
          {/* Explain this view button (Phase 13) */}
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              void handleExplainThisView();
            }}
            className='rounded-full border border-fuchsia-500/50 bg-fuchsia-500/10 px-1.5 py-0.5 text-[0.55rem] text-fuchsia-300 transition-all hover:bg-fuchsia-500/20 hover:shadow-[0_0_8px_rgba(217,70,239,0.3)]'
            title='Explain this view'
          >
            ❓
          </button>
          <span className='text-emerald-400/60 transition-transform duration-200'>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className='mt-3 space-y-2.5'>
          {Array.from(groupedChunks.entries()).map(([title, docChunks]) => (
            <DocumentGroup key={title} title={title} chunks={docChunks} />
          ))}

          {/* Audit Trail Note */}
          <div className='mt-2 flex items-center gap-1.5 text-[0.55rem] text-slate-500'>
            <span>🔒</span>
            <span>Source data logged for government compliance audit trail (Phase 11)</span>
          </div>
        </div>
      )}

      {/* ExplainPanel overlay (Phase 13) */}
      <ExplainPanel state={explainState} onClose={handleCloseExplain} />
    </div>
  );
}

export default RAGSourcesPanel;
