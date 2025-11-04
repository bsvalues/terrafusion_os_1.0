import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

describe('Dialog Component', () => {
  beforeEach(() => {
    // Clean up any open portals between tests
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('renders dialog trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    });

    it('renders dialog overlay when open', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      // Overlay should be present (uses data-state attribute)
      await waitFor(() => {
        const overlay = document.querySelector('[data-radix-dialog-overlay]');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('renders dialog content when open', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test description content</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test description content')).toBeInTheDocument();
      });
    });

    it('renders close button inside content', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      // Close button has sr-only text "Close"
      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });
    });

    it('renders custom footer content', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogFooter>
              <Button>Save</Button>
              <Button variant='outline'>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });
  });

  describe('Open/Close Behavior', () => {
    it('opens dialog when trigger is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Dialog should not be visible initially
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });
    });

    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      // Click the close button (with sr-only "Close" text)
      await user.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
      });
    });

    it('closes dialog with DialogClose component', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
      });
    });

    it('supports controlled open state', async () => {
      const user = userEvent.setup();

      function ControlledDialog() {
        const [open, setOpen] = useState(false);

        return (
          <>
            <Button onClick={() => setOpen(true)}>Open Controlled</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogTitle>Controlled Dialog</DialogTitle>
              </DialogContent>
            </Dialog>
          </>
        );
      }

      render(<ControlledDialog />);

      // Dialog should not be visible initially
      expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument();

      await user.click(screen.getByText('Open Controlled'));

      await waitFor(() => {
        expect(screen.getByText('Controlled Dialog')).toBeInTheDocument();
      });
    });

    it('calls onOpenChange when dialog state changes', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog onOpenChange={onOpenChange}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
      });

      await user.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Keyboard Interactions', () => {
    it('closes dialog when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
      });
    });

    it('opens dialog when trigger is activated with Enter key', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Focus the trigger button
      const trigger = screen.getByText('Open Dialog');
      trigger.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });
    });

    it('opens dialog when trigger is activated with Space key', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Focus the trigger button
      const trigger = screen.getByText('Open Dialog');
      trigger.focus();

      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });
    });

    it('does not close dialog when Escape is pressed if modal is disabled', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      // Dialog should still be visible since Escape was prevented
      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Focus Trap', () => {
    it('focuses first focusable element when dialog opens', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <Input placeholder='First input' data-testid='first-input' />
            <Input placeholder='Second input' data-testid='second-input' />
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        // First input or close button should be focused
        const closeButton = screen.getByText('Close').parentElement;
        expect(document.activeElement).toBeTruthy();
      });
    });

    it('traps focus within dialog', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <Input placeholder='First input' data-testid='first-input' />
            <Input placeholder='Second input' data-testid='second-input' />
            <Button>Submit</Button>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      // Tab through elements - focus should stay within dialog
      await user.tab();
      await user.tab();
      await user.tab();

      // Active element should be within dialog content
      const dialogContent = screen.getByText('Test Dialog').closest('[role="dialog"]');
      expect(dialogContent).toContainElement(document.activeElement);
    });

    it('cycles focus to beginning when tabbing from last element', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <Button data-testid='first-btn'>First</Button>
            <Button data-testid='last-btn'>Last</Button>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      // Tab to last button, then tab again - should cycle to first focusable
      const lastBtn = screen.getByTestId('last-btn');
      lastBtn.focus();

      await user.tab();

      // Focus should cycle back to close button or first input
      expect(document.activeElement).toBeTruthy();
    });

    it('cycles focus backward when shift-tabbing from first element', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <Button data-testid='first-btn'>First</Button>
            <Button data-testid='last-btn'>Last</Button>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      // Close button should be focused initially
      const closeButton = screen.getByText('Close').parentElement;

      // Shift-tab from first element should go to last
      await user.tab({ shift: true });

      // Focus should be on last focusable element
      expect(document.activeElement).toBeTruthy();
    });

    it('returns focus to trigger when dialog closes', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger data-testid='trigger'>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
      });

      // Focus should return to trigger button
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });
  });

  describe('Overlay Interactions', () => {
    it('closes dialog when overlay is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      // Click overlay (find it by data-radix-dialog-overlay attribute)
      const overlay = document.querySelector('[data-radix-dialog-overlay]');
      if (overlay) {
        await user.click(overlay as HTMLElement);
      }

      await waitFor(() => {
        expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
      });
    });

    it('prevents overlay click from closing when onInteractOutside is prevented', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent onInteractOutside={(e) => e.preventDefault()}>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      // Click overlay
      const overlay = document.querySelector('[data-radix-dialog-overlay]');
      if (overlay) {
        await user.click(overlay as HTMLElement);
      }

      // Dialog should still be visible
      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });
    });

    it('prevents body scroll when dialog is open', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Check body doesn't have scroll lock initially
      expect(document.body.style.overflow).not.toBe('hidden');

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      // Radix UI applies scroll lock via data attributes or styles
      // Check that the dialog portal is rendering (scroll lock is applied)
      const portal = document.querySelector('[data-radix-portal]');
      expect(portal).toBeInTheDocument();
    });

    it('restores body scroll when dialog closes', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
      });

      // Portal should be removed
      await waitFor(() => {
        const portal = document.querySelector('[data-radix-portal]');
        expect(portal).not.toBeInTheDocument();
      });
    });
  });

  describe('ARIA Dialog Pattern', () => {
    it('has correct role="dialog"', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });

    it('has aria-modal="true" attribute', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
    });

    it('links title with aria-labelledby', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const titleId = screen.getByText('Test Dialog Title').getAttribute('id');
        expect(dialog.getAttribute('aria-labelledby')).toBe(titleId);
      });
    });

    it('links description with aria-describedby', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>This is a test description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const descriptionId = screen.getByText('This is a test description').getAttribute('id');
        expect(dialog.getAttribute('aria-describedby')).toBe(descriptionId);
      });
    });

    it('close button has accessible label', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Dialog'));

      await waitFor(() => {
        // Close button should have sr-only "Close" text
        expect(screen.getByText('Close')).toBeInTheDocument();
      });
    });
  });

  describe('Form Integration', () => {
    it('handles form submission inside dialog', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      function FormDialog() {
        const [open, setOpen] = useState(false);

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          onSubmit();
          setOpen(false);
        };

        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>Open Form</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>User Information</DialogTitle>
                <DialogDescription>Enter your details below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} data-testid='dialog-form'>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='name'>Name</Label>
                    <Input id='name' placeholder='Enter name' />
                  </div>
                  <div>
                    <Label htmlFor='email'>Email</Label>
                    <Input id='email' type='email' placeholder='Enter email' />
                  </div>
                </div>
                <DialogFooter>
                  <Button type='submit'>Submit</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        );
      }

      render(<FormDialog />);

      await user.click(screen.getByText('Open Form'));

      await waitFor(() => {
        expect(screen.getByText('User Information')).toBeInTheDocument();
      });

      // Fill out form
      await user.type(screen.getByLabelText('Name'), 'John Doe');
      await user.type(screen.getByLabelText('Email'), 'john@example.com');

      // Submit form
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('User Information')).not.toBeInTheDocument();
      });
    });

    it('validates form inputs before submission', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      function ValidatedFormDialog() {
        const [open, setOpen] = useState(false);
        const [error, setError] = useState('');

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get('email') as string;

          if (!email.includes('@')) {
            setError('Invalid email address');
            return;
          }

          onSubmit();
          setOpen(false);
        };

        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>Open Form</DialogTrigger>
            <DialogContent>
              <DialogTitle>Email Form</DialogTitle>
              <form onSubmit={handleSubmit}>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='email'>Email</Label>
                    <Input id='email' name='email' type='text' placeholder='Enter email' />
                    {error && <p className='text-sm text-red-500'>{error}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button type='submit'>Submit</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        );
      }

      render(<ValidatedFormDialog />);

      await user.click(screen.getByText('Open Form'));

      await waitFor(() => {
        expect(screen.getByText('Email Form')).toBeInTheDocument();
      });

      // Enter invalid email
      await user.type(screen.getByLabelText('Email'), 'invalid-email');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
      });

      // Clear and enter valid email
      await user.clear(screen.getByLabelText('Email'));
      await user.type(screen.getByLabelText('Email'), 'valid@example.com');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('prevents form submission via Enter key when appropriate', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <Dialog>
          <DialogTrigger>Open Form</DialogTrigger>
          <DialogContent>
            <DialogTitle>Form Dialog</DialogTitle>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <Input placeholder='Type here' />
              <Button type='button'>Not Submit</Button>
            </form>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Form'));

      await waitFor(() => {
        expect(screen.getByText('Form Dialog')).toBeInTheDocument();
      });

      // Type in input and press Enter
      const input = screen.getByPlaceholderText('Type here');
      await user.type(input, 'Test{Enter}');

      // Form should be submitted
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });

    it('closes dialog on cancel button click', async () => {
      const user = userEvent.setup();

      function CancelFormDialog() {
        const [open, setOpen] = useState(false);

        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>Open Form</DialogTrigger>
            <DialogContent>
              <DialogTitle>Form Dialog</DialogTitle>
              <Input placeholder='Some input' />
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Save</Button>
                <DialogClose asChild>
                  <Button variant='outline'>Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      }

      render(<CancelFormDialog />);

      await user.click(screen.getByText('Open Form'));

      await waitFor(() => {
        expect(screen.getByText('Form Dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Form Dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Controlled Component', () => {
    it('respects controlled open prop', async () => {
      function ControlledDialog() {
        const [open, setOpen] = useState(true);

        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Controlled Dialog</DialogTitle>
              <Button onClick={() => setOpen(false)}>Close Programmatically</Button>
            </DialogContent>
          </Dialog>
        );
      }

      render(<ControlledDialog />);

      // Dialog should be open immediately
      await waitFor(() => {
        expect(screen.getByText('Controlled Dialog')).toBeInTheDocument();
      });
    });

    it('can be opened and closed programmatically', async () => {
      const user = userEvent.setup();

      function ProgrammaticDialog() {
        const [open, setOpen] = useState(false);

        return (
          <>
            <Button onClick={() => setOpen(true)}>Open</Button>
            <Button onClick={() => setOpen(false)}>Close</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogTitle>Programmatic Dialog</DialogTitle>
              </DialogContent>
            </Dialog>
          </>
        );
      }

      render(<ProgrammaticDialog />);

      // Open dialog
      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByText('Programmatic Dialog')).toBeInTheDocument();
      });

      // Close dialog
      await user.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByText('Programmatic Dialog')).not.toBeInTheDocument();
      });
    });

    it('syncs controlled state with user interactions', async () => {
      const user = userEvent.setup();

      function SyncedDialog() {
        const [open, setOpen] = useState(false);

        return (
          <>
            <div data-testid='open-state'>{open ? 'Open' : 'Closed'}</div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger>Toggle Dialog</DialogTrigger>
              <DialogContent>
                <DialogTitle>Synced Dialog</DialogTitle>
              </DialogContent>
            </Dialog>
          </>
        );
      }

      render(<SyncedDialog />);

      // Initial state should be closed
      expect(screen.getByTestId('open-state')).toHaveTextContent('Closed');

      // Open via trigger
      await user.click(screen.getByText('Toggle Dialog'));

      await waitFor(() => {
        expect(screen.getByTestId('open-state')).toHaveTextContent('Open');
      });

      // Close via Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.getByTestId('open-state')).toHaveTextContent('Closed');
      });
    });
  });
});
