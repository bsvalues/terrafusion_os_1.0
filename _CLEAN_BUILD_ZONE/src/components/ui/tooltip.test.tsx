import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './tooltip';

expect.extend(toHaveNoViolations);

describe('Tooltip', () => {
  describe('Rendering', () => {
    it('renders TooltipProvider without errors', () => {
      const { container } = render(
        <TooltipProvider>
          <div>Content</div>
        </TooltipProvider>
      );
      expect(container).toBeInTheDocument();
    });

    it('renders Tooltip with trigger and content', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover me</TooltipTrigger>
            <TooltipContent>Tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Hover me');
      expect(trigger).toBeInTheDocument();

      // Hover to show tooltip
      await user.hover(trigger);
      await waitFor(() => {
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      });
    });

    it('renders trigger as button by default', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');
      expect(trigger.tagName).toBe('BUTTON');
    });

    it('renders custom trigger element', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>Custom trigger</span>
            </TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Custom trigger');
      expect(trigger.tagName).toBe('SPAN');
    });
  });

  describe('Hover Behavior', () => {
    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Tooltip content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });
    });

    it('hides tooltip on unhover', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Tooltip content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');
      
      // Show tooltip
      await user.hover(trigger);
      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });

      // Hide tooltip
      await user.unhover(trigger);
      await waitFor(() => {
        expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
      });
    });

    it('shows tooltip on focus', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Tooltip content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');
      await user.tab(); // Focus trigger

      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });
    });

    it('hides tooltip on blur', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Tooltip content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');
      
      // Show tooltip
      await user.tab();
      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });

      // Hide tooltip
      await user.tab(); // Move focus away
      await waitFor(() => {
        expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
      });
    });
  });

  describe('TooltipContent Styling', () => {
    it('applies default styles', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        const content = screen.getByText('Content');
        expect(content).toHaveClass('z-50');
        expect(content).toHaveClass('overflow-hidden');
        expect(content).toHaveClass('rounded-md');
        expect(content).toHaveClass('bg-primary');
        expect(content).toHaveClass('px-3');
        expect(content).toHaveClass('py-1.5');
        expect(content).toHaveClass('text-xs');
        expect(content).toHaveClass('text-primary-foreground');
      });
    });

    it('accepts custom className', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent className="custom-tooltip">Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        const content = screen.getByText('Content');
        expect(content).toHaveClass('custom-tooltip');
      });
    });

    it('renders with custom sideOffset', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent sideOffset={10}>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });
  });

  describe('Positioning', () => {
    it('renders with side="top"', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent side="top">Top tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Top tooltip')).toBeInTheDocument();
      });
    });

    it('renders with side="bottom"', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent side="bottom">Bottom tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Bottom tooltip')).toBeInTheDocument();
      });
    });

    it('renders with side="left"', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent side="left">Left tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Left tooltip')).toBeInTheDocument();
      });
    });

    it('renders with side="right"', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent side="right">Right tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Right tooltip')).toBeInTheDocument();
      });
    });

    it('renders with custom align', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent align="start">Aligned tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Aligned tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Provider Configuration', () => {
    it('renders with delayDuration', () => {
      const { container } = render(
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('renders with skipDelayDuration', () => {
      const { container } = render(
        <TooltipProvider skipDelayDuration={300}>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('renders multiple tooltips with shared provider', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>First</TooltipTrigger>
            <TooltipContent>First tooltip</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Second</TooltipTrigger>
            <TooltipContent>Second tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const first = screen.getByText('First');
      await user.hover(first);

      await waitFor(() => {
        expect(screen.getByText('First tooltip')).toBeInTheDocument();
      });

      await user.unhover(first);
      
      const second = screen.getByText('Second');
      await user.hover(second);

      await waitFor(() => {
        expect(screen.getByText('Second tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('shows tooltip on tab focus', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('hides tooltip on Escape key', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('maintains focus on trigger after Escape', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      expect(trigger).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations - basic tooltip', async () => {
      const { container } = render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Tooltip content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations - with aria-label', async () => {
      const { container } = render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger aria-label="More information">
              <span>ℹ️</span>
            </TooltipTrigger>
            <TooltipContent>Additional details</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('trigger is keyboard accessible', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');
      expect(trigger).toHaveAttribute('type', 'button');
    });

    it('tooltip content is properly associated with trigger', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Descriptive content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        const content = screen.getByText('Descriptive content');
        expect(content).toBeInTheDocument();
        expect(content).toHaveAttribute('role', 'tooltip');
      });
    });

    it('respects aria-label on trigger', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger aria-label="Help">
              ?
            </TooltipTrigger>
            <TooltipContent>Help text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByLabelText('Help');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Real-world Use Cases', () => {
    it('renders icon button with tooltip', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger aria-label="Delete">
              🗑️
            </TooltipTrigger>
            <TooltipContent>Delete item</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByLabelText('Delete');
      expect(trigger).toBeInTheDocument();

      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Delete item')).toBeInTheDocument();
      });
    });

    it('renders help text tooltip', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <div>
            <label htmlFor="password">Password</label>
            <Tooltip>
              <TooltipTrigger aria-label="Password requirements">
                ℹ️
              </TooltipTrigger>
              <TooltipContent>
                Must be at least 8 characters with 1 uppercase and 1 number
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );

      const trigger = screen.getByLabelText('Password requirements');
      await user.hover(trigger);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Must be at least 8 characters with 1 uppercase and 1 number'
          )
        ).toBeInTheDocument();
      });
    });

    it('renders truncated text with full text in tooltip', async () => {
      const user = userEvent.setup();
      const longText = 'This is a very long text that will be truncated';
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="max-w-[100px] truncate">
              {longText}
            </TooltipTrigger>
            <TooltipContent>{longText}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText(longText);
      await user.hover(trigger);

      await waitFor(() => {
        const tooltips = screen.getAllByText(longText);
        expect(tooltips.length).toBeGreaterThan(1); // Trigger + tooltip
      });
    });

    it('renders status indicator with explanation', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger aria-label="Status">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            </TooltipTrigger>
            <TooltipContent>Active - All systems operational</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByLabelText('Status');
      await user.hover(trigger);

      await waitFor(() => {
        expect(
          screen.getByText('Active - All systems operational')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty tooltip content', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');
      await user.hover(trigger);

      // Tooltip portal still renders even if content is empty
      await waitFor(() => {
        const tooltip = trigger.parentElement?.querySelector('[role="tooltip"]');
        expect(tooltip).toBeTruthy();
      });
    });

    it('handles very long tooltip text', async () => {
      const user = userEvent.setup();
      const longText =
        'This is a very long tooltip text that spans multiple lines and contains a lot of information that the user needs to read carefully in order to understand the full context and implications of the action they are about to take.';
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>{longText}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText(longText)).toBeInTheDocument();
      });
    });

    it('handles rapid hover on/off', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Trigger');

      // Rapid hover/unhover
      await user.hover(trigger);
      await user.unhover(trigger);
      await user.hover(trigger);
      await user.unhover(trigger);
      await user.hover(trigger);

      // Final state should be visible
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('handles disabled trigger', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger disabled>Disabled trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Disabled trigger');
      expect(trigger).toBeDisabled();
    });

    it('handles tooltip with rich content', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover for info</TooltipTrigger>
            <TooltipContent>
              <div>
                <strong>Bold text</strong>
                <p>Regular text</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      await user.hover(screen.getByText('Hover for info'));

      await waitFor(() => {
        expect(screen.getByText('Bold text')).toBeInTheDocument();
        expect(screen.getByText('Regular text')).toBeInTheDocument();
      });
    });

    it('handles multiple tooltips on same page', async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <div>
            <Tooltip>
              <TooltipTrigger>First</TooltipTrigger>
              <TooltipContent>First content</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>Second</TooltipTrigger>
              <TooltipContent>Second content</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>Third</TooltipTrigger>
              <TooltipContent>Third content</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );

      // Test each tooltip independently
      await user.hover(screen.getByText('First'));
      await waitFor(() => {
        expect(screen.getByText('First content')).toBeInTheDocument();
      });

      await user.unhover(screen.getByText('First'));
      await user.hover(screen.getByText('Second'));
      await waitFor(() => {
        expect(screen.getByText('Second content')).toBeInTheDocument();
      });

      await user.unhover(screen.getByText('Second'));
      await user.hover(screen.getByText('Third'));
      await waitFor(() => {
        expect(screen.getByText('Third content')).toBeInTheDocument();
      });
    });
  });
});
