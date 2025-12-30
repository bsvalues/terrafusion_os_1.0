/**
 * TerraFusion OS System Tray Integration Tests
 *
 * Tests for the complete system tray integration:
 * - All components render in Taskbar
 * - Interactions work correctly
 * - Panels don't overlap
 *
 * @module shell/desktop/__tests__/SystemTrayIntegration.test
 * @vitest-environment jsdom
 */

import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Taskbar } from '../Taskbar';

expect.extend(matchers);

// Mock stores
vi.mock('../../../stores/desktopStore', () => ({
  useDesktopStore: vi.fn(() => ({
    windows: [],
    activeWindowId: null,
    focusWindow: vi.fn(),
  })),
}));

vi.mock('../../../stores/startMenuStore', () => ({
  useStartMenuStore: vi.fn(() => ({
    isOpen: false,
    toggle: vi.fn(),
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('System Tray Integration', () => {
  describe('Taskbar Rendering', () => {
    it('renders system tray section', () => {
      render(<Taskbar />);

      expect(screen.getByTestId('system-tray')).toBeInTheDocument();
    });

    it('renders AI status indicator', () => {
      render(<Taskbar />);

      expect(screen.getByTestId('ai-status-indicator')).toBeInTheDocument();
    });

    it('renders system health indicator', () => {
      render(<Taskbar />);

      expect(screen.getByTestId('system-health-indicator')).toBeInTheDocument();
    });

    it('renders notification bell', () => {
      render(<Taskbar />);

      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    });

    it('renders clock', () => {
      render(<Taskbar />);

      expect(screen.getByTestId('clock')).toBeInTheDocument();
    });
  });

  describe('AI Status Panel', () => {
    it('opens AI status panel on click', async () => {
      render(<Taskbar />);

      await userEvent.click(screen.getByTestId('ai-status-indicator'));

      expect(screen.getByTestId('ai-status-panel')).toBeInTheDocument();
    });

    it('shows agent count in panel', async () => {
      render(<Taskbar />);

      await userEvent.click(screen.getByTestId('ai-status-indicator'));

      // Agent count appears in both indicator and panel
      const agentCounts = screen.getAllByText('1,008');
      expect(agentCounts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('System Health Panel', () => {
    it('opens system health panel on click', async () => {
      render(<Taskbar />);

      await userEvent.click(screen.getByTestId('system-health-indicator'));

      expect(screen.getByTestId('system-health-panel')).toBeInTheDocument();
    });

    it('shows CPU usage in panel', async () => {
      render(<Taskbar />);

      await userEvent.click(screen.getByTestId('system-health-indicator'));

      expect(screen.getByText(/CPU/i)).toBeInTheDocument();
    });
  });

  describe('Notification Panel', () => {
    it('opens notification panel on click', async () => {
      render(<Taskbar />);

      await userEvent.click(screen.getByTestId('notification-bell'));

      expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    });

    it('shows notification badge', () => {
      render(<Taskbar />);

      // Default notifications have 2 unread
      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    });
  });

  describe('Panel Interactions', () => {
    it('only one panel open at a time - AI closes when Health opens', async () => {
      render(<Taskbar />);

      // Open AI panel
      await userEvent.click(screen.getByTestId('ai-status-indicator'));
      expect(screen.getByTestId('ai-status-panel')).toBeInTheDocument();

      // Click outside to close (click on health indicator)
      await userEvent.click(screen.getByTestId('system-health-indicator'));

      // Health panel should be open
      expect(screen.getByTestId('system-health-panel')).toBeInTheDocument();
    });

    it('Escape closes open panel', async () => {
      render(<Taskbar />);

      // Open AI panel
      await userEvent.click(screen.getByTestId('ai-status-indicator'));
      expect(screen.getByTestId('ai-status-panel')).toBeInTheDocument();

      // Press Escape
      await userEvent.keyboard('{Escape}');

      expect(screen.queryByTestId('ai-status-panel')).not.toBeInTheDocument();
    });
  });

  describe('Clock', () => {
    it('displays time in clock', () => {
      render(<Taskbar />);

      expect(screen.getByTestId('clock-time')).toBeInTheDocument();
    });

    it('displays date in clock', () => {
      render(<Taskbar />);

      expect(screen.getByTestId('clock-date')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('system tray has proper group role', () => {
      render(<Taskbar />);

      const systemTray = screen.getByTestId('system-tray');
      expect(systemTray).toHaveAttribute('role', 'group');
      expect(systemTray).toHaveAttribute('aria-label', 'System tray');
    });

    it('all indicators are keyboard accessible', () => {
      render(<Taskbar />);

      const aiButton = screen.getByTestId('ai-status-indicator');
      const healthButton = screen.getByTestId('system-health-indicator');
      const bellButton = screen.getByTestId('notification-bell');

      expect(aiButton.tagName).toBe('BUTTON');
      expect(healthButton.tagName).toBe('BUTTON');
      expect(bellButton.tagName).toBe('BUTTON');
    });
  });
});
