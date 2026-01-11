/**
 * TerraFusion OS Settings Panel Tests
 *
 * Priority 8: Comprehensive tests for Settings Panel.
 *
 * SUCCESS CRITERIA:
 * SC-11.4: Tab navigation works
 * SC-11.5: Theme changes persist to themeStore
 * SC-11.6: Notification preferences persist to settingsStore
 * SC-11.7: Keyboard shortcuts displayed
 * SC-11.9: All controls are keyboard accessible
 * SC-11.10: Settings has proper ARIA labels
 *
 * @module shell/settings/__tests__/SettingsPanel.test
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useSettingsStore } from '../../../stores/settingsStore';
import { useThemeStore } from '../../../stores/themeStore';
import { SettingsPanel } from '../SettingsPanel';

// ============================================================================
// Mocks
// ============================================================================

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  act(() => {
    useThemeStore.getState().reset();
    useSettingsStore.getState().resetAll();
  });
});

afterEach(() => {
  cleanup();
});

// ============================================================================
// Tests
// ============================================================================

describe('SettingsPanel', () => {
  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('renders settings panel', () => {
      render(<SettingsPanel />);
      expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
    });

    it('renders all navigation tabs', () => {
      render(<SettingsPanel />);

      expect(screen.getByRole('tab', { name: /general/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /appearance/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /accessibility/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /shortcuts/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /about/i })).toBeInTheDocument();
    });

    it('defaults to General tab', () => {
      render(<SettingsPanel />);

      const generalTab = screen.getByRole('tab', { name: /general/i });
      expect(generalTab).toHaveAttribute('aria-selected', 'true');
    });

    it('respects initialTab prop', () => {
      render(<SettingsPanel initialTab='appearance' />);

      const appearanceTab = screen.getByRole('tab', { name: /appearance/i });
      expect(appearanceTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  // ==========================================================================
  // SC-11.4: Tab Navigation
  // ==========================================================================

  describe('tab navigation (SC-11.4)', () => {
    it('switches to Appearance tab on click', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel />);

      await user.click(screen.getByRole('tab', { name: /appearance/i }));

      expect(screen.getByRole('tab', { name: /appearance/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('switches to Accessibility tab on click', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel />);

      await user.click(screen.getByRole('tab', { name: /accessibility/i }));

      expect(screen.getByRole('tab', { name: /accessibility/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByText('High Contrast')).toBeInTheDocument();
    });

    it('switches to Notifications tab on click', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel />);

      await user.click(screen.getByRole('tab', { name: /notifications/i }));

      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    it('switches to Shortcuts tab on click', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel />);

      await user.click(screen.getByRole('tab', { name: /shortcuts/i }));

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('switches to About tab on click', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel />);

      await user.click(screen.getByRole('tab', { name: /about/i }));

      expect(screen.getByText('TerraFusion OS')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-11.5: Theme Changes
  // ==========================================================================

  describe('appearance settings (SC-11.5)', () => {
    it('changes theme to dark', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='appearance' />);

      await user.click(screen.getByRole('button', { name: /dark/i }));

      expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('changes theme to light', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='appearance' />);

      await user.click(screen.getByRole('button', { name: /light/i }));

      expect(useThemeStore.getState().theme).toBe('light');
    });

    it('changes theme to system', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='appearance' />);

      // First change away from system
      await user.click(screen.getByRole('button', { name: /dark/i }));
      // Then back to system
      await user.click(screen.getByRole('button', { name: /system/i }));

      expect(useThemeStore.getState().theme).toBe('system');
    });

    it('shows current theme as selected', () => {
      act(() => {
        useThemeStore.getState().setTheme('dark');
      });

      render(<SettingsPanel initialTab='appearance' />);

      const darkButton = screen.getByRole('button', { name: /dark/i });
      expect(darkButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // ==========================================================================
  // Accessibility Settings
  // ==========================================================================

  describe('accessibility settings', () => {
    it('toggles high contrast', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='accessibility' />);

      const toggle = screen.getByRole('switch', { name: /high contrast/i });
      await user.click(toggle);

      expect(useThemeStore.getState().highContrast).toBe(true);
    });

    it('toggles reduced motion', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='accessibility' />);

      const toggle = screen.getByRole('switch', { name: /reduce motion/i });
      await user.click(toggle);

      expect(useThemeStore.getState().reducedMotion).toBe(true);
    });

    it('changes font size via slider', () => {
      render(<SettingsPanel initialTab='accessibility' />);

      const slider = screen.getByRole('slider', { name: /font size/i });
      fireEvent.change(slider, { target: { value: '125' } });

      expect(useThemeStore.getState().fontSize).toBe(125);
    });

    it('displays current font size percentage', () => {
      act(() => {
        useThemeStore.getState().setFontSize(150);
      });

      render(<SettingsPanel initialTab='accessibility' />);

      expect(screen.getByText('150%')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-11.6: Notification Preferences
  // ==========================================================================

  describe('notification settings (SC-11.6)', () => {
    it('toggles notifications enabled', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='notifications' />);

      const toggle = screen.getByRole('switch', { name: /enable notifications/i });
      await user.click(toggle);

      expect(useSettingsStore.getState().notifications.enabled).toBe(false);
    });

    it('toggles show toasts', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='notifications' />);

      const toggle = screen.getByRole('switch', { name: /show toast popups/i });
      await user.click(toggle);

      expect(useSettingsStore.getState().notifications.showToasts).toBe(false);
    });

    it('toggles play sound', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='notifications' />);

      const toggle = screen.getByRole('switch', { name: /play sound/i });
      await user.click(toggle);

      expect(useSettingsStore.getState().notifications.playSound).toBe(true);
    });

    it('changes auto-dismiss duration', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='notifications' />);

      await user.click(screen.getByRole('button', { name: /3 seconds/i }));

      expect(useSettingsStore.getState().notifications.autoDismissMs).toBe(3000);
    });

    it('sets auto-dismiss to never', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='notifications' />);

      await user.click(screen.getByRole('button', { name: /never/i }));

      expect(useSettingsStore.getState().notifications.autoDismissMs).toBe(0);
    });

    it('toggles module launch notifications', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='notifications' />);

      const toggle = screen.getByRole('switch', { name: /module launch/i });
      await user.click(toggle);

      expect(useSettingsStore.getState().notifications.showModuleLaunch).toBe(false);
    });

    it('toggles system events notifications', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='notifications' />);

      const toggle = screen.getByRole('switch', { name: /system events/i });
      await user.click(toggle);

      expect(useSettingsStore.getState().notifications.showSystemEvents).toBe(false);
    });
  });

  // ==========================================================================
  // SC-11.7: Keyboard Shortcuts Display
  // ==========================================================================

  describe('shortcuts display (SC-11.7)', () => {
    it('displays module shortcuts', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='shortcuts' />);

      expect(screen.getByText('Ctrl+1')).toBeInTheDocument();
      expect(screen.getByText(/costforge/i)).toBeInTheDocument();
    });

    it('displays navigation shortcuts', async () => {
      render(<SettingsPanel initialTab='shortcuts' />);

      expect(screen.getByText('Ctrl+`')).toBeInTheDocument();
      const startMenuItems = screen.getAllByText(/toggle start menu/i);
      expect(startMenuItems.length).toBeGreaterThan(0);
    });

    it('displays window shortcuts', async () => {
      render(<SettingsPanel initialTab='shortcuts' />);

      expect(screen.getByText('Win+Left')).toBeInTheDocument();
      expect(screen.getByText(/snap.*left/i)).toBeInTheDocument();
    });

    it('displays settings shortcut', async () => {
      render(<SettingsPanel initialTab='shortcuts' />);

      expect(screen.getByText('Ctrl+,')).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });

    it('groups shortcuts by category', async () => {
      render(<SettingsPanel initialTab='shortcuts' />);

      expect(screen.getByText('Modules')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Windows')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-11.10: Accessibility / ARIA
  // ==========================================================================

  describe('accessibility (SC-11.10)', () => {
    it('tabs have role="tab"', () => {
      render(<SettingsPanel />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(6);
    });

    it('tab list has role="tablist"', () => {
      render(<SettingsPanel />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('content has role="tabpanel"', () => {
      render(<SettingsPanel />);

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('active tab has aria-selected="true"', () => {
      render(<SettingsPanel />);

      const generalTab = screen.getByRole('tab', { name: /general/i });
      expect(generalTab).toHaveAttribute('aria-selected', 'true');
    });

    it('inactive tabs have aria-selected="false"', () => {
      render(<SettingsPanel />);

      const appearanceTab = screen.getByRole('tab', { name: /appearance/i });
      expect(appearanceTab).toHaveAttribute('aria-selected', 'false');
    });

    it('toggle switches have role="switch"', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='accessibility' />);

      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThan(0);
    });

    it('toggle switches have aria-checked', async () => {
      render(<SettingsPanel initialTab='accessibility' />);

      const highContrastToggle = screen.getByRole('switch', { name: /high contrast/i });
      expect(highContrastToggle).toHaveAttribute('aria-checked', 'false');
    });

    it('slider has accessible label', () => {
      render(<SettingsPanel initialTab='accessibility' />);

      const slider = screen.getByRole('slider', { name: /font size/i });
      expect(slider).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // About Section
  // ==========================================================================

  describe('about section', () => {
    it('displays TerraFusion OS branding', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel initialTab='about' />);

      expect(screen.getByText('TerraFusion OS')).toBeInTheDocument();
      expect(screen.getByText(/government-grade/i)).toBeInTheDocument();
    });

    it('displays version information', async () => {
      render(<SettingsPanel initialTab='about' />);

      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    it('displays copyright notice', async () => {
      render(<SettingsPanel initialTab='about' />);

      expect(screen.getByText(/2025 TerraFusion/)).toBeInTheDocument();
    });
  });
});
