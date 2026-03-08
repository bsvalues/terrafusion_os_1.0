/**
 * TerraFusion OS Desktop Context Menu Component
 *
 * Right-click context menu for the desktop background.
 *
 * SUCCESS CRITERIA:
 * - SC-9.1: Right-click on desktop shows DesktopContextMenu
 * - SC-9.4: Click outside closes menu
 * - SC-9.5: Escape closes menu
 * - SC-9.6: Menu positioned at cursor
 * - SC-9.7: Menu has role="menu" and aria-labels
 *
 * @module shell/desktop/DesktopContextMenu
 * @see Priority 6: Context Menus
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Panel } from '@terrafusion/ui';
import { activateModule } from '../../orchestration/moduleActivation';
import { type ContextMenuPosition } from '../../hooks/useContextMenu';

// ============================================================================
// Types
// ============================================================================

export interface DesktopContextMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Position to display the menu at */
  position: ContextMenuPosition;
  /** Callback when menu should close */
  onClose: () => void;
}

// ============================================================================
// Icons
// ============================================================================

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    />
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </svg>
);

// ============================================================================
// Menu Items Definition
// ============================================================================

interface MenuItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  action: () => void;
  dividerAfter?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export const DesktopContextMenu: React.FC<DesktopContextMenuProps> = ({
  isOpen,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // ==========================================================================
  // Menu Actions
  // ==========================================================================

  const handleRefresh = useCallback(() => {
    // Refresh the desktop (no-op for now, could reload modules)
    onClose();
  }, [onClose]);

  const handleDisplaySettings = useCallback(() => {
    activateModule('settings', { source: 'context_menu' });
    onClose();
  }, [onClose]);

  const handleAbout = useCallback(() => {
    window.alert('TerraFusion OS 1.0\nBenton County, WA\n1,008 AI Agents\nFISMA-HIGH Compliant');
    onClose();
  }, [onClose]);

  // ==========================================================================
  // Menu Items
  // ==========================================================================

  const menuItems: MenuItem[] = [
    { id: 'refresh', label: 'Refresh', icon: RefreshIcon, action: handleRefresh },
    { id: 'display-settings', label: 'Display Settings', icon: SettingsIcon, action: handleDisplaySettings, dividerAfter: true },
    { id: 'about', label: 'About TerraFusion', icon: InfoIcon, action: handleAbout },
  ];

  // ==========================================================================
  // Focus Management
  // ==========================================================================

  useEffect(() => {
    if (isOpen && itemsRef.current[0]) {
      itemsRef.current[0].focus();
      setFocusedIndex(0);
    }
  }, [isOpen]);

  // ==========================================================================
  // Keyboard Navigation
  // ==========================================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.min(prev + 1, menuItems.length - 1);
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
            if (next < 0) next = menuItems.length - 1;
            if (next >= menuItems.length) next = 0;
            itemsRef.current[next]?.focus();
            return next;
          });
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, menuItems.length]);

  // ==========================================================================
  // Click Outside Handler
  // ==========================================================================

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClose]);

  // ==========================================================================
  // Render
  // ==========================================================================

  if (!isOpen) {
    return null;
  }

  return (
    <Panel
      ref={menuRef}
      role='menu'
      aria-label='Desktop context menu'
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={cn(
        'fixed z-[1020]',
        'min-w-[200px]',
        '!p-0 !rounded-lg py-1',
        'animate-in fade-in-0 zoom-in-95 duration-100'
      )}
    >
      {menuItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <button
            ref={(el) => {
              if (el) itemsRef.current[index] = el;
            }}
            role='menuitem'
            onClick={item.action}
            aria-label={item.label}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2',
              'text-sm text-white/80',
              'hover:bg-white/10',
              'focus:outline-none focus:bg-white/10',
              'transition-colors duration-100'
            )}
          >
            <item.icon className='text-white/60' />
            {item.label}
          </button>
          {item.dividerAfter && (
            <div className='my-1 border-t border-white/10' />
          )}
        </React.Fragment>
      ))}
    </Panel>
  );
};

export default DesktopContextMenu;
