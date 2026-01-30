/**
 * TerraFusion OS App Context Menu Tests
 *
 * Tests for right-click context menu in Start Menu.
 *
 * SUCCESS CRITERIA:
 * - SC-6.13: Right-click shows context menu
 * - SC-6.14: "Pin to Start" option for unpinned apps
 * - SC-6.15: "Unpin from Start" option for pinned apps
 * - SC-6.16: Click outside closes menu
 * - SC-6.17: Escape closes menu
 * - SC-6.18: Menu positioned near cursor
 * - SC-6.19: All items have aria-labels
 * - SC-6.20: Context menu has role="menu"
 * - SC-6.21: Focus trapped in menu when open
 *
 * @module shell/desktop/__tests__/AppContextMenu.test
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useStartMenuStore, type Module } from '../../../stores/startMenuStore';
import { AppContextMenu, type ContextMenuPosition } from '../AppContextMenu';

// jest-dom matchers are extended globally via setupTests.ts

// Clean up after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Mock module
const mockModule: Module = {
  id: 'gov',
  name: 'Government Edition',
  icon: 'Building2',
  description: 'Core government tools',
  category: 'core',
  status: 'active',
};

const mockPosition: ContextMenuPosition = { x: 100, y: 200 };

// Reset store
beforeEach(() => {
  useStartMenuStore.setState({
    isOpen: true,
    searchQuery: '',
    pinnedApps: [],
    recentApps: [],
    allApps: [mockModule],
    focusedIndex: -1,
    focusedSection: 'search',
  });
});

describe('AppContextMenu', () => {
  describe('Rendering (SC-6.13)', () => {
    it('renders context menu when visible', () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('does not render when module is null', () => {
      render(<AppContextMenu module={null} position={mockPosition} onClose={jest.fn()} />);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('displays app name in menu header', () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      expect(screen.getByText('Government Edition')).toBeInTheDocument();
    });

    it('displays app icon', () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      const menu = screen.getByRole('menu');
      expect(menu.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Position (SC-6.18)', () => {
    it('positions menu at cursor location', () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      const menu = screen.getByRole('menu');
      expect(menu).toHaveStyle({ left: '100px', top: '200px' });
    });

    it('updates position when position prop changes', () => {
      const { rerender } = render(
        <AppContextMenu module={mockModule} position={{ x: 100, y: 200 }} onClose={jest.fn()} />
      );

      rerender(
        <AppContextMenu module={mockModule} position={{ x: 300, y: 400 }} onClose={jest.fn()} />
      );

      const menu = screen.getByRole('menu');
      expect(menu).toHaveStyle({ left: '300px', top: '400px' });
    });
  });

  describe('Pin/Unpin Options (SC-6.14, SC-6.15)', () => {
    it('shows "Pin to Start" for unpinned apps', () => {
      useStartMenuStore.setState({ pinnedApps: [] });

      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      expect(screen.getByRole('menuitem', { name: /pin to start/i })).toBeInTheDocument();
    });

    it('shows "Unpin from Start" for pinned apps', () => {
      useStartMenuStore.setState({ pinnedApps: [mockModule] });

      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      expect(screen.getByRole('menuitem', { name: /unpin from start/i })).toBeInTheDocument();
    });

    it('clicking "Pin to Start" adds app to pinned', async () => {
      useStartMenuStore.setState({ pinnedApps: [] });
      const onClose = jest.fn();

      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={onClose} />);

      await userEvent.click(screen.getByRole('menuitem', { name: /pin to start/i }));

      expect(useStartMenuStore.getState().pinnedApps).toContainEqual(
        expect.objectContaining({ id: 'gov' })
      );
      expect(onClose).toHaveBeenCalled();
    });

    it('clicking "Unpin from Start" removes app from pinned', async () => {
      useStartMenuStore.setState({ pinnedApps: [mockModule] });
      const onClose = jest.fn();

      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={onClose} />);

      await userEvent.click(screen.getByRole('menuitem', { name: /unpin from start/i }));

      expect(useStartMenuStore.getState().pinnedApps).not.toContainEqual(
        expect.objectContaining({ id: 'gov' })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Close Behavior', () => {
    it('Escape closes menu (SC-6.17)', async () => {
      const onClose = jest.fn();

      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('click outside closes menu (SC-6.16)', async () => {
      const onClose = jest.fn();

      render(
        <div>
          <div data-testid='outside'>Outside</div>
          <AppContextMenu module={mockModule} position={mockPosition} onClose={onClose} />
        </div>
      );

      // Wait for event listener to be attached
      await new Promise((resolve) => setTimeout(resolve, 50));

      await userEvent.click(screen.getByTestId('outside'));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility (SC-6.19, SC-6.20, SC-6.21)', () => {
    it('has role="menu" (SC-6.20)', () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('menu items have role="menuitem"', () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('menu items have aria-labels (SC-6.19)', () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        expect(item).toHaveAccessibleName();
      });
    });

    it('first menu item receives focus on open', () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveFocus();
    });

    it('Tab keeps focus within menu (SC-6.21)', async () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      // Tab through items
      for (let i = 0; i < 10; i++) {
        await userEvent.tab();
      }

      // Focus should still be on a menu item
      const menu = screen.getByRole('menu');
      expect(menu.contains(document.activeElement)).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('Arrow Down moves to next item', async () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}');

      expect(menuItems[1]).toHaveFocus();
    });

    it('Arrow Up moves to previous item', async () => {
      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={jest.fn()} />);

      const menuItems = screen.getAllByRole('menuitem');

      // Move to second item first
      await userEvent.keyboard('{ArrowDown}');
      expect(menuItems[1]).toHaveFocus();

      // Move back up
      await userEvent.keyboard('{ArrowUp}');
      expect(menuItems[0]).toHaveFocus();
    });

    it('Enter activates focused item', async () => {
      const onClose = jest.fn();
      useStartMenuStore.setState({ pinnedApps: [] });

      render(<AppContextMenu module={mockModule} position={mockPosition} onClose={onClose} />);

      await userEvent.keyboard('{Enter}');

      // Should have pinned the app and closed menu
      expect(onClose).toHaveBeenCalled();
    });
  });
});
