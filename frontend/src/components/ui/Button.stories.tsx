import type { Meta, StoryObj } from '@storybook/react';
import { Button, buttonVariants } from './button';
import { useState } from 'react';

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
        component: 'A flexible, accessible button component with multiple variants and sizes. Built with Radix UI primitives and CVA for type-safe styling.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual variant of the button'
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Size of the button'
    },
    asChild: {
      control: 'boolean',
      description: 'Render as child component using Radix Slot'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button'
    }
  }
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
    size: 'default'
  }
};

/**
 * All button variants displayed together
 */
export const AllVariants: Story = {
  render: () => <div className="flex">
      <div className="flex items-center">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
};

/**
 * All button sizes from small to large, plus icon-only
 */
export const Sizes: Story = {
  render: () => <div className="flex items-center">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Button>
    </div>
};

/**
 * Button states including hover, focus, disabled, and loading
 */
export const States: Story = {
  render: () => <div className="flex">
      <div>
        <div className="font-semibold">
          Normal State
        </div>
        <Button>Normal Button</Button>
      </div>
      
      <div>
        <div className="font-semibold">
          Disabled State
        </div>
        <Button disabled>Disabled Button</Button>
      </div>

      <div>
        <div className="font-semibold">
          Loading State
        </div>
        <Button disabled>
          <svg style={{
          animation: 'spin 1s linear infinite',
          marginRight: '8px'
        }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Loading...
        </Button>
      </div>
    </div>
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCount(prev => prev + 1);
      setLoading(false);
    };
    return <div className="text-center">
        <h3 style={{
        marginBottom: '16px',
        fontSize: '18px'
      }}>
          Button clicked {count} times
        </h3>
        <Button onClick={handleClick} disabled={loading}>
          {loading ? <>
              <svg style={{
            animation: 'spin 1s linear infinite',
            marginRight: '8px'
          }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Processing...
            </> : 'Click Me'}
        </Button>
      </div>;
  }
};

/**
 * Button with icon - common pattern for visual clarity
 */
export const WithIcon: Story = {
  render: () => <div className="flex">
      <Button>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
        marginRight: '8px'
      }}>
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Item
      </Button>
      
      <Button variant="destructive">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
        marginRight: '8px'
      }}>
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Delete
      </Button>
      
      <Button variant="outline">
        Save
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
        marginLeft: '8px'
      }}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        </svg>
      </Button>
    </div>
};

/**
 * Real-world example showing buttons in a form context
 */
export const RealWorldExample: Story = {
  render: () => <div style={{
    maxWidth: '500px',
    padding: '32px',
    backgroundColor: '#0a0a0a',
    borderRadius: '12px',
    border: '1px solid #2a2a2a'
  }}>
      <h2 className="font-semibold">
        Create Account
      </h2>
      <p style={{
      marginBottom: '24px',
      color: '#888',
      fontSize: '14px'
    }}>
        Sign up to get started with TerraFusion OS
      </p>
      
      <div className="flex">
        <div>
          <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 500
        }}>
            Email
          </label>
          <input type="email" placeholder="you@example.com" className="w-full" />
        </div>
        
        <div>
          <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 500
        }}>
            Password
          </label>
          <input type="password" placeholder="••••••••" className="w-full" />
        </div>
        
        <div className="flex">
          <Button variant="ghost">
            Cancel
          </Button>
          <Button>
            Create Account
          </Button>
        </div>
      </div>
      
      <div className="text-center">
        <Button variant="link" style={{
        fontSize: '14px'
      }}>
          Already have an account? Sign in
        </Button>
      </div>
    </div>
};

/**
 * Usage guidelines with Do's and Don'ts
 */
export const UsageGuidelines: Story = {
  render: () => <div style={{
    maxWidth: '900px',
    padding: '24px'
  }}>
      <h3 className="font-semibold">
        Button Usage Guidelines
      </h3>
      
      <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '32px'
    }}>
        {/* DO Section */}
        <div>
          <h4 className="font-semibold flex items-center">
            <span style={{
            fontSize: '20px'
          }}>✓</span> Do
          </h4>
          <ul className="flex">
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>Use clear, action-oriented labels</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                "Save Changes", "Create Account", "Download Report"
              </p>
            </li>
            
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>Use appropriate variants</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Primary actions → default, Destructive actions → destructive, Secondary → outline/secondary
              </p>
            </li>
            
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>Show loading states</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Disable and show spinner during async operations
              </p>
            </li>
            
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderLeft: '3px solid #22c55e',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>Group related actions</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Keep primary and secondary actions together with consistent spacing
              </p>
            </li>
          </ul>
        </div>

        {/* DON'T Section */}
        <div>
          <h4 className="font-semibold flex items-center">
            <span style={{
            fontSize: '20px'
          }}>✗</span> Don't
          </h4>
          <ul className="flex">
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>Use vague labels</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Avoid "Click Here", "Submit", "OK" - be specific about the action
              </p>
            </li>
            
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>Overuse primary buttons</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Only one primary action per context - use outline/secondary for others
              </p>
            </li>
            
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>Forget disabled states</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Always disable buttons during loading or when action isn't available
              </p>
            </li>
            
            <li style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '6px'
          }}>
              <strong style={{
              display: 'block',
              marginBottom: '4px'
            }}>Mix sizes inconsistently</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Keep button sizes consistent within the same context
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Code Examples */}
      <div style={{
      marginTop: '40px'
    }}>
        <h4 className="font-semibold">
          Code Examples
        </h4>
        <div style={{
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: '"Fira Code", monospace',
        fontSize: '13px',
        overflow: 'auto',
        border: '1px solid #2a2a2a'
      }}>
          <pre style={{
          margin: 0,
          lineHeight: '1.6'
        }}>
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