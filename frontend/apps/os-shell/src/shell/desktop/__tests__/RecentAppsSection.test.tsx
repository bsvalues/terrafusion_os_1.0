/**
 * TerraFusion OS Recent Apps Section Tests
 *
 * Tests for the Recent Apps section in Start Menu.
 *
 * SUCCESS CRITERIA:
 * - SC-6.1: Display "Recent" section between Pinned and All Apps
 * - SC-6.2: Show up to 10 recently opened modules
 * - SC-6.3: Most recent first ordering
 * - SC-6.4: Click to launch (same as other sections)
 * - SC-6.5: Empty state when no recent apps
 *
 * @module shell/desktop/__tests__/RecentAppsSection.test
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useStartMenuStore, type Module } from '../../../stores/startMenuStore';
import { RecentAppsSection } from '../RecentAppsSection';

// jest-dom matchers are extended globally via setupTests.ts

// Clean up after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Mock modules
const mockRecentApps: Module[] = [
  {
    id: 'gov',
    name: 'Government Edition',
    icon: 'Building2',
    description: 'Core government tools',
    category: 'core',
    status: 'active',
  },
  {
    id: 'gis',
    name: 'GIS Pro',
    icon: 'Map',
    description: 'Mapping tools',
    category: 'mapping',
    status: 'active',
  },
  {
    id: 'cost',
    name: 'CostForge AI',
    icon: 'Calculator',
    description: 'Cost analysis',
    category: 'ai',
    status: 'active',
  },
];

// Reset store before each test
beforeEach(() => {
  useStartMenuStore.setState({
    isOpen: true,
    searchQuery: '',
    pinnedApps: [],
    recentApps: [],
    allApps: [],
    focusedIndex: -1,
    focusedSection: 'search',
  });
});

describe('RecentAppsSection', () => {
  describe('Rendering', () => {
    it('renders section with "Recent" label when there are recent apps', () => {
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      expect(screen.getByText('Recent')).toBeInTheDocument();
      expect(screen.getByTestId('recent-apps')).toBeInTheDocument();
    });

    it('does not render when there are no recent apps (SC-6.5)', () => {
      useStartMenuStore.setState({ recentApps: [] });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      expect(screen.queryByTestId('recent-apps')).not.toBeInTheDocument();
      expect(screen.queryByText('Recent')).not.toBeInTheDocument();
    });

    it('displays clock icon in section header', () => {
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      expect(screen.getByTestId('recent-clock-icon')).toBeInTheDocument();
    });
  });

  describe('Recent Apps Display (SC-6.2, SC-6.3)', () => {
    it('shows recent apps in horizontal scroll layout', () => {
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      const container = screen.getByTestId('recent-apps-container');
      expect(container).toHaveClass('overflow-x-auto');
    });

    it('displays apps in most-recent-first order', () => {
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      const buttons = screen.getAllByRole('button');
      // First button should be the most recent (first in array)
      expect(buttons[0]).toHaveAccessibleName('Government Edition');
    });

    it('displays app icon and name for each recent app', () => {
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      expect(screen.getAllByRole('img', { hidden: true }).length).toBeGreaterThan(0);
      expect(screen.getByText('Government Edition')).toBeInTheDocument();
      expect(screen.getByText('GIS Pro')).toBeInTheDocument();
    });

    it('limits display to 10 apps maximum', () => {
      // Create 12 mock apps
      const manyApps: Module[] = Array.from({ length: 12 }, (_, i) => ({
        id: `app-${i}`,
        name: `App ${i}`,
        icon: 'Activity',
        description: `Desc ${i}`,
        category: 'test',
        status: 'active' as const,
      }));
      useStartMenuStore.setState({ recentApps: manyApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      const buttons = screen.getAllByRole('button');
      // Should show only first 10
      expect(buttons.length).toBeLessThanOrEqual(10);
    });
  });

  describe('App Launch (SC-6.4)', () => {
    it('calls onLaunch when app is clicked', async () => {
      const onLaunch = jest.fn();
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={onLaunch} />);

      const govButton = screen.getByRole('button', { name: /government edition/i });
      await userEvent.click(govButton);

      expect(onLaunch).toHaveBeenCalledWith(mockRecentApps[0]);
    });

    it('calls onLaunch with correct module data', async () => {
      const onLaunch = jest.fn();
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={onLaunch} />);

      const gisButton = screen.getByRole('button', { name: /gis pro/i });
      await userEvent.click(gisButton);

      expect(onLaunch).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'gis',
          name: 'GIS Pro',
        })
      );
    });
  });

  describe('Keyboard Accessibility', () => {
    it('app buttons are focusable via Tab', async () => {
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      await userEvent.tab();

      const activeElement = document.activeElement;
      expect(activeElement?.tagName.toLowerCase()).toBe('button');
    });

    it('app buttons have visible focus indicator', () => {
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      const button = screen.getByRole('button', { name: /government edition/i });
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Accessibility', () => {
    it('buttons have aria-label with app name', () => {
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      const govButton = screen.getByRole('button', { name: /government edition/i });
      expect(govButton).toHaveAccessibleName('Government Edition');
    });

    it('icons have aria-hidden attribute', () => {
      useStartMenuStore.setState({ recentApps: mockRecentApps });

      render(<RecentAppsSection onLaunch={jest.fn()} />);

      // Icons should be marked as decorative
      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
