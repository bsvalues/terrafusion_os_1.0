/**
 * useKeyboardShortcuts Hook
 * 
 * Reusable React hook for keyboard shortcut management
 * 
 * Features:
 * - Event listener setup/cleanup
 * - Modifier key detection (shift, ctrl, meta)
 * - Input field detection (skip shortcuts when typing)
 * - Custom event dispatching for inter-component communication
 * - Interaction tracking
 * 
 * Research Foundation:
 * - Keyboard efficiency: 2-3x faster than mouse (Card et al., 1983)
 * - Motor control: <500ms movement time optimization (Fitts' Law)
 */

import { useCallback, useEffect, useState } from 'react';
import type { KeyboardShortcut } from '../types';

export interface UseKeyboardShortcutsOptions {
  onInteraction?: () => void;
  enableAudioFeedback?: boolean;
  playSound?: () => void;
}

export interface UseKeyboardShortcutsReturn {
  shortcuts: KeyboardShortcut[];
  activeShortcut: string | null;
  shortcutUsageCount: number;
}

/**
 * Custom hook for keyboard shortcut management
 * 
 * @param options Configuration options
 * @returns Shortcut state and usage metrics
 */
export const useKeyboardShortcuts = (
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn => {
  const { onInteraction, enableAudioFeedback = true, playSound } = options;
  
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null);
  const [shortcutUsageCount, setShortcutUsageCount] = useState<number>(0);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if typing in input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const shift = e.shiftKey;
      const ctrl = e.ctrlKey || e.metaKey;

      let handled = false;
      let shortcutName = '';

      // Parameter shortcuts
      if (key === 'c') {
        window.dispatchEvent(
          new CustomEvent('quantum-adjust-coherence', {
            detail: { delta: shift ? -0.001 : 0.001 },
          })
        );
        shortcutName = shift ? 'Shift+C' : 'C';
        handled = true;
      }

      if (key === 'e') {
        window.dispatchEvent(
          new CustomEvent('quantum-adjust-entanglement', {
            detail: { delta: shift ? -0.001 : 0.001 },
          })
        );
        shortcutName = shift ? 'Shift+E' : 'E';
        handled = true;
      }

      if (key === 'o') {
        window.dispatchEvent(
          new CustomEvent('quantum-adjust-optimization', {
            detail: { delta: shift ? -1 : 1 },
          })
        );
        shortcutName = shift ? 'Shift+O' : 'O';
        handled = true;
      }

      // Action shortcuts
      if (key === ' ') {
        window.dispatchEvent(new CustomEvent('quantum-toggle-live-mode'));
        shortcutName = 'Space';
        handled = true;
      }

      if (key === 'r') {
        window.dispatchEvent(new CustomEvent('quantum-reset-optimal'));
        shortcutName = 'R';
        handled = true;
      }

      if (key === 'p') {
        window.dispatchEvent(new CustomEvent('quantum-preview-impact'));
        shortcutName = 'P';
        handled = true;
      }

      if (key === 'enter') {
        window.dispatchEvent(new CustomEvent('quantum-apply-changes'));
        shortcutName = 'Enter';
        handled = true;
      }

      // Save/Undo shortcuts
      if (ctrl && key === 's') {
        window.dispatchEvent(new CustomEvent('quantum-save-config'));
        shortcutName = 'Cmd+S';
        handled = true;
      }

      if (ctrl && key === 'z') {
        window.dispatchEvent(new CustomEvent('quantum-undo-change'));
        shortcutName = 'Cmd+Z';
        handled = true;
      }

      // Preset shortcuts (1-9)
      if (key >= '1' && key <= '9') {
        window.dispatchEvent(
          new CustomEvent('quantum-apply-preset', {
            detail: { presetNumber: parseInt(key) },
          })
        );
        shortcutName = key;
        handled = true;
      }

      // Navigation shortcuts
      if (key === '?') {
        window.dispatchEvent(new CustomEvent('keyboard-cheatsheet-toggle'));
        shortcutName = '?';
        handled = true;
      }

      if (key === 'tab') {
        if (!shift) {
          window.dispatchEvent(new CustomEvent('quantum-next-parameter'));
          shortcutName = 'Tab';
        } else {
          window.dispatchEvent(new CustomEvent('quantum-previous-parameter'));
          shortcutName = 'Shift+Tab';
        }
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        setActiveShortcut(shortcutName);
        setShortcutUsageCount((prev) => prev + 1);
        onInteraction?.();

        // Play audio feedback
        if (enableAudioFeedback && playSound) {
          playSound();
        }

        // Clear active shortcut after 1 second
        setTimeout(() => setActiveShortcut(null), 1000);
      }
    },
    [onInteraction, enableAudioFeedback, playSound]
  );

  /**
   * Setup keyboard event listener
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  /**
   * Shortcut definitions for documentation/help
   */
  const shortcuts: KeyboardShortcut[] = [
    // Parameters
    { key: 'c', action: 'quantum-adjust-coherence', description: 'Increase Coherence', category: 'parameters' },
    { key: 'c', shiftKey: true, action: 'quantum-adjust-coherence', description: 'Decrease Coherence', category: 'parameters' },
    { key: 'e', action: 'quantum-adjust-entanglement', description: 'Increase Entanglement', category: 'parameters' },
    { key: 'e', shiftKey: true, action: 'quantum-adjust-entanglement', description: 'Decrease Entanglement', category: 'parameters' },
    { key: 'o', action: 'quantum-adjust-optimization', description: 'Increase Optimization', category: 'parameters' },
    { key: 'o', shiftKey: true, action: 'quantum-adjust-optimization', description: 'Decrease Optimization', category: 'parameters' },
    
    // Actions
    { key: ' ', action: 'quantum-toggle-live-mode', description: 'Toggle Live Mode', category: 'actions' },
    { key: 'r', action: 'quantum-reset-optimal', description: 'Reset to Optimal', category: 'actions' },
    { key: 'p', action: 'quantum-preview-impact', description: 'Preview Impact', category: 'actions' },
    { key: 'enter', action: 'quantum-apply-changes', description: 'Apply Changes', category: 'actions' },
    { key: 's', ctrlKey: true, action: 'quantum-save-config', description: 'Save Config', category: 'actions' },
    { key: 'z', ctrlKey: true, action: 'quantum-undo-change', description: 'Undo', category: 'actions' },
    
    // Navigation
    { key: '1-9', action: 'quantum-apply-preset', description: 'Jump to Preset', category: 'navigation' },
    { key: 'tab', action: 'quantum-next-parameter', description: 'Next Parameter', category: 'navigation' },
    { key: 'tab', shiftKey: true, action: 'quantum-previous-parameter', description: 'Previous Parameter', category: 'navigation' },
    { key: '?', action: 'keyboard-cheatsheet-toggle', description: 'Show Help', category: 'navigation' },
  ];

  return {
    shortcuts,
    activeShortcut,
    shortcutUsageCount,
  };
};
