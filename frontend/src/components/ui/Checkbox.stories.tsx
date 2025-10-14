/**
 * Checkbox Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Checkbox component
 * - All states (checked, unchecked, indeterminate, disabled)
 * - Form integration patterns
 * - Checkbox groups
 * - Accessibility
 * 
 * Architecture: Built on Radix UI Checkbox primitive
 * - Fully accessible with keyboard navigation
 * - Indeterminate state support
 * - Custom check icon
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { useState } from 'react';

const meta = {
  title: 'Design System/Atoms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Checkbox Component

A fully accessible checkbox component built on Radix UI primitives.

## Features
- ✅ Keyboard navigation (Space to toggle)
- ✅ ARIA attributes for screen readers
- ✅ Checked, unchecked, and indeterminate states
- ✅ Disabled state
- ✅ Custom check icon (Radix UI CheckIcon)
- ✅ Focus ring for accessibility
- ✅ Dark mode support
- ✅ Smooth animations

## Usage
\`\`\`tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>
\`\`\`

## Accessibility
- Built on Radix UI Checkbox primitive
- Full keyboard support (Space to toggle, Tab to focus)
- Screen reader announcements
- Focus visible ring
- Disabled state properly communicated
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Checkbox
 * Basic checkbox with label
 */
export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="default" />
      <Label htmlFor="default">Accept terms and conditions</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default checkbox with label for proper accessibility.',
      },
    },
  },
};

/**
 * Story 2: All States
 * Showing checked, unchecked, and disabled states
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="flex items-center space-x-2">
        <Checkbox id="unchecked" />
        <Label htmlFor="unchecked">Unchecked state</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="checked" defaultChecked />
        <Label htmlFor="checked">Checked state</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-unchecked" disabled />
        <Label htmlFor="disabled-unchecked" className="text-muted-foreground">
          Disabled unchecked
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked" className="text-muted-foreground">
          Disabled checked
        </Label>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All checkbox states with visual differences.',
      },
    },
  },
};

/**
 * Story 3: Checkbox Groups
 * Multiple checkboxes for multi-select scenarios
 */
export const CheckboxGroups: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-4">
        <div className="font-medium">Select your interests:</div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="coding" />
          <Label htmlFor="coding">Coding & Development</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="design" />
          <Label htmlFor="design">Design & UX</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="product" />
          <Label htmlFor="product">Product Management</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="marketing" />
          <Label htmlFor="marketing">Marketing</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="data" />
          <Label htmlFor="data">Data Science</Label>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="font-medium">Notification preferences:</div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="email-notif" defaultChecked />
          <Label htmlFor="email-notif">Email notifications</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="push-notif" defaultChecked />
          <Label htmlFor="push-notif">Push notifications</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="sms-notif" />
          <Label htmlFor="sms-notif">SMS notifications</Label>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grouped checkboxes for multi-select scenarios.',
      },
    },
  },
};

/**
 * Story 4: Interactive Examples
 * Controlled checkboxes with state management
 */
export const InteractiveExamples: Story = {
  render: () => {
    const [features, setFeatures] = useState({
      analytics: true,
      notifications: false,
      darkMode: true,
      autoSave: false,
    });
    
    const selectedCount = Object.values(features).filter(Boolean).length;
    
    return (
      <div className="space-y-6 w-[400px]">
        <div className="space-y-4">
          <div className="font-medium">Feature Settings</div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="analytics"
              checked={features.analytics}
              onCheckedChange={(checked) =>
                setFeatures({ ...features, analytics: checked === true })
              }
            />
            <Label htmlFor="analytics">Enable Analytics</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifications"
              checked={features.notifications}
              onCheckedChange={(checked) =>
                setFeatures({ ...features, notifications: checked === true })
              }
            />
            <Label htmlFor="notifications">Enable Notifications</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dark-mode"
              checked={features.darkMode}
              onCheckedChange={(checked) =>
                setFeatures({ ...features, darkMode: checked === true })
              }
            />
            <Label htmlFor="dark-mode">Enable Dark Mode</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-save"
              checked={features.autoSave}
              onCheckedChange={(checked) =>
                setFeatures({ ...features, autoSave: checked === true })
              }
            />
            <Label htmlFor="auto-save">Enable Auto-Save</Label>
          </div>
        </div>
        
        <div className="rounded-lg border p-4 space-y-2">
          <p className="font-medium">Active Features: {selectedCount} / 4</p>
          <div className="text-sm space-y-1">
            {features.analytics && <p>✓ Analytics tracking enabled</p>}
            {features.notifications && <p>✓ Notifications enabled</p>}
            {features.darkMode && <p>✓ Dark mode active</p>}
            {features.autoSave && <p>✓ Auto-save enabled</p>}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled checkboxes with state management and real-time feedback.',
      },
    },
  },
};

/**
 * Story 5: Select All Pattern
 * Parent checkbox to select/deselect all child checkboxes
 */
export const SelectAllPattern: Story = {
  render: () => {
    const [items, setItems] = useState({
      item1: false,
      item2: false,
      item3: false,
      item4: false,
    });
    
    const allChecked = Object.values(items).every(Boolean);
    const someChecked = Object.values(items).some(Boolean) && !allChecked;
    
    const handleSelectAll = (checked: boolean) => {
      setItems({
        item1: checked,
        item2: checked,
        item3: checked,
        item4: checked,
      });
    };
    
    return (
      <div className="space-y-6 w-[400px]">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={allChecked}
              onCheckedChange={(checked) => handleSelectAll(checked === true)}
              className={someChecked ? 'bg-primary/50' : ''}
            />
            <Label htmlFor="select-all" className="font-medium">
              Select All Items
            </Label>
          </div>
          
          <div className="pl-6 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="item1"
                checked={items.item1}
                onCheckedChange={(checked) =>
                  setItems({ ...items, item1: checked === true })
                }
              />
              <Label htmlFor="item1">Task Item 1</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="item2"
                checked={items.item2}
                onCheckedChange={(checked) =>
                  setItems({ ...items, item2: checked === true })
                }
              />
              <Label htmlFor="item2">Task Item 2</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="item3"
                checked={items.item3}
                onCheckedChange={(checked) =>
                  setItems({ ...items, item3: checked === true })
                }
              />
              <Label htmlFor="item3">Task Item 3</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="item4"
                checked={items.item4}
                onCheckedChange={(checked) =>
                  setItems({ ...items, item4: checked === true })
                }
              />
              <Label htmlFor="item4">Task Item 4</Label>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">
            Selected: {Object.values(items).filter(Boolean).length} / 4
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Select all pattern with parent checkbox controlling children.',
      },
    },
  },
};

/**
 * Story 6: Real-World Examples
 * Common checkbox patterns in production apps
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8 w-[500px]">
      {/* Terms and Conditions */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Account Registration</h3>
        
        <div className="flex items-start space-x-2">
          <Checkbox id="terms" className="mt-1" />
          <div className="space-y-1">
            <Label htmlFor="terms">
              I agree to the Terms and Conditions
            </Label>
            <p className="text-sm text-muted-foreground">
              By checking this box, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <Checkbox id="newsletter" className="mt-1" />
          <div className="space-y-1">
            <Label htmlFor="newsletter">
              Subscribe to newsletter
            </Label>
            <p className="text-sm text-muted-foreground">
              Get updates about new features and promotions.
            </p>
          </div>
        </div>
      </div>
      
      {/* Filter Checkboxes */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Filter Products</h3>
        
        <div className="space-y-3">
          <div className="font-medium text-sm">Price Range</div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-1" />
            <Label htmlFor="price-1">Under $25</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-2" />
            <Label htmlFor="price-2">$25 - $50</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-3" />
            <Label htmlFor="price-3">$50 - $100</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-4" />
            <Label htmlFor="price-4">Over $100</Label>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="font-medium text-sm">Brand</div>
          <div className="flex items-center space-x-2">
            <Checkbox id="brand-1" />
            <Label htmlFor="brand-1">Brand A</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="brand-2" />
            <Label htmlFor="brand-2">Brand B</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="brand-3" />
            <Label htmlFor="brand-3">Brand C</Label>
          </div>
        </div>
      </div>
      
      {/* Settings Panel */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Privacy Settings</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="profile-public">Public Profile</Label>
            <p className="text-sm text-muted-foreground">
              Make your profile visible to everyone
            </p>
          </div>
          <Checkbox id="profile-public" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="show-email">Show Email</Label>
            <p className="text-sm text-muted-foreground">
              Display email on your public profile
            </p>
          </div>
          <Checkbox id="show-email" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="allow-messages">Allow Messages</Label>
            <p className="text-sm text-muted-foreground">
              Let other users send you messages
            </p>
          </div>
          <Checkbox id="allow-messages" defaultChecked />
        </div>
      </div>
      
      {/* Task List */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Daily Tasks</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="task-1" defaultChecked />
            <Label htmlFor="task-1" className="line-through text-muted-foreground">
              Review pull requests
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="task-2" defaultChecked />
            <Label htmlFor="task-2" className="line-through text-muted-foreground">
              Update documentation
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="task-3" />
            <Label htmlFor="task-3">Write unit tests</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="task-4" />
            <Label htmlFor="task-4">Deploy to staging</Label>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world checkbox patterns: forms, filters, settings, and task lists.',
      },
    },
  },
};

/**
 * Story 7: Usage Guidelines
 * Best practices and accessibility
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Checkbox Component Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using checkboxes in your applications.
        </p>
      </div>
      
      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Always use with labels</p>
            <div className="flex items-center space-x-2">
              <Checkbox id="do-1" />
              <Label htmlFor="do-1">Clear label text</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Labels improve usability and accessibility
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use for multiple selections</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="do-2a" />
                <Label htmlFor="do-2a">Option A</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="do-2b" />
                <Label htmlFor="do-2b">Option B</Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Checkboxes allow multiple selections
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Provide helper text when needed</p>
            <div className="flex items-start space-x-2">
              <Checkbox id="do-3" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="do-3">Send notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get email updates about activity
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Group related checkboxes</p>
            <div className="space-y-2">
              <div className="font-medium text-sm">Preferences:</div>
              <div className="flex items-center space-x-2">
                <Checkbox id="do-4a" />
                <Label htmlFor="do-4a">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="do-4b" />
                <Label htmlFor="do-4b">SMS</Label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use for single choice</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="dont-1a" />
                <Label htmlFor="dont-1a">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="dont-1b" />
                <Label htmlFor="dont-1b">No</Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Use radio buttons for single selection
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use without labels</p>
            <Checkbox id="dont-2" />
            <p className="text-sm text-muted-foreground">
              Users need to know what they're checking
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use vague labels</p>
            <div className="flex items-center space-x-2">
              <Checkbox id="dont-3" />
              <Label htmlFor="dont-3">Enable feature</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Be specific about what the checkbox does
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't nest checkboxes deeply</p>
            <div className="space-y-1">
              <Checkbox id="dont-4a" />
              <div className="pl-6">
                <Checkbox id="dont-4b" />
                <div className="pl-6">
                  <Checkbox id="dont-4c" />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep hierarchies simple (max 2 levels)
            </p>
          </div>
        </div>
      </div>
      
      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Checkbox</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Controlled Checkbox</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`const [checked, setChecked] = useState(false);

<Checkbox
  id="controlled"
  checked={checked}
  onCheckedChange={(checked) => setChecked(checked === true)}
/>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Checkbox with Helper Text</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<div className="flex items-start space-x-2">
  <Checkbox id="notifications" className="mt-1" />
  <div className="space-y-1">
    <Label htmlFor="notifications">
      Enable notifications
    </Label>
    <p className="text-sm text-muted-foreground">
      Get updates about your account
    </p>
  </div>
</div>`}</code>
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
            <span>Always pair with Label using htmlFor/id attributes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Keyboard accessible (Space to toggle, Tab to focus)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Focus visible ring for keyboard navigation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Screen readers announce state changes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Disabled state prevents interaction and is announced</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Built on Radix UI for robust accessibility</span>
          </li>
        </ul>
      </div>
      
      {/* When to Use */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">When to Use Checkbox vs Other Components</h3>
        <div className="grid gap-4">
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-2">✓ Use Checkbox when:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• User can select multiple options independently</li>
              <li>• Enabling/disabling a single feature or setting</li>
              <li>• Accepting terms and conditions</li>
              <li>• Filtering or selecting items from a list</li>
            </ul>
          </div>
          
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-2">Use alternatives when:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Single choice from options: Use Radio buttons</li>
              <li>• Binary on/off state: Use Switch</li>
              <li>• Immediate action (no form submit): Use Toggle or Switch</li>
              <li>• Complex multi-select: Use Multi-select dropdown</li>
            </ul>
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
