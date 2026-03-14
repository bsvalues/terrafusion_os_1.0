/**
 * CanonOutlinePanel — symbol outline for active file in TerraCanon IDE.
 *
 * Fetches symbol outline (functions, classes, interfaces, types, etc.)
 * from the runtime and displays a navigable tree. Click to jump to line.
 *
 * @see Phase P: Symbol Outline Panel
 */

import React, { useCallback, useEffect, useState } from 'react';
import { fetchFileOutline, type OutlineSymbol } from '../api/canonFs';

/** Icon map for symbol kinds. */
const KIND_ICONS: Record<string, string> = {
  function: 'ƒ',
  class: '◆',
  interface: '◇',
  type: '◈',
  enum: '▣',
  variable: '𝑥',
  property: '•',
  selector: '#',
  h1: 'H1',
  h2: 'H2',
  h3: 'H3',
  h4: 'H4',
  h5: 'H5',
  h6: 'H6',
};

const KIND_CSS: Record<string, string> = {
  function: 'canon-outline__kind--function',
  class: 'canon-outline__kind--class',
  interface: 'canon-outline__kind--interface',
  type: 'canon-outline__kind--type',
  enum: 'canon-outline__kind--enum',
  variable: 'canon-outline__kind--variable',
  property: 'canon-outline__kind--property',
  selector: 'canon-outline__kind--selector',
};

interface Props {
  filePath: string | null;
  onGoToLine?: (line: number) => void;
}

export function CanonOutlinePanel({ filePath, onGoToLine }: Props): React.ReactElement {
  const [symbols, setSymbols] = useState<OutlineSymbol[]>([]);
  const [language, setLanguage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const loadOutline = useCallback(async (fp: string) => {
    setLoading(true);
    setError(null);
    const result = await fetchFileOutline(fp);
    if (result.error) {
      setError(result.error);
      setSymbols([]);
      setLanguage('unknown');
    } else {
      setSymbols(result.symbols);
      setLanguage(result.language);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (filePath) {
      loadOutline(filePath);
    } else {
      setSymbols([]);
      setLanguage('');
      setError(null);
    }
    setFilter('');
  }, [filePath, loadOutline]);

  const filtered = filter
    ? symbols.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
    : symbols;

  const fileName = filePath ? filePath.split('/').pop() : null;

  return (
    <div className='canon-outline' data-testid='canon-outline-panel'>
      <div className='canon-outline__header'>
        <span className='canon-outline__title'>Outline</span>
        {language && (
          <span className='canon-outline__lang'>{language}</span>
        )}
      </div>

      {!filePath && (
        <div className='canon-outline__empty'>
          <span className='text-xs text-gray-500 italic'>No file selected</span>
        </div>
      )}

      {filePath && loading && (
        <div className='canon-outline__loading'>
          <span className='text-xs text-gray-400'>Loading outline…</span>
        </div>
      )}

      {filePath && error && (
        <div className='canon-outline__error'>
          <span className='text-xs text-red-400'>{error}</span>
        </div>
      )}

      {filePath && !loading && !error && symbols.length === 0 && (
        <div className='canon-outline__empty'>
          <span className='text-xs text-gray-500 italic'>No symbols found</span>
        </div>
      )}

      {filePath && !loading && symbols.length > 0 && (
        <>
          <div className='canon-outline__filter'>
            <input
              type='text'
              className='canon-outline__filter-input'
              placeholder={`Filter ${symbols.length} symbols…`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              data-testid='canon-outline-filter'
            />
          </div>

          <div className='canon-outline__list'>
            {filtered.map((sym, idx) => (
              <button
                key={`${sym.name}-${sym.line}-${idx}`}
                className='canon-outline__item'
                title={`${sym.kind}: ${sym.name} (line ${sym.line})`}
                onClick={() => onGoToLine?.(sym.line)}
                data-testid={`canon-outline-symbol-${idx}`}
              >
                <span className={`canon-outline__icon ${KIND_CSS[sym.kind] || ''}`}>
                  {KIND_ICONS[sym.kind] || '?'}
                </span>
                <span className='canon-outline__name'>{sym.name}</span>
                <span className='canon-outline__line'>:{sym.line}</span>
              </button>
            ))}
            {filter && filtered.length === 0 && (
              <div className='canon-outline__empty'>
                <span className='text-xs text-gray-500 italic'>No matches for "{filter}"</span>
              </div>
            )}
          </div>

          <div className='canon-outline__footer'>
            <span className='text-xs text-gray-600'>
              {filtered.length}{filter ? `/${symbols.length}` : ''} symbols in {fileName}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
