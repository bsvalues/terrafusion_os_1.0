/**
 * TerraFusion OS Global Keyboard Shortcuts Hook
 *
 * Phase 7: Provides global keyboard shortcuts for module activation
 *
 * Shortcuts:
 * - Ctrl+1..7: Launch/Focus modules via activateModule()
 * - Ctrl+`: Toggle Start Menu
 * - Ctrl+K: Toggle Command Palette
 * - Ctrl+,: Open Settings
 * - Ctrl+\: Toggle TerraPilot companion panel
 * - Escape: Close Start Menu (if open)
 *
 * @module hooks/useKeyboardShortcuts
 * @see Phase 7: Keyboard Shortcuts
 * @see Priority 10: Global Search
 */

import { useCallback, useEffect } from 'react';
import { activateModule } from '../orchestration/moduleActivation';
import { useCommandPaletteStore } from '../stores/commandPaletteStore';
import { openCompanionWindow } from '../stores/desktopStore';
import { useStartMenuStore } from '../stores/startMenuStore';

/**
 * Module shortcut mapping: Ctrl+N → moduleId
 */
const MODULE_SHORTCUTS: Record<string, string> = {
  '1': 'costforge',
  '2': 'terra-gaia',
  '3': 'atlas-ai',
  '4': 'reporting',
  '5': 'marketplace',
  '6': 'counties',
  '7': 'government-architecture',
};

/**
 * Check if the currently focused element is an input-like element
 * where we should NOT intercept keyboard shortcuts
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea') {
    return true;
  }

  // Check for contenteditable (both property and attribute for JSDOM compatibility)
  if (element instanceof HTMLElement) {
    if (element.isContentEditable) {
      return true;
    }
    // Fallback: check attribute directly (for JSDOM)
    if (element.getAttribute('contenteditable') === 'true') {
      return true;
    }
  }

  return false;
}

/**
 * Global keyboard shortcuts hook for TerraFusion OS
 *
 * Usage:
 * ```tsx
 * function Desktop() {
 *   useKeyboardShortcuts();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useKeyboardShortcuts(): void {
  // Get start menu actions
  const toggleStartMenu = useStartMenuStore((state) => state.toggle);
  const closeStartMenu = useStartMenuStore((state) => state.close);
  const isStartMenuOpen = useStartMenuStore((state) => state.isOpen);

  // Get command palette actions
  const toggleCommandPalette = useCommandPaletteStore((state) => state.toggle);
  const closeCommandPalette = useCommandPaletteStore((state) => state.close);
  const isCommandPaletteOpen = useCommandPaletteStore((state) => state.isOpen);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrlKey, altKey, shiftKey, metaKey } = event;

      // ========================================
      // Escape: Close Command Palette or Start Menu (no modifiers)
      // ========================================
      if (key === 'Escape' && !ctrlKey && !altKey && !shiftKey && !metaKey) {
        if (isCommandPaletteOpen) {
          event.preventDefault();
          closeCommandPalette();
          return;
        }
        if (isStartMenuOpen) {
          event.preventDefault();
          closeStartMenu();
        }
        return;
      }

      // ========================================
      // Ctrl+K : Toggle Command Palette (global, works even in inputs)
      // ========================================
      if (key === 'k' && ctrlKey && !altKey && !shiftKey && !metaKey) {
        event.preventDefault();
        toggleCommandPalette();
        return;
      }

      // ========================================
      // Ctrl+` : Toggle Start Menu (global, works even in inputs)
      // ========================================
      if (key === '`' && ctrlKey && !altKey && !shiftKey && !metaKey) {
        event.preventDefault();
        toggleStartMenu();
        return;
      }

      // ========================================
      // Ctrl+, : Open Settings (global, works even in inputs)
      // ========================================
      if (key === ',' && ctrlKey && !altKey && !shiftKey && !metaKey) {
        event.preventDefault();
        activateModule('settings', {
          source: 'keyboard_shortcut',
          focusIfOpen: true,
        });
        return;
      }

      // ========================================
      // Ctrl+\ : Focus or spawn TerraPilot companion window (global)
      // ========================================
      if (key === '\\' && ctrlKey && !altKey && !shiftKey && !metaKey) {
        event.preventDefault();
        openCompanionWindow();
        return;
      }

      // ========================================
      // Ctrl+/ : Show Keyboard Shortcuts (global)
      // ========================================
      if (key === '/' && ctrlKey && !altKey && !shiftKey && !metaKey) {
        event.preventDefault();
        activateModule('shortcuts-help', {
          source: 'keyboard_shortcut',
          focusIfOpen: true,
        });
        return;
      }

      // ========================================
      // For remaining shortcuts, skip if in input element
      // ========================================
      if (isInputElement(document.activeElement)) {
        return;
      }

      // ========================================
      // Ctrl+1..7: Launch/Focus Module
      // ========================================
      if (ctrlKey && !altKey && !shiftKey && !metaKey) {
        const moduleId = MODULE_SHORTCUTS[key];
        if (moduleId) {
          event.preventDefault();
          activateModule(moduleId, {
            source: 'keyboard_shortcut',
            focusIfOpen: true, // SC-7.2: Focus existing window if already open
          });
          return;
        }
      }
    },
    [
      isStartMenuOpen,
      toggleStartMenu,
      closeStartMenu,
      isCommandPaletteOpen,
      toggleCommandPalette,
      closeCommandPalette,
    ]
  );

  useEffect(() => {
    // Register global keydown listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
