/**
 * PropertySearch — Full-page parcel search/browse experience.
 *
 * This is the native replacement for the TerraPrime iframe bridge.
 * Per the product identity: "TerraPrime → Property viewer (migrating to Property Workbench)"
 *
 * Flow: Search/browse → click result → navigate to /property/:parcelId (Workbench)
 *
 * @module pages/PropertySearch
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Loader2, Building2, ArrowRight, Clock } from 'lucide-react';
import { getPacsProperties, type PacsPropertySummary } from '../services/pacsService';
import { useRecentParcels } from '../context/parcelContext';

const PAGE_SIZE = 20;

const PropertySearch: React.FC = () => {
  const navigate = useNavigate();
  const recentParcels = useRecentParcels();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PacsPropertySummary[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const doSearch = useCallback(async (text: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const page = await getPacsProperties(1, PAGE_SIZE, text.trim() || undefined);
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setResults(page.items);
      setTotalCount(page.totalCount);
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setResults([]);
      setTotalCount(null);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setLoading(false);
      setInitialLoaded(true);
    }
  }, []);

  // Load initial results on mount
  useEffect(() => {
    doSearch('');

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [doSearch]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const openParcel = (geoId: string) => {
    navigate(`/property/${encodeURIComponent(geoId)}`);
  };

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="tf-tab-panel" data-testid="property-search-root" style={{ minHeight: '100vh' }}>
      {/* Hero header */}
      <div style={{ padding: '3rem 2rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Building2 size={32} style={{ color: 'hsl(var(--tf-accent-primary))' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--tf-foreground))' }}>
            Property Search
          </h1>
        </div>
        <p style={{ color: 'hsl(var(--tf-muted-foreground))', fontSize: '0.9rem', maxWidth: '32rem', margin: '0 auto' }}>
          Find a parcel by GeoID or address to open the Property Workbench.
          {totalCount !== null && (
            <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8rem' }}>
              {totalCount.toLocaleString()} parcels in Benton County PACS
            </span>
          )}
        </p>
      </div>

      {/* Search bar */}
      <div style={{ maxWidth: '36rem', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--tf-muted-foreground))',
            }}
          />
          <input
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="Search by GeoID or address…"
            autoFocus
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              border: '1px solid hsl(var(--tf-border) / 0.5)',
              borderRadius: '0.75rem',
              background: 'hsl(var(--tf-surface-dark-hs) 10% / 0.3)',
              color: 'hsl(var(--tf-foreground))',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          {loading && (
            <Loader2
              size={18}
              className="animate-spin"
              data-testid="search-loading"
              role="status"
              aria-label="Searching…"
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--tf-muted-foreground))',
              }}
            />
          )}
        </div>
      </div>

      {/* Recent parcels */}
      {recentParcels.length > 0 && !query && (
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1.5rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'hsl(var(--tf-muted-foreground))', fontSize: '0.8rem', fontWeight: 600 }}>
            <Clock size={14} />
            <span>Recently Viewed</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {recentParcels.slice(0, 6).map((parcelId) => (
              <button
                key={parcelId}
                onClick={() => openParcel(parcelId)}
                className="tf-stat-card"
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  transition: 'opacity 0.15s',
                }}
              >
                <MapPin size={12} />
                <span style={{ fontWeight: 600 }}>{parcelId}</span>
                <ArrowRight size={12} style={{ opacity: 0.5 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results grid */}
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
        {initialLoaded && results.length > 0 && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {results.map((p) => (
              <button
                key={p.geoId}
                data-testid={`search-result-${p.geoId}`}
                onClick={() => openParcel(p.geoId)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid hsl(var(--tf-border) / 0.3)',
                  background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.2)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--tf-accent-primary) / 0.5)';
                  e.currentTarget.style.background = 'hsl(var(--tf-surface-dark-hs) 12% / 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--tf-border) / 0.3)';
                  e.currentTarget.style.background = 'hsl(var(--tf-surface-dark-hs) 8% / 0.2)';
                }}
              >
                <div style={{ display: 'grid', gap: '0.15rem' }}>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--tf-foreground))', fontSize: '0.85rem' }}>
                    {p.geoId}
                  </span>
                  <span style={{ color: 'hsl(var(--tf-muted-foreground))', fontSize: '0.75rem' }}>
                    {p.address || 'No address on file'}
                  </span>
                  <span style={{ color: 'hsl(var(--tf-muted-foreground))', fontSize: '0.7rem' }}>
                    Assessed: {fmt(p.assessedValue)} · Market: {fmt(p.marketValue)}
                    {p.propertyType && ` · ${p.propertyType}`}
                  </span>
                </div>
                <ArrowRight size={16} style={{ color: 'hsl(var(--tf-muted-foreground))', opacity: 0.5 }} />
              </button>
            ))}
          </div>
        )}

        {initialLoaded && results.length === 0 && !loading && !error && (
          <div data-testid="search-empty-state" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--tf-muted-foreground))' }}>
            <MapPin size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
            <p>No parcels found{query ? ` matching "${query}"` : ''}</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Try a different GeoID or address
            </p>
          </div>
        )}

        {error && (
          <div
            data-testid="search-error-state"
            role="alert"
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'hsl(var(--tf-muted-foreground))',
              border: '1px solid hsl(var(--tf-border) / 0.4)',
              borderRadius: '0.75rem',
              marginTop: '1rem',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Search failed</p>
            <p style={{ fontSize: '0.8rem' }}>{error.message || 'An error occurred. Please try again.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySearch;
