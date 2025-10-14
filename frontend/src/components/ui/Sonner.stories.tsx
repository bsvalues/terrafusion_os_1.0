import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { Check, X, Info, AlertTriangle, Loader2, Upload } from 'lucide-react';
import { Button } from './button';
import { Toaster } from './sonner';

/**
 * # Sonner Toast Component
 * 
 * An opinionated toast component for React, built on top of the sonner library.
 * Provides beautiful, accessible toast notifications with promise support.
 * 
 * ## Features
 * - **Multiple Types:** Success, error, info, warning, loading, custom
 * - **Positions:** Top/bottom, left/center/right combinations
 * - **Promise Support:** Automatically handles async operations
 * - **Actions:** Add action buttons to toasts
 * - **Dismissible:** Click to dismiss or auto-dismiss
 * - **Stacking:** Multiple toasts stack elegantly
 * - **Accessibility:** Screen reader announcements, keyboard dismissal
 * 
 * ## Use Cases
 * - Form submission feedback
 * - API request status
 * - User action confirmations
 * - Error notifications
 * - Loading states
 * 
 * Built on sonner library with theme integration
 */

const meta: Meta<typeof Toaster> = {
  title: 'Components/Sonner',
  component: Toaster,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Beautiful toast notifications with promise support.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toaster>;

/**
 * ## Default Toast
 * 
 * Basic toast notification with a simple message.
 */
export const Default: Story = {
  render: () => (
    <Button onClick={() => toast('Event has been created')}>
      Show Toast
    </Button>
  ),
};

/**
 * ## Toast Types
 * 
 * Different toast types for various scenarios: success, error, info, warning, loading.
 */
export const Types: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => toast('Default notification')}
      >
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Account created successfully', {
            description: 'Welcome to TerraFusion!',
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Something went wrong', {
            description: 'Please try again later.',
          })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.info('Update available', {
            description: 'A new version is ready to install.',
          })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning('Storage almost full', {
            description: 'You have used 95% of your available storage.',
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.loading('Loading...')}
      >
        Loading
      </Button>
    </div>
  ),
};

/**
 * ## With Description
 * 
 * Toasts can include additional description text for more context.
 */
export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          toast('Event has been created', {
            description: 'Monday, January 3rd at 6:00pm',
          })
        }
      >
        Show Toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Profile updated', {
            description: 'Your profile information has been saved successfully.',
          })
        }
      >
        Success with Description
      </Button>
    </div>
  ),
};

/**
 * ## With Actions
 * 
 * Add action buttons to toasts for user interaction.
 */
export const WithActions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          toast('Event has been created', {
            action: {
              label: 'Undo',
              onClick: () => console.log('Undo'),
            },
          })
        }
      >
        With Action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast('File uploaded successfully', {
            description: 'Your file is now available in the dashboard.',
            action: {
              label: 'View',
              onClick: () => console.log('View file'),
            },
          })
        }
      >
        With Action & Description
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Failed to save changes', {
            description: 'There was a problem saving your changes.',
            action: {
              label: 'Retry',
              onClick: () => console.log('Retry'),
            },
            cancel: {
              label: 'Cancel',
              onClick: () => console.log('Cancel'),
            },
          })
        }
      >
        With Action & Cancel
      </Button>
    </div>
  ),
};

/**
 * ## Promise Toasts
 * 
 * Handle async operations with loading, success, and error states automatically.
 */
export const PromiseToasts: Story = {
  render: () => {
    const simulateAsyncOperation = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          Math.random() > 0.5 ? resolve({ name: 'User data' }) : reject('Failed to fetch');
        }, 2000);
      });
    };

    const simulateSuccessOperation = () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ name: 'Success!' }), 2000);
      });
    };

    return (
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const promise = simulateAsyncOperation();
            toast.promise(promise, {
              loading: 'Loading...',
              success: (data) => {
                return `Successfully loaded ${data.name}`;
              },
              error: 'Error loading data',
            });
          }}
        >
          Promise (Random)
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const promise = simulateSuccessOperation();
            toast.promise(promise, {
              loading: 'Saving changes...',
              success: 'Changes saved successfully!',
              error: 'Failed to save changes',
            });
          }}
        >
          Promise (Success)
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const promise = fetch('https://api.example.com/user')
              .then(res => res.json());
            toast.promise(promise, {
              loading: 'Fetching user data...',
              success: (data) => 'User data loaded',
              error: (err) => `Error: ${err.message}`,
            });
          }}
        >
          Promise (Network)
        </Button>
      </div>
    );
  },
};

/**
 * ## Custom Content
 * 
 * Create custom toast content with JSX for rich notifications.
 */
export const CustomContent: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          toast(
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-1">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">Payment successful</div>
                <div className="text-sm text-muted-foreground">
                  Your payment of $99.00 has been processed.
                </div>
              </div>
            </div>
          )
        }
      >
        Custom Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast(
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-1">
                <Info className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">New message</div>
                <div className="text-sm text-muted-foreground">
                  You have 3 unread messages.
                </div>
              </div>
            </div>
          )
        }
      >
        Custom Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast(
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-yellow-100 p-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <div className="font-semibold">Maintenance scheduled</div>
                <div className="text-sm text-muted-foreground">
                  System will be down for 2 hours starting at 2 AM.
                </div>
              </div>
            </div>
          )
        }
      >
        Custom Warning
      </Button>
    </div>
  ),
};

/**
 * ## Real-World: Form Submission
 * 
 * Typical form submission flow with loading, success, and error states.
 */
export const RealWorldFormSubmit: Story = {
  render: () => {
    const handleSubmitSuccess = () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve({ id: '123' }), 1500);
      });

      toast.promise(promise, {
        loading: 'Creating account...',
        success: () => {
          return 'Account created successfully!';
        },
        error: 'Failed to create account',
      });
    };

    const handleSubmitError = () => {
      const promise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email already exists')), 1500);
      });

      toast.promise(promise, {
        loading: 'Creating account...',
        success: 'Account created successfully!',
        error: (err) => `Error: ${err.message}`,
      });
    };

    return (
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-4 rounded-lg border p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmitSuccess} className="flex-1">
              Submit (Success)
            </Button>
            <Button onClick={handleSubmitError} variant="outline" className="flex-1">
              Submit (Error)
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * ## Real-World: File Upload
 * 
 * File upload progress with promise handling.
 */
export const RealWorldFileUpload: Story = {
  render: () => {
    const uploadFile = (filename: string) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          Math.random() > 0.3 
            ? resolve({ url: `https://example.com/${filename}` })
            : reject(new Error('Upload failed'));
        }, 3000);
      });
    };

    const handleUpload = (filename: string) => {
      const promise = uploadFile(filename);
      
      toast.promise(promise, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading {filename}...</span>
          </div>
        ),
        success: (data) => {
          return (
            <div>
              <div className="font-semibold">Upload complete!</div>
              <div className="text-sm text-muted-foreground">
                {filename} has been uploaded successfully.
              </div>
            </div>
          );
        },
        error: (err) => {
          return (
            <div>
              <div className="font-semibold">Upload failed</div>
              <div className="text-sm text-muted-foreground">
                {err.message}. Please try again.
              </div>
            </div>
          );
        },
      });
    };

    return (
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-4 rounded-lg border p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select File</label>
            <div className="rounded-md border border-dashed p-8 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => handleUpload('presentation.pdf')}
              className="w-full"
            >
              Upload presentation.pdf
            </Button>
            <Button
              onClick={() => handleUpload('image.png')}
              variant="outline"
              className="w-full"
            >
              Upload image.png
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * ## Real-World: Notifications Center
 * 
 * Various notification types that might appear in an application.
 */
export const RealWorldNotifications: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() =>
          toast.success('Message sent', {
            description: 'Your message has been delivered to John Doe.',
            action: {
              label: 'View',
              onClick: () => console.log('View message'),
            },
          })
        }
      >
        <Check className="mr-2 h-4 w-4" />
        Message Sent
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() =>
          toast.info('New comment', {
            description: 'Sarah commented on your post "Design System Updates".',
            action: {
              label: 'Reply',
              onClick: () => console.log('Reply to comment'),
            },
          })
        }
      >
        <Info className="mr-2 h-4 w-4" />
        New Comment
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() =>
          toast.warning('Storage limit reached', {
            description: 'Upgrade your plan to get more storage space.',
            action: {
              label: 'Upgrade',
              onClick: () => console.log('Upgrade plan'),
            },
          })
        }
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Storage Warning
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() =>
          toast.error('Connection lost', {
            description: 'Unable to connect to the server. Retrying...',
            action: {
              label: 'Retry Now',
              onClick: () => console.log('Retry connection'),
            },
          })
        }
      >
        <X className="mr-2 h-4 w-4" />
        Connection Error
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => {
          const promise = new Promise((resolve) => setTimeout(resolve, 2000));
          toast.promise(promise, {
            loading: 'Syncing data...',
            success: 'All data synced successfully',
            error: 'Sync failed',
          });
        }}
      >
        <Loader2 className="mr-2 h-4 w-4" />
        Sync Data
      </Button>
    </div>
  ),
};

/**
 * ## Usage Guidelines
 * 
 * ### When to Use
 * - ✅ Confirming user actions (save, delete, etc.)
 * - ✅ Displaying non-critical errors
 * - ✅ Showing async operation status (loading, success, error)
 * - ✅ Temporary notifications that don't require user action
 * - ✅ Success confirmations
 * 
 * ### When Not to Use
 * - ❌ Critical errors (use Dialog/Alert instead)
 * - ❌ Information requiring user decision (use AlertDialog)
 * - ❌ Permanent status messages (use Alert)
 * - ❌ Complex forms or inputs (use Dialog)
 * - ❌ Navigation changes (use proper routing)
 * 
 * ### Toast Types Guide
 * 
 * | Type | Use For | Icon |
 * |------|---------|------|
 * | Default | General notifications | None |
 * | Success | Successful operations | ✓ |
 * | Error | Failed operations | ✗ |
 * | Info | Informational messages | ℹ |
 * | Warning | Warnings and cautions | ⚠ |
 * | Loading | In-progress operations | ⟳ |
 * 
 * ### Best Practices
 * 
 * **Do:**
 * - Keep messages concise and clear
 * - Use appropriate toast types (success, error, etc.)
 * - Provide actions when relevant (Undo, View, etc.)
 * - Set appropriate durations (3-5 seconds default)
 * - Group related notifications
 * - Use promise toasts for async operations
 * - Provide descriptions for additional context
 * 
 * **Don't:**
 * - Don't show multiple toasts for the same action
 * - Don't use toasts for critical errors
 * - Don't make toast messages too long
 * - Don't block user interaction with toasts
 * - Don't use toasts for permanent information
 * - Don't stack too many toasts (limit 3-4)
 * 
 * ### Accessibility
 * 
 * - ARIA live regions for screen reader announcements
 * - Keyboard dismissal (Escape key)
 * - Sufficient color contrast
 * - Focus management for action buttons
 * - Respects prefers-reduced-motion
 * - Appropriate timeout durations
 * 
 * ### Common Patterns
 * 
 * ```tsx
 * // Basic toast
 * toast('Event created')
 * 
 * // With description
 * toast.success('Profile updated', {
 *   description: 'Your changes have been saved.',
 * })
 * 
 * // With action
 * toast('File deleted', {
 *   action: {
 *     label: 'Undo',
 *     onClick: () => console.log('Undo'),
 *   },
 * })
 * 
 * // Promise toast
 * toast.promise(promise, {
 *   loading: 'Loading...',
 *   success: 'Success!',
 *   error: 'Error occurred',
 * })
 * ```
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">✅ Do's</h3>
        <ul className="space-y-2 text-sm">
          <li>✓ Keep messages concise and actionable</li>
          <li>✓ Use appropriate types (success, error, info, warning)</li>
          <li>✓ Provide actions when relevant (Undo, View)</li>
          <li>✓ Use promise toasts for async operations</li>
          <li>✓ Set appropriate auto-dismiss durations</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">❌ Don'ts</h3>
        <ul className="space-y-2 text-sm">
          <li>✗ Don't use toasts for critical errors (use Dialog)</li>
          <li>✗ Don't show multiple toasts for same action</li>
          <li>✗ Don't make toast messages too lengthy</li>
          <li>✗ Don't stack too many toasts (3-4 max)</li>
          <li>✗ Don't use for permanent information</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Example Usage</h3>
        <div className="space-y-2">
          <Button onClick={() => toast('Simple notification')}>
            Show Toast
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.success('Operation successful', {
                description: 'Your changes have been saved.',
                action: {
                  label: 'Undo',
                  onClick: () => console.log('Undo'),
                },
              })
            }
          >
            With Action
          </Button>
        </div>
      </div>
    </div>
  ),
};
