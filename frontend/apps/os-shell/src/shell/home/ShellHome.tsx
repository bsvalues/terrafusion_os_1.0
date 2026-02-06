/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - SHELL HOME
 * Phase 5 + Phase 9: OS Landing Surface with Constitutional Suites
 *
 * The canonical landing experience for TerraFusion OS.
 * Provides context-first navigation: search → select → workbench/suite.
 *
 * Phase 9 Update: Now uses suiteRegistry.ts as single source of truth.
 *
 * Architecture:
 * - Global Search: Find parcels, cases, persons, documents
 * - Recent Work: Quick access to recent parcels/cases
 * - Suite Launcher: Forge, Atlas, Dais, Dossier, GPT (from registry)
 * - OS Entrypoints: Pilot, Trace, Settings
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
import { CONSTITUTIONAL_SUITES } from '../../config/suiteRegistry';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { useStartMenuStore } from '../../stores/startMenuStore';

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
// Suite Configuration - FROM CONSTITUTIONAL REGISTRY
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

const SUITES: Suite[] = CONSTITUTIONAL_SUITES.map((suite) => ({
  id: suite.id,
  name: suite.displayName,
  description: suite.description,
  icon: ICON_MAP[suite.iconName] || '📦',
  route: suite.route,
  color: COLOR_MAP[suite.id] || 'from-slate-500 to-slate-600',
}));

const OS_ENTRYPOINTS = [
  {
    id: 'pilot',
    name: 'Pilot Console',
    icon: '🎮',
    route: '/pilot',
    description: 'Tool execution & governance',
  },
  {
    id: 'trace',
    name: 'TerraTrace',
    icon: '🔍',
    route: '/pilot/dashboard',
    description: 'Observability & debugging',
  },
  {
    id: 'prime',
    name: 'TerraPrime',
    icon: '📋',
    route: '/suites/terra-prime',
    description: 'Property viewer',
  },
];

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
        <button
          type='submit'
          className='absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl
                   bg-gradient-to-r from-cyan-500 to-blue-600 text-white
                   hover:from-cyan-400 hover:to-blue-500 transition-all'
        >
          <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </button>
      </div>
      <p className='text-center text-white/40 text-sm mt-2'>
        Press <kbd className='px-1.5 py-0.5 bg-white/10 rounded text-xs'>Ctrl</kbd> +{' '}
        <kbd className='px-1.5 py-0.5 bg-white/10 rounded text-xs'>K</kbd> for quick search
      </p>
    </form>
  );
};

/**
 * Suite Card - Clickable suite launcher
 */
const SuiteCard: React.FC<{
  suite: Suite;
  onClick: () => void;
}> = ({ suite, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative p-6 rounded-2xl bg-gradient-to-br ${suite.color} 
               shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200
               text-left overflow-hidden`}
  >
    <div className='absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity' />
    <div className='relative z-10'>
      <span className='text-4xl mb-3 block'>{suite.icon}</span>
      <h3 className='text-xl font-bold text-white mb-1'>{suite.name}</h3>
      <p className='text-white/80 text-sm'>{suite.description}</p>
    </div>
    <div className='absolute bottom-2 right-2 text-white/40 group-hover:text-white/60 transition-colors'>
      <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M14 5l7 7m0 0l-7 7m7-7H3'
        />
      </svg>
    </div>
  </button>
);

/**
 * OS Entrypoint - Smaller utility links
 */
const OSEntrypoint: React.FC<{
  item: (typeof OS_ENTRYPOINTS)[0];
  onClick: () => void;
}> = ({ item, onClick }) => (
  <button
    onClick={onClick}
    className='flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10
               hover:bg-white/10 hover:border-white/20 transition-all text-left w-full'
  >
    <span className='text-2xl'>{item.icon}</span>
    <div>
      <h4 className='font-semibold text-white'>{item.name}</h4>
      <p className='text-white/50 text-xs'>{item.description}</p>
    </div>
  </button>
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
    (item: (typeof OS_ENTRYPOINTS)[0]) => {
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
              {OS_ENTRYPOINTS.map((item) => (
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
