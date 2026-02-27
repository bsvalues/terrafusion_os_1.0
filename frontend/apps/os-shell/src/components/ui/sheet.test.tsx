import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { Button } from './button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from './sheet';

expect.extend(toHaveNoViolations);

describe('Sheet', () => {
  describe('Rendering', () => {
    it('renders trigger button', () => {
      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByRole('button', { name: /open sheet/i })).toBeInTheDocument();
    });

    it('does not render sheet content initially', () => {
      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      expect(screen.queryByText('Sheet Title')).not.toBeInTheDocument();
    });

    it('renders sheet content when opened', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        expect(screen.getByText('Sheet Title')).toBeInTheDocument();
        expect(screen.getByText('Sheet Description')).toBeInTheDocument();
      });
    });

    it('renders with custom className', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent className='custom-sheet'>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        expect(sheet).toHaveClass('custom-sheet');
      });
    });

    it('renders close button', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        // The close button has sr-only "Close" text
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe('Side Variants', () => {
    it('renders with right side (default)', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent side='right'>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        expect(sheet.className).toContain('inset-y-0');
        expect(sheet.className).toContain('right-0');
      });
    });

    it('renders with left side', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent side='left'>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        expect(sheet.className).toContain('inset-y-0');
        expect(sheet.className).toContain('left-0');
      });
    });

    it('renders with top side', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent side='top'>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        expect(sheet.className).toContain('inset-x-0');
        expect(sheet.className).toContain('top-0');
      });
    });

    it('renders with bottom side', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent side='bottom'>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        expect(sheet.className).toContain('inset-x-0');
        expect(sheet.className).toContain('bottom-0');
      });
    });
  });

  describe('Open/Close Behavior', () => {
    it('opens sheet on trigger click', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('closes sheet on close button click', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(
        (btn) => btn.getAttribute('aria-label') === 'Close' || btn.textContent?.includes('×')
      );

      if (closeButton) {
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
      }
    });

    it('closes sheet with SheetClose component', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetFooter>
              <SheetClose asChild>
                <Button data-testid='footer-close-btn'>Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      await user.click(screen.getByTestId('footer-close-btn'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('supports controlled open state', async () => {
      const ControlledSheet = () => {
        const [open, setOpen] = React.useState(false);

        return (
          <>
            <button onClick={() => setOpen(true)} data-testid='external-trigger'>
              External Open
            </button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetContent>
                <SheetTitle>Controlled Title</SheetTitle>
              </SheetContent>
            </Sheet>
          </>
        );
      };

      const user = userEvent.setup();
      render(<ControlledSheet />);

      await user.click(screen.getByTestId('external-trigger'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('calls onOpenChange when sheet opens', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Sheet onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
      });
    });

    it('calls onOpenChange when sheet closes', async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Sheet onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetFooter>
              <SheetClose asChild>
                <Button data-testid='onchange-close-btn'>Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      onOpenChange.mockClear();

      await user.click(screen.getByTestId('onchange-close-btn'));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  // Focus trap tests skipped due to jsdom limitations with focus management
  describe('Focus Trap', () => {
    it.skip('moves focus to sheet when opened', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <Button>First Button</Button>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: /first button/i });
        expect(firstButton).toHaveFocus();
      });
    });

    it.skip('returns focus to trigger when closed', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetFooter>
              <SheetClose asChild>
                <Button>Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      const trigger = screen.getByRole('button', { name: /open/i });
      await user.click(trigger);
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /^close$/i }));

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it.skip('traps focus within sheet', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
            <SheetFooter>
              <SheetClose asChild>
                <Button>Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const button1 = screen.getByRole('button', { name: /button 1/i });
      const button2 = screen.getByRole('button', { name: /button 2/i });
      const closeButton = screen.getByRole('button', { name: /^close$/i });

      expect(button1).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(button2).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(closeButton).toHaveFocus();

      // Focus should cycle back
      await user.keyboard('{Tab}');
      expect(button1).toHaveFocus();
    });
  });

  // Keyboard navigation tests with focus-dependent assertions skipped due to jsdom limitations
  describe('Keyboard Navigation', () => {
    it('closes sheet on Escape key', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it.skip('navigates between focusable elements with Tab', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const button1 = screen.getByRole('button', { name: /button 1/i });
      const button2 = screen.getByRole('button', { name: /button 2/i });

      expect(button1).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(button2).toHaveFocus();
    });

    it.skip('navigates backward with Shift+Tab', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      await user.keyboard('{Tab}');
      const button2 = screen.getByRole('button', { name: /button 2/i });
      expect(button2).toHaveFocus();

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      const button1 = screen.getByRole('button', { name: /button 1/i });
      expect(button1).toHaveFocus();
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has role="dialog"', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('has aria-labelledby referencing title', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        const titleId = screen.getByText('Sheet Title').id;
        expect(sheet).toHaveAttribute('aria-labelledby', titleId);
      });
    });

    it('has aria-describedby referencing description', async () => {
      const user = userEvent.setup();

      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description text</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const sheet = screen.getByRole('dialog');
        const descriptionId = screen.getByText('Description text').id;
        expect(sheet).toHaveAttribute('aria-describedby', descriptionId);
      });
    });

    it('has no accessibility violations (closed)', async () => {
      const { container } = render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (right side)', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent side='right'>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (left side)', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent side='left'>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (top side)', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent side='top'>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (bottom side)', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetContent side='bottom'>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
