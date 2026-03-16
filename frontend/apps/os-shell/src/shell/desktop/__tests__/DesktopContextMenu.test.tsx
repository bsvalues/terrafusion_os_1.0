/**
 * TerraFusion OS Desktop Context Menu Tests
 *
 * Priority 6: Right-click context menu for desktop background.
 *
 * SUCCESS CRITERIA:
 * SC-9.1: Right-click on desktop shows DesktopContextMenu
 * SC-9.4: Click outside closes menu
 * SC-9.5: Escape closes menu
 * SC-9.6: Menu positioned at cursor
 * SC-9.7: Menu has role="menu" and aria-labels
 *
 * @module shell/desktop/__tests__/DesktopContextMenu.test
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// Mocks
// ============================================================================

const mockActivateModule = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

// ============================================================================
// Tests
// ============================================================================

describe('DesktopContextMenu', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DesktopContextMenu } = require('../DesktopContextMenu');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('renders menu when isOpen is true', () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <DesktopContextMenu isOpen={false} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('renders all menu items', () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      expect(screen.getByRole('menuitem', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /display settings/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /about terrafusion/i })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-9.6: Position
  // ==========================================================================

  describe('position (SC-9.6)', () => {
    it('positions menu at cursor location', () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 150, y: 250 }} onClose={vi.fn()} />
      );

      const menu = screen.getByRole('menu');
      expect(menu).toHaveStyle({ left: '150px', top: '250px' });
    });

    it('updates position when prop changes', () => {
      const { rerender } = render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      rerender(
        <DesktopContextMenu isOpen={true} position={{ x: 300, y: 400 }} onClose={vi.fn()} />
      );

      const menu = screen.getByRole('menu');
      expect(menu).toHaveStyle({ left: '300px', top: '400px' });
    });
  });

  // ==========================================================================
  // Menu Actions
  // ==========================================================================

  describe('menu actions', () => {
    it('Refresh action calls onClose', async () => {
      const onClose = vi.fn();
      render(<DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={onClose} />);

      await userEvent.click(screen.getByRole('menuitem', { name: /refresh/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('Display Settings opens settings module', async () => {
      const onClose = vi.fn();
      render(<DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={onClose} />);

      await userEvent.click(screen.getByRole('menuitem', { name: /display settings/i }));

      expect(mockActivateModule).toHaveBeenCalledWith(
        'settings',
        expect.objectContaining({
          source: 'context_menu',
        })
      );
      expect(onClose).toHaveBeenCalled();
    });

    it('About TerraFusion shows about dialog', async () => {
      const onClose = vi.fn();
      render(<DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={onClose} />);

      await userEvent.click(screen.getByRole('menuitem', { name: /about terrafusion/i }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SC-9.5: Escape closes menu
  // ==========================================================================

  describe('escape key (SC-9.5)', () => {
    it('Escape closes menu', async () => {
      const onClose = vi.fn();
      render(<DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SC-9.4: Click outside closes menu
  // ==========================================================================

  describe('click outside (SC-9.4)', () => {
    it('click outside closes menu', async () => {
      const onClose = vi.fn();
      render(
        <div>
          <div data-testid='outside'>Outside</div>
          <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={onClose} />
        </div>
      );

      // Wait for the 10ms delay + event listener attachment
      await new Promise((resolve) => setTimeout(resolve, 15));

      // Use fireEvent for mousedown since that's what the component listens for
      fireEvent.mouseDown(screen.getByTestId('outside'));

      // Verify onClose was called
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // SC-9.7: Accessibility
  // ==========================================================================

  describe('accessibility (SC-9.7)', () => {
    it('has role="menu"', () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('has aria-label on menu', () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      expect(screen.getByRole('menu')).toHaveAttribute('aria-label', 'Desktop context menu');
    });

    it('menu items have role="menuitem"', () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('menu items have aria-labels', () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach((item) => {
        expect(item).toHaveAccessibleName();
      });
    });

    it('first item receives focus on open', () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveFocus();
    });
  });

  // ==========================================================================
  // Keyboard Navigation
  // ==========================================================================

  describe('keyboard navigation', () => {
    it('Arrow Down moves focus to next item', async () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}');

      expect(menuItems[1]).toHaveFocus();
    });

    it('Arrow Up moves focus to previous item', async () => {
      render(
        <DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={vi.fn()} />
      );

      const menuItems = screen.getAllByRole('menuitem');

      await userEvent.keyboard('{ArrowDown}');
      expect(menuItems[1]).toHaveFocus();

      await userEvent.keyboard('{ArrowUp}');
      expect(menuItems[0]).toHaveFocus();
    });

    it('Enter activates focused item', async () => {
      const onClose = vi.fn();
      render(<DesktopContextMenu isOpen={true} position={{ x: 100, y: 200 }} onClose={onClose} />);

      await userEvent.keyboard('{Enter}');

      expect(onClose).toHaveBeenCalled();
    });
  });
});
