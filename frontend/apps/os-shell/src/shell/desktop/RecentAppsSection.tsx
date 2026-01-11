/**
 * TerraFusion OS Recent Apps Section Component
 *
 * Displays recently opened modules in the Start Menu.
 * Shows up to 10 apps in horizontal scroll layout with clock icon.
 *
 * SUCCESS CRITERIA:
 * - SC-6.1: Display "Recent" section between Pinned and All Apps
 * - SC-6.2: Show up to 10 recently opened modules
 * - SC-6.3: Most recent first ordering
 * - SC-6.4: Click to launch (same as other sections)
 * - SC-6.5: Empty state when no recent apps
 *
 * @module shell/desktop/RecentAppsSection
 */

import { cn } from '@/lib/utils';
import React from 'react';
import { colors } from '../../design-system/tokens/colors';
import { useDesktopStore } from '../../stores/desktopStore';
import { useStartMenuStore, type Module } from '../../stores/startMenuStore';

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to check if a module has an open window (is "running").
 */
function useIsModuleRunning(moduleId: string): boolean {
  const windows = useDesktopStore((state) => state.windows);
  return windows.some((w) => w.moduleId === moduleId);
}

// ============================================================================
// Types
// ============================================================================

export interface RecentAppsSectionProps {
  /** Callback when an app is launched */
  onLaunch: (module: Module) => void;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_DISPLAYED = 10;

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Clock icon for the Recent section header
 */
const ClockIcon: React.FC = () => (
  <svg
    data-testid='recent-clock-icon'
    className='w-3.5 h-3.5'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
    aria-hidden='true'
  >
    <circle cx='12' cy='12' r='10' strokeWidth='2' />
    <polyline
      points='12 6 12 12 16 14'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

/**
 * Running Indicator for recent apps
 */
const RunningIndicator: React.FC = () => (
  <span
    data-testid='running-indicator'
    aria-label='running'
    className='absolute top-0.5 right-0.5 w-2 h-2 bg-green-400 rounded-full text-green-400'
  />
);

/**
 * Individual recent app tile
 */
interface RecentAppTileProps {
  module: Module;
  onLaunch: (module: Module) => void;
}

const RecentAppTile: React.FC<RecentAppTileProps> = ({ module, onLaunch }) => {
  const isRunning = useIsModuleRunning(module.id);

  return (
    <button
      onClick={() => onLaunch(module)}
      aria-label={module.name}
      className={cn(
        'flex flex-col items-center gap-1.5 p-2 relative',
        'min-w-[64px]',
        'rounded-lg',
        'transition-all duration-150',
        'hover:bg-white/10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        'active:scale-95'
      )}
      style={
        {
          '--tw-ring-color': colors.brand.transcend[500],
        } as React.CSSProperties
      }
    >
      {isRunning && <RunningIndicator />}
      <span className='text-2xl' role='img' aria-hidden='true'>
        {module.icon}
      </span>
      <span className='text-xs text-white/80 text-center truncate max-w-[60px]'>{module.name}</span>
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * RecentAppsSection
 *
 * Displays recently opened modules in a horizontal scrollable layout.
 * Returns null if there are no recent apps (SC-6.5).
 */
export const RecentAppsSection: React.FC<RecentAppsSectionProps> = ({ onLaunch }) => {
  const recentApps = useStartMenuStore((state) => state.recentApps);

  // Don't render if no recent apps (SC-6.5)
  if (recentApps.length === 0) {
    return null;
  }

  // Limit to MAX_DISPLAYED (SC-6.2)
  const displayedApps = recentApps.slice(0, MAX_DISPLAYED);

  return (
    <div data-testid='recent-apps' className='mb-3'>
      {/* Section Header */}
      <h2 className='flex items-center gap-1.5 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-1'>
        <ClockIcon />
        Recent
      </h2>

      {/* Horizontal Scroll Container */}
      <div
        data-testid='recent-apps-container'
        className='overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent'
      >
        <div className='flex gap-1 pb-1'>
          {/* Apps in most-recent-first order (SC-6.3) */}
          {displayedApps.map((module) => (
            <RecentAppTile key={module.id} module={module} onLaunch={onLaunch} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentAppsSection;
