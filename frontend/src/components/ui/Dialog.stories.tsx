/**
 * Dialog Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Dialog component
 * - Modal overlays for focused interactions
 * - Confirmation dialogs
 * - Forms in modals
 * - Alert and warning patterns
 * 
 * Architecture: Built on Radix UI Dialog primitive
 * - Focus trap and restoration
 * - Escape key to close
 * - Click outside to close
 * - Portal rendering for z-index
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { useState } from 'react';

const meta = {
  title: 'Design System/Molecules/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Dialog Component

A modal overlay component for focused user interactions.

## Features
- ✅ Focus trap - keyboard navigation contained
- ✅ Escape key closes dialog
- ✅ Click outside to close
- ✅ Portal rendering for proper z-index
- ✅ Focus restoration on close
- ✅ ARIA attributes for accessibility
- ✅ Smooth animations
- ✅ Backdrop overlay

## Usage
\`\`\`tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text.
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
\`\`\`

## Accessibility
- Focus automatically moves to dialog when opened
- Focus trapped inside dialog
- Escape key closes dialog
- Focus returns to trigger on close
- ARIA labels and descriptions
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Dialog
 * Basic dialog with title and description
 */
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to TerraFusion</DialogTitle>
          <DialogDescription>
            This is a basic dialog with a title and description. You can press Escape or click outside to close it.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default dialog with title and description.',
      },
    },
  },
};

/**
 * Story 2: Confirmation Dialog
 * Dialog for confirming destructive actions
 */
export const ConfirmationDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Confirmation dialog for destructive actions with clear warnings.',
      },
    },
  },
};

/**
 * Story 3: Form Dialog
 * Dialog containing a form for user input
 */
export const FormDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" defaultValue="John Doe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" defaultValue="@johndoe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              defaultValue="john@example.com"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with a form for editing user information.',
      },
    },
  },
};

/**
 * Story 4: Alert Dialog Variants
 * Different types of alert dialogs
 */
export const AlertDialogVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {/* Success Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Success</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">✓ Success!</DialogTitle>
            <DialogDescription>
              Your changes have been saved successfully. You can continue working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Warning</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-yellow-600">⚠ Warning</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave this page?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Stay</Button>
            <Button>Leave Anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Error</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">✗ Error</DialogTitle>
            <DialogDescription>
              Something went wrong. Please try again or contact support if the problem persists.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Contact Support</Button>
            <Button>Try Again</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Info</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-600">ℹ Information</DialogTitle>
            <DialogDescription>
              This feature is currently in beta. Some functionality may be limited or change in future updates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different alert dialog types: success, warning, error, and info.',
      },
    },
  },
};

/**
 * Story 5: Interactive Dialog with State
 * Controlled dialog with form submission
 */
export const InteractiveDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
      }, 1500);
    };

    return (
      <div className="space-y-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Contact Us</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            {!submitted ? (
              <>
                <DialogHeader>
                  <DialogTitle>Send us a message</DialogTitle>
                  <DialogDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input
                      id="contact-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <Input
                      id="contact-message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Your message..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>Send Message</Button>
                </DialogFooter>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="text-4xl mb-4">✓</div>
                <DialogTitle className="text-green-600">Message Sent!</DialogTitle>
                <DialogDescription className="mt-2">
                  We've received your message and will respond soon.
                </DialogDescription>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {formData.name && formData.email && formData.message && (
          <div className="rounded-lg border p-4 bg-muted text-sm">
            <p className="font-medium mb-2">Preview:</p>
            <p><strong>Name:</strong> {formData.name}</p>
            <p><strong>Email:</strong> {formData.email}</p>
            <p><strong>Message:</strong> {formData.message}</p>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled dialog with form state management and success feedback.',
      },
    },
  },
};

/**
 * Story 6: Real-World Examples
 * Common dialog patterns in production apps
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-4 flex flex-wrap gap-4">
      {/* Delete Confirmation */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete File</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "Project_Final.pdf"?</DialogTitle>
            <DialogDescription>
              This file will be permanently deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Share</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this project</DialogTitle>
            <DialogDescription>
              Anyone with this link will be able to view this project.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="share-link" className="sr-only">
                Link
              </Label>
              <Input
                id="share-link"
                defaultValue="https://terrafusion.io/project/123"
                readOnly
              />
            </div>
            <Button type="button" size="sm" className="px-3">
              Copy
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Team Member */}
      <Dialog>
        <DialogTrigger asChild>
          <Button>Add Team Member</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Role</Label>
              <Input id="invite-role" defaultValue="Member" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-message">Personal message (optional)</Label>
              <Input
                id="invite-message"
                placeholder="Looking forward to working with you!"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Settings</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>
              Configure your project settings and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input id="project-name" defaultValue="My Awesome Project" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-desc">Description</Label>
              <Input
                id="project-desc"
                defaultValue="A revolutionary new application"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-visibility">Visibility</Label>
              <Input id="project-visibility" defaultValue="Private" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common dialog patterns: delete confirmation, sharing, invitations, and settings.',
      },
    },
  },
};

/**
 * Story 7: Usage Guidelines
 * Best practices for using dialogs
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Dialog Component Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using dialogs in your applications.
        </p>
      </div>

      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use for important actions</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive">Delete</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm deletion</DialogTitle>
                  <DialogDescription>This cannot be undone.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <p className="text-sm text-muted-foreground">
              Require confirmation for destructive actions
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Keep content focused</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Good Example</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear title</DialogTitle>
                  <DialogDescription>Concise description</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <p className="text-sm text-muted-foreground">
              Single purpose per dialog
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Provide clear actions</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Good Actions</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save changes?</DialogTitle>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <p className="text-sm text-muted-foreground">
              Clear primary and secondary actions
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use descriptive titles</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Descriptive</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete 3 selected files?</DialogTitle>
                  <DialogDescription>Files will be moved to trash</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <p className="text-sm text-muted-foreground">
              Title should explain the action
            </p>
          </div>
        </div>
      </div>

      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't overuse dialogs</p>
            <p className="text-sm text-muted-foreground">
              Not every action needs a dialog. Use sparingly for important interactions.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't nest dialogs</p>
            <p className="text-sm text-muted-foreground">
              Opening a dialog from another dialog creates confusion. Redesign the flow.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use for notifications</p>
            <p className="text-sm text-muted-foreground">
              Use toast notifications for success messages, not dialogs.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't make dialogs too large</p>
            <p className="text-sm text-muted-foreground">
              If content is complex, use a full page instead of a dialog.
            </p>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Dialog</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Controlled Dialog</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Accessibility Checklist</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Focus automatically moves to dialog on open</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Focus trapped inside dialog - Tab cycles through interactive elements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Escape key closes the dialog</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Focus returns to trigger element on close</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>ARIA role="dialog" applied automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>DialogTitle provides aria-labelledby</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>DialogDescription provides aria-describedby</span>
          </li>
        </ul>
      </div>

      {/* Best Practices */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">UX Best Practices</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">1.</span>
            <div>
              <p className="font-medium">Use for focused tasks</p>
              <p className="text-muted-foreground">
                Dialogs should interrupt the user for important decisions or data entry
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <div>
              <p className="font-medium">Make the primary action clear</p>
              <p className="text-muted-foreground">
                Use visual hierarchy to guide users to the main action
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <div>
              <p className="font-medium">Provide escape routes</p>
              <p className="text-muted-foreground">
                Always offer Cancel/Close options and allow Escape key
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <div>
              <p className="font-medium">Keep content concise</p>
              <p className="text-muted-foreground">
                Dialogs should be scannable at a glance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Comprehensive guidelines with best practices, code examples, and accessibility.',
      },
    },
  },
};
