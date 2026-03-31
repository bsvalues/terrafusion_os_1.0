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
    <div
      data-testid="property-search-root"
      style={{
        padding: '1.5rem 2rem',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        minHeight: '100%',
        gap: '1.5rem',
      }}
    >
      {/* Hero header — FIND stage identity */}
      <div style={{ paddingBottom: '0.5rem' }}>
        <span style={{
          display: 'block',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'hsl(var(--tf-muted-foreground))',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.4rem',
        }}>
          FIND · Property Search
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Building2 size={28} style={{ color: 'hsl(var(--tf-accent-primary))' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--tf-foreground))' }}>
            Property Search
          </h1>
        </div>
        <p style={{ color: 'hsl(var(--tf-muted-foreground))', fontSize: '0.9rem' }}>
          Find a parcel by GeoID or address to open the Property Workbench.
        </p>
      </div>

      {/* 2-panel bento grid: context left, search+results right */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: context panel */}
        <div style={{
          background: 'hsl(var(--tf-surface-2))',
          border: '1px solid hsl(var(--tf-border) / 0.4)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
        }}>
          {/* Parcel count stat */}
          {totalCount !== null && (
            <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(var(--tf-border) / 0.3)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--tf-foreground))' }}>
                {totalCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--tf-muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                Parcels · Benton County
              </div>
            </div>
          )}

          {/* Recently Viewed — stacked column rows */}
          {recentParcels.length > 0 && !query && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', color: 'hsl(var(--tf-muted-foreground))', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Clock size={12} />
                <span>Recently Viewed</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {recentParcels.slice(0, 6).map((parcelId) => (
                  <button
                    key={parcelId}
                    onClick={() => openParcel(parcelId)}
                    style={{
                      cursor: 'pointer',
                      border: '1px solid hsl(var(--tf-border) / 0.3)',
                      background: 'transparent',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                      color: 'hsl(var(--tf-foreground))',
                    }}
                  >
                    <MapPin size={11} style={{ color: 'hsl(var(--tf-muted-foreground))', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parcelId}</span>
                    <ArrowRight size={11} style={{ marginLeft: 'auto', opacity: 0.4, flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: search + results */}
        <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>

          {/* Search bar */}
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
                background: 'hsl(var(--tf-surface-2))',
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

          {/* Results */}
          <div>
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
                      background: 'hsl(var(--tf-surface-2))',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--tf-border) / 0.6)';
                      e.currentTarget.style.background = 'hsl(var(--tf-surface))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--tf-border) / 0.3)';
                      e.currentTarget.style.background = 'hsl(var(--tf-surface-2))';
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
      </div>
    </div>
  );
};

export default PropertySearch;
