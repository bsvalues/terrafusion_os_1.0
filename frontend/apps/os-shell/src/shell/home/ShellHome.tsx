/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - SHELL HOME
 * Phase 5 + Phase 9: OS Landing Surface with Constitutional Suites
 *
 * The canonical landing experience for TerraFusion OS.
 * Provides context-first navigation: search → select → workbench/suite.
 *
 * Phase 9 Update: Now uses suiteRegistry.ts as single source of truth.
 * Slice 7 Update: OS entrypoints derived from registry (no hardcoding).
 *
 * Architecture:
 * - Global Search: Find parcels, cases, persons, documents
 * - Recent Work: Quick access to recent parcels/cases
 * - Suite Launcher: Forge, Atlas, Dais, Dossier, GPT (from registry)
 * - OS Entrypoints: Pilot, Trace, etc. (from registry)
 *
 * Success Criteria:
 * - `/` loads Shell Home reliably
 * - Selecting a parcel routes to Property Workbench
 * - Suites launch from here
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CONSTITUTIONAL_SUITES,
    getStandaloneSuites,
    getSuiteIntent,
    INTENT_LABELS,
    isWorkbenchSuite,
    type SuiteId,
} from '../../config/suiteRegistry';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { LiquidPanel, TactileButton } from '../../ui/materials';

// ============================================================================
// Types
// ============================================================================

interface Suite {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  intent: 'workbench' | 'standalone';
}

interface RecentItem {
  id: string;
  type: 'parcel' | 'case' | 'document';
  title: string;
  subtitle: string;
  timestamp: Date;
  route: string;
}

// ============================================================================
// Suite Configuration - FROM CONSTITUTIONAL REGISTRY (Honest Routing)
// ============================================================================

// Map iconName to emoji (temporary until we wire Lucide icons)
const ICON_MAP: Record<string, string> = {
  Hammer: '🔨',
  Globe: '🗺️',
  LayoutDashboard: '📊',
  FileStack: '📁',
  Bot: '🤖',
  Compass: '🎮',
  Activity: '🔍',
};

// Color map for suites
const COLOR_MAP: Record<string, string> = {
  forge: 'from-orange-500 to-red-600',
  atlas: 'from-blue-500 to-cyan-600',
  dais: 'from-purple-500 to-pink-600',
  dossier: 'from-green-500 to-emerald-600',
  gpt: 'from-indigo-500 to-violet-600',
};

/**
 * Build suites array with context-aware routing (Slice 9).
 * Uses parcel context for workbench suites, fallback route when absent.
 */
function buildSuites(parcelId: string | null): Suite[] {
  return CONSTITUTIONAL_SUITES.map((suite) => {
    let route: string;
    if (isWorkbenchSuite(suite)) {
      const hrefResult = getWorkbenchHrefWithContext(suite, parcelId);
      route = hrefResult.href;
    } else {
      route = suite.route;
    }

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

/**
 * OS Entrypoints - Derived from registry (Slice 7: no hardcoding).
 * Uses getStandaloneSuites() for registry parity with launcher.
 */
const OS_ENTRYPOINTS = getStandaloneSuites().map((feature) => ({
  id: feature.id,
  name: feature.homeMeta.title || feature.displayName,
  icon: ICON_MAP[feature.iconName] || '📦',
  route: feature.route,
  description: feature.description,
}));

// Add TerraPrime as a non-standalone system entrypoint
// (It's a legacy surface, not a StandaloneHomeShell user)
const LEGACY_ENTRYPOINTS = [
  {
    id: 'prime',
    name: 'TerraPrime',
    icon: '📋',
    route: '/suites/terra-prime',
    description: 'Property viewer',
  },
];

// Combined entrypoints (registry-driven + legacy)
const ALL_ENTRYPOINTS = [...OS_ENTRYPOINTS, ...LEGACY_ENTRYPOINTS];

// ============================================================================
// Components
// ============================================================================

/**
 * Search Bar - Prominent global search
 */
const SearchBar: React.FC<{
  onSearch: (query: string) => void;
  onFocus: () => void;
}> = ({ onSearch, onFocus }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className='w-full max-w-2xl mx-auto'>
      <div className='relative'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocus}
          placeholder='Search parcels, cases, persons, documents...'
          className='w-full px-6 py-4 text-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl 
                   text-white placeholder-white/50 
                   focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50
                   transition-all duration-200'
        />
        <div className='absolute right-3 top-1/2 -translate-y-1/2'>
          <TactileButton type='submit' variant='primary' size='sm'>
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </TactileButton>
        </div>
      </div>
      <p className='text-center text-white/40 text-sm mt-2'>
        Press <kbd className='px-1.5 py-0.5 bg-white/10 rounded text-xs'>Ctrl</kbd> +{' '}
        <kbd className='px-1.5 py-0.5 bg-white/10 rounded text-xs'>K</kbd> for quick search
      </p>
    </form>
  );
};

/**
 * Suite Card - Clickable suite launcher with LiquidPanel glass effect
 */
const SuiteCard: React.FC<{
  suite: Suite;
  onClick: () => void;
}> = ({ suite, onClick }) => {
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
      {/* Gradient overlay for suite identity */}
      <div className={`absolute inset-0 bg-gradient-to-br ${suite.color} opacity-60 rounded-xl`} />
      {/* Intent Badge - clear UX indicator */}
      <span
        className={`absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded shadow-sm z-20
                   ${suite.intent === 'workbench' ? 'bg-emerald-500/90' : 'bg-slate-500/90'} text-white`}
        title={intentLabel.description}
        aria-label={intentLabel.badge}
      >
        {suite.intent === 'workbench' ? 'Workbench' : 'Standalone'}
      </span>
      <div className='relative z-10 p-6'>
        <span className='text-4xl mb-3 block'>{suite.icon}</span>
        <h3 className='text-xl font-bold text-white mb-1'>{suite.name}</h3>
        <p className='text-white/80 text-sm'>{suite.description}</p>
      </div>
      <div className='absolute bottom-2 right-2 text-white/40 group-hover:text-white/60 transition-colors z-10'>
        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M14 5l7 7m0 0l-7 7m7-7H3'
          />
        </svg>
      </div>
    </LiquidPanel>
  );
};

/**
 * OS Entrypoint - Utility links with TactileButton ghost variant
 */
const OSEntrypoint: React.FC<{
  item: (typeof ALL_ENTRYPOINTS)[0];
  onClick: () => void;
}> = ({ item, onClick }) => (
  <TactileButton
    onClick={onClick}
    variant='ghost'
    size='md'
    className='w-full justify-start gap-3 text-left'
  >
    <span className='text-2xl'>{item.icon}</span>
    <div className='flex-1'>
      <div className='font-semibold text-white'>{item.name}</div>
      <div className='text-white/50 text-xs'>{item.description}</div>
    </div>
  </TactileButton>
);

/**
 * Recent Item Card
 */
const RecentItemCard: React.FC<{
  item: RecentItem;
  onClick: () => void;
}> = ({ item, onClick }) => (
  <button
    onClick={onClick}
    className='flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 
               transition-all text-left w-full'
  >
    <div className='w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg'>
      {item.type === 'parcel' ? '🏠' : item.type === 'case' ? '📋' : '📄'}
    </div>
    <div className='flex-1 min-w-0'>
      <h4 className='font-medium text-white truncate'>{item.title}</h4>
      <p className='text-white/50 text-xs truncate'>{item.subtitle}</p>
    </div>
  </button>
);

// ============================================================================
// Shell Home Component
// ============================================================================

export interface ShellHomeProps {
  className?: string;
}

/**
 * ShellHome - The OS landing surface
 *
 * This is what users see at `/` - the canonical entrypoint.
 * Provides search, recent work, and suite/OS launchers.
 */
export const ShellHome: React.FC<ShellHomeProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const recentApps = useStartMenuStore((state) => state.recentApps);
  const openCommandPalette = useCommandPaletteStore((state) => state.open);

  // Get current parcel context (Slice 9: context-aware navigation)
  const parcelContext = useParcelContext();

  // Build suites with context-aware workbench routes
  const SUITES = useMemo(
    () => buildSuites(parcelContext?.parcelId ?? null),
    [parcelContext?.parcelId]
  );

  // Mock recent items (in production, this would come from a store)
  const recentItems: RecentItem[] = [
    {
      id: '1',
      type: 'parcel',
      title: '12345-001',
      subtitle: '123 Main St, Benton County',
      timestamp: new Date(),
      route: '/property/12345-001',
    },
    {
      id: '2',
      type: 'parcel',
      title: '67890-002',
      subtitle: '456 Oak Ave, Benton County',
      timestamp: new Date(),
      route: '/property/67890-002',
    },
    {
      id: '3',
      type: 'case',
      title: 'APL-2026-0042',
      subtitle: 'Valuation Appeal',
      timestamp: new Date(),
      route: '/suites/terraforge/appeal/APL-2026-0042',
    },
  ];

  const handleSearch = useCallback(
    (query: string) => {
      // For now, route to a search results page or open command palette
      // In production, this would search and show results
      console.log('Search:', query);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    },
    [navigate]
  );

  const handleSuiteLaunch = useCallback(
    (suite: Suite) => {
      navigate(suite.route);
    },
    [navigate]
  );

  const handleOSEntrypoint = useCallback(
    (item: (typeof ALL_ENTRYPOINTS)[0]) => {
      navigate(item.route);
    },
    [navigate]
  );

  const handleRecentItem = useCallback(
    (item: RecentItem) => {
      navigate(item.route);
    },
    [navigate]
  );

  return (
    <div className={`min-h-full flex flex-col items-center justify-center p-8 ${className}`}>
      <div className='w-full max-w-5xl space-y-12'>
        {/* Header / Branding */}
        <header className='text-center space-y-4'>
          <h1 className='text-5xl font-bold text-white tracking-tight'>
            <span className='bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'>
              TerraFusion OS
            </span>
          </h1>
          <p className='text-xl text-white/60'>Government. Transcended.</p>
        </header>

        {/* Global Search */}
        <section>
          <SearchBar onSearch={handleSearch} onFocus={openCommandPalette} />
        </section>

        {/* Suite Launcher */}
        <section>
          <h2 className='text-lg font-semibold text-white/80 mb-4 flex items-center gap-2'>
            <span>🚀</span> Launch Suite
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {SUITES.map((suite) => (
              <SuiteCard key={suite.id} suite={suite} onClick={() => handleSuiteLaunch(suite)} />
            ))}
          </div>
        </section>

        {/* Two Column Layout: Recent + OS Entrypoints */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Recent Work */}
          <section>
            <h2 className='text-lg font-semibold text-white/80 mb-4 flex items-center gap-2'>
              <span>📅</span> Recent
            </h2>
            <div className='space-y-2'>
              {recentItems.length > 0 ? (
                recentItems.map((item) => (
                  <RecentItemCard
                    key={item.id}
                    item={item}
                    onClick={() => handleRecentItem(item)}
                  />
                ))
              ) : (
                <p className='text-white/40 text-sm p-4 text-center bg-white/5 rounded-lg'>
                  No recent items yet. Search for a parcel to get started.
                </p>
              )}
            </div>
          </section>

          {/* OS Entrypoints */}
          <section>
            <h2 className='text-lg font-semibold text-white/80 mb-4 flex items-center gap-2'>
              <span>⚙️</span> System
            </h2>
            <div className='space-y-2'>
              {ALL_ENTRYPOINTS.map((item) => (
                <OSEntrypoint key={item.id} item={item} onClick={() => handleOSEntrypoint(item)} />
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className='text-center text-white/30 text-sm pt-8'>
          <p>TerraFusion OS v2.0 • Benton County Assessor's Office</p>
          <p className='mt-1'>
            <kbd className='px-1.5 py-0.5 bg-white/10 rounded text-xs'>Ctrl+K</kbd> Search
            <span className='mx-2'>•</span>
            <kbd className='px-1.5 py-0.5 bg-white/10 rounded text-xs'>Win</kbd> Start Menu
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ShellHome;
