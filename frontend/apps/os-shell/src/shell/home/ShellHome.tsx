/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - SHELL HOME
 * Benton County Assessor's Property Search & Operations Center
 *
 * The real landing experience: live PACS search against 112K+ parcels,
 * database statistics, clickable property cards, and suite launchers.
 *
 * Design System: Uses TerraFusion tokens (--tf-*), glass morphism,
 * LiquidPanel materials, TactileButton, and .tf-card/.tf-input classes.
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CONSTITUTIONAL_SUITES,
    getStandaloneSuites,
    getSuiteIntent,
    getWorkbenchHrefWithContext,
    INTENT_LABELS,
    isWorkbenchSuite,
    type SuiteId,
} from '../../config/suiteRegistry';
import { useParcelContext, useRecentParcels } from '../../context/parcelContext';
import { usePacsSearch, type PacsSearchResult } from '../../hooks/usePacsSearch';
import { usePacsStats } from '../../hooks/usePacsStats';
import { executeOsAction, type OsAction, type OsActionContext } from '../../services/osActions';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { LiquidPanel, TactileButton } from '../../ui/materials';

// ============================================================================
// Helpers
// ============================================================================

const TYPE_LABELS: Record<string, string> = {
  R: 'Residential',
  C: 'Commercial',
  I: 'Industrial',
  A: 'Agricultural',
  E: 'Exempt',
};

function fmtCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtNumber(n: number): string {
  return n.toLocaleString('en-US');
}

// ============================================================================
// Suite Configuration
// ============================================================================

const ICON_MAP: Record<string, string> = {
  Hammer: '🔨',
  Globe: '🗺️',
  LayoutDashboard: '📊',
  FileStack: '📁',
  Bot: '🤖',
  Compass: '🎮',
  Activity: '🔍',
};

/** Suite gradient CSS — inline style using TF token HSL channels */
const SUITE_GRADIENTS: Record<string, string> = {
  forge: 'linear-gradient(135deg, hsl(25 100% 50%), hsl(0 80% 50%))',
  atlas: 'linear-gradient(135deg, hsl(var(--tf-network-blue-hs) 50%), hsl(var(--tf-transcend-cyan-hs) 50%))',
  dais: 'linear-gradient(135deg, hsl(var(--tf-info-hs) 50%), hsl(330 70% 50%))',
  dossier: 'linear-gradient(135deg, hsl(var(--tf-success-hs) 50%), hsl(var(--tf-transcend-cyan-hs) 40%))',
  gpt: 'linear-gradient(135deg, hsl(var(--tf-info-hs) 45%), hsl(var(--tf-info-hs) 60%))',
};

interface Suite {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  gradient: string;
  intent: 'workbench' | 'standalone';
}

function buildSuites(parcelId: string | null): Suite[] {
  return CONSTITUTIONAL_SUITES.map((suite) => {
    const route = isWorkbenchSuite(suite)
      ? getWorkbenchHrefWithContext(suite, parcelId).href
      : suite.route;
    return {
      id: suite.id,
      name: suite.displayName,
      description: suite.description,
      icon: ICON_MAP[suite.iconName] || '📦',
      route,
      gradient: SUITE_GRADIENTS[suite.id] || 'var(--gradient-primary)',
      intent: getSuiteIntent(suite.id as SuiteId),
    };
  });
}

const OS_ENTRYPOINTS = getStandaloneSuites().map((f) => ({
  id: f.id,
  name: f.homeMeta.title || f.displayName,
  icon: ICON_MAP[f.iconName] || '📦',
  route: f.route,
  description: f.description,
}));

// ============================================================================
// Sub-Components (TerraFusion Design System)
// ============================================================================

/** Live stats banner — LiquidPanel cards with TF token colors */
const StatsBanner: React.FC<{
  totalProperties: number;
  totalAssessed: number;
  totalMarket: number;
}> = ({ totalProperties, totalAssessed, totalMarket }) => (
  <div className='grid grid-cols-1 sm:grid-cols-3' style={{ gap: 'var(--tf-space-md)' }}>
    <LiquidPanel variant='shell' radius='lg'>
      <div style={{ padding: 'var(--tf-space-md)', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--tf-quantum-cyan)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {fmtNumber(totalProperties)}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--tf-muted))', marginTop: 'var(--tf-space-xs)' }}>
          Parcels in PACS
        </div>
      </div>
    </LiquidPanel>
    <LiquidPanel variant='shell' radius='lg'>
      <div style={{ padding: 'var(--tf-space-md)', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--tf-accent-success)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {fmtCurrency(totalAssessed)}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--tf-muted))', marginTop: 'var(--tf-space-xs)' }}>
          Total Assessed
        </div>
      </div>
    </LiquidPanel>
    <LiquidPanel variant='shell' radius='lg'>
      <div style={{ padding: 'var(--tf-space-md)', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--tf-warning-amber)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {fmtCurrency(totalMarket)}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--tf-muted))', marginTop: 'var(--tf-space-xs)' }}>
          Total Market
        </div>
      </div>
    </LiquidPanel>
  </div>
);

/** Search result card — LiquidPanel interactive with TF token styling */
const SearchResultCard: React.FC<{
  result: PacsSearchResult;
  onClick: () => void;
}> = ({ result, onClick }) => (
  <LiquidPanel
    variant='interactive'
    radius='lg'
    className='group cursor-pointer'
    onClick={onClick}
    role='button'
    tabIndex={0}
    aria-label={`Property ${result.geoId.trim()} — ${result.address}`}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <div style={{ padding: 'var(--tf-space-md)' }}>
      <div className='flex items-start justify-between' style={{ gap: 'var(--tf-space-sm)' }}>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center' style={{ gap: 'var(--tf-space-sm)' }}>
            <span
              className='truncate'
              style={{
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--tf-quantum-cyan)',
              }}
            >
              {result.geoId.trim()}
            </span>
            <span
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--tf-text) / 0.08)',
                color: 'hsl(var(--tf-muted))',
              }}
            >
              {TYPE_LABELS[result.propertyType.trim()] || result.propertyType.trim()}
            </span>
          </div>
          <div
            className='truncate'
            style={{
              color: 'hsl(var(--tf-text))',
              fontWeight: 500,
              marginTop: 'var(--tf-space-xs)',
            }}
          >
            {result.ownerName.trim()}
          </div>
          <div
            className='truncate'
            style={{
              color: 'hsl(var(--tf-muted))',
              fontSize: 'var(--text-sm)',
            }}
          >
            {result.address}
          </div>
        </div>
        <div className='shrink-0 text-right'>
          <div style={{ color: 'var(--tf-accent-success)', fontWeight: 600 }}>
            {fmtCurrency(result.marketValue)}
          </div>
          <div style={{ color: 'hsl(var(--tf-muted))', fontSize: 'var(--text-xs)' }}>market</div>
        </div>
      </div>
      <div
        className='flex items-center justify-between'
        style={{
          marginTop: 'var(--tf-space-sm)',
          paddingTop: 'var(--tf-space-sm)',
          borderTop: '1px solid hsl(var(--tf-border))',
        }}
      >
        <span style={{ color: 'hsl(var(--tf-muted))', fontSize: 'var(--text-xs)' }}>
          Assessed: {fmtCurrency(result.assessedValue)}
        </span>
        <span
          style={{
            color: 'hsl(var(--tf-accent) / 0.6)',
            fontSize: 'var(--text-xs)',
            transition: 'color var(--duration-fast)',
          }}
          className='group-hover:!text-[var(--tf-quantum-cyan)]'
        >
          Open Workbench →
        </span>
      </div>
    </div>
  </LiquidPanel>
);

/** Suite launcher tile — LiquidPanel + inline gradient overlay */
const SuiteCard: React.FC<{ suite: Suite; onClick: () => void }> = ({ suite, onClick }) => {
  const intentLabel = INTENT_LABELS[suite.intent];
  return (
    <LiquidPanel
      variant='interactive'
      radius='lg'
      className='group relative cursor-pointer'
      onClick={onClick}
      role='button'
      tabIndex={0}
      data-intent={suite.intent}
      aria-label={`${suite.name} — ${intentLabel.description}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ transition: 'transform var(--duration-fast) var(--ease-golden)' }}
    >
      <div
        className='absolute inset-0'
        style={{
          background: suite.gradient,
          opacity: 0.5,
          borderRadius: 'var(--radius-lg)',
        }}
      />
      <div className='relative z-10' style={{ padding: 'var(--tf-space-lg)' }}>
        <span className='block' style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--tf-space-sm)' }}>
          {suite.icon}
        </span>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'hsl(var(--tf-text))',
            marginBottom: '2px',
          }}
        >
          {suite.name}
        </h3>
        <p style={{ color: 'hsl(var(--tf-text) / 0.7)', fontSize: 'var(--text-xs)' }}>
          {suite.description}
        </p>
      </div>
    </LiquidPanel>
  );
};

// ============================================================================
// Shell Home Component
// ============================================================================

export interface ShellHomeProps {
  className?: string;
}

export const ShellHome: React.FC<ShellHomeProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const openCommandPalette = useCommandPaletteStore((state) => state.open);
  const parcelContext = useParcelContext();
  const storedRecentParcels = useRecentParcels();

  // Live PACS data
  const { stats } = usePacsStats();
  const pacsSearch = usePacsSearch();

  // Local search input state
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search: fires 300ms after typing stops
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (searchInput.trim().length >= 2) {
      debounceRef.current = setTimeout(() => pacsSearch.search(searchInput), 300);
    } else {
      pacsSearch.clear();
    }
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Suites
  const SUITES = useMemo(
    () => buildSuites(parcelContext?.parcelId ?? null),
    [parcelContext?.parcelId]
  );

  const actionContext: OsActionContext = useMemo(
    () => ({ navigate, suiteId: 'shell', surface: 'shellhome' }),
    [navigate]
  );

  const handleSuiteLaunch = useCallback(
    (suite: Suite) => {
      const action: OsAction = {
        id: suite.id,
        label: suite.name,
        intent: suite.intent,
        href: suite.route,
      };
      executeOsAction(action, { ...actionContext, suiteId: suite.id });
    },
    [actionContext]
  );

  const handleResultClick = useCallback(
    (result: PacsSearchResult) => {
      navigate(`/property/${result.geoId.trim()}`);
    },
    [navigate]
  );

  const handleRecentClick = useCallback(
    (parcelId: string) => {
      navigate(`/property/${parcelId}`);
    },
    [navigate]
  );

  const handleEntrypoint = useCallback(
    (item: (typeof OS_ENTRYPOINTS)[0]) => {
      navigate(item.route);
    },
    [navigate]
  );

  const showResults = pacsSearch.results.length > 0 || pacsSearch.loading;

  return (
    <div
      className={className}
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--tf-space-xl) var(--tf-space-2xl)',
        fontFamily: 'var(--tf-font-primary)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '72rem',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--tf-space-xl)',
        }}
      >
        {/* ─── Header ─── */}
        <header className='flex items-center justify-between'>
          <div>
            <h1
              className='clarity-gradient-text'
              style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
              }}
            >
              TerraFusion OS
            </h1>
            <p style={{ color: 'hsl(var(--tf-muted))', fontSize: 'var(--text-sm)', marginTop: 'var(--tf-space-xs)' }}>
              Benton County Assessor&apos;s Office
            </p>
          </div>
          <div className='flex items-center' style={{ gap: 'var(--tf-space-sm)' }}>
            {stats && (
              <span
                className='transcend-glow'
                style={{
                  padding: '6px 12px',
                  background: 'hsl(var(--tf-success) / 0.15)',
                  color: 'var(--tf-accent-success)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid hsl(var(--tf-success) / 0.3)',
                  boxShadow: '0 0 12px hsl(var(--tf-success) / 0.2)',
                }}
              >
                PACS Online &bull; {fmtNumber(stats.totalProperties)} parcels
              </span>
            )}
            {OS_ENTRYPOINTS.slice(0, 3).map((ep) => (
              <TactileButton
                key={ep.id}
                variant='ghost'
                size='sm'
                onClick={() => handleEntrypoint(ep)}
                title={ep.description}
              >
                <span style={{ fontSize: 'var(--text-lg)' }}>{ep.icon}</span>
              </TactileButton>
            ))}
          </div>
        </header>

        {/* ─── Stats Banner ─── */}
        {stats && (
          <StatsBanner
            totalProperties={stats.totalProperties}
            totalAssessed={stats.totalAssessedValue}
            totalMarket={stats.totalMarketValue}
          />
        )}

        {/* ─── Search ─── */}
        <section>
          <div className='relative' style={{ maxWidth: '48rem', margin: '0 auto' }}>
            <input
              type='text'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={searchInput.trim().length < 2 ? openCommandPalette : undefined}
              placeholder='Search by address, owner name, or parcel ID...'
              className='tf-input'
              style={{
                width: '100%',
                padding: 'var(--tf-space-md) var(--tf-space-lg)',
                fontSize: 'var(--text-lg)',
                borderRadius: 'var(--tf-radius-lg)',
                background: 'var(--tf-glass)',
                backdropFilter: 'var(--tf-blur)',
                border: '2px solid var(--tf-glass-border)',
                color: 'hsl(var(--tf-text))',
              }}
              aria-label='Search properties'
            />
            {pacsSearch.loading && (
              <div className='absolute top-1/2 -translate-y-1/2' style={{ right: 'var(--tf-space-lg)' }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid var(--tf-quantum-cyan)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              </div>
            )}
          </div>
          {searchInput.trim().length >= 2 && !pacsSearch.loading && pacsSearch.results.length === 0 && !pacsSearch.error && pacsSearch.query && (
            <p style={{ textAlign: 'center', color: 'hsl(var(--tf-muted))', fontSize: 'var(--text-sm)', marginTop: 'var(--tf-space-sm)' }}>
              No properties found for &ldquo;{pacsSearch.query}&rdquo;
            </p>
          )}
          {pacsSearch.error && (
            <p style={{ textAlign: 'center', color: 'var(--tf-error-red)', fontSize: 'var(--text-sm)', marginTop: 'var(--tf-space-sm)' }}>
              {pacsSearch.error}
            </p>
          )}
        </section>

        {/* ─── Search Results ─── */}
        {showResults && pacsSearch.results.length > 0 && (
          <section>
            <div className='flex items-center justify-between' style={{ marginBottom: 'var(--tf-space-sm)' }}>
              <h2
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'hsl(var(--tf-muted))',
                }}
              >
                {pacsSearch.count} result{pacsSearch.count !== 1 ? 's' : ''} for &ldquo;{pacsSearch.query}&rdquo;
              </h2>
              <TactileButton
                variant='ghost'
                size='sm'
                onClick={() => { setSearchInput(''); pacsSearch.clear(); }}
              >
                Clear
              </TactileButton>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2' style={{ gap: 'var(--tf-space-sm)' }}>
              {pacsSearch.results.map((r) => (
                <SearchResultCard
                  key={r.propId}
                  result={r}
                  onClick={() => handleResultClick(r)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── When not searching: Suites + Recent ─── */}
        {!showResults && (
          <>
            {/* Suite Launcher */}
            <section>
              <h2
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'hsl(var(--tf-muted))',
                  marginBottom: 'var(--tf-space-sm)',
                }}
              >
                Assessment Tools
              </h2>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5' style={{ gap: 'var(--tf-space-sm)' }}>
                {SUITES.map((suite) => (
                  <SuiteCard key={suite.id} suite={suite} onClick={() => handleSuiteLaunch(suite)} />
                ))}
              </div>
            </section>

            {/* Recent Parcels */}
            <section>
              <h2
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'hsl(var(--tf-muted))',
                  marginBottom: 'var(--tf-space-sm)',
                }}
              >
                Recent Parcels
              </h2>
              {storedRecentParcels.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3' style={{ gap: 'var(--tf-space-sm)' }}>
                  {storedRecentParcels.map((pid) => (
                    <LiquidPanel
                      key={pid}
                      variant='interactive'
                      radius='md'
                      className='cursor-pointer'
                      onClick={() => handleRecentClick(pid)}
                      role='button'
                      tabIndex={0}
                      aria-label={`Open parcel ${pid}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRecentClick(pid);
                        }
                      }}
                    >
                      <div className='flex items-center' style={{ padding: 'var(--tf-space-sm) var(--tf-space-md)', gap: 'var(--tf-space-sm)' }}>
                        <span style={{ fontSize: 'var(--text-lg)' }}>🏠</span>
                        <div>
                          <div
                            style={{
                              fontSize: 'var(--text-sm)',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--tf-quantum-cyan)',
                            }}
                          >
                            {pid}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--tf-muted))' }}>
                            Benton County
                          </div>
                        </div>
                      </div>
                    </LiquidPanel>
                  ))}
                </div>
              ) : (
                <LiquidPanel variant='shell' radius='lg'>
                  <div style={{ textAlign: 'center', padding: 'var(--tf-space-xl) var(--tf-space-md)' }}>
                    <p style={{ color: 'hsl(var(--tf-muted))', fontSize: 'var(--text-sm)' }}>
                      Type an address, owner name, or parcel ID above to get started
                    </p>
                  </div>
                </LiquidPanel>
              )}
            </section>
          </>
        )}

        {/* ─── Footer ─── */}
        <footer
          style={{
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            color: 'hsl(var(--tf-muted) / 0.5)',
            paddingTop: 'var(--tf-space-md)',
          }}
        >
          <p>
            TerraFusion OS &bull; Benton County Assessor&apos;s Office &bull;{' '}
            {stats ? `${fmtNumber(stats.totalProperties)} parcels` : 'Connecting...'}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ShellHome;
