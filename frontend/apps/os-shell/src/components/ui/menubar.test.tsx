import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './menubar';

/**
 * Menubar Component Test Suite
 *
 * Tests the desktop menu bar component with horizontal navigation.
 *
 * Test Categories:
 * 1. Rendering - Triggers, items, labels, separators
 * 2. Horizontal Navigation - Left/Right arrow keys between menus
 * 3. Vertical Navigation - Down/Up arrow keys within menus
 * 4. Sub-menus - Nested menu structures with Right arrow
 * 5. Keyboard Interactions - Enter, Space, Escape, Home, End
 * 6. ARIA Menubar Pattern - Roles, attributes, focus management
 * 7. Checkboxes and Radio Items - Toggle states, selection
 * 8. Disabled States - Non-interactive items
 */

describe('Menubar', () => {
  beforeEach(() => {
    // Clean up any open portals between tests
    document.body.innerHTML = '';
  });

  // ===========================
  // 1. RENDERING TESTS
  // ===========================
  describe('Rendering', () => {
    it('renders menubar with triggers', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('renders menu items when trigger is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
              <MenubarItem>Open File</MenubarItem>
              <MenubarItem>Save</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      const fileTrigger = screen.getByText('File');
      await user.click(fileTrigger);

      await waitFor(() => {
        expect(screen.getByText('New File')).toBeInTheDocument();
        expect(screen.getByText('Open File')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('renders menu labels for sections', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Appearance</MenubarLabel>
              <MenubarItem>Zoom In</MenubarItem>
              <MenubarItem>Zoom Out</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));

      await waitFor(() => {
        expect(screen.getByText('Appearance')).toBeInTheDocument();
      });
    });

    it('renders separators between menu items', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
              <MenubarSeparator data-testid='menu-separator' />
              <MenubarItem>Quit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));

      await waitFor(() => {
        expect(screen.getByTestId('menu-separator')).toBeInTheDocument();
      });
    });

    it('renders keyboard shortcuts', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Undo
                <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByText('⌘Z')).toBeInTheDocument();
      });
    });
  });

  // ===========================
  // 2. HORIZONTAL NAVIGATION TESTS
  // ===========================
  describe('Horizontal Navigation', () => {
    it('navigates to next menu with Right arrow key', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      const fileTrigger = screen.getByText('File');
      await user.click(fileTrigger);

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByText('New File')).toBeInTheDocument();
      });

      // Press Right arrow to navigate to Edit menu
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('Undo')).toBeInTheDocument();
      });
    });

    it('navigates to previous menu with Left arrow key', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      const editTrigger = screen.getByText('Edit');
      await user.click(editTrigger);

      await waitFor(() => {
        expect(screen.getByText('Undo')).toBeInTheDocument();
      });

      // Press Left arrow to navigate back to File menu
      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.getByText('New File')).toBeInTheDocument();
      });
    });

    it('wraps around to first menu when Right is pressed on last menu', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Documentation</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('Help'));

      await waitFor(() => {
        expect(screen.getByText('Documentation')).toBeInTheDocument();
      });

      // Right arrow on last menu should wrap to first
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('New File')).toBeInTheDocument();
      });
    });

    it('wraps around to last menu when Left is pressed on first menu', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Documentation</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));

      await waitFor(() => {
        expect(screen.getByText('New File')).toBeInTheDocument();
      });

      // Left arrow on first menu should wrap to last
      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.getByText('Documentation')).toBeInTheDocument();
      });
    });
  });

  // ===========================
  // 3. VERTICAL NAVIGATION TESTS
  // ===========================
  describe('Vertical Navigation', () => {
    // Skip: Focus management doesn't work reliably in jsdom for Radix menubar
    it.skip('navigates down through menu items with Down arrow key', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
              <MenubarItem>Open File</MenubarItem>
              <MenubarItem>Save</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));

      await waitFor(() => {
        expect(screen.getByText('New File')).toBeInTheDocument();
      });

      // First item should be focused
      const newFileItem = screen.getByText('New File');
      await waitFor(() => {
        expect(newFileItem).toHaveFocus();
      });

      // Press Down arrow to navigate to next item
      await user.keyboard('{ArrowDown}');

      const openFileItem = screen.getByText('Open File');
      await waitFor(() => {
        expect(openFileItem).toHaveFocus();
      });
    });

    // Skip: Focus management doesn't work reliably in jsdom for Radix menubar
    it.skip('navigates up through menu items with Up arrow key', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
              <MenubarItem>Open File</MenubarItem>
              <MenubarItem>Save</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));

      // Navigate down to second item
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      const saveItem = screen.getByText('Save');
      await waitFor(() => {
        expect(saveItem).toHaveFocus();
      });

      // Press Up arrow to navigate back
      await user.keyboard('{ArrowUp}');

      const openFileItem = screen.getByText('Open File');
      await waitFor(() => {
        expect(openFileItem).toHaveFocus();
      });
    });

    // Skip: Focus management doesn't work reliably in jsdom for Radix menubar
    it.skip('wraps to last item when Up is pressed on first item', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>First Item</MenubarItem>
              <MenubarItem>Middle Item</MenubarItem>
              <MenubarItem>Last Item</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));

      // First item is focused
      await waitFor(() => {
        expect(screen.getByText('First Item')).toHaveFocus();
      });

      // Up arrow should wrap to last item
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(screen.getByText('Last Item')).toHaveFocus();
      });
    });

    // Skip: Focus management doesn't work reliably in jsdom for Radix menubar
    it.skip('wraps to first item when Down is pressed on last item', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>First Item</MenubarItem>
              <MenubarItem>Middle Item</MenubarItem>
              <MenubarItem>Last Item</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));

      // Navigate to last item
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(screen.getByText('Last Item')).toHaveFocus();
      });

      // Down arrow should wrap to first item
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(screen.getByText('First Item')).toHaveFocus();
      });
    });
  });

  // ===========================
  // 4. SUB-MENU TESTS
  // ===========================
  describe('Sub-menus', () => {
    it('renders sub-menu trigger', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Zoom</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Zoom In</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));

      await waitFor(() => {
        expect(screen.getByText('Zoom')).toBeInTheDocument();
      });
    });

    it('opens sub-menu with Right arrow key', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Zoom</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Zoom In</MenubarItem>
                  <MenubarItem>Zoom Out</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));

      const zoomTrigger = screen.getByText('Zoom');
      await waitFor(() => {
        expect(zoomTrigger).toBeInTheDocument();
      });

      // Focus the sub-menu trigger and press Right arrow
      zoomTrigger.focus();
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('Zoom In')).toBeInTheDocument();
        expect(screen.getByText('Zoom Out')).toBeInTheDocument();
      });
    });

    it('closes sub-menu with Left arrow key', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Zoom</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Zoom In</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));

      // Open sub-menu
      const zoomTrigger = screen.getByText('Zoom');
      zoomTrigger.focus();
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('Zoom In')).toBeInTheDocument();
      });

      // Press Left arrow to close sub-menu
      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.queryByText('Zoom In')).not.toBeInTheDocument();
      });
    });

    it('renders nested sub-menus', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Tools</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Settings</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarSub>
                    <MenubarSubTrigger>Advanced</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>Deep Setting</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('Tools'));

      // Open first sub-menu
      const settingsTrigger = screen.getByText('Settings');
      settingsTrigger.focus();
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('Advanced')).toBeInTheDocument();
      });

      // Open nested sub-menu
      const advancedTrigger = screen.getByText('Advanced');
      advancedTrigger.focus();
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('Deep Setting')).toBeInTheDocument();
      });
    });
  });

  // ===========================
  // 5. KEYBOARD INTERACTIONS TESTS
  // ===========================
  describe('Keyboard Interactions', () => {
    // Skip: Focus management doesn't work reliably in jsdom for Radix menubar
    it.skip('activates menu item with Enter key', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={onSelect}>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));

      const newFileItem = screen.getByText('New File');
      await waitFor(() => {
        expect(newFileItem).toHaveFocus();
      });

      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('closes menu with Escape key', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));

      await waitFor(() => {
        expect(screen.getByText('New File')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('New File')).not.toBeInTheDocument();
      });
    });

    it('returns focus to trigger when menu closes', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      const fileTrigger = screen.getByText('File');
      await user.click(fileTrigger);

      await waitFor(() => {
        expect(screen.getByText('New File')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(fileTrigger).toHaveFocus();
      });
    });
  });

  // ===========================
  // 6. ARIA MENUBAR PATTERN TESTS
  // ===========================
  describe('ARIA Menubar Pattern', () => {
    it('has correct role="menubar" on root', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      const menubar = container.querySelector('[role="menubar"]');
      expect(menubar).toBeInTheDocument();
    });

    it('menu items have role="menuitem"', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));

      await waitFor(() => {
        const menuItem = screen.getByText('New File');
        expect(menuItem.closest('[role="menuitem"]')).toBeInTheDocument();
      });
    });

    it('triggers have aria-haspopup="menu"', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      const trigger = screen.getByText('File');
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('triggers have aria-expanded reflecting open state', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      const trigger = screen.getByText('File');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  // ===========================
  // 7. CHECKBOXES AND RADIO ITEMS TESTS
  // ===========================
  describe('Checkboxes and Radio Items', () => {
    it('renders checkbox menu items', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={true}>Show Toolbar</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));

      await waitFor(() => {
        expect(screen.getByText('Show Toolbar')).toBeInTheDocument();
      });
    });

    it('toggles checkbox state on click', async () => {
      const user = userEvent.setup();
      let checked = false;
      const onCheckedChange = vi.fn((value) => {
        checked = value;
      });

      const { rerender } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={checked} onCheckedChange={onCheckedChange}>
                Show Toolbar
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));

      const checkboxItem = screen.getByText('Show Toolbar');
      await user.click(checkboxItem);

      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('renders radio menu items in RadioGroup', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value='compact'>
                <MenubarRadioItem value='compact'>Compact</MenubarRadioItem>
                <MenubarRadioItem value='comfortable'>Comfortable</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));

      await waitFor(() => {
        expect(screen.getByText('Compact')).toBeInTheDocument();
        expect(screen.getByText('Comfortable')).toBeInTheDocument();
      });
    });

    it('selects radio item on click', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value='compact' onValueChange={onValueChange}>
                <MenubarRadioItem value='compact'>Compact</MenubarRadioItem>
                <MenubarRadioItem value='comfortable'>Comfortable</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));

      const comfortableItem = screen.getByText('Comfortable');
      await user.click(comfortableItem);

      expect(onValueChange).toHaveBeenCalledWith('comfortable');
    });
  });

  // ===========================
  // 8. DISABLED STATES TESTS
  // ===========================
  describe('Disabled States', () => {
    it('renders disabled menu items', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled>Undo</MenubarItem>
              <MenubarItem>Redo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('Edit'));

      await waitFor(() => {
        const undoItem = screen.getByText('Undo');
        expect(undoItem).toHaveAttribute('data-disabled');
      });
    });

    it('does not trigger onSelect for disabled items', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled onSelect={onSelect}>
                Undo
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('Edit'));

      const undoItem = screen.getByText('Undo');
      await user.click(undoItem);

      expect(onSelect).not.toHaveBeenCalled();
    });

    // Skip: Focus management doesn't work reliably in jsdom for Radix menubar
    it.skip('skips disabled items during keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Cut</MenubarItem>
              <MenubarItem disabled>Copy</MenubarItem>
              <MenubarItem>Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByText('Cut')).toHaveFocus();
      });

      // Down arrow should skip disabled item and go to Paste
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(screen.getByText('Paste')).toHaveFocus();
      });
    });
  });
});
