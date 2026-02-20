/**
 * TerraFusion OS Window Peek Component
 *
 * Shows a preview popup when hovering over taskbar buttons.
 * Features window title, icon, description, and close button.
 *
 * @module shell/desktop/WindowPeek
 * @see Priority 13: Window Peek/Preview
 */

import { cn } from '@/lib/utils';
import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getLucideIcon } from '../../config/iconMap';
import { useWindowPeek } from '../../hooks/useWindowPeek';
import { useDesktopStore } from '../../stores/desktopStore';
import {
  useWindowPeekPosition,
  useWindowPeekStore,
  useWindowPeekTarget,
  useWindowPeekVisible,
} from '../../stores/windowPeekStore';

// ============================================================================
// Types
// ============================================================================

export interface WindowPeekProps {
  /** Optional className */
  className?: string;
}

// ============================================================================
// Module Icons Map
// ============================================================================

const MODULE_DESCRIPTIONS: Record<string, string> = {
  costforge: 'Property Assessment & Cost Analysis',
  'terra-gaia': 'Geographic Information System',
  'atlas-ai': 'AI-Powered Intelligence Assistant',
  reporting: 'Analytics & Data Visualization',
  marketplace: 'Module Marketplace & Extensions',
  counties: 'County Administration Hub',
  'government-architecture': 'Government Systems Architecture',
  'levy-calculator': 'Tax Levy Calculations',
  'gis-viewer': 'Parcel & Map Viewer',
  'document-manager': 'Document Management System',
  settings: 'System Preferences',
  'shortcuts-help': 'Keyboard Shortcuts Reference',
};

// ============================================================================
// Main Component
// ============================================================================

export const WindowPeek: React.FC<WindowPeekProps> = ({ className }) => {
  const isVisible = useWindowPeekVisible();
  const targetWindowId = useWindowPeekTarget();
  const position = useWindowPeekPosition();
  const { hidePeek } = useWindowPeekStore();
  const { handlePeekMouseEnter, handlePeekMouseLeave } = useWindowPeek();

  const windows = useDesktopStore((state) => state.windows);
  const focusWindow = useDesktopStore((state) => state.focusWindow);
  const closeWindow = useDesktopStore((state) => state.closeWindow);

  // Get the target window data
  const targetWindow = windows.find((w) => w.id === targetWindowId);

  // Get module description
  const description = targetWindow?.moduleId
    ? MODULE_DESCRIPTIONS[targetWindow.moduleId] || 'TerraFusion Module'
    : 'Window';
  const iconName = targetWindow?.icon ?? 'Activity';
  const Icon = getLucideIcon(iconName);

  // Handle click to focus window
  const handleClick = useCallback(() => {
    if (targetWindowId) {
      focusWindow(targetWindowId);
      hidePeek();
    }
  }, [targetWindowId, focusWindow, hidePeek]);

  // Handle close button
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (targetWindowId) {
        closeWindow(targetWindowId);
        hidePeek();
      }
    },
    [targetWindowId, closeWindow, hidePeek]
  );

  // Don't render if not visible or no target
  if (!isVisible || !targetWindow || !position) {
    return null;
  }

  // Calculate popup position (above the taskbar button, centered)
  const popupStyle: React.CSSProperties = {
    left: position.x,
    bottom: 60, // Above taskbar (48px) + margin
    transform: 'translateX(-50%)',
  };

  const content = (
    <div
      data-testid='window-peek'
      role='tooltip'
      aria-label={`Preview of ${targetWindow.title}`}
      className={cn(
        // Position
        'fixed z-[9999]',
        // Size
        'w-64',
        // Background with glass effect
        'bg-[var(--tf-void-black)]/95 backdrop-blur-xl',
        // Border
        'border border-[var(--tf-transcend-highlight)]/30',
        // Shape
        'rounded-lg overflow-hidden',
        // Animation
        'animate-in fade-in slide-in-from-bottom-2 duration-150',
        className
      )}
      style={{
        ...popupStyle,
        boxShadow: '0 0 30px hsl(var(--tf-accent) / 0.2), 0 10px 40px hsl(var(--tf-bg) / 0.6)',
      }}
      onClick={handleClick}
      onMouseEnter={handlePeekMouseEnter}
      onMouseLeave={handlePeekMouseLeave}
    >
      {/* Header with close button */}
      <div className='flex items-center justify-between px-3 py-2 border-b border-white/10'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className='text-xl flex-shrink-0' aria-hidden='true'>
            <Icon className='h-5 w-5 text-white' />
          </span>
          <span className='text-sm font-medium text-white truncate'>{targetWindow.title}</span>
        </div>
        <button
          data-testid='window-peek-close'
          onClick={handleClose}
          aria-label={`Close ${targetWindow.title}`}
          className={cn(
            'flex items-center justify-center',
            'w-6 h-6 rounded',
            'text-white/60 hover:text-white hover:bg-red-500/80',
            'transition-colors duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)]'
          )}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className='p-3'>
        {/* Module description */}
        <p className='text-xs text-white/60 mb-3'>{description}</p>

        {/* Window state indicator */}
        <div className='flex items-center gap-2 text-xs'>
          {targetWindow.state === 'minimized' ? (
            <span className='flex items-center gap-1 text-yellow-400/80'>
              <span>⬇️</span> Minimized
            </span>
          ) : targetWindow.state === 'maximized' ? (
            <span className='flex items-center gap-1 text-green-400/80'>
              <span>⬆️</span> Maximized
            </span>
          ) : (
            <span className='flex items-center gap-1 text-[var(--tf-transcend-highlight)]/80'>
              <span>◻️</span> Normal
            </span>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className='px-3 py-2 bg-white/5 border-t border-white/10'>
        <p className='text-[10px] text-white/40 text-center'>Click to focus • Close with ✕</p>
      </div>

      {/* Arrow pointing down */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 -bottom-2',
          'w-0 h-0',
          'border-l-[8px] border-l-transparent',
          'border-r-[8px] border-r-transparent',
          'border-t-[8px] border-t-[var(--tf-void-black)]/95'
        )}
        aria-hidden='true'
      />
    </div>
  );

  // Render in portal to avoid z-index issues
  return createPortal(content, document.body);
};

export default WindowPeek;
