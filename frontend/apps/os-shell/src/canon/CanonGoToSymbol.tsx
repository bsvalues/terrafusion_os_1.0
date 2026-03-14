import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchSymbolSearch, type SymbolMatch } from '../api/canonFs';

export interface CanonGoToSymbolProps {
  open: boolean;
  onClose: () => void;
  onGoToSymbol: (filePath: string, line: number) => void;
}

/**
 * Go to Symbol in Workspace overlay (Ctrl+T) — fuzzy symbol search across allowed paths.
 * Searches functions, classes, interfaces, types, constants, and enums.
 */
export default function CanonGoToSymbol({ open, onClose, onGoToSymbol }: CanonGoToSymbolProps) {
  const [query, setQuery] = useState('');
  const [symbols, setSymbols] = useState<SymbolMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on open
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSymbols([]);
    setSelectedIndex(0);
    setError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      setSymbols([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchSymbolSearch(q, 80).then((res) => {
        setLoading(false);
        if (res.error) {
          setError(res.error);
          return;
        }
        setError(null);
        setSymbols(res.symbols);
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query]);

  // Reset selection on results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [symbols]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (filePath: string, line: number) => {
      onGoToSymbol(filePath, line);
      onClose();
    },
    [onGoToSymbol, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, symbols.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const sel = symbols[selectedIndex];
        if (sel) handleSelect(sel.filePath, sel.line);
      }
    },
    [symbols, selectedIndex, handleSelect, onClose],
  );

  const getSymbolIcon = (kind: string): string => {
    switch (kind) {
      case 'function': return '𝑓';
      case 'class': return '𝐂';
      case 'interface': return '𝐈';
      case 'type': return '𝐓';
      case 'constant': return '𝐊';
      case 'enum': return '𝐄';
      case 'variable': return '𝑣';
      default: return '•';
    }
  };

  const getKindColor = (kind: string): string => {
    switch (kind) {
      case 'function': return 'canon-symbol--function';
      case 'class': return 'canon-symbol--class';
      case 'interface': return 'canon-symbol--interface';
      case 'type': return 'canon-symbol--type';
      case 'constant': return 'canon-symbol--constant';
      case 'enum': return 'canon-symbol--enum';
      default: return '';
    }
  };

  const highlightMatch = useMemo(() => {
    const q = query.toLowerCase();
    return (text: string): React.ReactNode => {
      if (!q) return text;
      const lower = text.toLowerCase();
      const idx = lower.indexOf(q);
      if (idx !== -1) {
        return (
          <>
            {text.slice(0, idx)}
            <span className="canon-symbol__highlight">{text.slice(idx, idx + q.length)}</span>
            {text.slice(idx + q.length)}
          </>
        );
      }
      return text;
    };
  }, [query]);

  if (!open) return null;

  return (
    <div className="canon-symbol__backdrop" onClick={onClose}>
      <div className="canon-symbol" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="canon-symbol__input-row">
          <span className="canon-symbol__input-icon">#</span>
          <input
            ref={inputRef}
            className="canon-symbol__input"
            type="text"
            placeholder="Type to search symbols across workspace…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              className="canon-symbol__clear"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>

        <div className="canon-symbol__list" ref={listRef}>
          {!query.trim() && (
            <div className="canon-symbol__status">
              Type to search for functions, classes, interfaces, types…
            </div>
          )}
          {loading && query.trim() && (
            <div className="canon-symbol__status">Searching symbols…</div>
          )}
          {error && <div className="canon-symbol__status canon-symbol__status--error">{error}</div>}
          {!loading && !error && query.trim() && symbols.length === 0 && (
            <div className="canon-symbol__status">No matching symbols</div>
          )}
          {symbols.map((sym, i) => {
            const fileName = sym.filePath.split('/').pop() || sym.filePath;
            return (
              <div
                key={`${sym.filePath}:${sym.name}:${sym.line}`}
                className={`canon-symbol__item${i === selectedIndex ? ' selected' : ''}`}
                onClick={() => handleSelect(sym.filePath, sym.line)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className={`canon-symbol__kind ${getKindColor(sym.kind)}`}>
                  {getSymbolIcon(sym.kind)}
                </span>
                <span className="canon-symbol__name">{highlightMatch(sym.name)}</span>
                <span className="canon-symbol__location">
                  {fileName}:{sym.line}
                </span>
                <span className="canon-symbol__kind-label">{sym.kind}</span>
              </div>
            );
          })}
        </div>

        <div className="canon-symbol__footer">
          {symbols.length > 0 && <span>{symbols.length} symbols</span>}
          <span className="canon-symbol__hint">↑↓ navigate · Enter open · Esc close</span>
        </div>
      </div>
    </div>
  );
}
