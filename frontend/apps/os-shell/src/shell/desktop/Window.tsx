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
import { motion } from 'framer-motion';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import { getLucideIcon } from '../../config/iconMap';
import { useContextMenu } from '../../hooks/useContextMenu';
import { DesktopWindow, useDesktopStore } from '../../stores/desktopStore';
import { TerraSphereIcon } from '../../ui/brand/TerraSphereIcon';
import { useWindowSnap } from './useWindowSnap';
import { WINDOW_ANIMATION_TIMING, windowVariants } from './windowAnimations';
import { WindowContextMenu } from './WindowContextMenu';

// ============================================================================
// Window Interaction Context (for iframe mouse trap fix)
// ============================================================================

/**
 * Context to share window interaction state with children (especially iframes).
 * When isInteracting is true, iframes should disable pointer-events to prevent
 * stealing mouse events during drag/resize operations.
 */
export const WindowInteractionContext = createContext<{ isInteracting: boolean }>({
  isInteracting: false,
});

/**
 * Hook to check if the parent window is being dragged or resized.
 * Use this in iframe hosts to disable pointer-events during interaction.
 */
export function useWindowInteraction() {
  return useContext(WindowInteractionContext);
}

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

/** Resize handle configuration for react-rnd */
const RESIZE_HANDLE_CLASSES = {
  bottom: 'cursor-s-resize',
  bottomLeft: 'cursor-sw-resize',
  bottomRight: 'cursor-se-resize',
  left: 'cursor-w-resize',
  right: 'cursor-e-resize',
  top: 'cursor-n-resize',
  topLeft: 'cursor-nw-resize',
  topRight: 'cursor-ne-resize',
};

/** Style for resize handles - positioned INSIDE window for reliable hit detection */
const RESIZE_HANDLE_STYLES: Record<string, React.CSSProperties> = {
  bottom: {
    position: 'absolute',
    height: '10px',
    bottom: '0',
    left: '10px',
    right: '10px',
    cursor: 's-resize',
    zIndex: 9999,
  },
  bottomLeft: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    bottom: '0',
    left: '0',
    cursor: 'sw-resize',
    zIndex: 9999,
  },
  bottomRight: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    bottom: '0',
    right: '0',
    cursor: 'se-resize',
    zIndex: 9999,
  },
  left: {
    position: 'absolute',
    width: '10px',
    left: '0',
    top: '40px',
    bottom: '10px',
    cursor: 'w-resize',
    zIndex: 9999,
  },
  right: {
    position: 'absolute',
    width: '10px',
    right: '0',
    top: '40px',
    bottom: '10px',
    cursor: 'e-resize',
    zIndex: 9999,
  },
  top: {
    position: 'absolute',
    height: '6px',
    top: '0',
    left: '10px',
    right: '80px',
    cursor: 'n-resize',
    zIndex: 9999,
  },
  topLeft: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    top: '0',
    left: '0',
    cursor: 'nw-resize',
    zIndex: 9999,
  },
  topRight: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    top: '0',
    right: '0',
    cursor: 'ne-resize',
    zIndex: 9999,
  },
};

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
  const tokenColors = {
    minimize: 'hsl(var(--tf-wc-minimize))',
    maximize: 'hsl(var(--tf-wc-maximize))',
    close: 'hsl(var(--tf-wc-close))',
  };
  const tokenHoverColors = {
    minimize: 'hsl(var(--tf-wc-minimize-hover))',
    maximize: 'hsl(var(--tf-wc-maximize-hover))',
    close: 'hsl(var(--tf-wc-close-hover))',
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
        'group/btn w-3 h-3 rounded-full',
        'flex items-center justify-center',
        'transition-all duration-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        disabled && 'opacity-30 cursor-not-allowed !bg-gray-500/50'
      )}
      style={
        disabled
          ? undefined
          : { backgroundColor: tokenColors[variant] }
      }
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = tokenHoverColors[variant];
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = tokenColors[variant];
      }}
    >
      <span className='text-[8px] leading-none font-bold text-black/0 group-hover/btn:text-black/80 transition-colors select-none'>
        {icons[variant]}
      </span>
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
  onContextMenu: (e: React.MouseEvent) => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  title,
  icon,
  isActive,
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
  onContextMenu,
}) => {
  const Icon = getLucideIcon(icon);
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
      onContextMenu={onContextMenu}
      className={cn(
        'h-10 px-3',
        'flex items-center justify-between',
        'select-none cursor-default',
        'relative', // For positioning the drag handle
        // Rounded top
        'rounded-t-lg'
      )}
      style={{
        background: isActive
          ? 'hsl(var(--tf-surface-2) / 0.6)'
          : 'hsl(var(--tf-surface-2) / 0.45)',
        borderBottom: '1px solid hsl(var(--tf-border) / 0.3)',
      }}
    >
      {/* Drag handle - covers most of title bar but NOT the controls */}
      <div
        className='window-drag-handle absolute inset-0 left-[90px] rounded-t-lg'
        onDoubleClick={handleDoubleClick}
      />

      {/* Window Controls (left) - macOS traffic lights: close, minimize, maximize */}
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
        <div role='img' aria-hidden='true'>
          <TerraSphereIcon size={24} variant='default' glyph={<Icon className='h-2.5 w-2.5' />} />
        </div>
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
  const cursorRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const isActive = windowData.id === activeWindowId;
  const isMaximized = windowData.state === 'maximized';
  const isMinimized = windowData.state === 'minimized';

  // Animation state tracking
  const [animationState, setAnimationState] = useState<'opening' | 'open' | 'focused'>('opening');

  // Drag state tracking for window snapping
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | undefined>();

  // Combined interaction state for iframe mouse trap fix
  const isInteracting = isDragging || isResizing;

  // Escape hatch: reset interaction state on global mouseup/blur
  // This prevents stuck state if mouse is released outside window
  useEffect(() => {
    const resetInteraction = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    window.addEventListener('mouseup', resetInteraction);
    window.addEventListener('blur', resetInteraction);
    return () => {
      window.removeEventListener('mouseup', resetInteraction);
      window.removeEventListener('blur', resetInteraction);
    };
  }, []);

  // Window snapping hook
  const { applySnap, clearPreview } = useWindowSnap({
    windowId: windowData.id,
    isDragging,
    cursorPosition,
  });

  // Context menu state
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    handleContextMenu,
    closeMenu: closeContextMenu,
  } = useContextMenu();

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

  const handleFocus = useCallback(() => {
    focusWindow(windowData.id);
  }, [focusWindow, windowData.id]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Throttled drag handler - only update state every 50ms to reduce lag
  const lastDragUpdate = useRef(0);
  const handleDrag = useCallback((_e: any, _data: any) => {
    // Store cursor in ref (no re-render)
    if (_e && 'clientX' in _e && 'clientY' in _e) {
      cursorRef.current = { x: _e.clientX, y: _e.clientY };

      // Throttle state updates to 20fps for snap preview (minimal lag)
      const now = Date.now();
      if (now - lastDragUpdate.current > 50) {
        lastDragUpdate.current = now;
        setCursorPosition({ x: _e.clientX, y: _e.clientY });
      }
    }
  }, []);

  const handleDragStop: RndDragCallback = useCallback(
    (_e, data) => {
      setIsDragging(false);
      setCursorPosition(undefined);

      // Check if we should apply snap
      const shouldSnap = _e && 'clientX' in _e && 'clientY' in _e;

      if (shouldSnap) {
        // Apply snap if in snap zone
        applySnap();
      } else {
        // Just update position normally
        updateWindowPosition(windowData.id, { x: data.x, y: data.y });
      }

      // Clear snap preview
      clearPreview();
    },
    [updateWindowPosition, windowData.id, applySnap, clearPreview]
  );

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    focusWindow(windowData.id);
  }, [focusWindow, windowData.id]);

  const handleResizeStop: RndResizeCallback = useCallback(
    (_e, _direction, ref, _delta, position) => {
      setIsResizing(false);
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
    <>
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
        enableResizing={
          isMaximized
            ? false
            : {
                top: true,
                right: true,
                bottom: true,
                left: true,
                topRight: true,
                bottomRight: true,
                bottomLeft: true,
                topLeft: true,
              }
        }
        resizeHandleStyles={RESIZE_HANDLE_STYLES}
        resizeHandleClasses={RESIZE_HANDLE_CLASSES}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        onMouseDown={handleFocus}
        style={{
          zIndex: windowData.zIndex,
          pointerEvents: 'auto', // RE-ENABLE pointer events for Rnd + all resize handles
        }}
      >
        <motion.div
          data-testid='tf-window-chrome'
          initial='initial'
          animate={animationState}
          exit='closing'
          variants={windowVariants}
          transition={WINDOW_ANIMATION_TIMING.standard}
          onAnimationComplete={() => {
            if (animationState === 'opening') {
              setAnimationState('open');
            }
          }}
          className={cn(
            // Base styles
            'flex flex-col',
            'w-full h-full',
            // Border & rounded
            'rounded-lg',
            // Transition for smooth state changes
            'transition-shadow duration-200'
          )}
          style={{
            // macOS Tahoe glassmorphism — translucent with depth
            background: 'hsl(var(--tf-bg) / 0.68)',
            backdropFilter: 'saturate(180%) blur(28px)',
            WebkitBackdropFilter: 'saturate(180%) blur(28px)',
            border: isActive
              ? '0.5px solid hsl(var(--tf-text) / 0.12)'
              : '0.5px solid hsl(var(--tf-border) / 0.3)',
            boxShadow: isActive
              ? `
                0 24px 80px hsl(var(--tf-bg) / 0.55),
                0 8px 24px hsl(var(--tf-bg) / 0.3),
                inset 0 0.5px 0 hsl(var(--tf-text) / 0.08)
              `
              : `
                0 12px 40px hsl(var(--tf-bg) / 0.4),
                inset 0 0.5px 0 hsl(var(--tf-text) / 0.04)
              `,
          }}
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
            onContextMenu={handleContextMenu}
          />

          {/* Content Area */}
          <div
            data-testid='window-content'
            className={cn('flex-1 overflow-auto', 'rounded-b-lg')}
            style={{
              background: 'linear-gradient(180deg, transparent 0%, hsl(var(--tf-bg) / 0.15) 100%)',
            }}
          >
            <WindowInteractionContext.Provider value={{ isInteracting }}>
              {children ?? (
                <div
                  className='flex items-center justify-center h-full p-4'
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(var(--tf-bg) / 0.5) 0%, hsl(var(--tf-surface-2) / 0.3) 100%)',
                  }}
                >
                  <div className='text-center'>
                    <span
                      className='text-4xl mb-4 block'
                      style={{ filter: 'drop-shadow(0 0 15px hsl(var(--tf-accent) / 0.4))' }}
                    >
                      {React.createElement(getLucideIcon(windowData.icon), {
                        className: 'h-10 w-10 text-white',
                      })}
                    </span>
                    <p style={{ color: 'hsl(var(--tf-accent) / 0.8)' }} className='text-sm'>
                      {windowData.title}
                    </p>
                    <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>
                      Module ID: {windowData.moduleId}
                    </p>
                  </div>
                </div>
              )}
            </WindowInteractionContext.Provider>
          </div>
        </motion.div>
      </Rnd>

      {/* Window Context Menu */}
      {isContextMenuOpen && (
        <WindowContextMenu
          window={windowData}
          position={contextMenuPosition}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
};

export default Window;
