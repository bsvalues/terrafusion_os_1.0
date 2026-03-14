import React, { useState, useCallback, useMemo } from 'react';
import { fetchDiagnostics, type Diagnostic, type DiagnosticsResponse } from '../api/canonFs';

interface CanonProblemsPanelProps {
  onGoToFile?: (filePath: string, line: number, column: number) => void;
}

const SEVERITY_ICON: Record<string, string> = {
  error: '⊘',
  warning: '⚠',
  info: 'ℹ',
};

const SEVERITY_CSS: Record<string, string> = {
  error: 'canon-problems__severity--error',
  warning: 'canon-problems__severity--warning',
  info: 'canon-problems__severity--info',
};

export const CanonProblemsPanel: React.FC<CanonProblemsPanelProps> = ({ onGoToFile }) => {
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [scope, setScope] = useState<'typecheck' | 'lint'>('typecheck');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const runDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDiagnostics(scope);
      setData(result);
      // Auto-expand files with errors (up to 10)
      const errorFiles = new Set(
        result.diagnostics
          .filter((d) => d.severity === 'error')
          .map((d) => d.file)
          .slice(0, 10)
      );
      setExpandedFiles(errorFiles);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  // Group diagnostics by file
  const grouped = useMemo(() => {
    if (!data) return new Map<string, Diagnostic[]>();
    const lowerFilter = filter.toLowerCase();
    const filtered = filter
      ? data.diagnostics.filter(
          (d) =>
            d.file.toLowerCase().includes(lowerFilter) ||
            d.message.toLowerCase().includes(lowerFilter) ||
            (d.code && d.code.toLowerCase().includes(lowerFilter))
        )
      : data.diagnostics;

    const map = new Map<string, Diagnostic[]>();
    for (const d of filtered) {
      const arr = map.get(d.file) || [];
      arr.push(d);
      map.set(d.file, arr);
    }
    return map;
  }, [data, filter]);

  const toggleFile = useCallback((file: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  }, []);

  const handleDiagClick = useCallback(
    (d: Diagnostic) => {
      onGoToFile?.(d.file, d.line, d.column);
    },
    [onGoToFile]
  );

  return (
    <div className='canon-problems'>
      {/* Header */}
      <div className='canon-problems__header'>
        <div className='canon-problems__controls'>
          <button
            className='canon-problems__run-btn'
            onClick={runDiagnostics}
            disabled={loading}
          >
            {loading ? '⟳ Running…' : '▶ Run Diagnostics'}
          </button>
          <select
            className='canon-problems__scope-select'
            value={scope}
            onChange={(e) => setScope(e.target.value as 'typecheck' | 'lint')}
            disabled={loading}
          >
            <option value='typecheck'>Type Check</option>
            <option value='lint'>Lint</option>
          </select>
        </div>
        {data && !data.error && (
          <div className='canon-problems__summary'>
            <span className='canon-problems__severity--error'>
              {SEVERITY_ICON.error} {data.errorCount}
            </span>
            <span className='canon-problems__severity--warning'>
              {SEVERITY_ICON.warning} {data.warningCount}
            </span>
            <span className='canon-problems__severity--info'>
              {SEVERITY_ICON.info} {data.infoCount}
            </span>
            <span className='canon-problems__duration'>
              {data.durationMs}ms
            </span>
          </div>
        )}
      </div>

      {/* Filter */}
      {data && data.diagnostics.length > 0 && (
        <input
          className='canon-problems__filter'
          type='text'
          placeholder='Filter by file, message, or code…'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}

      {/* Content */}
      <div className='canon-problems__list'>
        {!data && !loading && (
          <div className='canon-problems__empty'>
            Click <strong>Run Diagnostics</strong> to check for errors
          </div>
        )}

        {loading && (
          <div className='canon-problems__loading'>Running {scope}… this may take a moment</div>
        )}

        {data?.error && (
          <div className='canon-problems__error'>{data.error}</div>
        )}

        {data && !data.error && data.diagnostics.length === 0 && (
          <div className='canon-problems__clean'>
            ✓ No problems found — clean build in {data.durationMs}ms
          </div>
        )}

        {[...grouped.entries()].map(([file, diags]) => (
          <div key={file} className='canon-problems__file-group'>
            <button
              className='canon-problems__file-header'
              onClick={() => toggleFile(file)}
            >
              <span className='canon-problems__chevron'>
                {expandedFiles.has(file) ? '▾' : '▸'}
              </span>
              <span className='canon-problems__file-name'>{file}</span>
              <span className='canon-problems__file-count'>{diags.length}</span>
            </button>
            {expandedFiles.has(file) && (
              <div className='canon-problems__diag-list'>
                {diags.map((d, i) => (
                  <button
                    key={`${d.line}:${d.column}:${i}`}
                    className='canon-problems__diag-item'
                    onClick={() => handleDiagClick(d)}
                    title={`${d.file}:${d.line}:${d.column}`}
                  >
                    <span className={`canon-problems__diag-icon ${SEVERITY_CSS[d.severity] || ''}`}>
                      {SEVERITY_ICON[d.severity] || '·'}
                    </span>
                    <span className='canon-problems__diag-message'>{d.message}</span>
                    {d.code && (
                      <span className='canon-problems__diag-code'>{d.code}</span>
                    )}
                    <span className='canon-problems__diag-loc'>
                      [{d.line},{d.column}]
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {data && !data.error && data.diagnostics.length > 0 && (
        <div className='canon-problems__footer'>
          {grouped.size} file{grouped.size !== 1 ? 's' : ''} ·{' '}
          {data.diagnostics.length} problem{data.diagnostics.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default CanonProblemsPanel;
