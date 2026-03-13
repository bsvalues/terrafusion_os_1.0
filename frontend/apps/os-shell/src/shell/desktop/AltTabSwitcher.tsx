/**
 * TerraFusion OS Alt+Tab Switcher Component
 *
 * Displays a centered overlay showing all eligible windows for Alt+Tab cycling.
 * Shows icon, title, and highlights the currently selected window.
 *
 * @module shell/desktop/AltTabSwitcher
 * @see Priority 14: Alt+Tab MVP
 */

import { cn } from '@/lib/utils';
import React from 'react';
import { useAltTabStore } from '../../stores/altTabStore';
import { useDesktopStore } from '../../stores/desktopStore';
import { Z } from './zIndex';

/**
 * Window Card Component - Single window in the Alt+Tab switcher
 */
interface WindowCardProps {
  windowId: string;
  title: string;
  icon: string;
  isSelected: boolean;
}

const WindowCard: React.FC<WindowCardProps> = ({ windowId, title, icon, isSelected }) => {
  return (
    <div
      data-testid={`alttab-window-${windowId}`}
      data-selected={isSelected}
      className={cn(
        // Layout
        'flex flex-col items-center justify-center gap-2',
        'w-32 h-32 rounded-lg',
        'border-2 transition-all duration-150',
        'p-3',
        // Background
        isSelected ? 'bg-[var(--tf-void-black)]/95' : 'bg-[var(--tf-void-black)]/80',
        // Border
        isSelected
          ? 'border-[var(--tf-transcend-highlight)] shadow-[0_0_20px_hsl(var(--tf-accent)/0.5)]'
          : 'border-white/20',
        // Focus
        'focus:outline-none'
      )}
      role='option'
      aria-selected={isSelected}
      id={`alttab-option-${windowId}`}
    >
      {/* Icon */}
      <span className='text-4xl' role='img' aria-hidden='true'>
        {icon}
      </span>

      {/* Title */}
      <span
        className={cn(
          'text-xs font-medium text-center truncate w-full',
          isSelected ? 'text-[var(--tf-transcend-highlight)]' : 'text-white/70'
        )}
      >
        {title}
      </span>
    </div>
  );
};

/**
 * Alt+Tab Switcher - Main Component
 */
export const AltTabSwitcher: React.FC = () => {
  const isOpen = useAltTabStore((state) => state.isOpen);
  const candidateWindowIds = useAltTabStore((state) => state.candidateWindowIds);
  const selectedIndex = useAltTabStore((state) => state.selectedIndex);
  const windows = useDesktopStore((state) => state.windows);

  if (!isOpen || candidateWindowIds.length === 0) {
    return null;
  }

  const selectedWindowId = candidateWindowIds[selectedIndex];

  // Build window lookup map
  const windowMap = new Map(windows.map((w) => [w.id, w]));

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-[hsl(var(--tf-bg)/0.6)] backdrop-blur-sm'
        style={{ zIndex: Z.altTabBackdrop }}
        data-testid='alttab-backdrop'
      />

      {/* Switcher Panel */}
      <div
        data-testid='alttab-switcher'
        role='listbox'
        aria-label='Window Switcher'
        aria-activedescendant={`alttab-option-${selectedWindowId}`}
        style={{ zIndex: Z.altTab }}
        className={cn(
          // Position
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          // Glass effect
          'bg-[var(--tf-void-black)]/95 backdrop-blur-xl',
          'border border-[var(--tf-transcend-highlight)]/30',
          'rounded-xl',
          // Shadow
          'shadow-[0_8px_32px_hsl(var(--tf-bg)/0.5),0_0_60px_hsl(var(--tf-accent)/0.2)]',
          // Padding
          'p-6'
        )}
      >
        {/* Header */}
        <div className='mb-4 text-center'>
          <h2 className='text-white/70 text-sm font-medium flex items-center justify-center gap-2'>
            <span className='text-[var(--tf-transcend-highlight)]'>⌨️</span>
            Alt+Tab Window Switcher
          </h2>
        </div>

        {/* Window Grid */}
        <div className='flex gap-4 overflow-x-auto pb-2'>
          {candidateWindowIds.map((windowId) => {
            const window = windowMap.get(windowId);
            if (!window) return null;

            return (
              <WindowCard
                key={windowId}
                windowId={windowId}
                title={window.title}
                icon={window.icon}
                isSelected={windowId === selectedWindowId}
              />
            );
          })}
        </div>

        {/* Hint Text */}
        <div className='mt-4 text-xs text-white/40 text-center'>
          <kbd className='px-2 py-1 bg-white/10 rounded'>Tab</kbd> or{' '}
          <kbd className='px-2 py-1 bg-white/10 rounded'>Shift+Tab</kbd> to cycle • Release{' '}
          <kbd className='px-2 py-1 bg-white/10 rounded'>Alt</kbd> to select •{' '}
          <kbd className='px-2 py-1 bg-white/10 rounded'>Esc</kbd> to cancel
        </div>
      </div>
    </>
  );
};
