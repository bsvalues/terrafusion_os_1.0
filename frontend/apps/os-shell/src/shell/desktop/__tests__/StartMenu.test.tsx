/**
 * TerraFusion OS Start Menu Component Tests
 * 
 * Government-Grade Start Menu Overlay
 * Tests for the app launcher overlay.
 * 
 * @module shell/desktop/__tests__/StartMenu.test
 */

import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartMenu } from '../StartMenu';
import { useStartMenuStore } from '../../../stores/startMenuStore';
import { useDesktopStore } from '../../../stores/desktopStore';

// Mock modules for testing
const mockModules = [
  { id: 'government-edition', name: 'Government Edition', icon: '🏛️', description: 'Core government', isPinned: true },
  { id: 'costforge-ai', name: 'CostForge AI', icon: '💰', description: 'Cost analysis', isPinned: true },
  { id: 'terra-levy', name: 'Terra Levy', icon: '📊', description: 'Tax levy', isPinned: true },
  { id: 'gis-pro', name: 'GIS Professional', icon: '🗺️', description: 'Geographic info', isPinned: true },
  { id: 'terra-agent', name: 'Terra Agent', icon: '🤖', description: 'AI agents', isPinned: false },
  { id: 'audit-tracker', name: 'Audit Tracker', icon: '📝', description: 'Audit trails', isPinned: false },
];

// Reset stores before each test
beforeEach(() => {
  useStartMenuStore.setState({
    isOpen: true, // Start with menu open for most tests
    searchQuery: '',
    modules: mockModules,
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
      const user = userEvent.setup();
      render(<StartMenu />);
      
      const searchInput = screen.getByRole('searchbox', { name: /search apps/i });
      await user.type(searchInput, 'government');
      
      expect(useStartMenuStore.getState().searchQuery).toBe('government');
    });

    it('filters apps in real-time', async () => {
      const user = userEvent.setup();
      render(<StartMenu />);
      
      const searchInput = screen.getByRole('searchbox', { name: /search apps/i });
      await user.type(searchInput, 'terra');
      
      // Should only show apps with "terra" in name
      expect(screen.getByText('Terra Levy')).toBeInTheDocument();
      expect(screen.getByText('Terra Agent')).toBeInTheDocument();
      expect(screen.queryByText('Government Edition')).not.toBeInTheDocument();
    });

    it('shows "no results" message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<StartMenu />);
      
      const searchInput = screen.getByRole('searchbox', { name: /search apps/i });
      await user.type(searchInput, 'xyznonexistent');
      
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
      const names = appButtons.map(btn => btn.textContent);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('App Launch', () => {
    it('opens window when app is clicked', async () => {
      const user = userEvent.setup();
      render(<StartMenu />);
      
      const govButton = screen.getByRole('button', { name: /government edition/i });
      await user.click(govButton);
      
      // Window should be opened
      const { windows } = useDesktopStore.getState();
      expect(windows).toHaveLength(1);
      expect(windows[0].moduleId).toBe('government-edition');
    });

    it('closes start menu after launching app', async () => {
      const user = userEvent.setup();
      render(<StartMenu />);
      
      const govButton = screen.getByRole('button', { name: /government edition/i });
      await user.click(govButton);
      
      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('clears search query after launching app', async () => {
      const user = userEvent.setup();
      useStartMenuStore.setState({ searchQuery: 'government' });
      render(<StartMenu />);
      
      const govButton = screen.getByRole('button', { name: /government edition/i });
      await user.click(govButton);
      
      expect(useStartMenuStore.getState().searchQuery).toBe('');
    });
  });

  describe('Close Behavior', () => {
    it('closes on Escape key press', async () => {
      const user = userEvent.setup();
      render(<StartMenu />);
      
      await user.keyboard('{Escape}');
      
      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('closes on click outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside" style={{ width: 100, height: 100 }} />
          <StartMenu />
        </div>
      );
      
      const outside = screen.getByTestId('outside');
      await user.click(outside);
      
      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports Tab navigation through apps', async () => {
      const user = userEvent.setup();
      render(<StartMenu />);
      
      // Tab through search and apps
      await user.tab();
      await user.tab();
      
      // Should have focus on an app button
      expect(document.activeElement?.getAttribute('role')).toBe('button');
    });

    it('launches app with Enter key', async () => {
      const user = userEvent.setup();
      render(<StartMenu />);
      
      // Tab to first app
      await user.tab(); // search
      await user.tab(); // first pinned app
      
      await user.keyboard('{Enter}');
      
      // Window should be opened
      expect(useDesktopStore.getState().windows.length).toBeGreaterThan(0);
    });

    it('supports arrow key navigation in pinned grid', async () => {
      const user = userEvent.setup();
      render(<StartMenu />);
      
      // Focus first pinned app
      const firstApp = screen.getByRole('button', { name: /government edition/i });
      firstApp.focus();
      
      // Arrow right should move to next app
      await user.keyboard('{ArrowRight}');
      
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
      const user = userEvent.setup();
      render(<StartMenu />);
      
      // Tab through all elements
      for (let i = 0; i < 20; i++) {
        await user.tab();
      }
      
      // Focus should stay within the menu
      const startMenu = screen.getByRole('menu', { name: /start menu/i });
      expect(startMenu.contains(document.activeElement)).toBe(true);
    });
  });
});
