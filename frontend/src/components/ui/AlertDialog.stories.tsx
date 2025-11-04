import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertTriangle, FileX, LogOut, Save, Trash2 } from 'lucide-react';
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
import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A modal dialog that interrupts the user with important content and expects a response. Use for critical confirmations like deletions, destructive actions, or decisions that cannot be easily undone.',
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default alert dialog with title, description, and two action buttons.
 * The Continue button is styled as the primary action.
 */
export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='outline'>Open Alert Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

/**
 * Destructive alert dialog for dangerous actions.
 * Uses red styling for the action button to indicate danger.
 */
export const Destructive: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='destructive'>
          <Trash2 className='mr-2 h-4 w-4' />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100'>
              <AlertTriangle className='h-5 w-5 text-red-600' />
            </div>
            <AlertDialogTitle className='text-left'>Delete Account Permanently</AlertDialogTitle>
          </div>
          <AlertDialogDescription className='pt-3'>
            This action <strong>cannot be undone</strong>. This will permanently delete your
            account, including:
            <ul className='mt-2 list-disc space-y-1 pl-6'>
              <li>All your personal data</li>
              <li>Project history and files</li>
              <li>Team memberships</li>
              <li>Billing information</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className='bg-red-600 hover:bg-red-700'>
            <Trash2 className='mr-2 h-4 w-4' />
            Yes, Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

/**
 * Alert dialog with form input for confirmation.
 * Requires user to type confirmation text before enabling delete action.
 */
export const WithForm: Story = {
  render: () => {
    const [confirmText, setConfirmText] = React.useState('');
    const isValid = confirmText === 'DELETE';

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='destructive'>Delete Repository</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "my-awesome-project"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the repository and all of its contents. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='confirm-text'>
                Type{' '}
                <code className='rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm'>DELETE</code>{' '}
                to confirm
              </Label>
              <Input
                id='confirm-text'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='Type DELETE'
                className='font-mono'
              />
            </div>
            <p className='text-sm text-muted-foreground'>
              {isValid ? (
                <span className='text-green-600'>✓ Confirmation text matches</span>
              ) : (
                <span>Please type DELETE to confirm</span>
              )}
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!isValid}
              className='bg-red-600 hover:bg-red-700 disabled:opacity-50'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Repository
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
};

/**
 * Alert dialog with async action simulation.
 * Shows loading state while action is being processed.
 */
export const AsyncAction: Story = {
  render: () => {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleConfirm = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsLoading(false);
      alert('Action completed successfully!');
    };

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Process Data</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process 1,234 Records?</AlertDialogTitle>
            <AlertDialogDescription>
              This will process all pending records and may take several minutes. You can continue
              working while this runs in the background.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={isLoading}
              className='min-w-[100px]'
            >
              {isLoading ? (
                <>
                  <span className='mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  Processing...
                </>
              ) : (
                'Start Processing'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
};

/**
 * Alert dialog with rich content including icons, lists, and emphasized text.
 * Demonstrates how to structure complex confirmation dialogs.
 */
export const NestedContent: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='outline'>
          <LogOut className='mr-2 h-4 w-4' />
          Sign Out
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100'>
              <LogOut className='h-5 w-5 text-amber-600' />
            </div>
            <AlertDialogTitle className='text-left'>Sign Out of TerraFusion?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className='space-y-3 pt-3'>
            <p>You're about to sign out of your account. Before you go:</p>

            <div className='rounded-md border border-slate-200 bg-slate-50 p-3'>
              <h4 className='mb-2 font-semibold text-slate-900'>Unsaved Changes</h4>
              <ul className='space-y-1 text-sm'>
                <li className='flex items-center gap-2'>
                  <FileX className='h-4 w-4 text-amber-600' />
                  <span>
                    3 documents with <strong>unsaved changes</strong>
                  </span>
                </li>
                <li className='flex items-center gap-2'>
                  <Save className='h-4 w-4 text-blue-600' />
                  <span>Last auto-save: 2 minutes ago</span>
                </li>
              </ul>
            </div>

            <p className='text-sm'>
              Your work will be automatically saved, but any unsaved changes in the last 5 minutes
              may be lost.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay Signed In</AlertDialogCancel>
          <AlertDialogAction className='bg-amber-600 hover:bg-amber-700'>
            <LogOut className='mr-2 h-4 w-4' />
            Sign Out Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

/**
 * Real-world example: Delete confirmation dialog.
 * Common pattern for confirming destructive actions with clear consequences.
 */
export const RealWorldDeleteConfirmation: Story = {
  render: () => {
    const fileName = 'Q4_Financial_Report.xlsx';
    const fileSize = '2.4 MB';
    const lastModified = '2 hours ago';

    return (
      <div className='space-y-4'>
        {/* File list item */}
        <div className='flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded bg-green-100'>
              <FileX className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <h4 className='font-semibold text-slate-900'>{fileName}</h4>
              <p className='text-sm text-slate-600'>
                {fileSize} • Modified {lastModified}
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='ghost' size='sm'>
                <Trash2 className='h-4 w-4 text-red-600' />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{fileName}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This file will be permanently deleted and cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className='rounded-md border border-amber-200 bg-amber-50 p-3'>
                <div className='flex gap-2'>
                  <AlertTriangle className='h-5 w-5 shrink-0 text-amber-600' />
                  <div className='space-y-1'>
                    <p className='text-sm font-medium text-amber-900'>This file is shared</p>
                    <p className='text-sm text-amber-800'>
                      3 team members have access. They will lose access when you delete this file.
                    </p>
                  </div>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Keep File</AlertDialogCancel>
                <AlertDialogAction className='bg-red-600 hover:bg-red-700'>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  },
};

/**
 * Real-world example: Unsaved changes dialog.
 * Prevents data loss by confirming navigation away from unsaved work.
 */
export const RealWorldUnsavedChanges: Story = {
  render: () => {
    return (
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100'>
                <AlertTriangle className='h-5 w-5 text-amber-600' />
              </div>
              <AlertDialogTitle className='text-left'>Unsaved Changes</AlertDialogTitle>
            </div>
            <AlertDialogDescription className='pt-3'>
              You have unsaved changes in your document. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Current Document</span>
              <span className='text-xs text-slate-600'>Last saved: 5 min ago</span>
            </div>
            <p className='text-sm text-slate-700'>"Product Roadmap Q1 2024.docx"</p>
            <div className='mt-2 flex gap-2 text-xs text-slate-600'>
              <span>• 247 words added</span>
              <span>• 3 images inserted</span>
              <span>• 1 table modified</span>
            </div>
          </div>

          <AlertDialogFooter className='sm:space-x-2'>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant='outline' asChild>
              <AlertDialogAction className='bg-white hover:bg-slate-100'>
                Discard Changes
              </AlertDialogAction>
            </Button>
            <AlertDialogAction className='bg-blue-600 hover:bg-blue-700'>
              <Save className='mr-2 h-4 w-4' />
              Save & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
};

/**
 * Usage guidelines for AlertDialog component.
 * Includes Do's and Don'ts, keyboard shortcuts, and best practices.
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className='max-w-4xl space-y-8 p-8'>
      <div>
        <h2 className='mb-4 text-2xl font-bold'>AlertDialog Usage Guidelines</h2>
        <p className='text-slate-600'>
          Use alert dialogs to interrupt the user with important information that requires a
          decision or acknowledgment.
        </p>
      </div>

      <div className='space-y-6'>
        <div>
          <h3 className='mb-3 text-lg font-semibold text-green-700'>✓ Do's</h3>
          <ul className='space-y-2'>
            <li className='flex gap-3'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>Use for critical decisions</strong> that cannot be easily undone (deletions,
                destructive actions, irreversible changes)
              </span>
            </li>
            <li className='flex gap-3'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>Provide clear action buttons</strong> with descriptive labels ("Delete
                Account" not just "OK")
              </span>
            </li>
            <li className='flex gap-3'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>Explain consequences</strong> clearly in the description (what will happen
                when they confirm)
              </span>
            </li>
            <li className='flex gap-3'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>Use destructive styling</strong> (red) for dangerous actions to visually
                reinforce the warning
              </span>
            </li>
            <li className='flex gap-3'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>Require confirmation</strong> for high-risk actions (type "DELETE",
                checkboxes, multi-step)
              </span>
            </li>
            <li className='flex gap-3'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>Support keyboard navigation</strong> (Escape to cancel, Tab between buttons)
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className='mb-3 text-lg font-semibold text-red-700'>✗ Don'ts</h3>
          <ul className='space-y-2'>
            <li className='flex gap-3'>
              <span className='text-red-600'>✗</span>
              <span>
                <strong>Don't overuse</strong> alert dialogs for minor decisions or informational
                messages (use Toast or Dialog instead)
              </span>
            </li>
            <li className='flex gap-3'>
              <span className='text-red-600'>✗</span>
              <span>
                <strong>Don't use generic labels</strong> like "OK" or "Submit" - be specific about
                what will happen
              </span>
            </li>
            <li className='flex gap-3'>
              <span className='text-red-600'>✗</span>
              <span>
                <strong>Don't nest alert dialogs</strong> - if you need multi-step confirmation, use
                a wizard or stepper instead
              </span>
            </li>
            <li className='flex gap-3'>
              <span className='text-red-600'>✗</span>
              <span>
                <strong>Don't include forms</strong> with many fields - keep it simple or use a
                regular Dialog
              </span>
            </li>
            <li className='flex gap-3'>
              <span className='text-red-600'>✗</span>
              <span>
                <strong>Don't trap users</strong> without a clear way to cancel or close the dialog
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Keyboard Shortcuts</h3>
        <div className='overflow-hidden rounded-lg border border-slate-200'>
          <table className='w-full'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='px-4 py-3 text-left text-sm font-semibold'>Key</th>
                <th className='px-4 py-3 text-left text-sm font-semibold'>Action</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-200'>
              <tr>
                <td className='px-4 py-3'>
                  <code className='rounded bg-slate-100 px-2 py-1 font-mono text-sm'>Escape</code>
                </td>
                <td className='px-4 py-3 text-sm'>Close the alert dialog (same as Cancel)</td>
              </tr>
              <tr>
                <td className='px-4 py-3'>
                  <code className='rounded bg-slate-100 px-2 py-1 font-mono text-sm'>Tab</code>
                </td>
                <td className='px-4 py-3 text-sm'>Move focus between Cancel and Action buttons</td>
              </tr>
              <tr>
                <td className='px-4 py-3'>
                  <code className='rounded bg-slate-100 px-2 py-1 font-mono text-sm'>Enter</code>
                </td>
                <td className='px-4 py-3 text-sm'>
                  Activate the focused button (Cancel or Action)
                </td>
              </tr>
              <tr>
                <td className='px-4 py-3'>
                  <code className='rounded bg-slate-100 px-2 py-1 font-mono text-sm'>Space</code>
                </td>
                <td className='px-4 py-3 text-sm'>
                  Activate the focused button (Cancel or Action)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Code Examples</h3>

        <div className='space-y-4'>
          <div>
            <h4 className='mb-2 font-medium'>Basic Usage</h4>
            <pre className='overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-white'>
              <code>{`<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}</code>
            </pre>
          </div>

          <div>
            <h4 className='mb-2 font-medium'>Programmatic Control</h4>
            <pre className='overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-white'>
              <code>{`const [open, setOpen] = useState(false);

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirm Action</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to proceed?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => {
        // Perform action
        setOpen(false);
      }}>
        Confirm
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className='rounded-lg border-2 border-blue-200 bg-blue-50 p-6'>
        <h3 className='mb-2 font-semibold text-blue-900'>Focus Management</h3>
        <p className='text-sm text-blue-800'>
          The AlertDialog automatically manages focus: when opened, focus moves to the first
          focusable element (usually Cancel button). When closed, focus returns to the trigger
          element. This ensures keyboard users can navigate efficiently and screen readers announce
          the dialog properly.
        </p>
      </div>

      <div className='rounded-lg border-2 border-purple-200 bg-purple-50 p-6'>
        <h3 className='mb-2 font-semibold text-purple-900'>ARIA Accessibility</h3>
        <p className='text-sm text-purple-800'>
          AlertDialog uses <code>role="alertdialog"</code> to announce critical content to screen
          readers. The title is referenced via <code>aria-labelledby</code> and description via{' '}
          <code>aria-describedby</code>. The dialog is modal, preventing interaction with background
          content until dismissed.
        </p>
      </div>
    </div>
  ),
};
