/**
 * TerraFusion OS Window Component
 *
 * Government-Grade Draggable/Resizable Window using react-rnd
 * - Draggable from title bar
 * - Resizable from all edges and corners
 * - Title bar with minimize/maximize/close buttons
 * - Z-index management for window stacking
 * - Connected to desktopStore
 *
 * @module shell/desktop/Window
 * @see SUCCESS CRITERIA SC-4
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useRef } from 'react';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import { DesktopWindow, useDesktopStore } from '../../stores/desktopStore';

// ============================================================================
// Types
// ============================================================================

export interface WindowProps {
  window: DesktopWindow;
  children?: React.ReactNode;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const TITLE_BAR_HEIGHT = 40;

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Window Control Button
 */
interface WindowControlButtonProps {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant: 'minimize' | 'maximize' | 'close';
  disabled?: boolean;
}

const WindowControlButton: React.FC<WindowControlButtonProps> = ({
  label,
  onClick,
  variant,
  disabled = false,
}) => {
  const colors = {
    minimize: 'bg-yellow-500 hover:bg-yellow-400',
    maximize: 'bg-green-500 hover:bg-green-400',
    close: 'bg-red-500 hover:bg-red-400',
  };

  const icons = {
    minimize: '−',
    maximize: '□',
    close: '×',
  };

  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-4 h-4 rounded-full',
        'flex items-center justify-center',
        'text-[10px] font-bold text-white',
        'opacity-70 hover:opacity-100',  // Always visible for government-grade UX
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        'hover:scale-110',
        colors[variant],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span>{icons[variant]}</span>
    </button>
  );
};

/**
 * Window Title Bar
 */
interface TitleBarProps {
  title: string;
  icon: string;
  isActive: boolean;
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  title,
  icon,
  isActive,
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
}) => {
  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onMinimize();
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onMaximize();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMaximize();
  };

  return (
    <div
      data-testid='window-titlebar'
      className={cn(
        'h-10 px-3',
        'flex items-center justify-between',
        'select-none cursor-default',
        'relative', // For positioning the drag handle
        // Background gradient
        isActive ? 'bg-gradient-to-r from-[#0a0e1a] via-[#1a1a2e] to-[#0a0e1a]' : 'bg-[#1a1a2e]/80',
        // Border
        'border-b border-[#00ffee]/20',
        // Rounded top
        'rounded-t-lg'
      )}
    >
      {/* Drag handle - covers most of title bar but NOT the controls */}
      <div
        className='window-drag-handle absolute inset-0 left-[90px] rounded-t-lg'
        onDoubleClick={handleDoubleClick}
      />

      {/* Window Controls (left) - NOT inside drag handle, so clicks work */}
      <div
        className='group/controls flex items-center gap-2 relative z-50 pointer-events-auto'
        data-testid='window-controls'
      >
        <WindowControlButton label='Close' onClick={handleClose} variant='close' />
        <WindowControlButton label='Minimize' onClick={handleMinimize} variant='minimize' />
        <WindowControlButton
          label={isMaximized ? 'Restore' : 'Maximize'}
          onClick={handleMaximize}
          variant='maximize'
        />
      </div>

      {/* Title (center) - pointer-events-none so it doesn't block */}
      <div className='flex items-center gap-2 absolute left-1/2 -translate-x-1/2 pointer-events-none z-10'>
        <span className='text-base' role='img' aria-hidden='true'>
          {icon}
        </span>
        <span
          className={cn(
            'text-sm font-medium truncate max-w-[300px]',
            isActive ? 'text-white' : 'text-white/60'
          )}
        >
          {title}
        </span>
      </div>

      {/* Spacer (right) - for balance */}
      <div className='w-[68px]' />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const Window: React.FC<WindowProps> = ({ window: windowData, children }) => {
  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useDesktopStore();

  const rndRef = useRef<Rnd>(null);
  const isActive = windowData.id === activeWindowId;
  const isMaximized = windowData.state === 'maximized';
  const isMinimized = windowData.state === 'minimized';

  // Handlers
  const handleFocus = useCallback(() => {
    if (!isActive) {
      focusWindow(windowData.id);
    }
  }, [isActive, focusWindow, windowData.id]);

  const handleClose = useCallback(() => {
    closeWindow(windowData.id);
  }, [closeWindow, windowData.id]);

  const handleMinimize = useCallback(() => {
    minimizeWindow(windowData.id);
  }, [minimizeWindow, windowData.id]);

  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      restoreWindow(windowData.id);
    } else {
      maximizeWindow(windowData.id);
    }
  }, [isMaximized, maximizeWindow, restoreWindow, windowData.id]);

  const handleDragStop: RndDragCallback = useCallback(
    (_e, data) => {
      updateWindowPosition(windowData.id, { x: data.x, y: data.y });
    },
    [updateWindowPosition, windowData.id]
  );

  const handleResizeStop: RndResizeCallback = useCallback(
    (_e, _direction, ref, _delta, position) => {
      updateWindowSize(windowData.id, {
        width: parseInt(ref.style.width, 10),
        height: parseInt(ref.style.height, 10),
      });
      updateWindowPosition(windowData.id, { x: position.x, y: position.y });
    },
    [updateWindowPosition, updateWindowSize, windowData.id]
  );

  // Don't render minimized windows
  if (isMinimized) {
    return null;
  }

  // Calculate position and size for maximized state
  const position = isMaximized ? { x: 0, y: 0 } : windowData.position;

  const size = isMaximized
    ? { width: '100%', height: '100%' } // Parent already accounts for taskbar
    : { width: windowData.size.width, height: windowData.size.height };

  return (
    <Rnd
      ref={rndRef}
      data-testid='window'
      data-window-id={windowData.id}
      position={position}
      size={size}
      minWidth={MIN_WIDTH}
      minHeight={MIN_HEIGHT}
      bounds='parent'
      dragHandleClassName='window-drag-handle'
      cancel='[data-testid="window-controls"], [data-testid="window-controls"] *'
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={handleFocus}
      style={{
        zIndex: windowData.zIndex,
      }}
      className={cn(
        // CRITICAL: Re-enable pointer events (parent has pointer-events-none)
        'pointer-events-auto',
        // Base styles
        'flex flex-col',
        // Glass morphism
        'bg-[#0a0e1a]/95 backdrop-blur-xl',
        // Border
        'rounded-lg',
        isActive
          ? 'border border-[#00ffee]/40 shadow-[0_0_30px_rgba(0,255,238,0.2),0_8px_32px_rgba(0,0,0,0.5)]'
          : 'border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        // Transition for smooth state changes
        'transition-shadow duration-200'
      )}
    >
      {/* Title Bar */}
      <TitleBar
        title={windowData.title}
        icon={windowData.icon}
        isActive={isActive}
        isMaximized={isMaximized}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
      />

      {/* Content Area */}
      <div
        data-testid='window-content'
        className={cn(
          'flex-1 overflow-auto',
          'rounded-b-lg',
          'bg-gradient-to-b from-transparent to-black/20'
        )}
      >
        {children ?? (
          <div className='flex items-center justify-center h-full p-4'>
            <div className='text-center'>
              <span className='text-4xl mb-4 block'>{windowData.icon}</span>
              <p className='text-white/70 text-sm'>{windowData.title}</p>
              <p className='text-white/40 text-xs mt-1'>Module ID: {windowData.moduleId}</p>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handles - visual indicators (react-rnd handles the actual resizing) */}
      {!isMaximized && (
        <>
          {/* Corner indicators */}
          <div className='absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity'>
            <div className='absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-[#00ffee]/50' />
          </div>
          <div className='absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize opacity-0 hover:opacity-100 transition-opacity'>
            <div className='absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-[#00ffee]/50' />
          </div>
          <div className='absolute top-0 right-0 w-4 h-4 cursor-ne-resize opacity-0 hover:opacity-100 transition-opacity'>
            <div className='absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-[#00ffee]/50' />
          </div>
          <div className='absolute top-0 left-0 w-4 h-4 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity'>
            <div className='absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-[#00ffee]/50' />
          </div>
        </>
      )}
    </Rnd>
  );
};

export default Window;
