/**
 * TerraFusion OS Window Peek Hook
 *
 * Manages hover delay behavior for window peek preview.
 * Shows preview after PEEK_DELAY_MS, hides after mouse leaves.
 *
 * @module hooks/useWindowPeek
 * @see Priority 13: Window Peek/Preview
 */

import { useCallback, useRef } from 'react';
import { PEEK_DELAY_MS, PEEK_HIDE_DELAY_MS, useWindowPeekStore } from '../stores/windowPeekStore';

export interface UseWindowPeekReturn {
  /** Call when mouse enters taskbar button */
  handleMouseEnter: (windowId: string, buttonRect: DOMRect) => void;
  /** Call when mouse leaves taskbar button */
  handleMouseLeave: () => void;
  /** Call when mouse enters peek panel (cancels hide timer) */
  handlePeekMouseEnter: () => void;
  /** Call when mouse leaves peek panel (starts hide timer) */
  handlePeekMouseLeave: () => void;
}

/**
 * Hook for managing window peek hover behavior with delay.
 *
 * Usage:
 * ```tsx
 * const { handleMouseEnter, handleMouseLeave } = useWindowPeek();
 *
 * <button
 *   onMouseEnter={() => handleMouseEnter(windowId, buttonRef.current!.getBoundingClientRect())}
 *   onMouseLeave={handleMouseLeave}
 * >
 *   ...
 * </button>
 * ```
 */
export function useWindowPeek(): UseWindowPeekReturn {
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { showPeek, hidePeek, setPending, clearPending } = useWindowPeekStore();

  const handleMouseEnter = useCallback(
    (windowId: string, buttonRect: DOMRect) => {
      // Clear any pending hide
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      // Clear any pending show
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }

      // Set pending
      setPending(windowId);

      // Calculate position (center of button, above taskbar)
      const position = {
        x: buttonRect.left + buttonRect.width / 2,
        y: buttonRect.top,
      };

      // Start delay timer
      showTimeoutRef.current = setTimeout(() => {
        showPeek(windowId, position);
        showTimeoutRef.current = null;
      }, PEEK_DELAY_MS);
    },
    [showPeek, setPending]
  );

  const handleMouseLeave = useCallback(() => {
    // Clear pending show
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    clearPending();

    // Add small delay before hiding (allows moving to peek popup)
    hideTimeoutRef.current = setTimeout(() => {
      hidePeek();
      hideTimeoutRef.current = null;
    }, PEEK_HIDE_DELAY_MS);
  }, [hidePeek, clearPending]);

  // Peek panel handlers (cancel/restart hide timer)
  const handlePeekMouseEnter = useCallback(() => {
    // Cancel any pending hide when mouse enters the peek panel
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handlePeekMouseLeave = useCallback(() => {
    // Start hide timer when mouse leaves the peek panel
    hideTimeoutRef.current = setTimeout(() => {
      hidePeek();
      hideTimeoutRef.current = null;
    }, PEEK_HIDE_DELAY_MS);
  }, [hidePeek]);

  return {
    handleMouseEnter,
    handleMouseLeave,
    handlePeekMouseEnter,
    handlePeekMouseLeave,
  };
}

export default useWindowPeek;
