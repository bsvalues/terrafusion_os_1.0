import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { Button } from './button';

expect.extend(toHaveNoViolations);

describe('AlertDialog', () => {
  describe('Rendering', () => {
    it('renders trigger button', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
              <AlertDialogDescription>Description</AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByRole('button', { name: /open dialog/i })).toBeInTheDocument();
    });

    it('does not render dialog content initially', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Dialog Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
    });

    it('renders dialog content when opened', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Dialog Title</AlertDialogTitle>
            <AlertDialogDescription>Dialog Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument();
        expect(screen.getByText('Dialog Description')).toBeInTheDocument();
      });
    });

    it('renders with custom className', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className='custom-dialog'>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog');
        expect(dialog.parentElement).toHaveClass('custom-dialog');
      });
    });

    it('renders action and cancel buttons', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
      });
    });
  });

  describe('Open/Close Behavior', () => {
    it('opens dialog on trigger click', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('closes dialog on cancel button click', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('closes dialog on action button click', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('supports controlled open state', async () => {
      const ControlledDialog = () => {
        const [open, setOpen] = React.useState(false);

        return (
          <>
            <button onClick={() => setOpen(true)} data-testid='external-trigger'>
              External Open
            </button>
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogContent>
                <AlertDialogTitle>Controlled Title</AlertDialogTitle>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      };

      const user = userEvent.setup();
      render(<ControlledDialog />);

      await user.click(screen.getByTestId('external-trigger'));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('calls onOpenChange when dialog opens', async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog onOpenChange={onOpenChange}>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
      });
    });

    it('calls onOpenChange when dialog closes', async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog onOpenChange={onOpenChange}>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      onOpenChange.mockClear();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Focus Management', () => {
    it('moves focus to dialog when opened', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toHaveFocus();
      });
    });

    it('returns focus to trigger when closed', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      const trigger = screen.getByRole('button', { name: /open/i });
      await user.click(trigger);
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('traps focus within dialog', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const confirmButton = screen.getByRole('button', { name: /confirm/i });

      expect(cancelButton).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(confirmButton).toHaveFocus();

      await user.keyboard('{Tab}');
      // Focus should cycle back to first element
      expect(cancelButton).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes dialog on Escape key', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });

    it('activates cancel button on Enter key', async () => {
      const onCancel = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      cancelButton.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onCancel).toHaveBeenCalled();
      });
    });

    it('activates action button on Enter key', async () => {
      const onAction = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onAction}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await user.keyboard('{Tab}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onAction).toHaveBeenCalled();
      });
    });

    it('navigates between buttons with Tab', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const confirmButton = screen.getByRole('button', { name: /confirm/i });

      expect(cancelButton).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(confirmButton).toHaveFocus();
    });

    it('navigates backward with Shift+Tab', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await user.keyboard('{Tab}');
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveFocus();

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveFocus();
    });
  });

  describe('Action Buttons', () => {
    it('calls onClick handler for action button', async () => {
      const onAction = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onAction}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /confirm/i }));

      expect(onAction).toHaveBeenCalled();
    });

    it('calls onClick handler for cancel button', async () => {
      const onCancel = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalled();
    });

    it('supports disabled action button', async () => {
      const onAction = jest.fn();
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction disabled onClick={onAction}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const actionButton = screen.getByRole('button', { name: /confirm/i });
      expect(actionButton).toBeDisabled();

      await user.click(actionButton);
      expect(onAction).not.toHaveBeenCalled();
    });

    it('supports async action with loading state', async () => {
      const AsyncDialog = () => {
        const [loading, setLoading] = React.useState(false);

        const handleAction = async () => {
          setLoading(true);
          await new Promise((resolve) => setTimeout(resolve, 100));
          setLoading(false);
        };

        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Open</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Title</AlertDialogTitle>
              <AlertDialogFooter>
                <AlertDialogAction disabled={loading} onClick={handleAction}>
                  {loading ? 'Processing...' : 'Confirm'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      };

      const user = userEvent.setup();
      render(<AsyncDialog />);

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const actionButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(actionButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled();
      });
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has role="alertdialog"', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });

    it('has aria-labelledby referencing title', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog');
        const titleId = screen.getByText('Alert Title').id;
        expect(dialog).toHaveAttribute('aria-labelledby', titleId);
      });
    });

    it('has aria-describedby referencing description', async () => {
      const user = userEvent.setup();

      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description text</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog');
        const descriptionId = screen.getByText('Description text').id;
        expect(dialog).toHaveAttribute('aria-describedby', descriptionId);
      });
    });

    it('has no accessibility violations (closed)', async () => {
      const { container } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (open with default content)', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Open</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to continue?</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /open/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (destructive action)', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='destructive'>Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className='bg-red-600'>Delete Permanently</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByRole('button', { name: /delete/i }));
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
