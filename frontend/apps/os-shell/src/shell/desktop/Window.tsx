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
import { getObjectClassification } from '../../contracts/objectPlacement';
import { TerraSphereIcon } from '../../ui/brand/TerraSphereIcon';
import { LiquidPanel } from '../../ui/materials';
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

/** Window-chrome z-layering (scoped, not shell-level) */
const WINDOW_CHROME_Z = { titleControls: 50, titleCenter: 10 } as const;

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
    height: '14px',
    bottom: '0',
    left: '16px',
    right: '16px',
    cursor: 's-resize',
    zIndex: 9999,
  },
  bottomLeft: {
    position: 'absolute',
    width: '24px',
    height: '24px',
    bottom: '0',
    left: '0',
    cursor: 'sw-resize',
    zIndex: 9999,
  },
  bottomRight: {
    position: 'absolute',
    width: '24px',
    height: '24px',
    bottom: '0',
    right: '0',
    cursor: 'se-resize',
    zIndex: 9999,
  },
  left: {
    position: 'absolute',
    width: '14px',
    left: '0',
    top: '40px',
    bottom: '16px',
    cursor: 'w-resize',
    zIndex: 9999,
  },
  right: {
    position: 'absolute',
    width: '14px',
    right: '0',
    top: '40px',
    bottom: '16px',
    cursor: 'e-resize',
    zIndex: 9999,
  },
  top: {
    position: 'absolute',
    height: '8px',
    top: '0',
    left: '16px',
    right: '90px',
    cursor: 'n-resize',
    zIndex: 9999,
  },
  topLeft: {
    position: 'absolute',
    width: '24px',
    height: '24px',
    top: '0',
    left: '0',
    cursor: 'nw-resize',
    zIndex: 9999,
  },
  topRight: {
    position: 'absolute',
    width: '24px',
    height: '24px',
    top: '0',
    right: '0',
    cursor: 'ne-resize',
    zIndex: 9999,
  },
};

// ============================================================================
// Scroll Helpers
// ============================================================================

function isScrollableOverflow(value: string): boolean {
  return value === 'auto' || value === 'scroll' || value === 'overlay';
}

function canScrollVertically(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY === 'visible' ? style.overflow : style.overflowY;
  return isScrollableOverflow(overflowY) && element.scrollHeight > element.clientHeight;
}

function canScrollInDirection(element: HTMLElement, deltaY: number): boolean {
  if (deltaY < 0) {
    return element.scrollTop > 0;
  }

  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight;
  }

  return false;
}

function getWheelStartElement(target: EventTarget | null, boundary: HTMLElement): HTMLElement | null {
  if (target instanceof HTMLElement) {
    return target;
  }

  if (target instanceof Node) {
    return target.parentElement;
  }

  return boundary;
}

function findWheelScrollTarget(
  target: EventTarget | null,
  boundary: HTMLElement,
  deltaY: number,
): HTMLElement | null {
  let current = getWheelStartElement(target, boundary);

  while (current) {
    if (canScrollVertically(current) && canScrollInDirection(current, deltaY)) {
      return current;
    }

    if (current === boundary) {
      break;
    }

    current = current.parentElement;
  }

  return null;
}

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
        'group/btn w-8 h-8 rounded-full',
        'flex items-center justify-center',
        'transition-all duration-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'w-3 h-3 rounded-full flex items-center justify-center transition-all duration-100',
          disabled && '!bg-gray-500/50'
        )}
        style={
          disabled
            ? undefined
            : { backgroundColor: tokenColors[variant] }
        }
        onMouseEnter={(e) => {
          if (!disabled) (e.currentTarget as HTMLSpanElement).style.backgroundColor = tokenHoverColors[variant];
        }}
        onMouseLeave={(e) => {
          if (!disabled) (e.currentTarget as HTMLSpanElement).style.backgroundColor = tokenColors[variant];
        }}
      >
        <span className='text-[10px] leading-none font-bold text-black/0 group-hover/btn:text-black/80 transition-colors select-none'>
          {icons[variant]}
        </span>
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
  isTier0?: boolean;
  isPersistent?: boolean;
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
  isTier0 = false,
  isPersistent = false,
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
        className='group/controls flex items-center gap-2 relative pointer-events-auto'
        style={{ zIndex: WINDOW_CHROME_Z.titleControls }}
        data-testid='window-controls'
      >
        <WindowControlButton
          label={isPersistent ? 'Collapse' : 'Close'}
          onClick={handleClose}
          variant={isPersistent ? 'minimize' : 'close'}
        />
        <WindowControlButton label='Minimize' onClick={handleMinimize} variant='minimize' />
        <WindowControlButton
          label={isMaximized ? 'Restore' : 'Maximize'}
          onClick={handleMaximize}
          variant='maximize'
          disabled={isTier0}
        />
      </div>

      {/* Title (center) - pointer-events-none so it doesn't block */}
      <div className='flex items-center gap-2 absolute left-1/2 -translate-x-1/2 pointer-events-none' style={{ zIndex: WINDOW_CHROME_Z.titleCenter }}>
        <div role='img' aria-hidden='true'>
          <TerraSphereIcon size={24} variant='default' glyph={<Icon className='h-2.5 w-2.5' />} />
        </div>
        <span
          className={cn(
            'text-sm font-medium truncate max-w-[300px]',
            isActive ? 'text-[hsl(var(--tf-text))]' : 'text-[hsl(var(--tf-text)/0.5)]'
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
  const contentRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const isActive = windowData.id === activeWindowId;
  const isMaximized = windowData.state === 'maximized';
  const isMinimized = windowData.state === 'minimized';

  // Tier-0 workbench must stay maximized — no restore, no drag, no resize
  const classification = getObjectClassification(windowData.moduleId);
  const isTier0 = classification?.objectType === 'tier0-workbench';

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
  const { currentSnapZone, applySnap, clearPreview } = useWindowSnap({
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
    // Persistent windows (e.g., TerraPilot) minimize instead of closing
    if (windowData.metadata?.persistent) {
      minimizeWindow(windowData.id);
      return;
    }
    closeWindow(windowData.id);
  }, [closeWindow, minimizeWindow, windowData.id, windowData.metadata?.persistent]);

  const handleMinimize = useCallback(() => {
    minimizeWindow(windowData.id);
  }, [minimizeWindow, windowData.id]);

  const handleMaximize = useCallback(() => {
    // Tier-0 windows must stay maximized — block restore
    if (isTier0) return;
    if (isMaximized) {
      restoreWindow(windowData.id);
    } else {
      maximizeWindow(windowData.id);
    }
  }, [isTier0, isMaximized, maximizeWindow, restoreWindow, windowData.id]);

  const handleFocus = useCallback(() => {
    // Only bring to front if this is NOT already the active window.
    // If it is already active, clicking inside the content should do nothing.
    // Toggle-minimize belongs on the taskbar, not the window body.
    if (windowData.id !== activeWindowId) {
      focusWindow(windowData.id);
    }
  }, [focusWindow, windowData.id, activeWindowId]);

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

      // Always update position; also apply snap if in a snap zone
      updateWindowPosition(windowData.id, { x: data.x, y: data.y });
      if (shouldSnap) {
        applySnap();
      }

      // Clear snap preview
      clearPreview();
    },
    [updateWindowPosition, windowData.id, applySnap, clearPreview]
  );

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    if (windowData.id !== activeWindowId) {
      focusWindow(windowData.id);
    }
  }, [activeWindowId, focusWindow, windowData.id]);

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

  const handleWheelCapture = useCallback((e: WheelEvent) => {
    if (isInteracting || e.defaultPrevented || e.ctrlKey || e.deltaY === 0) {
      return;
    }

    const boundary = contentRef.current;
    if (!boundary) {
      return;
    }

    const scrollTarget = findWheelScrollTarget(e.target, boundary, e.deltaY);
    if (!scrollTarget) {
      return;
    }

    scrollTarget.scrollTop += e.deltaY;
    e.preventDefault();
  }, [isInteracting]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    content.addEventListener('wheel', handleWheelCapture, { capture: true, passive: false });
    return () => {
      content.removeEventListener('wheel', handleWheelCapture, true);
    };
  }, [handleWheelCapture]);

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
        bounds='window'
        dragHandleClassName='window-drag-handle'
        cancel='[data-testid="window-controls"], [data-testid="window-controls"] *'
        disableDragging={isMaximized || isTier0}
        enableResizing={
          isMaximized || isTier0
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
          data-testid='tf-window-animation'
          className='w-full h-full'
        >
        {/* ── Tier-0 surface (property-workbench) — no chrome, no titlebar ── */}
        {isTier0 ? (
          <div
            data-testid='tf-window-chrome'
            data-tier0='true'
            className='w-full h-full overflow-hidden'
            style={{ background: 'hsl(var(--tf-bg))' }}
          >
            <WindowInteractionContext.Provider value={{ isInteracting }}>
              {children}
            </WindowInteractionContext.Provider>
          </div>
        ) : (
        <LiquidPanel
          variant='shell'
          radius='lg'
          blurIntensity={3}
          data-testid='tf-window-chrome'
          className={cn(
            'flex flex-col w-full h-full',
            'transition-shadow duration-200'
          )}
          style={{
            border: isActive
              ? '0.5px solid hsl(var(--tf-border) / 0.5)'
              : '0.5px solid hsl(var(--tf-border) / 0.25)',
            boxShadow: isActive
              ? `
                0 0 0 0.5px hsl(var(--tf-accent) / 0.08),
                0 20px 50px hsl(222 24% 4% / 0.65),
                0 4px 12px hsl(222 24% 4% / 0.4),
                inset 0 0.5px 0 hsl(var(--tf-text) / 0.08)
              `
              : `
                0 10px 30px hsl(222 24% 4% / 0.5),
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
            isTier0={isTier0}
            isPersistent={!!windowData.metadata?.persistent}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onClose={handleClose}
            onContextMenu={handleContextMenu}
          />

          {/* Content Area
              overflow-hidden here: the window chrome never scrolls.
              Each module component owns its own scroll container.
              pointer-events blocked during drag/resize so the scroll
              container cannot intercept events meant for resize handles.
              onMouseDownCapture: intercepts events in the resize zone (within
              RESIZE_GUARD_PX of content edges) BEFORE inner module elements
              see them, preventing module scroll from competing with the handle. */}
          <div
            ref={contentRef}
            data-testid='window-content'
            className={cn('flex-1 overflow-hidden', 'rounded-b-lg')}
            style={{
              background: 'linear-gradient(180deg, transparent 0%, hsl(var(--tf-bg) / 0.15) 100%)',
              pointerEvents: isInteracting ? 'none' : 'auto',
              userSelect: isInteracting ? 'none' : 'auto',
            }}
            onMouseDownCapture={
              isMaximized || isTier0
                ? undefined
                : (e) => {
                    // Guard zone slightly wider than the handle itself so near-miss
                    // clicks near the edge don't start a module scroll.
                    const RESIZE_GUARD_PX = 20;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const nearEdge =
                      rect.right - e.clientX < RESIZE_GUARD_PX ||
                      rect.bottom - e.clientY < RESIZE_GUARD_PX ||
                      e.clientX - rect.left < RESIZE_GUARD_PX;
                    if (nearEdge) {
                      e.stopPropagation();
                      // Still bring the window to front even though we swallowed the event
                      if (windowData.id !== activeWindowId) {
                        focusWindow(windowData.id);
                      }
                    }
                  }
            }
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
                        className: 'h-10 w-10 text-[hsl(var(--tf-text))]',
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
        </LiquidPanel>
        )}
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
