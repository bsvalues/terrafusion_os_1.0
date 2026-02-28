/**
 * TerraFusion OS Taskbar Component Tests
 *
 * Government-Grade Desktop Taskbar
 * Tests for the main taskbar at bottom of desktop.
 *
 * @module shell/desktop/__tests__/Taskbar.test
 * @vitest-environment jsdom
 */

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Vitest imports removed - Jest globals used
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { useDesktopStore } from '../../../stores/desktopStore';
import { useStartMenuStore } from '../../../stores/startMenuStore';
import { Taskbar } from '../Taskbar';

// Test helper: Wrap components with Router context for useNavigate() support
const renderTaskbar = () => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Taskbar />
    </MemoryRouter>
  );
};

// Extend vitest expect with jest-dom matchers

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// Reset stores before each test
beforeEach(() => {
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
  });
  useStartMenuStore.setState({
    isOpen: false,
    searchQuery: '',
    modules: [],
  });
});

describe('Taskbar Component', () => {
  describe('Rendering', () => {
    it('renders taskbar at bottom of screen', () => {
      renderTaskbar();

      const taskbar = screen.getByRole('navigation', { name: /taskbar/i });
      expect(taskbar).toBeInTheDocument();
    });

    it('has fixed position styling', () => {
      renderTaskbar();

      const taskbar = screen.getByRole('navigation', { name: /taskbar/i });
      // macOS Tahoe floating dock: bottom-2 (not bottom-0)
      expect(taskbar).toHaveClass('fixed', 'bottom-2');
    });

    it('has correct height (48px)', () => {
      renderTaskbar();

      const taskbar = screen.getByRole('navigation', { name: /taskbar/i });
      expect(taskbar).toHaveClass('h-12'); // h-12 = 48px
    });

    it('uses TerraFusion design tokens (glass effect)', () => {
      renderTaskbar();

      const taskbar = screen.getByRole('navigation', { name: /taskbar/i });
      // LiquidPanel applies glass via CSS classes
      expect(taskbar.className).toContain('liquid-panel--shell');
    });
  });

  describe('Start Button', () => {
    it('renders start button with TerraFusion logo', () => {
      renderTaskbar();

      const startButton = screen.getByRole('button', { name: /start menu/i });
      expect(startButton).toBeInTheDocument();
    });

    it('toggles Start Menu when clicked', async () => {
      renderTaskbar();

      const startButton = screen.getByRole('button', { name: /start menu/i });

      // Initially closed
      expect(useStartMenuStore.getState().isOpen).toBe(false);

      // Click to open
      await userEvent.click(startButton);
      expect(useStartMenuStore.getState().isOpen).toBe(true);

      // Click to close
      await userEvent.click(startButton);
      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('shows visual indicator when Start Menu is open', () => {
      useStartMenuStore.setState({ isOpen: true });
      renderTaskbar();

      const startButton = screen.getByRole('button', { name: /start menu/i });
      expect(startButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper focus styles for accessibility', () => {
      renderTaskbar();

      const startButton = screen.getByRole('button', { name: /start menu/i });
      startButton.focus();

      // Should have visible focus ring
      expect(document.activeElement).toBe(startButton);
    });
  });

  describe('Running Apps Section', () => {
    it('renders running apps container when windows exist', () => {
      useDesktopStore.getState().openWindow('module-1', 'Module 1', 'BarChart3');
      renderTaskbar();

      const runningApps = screen.getByTestId('running-apps');
      expect(runningApps).toBeInTheDocument();
    });

    it('hides running apps section when no windows are open', () => {
      renderTaskbar();

      // macOS Tahoe dock: RunningApps returns null when empty
      const runningApps = screen.queryByTestId('running-apps');
      expect(runningApps).not.toBeInTheDocument();
    });

    it('shows app button for each open window', () => {
      // Open some windows
      useDesktopStore.getState().openWindow('module-1', 'Module 1', 'BarChart3');
      useDesktopStore.getState().openWindow('module-2', 'Module 2', 'TrendingUp');

      renderTaskbar();

      const runningApps = screen.getByTestId('running-apps');
      const buttons = within(runningApps).getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('displays window title as aria-label on app button', () => {
      useDesktopStore
        .getState()
        .openWindow('government-edition', 'Government Edition', 'Building2');

      renderTaskbar();

      // macOS Tahoe dock: icon-only buttons with aria-label for accessibility
      const button = screen.getByRole('button', { name: /government edition/i });
      expect(button).toBeInTheDocument();
    });

    it('displays window icon on app button', () => {
      useDesktopStore
        .getState()
        .openWindow('government-edition', 'Government Edition', 'Building2');

      renderTaskbar();

      const runningApps = screen.getByTestId('running-apps');
      expect(runningApps.querySelector('svg')).toBeInTheDocument();
    });

    it('highlights active window button', () => {
      const windowId = useDesktopStore.getState().openWindow('module-1', 'Module 1', 'BarChart3');

      renderTaskbar();

      const activeButton = screen.getByRole('button', { name: /module 1/i });
      expect(activeButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('focuses window when app button is clicked', async () => {
      const window1Id = useDesktopStore.getState().openWindow('module-1', 'Module 1', 'BarChart3');
      const window2Id = useDesktopStore.getState().openWindow('module-2', 'Module 2', 'TrendingUp');

      renderTaskbar();

      // window2 is active
      expect(useDesktopStore.getState().activeWindowId).toBe(window2Id);

      // Click on module 1 button
      const module1Button = screen.getByRole('button', { name: /module 1/i });
      await userEvent.click(module1Button);

      // window1 should now be active
      expect(useDesktopStore.getState().activeWindowId).toBe(window1Id);
    });

    it('restores minimized window when its button is clicked', async () => {
      const windowId = useDesktopStore.getState().openWindow('module-1', 'Module 1', 'BarChart3');
      useDesktopStore.getState().minimizeWindow(windowId);

      renderTaskbar();

      const window = useDesktopStore.getState().windows.find((w) => w.id === windowId);
      expect(window?.state).toBe('minimized');

      // Click on the taskbar button
      const module1Button = screen.getByRole('button', { name: /module 1/i });
      await userEvent.click(module1Button);

      // Window should be restored
      const updatedWindow = useDesktopStore.getState().windows.find((w) => w.id === windowId);
      expect(updatedWindow?.state).toBe('normal');
    });

    it('shows visual indicator for minimized windows', () => {
      const windowId = useDesktopStore.getState().openWindow('module-1', 'Module 1', 'BarChart3');
      useDesktopStore.getState().minimizeWindow(windowId);

      renderTaskbar();

      const module1Button = screen.getByRole('button', { name: /module 1/i });
      expect(module1Button).toHaveAttribute('data-minimized', 'true');
    });
  });

  describe('System Tray', () => {
    it('renders system tray section', () => {
      renderTaskbar();

      const systemTray = screen.getByTestId('system-tray');
      expect(systemTray).toBeInTheDocument();
    });

    it('displays current time', () => {
      renderTaskbar();

      // Should show time in HH:MM format
      const timeDisplay = screen.getByTestId('clock');
      expect(timeDisplay).toBeInTheDocument();
      expect(timeDisplay.textContent).toMatch(/\d{1,2}:\d{2}/);
    });

    it('displays AI agent status indicator', () => {
      renderTaskbar();

      const aiStatus = screen.getByTestId('ai-status-indicator');
      expect(aiStatus).toBeInTheDocument();
    });

    it('displays system health indicator', () => {
      renderTaskbar();

      const healthIndicator = screen.getByTestId('system-health-indicator');
      expect(healthIndicator).toBeInTheDocument();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('is keyboard navigable', async () => {
      renderTaskbar();

      // Tab to start button
      await userEvent.tab();
      expect(screen.getByRole('button', { name: /start menu/i })).toHaveFocus();
    });

    it('opens Start Menu with keyboard (Enter)', async () => {
      renderTaskbar();

      const startButton = screen.getByRole('button', { name: /start menu/i });
      startButton.focus();

      await userEvent.keyboard('{Enter}');

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('opens Start Menu with keyboard (Space)', async () => {
      renderTaskbar();

      const startButton = screen.getByRole('button', { name: /start menu/i });
      startButton.focus();

      await userEvent.keyboard(' ');

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('dock buttons use fixed icon size regardless of title length', () => {
      useDesktopStore
        .getState()
        .openWindow(
          'module-1',
          'This Is A Very Long Module Title That Should Be Truncated',
          'BarChart3'
        );

      renderTaskbar();

      // macOS Tahoe dock: icon-only buttons with fixed w-10 h-10 size
      const button = screen.getByRole('button', { name: /this is a very long/i });
      expect(button).toHaveClass('w-10', 'h-10');
    });
  });
});
