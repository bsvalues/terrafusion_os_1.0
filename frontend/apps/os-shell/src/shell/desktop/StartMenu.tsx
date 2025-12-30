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
import { useDesktopStore } from '../../stores/desktopStore';
import { useModuleRegistryStore } from '../../stores/moduleRegistryStore';
import { useStartMenuStore, type Module } from '../../stores/startMenuStore';
import { RecentAppsSection } from './RecentAppsSection';

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Search Input
 */
const SearchInput: React.FC = () => {
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
        aria-label='Search apps'
        placeholder='Type to search...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={cn(
          'w-full h-10 pl-10 pr-4',
          'bg-white/5 border border-white/10 rounded-lg',
          'text-white placeholder-white/40',
          'focus:outline-none focus:ring-2 focus:ring-[#00ffee]/50 focus:border-[#00ffee]/30',
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

const AppTile: React.FC<AppTileProps> = ({ module, onLaunch }) => {
  return (
    <button
      onClick={() => onLaunch(module)}
      aria-label={module.name}
      className={cn(
        'flex flex-col items-center gap-2 p-3',
        'rounded-lg',
        'transition-all duration-150',
        'hover:bg-white/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffee] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        'active:scale-95'
      )}
    >
      <span className='text-3xl' role='img' aria-hidden='true'>
        {module.icon}
      </span>
      <span className='text-xs text-white/90 text-center line-clamp-2'>{module.name}</span>
    </button>
  );
};

/**
 * App List Item for all apps
 */
const AppListItem: React.FC<AppTileProps> = ({ module, onLaunch }) => {
  return (
    <button
      onClick={() => onLaunch(module)}
      aria-label={module.name}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2',
        'rounded-lg',
        'transition-all duration-150',
        'hover:bg-white/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffee] focus-visible:ring-inset',
        'active:scale-[0.98]'
      )}
    >
      <span className='text-xl flex-shrink-0' role='img' aria-hidden='true'>
        {module.icon}
      </span>
      <div className='flex flex-col items-start min-w-0'>
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
  const pinnedModules = useStartMenuStore((state) => state.getPinnedModules());

  if (pinnedModules.length === 0) {
    return null;
  }

  return (
    <div data-testid='pinned-apps' className='mb-4'>
      <h2 className='text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-1'>
        Pinned
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
  const { searchQuery } = useStartMenuStore();
  const filteredModules = useStartMenuStore((state) => state.getFilteredModules());

  const showSearchResults = searchQuery.length > 0;
  const title = showSearchResults ? 'Search Results' : 'All apps';

  if (filteredModules.length === 0) {
    return (
      <div data-testid='all-apps' className='flex-1 flex items-center justify-center'>
        <p className='text-white/50 text-sm'>No apps found</p>
      </div>
    );
  }

  return (
    <div data-testid='all-apps' className='flex-1 overflow-y-auto'>
      <h2 className='text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-1 sticky top-0 bg-[#0a0e1a]/95 py-1'>
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
  return (
    <div
      data-testid='user-profile'
      className={cn(
        'flex items-center gap-3 p-3 mt-auto',
        'border-t border-white/10',
        'cursor-pointer',
        'hover:bg-white/5',
        'transition-colors duration-150'
      )}
    >
      <div
        data-testid='user-avatar'
        className={cn(
          'w-9 h-9 rounded-full',
          'bg-gradient-to-br from-[#0099ff] to-[#00ffee]',
          'flex items-center justify-center',
          'text-[#0a0e1a] font-bold text-sm'
        )}
      >
        BC
      </div>
      <div className='flex flex-col'>
        <span className='text-sm text-white/90 font-medium'>Assessor</span>
        <span className='text-xs text-white/50'>Benton County</span>
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
  const { isOpen, close, clearSearch } = useStartMenuStore();
  const launchModule = useModuleRegistryStore((state) => state.launchModule);
  const isRegistryInitialized = useModuleRegistryStore((state) => state.isInitialized);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle app launch
  // Uses moduleRegistryStore when initialized, falls back to direct openWindow
  const handleLaunch = useCallback(
    async (module: Module) => {
      try {
        if (isRegistryInitialized) {
          // Primary path: Use module registry for proper tracking
          // This handles load states, window management, and duplicate detection
          await launchModule(module.id);
        } else {
          // Fallback: Direct window open for backward compatibility
          // Used when registry hasn't been initialized (e.g., in tests)
          openWindow(module.id, module.name, module.icon);
        }
      } catch (error) {
        // If launchModule throws (module not in registry), fall back to direct open
        console.warn('Module not in registry, using fallback:', module.id);
        openWindow(module.id, module.name, module.icon);
      }

      // Always close start menu and clear search
      clearSearch();
      close();
    },
    [launchModule, isRegistryInitialized, openWindow, clearSearch, close]
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
    <div
      ref={menuRef}
      data-testid='start-menu'
      role='menu'
      aria-label='Start Menu'
      className={cn(
        // Position - bottom left, above taskbar
        'fixed bottom-14 left-1 z-[60]',
        // Size
        'w-[360px] h-[500px]',
        // Background with glass effect
        'bg-[#0a0e1a]/95 backdrop-blur-xl',
        // Border
        'border border-[#00ffee]/20 rounded-xl',
        // Shadow
        'shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(0,255,238,0.15)]',
        // Layout
        'flex flex-col',
        // Animation
        'animate-slideUp',
        className
      )}
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

        {/* Divider */}
        <div className='h-px bg-white/10 my-2' />

        {/* All Apps */}
        <AllAppsList onLaunch={handleLaunch} />
      </div>

      {/* User Profile */}
      <UserProfile />
    </div>
  );
};

export default StartMenu;
