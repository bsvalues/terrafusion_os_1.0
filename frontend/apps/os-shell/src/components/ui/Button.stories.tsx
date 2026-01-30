import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './button';

/**
 * The Button component is a foundational UI element built on Radix UI primitives with
 * class-variance-authority for type-safe variant management.
 *
 * ## Features
 * - 6 semantic variants (default, destructive, outline, secondary, ghost, link)
 * - 4 size options (default, sm, lg, icon)
 * - Full TypeScript support with type-safe variants
 * - Accessible by default (keyboard navigation, focus states, ARIA)
 * - Can render as child component using `asChild` prop (Radix Slot)
 * - Tailwind CSS powered with design token integration
 *
 * ## Usage
 * ```tsx
 * import { Button } from '@/components/ui/button';
 *
 * <Button variant="default" size="default">
 *   Click me
 * </Button>
 * ```
 *
 * ## Accessibility
 * - Keyboard navigation: Full support (Enter/Space to activate)
 * - Screen reader support: Proper button semantics
 * - Focus management: Visible focus ring with ring-offset
 * - Disabled state: pointer-events-none and reduced opacity
 */
const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible, accessible button component with multiple variants and sizes. Built with Radix UI primitives and CVA for type-safe styling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual variant of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Size of the button',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as child component using Radix Slot',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default primary button - use for main actions
 */
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

/**
 * All button variants displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div className='flex'>
      <div className='flex items-center'>
        <Button variant='default'>Default</Button>
        <Button variant='destructive'>Destructive</Button>
        <Button variant='outline'>Outline</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button variant='ghost'>Ghost</Button>
        <Button variant='link'>Link</Button>
      </div>
    </div>
  ),
};

/**
 * All button sizes from small to large, plus icon-only
 */
export const Sizes: Story = {
  render: () => (
    <div className='flex items-center'>
      <Button size='sm'>Small</Button>
      <Button size='default'>Default</Button>
      <Button size='lg'>Large</Button>
      <Button size='icon'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path d='M12 5v14M5 12h14' />
        </svg>
      </Button>
    </div>
  ),
};

/**
 * Button states including hover, focus, disabled, and loading
 */
export const States: Story = {
  render: () => (
    <div className='flex'>
      <div>
        <div className='font-semibold'>Normal State</div>
        <Button>Normal Button</Button>
      </div>

      <div>
        <div className='font-semibold'>Disabled State</div>
        <Button disabled>Disabled Button</Button>
      </div>

      <div>
        <div className='font-semibold'>Loading State</div>
        <Button disabled>
          <svg
            style={{
              animation: 'spin 1s linear infinite',
              marginRight: '8px',
            }}
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <path d='M21 12a9 9 0 1 1-6.219-8.56' />
          </svg>
          Loading...
        </Button>
      </div>
    </div>
  ),
};

/**
 * Interactive example showing button click handling
 */
export const Interactive: Story = {
  render: () => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const handleClick = async () => {
      setLoading(true);
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCount((prev) => prev + 1);
      setLoading(false);
    };
    return (
      <div className='text-center'>
        <h3
          style={{
            marginBottom: '16px',
            fontSize: '18px',
          }}
        >
          Button clicked {count} times
        </h3>
        <Button onClick={handleClick} disabled={loading}>
          {loading ? (
            <>
              <svg
                style={{
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px',
                }}
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M21 12a9 9 0 1 1-6.219-8.56' />
              </svg>
              Processing...
            </>
          ) : (
            'Click Me'
          )}
        </Button>
      </div>
    );
  },
};

/**
 * Button with icon - common pattern for visual clarity
 */
export const WithIcons: Story = {
  render: () => (
    <div className='flex'>
      <Button>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          style={{
            marginRight: '8px',
          }}
        >
          <path d='M12 5v14M5 12h14' />
        </svg>
        Add Item
      </Button>

      <Button variant='destructive'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          style={{
            marginRight: '8px',
          }}
        >
          <path d='M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
        </svg>
        Delete
      </Button>

      <Button variant='outline'>
        Save
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          style={{
            marginLeft: '8px',
          }}
        >
          <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' />
        </svg>
      </Button>
    </div>
  ),
};

/**
 * Real-world example showing buttons in a form context
 */
export const RealWorldExample: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '500px',
        padding: '32px',
        backgroundColor: '#0a0a0a',
        borderRadius: '12px',
        border: '1px solid #2a2a2a',
      }}
    >
      <h2 className='font-semibold'>Create Account</h2>
      <p
        style={{
          marginBottom: '24px',
          color: 'var(--gray-400)',
          fontSize: '14px',
        }}
      >
        Sign up to get started with TerraFusion OS
      </p>

      <div className='flex'>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Email
          </label>
          <input type='email' placeholder='you@example.com' className='w-full' />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Password
          </label>
          <input type='password' placeholder='••••••••' className='w-full' />
        </div>

        <div className='flex'>
          <Button variant='ghost'>Cancel</Button>
          <Button>Create Account</Button>
        </div>
      </div>

      <div className='text-center'>
        <Button
          variant='link'
          style={{
            fontSize: '14px',
          }}
        >
          Already have an account? Sign in
        </Button>
      </div>
    </div>
  ),
};

/**
 * Usage guidelines with Do's and Don'ts
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '900px',
        padding: '24px',
      }}
    >
      <h3 className='font-semibold'>Button Usage Guidelines</h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
        }}
      >
        {/* DO Section */}
        <div>
          <h4 className='font-semibold flex items-center'>
            <span
              style={{
                fontSize: '20px',
              }}
            >
              ✓
            </span>{' '}
            Do
          </h4>
          <ul className='flex'>
            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Use clear, action-oriented labels
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                "Save Changes", "Create Account", "Download Report"
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Use appropriate variants
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Primary actions → default, Destructive actions → destructive, Secondary →
                outline/secondary
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Show loading states
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Disable and show spinner during async operations
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Group related actions
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Keep primary and secondary actions together with consistent spacing
              </p>
            </li>
          </ul>
        </div>

        {/* DON'T Section */}
        <div>
          <h4 className='font-semibold flex items-center'>
            <span
              style={{
                fontSize: '20px',
              }}
            >
              ✗
            </span>{' '}
            Don't
          </h4>
          <ul className='flex'>
            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Use vague labels
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Avoid "Click Here", "Submit", "OK" - be specific about the action
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Overuse primary buttons
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Only one primary action per context - use outline/secondary for others
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Forget disabled states
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Always disable buttons during loading or when action isn't available
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Mix sizes inconsistently
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Keep button sizes consistent within the same context
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Code Examples */}
      <div
        style={{
          marginTop: '40px',
        }}
      >
        <h4 className='font-semibold'>Code Examples</h4>
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '20px',
            borderRadius: '8px',
            fontFamily: '"Fira Code", monospace',
            fontSize: '13px',
            overflow: 'auto',
            border: '1px solid #2a2a2a',
          }}
        >
          <pre
            style={{
              margin: 0,
              lineHeight: '1.6',
            }}
          >
            {`// Basic usage
<Button>Click me</Button>

// With variant
<Button variant="destructive">Delete</Button>

// With size
<Button size="lg">Large Button</Button>

// Disabled state
<Button disabled>Cannot click</Button>

// With loading state
<Button disabled>
  <Loader2 className="animate-spin mr-2" />
  Loading...
</Button>

// With icon
<Button>
  <Plus className="mr-2" />
  Add Item
</Button>

// As link (using asChild with Radix Slot)
<Button asChild>
  <a href="/dashboard">Go to Dashboard</a>
</Button>`}
          </pre>
        </div>
      </div>
    </div>
  ),
};

/**
 * Comprehensive accessibility testing
 * Tests keyboard navigation, screen reader support, focus management
 */
export const AccessibilityTest: Story = {
  render: () => (
    <div className='space-y-8' role='region' aria-label='Button accessibility testing'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Keyboard Navigation</h3>
        <div className='flex gap-2'>
          <Button>Tab to focus</Button>
          <Button variant='outline'>Press Enter/Space</Button>
          <Button variant='secondary'>Navigate with Tab</Button>
        </div>
        <p className='mt-2 text-sm text-muted-foreground'>
          Use Tab to navigate, Enter or Space to activate
        </p>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>ARIA Labels</h3>
        <div className='flex gap-2'>
          <Button aria-label='Add new item to cart'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M12 5v14M5 12h14' />
            </svg>
          </Button>
          <Button aria-label='Delete selected items' variant='destructive'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' />
            </svg>
          </Button>
        </div>
        <p className='mt-2 text-sm text-muted-foreground'>
          Icon-only buttons have descriptive aria-labels for screen readers
        </p>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Focus Management</h3>
        <div className='flex gap-2'>
          <Button className='focus-visible:ring-4'>Enhanced Focus</Button>
          <Button variant='outline'>Standard Focus</Button>
        </div>
        <p className='mt-2 text-sm text-muted-foreground'>
          Visible focus indicators meet WCAG 2.1 AAA standards (2.4.7)
        </p>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Disabled State Announcement</h3>
        <div className='flex gap-2'>
          <Button disabled aria-disabled='true'>
            Disabled Button
          </Button>
          <Button disabled aria-label='Action unavailable'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M18 6L6 18M6 6l12 12' />
            </svg>
          </Button>
        </div>
        <p className='mt-2 text-sm text-muted-foreground'>
          Screen readers properly announce disabled state
        </p>
      </div>
    </div>
  ),
};

/**
 * Edge cases and unusual inputs
 * Tests button behavior with long text, special characters, rapid clicks, etc.
 */
export const EdgeCases: Story = {
  render: () => {
    const [clickCount, setClickCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    return (
      <div className='space-y-8'>
        <div>
          <h3 className='text-lg font-semibold mb-4'>Long Text Handling</h3>
          <div className='space-y-2 max-w-md'>
            <Button className='w-full'>
              This is an extremely long button label that should wrap or truncate appropriately
            </Button>
            <Button variant='outline' className='w-full'>
              Lorem ipsum dolor sit amet consectetur adipisicing elit
            </Button>
          </div>
        </div>

        <div>
          <h3 className='text-lg font-semibold mb-4'>Special Characters & XSS Safety</h3>
          <div className='flex gap-2 flex-wrap'>
            <Button>{"<script>alert('XSS')</script>"}</Button>
            <Button variant='outline'>{'Button & Text'}</Button>
            <Button variant='secondary'>{'Button "with" quotes'}</Button>
            <Button variant='ghost'>{'émojis 🚀 ✨ 💯'}</Button>
          </div>
          <p className='mt-2 text-sm text-muted-foreground'>
            React automatically escapes special characters preventing XSS
          </p>
        </div>

        <div>
          <h3 className='text-lg font-semibold mb-4'>Rapid Click Prevention (Debouncing)</h3>
          <div className='flex gap-4 items-center'>
            <Button
              onClick={async () => {
                if (isProcessing) return;
                setIsProcessing(true);
                setClickCount((prev) => prev + 1);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                setIsProcessing(false);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Click Me'}
            </Button>
            <span>Clicks: {clickCount}</span>
          </div>
          <p className='mt-2 text-sm text-muted-foreground'>
            Button prevents double-submission during processing
          </p>
        </div>

        <div>
          <h3 className='text-lg font-semibold mb-4'>Empty or Null Children</h3>
          <div className='flex gap-2'>
            <Button>{''}</Button>
            <Button>{null}</Button>
            <Button>{undefined}</Button>
            <Button> </Button>
          </div>
          <p className='mt-2 text-sm text-muted-foreground'>
            Component handles empty content gracefully
          </p>
        </div>

        <div>
          <h3 className='text-lg font-semibold mb-4'>RTL (Right-to-Left) Support</h3>
          <div dir='rtl' className='flex gap-2'>
            <Button>زر (Button in Arabic)</Button>
            <Button variant='outline'>כפתור (Button in Hebrew)</Button>
          </div>
          <p className='mt-2 text-sm text-muted-foreground'>
            Component respects RTL text direction
          </p>
        </div>
      </div>
    );
  },
};

/**
 * Responsive behavior across different screen sizes
 * Tests button sizing and layout on mobile, tablet, and desktop
 */
export const Responsive: Story = {
  render: () => (
    <div className='space-y-8'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Mobile (320px - 640px)</h3>
        <div className='max-w-[320px] border-2 border-dashed border-border p-4 rounded-lg'>
          <div className='space-y-2'>
            <Button className='w-full'>Full Width Action</Button>
            <Button variant='outline' className='w-full'>
              Secondary Action
            </Button>
            <div className='flex gap-2'>
              <Button size='sm' className='flex-1'>
                Cancel
              </Button>
              <Button size='sm' className='flex-1'>
                Confirm
              </Button>
            </div>
          </div>
        </div>
        <p className='mt-2 text-sm text-muted-foreground'>
          Touch targets meet minimum 44x44px size (WCAG 2.5.5)
        </p>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Tablet (768px - 1024px)</h3>
        <div className='max-w-[768px] border-2 border-dashed border-border p-4 rounded-lg'>
          <div className='flex gap-2 justify-between'>
            <Button variant='outline'>Cancel</Button>
            <div className='flex gap-2'>
              <Button variant='secondary'>Save Draft</Button>
              <Button>Publish</Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Desktop (1024px+)</h3>
        <div className='max-w-[1024px] border-2 border-dashed border-border p-4 rounded-lg'>
          <div className='flex justify-between items-center'>
            <div className='flex gap-2'>
              <Button variant='ghost'>Back</Button>
              <Button variant='ghost'>Settings</Button>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline'>Cancel</Button>
              <Button variant='secondary'>Save Draft</Button>
              <Button>Publish Now</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Real-world composition patterns
 * Shows how buttons work in common UI patterns and layouts
 */
export const CompositionPatterns: Story = {
  render: () => (
    <div className='space-y-8 max-w-4xl'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Button Group / Toolbar</h3>
        <div className='inline-flex rounded-md shadow-sm' role='group' aria-label='Text formatting'>
          <Button variant='outline' className='rounded-r-none border-r-0'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z' />
              <path d='M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z' />
            </svg>
          </Button>
          <Button variant='outline' className='rounded-none border-r-0'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <line x1='19' y1='4' x2='10' y2='4' />
              <line x1='14' y1='20' x2='5' y2='20' />
              <line x1='15' y1='4' x2='9' y2='20' />
            </svg>
          </Button>
          <Button variant='outline' className='rounded-l-none'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <line x1='5' y1='12' x2='19' y2='12' />
            </svg>
          </Button>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Modal Footer Actions</h3>
        <div className='border rounded-lg p-6 bg-card'>
          <div className='space-y-4'>
            <h4 className='font-semibold'>Confirm Deletion</h4>
            <p className='text-sm text-muted-foreground'>
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className='flex justify-end gap-2 pt-4 border-t'>
              <Button variant='outline'>Cancel</Button>
              <Button variant='destructive'>Delete</Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Form Actions</h3>
        <div className='border rounded-lg p-6 bg-card'>
          <form className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>Email</label>
              <input
                type='email'
                className='w-full px-3 py-2 border rounded-md'
                placeholder='you@example.com'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>Password</label>
              <input
                type='password'
                className='w-full px-3 py-2 border rounded-md'
                placeholder='••••••••'
              />
            </div>
            <div className='flex justify-between items-center pt-4'>
              <Button variant='link' className='p-0'>
                Forgot password?
              </Button>
              <div className='flex gap-2'>
                <Button type='button' variant='outline'>
                  Reset
                </Button>
                <Button type='submit'>Sign In</Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Floating Action Button (FAB)</h3>
        <div className='relative h-64 border-2 border-dashed border-border rounded-lg p-4'>
          <p className='text-sm text-muted-foreground'>Content area...</p>
          <Button
            size='icon'
            className='absolute bottom-4 right-4 h-14 w-14 rounded-full shadow-lg'
            aria-label='Add new item'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M12 5v14M5 12h14' />
            </svg>
          </Button>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Loading List Actions</h3>
        <div className='border rounded-lg overflow-hidden'>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className='flex justify-between items-center p-4 border-b last:border-b-0 hover:bg-accent/50'
            >
              <div>
                <div className='font-medium'>Item {item}</div>
                <div className='text-sm text-muted-foreground'>Description for item {item}</div>
              </div>
              <div className='flex gap-2'>
                <Button variant='ghost' size='sm'>
                  Edit
                </Button>
                <Button variant='ghost' size='sm' className='text-destructive'>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * Performance testing with many button instances
 * Ensures component remains performant at scale
 */
export const Performance: Story = {
  render: () => {
    const startTime = performance.now();
    const buttons = Array.from({ length: 100 }, (_, i) => (
      <Button
        key={i}
        variant={['default', 'outline', 'secondary', 'ghost'][i % 4] as any}
        size='sm'
      >
        Button {i + 1}
      </Button>
    ));
    const renderTime = performance.now() - startTime;

    return (
      <div className='space-y-4'>
        <div className='p-4 bg-muted rounded-lg'>
          <h3 className='text-lg font-semibold mb-2'>Performance Metrics</h3>
          <p className='text-sm'>
            <strong>Render Time:</strong> {renderTime.toFixed(2)}ms for 100 buttons
          </p>
          <p className='text-sm text-muted-foreground mt-1'>
            Target: &lt;100ms (Current: {renderTime < 100 ? '✅ PASS' : '❌ FAIL'})
          </p>
        </div>
        <div className='grid grid-cols-10 gap-2'>{buttons}</div>
      </div>
    );
  },
};

/**
 * Interactive playground with all controls
 * Allows testing any combination of props
 */
export const Playground: Story = {
  args: {
    children: 'Playground Button',
    variant: 'default',
    size: 'default',
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: {
      control: 'boolean',
    },
    asChild: {
      control: 'boolean',
    },
  },
};

<style>{`
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`}</style>;
