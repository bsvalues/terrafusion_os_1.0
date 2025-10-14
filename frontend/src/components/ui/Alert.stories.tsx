import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

/**
 * The Alert component displays important messages to users in a prominent way.
 * Built with class-variance-authority for type-safe variants.
 * 
 * ## Features
 * - Two variants: default (informational) and destructive (errors/warnings)
 * - Supports icons via SVG
 * - Accessible with proper ARIA role="alert"
 * - Full TypeScript support
 * - Composable with AlertTitle and AlertDescription
 * 
 * ## Usage
 * ```tsx
 * import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
 * 
 * <Alert>
 *   <AlertTitle>Heads up!</AlertTitle>
 *   <AlertDescription>
 *     You can add components to your app using the cli.
 *   </AlertDescription>
 * </Alert>
 * ```
 * 
 * ## Accessibility
 * - Proper ARIA role="alert" for screen readers
 * - Semantic HTML structure with h5 for title
 * - Visual distinction between variants
 * - Icon support for visual users
 */
const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'An accessible alert component for displaying important messages with optional title and description.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'Visual variant of the alert'
    }
  }
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default informational alert
 */
export const Default: Story = {
  render: () => <Alert style={{
    maxWidth: '600px'
  }}>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
};

/**
 * Destructive alert for errors and warnings
 */
export const Destructive: Story = {
  render: () => <Alert variant="destructive" style={{
    maxWidth: '600px'
  }}>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
};

/**
 * All alert variants displayed together
 */
export const AllVariants: Story = {
  render: () => <div className="flex">
      <Alert>
        <AlertTitle>Informational</AlertTitle>
        <AlertDescription>
          This is a default informational alert.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertTitle>Destructive</AlertTitle>
        <AlertDescription>
          This is a destructive alert for errors or warnings.
        </AlertDescription>
      </Alert>
    </div>
};

/**
 * Alerts with icons for better visual communication
 */
export const WithIcons: Story = {
  render: () => <div className="flex">
      {/* Info Alert */}
      <Alert>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <AlertTitle>New Feature Available</AlertTitle>
        <AlertDescription>
          We've just released a new dark mode. Check it out in settings!
        </AlertDescription>
      </Alert>

      {/* Success Alert */}
      <Alert style={{
      borderColor: '#22c55e',
      color: '#22c55e'
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          Your changes have been saved successfully.
        </AlertDescription>
      </Alert>

      {/* Warning Alert */}
      <Alert style={{
      borderColor: '#f59e0b',
      color: '#f59e0b'
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          You're approaching your storage limit. Consider upgrading your plan.
        </AlertDescription>
      </Alert>

      {/* Error Alert */}
      <Alert variant="destructive">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6M9 9l6 6" />
        </svg>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to connect to the server. Please check your internet connection.
        </AlertDescription>
      </Alert>
    </div>
};

/**
 * Alerts without titles - simpler messages
 */
export const WithoutTitle: Story = {
  render: () => <div className="flex">
      <Alert>
        <AlertDescription>
          This is a simple alert without a title. Use for brief messages.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertDescription>
          Something went wrong. Please try again.
        </AlertDescription>
      </Alert>
    </div>
};

/**
 * Alerts with action buttons
 */
export const WithActions: Story = {
  render: () => <div className="flex">
      <Alert>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <div className="flex-1">
          <AlertTitle>Update Available</AlertTitle>
          <AlertDescription style={{
          marginBottom: '12px'
        }}>
            A new version of the application is available.
          </AlertDescription>
          <div className="flex">
            <button style={{
            padding: '6px 12px',
            fontSize: '14px',
            backgroundColor: '#0099ff',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 500
          }}>
              Update Now
            </button>
            <button style={{
            padding: '6px 12px',
            fontSize: '14px',
            backgroundColor: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer'
          }}>
              Later
            </button>
          </div>
        </div>
      </Alert>

      <Alert variant="destructive">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6M9 9l6 6" />
        </svg>
        <div className="flex-1">
          <AlertTitle>Account Suspended</AlertTitle>
          <AlertDescription style={{
          marginBottom: '12px'
        }}>
            Your account has been suspended due to a payment issue.
          </AlertDescription>
          <button style={{
          padding: '6px 12px',
          fontSize: '14px',
          backgroundColor: '#ef4444',
          border: 'none',
          borderRadius: '6px',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 500
        }}>
            Update Payment Method
          </button>
        </div>
      </Alert>
    </div>
};

/**
 * Real-world examples in context
 */
export const RealWorldExample: Story = {
  render: () => <div style={{
    maxWidth: '800px',
    padding: '24px',
    backgroundColor: '#0a0a0a',
    borderRadius: '12px'
  }}>
      <h2 className="font-semibold">
        Settings
      </h2>

      {/* Success notification */}
      <Alert style={{
      marginBottom: '24px',
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.05)'
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
        <AlertDescription style={{
        color: '#22c55e'
      }}>
          Your profile has been updated successfully.
        </AlertDescription>
      </Alert>

      {/* Form content */}
      <div style={{
      marginBottom: '24px'
    }}>
        <div style={{
        marginBottom: '16px'
      }}>
          <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 500
        }}>
            Email Address
          </label>
          <input type="email" value="john.doe@example.com" className="w-full" />
        </div>

        <div style={{
        marginBottom: '16px'
      }}>
          <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 500
        }}>
            Display Name
          </label>
          <input type="text" value="John Doe" className="w-full" />
        </div>
      </div>

      {/* Warning about action */}
      <Alert style={{
      marginBottom: '24px',
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.05)'
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <AlertTitle style={{
        color: '#f59e0b'
      }}>Careful!</AlertTitle>
        <AlertDescription style={{
        color: '#f59e0b'
      }}>
          Changing your email address will require verification.
        </AlertDescription>
      </Alert>

      {/* Action buttons */}
      <div className="flex">
        <button style={{
        padding: '10px 16px',
        fontSize: '14px',
        backgroundColor: 'transparent',
        border: '1px solid #2a2a2a',
        borderRadius: '6px',
        color: '#fff',
        cursor: 'pointer'
      }}>
          Cancel
        </button>
        <button style={{
        padding: '10px 16px',
        fontSize: '14px',
        backgroundColor: '#0099ff',
        border: 'none',
        borderRadius: '6px',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 500
      }}>
          Save Changes
        </button>
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
        Alert Usage Guidelines
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
            }}>Use for important messages</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Alerts should communicate critical information that requires attention
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
            }}>Add appropriate icons</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Icons help users quickly identify the type of alert (info, success, warning, error)
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
            }}>Keep messages concise</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Alert text should be brief and actionable - avoid long paragraphs
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
            }}>Provide clear actions</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                When possible, include buttons for users to resolve the issue
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
            }}>Overuse alerts</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Too many alerts create alert fatigue - use sparingly for truly important messages
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
            }}>Use for regular content</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Alerts are for notifications, not general content layout
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
            }}>Write vague messages</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Be specific about what happened and what the user should do
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
            }}>Mix variant meanings</strong>
              <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
                Keep variant usage consistent: default for info, destructive for errors
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
          {`// Basic alert
<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components using the cli.
  </AlertDescription>
</Alert>

// Error alert
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired.
  </AlertDescription>
</Alert>

// With icon
<Alert>
  <InfoIcon className="h-4 w-4" />
  <AlertTitle>Info</AlertTitle>
  <AlertDescription>Message here</AlertDescription>
</Alert>

// With action
<Alert>
  <AlertTitle>Update Available</AlertTitle>
  <AlertDescription>
    A new version is ready.
  </AlertDescription>
  <Button size="sm">Update</Button>
</Alert>

// Simple alert (no title)
<Alert>
  <AlertDescription>
    Quick message here.
  </AlertDescription>
</Alert>`}
          </pre>
        </div>
      </div>
    </div>
};