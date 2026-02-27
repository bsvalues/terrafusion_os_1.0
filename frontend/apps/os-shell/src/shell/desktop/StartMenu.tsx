/**
 * TerraFusion OS Start Menu Component
 *
 * Government-Grade App Launcher
 * Overlay with search, pinned apps, and all apps list.
 * Launches apps via moduleRegistryStore for proper tracking,
 * with fallback to direct window opening for backward compatibility.
 *
 * @module shell/desktop/StartMenu
 * @see SUCCESS CRITERIA SC-3, SC-3.3
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Panel } from '@terrafusion/ui';
import type { Category } from '../../config/generatedModules';
import { getLucideIcon } from '../../config/iconMap';
import { useRecentParcels } from '../../context/parcelContext';
import { activateModule } from '../../orchestration/moduleActivation';
import { useDesktopStore } from '../../stores/desktopStore';
import { useStartMenuStore, type Module } from '../../stores/startMenuStore';
import { TerraSphereIcon } from '../../ui/brand/TerraSphereIcon';
import { RecentAppsSection } from './RecentAppsSection';

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to check if a module has an open window (is "running").
 * Checks desktopStore.windows for a window with matching moduleId.
 */
function useIsModuleRunning(moduleId: string): boolean {
  const windows = useDesktopStore((state) => state.windows);
  return windows.some((w) => w.moduleId === moduleId);
}

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Running Indicator - green dot showing module is open
 * Phase 6: Open Indicator feature
 */
const RunningIndicator: React.FC = () => (
  <span
    data-testid='running-indicator'
    aria-label='running'
    className='absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full text-green-400'
  />
);

/**
 * Wiring Badge - Shows entry type for suite wiring clarity
 * Phase 7: Suite wiring transparency
 * - url → "EXT" (opens external popup/iframe)
 * - route → "OS" (native OS route)
 * - mf → "MF" (module federation)
 */
const WiringBadge: React.FC<{ entryType?: 'url' | 'route' | 'mf' }> = ({ entryType }) => {
  if (!entryType) return null;

  const config = {
    url: {
      label: 'EXT',
      color: 'bg-amber-500/30 text-amber-300',
      title: 'Opens in external window',
    },
    route: { label: 'OS', color: 'bg-green-500/30 text-green-300', title: 'Native OS route' },
    mf: { label: 'MF', color: 'bg-blue-500/30 text-blue-300', title: 'Module federation' },
  }[entryType];

  return (
    <span
      data-testid='wiring-badge'
      title={config.title}
      className={cn(
        'absolute bottom-0.5 right-0.5 px-1 py-0.5 text-[8px] font-bold rounded',
        config.color
      )}
    >
      {config.label}
    </span>
  );
};

/**
 * Search Input
 */
const SearchInput: React.FC = () => {
  const { t } = useTranslation();
  const { searchQuery, setSearchQuery } = useStartMenuStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className='relative'>
      <div
        data-testid='search-icon'
        className='absolute left-3 top-1/2 -translate-y-1/2 text-white/50'
      >
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      </div>
      <input
        ref={inputRef}
        type='search'
        role='searchbox'
        aria-label={t('startMenu.search.ariaLabel')}
        placeholder={t('startMenu.search.placeholder')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={cn(
          'w-full h-10 pl-10 pr-4',
          'bg-white/5 border border-white/10 rounded-lg',
          'text-white placeholder-white/40',
          'focus:outline-none focus:ring-2 focus:ring-[var(--tf-transcend-highlight)]/50 focus:border-[var(--tf-transcend-highlight)]/30',
          'transition-all duration-200'
        )}
      />
    </div>
  );
};

/**
 * App Tile for pinned grid
 */
interface AppTileProps {
  module: Module;
  onLaunch: (module: Module) => void;
}

// Category to TerraSphereIcon variant mapping
const categoryToVariant = {
  assessment: 'assessment',
  records: 'records',
  tax: 'tax',
  mapping: 'mapping',
  analytics: 'analytics',
  ai: 'ai',
  system: 'system',
} as const;

const AppTile: React.FC<AppTileProps> = ({ module, onLaunch }) => {
  const isRunning = useIsModuleRunning(module.id);
  const Icon = getLucideIcon((module as any).iconName ?? module.icon);
  const category = ((module as any).category ?? 'system') as Category;
  const variant = categoryToVariant[category] ?? 'default';
  const entryType = (module as any).entryType as 'url' | 'route' | 'mf' | undefined;

  return (
    <button
      onClick={() => onLaunch(module)}
      aria-label={module.name}
      className={cn(
        'flex flex-col items-center gap-2 p-3 relative',
        'rounded-lg',
        'transition-all duration-150',
        'hover:bg-white/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        'active:scale-95'
      )}
    >
      {isRunning && <RunningIndicator />}
      <WiringBadge entryType={entryType} />
      <div role='img' aria-hidden='true'>
        <TerraSphereIcon size={40} variant={variant} glyph={<Icon className='h-4 w-4' />} />
      </div>
      <span className='text-xs text-white/90 text-center line-clamp-2'>{module.name}</span>
    </button>
  );
};

/**
 * App List Item for all apps
 */
const AppListItem: React.FC<AppTileProps> = ({ module, onLaunch }) => {
  const isRunning = useIsModuleRunning(module.id);
  const Icon = getLucideIcon((module as any).iconName ?? module.icon);
  const category = ((module as any).category ?? 'system') as Category;
  const variant = categoryToVariant[category] ?? 'default';
  const entryType = (module as any).entryType as 'url' | 'route' | 'mf' | undefined;

  return (
    <button
      onClick={() => onLaunch(module)}
      aria-label={module.name}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 relative',
        'rounded-lg',
        'transition-all duration-150',
        'hover:bg-white/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)] focus-visible:ring-inset',
        'active:scale-[0.98]'
      )}
    >
      {isRunning && <RunningIndicator />}
      <div className='flex-shrink-0 relative' role='img' aria-hidden='true'>
        <TerraSphereIcon size={32} variant={variant} glyph={<Icon className='h-3.5 w-3.5' />} />
        <WiringBadge entryType={entryType} />
      </div>
      <div className='flex flex-col items-start min-w-0 flex-1'>
        <span className='text-sm text-white/90 truncate w-full text-left'>{module.name}</span>
        <span className='text-xs text-white/50 truncate w-full text-left'>
          {module.description}
        </span>
      </div>
    </button>
  );
};

/**
 * Pinned Apps Grid
 */
const PinnedAppsGrid: React.FC<{ onLaunch: (module: Module) => void }> = ({ onLaunch }) => {
  const { t } = useTranslation();
  const pinnedModules = useStartMenuStore((state) => state.getPinnedModules());

  if (pinnedModules.length === 0) {
    return null;
  }

  return (
    <div data-testid='pinned-apps' className='mb-4'>
      <h2 className='text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-1'>
        {t('startMenu.sections.pinned')}
      </h2>
      <div className='grid grid-cols-4 gap-1'>
        {pinnedModules.map((module) => (
          <AppTile key={module.id} module={module} onLaunch={onLaunch} />
        ))}
      </div>
    </div>
  );
};

/**
 * All Apps List
 */
const AllAppsList: React.FC<{ onLaunch: (module: Module) => void }> = ({ onLaunch }) => {
  const { t } = useTranslation();
  const { searchQuery } = useStartMenuStore();
  const filteredModules = useStartMenuStore((state) => state.getFilteredModules());

  const showSearchResults = searchQuery.length > 0;
  const title = showSearchResults
    ? t('startMenu.sections.searchResults')
    : t('startMenu.sections.allApps');

  if (filteredModules.length === 0) {
    return (
      <div data-testid='all-apps' className='flex-1 flex items-center justify-center'>
        <p className='text-white/50 text-sm'>{t('startMenu.noAppsFound')}</p>
      </div>
    );
  }

  return (
    <div data-testid='all-apps' className='flex-1 overflow-y-auto'>
      <h2 className='text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-1 sticky top-0 bg-[var(--tf-void-black)]/95 py-1'>
        {title}
      </h2>
      <div className='space-y-0.5'>
        {filteredModules.map((module) => (
          <AppListItem key={module.id} module={module} onLaunch={onLaunch} />
        ))}
      </div>
    </div>
  );
};

/**
 * User Profile Section
 */
const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const { close } = useStartMenuStore();

  const handleSettingsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await activateModule('settings', {
        source: 'start_menu',
        focusIfOpen: true,
        warmLoad: true,
      });
      close();
    } catch (error) {
      console.error('[StartMenu] Failed to launch settings:', error);
    }
  };

  const handleShortcutsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await activateModule('shortcuts-help', {
        source: 'start_menu',
        focusIfOpen: true,
        warmLoad: true,
      });
      close();
    } catch (error) {
      console.error('[StartMenu] Failed to launch shortcuts:', error);
    }
  };

  return (
    <div
      data-testid='user-profile'
      className={cn(
        'flex items-center justify-between p-3 mt-auto',
        'border-t border-white/10',
        'bg-black/20'
      )}
    >
      <div
        role='button'
        tabIndex={0}
        aria-label={t('startMenu.userProfile.ariaLabel')}
        className={cn(
          'flex items-center gap-3',
          'cursor-pointer',
          'hover:bg-white/5 rounded-lg p-2 -ml-2',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[var(--tf-transcend-highlight)]/50'
        )}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            // No action defined yet, but ready for profile modal
          }
        }}
      >
        <div
          data-testid='user-avatar'
          className={cn(
            'w-9 h-9 rounded-full',
            'bg-gradient-to-br from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)]',
            'flex items-center justify-center',
            'text-[var(--tf-void-black)] font-bold text-sm'
          )}
        >
          BC
        </div>
        <div className='flex flex-col'>
          <span className='text-sm text-white/90 font-medium'>
            {t('startMenu.userProfile.role')}
          </span>
          <span className='text-xs text-white/50'>{t('startMenu.userProfile.location')}</span>
        </div>
      </div>

      <div className='flex items-center gap-1'>
        <button
          onClick={handleShortcutsClick}
          aria-label={t('startMenu.shortcuts')}
          className={cn(
            'p-2 rounded-lg',
            'text-white/70 hover:text-white hover:bg-white/10',
            'transition-all duration-150'
          )}
          title={t('startMenu.shortcuts')}
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
            />
          </svg>
        </button>

        <button
          onClick={handleSettingsClick}
          aria-label={t('startMenu.settings')}
          className={cn(
            'p-2 rounded-lg',
            'text-white/70 hover:text-white hover:bg-white/10',
            'transition-all duration-150'
          )}
          title={t('startMenu.settings')}
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Recent Parcels Section (absorbed from ShellHome)
// ============================================================================

const MapPinIcon = getLucideIcon('MapPin');

/**
 * RecentParcelsSection - Shows recently accessed parcels
 * Absorbed from ShellHome's recent items feature.
 *
 * Split into gate + content components so useNavigate() is only called
 * when parcels exist (avoids crash in tests without Router context).
 */
const RecentParcelsSection: React.FC = () => {
  const recentParcels = useRecentParcels();
  if (recentParcels.length === 0) return null;
  return <RecentParcelsList parcels={recentParcels} />;
};

/** Inner component — only mounted when recent parcels exist. */
const RecentParcelsList: React.FC<{ parcels: string[] }> = ({ parcels }) => {
  const navigate = useNavigate();

  return (
    <div className='mt-2'>
      <div
        className='px-3 py-1.5 text-xs font-medium uppercase tracking-wider'
        style={{ color: 'hsl(var(--tf-muted))' }}
      >
        Recent Parcels
      </div>
      <div className='space-y-0.5 max-h-[80px] overflow-y-auto'>
        {parcels.slice(0, 3).map((parcelId) => (
          <button
            key={parcelId}
            onClick={() => navigate(`/property/${parcelId}`)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left',
              'transition-all duration-150',
              'hover:bg-white/10'
            )}
          >
            <TerraSphereIcon
              size={20}
              variant='mapping'
              glyph={<MapPinIcon className='h-2 w-2' />}
            />
            <span className='text-xs truncate' style={{ color: 'hsl(var(--tf-text-primary-hs) 90%)' }}>
              Parcel {parcelId}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export interface StartMenuProps {
  className?: string;
}

export const StartMenu: React.FC<StartMenuProps> = ({ className }) => {
  const { isOpen, close, clearSearch, addRecentApp } = useStartMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle app launch - uses activateModule() as THE canonical entry point (Phase 5)
  const handleLaunch = useCallback(
    async (module: Module) => {
      try {
        // Call the canonical orchestrator with start_menu source
        await activateModule(module.id, {
          source: 'start_menu',
          focusIfOpen: true,
          warmLoad: true,
        });

        // Add to recent apps on successful launch
        addRecentApp(module);
      } catch (error) {
        // Log error but don't interrupt UI flow
        console.error('[StartMenu] Failed to activate module:', module.id, error);
      }

      // Always close start menu and clear search, even on error
      clearSearch();
      close();
    },
    [clearSearch, close, addRecentApp]
  );

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate close when clicking start button
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, close]);

  // Don't render if closed
  if (!isOpen) {
    return null;
  }

  return (
    <Panel
      ref={menuRef}
      data-testid='start-menu'
      role='menu'
      aria-label='Start Menu'
      className={cn(
        // Position - bottom left, above taskbar dock
        'fixed bottom-16 left-4 z-[60]',
        // Size
        'w-[380px] h-[540px]',
        // Layout
        'flex flex-col',
        // Override Panel defaults for start menu
        '!p-0 !rounded-2xl',
        // Glass effect class for tests/consistency
        'backdrop-blur-xl',
        // Animation
        'animate-slideUp',
        className
      )}
      style={{
        // macOS Tahoe glassmorphism
        background: 'hsl(var(--tf-surface-dark-hs) 8% / 0.72)',
        backdropFilter: 'saturate(200%) blur(32px)',
        WebkitBackdropFilter: 'saturate(200%) blur(32px)',
        border: '0.5px solid hsl(var(--tf-text-primary-hs) 100% / 0.1)',
        boxShadow: '0 24px 80px hsl(0 0% 0% / 0.5), 0 0 0 0.5px hsl(var(--tf-text-primary-hs) 100% / 0.06)',
      }}
    >
      {/* Search Section */}
      <div className='p-3 border-b border-white/10'>
        <SearchInput />
      </div>

      {/* Content Area */}
      <div className='flex-1 p-3 flex flex-col overflow-hidden'>
        {/* Pinned Apps */}
        <PinnedAppsGrid onLaunch={handleLaunch} />

        {/* Recent Apps - between Pinned and All Apps (SC-6.1) */}
        <RecentAppsSection onLaunch={handleLaunch} />

        {/* Recent Parcels - absorbed from ShellHome */}
        <RecentParcelsSection />

        {/* Divider */}
        <div className='h-px bg-white/10 my-2' />

        {/* All Apps */}
        <AllAppsList onLaunch={handleLaunch} />
      </div>

      {/* User Profile */}
      <UserProfile />
    </Panel>
  );
};

export default StartMenu;
