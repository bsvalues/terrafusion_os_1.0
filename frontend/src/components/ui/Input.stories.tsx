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
