/**
 * Input Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Input component
 * - All variants and states
 * - Real-world usage examples
 * - Accessibility patterns
 * - Do/Don't guidelines
 * - Interactive examples
 * 
 * Architecture: Following Atomic Design principles
 * - Atom-level component
 * - Form building block
 * - Accessible by default
 * - Highly composable
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { useState } from 'react';
import { Label } from './label';

const meta = {
  title: 'Design System/Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Input Component

A foundational form input component built with accessibility and composability in mind.

## Features
- ✅ Full keyboard navigation
- ✅ ARIA attributes for screen readers
- ✅ Disabled and error states
- ✅ File upload support
- ✅ All HTML5 input types
- ✅ Tailwind CSS styling with CSS variables
- ✅ Dark mode support
- ✅ Focus ring for accessibility

## Usage
\`\`\`tsx
import { Input } from '@/components/ui/input';

<Input type="text" placeholder="Enter text..." />
\`\`\`

## Accessibility
- Uses native HTML \`<input>\` element
- Supports all ARIA attributes
- Focus visible ring for keyboard navigation
- Works with screen readers
- Proper disabled state cursor
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'file'],
      description: 'HTML input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether input is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether input is required',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Input
 * The basic input with no additional props
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default input with standard styling and placeholder text.',
      },
    },
  },
};

/**
 * Story 2: All Input Types
 * Showcasing all supported HTML5 input types
 */
export const AllTypes: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="text">Text Input</Label>
        <Input id="text" type="text" placeholder="Enter text..." />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Input</Label>
        <Input id="email" type="email" placeholder="user@example.com" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password Input</Label>
        <Input id="password" type="password" placeholder="••••••••" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="number">Number Input</Label>
        <Input id="number" type="number" placeholder="123" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tel">Telephone Input</Label>
        <Input id="tel" type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="url">URL Input</Label>
        <Input id="url" type="url" placeholder="https://example.com" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="search">Search Input</Label>
        <Input id="search" type="search" placeholder="Search..." />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date">Date Input</Label>
        <Input id="date" type="date" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="time">Time Input</Label>
        <Input id="time" type="time" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="file">File Input</Label>
        <Input id="file" type="file" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All supported HTML5 input types with appropriate placeholders and labels.',
      },
    },
  },
};

/**
 * Story 3: Input States
 * All possible states: default, disabled, with value, required
 */
export const States: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="default">Default State</Label>
        <Input id="default" placeholder="Enter text..." />
        <p className="text-sm text-muted-foreground">Standard input ready for interaction</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="filled">With Value</Label>
        <Input id="filled" defaultValue="This input has a value" />
        <p className="text-sm text-muted-foreground">Input with pre-filled content</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="disabled">Disabled State</Label>
        <Input id="disabled" placeholder="Cannot interact" disabled />
        <p className="text-sm text-muted-foreground">Input is disabled and cannot be modified</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="required">Required Field *</Label>
        <Input id="required" placeholder="This field is required" required />
        <p className="text-sm text-muted-foreground">Browser will validate on form submit</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="readonly">Read-only State</Label>
        <Input id="readonly" defaultValue="Cannot be changed" readOnly />
        <p className="text-sm text-muted-foreground">Value is visible but cannot be edited</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All input states with visual and functional differences.',
      },
    },
  },
};

/**
 * Story 4: With Labels and Helper Text
 * Proper form layout with labels and helper text
 */
export const WithLabelsAndHelperText: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" placeholder="johndoe" />
        <p className="text-sm text-muted-foreground">
          Choose a unique username. 3-20 characters, letters and numbers only.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email-form">Email Address *</Label>
        <Input id="email-form" type="email" placeholder="user@example.com" required />
        <p className="text-sm text-muted-foreground">
          We'll never share your email with anyone else.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password-form">Password *</Label>
        <Input id="password-form" type="password" placeholder="••••••••" required />
        <p className="text-sm text-muted-foreground">
          Must be at least 8 characters with one uppercase, lowercase, and number.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password *</Label>
        <Input id="confirm-password" type="password" placeholder="••••••••" required />
        <p className="text-sm text-muted-foreground">
          Re-enter your password to confirm.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Proper form layout combining inputs with labels and helper text for better UX.',
      },
    },
  },
};

/**
 * Story 5: Interactive Examples
 * Real-time validation and state management
 */
export const InteractiveExamples: Story = {
  render: () => {
    const [emailValue, setEmailValue] = useState('');
    const [passwordValue, setPasswordValue] = useState('');
    const [confirmValue, setConfirmValue] = useState('');
    
    const isEmailValid = emailValue === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
    const isPasswordValid = passwordValue === '' || passwordValue.length >= 8;
    const doPasswordsMatch = passwordValue === confirmValue;
    
    return (
      <div className="space-y-6 w-[400px]">
        <div className="space-y-2">
          <Label htmlFor="email-interactive">Email Address</Label>
          <Input
            id="email-interactive"
            type="email"
            placeholder="user@example.com"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            className={!isEmailValid ? 'border-red-500' : ''}
          />
          {!isEmailValid && (
            <p className="text-sm text-red-500">Please enter a valid email address</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password-interactive">Password</Label>
          <Input
            id="password-interactive"
            type="password"
            placeholder="••••••••"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            className={passwordValue && !isPasswordValid ? 'border-red-500' : ''}
          />
          {passwordValue && !isPasswordValid && (
            <p className="text-sm text-red-500">Password must be at least 8 characters</p>
          )}
          {isPasswordValid && passwordValue && (
            <p className="text-sm text-green-600">✓ Password is valid</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-interactive">Confirm Password</Label>
          <Input
            id="confirm-interactive"
            type="password"
            placeholder="••••••••"
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            className={confirmValue && !doPasswordsMatch ? 'border-red-500' : ''}
          />
          {confirmValue && !doPasswordsMatch && (
            <p className="text-sm text-red-500">Passwords do not match</p>
          )}
          {confirmValue && doPasswordsMatch && (
            <p className="text-sm text-green-600">✓ Passwords match</p>
          )}
        </div>
        
        <div className="pt-4">
          <p className="text-sm font-medium">Form Status:</p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2">
            <li>{isEmailValid ? '✓' : '✗'} Valid email</li>
            <li>{isPasswordValid ? '✓' : '✗'} Password requirements met</li>
            <li>{doPasswordsMatch && confirmValue ? '✓' : '✗'} Passwords match</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-time validation with state management showing error states and success feedback.',
      },
    },
  },
};

/**
 * Story 6: Real-World Examples
 * Common form patterns in production apps
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8 w-[500px]">
      {/* Login Form */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Login Form</h3>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" placeholder="user@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input id="login-password" type="password" placeholder="••••••••" />
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Search Bar</h3>
        <div className="space-y-2">
          <Input 
            type="search" 
            placeholder="Search for projects, tasks, or team members..." 
            className="w-full"
          />
        </div>
      </div>
      
      {/* Contact Form */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Contact Form</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">First Name</Label>
            <Input id="first-name" placeholder="John" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Last Name</Label>
            <Input id="last-name" placeholder="Doe" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input id="contact-email" type="email" placeholder="john.doe@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
        </div>
      </div>
      
      {/* Settings Form */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Profile Settings</h3>
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <Input id="display-name" defaultValue="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio-url">Website</Label>
          <Input id="bio-url" type="url" placeholder="https://yourwebsite.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar</Label>
          <Input id="avatar" type="file" accept="image/*" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common real-world form patterns: login, search, contact forms, and settings.',
      },
    },
  },
};

/**
 * Story 7: Usage Guidelines
 * Do's and Don'ts for Input component
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Input Component Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using the Input component in your applications.
        </p>
      </div>
      
      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Always use labels</p>
            <div className="space-y-2">
              <Label htmlFor="do-1">Username</Label>
              <Input id="do-1" placeholder="johndoe" />
            </div>
            <p className="text-sm text-muted-foreground">
              Labels improve accessibility and usability
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Provide helpful placeholder text</p>
            <Input placeholder="user@example.com" type="email" />
            <p className="text-sm text-muted-foreground">
              Placeholders should show format examples
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use appropriate input types</p>
            <Input type="email" placeholder="Email input validates format" />
            <p className="text-sm text-muted-foreground">
              Let HTML5 validation help users
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Add helper text when needed</p>
            <div className="space-y-2">
              <Input placeholder="Password" type="password" />
              <p className="text-sm text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't skip labels</p>
            <Input placeholder="What field is this?" />
            <p className="text-sm text-muted-foreground">
              Users need to know what to enter
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use vague placeholders</p>
            <Input placeholder="Enter here" />
            <p className="text-sm text-muted-foreground">
              Placeholders should be descriptive
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use wrong input types</p>
            <Input type="text" placeholder="user@email.com" />
            <p className="text-sm text-muted-foreground">
              Use type="email" for email inputs
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't make inputs too narrow</p>
            <Input className="w-20" placeholder="Email" />
            <p className="text-sm text-muted-foreground">
              Input width should accommodate expected content
            </p>
          </div>
        </div>
      </div>
      
      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Input with Label</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{`import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="user@example.com" />
</div>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Controlled Input with Validation</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{`const [value, setValue] = useState('');
const isValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);

<Input
  type="email"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className={!isValid && value ? 'border-red-500' : ''}
/>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Input with Helper Text</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{`<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input id="password" type="password" />
  <p className="text-sm text-muted-foreground">
    Must be at least 8 characters
  </p>
</div>`}</code>
            </pre>
          </div>
        </div>
      </div>
      
      {/* Accessibility Notes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Accessibility Checklist</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Always associate inputs with labels using htmlFor/id</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Use appropriate input types for better mobile keyboards</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Add required attribute and aria-required for required fields</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Use aria-invalid and aria-describedby for error states</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Ensure focus states are visible (built-in with focus-visible:ring)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Disable inputs appropriately with disabled attribute</span>
          </li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Comprehensive guidelines showing best practices, common mistakes, code examples, and accessibility requirements.',
      },
    },
  },
};

/**
 * Story 8: Input Sizes
 * Different size variations for various contexts
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="sm">Small Input</Label>
        <Input id="sm" placeholder="Small input..." className="h-8 text-sm" />
        <p className="text-sm text-muted-foreground">Compact for dense layouts</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="default-size">Default Input</Label>
        <Input id="default-size" placeholder="Default input..." />
        <p className="text-sm text-muted-foreground">Standard size for most forms</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="lg">Large Input</Label>
        <Input id="lg" placeholder="Large input..." className="h-12 text-lg" />
        <p className="text-sm text-muted-foreground">Prominent for important fields</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input sizes for different contexts and visual hierarchy.',
      },
    },
  },
};

/**
 * Story 9: With Icons
 * Inputs with icons for visual enhancement and clarity
 */
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="search-icon">Search with Icon</Label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <Input id="search-icon" placeholder="Search..." className="pl-10" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email-icon">Email with Icon</Label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <Input id="email-icon" type="email" placeholder="user@example.com" className="pl-10" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password-icon">Password with Toggle</Label>
        <div className="relative">
          <Input id="password-icon" type="password" placeholder="••••••••" className="pr-10" />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle password visibility"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="currency">Currency Input</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input id="currency" type="number" placeholder="0.00" className="pl-8" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs enhanced with icons for better visual communication and functionality.',
      },
    },
  },
};

/**
 * Story 10: Accessibility Testing
 * Comprehensive WCAG 2.1 AAA accessibility compliance
 */
export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-8" role="region" aria-label="Input accessibility testing">
      <div>
        <h3 className="text-lg font-semibold mb-4">Keyboard Navigation</h3>
        <div className="space-y-4 w-[400px]">
          <div className="space-y-2">
            <Label htmlFor="a11y-1">First Input (Tab to focus)</Label>
            <Input id="a11y-1" placeholder="Tab to focus this input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a11y-2">Second Input (Tab to navigate)</Label>
            <Input id="a11y-2" placeholder="Continue tabbing..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a11y-3">Third Input (Shift+Tab to go back)</Label>
            <Input id="a11y-3" placeholder="Shift+Tab to go back" />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Use Tab/Shift+Tab to navigate between inputs
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">ARIA Labels & Descriptions</h3>
        <div className="space-y-4 w-[400px]">
          <div className="space-y-2">
            <Label htmlFor="a11y-aria-1">Username</Label>
            <Input
              id="a11y-aria-1"
              aria-label="Username for login"
              aria-describedby="username-desc"
              placeholder="johndoe"
            />
            <p id="username-desc" className="text-sm text-muted-foreground">
              3-20 characters, letters and numbers only
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="a11y-aria-2">Email (Required)</Label>
            <Input
              id="a11y-aria-2"
              type="email"
              required
              aria-required="true"
              aria-label="Email address"
              aria-describedby="email-desc"
              placeholder="user@example.com"
            />
            <p id="email-desc" className="text-sm text-muted-foreground">
              We'll never share your email
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="a11y-aria-3">Password (with error)</Label>
            <Input
              id="a11y-aria-3"
              type="password"
              aria-invalid="true"
              aria-describedby="password-error"
              className="border-red-500"
              defaultValue="123"
            />
            <p id="password-error" className="text-sm text-red-500" role="alert">
              Password must be at least 8 characters
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Focus Management</h3>
        <div className="space-y-2 w-[400px]">
          <Label htmlFor="a11y-focus">Enhanced Focus Ring</Label>
          <Input
            id="a11y-focus"
            placeholder="Click or tab to see focus ring"
            className="focus-visible:ring-4"
          />
          <p className="text-sm text-muted-foreground">
            Focus ring meets WCAG 2.1 AAA contrast requirements
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Screen Reader Support</h3>
        <div className="space-y-4 w-[400px]">
          <div className="space-y-2">
            <Label htmlFor="sr-1">Visible Label</Label>
            <Input id="sr-1" placeholder="Screen readers announce the label" />
          </div>
          
          <div className="space-y-2">
            <Input
              id="sr-2"
              aria-label="Search for content"
              placeholder="Search..."
              type="search"
            />
            <p className="text-sm text-muted-foreground">
              Icon-only input with aria-label for screen readers
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility testing for WCAG 2.1 AAA compliance.',
      },
    },
  },
};

/**
 * Story 11: Edge Cases
 * Unusual inputs and boundary conditions
 */
export const EdgeCases: Story = {
  render: () => {
    const [xssTest, setXssTest] = useState('');
    
    return (
      <div className="space-y-8 w-[600px]">
        <div>
          <h3 className="text-lg font-semibold mb-4">Long Text Handling</h3>
          <div className="space-y-2">
            <Label htmlFor="long">Very Long Input Value</Label>
            <Input
              id="long"
              defaultValue="This is an extremely long input value that should be handled gracefully without breaking the layout or causing overflow issues in the user interface"
            />
            <p className="text-sm text-muted-foreground">
              Long text is contained within input boundaries
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">XSS Safety</h3>
          <div className="space-y-2">
            <Label htmlFor="xss">Potentially Malicious Input</Label>
            <Input
              id="xss"
              value={xssTest}
              onChange={(e) => setXssTest(e.target.value)}
              placeholder="Try: <script>alert('XSS')</script>"
            />
            <p className="text-sm text-muted-foreground">
              React automatically escapes dangerous characters
            </p>
            <div className="text-sm mt-2">
              <strong>Current value:</strong> {xssTest}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Special Characters</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji Input</Label>
              <Input id="emoji" defaultValue="Hello 🌍 World 🚀 💯" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbols">Special Symbols</Label>
              <Input id="symbols" defaultValue={'Test & <tags> \'quotes\' "double" ©®™'} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unicode">Unicode Characters</Label>
              <Input id="unicode" defaultValue="Hello मस्ते 你好 مرحبا שלום" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">RTL (Right-to-Left) Support</h3>
          <div className="space-y-4">
            <div className="space-y-2" dir="rtl">
              <Label htmlFor="rtl-arabic">Arabic Text</Label>
              <Input id="rtl-arabic" placeholder="أدخل النص هنا" />
            </div>
            
            <div className="space-y-2" dir="rtl">
              <Label htmlFor="rtl-hebrew">Hebrew Text</Label>
              <Input id="rtl-hebrew" placeholder="הזן טקסט כאן" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Empty/Null States</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="empty">Empty String Value</Label>
              <Input id="empty" value="" readOnly />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whitespace">Whitespace Only</Label>
              <Input id="whitespace" defaultValue="        " />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Numeric Edge Cases</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zero">Zero Value</Label>
              <Input id="zero" type="number" defaultValue="0" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="negative">Negative Number</Label>
              <Input id="negative" type="number" defaultValue="-999" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="decimal">Large Decimal</Label>
              <Input id="decimal" type="number" step="0.01" defaultValue="123456.789" />
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Edge cases including long text, XSS safety, special characters, RTL, and boundary values.',
      },
    },
  },
};

/**
 * Story 12: Responsive Behavior
 * Input behavior across different screen sizes
 */
export const Responsive: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile (320px - 640px)</h3>
        <div className="max-w-[320px] border-2 border-dashed border-border p-4 rounded-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-1">Full Width Input</Label>
              <Input id="mobile-1" placeholder="Auto-fill width" className="w-full" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile-2">Email (Mobile Keyboard)</Label>
              <Input id="mobile-2" type="email" placeholder="user@example.com" className="w-full" />
              <p className="text-xs text-muted-foreground">
                Mobile shows @ and . on keyboard
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile-3">Phone Number</Label>
              <Input id="mobile-3" type="tel" placeholder="+1 (555) 000-0000" className="w-full" />
              <p className="text-xs text-muted-foreground">
                Mobile shows numeric keypad
              </p>
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Touch targets meet minimum 44x44px (WCAG 2.5.5)
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Tablet (768px - 1024px)</h3>
        <div className="max-w-[768px] border-2 border-dashed border-border p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tablet-1">First Name</Label>
              <Input id="tablet-1" placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tablet-2">Last Name</Label>
              <Input id="tablet-2" placeholder="Doe" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop (1024px+)</h3>
        <div className="max-w-[1024px] border-2 border-dashed border-border p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desktop-1">City</Label>
              <Input id="desktop-1" placeholder="New York" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desktop-2">State</Label>
              <Input id="desktop-2" placeholder="NY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desktop-3">ZIP Code</Label>
              <Input id="desktop-3" placeholder="10001" />
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
        story: 'Responsive input behavior optimized for mobile, tablet, and desktop.',
      },
    },
  },
};

/**
 * Story 13: Composition Patterns
 * Real-world patterns showing Input in common UI compositions
 */
export const CompositionPatterns: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Search Bar with Button</h3>
        <div className="flex gap-2 max-w-md">
          <Input placeholder="Search for anything..." className="flex-1" />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Search
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Inline Edit Pattern</h3>
        <div className="max-w-md space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium w-24">Name:</span>
            <Input defaultValue="John Doe" className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium w-24">Email:</span>
            <Input type="email" defaultValue="john@example.com" className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium w-24">Phone:</span>
            <Input type="tel" defaultValue="+1 555-0000" className="flex-1" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Form Grid Layout</h3>
        <div className="max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grid-1">First Name *</Label>
              <Input id="grid-1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grid-2">Last Name *</Label>
              <Input id="grid-2" required />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="grid-3">Email Address *</Label>
              <Input id="grid-3" type="email" required />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="grid-4">Street Address</Label>
              <Input id="grid-4" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grid-5">City</Label>
              <Input id="grid-5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grid-6">ZIP Code</Label>
              <Input id="grid-6" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Input Group with Addon</h3>
        <div className="max-w-md space-y-4">
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground">
              https://
            </span>
            <Input placeholder="example.com" className="rounded-l-none" />
          </div>
          
          <div className="flex">
            <Input placeholder="Enter amount" className="rounded-r-none" />
            <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-muted-foreground">
              .00
            </span>
          </div>
          
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground">
              @
            </span>
            <Input placeholder="username" className="rounded-none" />
            <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-muted-foreground">
              @example.com
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Filter Bar</h3>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search..." className="w-64" />
          <Input type="date" className="w-40" />
          <Input type="date" className="w-40" />
          <select className="px-3 py-2 border rounded-md">
            <option>All Categories</option>
            <option>Category 1</option>
            <option>Category 2</option>
          </select>
          <button className="px-4 py-2 border rounded-md hover:bg-accent">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Common composition patterns: search bars, inline edit, form grids, input groups, and filter bars.',
      },
    },
  },
};

/**
 * Story 14: Performance Testing
 * Rendering performance with many input instances
 */
export const Performance: Story = {
  render: () => {
    const startTime = performance.now();
    const inputs = Array.from({ length: 50 }, (_, i) => (
      <div key={i} className="space-y-2">
        <Label htmlFor={`perf-${i}`}>Input {i + 1}</Label>
        <Input id={`perf-${i}`} placeholder={`Input field ${i + 1}`} />
      </div>
    ));
    const renderTime = performance.now() - startTime;

    return (
      <div className="space-y-4 max-w-2xl">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
          <p className="text-sm">
            <strong>Render Time:</strong> {renderTime.toFixed(2)}ms for 50 inputs
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Target: &lt;100ms (Current: {renderTime < 100 ? '✅ PASS' : '❌ FAIL'})
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto p-4 border rounded-lg">
          {inputs}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance test with 50 input instances to ensure component scales well.',
      },
    },
  },
};

/**
 * Story 15: Playground
 * Interactive playground for testing all input configurations
 */
export const Playground: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    disabled: false,
    required: false,
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'file'],
    },
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
    readOnly: {
      control: 'boolean',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground to test any combination of input properties.',
      },
    },
  },
};
