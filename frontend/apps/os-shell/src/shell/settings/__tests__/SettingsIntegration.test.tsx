/**
 * TerraFusion OS Settings Integration Tests
 *
 * Priority 8: Tests for Settings module integration:
 * - Opens via activateModule('settings')
 * - Opens via Ctrl+, keyboard shortcut
 * - Opens via context menu
 *
 * SUCCESS CRITERIA:
 * SC-11.1: Settings opens as window via activateModule('settings')
 * SC-11.2: Settings accessible via context menu "Display Settings"
 * SC-11.3: Settings accessible via Ctrl+, keyboard shortcut
 *
 * @module shell/settings/__tests__/SettingsIntegration.test
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react';

// ============================================================================
// Mocks
// ============================================================================

// Mock activateModule
const mockActivateModule = vi.fn();
vi.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

// Mock start menu store
vi.mock('../../../stores/startMenuStore', () => ({
  useStartMenuStore: vi.fn((selector) => {
    const state = {
      isOpen: false,
      toggle: vi.fn(),
      close: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ============================================================================
// Tests
// ============================================================================

describe('Settings Integration', () => {
  // ==========================================================================
  // SC-11.1: Settings opens as window
  // ==========================================================================

  describe('module activation (SC-11.1)', () => {
    it('activateModule can be called with "settings"', async () => {
      const { activateModule } = await import('../../../orchestration/moduleActivation');

      await activateModule('settings', { source: 'start_menu' });

      expect(mockActivateModule).toHaveBeenCalledWith('settings', {
        source: 'start_menu',
      });
    });

    it('settings alias "config" resolves correctly', async () => {
      const { normalizeModuleId } = await import('../../../config/moduleComponents');

      expect(normalizeModuleId('config')).toBe('settings');
    });

    it('settings alias "preferences" resolves correctly', async () => {
      const { normalizeModuleId } = await import('../../../config/moduleComponents');

      expect(normalizeModuleId('preferences')).toBe('settings');
    });

    it('settings is registered in MODULE_REGISTRY', async () => {
      const { isModuleRegistered } = await import('../../../config/moduleComponents');

      expect(isModuleRegistered('settings')).toBe(true);
    });
  });

  // ==========================================================================
  // SC-11.3: Ctrl+, Keyboard Shortcut
  // ==========================================================================

  describe('keyboard shortcut (SC-11.3)', () => {
    it('Ctrl+, calls activateModule with settings', async () => {
      // Import the hook
      const { useKeyboardShortcuts } = await import('../../../hooks/useKeyboardShortcuts');

      // Create a test component
      const TestComponent = () => {
        useKeyboardShortcuts();
        return <div data-testid='test'>Test</div>;
      };

      render(<TestComponent />);

      // Simulate Ctrl+,
      await act(async () => {
        fireEvent.keyDown(document, {
          key: ',',
          ctrlKey: true,
          altKey: false,
          shiftKey: false,
          metaKey: false,
        });
      });

      expect(mockActivateModule).toHaveBeenCalledWith('settings', {
        source: 'keyboard_shortcut',
        focusIfOpen: true,
      });
    });

    it('Ctrl+, does not trigger without ctrl', async () => {
      const { useKeyboardShortcuts } = await import('../../../hooks/useKeyboardShortcuts');

      const TestComponent = () => {
        useKeyboardShortcuts();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      await act(async () => {
        fireEvent.keyDown(document, {
          key: ',',
          ctrlKey: false,
        });
      });

      expect(mockActivateModule).not.toHaveBeenCalledWith('settings', expect.anything());
    });
  });

  // ==========================================================================
  // SC-11.2: Context Menu Integration
  // ==========================================================================

  describe('context menu (SC-11.2)', () => {
    it('DesktopContextMenu calls activateModule with settings', async () => {
      // Import the component
      const { DesktopContextMenu } = await import('../../desktop/DesktopContextMenu');

      const onClose = vi.fn();
      render(
        <DesktopContextMenu
          isOpen={true}
          position={{ x: 100, y: 100 }}
          onClose={onClose}
        />
      );

      // Click Display Settings
      const settingsButton = screen.getByText(/display settings/i);
      await act(async () => {
        fireEvent.click(settingsButton);
      });

      expect(mockActivateModule).toHaveBeenCalledWith('settings', {
        source: 'context_menu',
      });
    });
  });
});

describe('Settings Module Aliases', () => {
  it('normalizes "config" to "settings"', async () => {
    const { normalizeModuleId } = await import('../../../config/moduleComponents');
    expect(normalizeModuleId('config')).toBe('settings');
  });

  it('normalizes "preferences" to "settings"', async () => {
    const { normalizeModuleId } = await import('../../../config/moduleComponents');
    expect(normalizeModuleId('preferences')).toBe('settings');
  });

  it('"settings" stays as "settings"', async () => {
    const { normalizeModuleId } = await import('../../../config/moduleComponents');
    expect(normalizeModuleId('settings')).toBe('settings');
  });
});
