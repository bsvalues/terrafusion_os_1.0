/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - SHELL HOME
 * Benton County Assessor's Property Search & Operations Center
 *
 * The real landing experience: live PACS search against 112K+ parcels,
 * database statistics, clickable property cards, and suite launchers.
 *
 * Architecture:
 * - Live Search: Real-time PACS property search (address/owner/parcel)
 * - Stats Banner: Live totals from SQL Server pacs_oltp
 * - Search Results: Clickable cards → Property Workbench
 * - Suite Launcher: Forge, Atlas, Dais, Dossier, GPT
 * - Recent Parcels: Session-persisted recent work
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

const COLOR_MAP: Record<string, string> = {
  forge: 'from-orange-500 to-red-600',
  atlas: 'from-blue-500 to-cyan-600',
  dais: 'from-purple-500 to-pink-600',
  dossier: 'from-green-500 to-emerald-600',
  gpt: 'from-indigo-500 to-violet-600',
};

interface Suite {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  color: string;
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
      color: COLOR_MAP[suite.id] || 'from-slate-500 to-slate-600',
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
// Sub-Components
// ============================================================================

/** Live stats banner showing real PACS database numbers */
const StatsBanner: React.FC<{
  totalProperties: number;
  totalAssessed: number;
  totalMarket: number;
}> = ({ totalProperties, totalAssessed, totalMarket }) => (
  <div className='grid grid-cols-3 gap-4'>
    <div className='bg-white/5 backdrop-blur rounded-xl p-4 text-center border border-white/10'>
      <div className='text-2xl font-bold text-cyan-400'>{fmtNumber(totalProperties)}</div>
      <div className='text-xs text-white/50 mt-1'>Parcels in PACS</div>
    </div>
    <div className='bg-white/5 backdrop-blur rounded-xl p-4 text-center border border-white/10'>
      <div className='text-2xl font-bold text-emerald-400'>{fmtCurrency(totalAssessed)}</div>
      <div className='text-xs text-white/50 mt-1'>Total Assessed</div>
    </div>
    <div className='bg-white/5 backdrop-blur rounded-xl p-4 text-center border border-white/10'>
      <div className='text-2xl font-bold text-amber-400'>{fmtCurrency(totalMarket)}</div>
      <div className='text-xs text-white/50 mt-1'>Total Market</div>
    </div>
  </div>
);

/** Search result card — clickable, shows real property data */
const SearchResultCard: React.FC<{
  result: PacsSearchResult;
  onClick: () => void;
}> = ({ result, onClick }) => (
  <button
    onClick={onClick}
    className='w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10
               hover:border-cyan-500/40 rounded-xl transition-all group'
  >
    <div className='flex items-start justify-between gap-3'>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-mono text-cyan-400 truncate'>{result.geoId.trim()}</span>
          <span className='px-1.5 py-0.5 text-[10px] font-bold rounded bg-white/10 text-white/60'>
            {TYPE_LABELS[result.propertyType.trim()] || result.propertyType.trim()}
          </span>
        </div>
        <div className='text-white font-medium mt-1 truncate'>{result.ownerName.trim()}</div>
        <div className='text-white/50 text-sm truncate'>{result.address}</div>
      </div>
      <div className='text-right shrink-0'>
        <div className='text-emerald-400 font-semibold'>{fmtCurrency(result.marketValue)}</div>
        <div className='text-white/40 text-xs'>market</div>
      </div>
    </div>
    <div className='flex items-center justify-between mt-2 pt-2 border-t border-white/5'>
      <span className='text-white/30 text-xs'>Assessed: {fmtCurrency(result.assessedValue)}</span>
      <span className='text-cyan-400/60 text-xs group-hover:text-cyan-400 transition-colors'>
        Open Workbench →
      </span>
    </div>
  </button>
);

/** Suite launcher tile */
const SuiteCard: React.FC<{ suite: Suite; onClick: () => void }> = ({ suite, onClick }) => {
  const intentLabel = INTENT_LABELS[suite.intent];
  return (
    <LiquidPanel
      variant='interactive'
      className='group relative cursor-pointer hover:scale-105 transition-transform duration-200'
      onClick={onClick}
      role='button'
      tabIndex={0}
      data-intent={suite.intent}
      aria-label={`${suite.name} - ${intentLabel.description}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${suite.color} opacity-60 rounded-xl`} />
      <div className='relative z-10 p-5'>
        <span className='text-3xl mb-2 block'>{suite.icon}</span>
        <h3 className='text-base font-bold text-white mb-0.5'>{suite.name}</h3>
        <p className='text-white/70 text-xs'>{suite.description}</p>
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
    <div className={`min-h-full flex flex-col p-6 md:p-10 ${className}`}>
      <div className='w-full max-w-6xl mx-auto space-y-8'>

        {/* Header */}
        <header className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-white tracking-tight'>
              <span className='bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'>
                TerraFusion OS
              </span>
            </h1>
            <p className='text-white/40 text-sm mt-1'>Benton County Assessor&apos;s Office</p>
          </div>
          <div className='flex items-center gap-3'>
            {stats && (
              <span className='px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded-full border border-emerald-500/30'>
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
                <span className='text-lg'>{ep.icon}</span>
              </TactileButton>
            ))}
          </div>
        </header>

        {/* Stats Banner */}
        {stats && (
          <StatsBanner
            totalProperties={stats.totalProperties}
            totalAssessed={stats.totalAssessedValue}
            totalMarket={stats.totalMarketValue}
          />
        )}

        {/* Search */}
        <section>
          <div className='relative max-w-3xl mx-auto'>
            <input
              type='text'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={searchInput.trim().length < 2 ? openCommandPalette : undefined}
              placeholder='Search by address, owner name, or parcel ID...'
              className='w-full px-6 py-4 text-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl
                       text-white placeholder-white/40
                       focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50
                       transition-all duration-200'
              aria-label='Search properties'
            />
            {pacsSearch.loading && (
              <div className='absolute right-5 top-1/2 -translate-y-1/2'>
                <div className='w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin' />
              </div>
            )}
          </div>
          {searchInput.trim().length >= 2 && !pacsSearch.loading && pacsSearch.results.length === 0 && !pacsSearch.error && pacsSearch.query && (
            <p className='text-center text-white/40 text-sm mt-3'>
              No properties found for &ldquo;{pacsSearch.query}&rdquo;
            </p>
          )}
          {pacsSearch.error && (
            <p className='text-center text-red-400 text-sm mt-3'>{pacsSearch.error}</p>
          )}
        </section>

        {/* Search Results */}
        {showResults && pacsSearch.results.length > 0 && (
          <section>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-sm font-semibold text-white/60'>
                {pacsSearch.count} result{pacsSearch.count !== 1 ? 's' : ''} for &ldquo;{pacsSearch.query}&rdquo;
              </h2>
              <button
                onClick={() => { setSearchInput(''); pacsSearch.clear(); }}
                className='text-xs text-white/40 hover:text-white/60 transition-colors'
              >
                Clear
              </button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
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

        {/* When not searching: show suites + recent */}
        {!showResults && (
          <>
            {/* Suite Launcher */}
            <section>
              <h2 className='text-sm font-semibold text-white/50 uppercase tracking-wider mb-3'>
                Assessment Tools
              </h2>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
                {SUITES.map((suite) => (
                  <SuiteCard key={suite.id} suite={suite} onClick={() => handleSuiteLaunch(suite)} />
                ))}
              </div>
            </section>

            {/* Recent Parcels */}
            <section>
              <h2 className='text-sm font-semibold text-white/50 uppercase tracking-wider mb-3'>
                Recent Parcels
              </h2>
              {storedRecentParcels.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2'>
                  {storedRecentParcels.map((pid) => (
                    <button
                      key={pid}
                      onClick={() => handleRecentClick(pid)}
                      className='flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10
                                 border border-white/5 hover:border-cyan-500/30 transition-all text-left'
                    >
                      <span className='text-lg'>🏠</span>
                      <div>
                        <div className='text-sm font-mono text-cyan-400'>{pid}</div>
                        <div className='text-xs text-white/40'>Benton County</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 bg-white/5 rounded-xl border border-white/5'>
                  <p className='text-white/30 text-sm'>
                    Type an address, owner name, or parcel ID above to get started
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* Footer */}
        <footer className='text-center text-white/20 text-xs pt-4'>
          <p>TerraFusion OS &bull; Benton County Assessor&apos;s Office &bull; {stats ? `${fmtNumber(stats.totalProperties)} parcels` : 'Connecting...'}</p>
        </footer>
      </div>
    </div>
  );
};

export default ShellHome;
