import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { fetchBookmarks, type Bookmark } from '../api/canonFs';

interface CanonBookmarksPanelProps {
  /** Currently active file path (for "Bookmark this line" context) */
  activeFilePath: string | null;
  /** Current cursor line in the active file */
  activeLine: number;
  /** Navigate to a file + line when a bookmark is clicked */
  onGoToFile?: (filePath: string, line: number) => void;
}

export const CanonBookmarksPanel: React.FC<CanonBookmarksPanelProps> = ({
  activeFilePath,
  activeLine,
  onGoToFile,
}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Load bookmarks on mount
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchBookmarks('list').then((res) => {
      if (!mounted) return;
      if (res.error) setError(res.error);
      else setBookmarks(res.bookmarks);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchBookmarks('list');
    if (res.error) setError(res.error);
    else setBookmarks(res.bookmarks);
    setLoading(false);
  }, []);

  const addBookmark = useCallback(async () => {
    if (!activeFilePath || activeLine < 1) return;
    const res = await fetchBookmarks('add', {
      filePath: activeFilePath,
      line: activeLine,
    });
    if (res.error) setError(res.error);
    else {
      setBookmarks(res.bookmarks);
      setExpandedFiles((prev) => new Set([...prev, activeFilePath]));
    }
  }, [activeFilePath, activeLine]);

  const removeBookmark = useCallback(async (filePath: string, line: number) => {
    const res = await fetchBookmarks('remove', { filePath, line });
    if (res.error) setError(res.error);
    else setBookmarks(res.bookmarks);
  }, []);

  const clearAll = useCallback(async () => {
    const res = await fetchBookmarks('clear');
    if (res.error) setError(res.error);
    else setBookmarks(res.bookmarks);
    setExpandedFiles(new Set());
  }, []);

  // Group by file
  const grouped = useMemo(() => {
    const lowerFilter = filter.toLowerCase();
    const filtered = filter
      ? bookmarks.filter(
          (b) =>
            b.filePath.toLowerCase().includes(lowerFilter) ||
            b.label.toLowerCase().includes(lowerFilter)
        )
      : bookmarks;

    const map = new Map<string, Bookmark[]>();
    for (const b of filtered) {
      const arr = map.get(b.filePath) || [];
      arr.push(b);
      map.set(b.filePath, arr);
    }
    return map;
  }, [bookmarks, filter]);

  // Check if current position is bookmarked
  const isCurrentBookmarked = useMemo(() => {
    if (!activeFilePath || activeLine < 1) return false;
    return bookmarks.some((b) => b.filePath === activeFilePath && b.line === activeLine);
  }, [bookmarks, activeFilePath, activeLine]);

  const toggleFile = useCallback((file: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  }, []);

  const shortName = (fp: string) => {
    const parts = fp.split('/');
    return parts.length > 2 ? `…/${parts.slice(-2).join('/')}` : fp;
  };

  return (
    <div className='canon-bookmarks'>
      {/* Header */}
      <div className='canon-bookmarks__header'>
        <span className='canon-bookmarks__title'>Bookmarks</span>
        <div className='canon-bookmarks__actions'>
          <button
            className='canon-bookmarks__action-btn'
            onClick={addBookmark}
            disabled={!activeFilePath || activeLine < 1 || isCurrentBookmarked}
            title={isCurrentBookmarked ? 'Already bookmarked' : 'Bookmark current line'}
          >
            {isCurrentBookmarked ? '★' : '☆'}
          </button>
          <button
            className='canon-bookmarks__action-btn'
            onClick={refresh}
            disabled={loading}
            title='Refresh bookmarks'
          >
            ↻
          </button>
          {bookmarks.length > 0 && (
            <button
              className='canon-bookmarks__action-btn canon-bookmarks__action-btn--danger'
              onClick={clearAll}
              title='Clear all bookmarks'
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      {bookmarks.length > 3 && (
        <input
          className='canon-bookmarks__filter'
          type='text'
          placeholder='Filter bookmarks…'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}

      {/* Content */}
      <div className='canon-bookmarks__list'>
        {loading && <div className='canon-bookmarks__loading'>Loading…</div>}

        {error && <div className='canon-bookmarks__error'>{error}</div>}

        {!loading && !error && bookmarks.length === 0 && (
          <div className='canon-bookmarks__empty'>
            No bookmarks yet. Open a file and click <strong>☆</strong> to add one.
          </div>
        )}

        {[...grouped.entries()].map(([file, bmarks]) => (
          <div key={file} className='canon-bookmarks__file-group'>
            <button
              className='canon-bookmarks__file-header'
              onClick={() => toggleFile(file)}
            >
              <span className='canon-bookmarks__chevron'>
                {expandedFiles.has(file) ? '▾' : '▸'}
              </span>
              <span className='canon-bookmarks__file-name' title={file}>
                {shortName(file)}
              </span>
              <span className='canon-bookmarks__file-count'>{bmarks.length}</span>
            </button>
            {expandedFiles.has(file) && (
              <div className='canon-bookmarks__item-list'>
                {bmarks.map((b) => (
                  <div
                    key={`${b.filePath}:${b.line}`}
                    className='canon-bookmarks__item'
                  >
                    <button
                      className='canon-bookmarks__item-link'
                      onClick={() => onGoToFile?.(b.filePath, b.line)}
                      title={`${b.filePath}:${b.line}`}
                    >
                      <span className='canon-bookmarks__item-icon'>★</span>
                      <span className='canon-bookmarks__item-label'>{b.label}</span>
                      <span className='canon-bookmarks__item-line'>:{b.line}</span>
                    </button>
                    <button
                      className='canon-bookmarks__item-remove'
                      onClick={() => removeBookmark(b.filePath, b.line)}
                      title='Remove bookmark'
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {bookmarks.length > 0 && (
        <div className='canon-bookmarks__footer'>
          {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} ·{' '}
          {grouped.size} file{grouped.size !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default CanonBookmarksPanel;
