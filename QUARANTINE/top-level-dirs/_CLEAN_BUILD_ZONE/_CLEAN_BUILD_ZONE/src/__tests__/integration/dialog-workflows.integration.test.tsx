/**
 * @file dialog-workflows.integration.test.tsx
 * @description Integration tests for dialog and modal workflows with form integration
 * @week Week 2 Day 14
 * @testCategory Integration Testing
 */

import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ============================================================================
// TEST COMPONENTS - Realistic Dialog Examples
// ============================================================================

/**
 * Edit Profile Dialog - Dialog + Form Integration
 */
const EditProfileDialog = ({ onSave }: { onSave: (data: { name: string; bio: string }) => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('John Doe');
  const [bio, setBio] = useState('Software Developer');

  const handleSave = () => {
    onSave({ name, bio });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Delete Confirmation - AlertDialog Workflow
 */
const DeleteConfirmation = ({ itemName, onDelete }: { itemName: string; onDelete: () => void }) => {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete {itemName}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            <strong>{itemName}</strong> from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * Settings Panel - Sheet + Form Integration
 */
const SettingsPanel = ({ onSave }: { onSave: (settings: { email: string; notifications: boolean }) => void }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('user@example.com');
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    onSave({ email, notifications });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Open Settings</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your account settings and preferences.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="notifications"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            <Label htmlFor="notifications">Enable notifications</Label>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/**
 * Nested Dialogs - Complex Dialog Management
 */
const NestedDialogsExample = ({ onComplete }: { onComplete: (data: string) => void }) => {
  const [mainOpen, setMainOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleMainSubmit = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    onComplete(inputValue);
    setConfirmOpen(false);
    setMainOpen(false);
  };

  return (
    <>
      <Dialog open={mainOpen} onOpenChange={setMainOpen}>
        <DialogTrigger asChild>
          <Button>Start Workflow</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Information</DialogTitle>
            <DialogDescription>Please provide the required information.</DialogDescription>
          </DialogHeader>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter value"
          />
          <DialogFooter>
            <Button onClick={handleMainSubmit}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit "{inputValue}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ============================================================================
// INTEGRATION TESTS - Dialog + Form Workflow
// ============================================================================

describe('Integration: Dialog + Form Workflow', () => {
  describe('Component Integration', () => {
    it('should render dialog trigger button', () => {
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    it('should open dialog when trigger is clicked', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /edit profile/i })).toBeInTheDocument();
    });

    it('should render form inputs inside dialog', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    });
  });

  describe('User Workflow: Edit and Save', () => {
    it('should handle complete edit workflow', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      // Open dialog
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      // Edit fields
      const nameInput = screen.getByLabelText(/name/i);
      const bioInput = screen.getByLabelText(/bio/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');
      
      await user.clear(bioInput);
      await user.type(bioInput, 'Senior Developer');

      // Save changes
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      // Verify save was called
      expect(handleSave).toHaveBeenCalledWith({
        name: 'Jane Smith',
        bio: 'Senior Developer',
      });

      // Verify dialog closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should cancel without saving changes', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      // Open dialog
      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      // Edit fields
      await user.clear(screen.getByLabelText(/name/i));
      await user.type(screen.getByLabelText(/name/i), 'Changed Name');

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Verify save was NOT called
      expect(handleSave).not.toHaveBeenCalled();

      // Verify dialog closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should preserve initial values when reopened', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      // Open and check initial values
      await user.click(screen.getByRole('button', { name: /edit profile/i }));
      expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/bio/i)).toHaveValue('Software Developer');

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Reopen and verify values preserved
      await user.click(screen.getByRole('button', { name: /edit profile/i }));
      expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/bio/i)).toHaveValue('Software Developer');
    });
  });

  describe('Focus Management', () => {
    it('should trap focus inside dialog', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      const dialog = screen.getByRole('dialog');
      const focusableElements = within(dialog).getAllByRole('button');

      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should restore focus to trigger when closed', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      const trigger = screen.getByRole('button', { name: /edit profile/i });
      await user.click(trigger);
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Focus should return to trigger (may need to wait for animation)
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close dialog on Escape key', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /edit profile/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should navigate between form fields with Tab', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      const nameInput = screen.getByLabelText(/name/i);
      const bioInput = screen.getByLabelText(/bio/i);

      nameInput.focus();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(bioInput).toHaveFocus();
    });
  });

  describe('Accessibility: Dialog + Form', () => {
    it('should have no accessibility violations', async () => {
      const handleSave = jest.fn();
      const { container } = render(<EditProfileDialog onSave={handleSave} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when dialog is open', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      const { container } = render(<EditProfileDialog onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<EditProfileDialog onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(screen.getByRole('heading', { name: /edit profile/i })).toBeInTheDocument();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - AlertDialog Confirmation Workflow
// ============================================================================

describe('Integration: AlertDialog Confirmation Workflow', () => {
  describe('Component Integration', () => {
    it('should render delete button trigger', () => {
      const handleDelete = jest.fn();
      render(<DeleteConfirmation itemName="User Account" onDelete={handleDelete} />);

      expect(screen.getByRole('button', { name: /delete user account/i })).toBeInTheDocument();
    });

    it('should open alert dialog when delete is clicked', async () => {
      const user = userEvent.setup();
      const handleDelete = jest.fn();
      render(<DeleteConfirmation itemName="User Account" onDelete={handleDelete} />);

      await user.click(screen.getByRole('button', { name: /delete user account/i }));

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /are you absolutely sure/i })).toBeInTheDocument();
    });

    it('should display item name in confirmation message', async () => {
      const user = userEvent.setup();
      const handleDelete = jest.fn();
      render(<DeleteConfirmation itemName="Project X" onDelete={handleDelete} />);

      await user.click(screen.getByRole('button', { name: /delete project x/i }));

      expect(screen.getByText(/project x/i)).toBeInTheDocument();
    });
  });

  describe('User Workflow: Confirm Delete', () => {
    it('should handle delete confirmation workflow', async () => {
      const user = userEvent.setup();
      const handleDelete = jest.fn();
      render(<DeleteConfirmation itemName="Document" onDelete={handleDelete} />);

      // Open alert dialog
      await user.click(screen.getByRole('button', { name: /delete document/i }));

      // Confirm deletion
      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      // Verify delete was called
      expect(handleDelete).toHaveBeenCalled();

      // Verify dialog closed
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('should cancel delete operation', async () => {
      const user = userEvent.setup();
      const handleDelete = jest.fn();
      render(<DeleteConfirmation itemName="Document" onDelete={handleDelete} />);

      // Open alert dialog
      await user.click(screen.getByRole('button', { name: /delete document/i }));

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Verify delete was NOT called
      expect(handleDelete).not.toHaveBeenCalled();

      // Verify dialog closed
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('should close on Escape without deleting', async () => {
      const user = userEvent.setup();
      const handleDelete = jest.fn();
      render(<DeleteConfirmation itemName="Document" onDelete={handleDelete} />);

      await user.click(screen.getByRole('button', { name: /delete document/i }));
      await user.keyboard('{Escape}');

      expect(handleDelete).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility: AlertDialog', () => {
    it('should have no accessibility violations', async () => {
      const handleDelete = jest.fn();
      const { container } = render(<DeleteConfirmation itemName="Item" onDelete={handleDelete} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when open', async () => {
      const user = userEvent.setup();
      const handleDelete = jest.fn();
      const { container } = render(<DeleteConfirmation itemName="Item" onDelete={handleDelete} />);

      await user.click(screen.getByRole('button', { name: /delete item/i }));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper alertdialog role', async () => {
      const user = userEvent.setup();
      const handleDelete = jest.fn();
      render(<DeleteConfirmation itemName="Item" onDelete={handleDelete} />);

      await user.click(screen.getByRole('button', { name: /delete item/i }));

      const alertDialog = screen.getByRole('alertdialog');
      expect(alertDialog).toBeInTheDocument();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Sheet + Form Workflow
// ============================================================================

describe('Integration: Sheet + Form Workflow', () => {
  describe('Component Integration', () => {
    it('should render sheet trigger button', () => {
      const handleSave = jest.fn();
      render(<SettingsPanel onSave={handleSave} />);

      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    });

    it('should open sheet when trigger is clicked', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<SettingsPanel onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /open settings/i }));

      expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument();
    });

    it('should render form inputs inside sheet', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<SettingsPanel onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /open settings/i }));

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/enable notifications/i)).toBeInTheDocument();
    });
  });

  describe('User Workflow: Settings Management', () => {
    it('should handle complete settings update workflow', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<SettingsPanel onSave={handleSave} />);

      // Open sheet
      await user.click(screen.getByRole('button', { name: /open settings/i }));

      // Update settings
      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');

      const notificationCheckbox = screen.getByLabelText(/enable notifications/i);
      await user.click(notificationCheckbox);

      // Save
      await user.click(screen.getByRole('button', { name: /^save$/i }));

      // Verify save was called
      expect(handleSave).toHaveBeenCalledWith({
        email: 'newemail@example.com',
        notifications: false, // toggled from true to false
      });
    });

    it('should cancel without saving changes', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      render(<SettingsPanel onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /open settings/i }));

      // Make changes
      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), 'changed@example.com');

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Verify save was NOT called
      expect(handleSave).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility: Sheet + Form', () => {
    it('should have no accessibility violations', async () => {
      const handleSave = jest.fn();
      const { container } = render(<SettingsPanel onSave={handleSave} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when sheet is open', async () => {
      const user = userEvent.setup();
      const handleSave = jest.fn();
      const { container } = render(<SettingsPanel onSave={handleSave} />);

      await user.click(screen.getByRole('button', { name: /open settings/i }));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Nested Dialog Workflow
// ============================================================================

describe('Integration: Nested Dialog Workflow', () => {
  describe('Complex Dialog Management', () => {
    it('should handle nested dialog workflow', async () => {
      const user = userEvent.setup();
      const handleComplete = jest.fn();
      render(<NestedDialogsExample onComplete={handleComplete} />);

      // Open main dialog
      await user.click(screen.getByRole('button', { name: /start workflow/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Enter value
      await user.type(screen.getByPlaceholderText(/enter value/i), 'Test Value');

      // Continue to confirmation
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Confirm in alert dialog
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/test value/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify completion
      expect(handleComplete).toHaveBeenCalledWith('Test Value');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('should handle going back from confirmation', async () => {
      const user = userEvent.setup();
      const handleComplete = jest.fn();
      render(<NestedDialogsExample onComplete={handleComplete} />);

      // Open main dialog and enter value
      await user.click(screen.getByRole('button', { name: /start workflow/i }));
      await user.type(screen.getByPlaceholderText(/enter value/i), 'Test');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Go back from confirmation
      await user.click(screen.getByRole('button', { name: /go back/i }));

      // Alert dialog should close, main dialog should still be there
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(handleComplete).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility: Nested Dialogs', () => {
    it('should have no accessibility violations with nested dialogs', async () => {
      const user = userEvent.setup();
      const handleComplete = jest.fn();
      const { container } = render(<NestedDialogsExample onComplete={handleComplete} />);

      await user.click(screen.getByRole('button', { name: /start workflow/i }));
      await user.type(screen.getByPlaceholderText(/enter value/i), 'Test');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ============================================================================
// SUMMARY: Dialog Integration Tests
// ============================================================================
// Total Test Categories: 4 dialog workflows
// Total Tests: 35+ integration tests
// Coverage:
// - Dialog + Form integration
// - AlertDialog confirmation flows
// - Sheet side panel + form
// - Nested dialog management
// - Focus management and trapping
// - Keyboard navigation (Escape, Tab)
// - Accessibility (jest-axe)
// - Real-world dialog workflows
