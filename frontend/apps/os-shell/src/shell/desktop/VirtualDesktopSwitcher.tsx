/**
 * TerraFusion OS Virtual Desktop Switcher (Task View)
 *
 * Government-Grade Virtual Desktop Management
 * Displays all virtual desktops with window counts, allows switching, adding, removing.
 *
 * @module shell/desktop/VirtualDesktopSwitcher
 * @see SUCCESS CRITERIA SC-9, Priority 9
 */

import { cn } from '@/lib/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { colors } from '../../design-system/tokens/colors';
import { useDesktopStore, useVirtualDesktops } from '../../stores/desktopStore';

interface VirtualDesktopSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Desktop Tile Component - Shows individual desktop with window count
 */
interface DesktopTileProps {
  desktopId: string;
  desktopName: string;
  isActive: boolean;
  windowCount: number;
  canRemove: boolean;
  onSwitch: () => void;
  onRemove: () => void;
}

const DesktopTile: React.FC<DesktopTileProps> = ({
  desktopId,
  desktopName,
  isActive,
  windowCount,
  canRemove,
  onSwitch,
  onRemove,
}) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid={`desktop-tile-${desktopId}`}
      role='button'
      tabIndex={0}
      aria-label={t('virtualDesktops.switchTo', { name: desktopName })}
      aria-selected={isActive}
      className={cn(
        // Layout
        'relative flex-shrink-0 w-44 h-28 rounded-lg',
        'border-2 transition-all duration-200 cursor-pointer group',
        isActive ? '' : 'border-white/20 hover:border-[var(--hover-border)]',
        // Focus states
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
      )}
      style={
        {
          backgroundColor: colors.utils.withOpacity(
            colors.semantic.background.void,
            isActive ? 0.9 : 0.6
          ),
          borderColor: isActive ? colors.brand.transcend[500] : undefined,
          boxShadow: isActive
            ? `0 0 20px ${colors.utils.withOpacity(colors.brand.transcend[500], 0.3)}`
            : undefined,
          '--hover-border': colors.utils.withOpacity(colors.brand.transcend[500], 0.5),
          '--tw-ring-color': colors.brand.transcend[500],
          '--tw-ring-offset-color': colors.semantic.background.void,
        } as React.CSSProperties
      }
      onClick={onSwitch}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSwitch();
        }
      }}
    >
      {/* Desktop Name */}
      <div className='absolute top-2 left-2 flex items-center gap-2'>
        <span
          className={cn('text-sm font-semibold', isActive ? '' : 'text-white/70')}
          style={{ color: isActive ? colors.brand.transcend[500] : undefined }}
        >
          {desktopName}
        </span>
      </div>

      {/* Window Count Badge */}
      {windowCount > 0 && (
        <div className='absolute top-2 right-2'>
          <div
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              isActive ? 'border' : 'bg-white/10 text-white/60 border border-white/20'
            )}
            style={
              isActive
                ? {
                    backgroundColor: colors.utils.withOpacity(colors.brand.transcend[500], 0.2),
                    color: colors.brand.transcend[500],
                    borderColor: colors.utils.withOpacity(colors.brand.transcend[500], 0.3),
                  }
                : undefined
            }
            data-testid={`window-count-${desktopId}`}
          >
            {windowCount} {windowCount === 1 ? 'window' : 'windows'}
          </div>
        </div>
      )}

      {/* Desktop Preview Area - Placeholder for future window thumbnails */}
      <div className='absolute inset-0 top-10 flex items-center justify-center'>
        <div
          className={cn('text-4xl opacity-20', isActive ? '' : 'text-white')}
          style={{ color: isActive ? colors.brand.transcend[500] : undefined }}
        >
          🖥️
        </div>
      </div>

      {/* Remove Button */}
      {canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            'absolute bottom-2 right-2',
            'w-6 h-6 rounded-full',
            'bg-red-500/20 text-red-400',
            'hover:bg-red-500 hover:text-white',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100',
            'transition-all duration-200',
            'focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-400'
          )}
          aria-label={t('virtualDesktops.remove')}
          title={t('virtualDesktops.remove')}
        >
          <span className='text-sm'>×</span>
        </button>
      )}

      {/* Active Indicator */}
      {isActive && (
        <div
          style={{ backgroundColor: colors.brand.transcend[500] }}
          className='absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-t-full'
        />
      )}
    </div>
  );
};

/**
 * Virtual Desktop Switcher - Main Component
 */
export const VirtualDesktopSwitcher: React.FC<VirtualDesktopSwitcherProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentDesktopId, desktops, addDesktop, removeDesktop, switchDesktop } =
    useVirtualDesktops();
  const windows = useDesktopStore((state) => state.windows);

  if (!isOpen) return null;

  // Count windows per desktop
  const getWindowCount = (desktopId: string) => {
    return windows.filter((w) => w.desktopId === desktopId).length;
  };

  const handleSwitch = (desktopId: string) => {
    switchDesktop(desktopId);
    onClose();
  };

  const cssVars = {
    '--tw-ring-color': colors.brand.transcend[500],
    '--add-hover-border': colors.utils.withOpacity(colors.brand.transcend[500], 0.7),
    '--add-hover-bg': colors.utils.withOpacity(colors.brand.transcend[500], 0.05),
    '--add-hover-text': colors.brand.transcend[500],
  } as React.CSSProperties;

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[1010]'
        onClick={onClose}
        data-testid='desktop-switcher-backdrop'
      />

      {/* Switcher Panel */}
      <div
        data-testid='virtual-desktop-switcher'
        role='dialog'
        aria-label={t('virtualDesktops.title')}
        aria-modal='true'
        className={cn(
          // Position
          'fixed bottom-16 left-1/2 -translate-x-1/2 z-[70]',
          // Size
          'w-[700px] max-w-[90vw]',
          // Glass effect
          'backdrop-blur-xl',
          'border',
          'rounded-xl',
          // Padding
          'p-6'
        )}
        style={{
          backgroundColor: colors.utils.withOpacity(colors.semantic.background.void, 0.95),
          borderColor: colors.utils.withOpacity(colors.brand.transcend[500], 0.3),
          boxShadow: `0 8px 32px ${colors.utils.withOpacity(colors.semantic.background.void, 0.5)}, 0 0 60px ${colors.utils.withOpacity(colors.brand.transcend[500], 0.2)}`,
          ...cssVars,
        }}
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-white font-bold text-lg flex items-center gap-2'>
            <span style={{ color: colors.brand.transcend[500] }}>🔲</span>
            {t('virtualDesktops.title')}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'w-8 h-8 rounded-md',
              'flex items-center justify-center',
              'text-white/60 hover:text-white hover:bg-white/10',
              'transition-all duration-150',
              'focus:outline-none focus-visible:ring-2'
            )}
            style={{ '--tw-ring-color': colors.brand.transcend[500] } as React.CSSProperties}
            aria-label={t('virtualDesktops.close')}
          >
            <span className='text-lg'>✕</span>
          </button>
        </div>

        {/* Desktop Grid */}
        <div className='flex gap-4 overflow-x-auto pb-2'>
          {desktops.map((desktop) => (
            <DesktopTile
              key={desktop.id}
              desktopId={desktop.id}
              desktopName={desktop.name}
              isActive={desktop.id === currentDesktopId}
              windowCount={getWindowCount(desktop.id)}
              canRemove={desktops.length > 1}
              onSwitch={() => handleSwitch(desktop.id)}
              onRemove={() => removeDesktop(desktop.id)}
            />
          ))}

          {/* Add Desktop Button */}
          <button
            onClick={addDesktop}
            data-testid='add-desktop-button'
            className={cn(
              'flex-shrink-0 w-44 h-28 rounded-lg',
              'border-2 border-dashed border-white/30',
              'hover:border-[var(--add-hover-border)] hover:bg-[var(--add-hover-bg)]',
              'flex flex-col items-center justify-center gap-2',
              'transition-all duration-200 group',
              'focus:outline-none focus-visible:ring-2'
            )}
            aria-label={t('virtualDesktops.new')}
            title={t('virtualDesktops.new')}
          >
            <span
              className={cn(
                'text-3xl text-white/40 transition-colors group-hover:text-[var(--add-hover-text)]'
              )}
            >
              +
            </span>
            <span
              className={cn(
                'text-xs text-white/40 transition-colors group-hover:text-[var(--add-hover-text)]'
              )}
            >
              New Desktop
            </span>
          </button>
        </div>

        {/* Hint Text */}
        <div className='mt-4 text-xs text-white/40 text-center'>
          <kbd className='px-2 py-1 bg-white/10 rounded'>Ctrl</kbd> +{' '}
          <kbd className='px-2 py-1 bg-white/10 rounded'>Win</kbd> +{' '}
          <kbd className='px-2 py-1 bg-white/10 rounded'>←</kbd>
          <kbd className='px-2 py-1 bg-white/10 rounded'>→</kbd> to switch
        </div>
      </div>
    </>
  );
};
