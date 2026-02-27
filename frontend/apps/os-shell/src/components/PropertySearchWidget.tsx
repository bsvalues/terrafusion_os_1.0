/**
 * PropertySearchWidget — Quick parcel search for the OS sidebar.
 *
 * Calls /ops/pacs/properties with search text as geoId prefix,
 * or lists first N results when search is empty.
 * Clicking a result sets the parcel context.
 *
 * @module components/PropertySearchWidget
 */

import React, { useCallback, useRef, useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { getPacsProperties, type PacsPropertySummary } from '../services/pacsService';

export interface PropertySearchWidgetProps {
  /** Called when user selects a result. */
  onSelect?: (geoId: string) => void;
}

export const PropertySearchWidget: React.FC<PropertySearchWidgetProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PacsPropertySummary[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (text: string) => {
    setLoading(true);
    setSearched(true);
    try {
      // The backend doesn't have full-text search yet, so we fetch the first page
      // and filter client-side. Once a search endpoint exists, swap here.
      const page = await getPacsProperties(1, 50);
      const q = text.toLowerCase();
      const filtered = q
        ? page.items.filter(
            (p) =>
              p.geoId.toLowerCase().includes(q) ||
              p.address.toLowerCase().includes(q),
          )
        : page.items;
      setResults(filtered.slice(0, 8));
      setTotalCount(page.totalCount);
    } catch {
      setResults([]);
      setTotalCount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div style={{ fontSize: '0.75rem', display: 'grid', gap: '0.35rem' }}>
      {/* Header */}
      <span
        style={{
          fontWeight: 600,
          color: 'hsl(var(--tf-foreground))',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
      >
        <MapPin size={12} /> Property Lookup
      </span>

      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <Search
          size={12}
          style={{
            position: 'absolute',
            left: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'hsl(var(--tf-muted-foreground))',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="GeoID or address…"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.35rem 0.5rem 0.35rem 1.5rem',
            border: '1px solid hsl(var(--tf-border) / 0.4)',
            borderRadius: '0.5rem',
            background: 'hsl(var(--tf-surface-dark-hs) 10% / 0.3)',
            color: 'hsl(var(--tf-foreground))',
            fontSize: '0.7rem',
            outline: 'none',
          }}
        />
        {loading && (
          <Loader2
            size={12}
            className="animate-spin"
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--tf-muted-foreground))',
            }}
          />
        )}
      </div>

      {/* Total count hint */}
      {totalCount !== null && (
        <span style={{ color: 'hsl(var(--tf-muted-foreground))', fontSize: '0.65rem' }}>
          {totalCount.toLocaleString()} parcels in PACS
        </span>
      )}

      {/* Results */}
      {searched && results.length > 0 && (
        <div
          style={{
            display: 'grid',
            gap: '0.2rem',
            maxHeight: '10rem',
            overflowY: 'auto',
          }}
        >
          {results.map((p) => (
            <button
              key={p.geoId}
              onClick={() => onSelect?.(p.geoId)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '0.3rem 0.4rem',
                borderRadius: '0.35rem',
                border: '1px solid hsl(var(--tf-border) / 0.2)',
                background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.25)',
                display: 'grid',
                gap: '0.1rem',
                fontSize: '0.68rem',
              }}
            >
              <span style={{ fontWeight: 600, color: 'hsl(var(--tf-foreground))' }}>
                {p.geoId}
              </span>
              <span style={{ color: 'hsl(var(--tf-muted-foreground))' }}>
                {p.address || 'No address'}
              </span>
              <span style={{ color: 'hsl(var(--tf-muted-foreground))' }}>
                Assessed: {fmt(p.assessedValue)} · Market: {fmt(p.marketValue)}
              </span>
            </button>
          ))}
        </div>
      )}
      {searched && results.length === 0 && !loading && (
        <span style={{ color: 'hsl(var(--tf-muted-foreground))', fontSize: '0.65rem' }}>
          No results{query ? ` for "${query}"` : ''}
        </span>
      )}
    </div>
  );
};
