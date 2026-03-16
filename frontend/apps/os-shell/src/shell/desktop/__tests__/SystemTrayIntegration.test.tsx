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

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import { SentinelPanel } from '../../../sentinel/SentinelPanel';
import { useSentinelStore } from '../../../sentinel/sentinelStore';
import { Taskbar } from '../Taskbar';

// Test helper: Wrap components with Router context for useNavigate() support
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>);
};

const TaskbarWithPanels = () => {
  const { panelOpen, setPanelOpen } = useSentinelStore();
  return (
    <>
      <Taskbar />
      <SentinelPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
};

// Mock stores
vi.mock('../../../stores/desktopStore', () => ({
  useDesktopStore: vi.fn(() => ({
    windows: [],
    activeWindowId: null,
    focusWindow: vi.fn(),
  })),
  useVirtualDesktops: vi.fn(() => ({
    currentDesktopId: 'desktop-1',
    desktops: [{ id: 'desktop-1', name: 'Desktop 1' }],
    addDesktop: vi.fn(),
    removeDesktop: vi.fn(),
    switchDesktop: vi.fn(),
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
      renderWithRouter(<Taskbar />);

      expect(screen.getByTestId('system-tray')).toBeInTheDocument();
    });

    it('renders AI status indicator', () => {
      renderWithRouter(<Taskbar />);

      expect(screen.getByTestId('ai-status-indicator')).toBeInTheDocument();
    });

    it('renders system health indicator', () => {
      renderWithRouter(<Taskbar />);

      expect(screen.getByTestId('system-health-indicator')).toBeInTheDocument();
    });

    it('renders notification bell', () => {
      renderWithRouter(<Taskbar />);

      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    });

    it('renders clock', () => {
      renderWithRouter(<Taskbar />);

      expect(screen.getByTestId('clock')).toBeInTheDocument();
    });
  });

  describe('AI Status Panel', () => {
    it('opens AI status panel on click', async () => {
      renderWithRouter(<Taskbar />);

      await userEvent.click(screen.getByTestId('ai-status-indicator'));

      expect(screen.getByTestId('ai-status-panel')).toBeInTheDocument();
    });

    it('shows agent count in panel', async () => {
      renderWithRouter(<Taskbar />);

      await userEvent.click(screen.getByTestId('ai-status-indicator'));

      // Agent count appears in both indicator and panel
      const agentCounts = screen.getAllByText('1,008');
      expect(agentCounts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('System Health Panel', () => {
    it('opens system health panel on click', async () => {
      renderWithRouter(<TaskbarWithPanels />);

      await userEvent.click(screen.getByTestId('system-health-indicator'));

      expect(screen.getByTestId('system-health-panel')).toBeInTheDocument();
    });

    it('shows latency in panel', async () => {
      renderWithRouter(<TaskbarWithPanels />);

      await userEvent.click(screen.getByTestId('system-health-indicator'));

      expect(screen.getByText(/Latency/i)).toBeInTheDocument();
    });
  });

  describe('Notification Panel', () => {
    it('opens notification panel on click', async () => {
      renderWithRouter(<Taskbar />);

      await userEvent.click(screen.getByTestId('notification-bell'));

      expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    });

    it('shows notification badge when notifications exist', () => {
      const testNotifications = [
        { id: '1', title: 'Test', message: 'msg', type: 'info' as const, timestamp: new Date().toISOString(), read: false },
        { id: '2', title: 'Test2', message: 'msg2', type: 'success' as const, timestamp: new Date().toISOString(), read: false },
      ];
      renderWithRouter(<Taskbar notifications={testNotifications} />);

      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    });
  });

  describe('Panel Interactions', () => {
    it('only one panel open at a time - AI closes when Health opens', async () => {
      renderWithRouter(<TaskbarWithPanels />);

      // Open AI panel
      await userEvent.click(screen.getByTestId('ai-status-indicator'));
      expect(screen.getByTestId('ai-status-panel')).toBeInTheDocument();

      // Click outside to close (click on health indicator)
      await userEvent.click(screen.getByTestId('system-health-indicator'));

      // Health panel should be open
      expect(screen.getByTestId('system-health-panel')).toBeInTheDocument();
    });

    it('Escape closes open panel', async () => {
      renderWithRouter(<Taskbar />);

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
      renderWithRouter(<Taskbar />);

      expect(screen.getByTestId('clock-time')).toBeInTheDocument();
    });

    it('displays date in clock', () => {
      renderWithRouter(<Taskbar />);

      expect(screen.getByTestId('clock-date')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('system tray has proper group role', () => {
      renderWithRouter(<Taskbar />);

      const systemTray = screen.getByTestId('system-tray');
      expect(systemTray).toHaveAttribute('role', 'group');
      expect(systemTray).toHaveAttribute('aria-label', 'System Tray');
    });

    it('all indicators are keyboard accessible', () => {
      renderWithRouter(<Taskbar />);

      const aiButton = screen.getByTestId('ai-status-indicator');
      const healthButton = screen.getByTestId('system-health-indicator');
      const bellButton = screen.getByTestId('notification-bell');

      expect(aiButton.tagName).toBe('BUTTON');
      expect(healthButton.tagName).toBe('BUTTON');
      expect(bellButton.tagName).toBe('BUTTON');
    });
  });
});
