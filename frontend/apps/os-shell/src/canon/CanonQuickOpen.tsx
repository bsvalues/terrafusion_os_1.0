import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchFileIndex, type FileIndexEntry, fetchRecentFiles, type RecentFileEntry } from '../api/canonFs';

export interface CanonQuickOpenProps {
  open: boolean;
  onClose: () => void;
  onOpenFile: (filePath: string) => void;
}

/**
 * Quick Open overlay (Ctrl+P) — fuzzy file search across allowed Canon paths.
 * Loads file index on first open, caches it, supports type-ahead fuzzy matching.
 */
export default function CanonQuickOpen({ open, onClose, onOpenFile }: CanonQuickOpenProps) {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<FileIndexEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentFiles, setRecentFiles] = useState<RecentFileEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cachedRef = useRef<FileIndexEntry[] | null>(null);

  // Load file index on first open
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);

    // Focus input after render
    requestAnimationFrame(() => inputRef.current?.focus());

    // Use cache if available
    if (cachedRef.current) {
      setFiles(cachedRef.current);
    } else {
      setLoading(true);
      setError(null);
      fetchFileIndex().then((res) => {
        setLoading(false);
        if (res.error) {
          setError(res.error);
          return;
        }
        cachedRef.current = res.files;
        setFiles(res.files);
      });
    }

    // Always load recent files fresh on open
    fetchRecentFiles('list').then((res) => {
      if (!res.error) setRecentFiles(res.files);
    });
  }, [open]);

  // Fuzzy match: split query into chars, check if all appear in order in the path
  const fuzzyMatch = useCallback((filePath: string, q: string): { match: boolean; score: number } => {
    if (!q) return { match: true, score: 0 };
    const lower = filePath.toLowerCase();
    const qLower = q.toLowerCase();

    // Exact substring match gets highest score
    const subIdx = lower.indexOf(qLower);
    if (subIdx !== -1) {
      // Prefer matches in filename over directory
      const name = filePath.split('/').pop() || '';
      const nameIdx = name.toLowerCase().indexOf(qLower);
      if (nameIdx !== -1) return { match: true, score: 1000 - nameIdx };
      return { match: true, score: 500 - subIdx };
    }

    // Character-by-character fuzzy match
    let qi = 0;
    let score = 0;
    let lastMatchIdx = -1;
    for (let i = 0; i < lower.length && qi < qLower.length; i++) {
      if (lower[i] === qLower[qi]) {
        // Consecutive matches score higher
        if (lastMatchIdx === i - 1) score += 5;
        // Matches after separator score higher
        if (i === 0 || lower[i - 1] === '/' || lower[i - 1] === '-' || lower[i - 1] === '.') score += 10;
        score += 1;
        lastMatchIdx = i;
        qi++;
      }
    }
    if (qi < qLower.length) return { match: false, score: 0 };
    return { match: true, score };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return files.slice(0, 100); // Show first 100 when no query
    const results: Array<{ entry: FileIndexEntry; score: number }> = [];
    for (const entry of files) {
      const { match, score } = fuzzyMatch(entry.path, query);
      if (match) results.push({ entry, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 100).map((r) => r.entry);
  }, [files, query, fuzzyMatch]);

  const showRecent = !query.trim() && recentFiles.length > 0;

  // Reset selection when filtered or recent files change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered, recentFiles]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (filePath: string) => {
      onOpenFile(filePath);
      onClose();
    },
    [onOpenFile, onClose],
  );

  const totalItems = (showRecent ? recentFiles.length : 0) + filtered.length;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, totalItems - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const recentCount = showRecent ? recentFiles.length : 0;
        if (selectedIndex < recentCount) {
          const r = recentFiles[selectedIndex];
          if (r) handleSelect(r.filePath);
        } else {
          const sel = filtered[selectedIndex - recentCount];
          if (sel) handleSelect(sel.path);
        }
      }
    },
    [filtered, recentFiles, showRecent, totalItems, selectedIndex, handleSelect, onClose],
  );

  if (!open) return null;

  const getFileIcon = (name: string): string => {
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return '🟦';
    if (name.endsWith('.js') || name.endsWith('.mjs')) return '🟨';
    if (name.endsWith('.json')) return '📋';
    if (name.endsWith('.css')) return '🎨';
    if (name.endsWith('.md')) return '📝';
    if (name.endsWith('.html')) return '🌐';
    if (name.endsWith('.yml') || name.endsWith('.yaml')) return '⚙️';
    return '📄';
  };

  const highlightMatch = (text: string, q: string): React.ReactNode => {
    if (!q) return text;
    const lower = text.toLowerCase();
    const qLower = q.toLowerCase();
    const idx = lower.indexOf(qLower);
    if (idx !== -1) {
      return (
        <>
          {text.slice(0, idx)}
          <span className="canon-quickopen__highlight">{text.slice(idx, idx + q.length)}</span>
          {text.slice(idx + q.length)}
        </>
      );
    }
    return text;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatRelativeTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="canon-quickopen__backdrop" onClick={onClose}>
      <div className="canon-quickopen" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="canon-quickopen__input-row">
          <span className="canon-quickopen__input-icon">🔍</span>
          <input
            ref={inputRef}
            className="canon-quickopen__input"
            type="text"
            placeholder="Type to search files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              className="canon-quickopen__clear"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>

        <div className="canon-quickopen__list" ref={listRef}>
          {loading && <div className="canon-quickopen__status">Loading file index…</div>}
          {error && <div className="canon-quickopen__status canon-quickopen__status--error">{error}</div>}
          {!loading && !error && filtered.length === 0 && !showRecent && (
            <div className="canon-quickopen__status">No matching files</div>
          )}
          {showRecent && (
            <>
              <div className="canon-quickopen__recent-header">🕐 Recent Files</div>
              {recentFiles.map((entry, i) => {
                const parts = entry.filePath.split('/');
                const fileName = parts.pop() || entry.filePath;
                const dir = parts.join('/');
                return (
                  <div
                    key={`recent:${entry.filePath}`}
                    className={`canon-quickopen__item canon-quickopen__recent-item${i === selectedIndex ? ' selected' : ''}`}
                    onClick={() => handleSelect(entry.filePath)}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span className="canon-quickopen__item-icon">{getFileIcon(fileName)}</span>
                    <span className="canon-quickopen__item-name">{fileName}</span>
                    <span className="canon-quickopen__item-dir">{dir}</span>
                    <span className="canon-quickopen__recent-time">{formatRelativeTime(entry.openedAt)}</span>
                  </div>
                );
              })}
              {filtered.length > 0 && <div className="canon-quickopen__recent-header">📁 All Files</div>}
            </>
          )}
          {filtered.map((entry, i) => {
            const idx = showRecent ? i + recentFiles.length : i;
            const parts = entry.path.split('/');
            const fileName = parts.pop() || entry.path;
            const dir = parts.join('/');
            return (
              <div
                key={entry.path}
                className={`canon-quickopen__item${idx === selectedIndex ? ' selected' : ''}`}
                onClick={() => handleSelect(entry.path)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="canon-quickopen__item-icon">{getFileIcon(fileName)}</span>
                <span className="canon-quickopen__item-name">{highlightMatch(fileName, query)}</span>
                <span className="canon-quickopen__item-dir">{highlightMatch(dir, query)}</span>
                <span className="canon-quickopen__item-size">{formatSize(entry.size)}</span>
              </div>
            );
          })}
        </div>

        <div className="canon-quickopen__footer">
          {!loading && !error && (
            <span>
              {showRecent ? `${recentFiles.length} recent · ` : ''}
              {filtered.length} of {files.length} files{query ? ' matching' : ''}
            </span>
          )}
          <span className="canon-quickopen__hint">↑↓ navigate · Enter open · Esc close</span>
        </div>
      </div>
    </div>
  );
}
