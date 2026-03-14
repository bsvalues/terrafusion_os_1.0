/**
 * CanonSearchPanel — Search across files in TerraCanon.
 *
 * Features:
 * - Text or regex search across allowlisted paths
 * - Results grouped by file with line numbers
 * - Click result → opens file at matching line
 * - Debounced search with loading states
 * - Scope selector for path prefix filtering
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { searchCanonFiles, type SearchMatch } from '../api/canonFs';

// ── Props ────────────────────────────────────────────────────────

export interface CanonSearchPanelProps {
  /** Called when user clicks a search result to open the file */
  onFileSelect: (filePath: string, line?: number) => void;
}

// ── Grouped matches ──────────────────────────────────────────────

interface FileGroup {
  filePath: string;
  matches: SearchMatch[];
}

function groupByFile(matches: SearchMatch[]): FileGroup[] {
  const map = new Map<string, SearchMatch[]>();
  for (const m of matches) {
    const existing = map.get(m.filePath);
    if (existing) {
      existing.push(m);
    } else {
      map.set(m.filePath, [m]);
    }
  }
  return Array.from(map.entries()).map(([filePath, matches]) => ({ filePath, matches }));
}

function fileBasename(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

// ── Component ────────────────────────────────────────────────────

export function CanonSearchPanel({ onFileSelect }: CanonSearchPanelProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<FileGroup[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string, regex: boolean) => {
    if (!q.trim()) {
      setGroups([]);
      setTotalMatches(0);
      setTruncated(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await searchCanonFiles(q, { isRegex: regex, maxResults: 200 });

    if (result.error) {
      setError(result.error);
      setGroups([]);
      setTotalMatches(0);
      setTruncated(false);
    } else {
      const grouped = groupByFile(result.matches);
      setGroups(grouped);
      setTotalMatches(result.totalMatches);
      setTruncated(result.truncated);
      // Auto-expand first 5 files
      const autoExpand = new Set(grouped.slice(0, 5).map((g) => g.filePath));
      setExpandedFiles(autoExpand);
    }

    setLoading(false);
  }, []);

  // Debounced input handler
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(val, isRegex), 350);
    },
    [doSearch, isRegex],
  );

  // Toggle regex and re-search
  const handleRegexToggle = useCallback(() => {
    const next = !isRegex;
    setIsRegex(next);
    if (query.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(query, next), 150);
    }
  }, [isRegex, query, doSearch]);

  // Enter to search immediately
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        void doSearch(query, isRegex);
      }
    },
    [query, isRegex, doSearch],
  );

  // Toggle file group expansion
  const toggleFile = useCallback((filePath: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className='canon-search' data-testid='canon-search-panel'>
      {/* ── Search input ───────────────────────────────────── */}
      <div className='canon-search__input-row'>
        <input
          ref={inputRef}
          className='canon-search__input'
          type='text'
          placeholder='Search files…'
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          data-testid='canon-search-input'
        />
        <button
          className={`canon-search__regex-btn ${isRegex ? 'canon-search__regex-btn--active' : ''}`}
          title='Use regular expression'
          onClick={handleRegexToggle}
          data-testid='canon-search-regex'
        >
          .*
        </button>
      </div>

      {/* ── Status line ────────────────────────────────────── */}
      {loading && (
        <div className='canon-search__status' data-testid='canon-search-loading'>
          Searching…
        </div>
      )}

      {error && (
        <div className='canon-search__status canon-search__status--error' data-testid='canon-search-error'>
          {error}
        </div>
      )}

      {!loading && !error && query.trim() && totalMatches > 0 && (
        <div className='canon-search__status' data-testid='canon-search-count'>
          {totalMatches} result{totalMatches !== 1 ? 's' : ''} in {groups.length} file
          {groups.length !== 1 ? 's' : ''}
          {truncated ? ' (truncated)' : ''}
        </div>
      )}

      {!loading && !error && query.trim() && totalMatches === 0 && (
        <div className='canon-search__status canon-search__status--empty' data-testid='canon-search-empty'>
          No results found
        </div>
      )}

      {/* ── Results ────────────────────────────────────────── */}
      <div className='canon-search__results' data-testid='canon-search-results'>
        {groups.map((group) => {
          const isExpanded = expandedFiles.has(group.filePath);
          return (
            <div key={group.filePath} className='canon-search__file-group'>
              <button
                className='canon-search__file-header'
                onClick={() => toggleFile(group.filePath)}
                data-testid={`canon-search-file-${fileBasename(group.filePath)}`}
              >
                <span className='canon-search__file-chevron'>
                  {isExpanded ? '▾' : '▸'}
                </span>
                <span className='canon-search__file-icon'>📄</span>
                <span className='canon-search__file-name'>{fileBasename(group.filePath)}</span>
                <span className='canon-search__file-path'>{group.filePath}</span>
                <span className='canon-search__file-count'>{group.matches.length}</span>
              </button>
              {isExpanded && (
                <div className='canon-search__match-list'>
                  {group.matches.map((match, i) => (
                    <button
                      key={`${match.line}-${i}`}
                      className='canon-search__match-item'
                      onClick={() => onFileSelect(match.filePath, match.line)}
                      data-testid={`canon-search-match-${match.line}`}
                    >
                      <span className='canon-search__match-line'>L{match.line}</span>
                      <HighlightedText text={match.text} query={query} isRegex={isRegex} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Highlighted text helper ──────────────────────────────────────

function HighlightedText({
  text,
  query,
  isRegex,
}: {
  text: string;
  query: string;
  isRegex: boolean;
}): React.ReactElement {
  if (!query.trim()) {
    return <span className='canon-search__match-text'>{text}</span>;
  }

  try {
    const pattern = isRegex
      ? new RegExp(`(${query})`, 'gi')
      : new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(pattern);

    return (
      <span className='canon-search__match-text'>
        {parts.map((part, i) =>
          pattern.test(part) ? (
            <mark key={i} className='canon-search__highlight'>
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </span>
    );
  } catch {
    return <span className='canon-search__match-text'>{text}</span>;
  }
}
