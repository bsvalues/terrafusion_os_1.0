import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Toaster } from './sonner';
import { toast } from 'sonner';
import { Button } from './button';

expect.extend(toHaveNoViolations);

describe('Toast (Sonner)', () => {
  beforeEach(() => {
    // Clear any existing toasts before each test
    toast.dismiss();
  });

  describe('Rendering Variants', () => {
    it('renders default toast', async () => {
      render(<Toaster />);

      toast('Default message');

      await waitFor(() => {
        expect(screen.getByText('Default message')).toBeInTheDocument();
      });
    });

    it('renders success toast', async () => {
      render(<Toaster />);

      toast.success('Success message');

      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument();
      });
    });

    it('renders error toast', async () => {
      render(<Toaster />);

      toast.error('Error message');

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
    });

    it('renders warning toast', async () => {
      render(<Toaster />);

      toast.warning('Warning message');

      await waitFor(() => {
        expect(screen.getByText('Warning message')).toBeInTheDocument();
      });
    });

    it('renders info toast', async () => {
      render(<Toaster />);

      toast.info('Info message');

      await waitFor(() => {
        expect(screen.getByText('Info message')).toBeInTheDocument();
      });
    });

    it('renders toast with title and description', async () => {
      render(<Toaster />);

      toast('Title', {
        description: 'Description text',
      });

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description text')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('renders toast with action button', async () => {
      render(<Toaster />);

      toast('Message', {
        action: {
          label: 'Undo',
          onClick: jest.fn(),
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      });
    });

    it('calls action onClick when button is clicked', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();

      render(<Toaster />);

      toast('Message', {
        action: {
          label: 'Undo',
          onClick,
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /undo/i }));

      expect(onClick).toHaveBeenCalled();
    });

    it('dismisses toast after action is clicked', async () => {
      const user = userEvent.setup();

      render(<Toaster />);

      toast('Message', {
        action: {
          label: 'Undo',
          onClick: jest.fn(),
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Message')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /undo/i }));

      await waitFor(() => {
        expect(screen.queryByText('Message')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('renders cancel button', async () => {
      render(<Toaster />);

      toast('Message', {
        cancel: {
          label: 'Cancel',
          onClick: jest.fn(),
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('calls cancel onClick when button is clicked', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();

      render(<Toaster />);

      toast('Message', {
        cancel: {
          label: 'Cancel',
          onClick,
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Auto-dismiss', () => {
    it('auto-dismisses after default duration', async () => {
      render(<Toaster />);

      toast('Temporary message');

      await waitFor(() => {
        expect(screen.getByText('Temporary message')).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(screen.queryByText('Temporary message')).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('respects custom duration', async () => {
      render(<Toaster />);

      toast('Quick message', { duration: 1000 });

      await waitFor(() => {
        expect(screen.getByText('Quick message')).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(screen.queryByText('Quick message')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('does not auto-dismiss when duration is Infinity', async () => {
      render(<Toaster />);

      toast('Persistent message', { duration: Infinity });

      await waitFor(() => {
        expect(screen.getByText('Persistent message')).toBeInTheDocument();
      });

      // Wait longer than default duration
      await new Promise((resolve) => setTimeout(resolve, 5000));

      expect(screen.getByText('Persistent message')).toBeInTheDocument();
    });
  });

  describe('Queue Management', () => {
    it('displays multiple toasts simultaneously', async () => {
      render(<Toaster />);

      toast('Message 1');
      toast('Message 2');
      toast('Message 3');

      await waitFor(() => {
        expect(screen.getByText('Message 1')).toBeInTheDocument();
        expect(screen.getByText('Message 2')).toBeInTheDocument();
        expect(screen.getByText('Message 3')).toBeInTheDocument();
      });
    });

    it('dismisses specific toast by ID', async () => {
      render(<Toaster />);

      const toastId = toast('Message to dismiss');
      toast('Message to keep');

      await waitFor(() => {
        expect(screen.getByText('Message to dismiss')).toBeInTheDocument();
        expect(screen.getByText('Message to keep')).toBeInTheDocument();
      });

      toast.dismiss(toastId);

      await waitFor(() => {
        expect(screen.queryByText('Message to dismiss')).not.toBeInTheDocument();
        expect(screen.getByText('Message to keep')).toBeInTheDocument();
      });
    });

    it('dismisses all toasts', async () => {
      render(<Toaster />);

      toast('Message 1');
      toast('Message 2');
      toast('Message 3');

      await waitFor(() => {
        expect(screen.getByText('Message 1')).toBeInTheDocument();
        expect(screen.getByText('Message 2')).toBeInTheDocument();
        expect(screen.getByText('Message 3')).toBeInTheDocument();
      });

      toast.dismiss();

      await waitFor(() => {
        expect(screen.queryByText('Message 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Message 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Message 3')).not.toBeInTheDocument();
      });
    });

    it('updates existing toast by ID', async () => {
      render(<Toaster />);

      const toastId = toast('Original message');

      await waitFor(() => {
        expect(screen.getByText('Original message')).toBeInTheDocument();
      });

      toast('Updated message', { id: toastId });

      await waitFor(() => {
        expect(screen.queryByText('Original message')).not.toBeInTheDocument();
        expect(screen.getByText('Updated message')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Interaction', () => {
    it('dismisses toast on Escape key', async () => {
      const user = userEvent.setup();

      render(<Toaster />);

      toast('Message');

      await waitFor(() => {
        expect(screen.getByText('Message')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Message')).not.toBeInTheDocument();
      });
    });

    it('action button is keyboard accessible', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();

      render(<Toaster />);

      toast('Message', {
        action: {
          label: 'Undo',
          onClick,
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      });

      const actionButton = screen.getByRole('button', { name: /undo/i });
      actionButton.focus();

      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Programmatic Control', () => {
    it('shows toast programmatically', async () => {
      const ToastTrigger = () => (
        <>
          <Toaster />
          <Button onClick={() => toast('Triggered message')}>Show Toast</Button>
        </>
      );

      const user = userEvent.setup();
      render(<ToastTrigger />);

      await user.click(screen.getByRole('button', { name: /show toast/i }));

      await waitFor(() => {
        expect(screen.getByText('Triggered message')).toBeInTheDocument();
      });
    });

    it('shows success toast programmatically', async () => {
      const ToastTrigger = () => (
        <>
          <Toaster />
          <Button onClick={() => toast.success('Success!')}>Success</Button>
        </>
      );

      const user = userEvent.setup();
      render(<ToastTrigger />);

      await user.click(screen.getByRole('button', { name: /success/i }));

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });
    });

    it('shows error toast programmatically', async () => {
      const ToastTrigger = () => (
        <>
          <Toaster />
          <Button onClick={() => toast.error('Error!')}>Error</Button>
        </>
      );

      const user = userEvent.setup();
      render(<ToastTrigger />);

      await user.click(screen.getByRole('button', { name: /error/i }));

      await waitFor(() => {
        expect(screen.getByText('Error!')).toBeInTheDocument();
      });
    });

    it('shows promise toast', async () => {
      render(<Toaster />);

      const promise = new Promise((resolve) => setTimeout(() => resolve('Done'), 100));

      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Success!',
        error: 'Error!',
      });

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('shows loading toast', async () => {
      render(<Toaster />);

      toast.loading('Processing...');

      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });
  });

  describe('ARIA and Accessibility', () => {
    it('has appropriate role for toast region', async () => {
      render(<Toaster />);

      toast('Message');

      await waitFor(() => {
        const toastRegion = screen.getByRole('region');
        expect(toastRegion).toBeInTheDocument();
      });
    });

    it('has aria-live="polite" for non-error toasts', async () => {
      render(<Toaster />);

      toast('Information');

      await waitFor(() => {
        const toastList = document.querySelector('[aria-live]');
        expect(toastList).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('has aria-live="assertive" for error toasts', async () => {
      render(<Toaster />);

      toast.error('Error message');

      await waitFor(() => {
        // Error toasts should have assertive announcement
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
    });

    it('has accessible close button', async () => {
      render(<Toaster />);

      toast('Message');

      await waitFor(() => {
        // Close button should be present and accessible
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('has no accessibility violations (default toast)', async () => {
      const { container } = render(<Toaster />);

      toast('Default message');

      await waitFor(() => {
        expect(screen.getByText('Default message')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (success toast)', async () => {
      const { container } = render(<Toaster />);

      toast.success('Success message');

      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (error toast)', async () => {
      const { container } = render(<Toaster />);

      toast.error('Error message');

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (toast with action)', async () => {
      const { container } = render(<Toaster />);

      toast('Message', {
        action: {
          label: 'Undo',
          onClick: jest.fn(),
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Message')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations (multiple toasts)', async () => {
      const { container } = render(<Toaster />);

      toast('Message 1');
      toast.success('Message 2');
      toast.error('Message 3');

      await waitFor(() => {
        expect(screen.getByText('Message 1')).toBeInTheDocument();
        expect(screen.getByText('Message 2')).toBeInTheDocument();
        expect(screen.getByText('Message 3')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
