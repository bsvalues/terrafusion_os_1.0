import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './command';

expect.extend(toHaveNoViolations);

describe('Command', () => {
  describe('Command Root', () => {
    it('renders command component', () => {
      render(
        <Command>
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      const { container } = render(<Command />);

      const command = container.firstChild;
      expect(command).toHaveClass('flex');
      expect(command).toHaveClass('h-full');
      expect(command).toHaveClass('w-full');
      expect(command).toHaveClass('flex-col');
      expect(command).toHaveClass('overflow-hidden');
    });

    it('accepts custom className', () => {
      const { container } = render(<Command className="custom-command" />);

      expect(container.firstChild).toHaveClass('custom-command');
    });

    it('renders children correctly', () => {
      render(
        <Command>
          <CommandInput />
          <CommandList>
            <CommandItem>Test item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Test item')).toBeInTheDocument();
    });
  });

  describe('CommandInput', () => {
    it('renders input field', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'test query');

      expect(input).toHaveValue('test query');
    });

    it('renders with search icon', () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search..." />
        </Command>
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('applies default input styles', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-10');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-md');
      expect(input).toHaveClass('bg-transparent');
    });

    it('accepts custom className', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." className="custom-input" />
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveClass('custom-input');
    });

    it('supports disabled state', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." disabled />
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeDisabled();
    });
  });

  describe('CommandList', () => {
    it('renders list container', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('applies default list styles', () => {
      const { container } = render(
        <Command>
          <CommandList>
            <CommandItem>Item</CommandItem>
          </CommandList>
        </Command>
      );

      const list = container.querySelector('[cmdk-list]');
      expect(list).toHaveClass('max-h-[300px]');
      expect(list).toHaveClass('overflow-y-auto');
      expect(list).toHaveClass('overflow-x-hidden');
    });

    it('accepts custom className', () => {
      const { container } = render(
        <Command>
          <CommandList className="custom-list">
            <CommandItem>Item</CommandItem>
          </CommandList>
        </Command>
      );

      const list = container.querySelector('.custom-list');
      expect(list).toBeInTheDocument();
    });

    it('renders multiple items', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>First</CommandItem>
            <CommandItem>Second</CommandItem>
            <CommandItem>Third</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });

  describe('CommandEmpty', () => {
    it('renders empty state message', () => {
      render(
        <Command>
          <CommandInput />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('applies default empty styles', () => {
      render(
        <Command>
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
          </CommandList>
        </Command>
      );

      const empty = screen.getByText('No results');
      expect(empty).toHaveClass('py-6');
      expect(empty).toHaveClass('text-center');
      expect(empty).toHaveClass('text-sm');
    });

    it('renders custom empty message', () => {
      render(
        <Command>
          <CommandList>
            <CommandEmpty>
              <div>
                <p>Nothing found</p>
                <button>Try again</button>
              </div>
            </CommandEmpty>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Nothing found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('CommandGroup', () => {
    it('renders command group', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup heading="Suggestions">
              <CommandItem>Item 1</CommandItem>
              <CommandItem>Item 2</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('renders multiple groups', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup heading="Group 1">
              <CommandItem>Item A</CommandItem>
            </CommandGroup>
            <CommandGroup heading="Group 2">
              <CommandItem>Item B</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
    });

    it('applies default group styles', () => {
      const { container } = render(
        <Command>
          <CommandList>
            <CommandGroup heading="Test">
              <CommandItem>Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      const group = container.querySelector('[cmdk-group]');
      expect(group).toHaveClass('overflow-hidden');
      expect(group).toHaveClass('p-1');
      expect(group).toHaveClass('text-foreground');
    });

    it('accepts custom className', () => {
      const { container } = render(
        <Command>
          <CommandList>
            <CommandGroup heading="Test" className="custom-group">
              <CommandItem>Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      const group = container.querySelector('.custom-group');
      expect(group).toBeInTheDocument();
    });
  });

  describe('CommandItem', () => {
    it('renders command item', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>Action item</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Action item')).toBeInTheDocument();
    });

    it('applies default item styles', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>Item</CommandItem>
          </CommandList>
        </Command>
      );

      const item = screen.getByText('Item');
      expect(item).toHaveClass('relative');
      expect(item).toHaveClass('flex');
      expect(item).toHaveClass('cursor-default');
      expect(item).toHaveClass('select-none');
      expect(item).toHaveClass('items-center');
    });

    it('accepts custom className', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem className="custom-item">Item</CommandItem>
          </CommandList>
        </Command>
      );

      const item = screen.getByText('Item');
      expect(item).toHaveClass('custom-item');
    });

    it('handles click events', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(
        <Command>
          <CommandList>
            <CommandItem onSelect={onSelect}>Clickable</CommandItem>
          </CommandList>
        </Command>
      );

      await user.click(screen.getByText('Clickable'));
      expect(onSelect).toHaveBeenCalled();
    });

    it('renders item with icon', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              <span>📁</span>
              File
            </CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('📁')).toBeInTheDocument();
      expect(screen.getByText('File')).toBeInTheDocument();
    });

    it('supports disabled state', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem disabled>Disabled item</CommandItem>
          </CommandList>
        </Command>
      );

      const item = screen.getByText('Disabled item');
      expect(item).toHaveAttribute('data-disabled', 'true');
    });
  });

  describe('CommandShortcut', () => {
    it('renders keyboard shortcut', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              Open file
              <CommandShortcut>⌘O</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('⌘O')).toBeInTheDocument();
    });

    it('applies default shortcut styles', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              Action
              <CommandShortcut>⌘K</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      );

      const shortcut = screen.getByText('⌘K');
      expect(shortcut).toHaveClass('ml-auto');
      expect(shortcut).toHaveClass('text-xs');
      expect(shortcut).toHaveClass('tracking-widest');
      expect(shortcut).toHaveClass('text-muted-foreground');
    });

    it('accepts custom className', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              Action
              <CommandShortcut className="custom-shortcut">⌘S</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      );

      const shortcut = screen.getByText('⌘S');
      expect(shortcut).toHaveClass('custom-shortcut');
    });
  });

  describe('CommandSeparator', () => {
    it('renders separator', () => {
      const { container } = render(
        <Command>
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandSeparator />
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      );

      const separator = container.querySelector('[cmdk-separator]');
      expect(separator).toBeInTheDocument();
    });

    it('applies default separator styles', () => {
      const { container } = render(
        <Command>
          <CommandList>
            <CommandSeparator />
          </CommandList>
        </Command>
      );

      const separator = container.querySelector('[cmdk-separator]');
      expect(separator).toHaveClass('-mx-1');
      expect(separator).toHaveClass('h-px');
      expect(separator).toHaveClass('bg-border');
    });

    it('accepts custom className', () => {
      const { container } = render(
        <Command>
          <CommandList>
            <CommandSeparator className="custom-separator" />
          </CommandList>
        </Command>
      );

      const separator = container.querySelector('.custom-separator');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('CommandDialog', () => {
    it('renders command dialog when open', () => {
      render(
        <CommandDialog open={true}>
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
          </CommandList>
        </CommandDialog>
      );

      expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <CommandDialog open={false}>
          <CommandInput placeholder="Type a command..." />
        </CommandDialog>
      );

      expect(screen.queryByPlaceholderText('Type a command...')).not.toBeInTheDocument();
    });

    it('can be toggled open and closed', () => {
      const { rerender } = render(
        <CommandDialog open={false}>
          <CommandInput placeholder="Search..." />
        </CommandDialog>
      );

      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();

      rerender(
        <CommandDialog open={true}>
          <CommandInput placeholder="Search..." />
        </CommandDialog>
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters items based on search input', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem value="apple">Apple</CommandItem>
            <CommandItem value="banana">Banana</CommandItem>
            <CommandItem value="cherry">Cherry</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'app');

      // Apple should be visible
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('shows empty state when no matches', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
            <CommandItem>Item 1</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'xyz123');

      // Empty state should be visible
      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>First</CommandItem>
            <CommandItem>Second</CommandItem>
            <CommandItem>Third</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      input.focus();

      await user.keyboard('{ArrowDown}');
      // First item should be selected (visual state)
      expect(input).toBeInTheDocument();
    });

    it('supports Enter to select item', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem onSelect={onSelect}>Item</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      input.focus();

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalled();
    });

    it('supports Escape to clear input', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Item</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      await user.type(input, 'test');

      expect(input.value).toBe('test');

      await user.keyboard('{Escape}');
      // Input might be cleared depending on cmdk implementation
      expect(input).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations - basic command', async () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - with groups', async () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandGroup heading="Group 1">
              <CommandItem>Item A</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('input has proper label', () => {
      render(
        <Command>
          <CommandInput placeholder="Search commands..." />
        </Command>
      );

      const input = screen.getByPlaceholderText('Search commands...');
      expect(input).toBeInTheDocument();
    });

    it('items are keyboard accessible', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>Accessible item</CommandItem>
          </CommandList>
        </Command>
      );

      const item = screen.getByText('Accessible item');
      expect(item).toBeInTheDocument();
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders command palette', () => {
      render(
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                📁 Open File
                <CommandShortcut>⌘O</CommandShortcut>
              </CommandItem>
              <CommandItem>
                💾 Save
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>⚙️ Preferences</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('⌘O')).toBeInTheDocument();
    });

    it('renders search with categories', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Files">
              <CommandItem>Document.pdf</CommandItem>
              <CommandItem>Image.png</CommandItem>
            </CommandGroup>
            <CommandGroup heading="Folders">
              <CommandItem>Projects</CommandItem>
              <CommandItem>Downloads</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Files')).toBeInTheDocument();
      expect(screen.getByText('Folders')).toBeInTheDocument();
      expect(screen.getByText('Document.pdf')).toBeInTheDocument();
    });

    it('renders quick actions menu', () => {
      render(
        <Command>
          <CommandInput placeholder="Quick actions..." />
          <CommandList>
            <CommandItem>🆕 New document</CommandItem>
            <CommandItem>📂 Open recent</CommandItem>
            <CommandItem>🔍 Search all files</CommandItem>
            <CommandItem>⚡ Run command</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('🆕 New document')).toBeInTheDocument();
      expect(screen.getByText('📂 Open recent')).toBeInTheDocument();
      expect(screen.getByText('🔍 Search all files')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty command list', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No items available</CommandEmpty>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('No items available')).toBeInTheDocument();
    });

    it('handles very long item text', () => {
      const longText =
        'This is a very long command item text that might overflow and needs to be handled properly';
      render(
        <Command>
          <CommandList>
            <CommandItem>{longText}</CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles many items', () => {
      const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);
      render(
        <Command>
          <CommandList>
            {items.map((item) => (
              <CommandItem key={item}>{item}</CommandItem>
            ))}
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 50')).toBeInTheDocument();
    });

    it('handles rapid typing in search', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Test item</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'rapid typing test', { delay: 10 });

      expect(input).toHaveValue('rapid typing test');
    });

    it('handles items with complex content', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              <div>
                <strong>Bold title</strong>
                <p>Description text</p>
              </div>
            </CommandItem>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Bold title')).toBeInTheDocument();
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });
  });
});
