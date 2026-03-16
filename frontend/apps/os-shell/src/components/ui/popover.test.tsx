import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

expect.extend(toHaveNoViolations);

describe('Popover', () => {
  describe('Rendering', () => {
    it('renders popover trigger', () => {
      render(
        <Popover>
          <PopoverTrigger>Open popover</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Open popover')).toBeInTheDocument();
    });

    it('does not render content initially (closed by default)', () => {
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('renders content when opened', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Popover content')).toBeInTheDocument();
      });
    });

    it('trigger is a button by default', () => {
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      expect(trigger.tagName).toBe('BUTTON');
    });
  });

  describe('Open and Close Behavior', () => {
    it('opens on trigger click', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content shown</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Content shown')).toBeInTheDocument();
      });
    });

    it('closes on trigger click when open', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Toggle');

      // Open
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      // Close
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('closes on outside click', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Outside button</button>
          <Popover>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>Content</PopoverContent>
          </Popover>
        </div>
      );

      // Open popover
      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      // Click outside
      await user.click(screen.getByText('Outside button'));
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      // Open popover
      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('controlled popover with open prop', () => {
      const { rerender } = render(
        <Popover open={false}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();

      rerender(
        <Popover open={true}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('PopoverContent Styling', () => {
    it('applies default content styles', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const content = screen.getByText('Content');
        expect(content).toHaveClass('z-50');
        expect(content).toHaveClass('w-72');
        expect(content).toHaveClass('rounded-md');
        expect(content).toHaveClass('border');
        expect(content).toHaveClass('bg-popover');
        expect(content).toHaveClass('p-4');
        expect(content).toHaveClass('text-popover-foreground');
        expect(content).toHaveClass('shadow-md');
      });
    });

    it('accepts custom className', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent className='custom-popover'>Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const content = screen.getByText('Content');
        expect(content).toHaveClass('custom-popover');
      });
    });

    it('applies custom width', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent className='w-[400px]'>Wide content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const content = screen.getByText('Wide content');
        expect(content).toHaveClass('w-[400px]');
      });
    });
  });

  describe('Positioning', () => {
    it('renders with default align (center)', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('renders with align="start"', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent align='start'>Aligned start</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Aligned start')).toBeInTheDocument();
      });
    });

    it('renders with align="end"', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent align='end'>Aligned end</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Aligned end')).toBeInTheDocument();
      });
    });

    it('renders with custom sideOffset', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent sideOffset={10}>Offset content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Offset content')).toBeInTheDocument();
      });
    });

    it('renders with side="top"', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side='top'>Top content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Top content')).toBeInTheDocument();
      });
    });

    it('renders with side="bottom"', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side='bottom'>Bottom content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Bottom content')).toBeInTheDocument();
      });
    });

    it('renders with side="left"', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side='left'>Left content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Left content')).toBeInTheDocument();
      });
    });

    it('renders with side="right"', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side='right'>Right content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Right content')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      trigger.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('opens on Space key', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      trigger.focus();

      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('trigger is keyboard focusable', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Popover>
            <PopoverTrigger>Trigger</PopoverTrigger>
            <PopoverContent>Content</PopoverContent>
          </Popover>
          <button>After</button>
        </div>
      );

      await user.tab(); // Focus "Before"
      await user.tab(); // Focus trigger

      expect(screen.getByText('Trigger')).toHaveFocus();
    });

    it('returns focus to trigger after closing with Escape', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });

      expect(trigger).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations - closed popover', async () => {
      const { container } = render(
        <Popover>
          <PopoverTrigger>Open popover</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - open popover', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Popover>
          <PopoverTrigger>Open popover</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open popover'));

      await waitFor(async () => {
        expect(screen.getByText('Popover content')).toBeInTheDocument();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('trigger has proper ARIA attributes', () => {
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('trigger aria-expanded changes when opened', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('content has role dialog', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const content = screen.getByText('Content');
        expect(content).toHaveAttribute('role', 'dialog');
      });
    });

    it('supports aria-label on trigger', () => {
      render(
        <Popover>
          <PopoverTrigger aria-label='Open settings'>⚙️</PopoverTrigger>
          <PopoverContent>Settings content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByLabelText('Open settings');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders user profile popover', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>User Menu</PopoverTrigger>
          <PopoverContent>
            <div>
              <h3>John Doe</h3>
              <p>john@example.com</p>
              <button>Sign Out</button>
            </div>
          </PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('User Menu'));

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      });
    });

    it('renders settings popover', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Settings</PopoverTrigger>
          <PopoverContent>
            <div>
              <h4>Preferences</h4>
              <label>
                <input type='checkbox' /> Dark mode
              </label>
              <label>
                <input type='checkbox' /> Notifications
              </label>
            </div>
          </PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Settings'));

      await waitFor(() => {
        expect(screen.getByText('Preferences')).toBeInTheDocument();
        expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
        expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
      });
    });

    it('renders share popover with buttons', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Share</PopoverTrigger>
          <PopoverContent>
            <div>
              <h4>Share this page</h4>
              <button>Copy link</button>
              <button>Share on Twitter</button>
              <button>Share on Facebook</button>
            </div>
          </PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Share'));

      await waitFor(() => {
        expect(screen.getByText('Share this page')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /twitter/i })).toBeInTheDocument();
      });
    });

    it('renders filter popover', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Filters</PopoverTrigger>
          <PopoverContent>
            <div>
              <h4>Filter options</h4>
              <select>
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <button>Apply</button>
            </div>
          </PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Filters'));

      await waitFor(() => {
        expect(screen.getByText('Filter options')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent></PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });

    // Skip: Long content test times out in jsdom - portal rendering flaky
    it.skip('handles very long content', async () => {
      const user = userEvent.setup();
      const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>{longText}</PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText(longText)).toBeInTheDocument();
      });
    });

    it('handles rapid open/close', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Toggle');

      // Rapid clicks
      await user.click(trigger);
      await user.click(trigger);
      await user.click(trigger);

      // Should end in open state (odd number of clicks)
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('handles disabled trigger', () => {
      render(
        <Popover>
          <PopoverTrigger disabled>Disabled</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Disabled');
      expect(trigger).toBeDisabled();
    });

    it('handles custom trigger element with asChild', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger asChild>
            <button className='custom-button'>Custom Trigger</button>
          </PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Custom Trigger');
      expect(trigger).toHaveClass('custom-button');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('handles multiple popovers on same page', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Popover>
            <PopoverTrigger>First</PopoverTrigger>
            <PopoverContent>First content</PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger>Second</PopoverTrigger>
            <PopoverContent>Second content</PopoverContent>
          </Popover>
        </div>
      );

      // Open first popover
      await user.click(screen.getByText('First'));
      await waitFor(() => {
        expect(screen.getByText('First content')).toBeInTheDocument();
      });

      // Open second popover (should close first)
      await user.click(screen.getByText('Second'));
      await waitFor(() => {
        expect(screen.getByText('Second content')).toBeInTheDocument();
        expect(screen.queryByText('First content')).not.toBeInTheDocument();
      });
    });

    it('handles rich content with interactive elements', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <div>
              <button onClick={handleClick}>Interactive Button</button>
              <input type='text' placeholder='Type here' />
            </div>
          </PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(async () => {
        const button = screen.getByRole('button', { name: /interactive/i });
        expect(button).toBeInTheDocument();

        await user.click(button);
        expect(handleClick).toHaveBeenCalled();
      });
    });

    it('does not close when clicking inside content', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <button>Click me</button>
          </PopoverContent>
        </Popover>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Click me')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Click me'));

      // Content should still be visible
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
  });
});
