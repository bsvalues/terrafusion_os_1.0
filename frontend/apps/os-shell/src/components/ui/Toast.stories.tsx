import {
    CheckCircledIcon,
    CrossCircledIcon,
    ExclamationTriangleIcon,
    InfoCircledIcon,
    ReloadIcon,
} from '@radix-ui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { toast } from 'sonner';
import { Button } from './button';
import { Toaster } from './sonner';

/**
 * # Toast Component (Sonner)
 *
 * Beautiful, customizable toast notifications for React applications.
 * Built on the Sonner library with TerraFusion styling.
 *
 * ## Features
 * - **Multiple Variants**: Success, Error, Warning, Info, Loading, Promise
 * - **Action Buttons**: Add interactive buttons to toasts
 * - **Rich Content**: Custom JSX, icons, and descriptions
 * - **Smart Positioning**: Top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
 * - **Queue Management**: Auto-stacking with configurable limits
 * - **Auto-dismiss**: Configurable duration or persistent
 * - **Themes**: Automatic light/dark mode support
 * - **Accessibility**: Screen reader announcements, keyboard dismissal
 *
 * ## Common Use Cases
 * - **Form Submissions**: Success/error feedback
 * - **Async Operations**: Loading states and completion
 * - **User Actions**: Confirmations and undo options
 * - **System Notifications**: Updates, warnings, alerts
 * - **Data Changes**: Save confirmations, deletions
 * - **Errors**: Validation errors, network failures
 *
 * ## Architecture
 * Built on `sonner` by Emil Kowalski with Radix UI theming integration.
 *
 * ### Components:
 * - **Toaster**: Provider component (add to app root)
 * - **toast()**: Function to trigger notifications
 * - **toast.success()**: Success notifications
 * - **toast.error()**: Error notifications
 * - **toast.warning()**: Warning notifications
 * - **toast.info()**: Info notifications
 * - **toast.loading()**: Loading states
 * - **toast.promise()**: Promise-based notifications
 *
 * ### Setup:
 * Add `<Toaster />` to your app root (layout.tsx or App.tsx):
 * ```tsx
 * import { Toaster } from '@/components/ui/sonner';
 *
 * export default function RootLayout() {
 *   return (
 *     <>
 *       {children}
 *       <Toaster />
 *     </>
 *   );
 * }
 * ```
 *
 * @component
 */
const meta: Meta<typeof Toaster> = {
  title: 'UI/Toast',
  component: Toaster,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Beautiful toast notifications for feedback and alerts. Essential for user confirmation and error handling.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Toaster>;

/**
 * ## Basic Toasts
 *
 * Simple text notifications for quick feedback.
 *
 * ### Types:
 * - **Default**: Neutral information
 * - **Success**: Positive actions (saves, completions)
 * - **Error**: Failures and validation errors
 * - **Warning**: Cautions and important notices
 * - **Info**: General information and tips
 *
 * ### Usage:
 * ```tsx
 * import { toast } from 'sonner';
 *
 * // Default toast
 * toast('Event has been created');
 *
 * // Success toast
 * toast.success('Profile updated successfully');
 *
 * // Error toast
 * toast.error('Failed to save changes');
 *
 * // Warning toast
 * toast.warning('Your session will expire soon');
 *
 * // Info toast
 * toast.info('New version available');
 * ```
 *
 * ### Best Practices:
 * - Keep messages concise (1-2 lines)
 * - Use active voice ("Saved" vs "Has been saved")
 * - Match variant to action severity
 * - Provide context when needed
 */
export const BasicToasts: Story = {
  render: () => (
    <>
      <Toaster />
      <div className='flex flex-wrap gap-4 p-8'>
        <Button onClick={() => toast('Event has been created')}>Default Toast</Button>

        <Button onClick={() => toast.success('Profile updated successfully')} variant='default'>
          Success Toast
        </Button>

        <Button onClick={() => toast.error('Failed to save changes')} variant='destructive'>
          Error Toast
        </Button>

        <Button onClick={() => toast.warning('Your session will expire soon')}>
          Warning Toast
        </Button>

        <Button onClick={() => toast.info('New version available')} variant='outline'>
          Info Toast
        </Button>
      </div>
    </>
  ),
};

/**
 * ## Toast Variants with Descriptions
 *
 * Add descriptions for more context and details.
 *
 * ### Description Format:
 * - **Title**: Brief action summary (bold, larger text)
 * - **Description**: Additional context or details
 *
 * ### Usage:
 * ```tsx
 * toast.success('Payment Successful', {
 *   description: 'Your order ORD-12345 has been confirmed',
 * });
 *
 * toast.error('Upload Failed', {
 *   description: 'File size exceeds 10MB limit',
 * });
 * ```
 *
 * ### Guidelines:
 * - Use descriptions for actionable information
 * - Keep descriptions under 50 characters
 * - Provide next steps or reasons
 * - Don't duplicate the title
 */
export const WithDescriptions: Story = {
  render: () => (
    <>
      <Toaster />
      <div className='grid grid-cols-2 gap-4 p-8'>
        <Button
          onClick={() =>
            toast.success('Payment Successful', {
              description: 'Your order ORD-12345 has been confirmed',
            })
          }
        >
          <CheckCircledIcon className='mr-2 h-4 w-4' />
          Success with Description
        </Button>

        <Button
          onClick={() =>
            toast.error('Upload Failed', {
              description: 'File size exceeds 10MB limit',
            })
          }
          variant='destructive'
        >
          <CrossCircledIcon className='mr-2 h-4 w-4' />
          Error with Description
        </Button>

        <Button
          onClick={() =>
            toast.warning('Storage Almost Full', {
              description: 'You have used 9.5GB of 10GB available',
            })
          }
        >
          <ExclamationTriangleIcon className='mr-2 h-4 w-4' />
          Warning with Description
        </Button>

        <Button
          onClick={() =>
            toast.info('Update Available', {
              description: 'Version 2.0 includes new features and fixes',
            })
          }
          variant='outline'
        >
          <InfoCircledIcon className='mr-2 h-4 w-4' />
          Info with Description
        </Button>
      </div>
    </>
  ),
};

/**
 * ## Toasts with Actions
 *
 * Add interactive buttons to toasts for immediate actions.
 *
 * ### Action Types:
 * - **Undo**: Revert destructive actions
 * - **View**: Navigate to related content
 * - **Retry**: Attempt failed operations again
 * - **Dismiss**: Explicit close option
 * - **Learn More**: Additional information
 *
 * ### Usage:
 * ```tsx
 * toast.success('File deleted', {
 *   action: {
 *     label: 'Undo',
 *     onClick: () => console.log('Undo'),
 *   },
 * });
 * ```
 *
 * ### Best Practices:
 * - Use for reversible actions (undo, retry)
 * - Keep action labels short (1-2 words)
 * - Provide feedback for action clicks
 * - Don't use for critical confirmations
 * - Limit to 1-2 actions per toast
 */
export const WithActions: Story = {
  render: () => (
    <>
      <Toaster />
      <div className='grid grid-cols-2 gap-4 p-8'>
        <Button
          onClick={() =>
            toast.success('File deleted', {
              description: 'document.pdf has been removed',
              action: {
                label: 'Undo',
                onClick: () => toast.info('Delete undone'),
              },
            })
          }
        >
          Delete with Undo
        </Button>

        <Button
          onClick={() =>
            toast.error('Connection failed', {
              description: 'Unable to reach the server',
              action: {
                label: 'Retry',
                onClick: () => toast.loading('Reconnecting...'),
              },
            })
          }
          variant='destructive'
        >
          Error with Retry
        </Button>

        <Button
          onClick={() =>
            toast.info('New message', {
              description: 'You have 3 unread messages',
              action: {
                label: 'View',
                onClick: () => toast('Opening messages...'),
              },
            })
          }
          variant='outline'
        >
          Notification with View
        </Button>

        <Button
          onClick={() =>
            toast.warning('Unsaved changes', {
              description: 'Your draft has unsaved changes',
              action: {
                label: 'Save',
                onClick: () => toast.success('Draft saved'),
              },
              cancel: {
                label: 'Discard',
                onClick: () => toast('Changes discarded'),
              },
            })
          }
        >
          Warning with Actions
        </Button>
      </div>
    </>
  ),
};

/**
 * ## Promise Toasts
 *
 * Automatically handle loading, success, and error states for async operations.
 *
 * ### How it works:
 * 1. Shows loading toast immediately
 * 2. Updates to success when promise resolves
 * 3. Updates to error if promise rejects
 *
 * ### Usage:
 * ```tsx
 * toast.promise(
 *   fetch('/api/data').then(res => res.json()),
 *   {
 *     loading: 'Loading data...',
 *     success: 'Data loaded successfully',
 *     error: 'Failed to load data',
 *   }
 * );
 * ```
 *
 * ### With Data:
 * ```tsx
 * toast.promise(promise, {
 *   loading: 'Saving...',
 *   success: (data) => `${data.name} saved successfully`,
 *   error: (err) => err.message,
 * });
 * ```
 *
 * ### Best For:
 * - API calls
 * - File uploads
 * - Form submissions
 * - Data mutations
 * - Long-running operations
 */
export const PromiseToasts: Story = {
  render: () => {
    const simulateApiCall = (shouldSucceed: boolean, delay: number = 2000) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (shouldSucceed) {
            resolve({ name: 'Item', id: 123 });
          } else {
            reject(new Error('Network error occurred'));
          }
        }, delay);
      });
    };

    return (
      <>
        <Toaster />
        <div className='grid grid-cols-2 gap-4 p-8'>
          <Button
            onClick={() =>
              toast.promise(simulateApiCall(true), {
                loading: 'Saving changes...',
                success: 'Changes saved successfully',
                error: 'Failed to save changes',
              })
            }
          >
            Successful Promise
          </Button>

          <Button
            onClick={() =>
              toast.promise(simulateApiCall(false), {
                loading: 'Uploading file...',
                success: 'File uploaded',
                error: 'Upload failed',
              })
            }
            variant='destructive'
          >
            Failed Promise
          </Button>

          <Button
            onClick={() =>
              toast.promise(simulateApiCall(true), {
                loading: 'Creating user...',
                success: (data: any) => `User ${data.name} created (ID: ${data.id})`,
                error: (err) => err.message,
              })
            }
            variant='outline'
          >
            Promise with Data
          </Button>

          <Button
            onClick={() => {
              const toastId = toast.loading('Processing...');

              simulateApiCall(true, 3000)
                .then(() => {
                  toast.success('Processing complete', { id: toastId });
                })
                .catch(() => {
                  toast.error('Processing failed', { id: toastId });
                });
            }}
          >
            Manual Promise Control
          </Button>
        </div>
      </>
    );
  },
};

/**
 * ## Loading States
 *
 * Show loading toasts for operations in progress.
 *
 * ### Loading Patterns:
 * - **Simple Loading**: `toast.loading('Loading...')`
 * - **Update to Success**: Update with same ID
 * - **Indefinite**: No auto-dismiss until updated
 * - **With Progress**: Custom loading content
 *
 * ### Usage:
 * ```tsx
 * const toastId = toast.loading('Processing...');
 *
 * // Later, update the toast
 * toast.success('Done!', { id: toastId });
 * // or
 * toast.error('Failed', { id: toastId });
 * ```
 *
 * ### Best Practices:
 * - Show loading for operations >500ms
 * - Always update or dismiss loading toasts
 * - Use descriptive loading messages
 * - Provide estimated time for long operations
 */
export const LoadingStates: Story = {
  render: () => {
    const handleLongOperation = () => {
      const toastId = toast.loading('Processing your request...');

      setTimeout(() => {
        toast.success('Request processed successfully', {
          id: toastId,
        });
      }, 3000);
    };

    const handleMultiStep = () => {
      const toastId = toast.loading('Step 1: Validating...');

      setTimeout(() => {
        toast.loading('Step 2: Processing...', { id: toastId });
      }, 1500);

      setTimeout(() => {
        toast.loading('Step 3: Finalizing...', { id: toastId });
      }, 3000);

      setTimeout(() => {
        toast.success('All steps completed', { id: toastId });
      }, 4500);
    };

    return (
      <>
        <Toaster />
        <div className='flex flex-wrap gap-4 p-8'>
          <Button onClick={() => toast.loading('Loading data...')}>Simple Loading</Button>

          <Button onClick={handleLongOperation}>
            <ReloadIcon className='mr-2 h-4 w-4' />
            Loading → Success
          </Button>

          <Button onClick={handleMultiStep} variant='outline'>
            Multi-step Loading
          </Button>

          <Button
            onClick={() => {
              const toastId = toast.loading('Uploading...');
              setTimeout(() => {
                toast.error('Upload failed', { id: toastId });
              }, 2000);
            }}
            variant='destructive'
          >
            Loading → Error
          </Button>
        </div>
      </>
    );
  },
};

/**
 * ## Toast Positions
 *
 * Control where toasts appear on screen.
 *
 * ### Available Positions:
 * - **top-left**: Upper left corner
 * - **top-center**: Top center (default)
 * - **top-right**: Upper right corner
 * - **bottom-left**: Lower left corner
 * - **bottom-center**: Bottom center
 * - **bottom-right**: Lower right corner
 *
 * ### Usage:
 * ```tsx
 * <Toaster position="top-right" />
 * ```
 *
 * ### Recommendations:
 * - **top-right**: Desktop apps, admin panels (most common)
 * - **bottom-center**: Mobile apps, minimalist designs
 * - **top-center**: Full-width notifications, important alerts
 * - **bottom-right**: Chat notifications, secondary alerts
 *
 * ### Considerations:
 * - Don't block critical UI elements
 * - Consider mobile vs desktop layout
 * - Match position to content importance
 * - Be consistent across your app
 */
export const Positions: Story = {
  render: () => (
    <>
      <Toaster position='top-right' />
      <div className='space-y-8 p-8'>
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold'>Toast Positions</h3>
          <p className='text-sm text-muted-foreground'>
            Current position: <strong>top-right</strong> (most common for desktop apps)
          </p>
        </div>

        <div className='grid grid-cols-3 gap-4'>
          {/* Top Row */}
          <Button variant='outline' onClick={() => toast('Top left position')}>
            Top Left
          </Button>
          <Button variant='outline' onClick={() => toast('Top center position')}>
            Top Center
          </Button>
          <Button variant='outline' onClick={() => toast.success('Top right position (current)')}>
            Top Right ✓
          </Button>

          {/* Bottom Row */}
          <Button variant='outline' onClick={() => toast('Bottom left position')}>
            Bottom Left
          </Button>
          <Button variant='outline' onClick={() => toast('Bottom center position')}>
            Bottom Center
          </Button>
          <Button variant='outline' onClick={() => toast('Bottom right position')}>
            Bottom Right
          </Button>
        </div>

        <div className='rounded-md border p-4'>
          <p className='text-sm text-muted-foreground'>
            <strong>Note:</strong> To change the position, update the <code>position</code> prop on{' '}
            <code>&lt;Toaster /&gt;</code> in your layout file. The position applies to all toasts
            in your application.
          </p>
        </div>
      </div>
    </>
  ),
};

/**
 * ## Rich Content
 *
 * Customize toasts with custom JSX, icons, and styling.
 *
 * ### Content Types:
 * - **Custom Icons**: Brand icons or illustrations
 * - **Avatars**: User profile pictures
 * - **Images**: Thumbnails or previews
 * - **Formatted Text**: Styled descriptions
 * - **Links**: Navigation or external links
 *
 * ### Usage:
 * ```tsx
 * toast.success(
 *   <div className="flex items-center gap-2">
 *     <img src="/avatar.jpg" className="h-10 w-10 rounded-full" />
 *     <div>
 *       <p className="font-semibold">John Doe</p>
 *       <p className="text-sm">Sent you a message</p>
 *     </div>
 *   </div>
 * );
 * ```
 *
 * ### Guidelines:
 * - Keep custom content compact
 * - Maintain readability with proper contrast
 * - Don't overuse rich content
 * - Test on mobile devices
 */
export const RichContent: Story = {
  render: () => (
    <>
      <Toaster />
      <div className='grid grid-cols-2 gap-4 p-8'>
        <Button
          onClick={() =>
            toast.success(
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
                  <CheckCircledIcon className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <p className='font-semibold'>Payment Successful</p>
                  <p className='text-sm text-muted-foreground'>$99.00 charged to •••• 4242</p>
                </div>
              </div>
            )
          }
        >
          Payment Notification
        </Button>

        <Button
          onClick={() =>
            toast(
              <div className='flex items-center gap-3'>
                <div className='h-12 w-12 rounded-md bg-gradient-to-br from-purple-400 to-pink-600' />
                <div>
                  <p className='font-semibold'>New Image Uploaded</p>
                  <p className='text-sm text-muted-foreground'>vacation-photo.jpg</p>
                </div>
              </div>
            )
          }
          variant='outline'
        >
          Image Upload
        </Button>

        <Button
          onClick={() =>
            toast.info(
              <div className='space-y-2'>
                <p className='font-semibold'>System Maintenance</p>
                <p className='text-sm'>Scheduled for tonight at 2:00 AM EST</p>
                <p className='text-xs text-muted-foreground'>Expected downtime: 30 minutes</p>
              </div>
            )
          }
        >
          Maintenance Notice
        </Button>

        <Button
          onClick={() =>
            toast(
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900'>
                  <span className='text-xl'>📧</span>
                </div>
                <div>
                  <p className='font-semibold'>3 New Messages</p>
                  <p className='text-sm text-muted-foreground'>From Sarah, Mike, and Alex</p>
                </div>
              </div>,
              {
                action: {
                  label: 'View',
                  onClick: () => toast('Opening inbox...'),
                },
              }
            )
          }
          variant='outline'
        >
          Message Notification
        </Button>
      </div>
    </>
  ),
};

/**
 * ## Usage Guidelines
 *
 * Best practices, dos and don'ts, and implementation guidance.
 *
 * ### ✅ Do's
 *
 * 1. **Use for Confirmations**
 *    ```tsx
 *    // ✅ Confirm user actions
 *    toast.success('Changes saved');
 *    ```
 *
 * 2. **Provide Context**
 *    ```tsx
 *    // ✅ Include relevant details
 *    toast.success('Order placed', {
 *      description: 'Order ORD-12345 will arrive in 3-5 days',
 *    });
 *    ```
 *
 * 3. **Use Appropriate Variants**
 *    ```tsx
 *    // ✅ Match severity
 *    toast.error('Payment failed');     // Critical
 *    toast.warning('Session expiring');  // Important
 *    toast.info('New features added');   // Informational
 *    ```
 *
 * 4. **Add Actions for Reversible Operations**
 *    ```tsx
 *    // ✅ Undo for destructive actions
 *    toast.success('Item deleted', {
 *      action: { label: 'Undo', onClick: restore },
 *    });
 *    ```
 *
 * 5. **Use Promise Toasts for Async**
 *    ```tsx
 *    // ✅ Automatic state management
 *    toast.promise(apiCall(), {
 *      loading: 'Saving...',
 *      success: 'Saved!',
 *      error: 'Failed',
 *    });
 *    ```
 *
 * 6. **Set Reasonable Durations**
 *    ```tsx
 *    // ✅ Adjust based on content
 *    toast('Quick message', { duration: 2000 });
 *    toast.error('Critical error', { duration: 8000 });
 *    ```
 *
 * ### ❌ Don'ts
 *
 * 1. **Don't Use for Critical Confirmations**
 *    ```tsx
 *    // ❌ Toasts can be dismissed/missed
 *    toast('Account will be deleted');
 *
 *    // ✅ Use Dialog instead
 *    <Dialog>Are you sure?</Dialog>
 *    ```
 *
 * 2. **Don't Spam Toasts**
 *    ```tsx
 *    // ❌ Too many toasts
 *    items.forEach(item => toast(`Saved ${item}`));
 *
 *    // ✅ Batch notifications
 *    toast.success(`Saved ${items.length} items`);
 *    ```
 *
 * 3. **Don't Use for Long Content**
 *    ```tsx
 *    // ❌ Too much text
 *    toast('Lorem ipsum dolor sit amet...');
 *
 *    // ✅ Keep it brief
 *    toast('Settings updated');
 *    ```
 *
 * 4. **Don't Hide Errors in Info Toasts**
 *    ```tsx
 *    // ❌ Wrong variant
 *    toast.info('Upload failed');
 *
 *    // ✅ Use error variant
 *    toast.error('Upload failed');
 *    ```
 *
 * ### Common Patterns
 *
 * #### Form Submission
 * ```tsx
 * const handleSubmit = async (data) => {
 *   toast.promise(
 *     api.submitForm(data),
 *     {
 *       loading: 'Submitting form...',
 *       success: 'Form submitted successfully',
 *       error: (err) => `Submission failed: ${err.message}`,
 *     }
 *   );
 * };
 * ```
 *
 * #### Delete with Undo
 * ```tsx
 * const handleDelete = (item) => {
 *   toast.success(`${item.name} deleted`, {
 *     action: {
 *       label: 'Undo',
 *       onClick: () => restoreItem(item),
 *     },
 *   });
 * };
 * ```
 *
 * #### File Upload Progress
 * ```tsx
 * const uploadFile = async (file) => {
 *   const toastId = toast.loading('Uploading...');
 *
 *   try {
 *     await api.upload(file);
 *     toast.success('Upload complete', { id: toastId });
 *   } catch (error) {
 *     toast.error('Upload failed', { id: toastId });
 *   }
 * };
 * ```
 *
 * ### Accessibility Checklist
 *
 * - [ ] **Screen Reader**: Toasts announced automatically
 * - [ ] **Keyboard**: Can be dismissed with Escape
 * - [ ] **Focus**: Actions are keyboard accessible
 * - [ ] **Duration**: Enough time to read (min 3s)
 * - [ ] **Color**: Don't rely solely on color
 * - [ ] **Motion**: Respect prefers-reduced-motion
 * - [ ] **Contrast**: Readable text in light/dark modes
 *
 * ### Configuration Options
 *
 * ```tsx
 * // Global settings
 * <Toaster
 *   position="top-right"
 *   expand={false}
 *   richColors
 *   closeButton
 *   duration={4000}
 * />
 *
 * // Per-toast settings
 * toast.success('Saved', {
 *   duration: 2000,
 *   position: 'bottom-center',
 *   dismissible: false,
 *   id: 'save-toast',
 * });
 * ```
 */
export const UsageGuidelines: Story = {
  render: () => (
    <>
      <Toaster />
      <div className='max-w-4xl space-y-8 p-8'>
        <div>
          <h2 className='mb-4 text-2xl font-bold'>Toast Component Guidelines</h2>
          <p className='text-muted-foreground'>
            Follow these best practices to create effective, accessible toast notifications.
          </p>
        </div>

        <div className='space-y-4'>
          <h3 className='text-xl font-semibold text-green-600'>✅ Do's</h3>
          <ul className='list-inside list-disc space-y-2 text-sm'>
            <li>Use for confirmations and feedback (saves, deletions, updates)</li>
            <li>Provide context with descriptions</li>
            <li>Match variant to action severity (error, warning, info, success)</li>
            <li>Add undo actions for reversible operations</li>
            <li>Use promise toasts for async operations</li>
            <li>Set appropriate durations (2-8 seconds)</li>
          </ul>
        </div>

        <div className='space-y-4'>
          <h3 className='text-xl font-semibold text-red-600'>❌ Don'ts</h3>
          <ul className='list-inside list-disc space-y-2 text-sm'>
            <li>Don't use for critical confirmations (use Dialog instead)</li>
            <li>Don't spam multiple toasts (batch notifications)</li>
            <li>Don't use for long content (keep brief)</li>
            <li>Don't hide errors in info toasts (use correct variant)</li>
          </ul>
        </div>

        <div className='space-y-4'>
          <h3 className='text-xl font-semibold'>Demo: Common Patterns</h3>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Button
                className='w-full'
                onClick={() =>
                  toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
                    loading: 'Submitting form...',
                    success: 'Form submitted successfully',
                    error: 'Submission failed',
                  })
                }
              >
                Form Submission
              </Button>
              <p className='text-xs text-muted-foreground'>Promise toast for async operations</p>
            </div>

            <div className='space-y-2'>
              <Button
                className='w-full'
                variant='destructive'
                onClick={() =>
                  toast.success('Item deleted', {
                    action: {
                      label: 'Undo',
                      onClick: () => toast.info('Delete undone'),
                    },
                  })
                }
              >
                Delete with Undo
              </Button>
              <p className='text-xs text-muted-foreground'>Reversible action with undo button</p>
            </div>

            <div className='space-y-2'>
              <Button
                className='w-full'
                variant='outline'
                onClick={() => {
                  const toastId = toast.loading('Uploading file...');
                  setTimeout(() => {
                    toast.success('Upload complete', { id: toastId });
                  }, 3000);
                }}
              >
                File Upload
              </Button>
              <p className='text-xs text-muted-foreground'>Loading state with manual update</p>
            </div>

            <div className='space-y-2'>
              <Button
                className='w-full'
                onClick={() =>
                  toast.error('Validation failed', {
                    description: 'Please check the highlighted fields',
                    action: {
                      label: 'Review',
                      onClick: () => toast('Scrolling to errors...'),
                    },
                  })
                }
              >
                Form Validation
              </Button>
              <p className='text-xs text-muted-foreground'>Error with description and action</p>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <h3 className='text-xl font-semibold'>Accessibility Checklist</h3>
          <ul className='list-inside list-disc space-y-2 text-sm text-muted-foreground'>
            <li>Screen reader announcements enabled (aria-live)</li>
            <li>Keyboard dismissal with Escape key</li>
            <li>Action buttons are keyboard accessible</li>
            <li>Minimum 3-second duration for reading</li>
            <li>Color-independent status indication</li>
            <li>Respects prefers-reduced-motion</li>
          </ul>
        </div>

        <div className='rounded-md bg-blue-500/10 border border-blue-500/50 p-4'>
          <p className='text-sm'>
            <strong>Setup Reminder:</strong> Add <code>&lt;Toaster /&gt;</code> to your app root
            (layout.tsx or App.tsx) to enable toast notifications throughout your application.
          </p>
        </div>
      </div>
    </>
  ),
};
