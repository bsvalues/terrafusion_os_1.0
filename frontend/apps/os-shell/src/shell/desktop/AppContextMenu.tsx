/**
 * TerraFusion OS App Context Menu Component
 *
 * Right-click context menu for apps in Start Menu.
 * Provides Pin/Unpin functionality and other app actions.
 *
 * SUCCESS CRITERIA:
 * - SC-6.13: Right-click shows context menu
 * - SC-6.14: "Pin to Start" option for unpinned apps
 * - SC-6.15: "Unpin from Start" option for pinned apps
 * - SC-6.16: Click outside closes menu
 * - SC-6.17: Escape closes menu
 * - SC-6.18: Menu positioned near cursor
 * - SC-6.19: All items have aria-labels
 * - SC-6.20: Context menu has role="menu"
 * - SC-6.21: Focus trapped in menu when open
 *
 * @module shell/desktop/AppContextMenu
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getLucideIcon } from '../../config/iconMap';
import { useStartMenuStore, type Module } from '../../stores/startMenuStore';
import { Z } from './zIndex';

// ============================================================================
// Types
// ============================================================================

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface AppContextMenuProps {
  /** The module to show the context menu for */
  module: Module | null;
  /** Position to display the menu at */
  position: ContextMenuPosition;
  /** Callback when menu should close */
  onClose: () => void;
}

// ============================================================================
// Icons
// ============================================================================

const PinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('w-4 h-4', className)}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
    aria-hidden='true'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'
    />
  </svg>
);

const UnpinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('w-4 h-4', className)}
    fill='currentColor'
    viewBox='0 0 24 24'
    aria-hidden='true'
  >
    <path d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' />
  </svg>
);

// ============================================================================
// Main Component
// ============================================================================

export const AppContextMenu: React.FC<AppContextMenuProps> = ({ module, position, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const pinnedApps = useStartMenuStore((state) => state.pinnedApps);
  const addPinnedApp = useStartMenuStore((state) => state.addPinnedApp);
  const removePinnedApp = useStartMenuStore((state) => state.removePinnedApp);
  if (!module) {
    return null;
  }

  const iconKey = module.icon || (module as any).iconName || 'Package';
  const Icon = getLucideIcon(iconKey);

  // Check if current module is pinned
  const isPinned = pinnedApps.some((app) => app.id === module.id);

  // Handle pin/unpin
  const handleTogglePin = useCallback(() => {
    if (!module) return;

    if (isPinned) {
      removePinnedApp(module.id);
    } else {
      addPinnedApp(module);
    }
    onClose();
  }, [module, isPinned, addPinnedApp, removePinnedApp, onClose]);

  // Focus first item on mount
  useEffect(() => {
    if (module && itemsRef.current[0]) {
      itemsRef.current[0].focus();
    }
  }, [module]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!module) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.min(prev + 1, itemsRef.current.length - 1);
            itemsRef.current[next]?.focus();
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            itemsRef.current[next]?.focus();
            return next;
          });
          break;
        case 'Tab': {
          e.preventDefault();
          // Trap focus in menu
          const direction = e.shiftKey ? -1 : 1;
          setFocusedIndex((prev) => {
            let next = prev + direction;
            if (next < 0) next = itemsRef.current.length - 1;
            if (next >= itemsRef.current.length) next = 0;
            itemsRef.current[next]?.focus();
            return next;
          });
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [module, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!module) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [module, onClose]);

  // Don't render if no module
  return (
    <div
      ref={menuRef}
      role='menu'
      aria-label={`Context menu for ${module.name}`}
      style={{ left: `${position.x}px`, top: `${position.y}px`, zIndex: Z.dockContextMenu }}
      className={cn(
        'fixed',
        'min-w-[180px]',
        'bg-[var(--tf-bg-surface)]/98 backdrop-blur-xl',
        'border border-white/10 rounded-lg',
        'shadow-[0_4px_20px_hsl(var(--tf-bg)/0.5)]',
        'py-1',
        'animate-in fade-in-0 zoom-in-95 duration-100'
      )}
    >
      {/* Menu Header */}
      <div className='flex items-center gap-2 px-3 py-2 border-b border-white/10'>
        <span className='text-lg' aria-hidden='true'>
          <Icon className='h-5 w-5 text-white' />
        </span>
        <span className='text-sm text-white/90 font-medium truncate'>{module.name}</span>
      </div>

      {/* Menu Items */}
      <div className='py-1'>
        {/* Pin/Unpin Option */}
        <button
          ref={(el) => {
            if (el) itemsRef.current[0] = el;
          }}
          role='menuitem'
          onClick={handleTogglePin}
          aria-label={isPinned ? 'Unpin from Start' : 'Pin to Start'}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2',
            'text-sm text-white/80',
            'hover:bg-white/10',
            'focus:outline-none focus:bg-white/10',
            'transition-colors duration-100'
          )}
        >
          {isPinned ? (
            <>
              <UnpinIcon className='text-white/60' />
              Unpin from Start
            </>
          ) : (
            <>
              <PinIcon className='text-white/60' />
              Pin to Start
            </>
          )}
        </button>

        {/* Open Option */}
        <button
          ref={(el) => {
            if (el) itemsRef.current[1] = el;
          }}
          role='menuitem'
          onClick={onClose}
          aria-label='Open'
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2',
            'text-sm text-white/80',
            'hover:bg-white/10',
            'focus:outline-none focus:bg-white/10',
            'transition-colors duration-100'
          )}
        >
          <svg
            className='w-4 h-4 text-white/60'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
            />
          </svg>
          Open
        </button>
      </div>
    </div>
  );
};

export default AppContextMenu;
