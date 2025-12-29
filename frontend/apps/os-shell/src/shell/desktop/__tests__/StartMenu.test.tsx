/**
 * TerraFusion OS Start Menu Component Tests
 *
 * Government-Grade Start Menu Overlay
 * Tests for the app launcher overlay.
 *
 * @module shell/desktop/__tests__/StartMenu.test
 * @vitest-environment jsdom
 */

import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useDesktopStore } from '../../../stores/desktopStore';
import { useStartMenuStore } from '../../../stores/startMenuStore';
import { StartMenu } from '../StartMenu';

// Extend vitest expect with jest-dom matchers
expect.extend(matchers);

// Clean up DOM after each test
afterEach(() => {
  cleanup();
});

// Mock modules for testing - compatible with startMenuStore API
const mockPinnedApps = [
  {
    id: 'government-edition',
    name: 'Government Edition',
    icon: '🏛️',
    description: 'Core government',
    category: 'government',
    status: 'active' as const,
  },
  {
    id: 'costforge-ai',
    name: 'CostForge AI',
    icon: '💰',
    description: 'Cost analysis',
    category: 'finance',
    status: 'active' as const,
  },
  {
    id: 'terra-levy',
    name: 'Terra Levy',
    icon: '📊',
    description: 'Tax levy',
    category: 'finance',
    status: 'active' as const,
  },
  {
    id: 'gis-pro',
    name: 'GIS Professional',
    icon: '🗺️',
    description: 'Geographic info',
    category: 'mapping',
    status: 'active' as const,
  },
];

const mockAllApps = [
  ...mockPinnedApps,
  {
    id: 'terra-agent',
    name: 'Terra Agent',
    icon: '🤖',
    description: 'AI agents',
    category: 'ai',
    status: 'active' as const,
  },
  {
    id: 'audit-tracker',
    name: 'Audit Tracker',
    icon: '📝',
    description: 'Audit trails',
    category: 'compliance',
    status: 'active' as const,
  },
];

// Reset stores before each test
beforeEach(() => {
  useStartMenuStore.setState({
    isOpen: true, // Start with menu open for most tests
    searchQuery: '',
    pinnedApps: mockPinnedApps,
    allApps: mockAllApps,
  });
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
  });
});

describe('StartMenu Component', () => {
  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<StartMenu />);

      const startMenu = screen.getByRole('menu', { name: /start menu/i });
      expect(startMenu).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      useStartMenuStore.setState({ isOpen: false });
      render(<StartMenu />);

      const startMenu = screen.queryByRole('menu', { name: /start menu/i });
      expect(startMenu).not.toBeInTheDocument();
    });

    it('positions at bottom-left above taskbar', () => {
      render(<StartMenu />);

      const startMenu = screen.getByRole('menu', { name: /start menu/i });
      expect(startMenu).toHaveClass('bottom-14'); // Above 48px taskbar
      expect(startMenu).toHaveClass('left-1');
    });

    it('uses glass morphism styling', () => {
      render(<StartMenu />);

      const startMenu = screen.getByRole('menu', { name: /start menu/i });
      expect(startMenu).toHaveClass('backdrop-blur-xl');
    });
  });

  describe('Search Bar', () => {
    it('renders search input at top', () => {
      render(<StartMenu />);

      const searchInput = screen.getByRole('searchbox', { name: /search apps/i });
      expect(searchInput).toBeInTheDocument();
    });

    it('updates search query on input', async () => {
      render(<StartMenu />);

      const searchInput = screen.getByRole('searchbox', { name: /search apps/i });
      await userEvent.type(searchInput, 'government');

      expect(useStartMenuStore.getState().searchQuery).toBe('government');
    });

    it('filters apps in real-time', async () => {
      render(<StartMenu />);

      const searchInput = screen.getByRole('searchbox', { name: /search apps/i });
      await userEvent.type(searchInput, 'terra');

      // Should only show apps with "terra" in name
      expect(screen.getByText('Terra Levy')).toBeInTheDocument();
      expect(screen.getByText('Terra Agent')).toBeInTheDocument();
      expect(screen.queryByText('Government Edition')).not.toBeInTheDocument();
    });

    it('shows "no results" message when search has no matches', async () => {
      render(<StartMenu />);

      const searchInput = screen.getByRole('searchbox', { name: /search apps/i });
      await userEvent.type(searchInput, 'xyznonexistent');

      expect(screen.getByText(/no apps found/i)).toBeInTheDocument();
    });

    it('has search icon', () => {
      render(<StartMenu />);

      // Search icon should be visible (can be tested by test-id or aria-hidden element)
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('focuses search input when menu opens', () => {
      render(<StartMenu />);

      const searchInput = screen.getByRole('searchbox', { name: /search apps/i });
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Pinned Apps Grid', () => {
    it('renders pinned apps section', () => {
      render(<StartMenu />);

      const pinnedSection = screen.getByTestId('pinned-apps');
      expect(pinnedSection).toBeInTheDocument();
    });

    it('displays pinned apps label', () => {
      render(<StartMenu />);

      expect(screen.getByText('Pinned')).toBeInTheDocument();
    });

    it('shows only pinned apps in pinned section', () => {
      render(<StartMenu />);

      const pinnedSection = screen.getByTestId('pinned-apps');

      // Should show 4 pinned apps
      const pinnedButtons = within(pinnedSection).getAllByRole('button');
      expect(pinnedButtons).toHaveLength(4);
    });

    it('renders apps in 4-column grid', () => {
      render(<StartMenu />);

      const pinnedSection = screen.getByTestId('pinned-apps');
      expect(pinnedSection).toHaveClass('grid-cols-4');
    });

    it('displays app icon and name for each pinned app', () => {
      render(<StartMenu />);

      expect(screen.getByText('🏛️')).toBeInTheDocument();
      expect(screen.getByText('Government Edition')).toBeInTheDocument();
    });
  });

  describe('All Apps Section', () => {
    it('renders all apps section', () => {
      render(<StartMenu />);

      const allAppsSection = screen.getByTestId('all-apps');
      expect(allAppsSection).toBeInTheDocument();
    });

    it('displays all apps label', () => {
      render(<StartMenu />);

      expect(screen.getByText('All apps')).toBeInTheDocument();
    });

    it('shows all apps sorted alphabetically', () => {
      render(<StartMenu />);

      const allAppsSection = screen.getByTestId('all-apps');
      const appButtons = within(allAppsSection).getAllByRole('button');

      // Check alphabetical order
      const names = appButtons.map((btn) => btn.textContent);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('App Launch', () => {
    it('opens window when app is clicked', async () => {
      render(<StartMenu />);

      const govButton = screen.getByRole('button', { name: /government edition/i });
      await userEvent.click(govButton);

      // Window should be opened
      const { windows } = useDesktopStore.getState();
      expect(windows).toHaveLength(1);
      expect(windows[0].moduleId).toBe('government-edition');
    });

    it('closes start menu after launching app', async () => {
      render(<StartMenu />);

      const govButton = screen.getByRole('button', { name: /government edition/i });
      await userEvent.click(govButton);

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('clears search query after launching app', async () => {
      useStartMenuStore.setState({ searchQuery: 'government' });
      render(<StartMenu />);

      const govButton = screen.getByRole('button', { name: /government edition/i });
      await userEvent.click(govButton);

      expect(useStartMenuStore.getState().searchQuery).toBe('');
    });
  });

  describe('Close Behavior', () => {
    it('closes on Escape key press', async () => {
      render(<StartMenu />);

      await userEvent.keyboard('{Escape}');

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('closes on click outside', async () => {
      render(
        <div>
          <div data-testid='outside' style={{ width: 100, height: 100 }} />
          <StartMenu />
        </div>
      );

      const outside = screen.getByTestId('outside');
      await userEvent.click(outside);

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports Tab navigation through apps', async () => {
      render(<StartMenu />);

      // Tab through search and apps
      await userEvent.tab();
      await userEvent.tab();

      // Should have focus on an app button
      expect(document.activeElement?.getAttribute('role')).toBe('button');
    });

    it('launches app with Enter key', async () => {
      render(<StartMenu />);

      // Tab to first app
      await userEvent.tab(); // search
      await userEvent.tab(); // first pinned app

      await userEvent.keyboard('{Enter}');

      // Window should be opened
      expect(useDesktopStore.getState().windows.length).toBeGreaterThan(0);
    });

    it('supports arrow key navigation in pinned grid', async () => {
      render(<StartMenu />);

      // Focus first pinned app
      const firstApp = screen.getByRole('button', { name: /government edition/i });
      firstApp.focus();

      // Arrow right should move to next app
      await userEvent.keyboard('{ArrowRight}');

      // Focus should have moved
      expect(document.activeElement).not.toBe(firstApp);
    });
  });

  describe('User Profile Section', () => {
    it('renders user profile section at bottom', () => {
      render(<StartMenu />);

      const userSection = screen.getByTestId('user-profile');
      expect(userSection).toBeInTheDocument();
    });

    it('displays user avatar', () => {
      render(<StartMenu />);

      const avatar = screen.getByTestId('user-avatar');
      expect(avatar).toBeInTheDocument();
    });

    it('displays county name', () => {
      render(<StartMenu />);

      // Default county
      expect(screen.getByText(/benton county/i)).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('has slide-up animation class', () => {
      render(<StartMenu />);

      const startMenu = screen.getByRole('menu', { name: /start menu/i });
      expect(startMenu).toHaveClass('animate-slideUp');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles', () => {
      render(<StartMenu />);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('has proper focus trap when open', async () => {
      render(<StartMenu />);

      // Tab through all elements
      for (let i = 0; i < 20; i++) {
        await userEvent.tab();
      }

      // Focus should stay within the menu
      const startMenu = screen.getByRole('menu', { name: /start menu/i });
      expect(startMenu.contains(document.activeElement)).toBe(true);
    });
  });
});


