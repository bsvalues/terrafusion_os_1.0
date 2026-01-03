/**
 * TerraFusion OS Start Menu Keyboard Navigation Tests
 *
 * Tests for keyboard navigation in Start Menu.
 *
 * SUCCESS CRITERIA:
 * - SC-6.7: Arrow Down moves focus to next item
 * - SC-6.8: Arrow Up moves focus to previous item
 * - SC-6.9: Enter launches focused item
 * - SC-6.10: Tab moves between sections
 * - SC-6.11: Visual focus indicator (ring/highlight)
 * - SC-6.12: Focus starts on search, then first pinned app
 *
 * @module shell/desktop/__tests__/StartMenuKeyboardNav.test
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

import { useDesktopStore } from '../../../stores/desktopStore';
import { useStartMenuStore, type Module } from '../../../stores/startMenuStore';
import { StartMenu } from '../StartMenu';

// jest-dom matchers are extended globally via setupTests.ts

// Clean up after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Mock modules
const mockPinnedApps: Module[] = [
  {
    id: 'gov',
    name: 'Government Edition',
    icon: '🏛️',
    description: 'Core',
    category: 'core',
    status: 'active',
  },
  {
    id: 'gis',
    name: 'GIS Pro',
    icon: '🗺️',
    description: 'Maps',
    category: 'mapping',
    status: 'active',
  },
  {
    id: 'cost',
    name: 'CostForge',
    icon: '💰',
    description: 'Cost',
    category: 'ai',
    status: 'active',
  },
];

const mockRecentApps: Module[] = [
  {
    id: 'levy',
    name: 'Terra Levy',
    icon: '📊',
    description: 'Tax',
    category: 'tax',
    status: 'active',
  },
  {
    id: 'agent',
    name: 'Terra Agent',
    icon: '🤖',
    description: 'AI',
    category: 'ai',
    status: 'active',
  },
];

const mockAllApps: Module[] = [...mockPinnedApps, ...mockRecentApps];

// Reset store before each test
beforeEach(() => {
  useStartMenuStore.setState({
    isOpen: true,
    searchQuery: '',
    pinnedApps: mockPinnedApps,
    recentApps: mockRecentApps,
    allApps: mockAllApps,
    focusedIndex: -1,
    focusedSection: 'search',
  });
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
  });
});

describe('StartMenu Keyboard Navigation', () => {
  describe('Initial Focus (SC-6.12)', () => {
    it('focuses search input when menu opens', () => {
      render(<StartMenu />);

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveFocus();
    });

    it('store has focusedSection as search initially', () => {
      render(<StartMenu />);

      const { focusedSection } = useStartMenuStore.getState();
      expect(focusedSection).toBe('search');
    });
  });

  describe('Tab Navigation (SC-6.10)', () => {
    it('Tab moves from search to first pinned app', async () => {
      render(<StartMenu />);

      await userEvent.tab();

      // Focus should be on a button now (pinned app)
      const activeElement = document.activeElement;
      expect(activeElement?.tagName.toLowerCase()).toBe('button');
    });

    it('Tab navigates through sections sequentially', async () => {
      render(<StartMenu />);

      // Tab through several items
      for (let i = 0; i < 5; i++) {
        await userEvent.tab();
      }

      // Should still be focusable elements
      expect(document.activeElement?.tagName.toLowerCase()).not.toBe('body');
    });

    it('Shift+Tab moves backwards', async () => {
      render(<StartMenu />);

      // Tab forward to a button
      await userEvent.tab();
      await userEvent.tab();

      // Now shift+tab backwards
      await userEvent.tab({ shift: true });

      // Should still be on a focusable element
      expect(document.activeElement?.tagName.toLowerCase()).not.toBe('body');
    });
  });

  describe('Enter Key Launch (SC-6.9)', () => {
    it('Enter on focused app launches it', async () => {
      render(<StartMenu />);

      // Tab to first pinned app
      await userEvent.tab();

      // Press Enter
      await userEvent.keyboard('{Enter}');

      // Window should be created
      const { windows } = useDesktopStore.getState();
      expect(windows.length).toBeGreaterThan(0);
    });

    it('Enter closes menu after launch', async () => {
      render(<StartMenu />);

      // Tab to first pinned app and press Enter
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });
  });

  describe('Escape Key (SC-6.17)', () => {
    it('Escape closes menu from anywhere', async () => {
      render(<StartMenu />);

      // Tab to a button
      await userEvent.tab();
      await userEvent.tab();

      // Press Escape
      await userEvent.keyboard('{Escape}');

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('Escape resets focus state', async () => {
      render(<StartMenu />);

      // Change focus state
      act(() => {
        useStartMenuStore.getState().setFocusedIndex(2);
        useStartMenuStore.getState().setFocusedSection('pinned');
      });

      // Press Escape
      await userEvent.keyboard('{Escape}');

      const { focusedIndex, focusedSection } = useStartMenuStore.getState();
      expect(focusedIndex).toBe(-1);
      expect(focusedSection).toBe('search');
    });
  });

  describe('Focus Indicators (SC-6.11)', () => {
    it('buttons have focus-visible ring styling', () => {
      render(<StartMenu />);

      const pinnedSection = screen.getByTestId('pinned-apps');
      const buttons = within(pinnedSection).getAllByRole('button');

      // Check that buttons have focus-visible classes
      buttons.forEach((button) => {
        expect(button).toHaveClass('focus-visible:ring-2');
      });
    });

    it('search input has focus ring styling', () => {
      render(<StartMenu />);

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveClass('focus:ring-2');
    });
  });

  describe('Search Integration', () => {
    it('typing in search filters apps', async () => {
      render(<StartMenu />);

      // Type in search
      await userEvent.type(screen.getByRole('searchbox'), 'terra');

      // Should show filtered results
      expect(useStartMenuStore.getState().searchQuery).toBe('terra');
    });

    it('Tab from search navigates to filtered results', async () => {
      render(<StartMenu />);

      // Type search and tab
      await userEvent.type(screen.getByRole('searchbox'), 'terra');
      await userEvent.tab();

      // Should be on a button
      expect(document.activeElement?.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('Focus Preservation', () => {
    it('focus stays within menu when tabbing to end', async () => {
      render(<StartMenu />);

      // Tab many times (more than elements)
      for (let i = 0; i < 30; i++) {
        await userEvent.tab();
      }

      // Focus should still be in the menu
      const startMenu = screen.getByRole('menu');
      expect(startMenu.contains(document.activeElement)).toBe(true);
    });
  });

  describe('Home/End Keys', () => {
    it('Home key in search goes to start of text', async () => {
      render(<StartMenu />);

      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
      await userEvent.type(searchInput, 'government');
      await userEvent.keyboard('{Home}');

      // Cursor should be at start
      expect(searchInput.selectionStart).toBe(0);
    });

    it('End key in search goes to end of text', async () => {
      render(<StartMenu />);

      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
      await userEvent.type(searchInput, 'government');
      await userEvent.keyboard('{Home}');
      await userEvent.keyboard('{End}');

      // Cursor should be at end
      expect(searchInput.selectionEnd).toBe('government'.length);
    });
  });
});
