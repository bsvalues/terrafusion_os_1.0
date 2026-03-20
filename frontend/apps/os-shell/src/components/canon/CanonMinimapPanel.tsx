import React, { useCallback, useEffect, useState } from 'react';
import { fetchMinimap, type MinimapSection, type MinimapResponse } from '../../api/canonFs';

interface CanonMinimapPanelProps {
  filePath: string | null;
  onGoToLine?: (line: number) => void;
}

const DENSITY_COLOR = 'hsl(var(--primary))';
const FALLBACK_ICON_COLOR = 'hsl(var(--muted-foreground))';
const FALLBACK_BLOCK_COLOR = 'hsl(var(--muted-foreground) / 0.8)';

const KIND_COLORS: Record<string, string> = {
  function: 'hsl(var(--primary))',
  class: 'hsl(var(--tf-warning))',
  interface: 'hsl(var(--tf-success))',
  type: 'hsl(var(--accent))',
  import: 'hsl(var(--muted-foreground))',
  export: 'hsl(var(--foreground))',
  comment: 'hsl(var(--tf-success) / 0.7)',
  block: 'hsl(var(--muted-foreground) / 0.8)',
};

const KIND_LABELS: Record<string, string> = {
  function: '𝑓',
  class: '𝐂',
  interface: '𝐈',
  type: '𝐓',
  import: '⬇',
  export: '⬆',
  comment: '✎',
  block: '▦',
};

export const CanonMinimapPanel: React.FC<CanonMinimapPanelProps> = ({ filePath, onGoToLine }) => {
  const [data, setData] = useState<MinimapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!filePath) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await fetchMinimap(filePath);
    if (result.error) {
      setError(result.error);
      setData(null);
    } else {
      setData(result);
      setError(null);
    }
    setLoading(false);
  }, [filePath]);

  useEffect(() => {
    load();
  }, [load]);

  if (!filePath) {
    return (
      <div className='canon-minimap__empty'>
        Open a file to see its structural overview.
      </div>
    );
  }

  if (loading) {
    return <div className='canon-minimap__loading'>Analyzing…</div>;
  }

  if (error) {
    return <div className='canon-minimap__error'>{error}</div>;
  }

  if (!data) return null;

  const { totalLines, sections, symbolDensity } = data;
  const maxDensity = Math.max(...symbolDensity, 1);

  return (
    <div className='canon-minimap'>
      <div className='canon-minimap__header'>
        <span className='canon-minimap__title'>Minimap</span>
        <span className='canon-minimap__stats'>
          {totalLines} lines · {sections.length} sections
        </span>
      </div>

      {/* Symbol density heatbar */}
      <div className='canon-minimap__density'>
        <div className='canon-minimap__density-label'>Symbol density</div>
        <div className='canon-minimap__density-bar'>
          {symbolDensity.map((count, i) => (
            <div
              key={i}
              className='canon-minimap__density-cell'
              style={{
                opacity: 0.15 + (count / maxDensity) * 0.85,
                backgroundColor: count > 0 ? DENSITY_COLOR : undefined,
              }}
              title={`Lines ${i * 10 + 1}–${Math.min((i + 1) * 10, totalLines)}: ${count} symbol(s)`}
            />
          ))}
        </div>
      </div>

      {/* Sections list */}
      <div className='canon-minimap__sections'>
        <div className='canon-minimap__sections-label'>Structure</div>
        {sections.length === 0 ? (
          <div className='canon-minimap__no-sections'>No sections detected</div>
        ) : (
          sections.map((section, i) => (
            <button
              key={i}
              className={`canon-minimap__section ${hoveredSection === i ? 'canon-minimap__section--hover' : ''}`}
              style={{ paddingLeft: `${0.5 + section.depth * 0.75}rem` }}
              onClick={() => onGoToLine?.(section.startLine)}
              onMouseEnter={() => setHoveredSection(i)}
              onMouseLeave={() => setHoveredSection(null)}
              title={`${section.kind}: ${section.label} (lines ${section.startLine}–${section.endLine})`}
            >
              <span
                className='canon-minimap__section-icon'
                style={{ color: KIND_COLORS[section.kind] || FALLBACK_ICON_COLOR }}
              >
                {KIND_LABELS[section.kind] || '·'}
              </span>
              <span className='canon-minimap__section-label'>{section.label}</span>
              <span className='canon-minimap__section-lines'>
                {section.startLine}–{section.endLine}
              </span>
              <span
                className='canon-minimap__section-bar'
                style={{
                  width: `${Math.max(4, ((section.endLine - section.startLine + 1) / totalLines) * 100)}%`,
                  backgroundColor: KIND_COLORS[section.kind] || FALLBACK_BLOCK_COLOR,
                }}
              />
            </button>
          ))
        )}
      </div>

      {/* Visual minimap strip */}
      <div className='canon-minimap__strip'>
        <div className='canon-minimap__strip-label'>Overview</div>
        <div className='canon-minimap__strip-canvas'>
          {sections.map((section, i) => {
            const top = ((section.startLine - 1) / totalLines) * 100;
            const height = Math.max(2, ((section.endLine - section.startLine + 1) / totalLines) * 100);
            return (
              <div
                key={i}
                className='canon-minimap__strip-block'
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  backgroundColor: KIND_COLORS[section.kind] || FALLBACK_BLOCK_COLOR,
                  left: `${section.depth * 8}%`,
                  width: `${100 - section.depth * 8}%`,
                }}
                onClick={() => onGoToLine?.(section.startLine)}
                title={`${section.label} (${section.kind})`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CanonMinimapPanel;
