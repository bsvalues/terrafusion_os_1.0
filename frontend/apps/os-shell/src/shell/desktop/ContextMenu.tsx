/**
 * TerraFusion OS Context Menu Component
 *
 * Reusable right-click context menu with government-grade styling
 * - Absolute positioning near cursor
 * - Auto-close on outside click
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Disabled items
 * - Separator support
 * - TerraFusion brand styling
 *
 * @module shell/desktop/ContextMenu
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useRef } from 'react';
import { Z } from './zIndex';

// ============================================================================
// Types
// ============================================================================

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  separator?: boolean;
  onClick?: () => void;
  shortcut?: string;
}

export interface ContextMenuProps {
  /** Menu items to display */
  items: ContextMenuItem[];
  /** Position to render menu (from mouse event) */
  position: { x: number; y: number };
  /** Callback when menu should close */
  onClose: () => void;
  /** Optional className for additional styling */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ContextMenu - Right-click context menu
 *
 * Features:
 * - Absolute positioning near cursor
 * - Auto-close on outside click
 * - Keyboard navigation (↑/↓ arrow keys, Enter, Escape)
 * - Disabled and separator items
 * - TerraFusion brand styling (cyan accents)
 *
 * Usage:
 * ```tsx
 * {isMenuOpen && (
 *   <ContextMenu
 *     items={menuItems}
 *     position={menuPosition}
 *     onClose={() => setIsMenuOpen(false)}
 *   />
 * )}
 * ```
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onClose,
  className,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);

  /**
   * Handle item click
   */
  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled || item.separator) return;

      item.onClick?.();
      onClose();
    },
    [onClose]
  );

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const enabledItems = items.filter((item) => !item.disabled && !item.separator);

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % enabledItems.length);
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + enabledItems.length) % enabledItems.length);
          break;

        case 'Enter':
          e.preventDefault();
          handleItemClick(enabledItems[focusedIndex]);
          break;

        default:
          break;
      }
    },
    [items, focusedIndex, handleItemClick, onClose]
  );

  /**
   * Handle outside click
   */
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Setup event listeners
   */
  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleOutsideClick, handleKeyDown]);

  /**
   * Adjust menu position to stay on screen
   */
  const getAdjustedPosition = useCallback(() => {
    if (!menuRef.current) return position;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position if menu would overflow right edge
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 10;
    }

    // Adjust vertical position if menu would overflow bottom edge
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 10;
    }

    return { x: Math.max(0, x), y: Math.max(0, y) };
  }, [position]);

  const adjustedPosition = getAdjustedPosition();

  return (
    <div
      ref={menuRef}
      data-testid='context-menu'
      role='menu'
      className={cn(
        // Base styles
        'fixed',
        'min-w-[200px]',

        // Glass morphism
        'bg-[var(--tf-void-black)]/95 backdrop-blur-xl',

        // Border & Shadow
        'border border-[var(--tf-transcend-highlight)]/20',
        'rounded-lg',
        'shadow-[0_8px_32px_hsl(var(--tf-bg)/0.5),0_0_20px_hsl(var(--tf-accent)/0.1)]',

        // Padding
        'py-1',

        // Animation
        'animate-in fade-in zoom-in-95 duration-100',

        className
      )}
      style={{
        zIndex: Z.dockContextMenu,
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={item.id}
              data-testid={`context-menu-separator-${item.id}`}
              className='my-1 border-t border-white/10'
            />
          );
        }

        const isFocused = index === focusedIndex && !item.disabled;

        return (
          <button
            key={item.id}
            data-testid={`context-menu-item-${item.id}`}
            role='menuitem'
            disabled={item.disabled}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => !item.disabled && setFocusedIndex(index)}
            className={cn(
              // Base styles
              'w-full px-3 py-2',
              'flex items-center justify-between gap-3',
              'text-left text-sm',

              // Text color
              item.disabled ? 'text-white/30' : 'text-white',

              // Hover/Focus state
              !item.disabled && [
                'hover:bg-[var(--tf-transcend-highlight)]/10',
                'hover:text-[var(--tf-transcend-highlight)]',
                'transition-colors duration-100',
              ],

              // Focused state
              isFocused &&
                'bg-[var(--tf-transcend-highlight)]/10 text-[var(--tf-transcend-highlight)]',

              // Disabled cursor
              item.disabled && 'cursor-not-allowed'
            )}
          >
            <div className='flex items-center gap-2'>
              {item.icon && (
                <span className='text-base flex items-center justify-center' aria-hidden='true'>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </div>

            {item.shortcut && (
              <span className='text-xs text-white/40 font-mono'>{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
