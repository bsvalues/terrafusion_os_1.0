import React, { useCallback, useRef, useState } from 'react';
import { fetchFindReplace, type FindReplaceMatch } from '../api/canonFs';

export interface CanonFindReplacePanelProps {
  activeFilePath?: string | null;
  onOpenFile?: (filePath: string, line?: number) => void;
  onClose?: () => void;
}

interface GroupedMatches {
  filePath: string;
  matches: FindReplaceMatch[];
}

function groupByFile(matches: FindReplaceMatch[]): GroupedMatches[] {
  const map = new Map<string, FindReplaceMatch[]>();
  for (const m of matches) {
    const arr = map.get(m.filePath);
    if (arr) arr.push(m);
    else map.set(m.filePath, [m]);
  }
  return Array.from(map.entries()).map(([filePath, matches]) => ({ filePath, matches }));
}

export default function CanonFindReplacePanel({ activeFilePath, onOpenFile, onClose }: CanonFindReplacePanelProps) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [scopeToFile, setScopeToFile] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [results, setResults] = useState<FindReplaceMatch[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [filesSearched, setFilesSearched] = useState(0);
  const [replacementsApplied, setReplacementsApplied] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const queryRef = useRef<HTMLInputElement>(null);

  const doFind = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setReplacementsApplied(null);
    const resp = await fetchFindReplace({
      action: 'find',
      query,
      isRegex,
      caseSensitive,
      filePath: scopeToFile && activeFilePath ? activeFilePath : undefined,
    });
    setLoading(false);
    if (resp.error) {
      setError(resp.error);
    } else {
      setResults(resp.matches);
      setTotalMatches(resp.totalMatches);
      setFilesSearched(resp.filesSearched);
      // Auto-expand first 5 files
      const groups = groupByFile(resp.matches);
      setExpandedFiles(new Set(groups.slice(0, 5).map((g) => g.filePath)));
    }
  }, [query, isRegex, caseSensitive, scopeToFile, activeFilePath]);

  const doReplaceAll = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    const resp = await fetchFindReplace({
      action: 'replaceAll',
      query,
      replacement,
      isRegex,
      caseSensitive,
      filePath: scopeToFile && activeFilePath ? activeFilePath : undefined,
    });
    setLoading(false);
    if (resp.error) {
      setError(resp.error);
    } else {
      setResults(resp.matches);
      setTotalMatches(resp.totalMatches);
      setFilesSearched(resp.filesSearched);
      setReplacementsApplied(resp.replacementsApplied ?? 0);
      const groups = groupByFile(resp.matches);
      setExpandedFiles(new Set(groups.slice(0, 5).map((g) => g.filePath)));
    }
  }, [query, replacement, isRegex, caseSensitive, scopeToFile, activeFilePath]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doFind();
      }
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    },
    [doFind, onClose],
  );

  const toggleFile = useCallback((filePath: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  }, []);

  const grouped = groupByFile(results);

  return (
    <div className="canon-find-replace">
      <div className="canon-find-replace__header">
        <span className="canon-find-replace__title">
          {showReplace ? 'Find & Replace' : 'Find in Files'}
        </span>
        <div className="canon-find-replace__header-actions">
          <button
            className={`canon-find-replace__toggle-btn ${showReplace ? 'canon-find-replace__toggle-btn--active' : ''}`}
            onClick={() => setShowReplace(!showReplace)}
            title="Toggle Replace"
          >
            ⇄
          </button>
          {onClose && (
            <button className="canon-find-replace__close-btn" onClick={onClose} title="Close">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="canon-find-replace__inputs">
        <div className="canon-find-replace__input-row">
          <input
            ref={queryRef}
            className="canon-find-replace__input"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={`canon-find-replace__opt-btn ${caseSensitive ? 'canon-find-replace__opt-btn--active' : ''}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Match Case"
          >
            Aa
          </button>
          <button
            className={`canon-find-replace__opt-btn ${isRegex ? 'canon-find-replace__opt-btn--active' : ''}`}
            onClick={() => setIsRegex(!isRegex)}
            title="Use Regex"
          >
            .*
          </button>
        </div>

        {showReplace && (
          <div className="canon-find-replace__input-row">
            <input
              className="canon-find-replace__input"
              placeholder="Replace with…"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="canon-find-replace__action-btn"
              onClick={doReplaceAll}
              disabled={loading || !query.trim()}
              title="Replace All"
            >
              ⟳ All
            </button>
          </div>
        )}

        <div className="canon-find-replace__options-row">
          <label className="canon-find-replace__checkbox">
            <input
              type="checkbox"
              checked={scopeToFile}
              onChange={() => setScopeToFile(!scopeToFile)}
            />
            <span>Current file only</span>
          </label>
          <button
            className="canon-find-replace__find-btn"
            onClick={doFind}
            disabled={loading || !query.trim()}
          >
            {loading ? 'Searching…' : 'Find'}
          </button>
        </div>
      </div>

      {error && <div className="canon-find-replace__error">{error}</div>}

      {replacementsApplied !== null && (
        <div className="canon-find-replace__replaced-banner">
          Replaced {replacementsApplied} occurrence{replacementsApplied !== 1 ? 's' : ''}
        </div>
      )}

      {totalMatches > 0 && (
        <div className="canon-find-replace__summary">
          {totalMatches} match{totalMatches !== 1 ? 'es' : ''} in {filesSearched} file
          {filesSearched !== 1 ? 's' : ''}
        </div>
      )}

      {totalMatches === 0 && !loading && query.trim() && !error && (
        <div className="canon-find-replace__empty">No matches found</div>
      )}

      <div className="canon-find-replace__results">
        {grouped.map((group) => {
          const expanded = expandedFiles.has(group.filePath);
          const fileName = group.filePath.split('/').pop() ?? group.filePath;
          return (
            <div key={group.filePath} className="canon-find-replace__file-group">
              <button
                className="canon-find-replace__file-header"
                onClick={() => toggleFile(group.filePath)}
              >
                <span className="canon-find-replace__chevron">{expanded ? '▾' : '▸'}</span>
                <span className="canon-find-replace__file-name" title={group.filePath}>
                  {fileName}
                </span>
                <span className="canon-find-replace__match-count">{group.matches.length}</span>
              </button>
              {expanded &&
                group.matches.map((m, i) => (
                  <button
                    key={`${m.line}-${m.column}-${i}`}
                    className="canon-find-replace__match-row"
                    onClick={() => onOpenFile?.(m.filePath, m.line)}
                    title={`${m.filePath}:${m.line}:${m.column}`}
                  >
                    <span className="canon-find-replace__line-num">{m.line}</span>
                    <span className="canon-find-replace__line-text">
                      {highlightMatch(m.lineText, m.matchText, m.column)}
                    </span>
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function highlightMatch(lineText: string, matchText: string, column: number): React.ReactNode {
  const idx = column - 1;
  if (idx < 0 || idx >= lineText.length) return lineText;
  const before = lineText.slice(0, idx);
  const match = lineText.slice(idx, idx + matchText.length);
  const after = lineText.slice(idx + matchText.length);
  return (
    <>
      {before}
      <mark className="canon-find-replace__highlight">{match}</mark>
      {after}
    </>
  );
}
