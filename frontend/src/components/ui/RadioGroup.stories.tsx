/**
 * Radio Group Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Radio Group component
 * - Single selection from multiple options
 * - All states (selected, unselected, disabled)
 * - Grouped radio buttons
 * - Form integration patterns
 * 
 * Architecture: Built on Radix UI Radio Group primitive
 * - Fully accessible with keyboard navigation (Arrow keys)
 * - Single selection enforced
 * - Custom indicator (DotFilledIcon)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';
import { useState } from 'react';

const meta = {
  title: 'Design System/Atoms/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Radio Group Component

A fully accessible radio button group for single selection from multiple options.

## Features
- ✅ Full keyboard navigation (Arrow keys, Tab, Space)
- ✅ ARIA attributes for screen readers
- ✅ Single selection enforced automatically
- ✅ Disabled state for group and individual items
- ✅ Custom filled dot indicator
- ✅ Focus ring for accessibility
- ✅ Dark mode support
- ✅ Smooth animations

## Usage
\`\`\`tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

<RadioGroup defaultValue="option1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="r2" />
    <Label htmlFor="r2">Option 2</Label>
  </div>
</RadioGroup>
\`\`\`

## Accessibility
- Built on Radix UI Radio Group primitive
- Arrow keys navigate between options
- Space selects focused option
- Screen reader announces selection state
- Proper ARIA roles and attributes
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Radio Group
 * Basic radio group with multiple options
 */
export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="r1" />
        <Label htmlFor="r1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="r2" />
        <Label htmlFor="r2">Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="r3" />
        <Label htmlFor="r3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default radio group with three options and first option pre-selected.',
      },
    },
  },
};

/**
 * Story 2: All States
 * Showing selected, unselected, and disabled states
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-8 w-[400px]">
      <div className="space-y-4">
        <div className="font-medium">Default State</div>
        <RadioGroup defaultValue="comfortable">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="compact" id="state-compact" />
            <Label htmlFor="state-compact">Compact</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="comfortable" id="state-comfortable" />
            <Label htmlFor="state-comfortable">Comfortable (Selected)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="spacious" id="state-spacious" />
            <Label htmlFor="state-spacious">Spacious</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-4">
        <div className="font-medium">With Disabled Items</div>
        <RadioGroup defaultValue="yes">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="state-yes" />
            <Label htmlFor="state-yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="state-no" />
            <Label htmlFor="state-no">No</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="maybe" id="state-maybe" disabled />
            <Label htmlFor="state-maybe" className="text-muted-foreground">
              Maybe (Disabled)
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-4">
        <div className="font-medium">Fully Disabled Group</div>
        <RadioGroup disabled defaultValue="option1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="disabled-1" />
            <Label htmlFor="disabled-1" className="text-muted-foreground">
              Option 1 (Disabled)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="disabled-2" />
            <Label htmlFor="disabled-2" className="text-muted-foreground">
              Option 2 (Disabled)
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All radio group states: default, selected, disabled items, and disabled group.',
      },
    },
  },
};

/**
 * Story 3: With Descriptions
 * Radio options with additional descriptive text
 */
export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="standard" className="w-[500px]">
      <div className="flex items-start space-x-3 rounded-lg border p-4">
        <RadioGroupItem value="free" id="plan-free" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor="plan-free" className="font-medium">Free</Label>
          <p className="text-sm text-muted-foreground">
            Basic features for individual developers. No credit card required.
          </p>
          <p className="text-sm font-semibold">$0/month</p>
        </div>
      </div>
      
      <div className="flex items-start space-x-3 rounded-lg border p-4">
        <RadioGroupItem value="standard" id="plan-standard" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor="plan-standard" className="font-medium">Standard</Label>
          <p className="text-sm text-muted-foreground">
            Advanced features for small teams. Includes priority support.
          </p>
          <p className="text-sm font-semibold">$29/month</p>
        </div>
      </div>
      
      <div className="flex items-start space-x-3 rounded-lg border p-4">
        <RadioGroupItem value="enterprise" id="plan-enterprise" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor="plan-enterprise" className="font-medium">Enterprise</Label>
          <p className="text-sm text-muted-foreground">
            Unlimited features for large organizations. Dedicated account manager.
          </p>
          <p className="text-sm font-semibold">Custom pricing</p>
        </div>
      </div>
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio options with detailed descriptions for complex choices like pricing plans.',
      },
    },
  },
};

/**
 * Story 4: Horizontal Layout
 * Radio buttons arranged horizontally instead of vertically
 */
export const HorizontalLayout: Story = {
  render: () => (
    <div className="space-y-6 w-[500px]">
      <div className="space-y-3">
        <Label>Size</Label>
        <RadioGroup defaultValue="medium" className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="small" id="size-small" />
            <Label htmlFor="size-small">Small</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="size-medium" />
            <Label htmlFor="size-medium">Medium</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="large" id="size-large" />
            <Label htmlFor="size-large">Large</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-3">
        <Label>Color</Label>
        <RadioGroup defaultValue="blue" className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="red" id="color-red" />
            <Label htmlFor="color-red">Red</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="blue" id="color-blue" />
            <Label htmlFor="color-blue">Blue</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="green" id="color-green" />
            <Label htmlFor="color-green">Green</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yellow" id="color-yellow" />
            <Label htmlFor="color-yellow">Yellow</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-3">
        <Label>Alignment</Label>
        <RadioGroup defaultValue="left" className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="left" id="align-left" />
            <Label htmlFor="align-left">Left</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="center" id="align-center" />
            <Label htmlFor="align-center">Center</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="right" id="align-right" />
            <Label htmlFor="align-right">Right</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio groups arranged horizontally for compact layouts.',
      },
    },
  },
};

/**
 * Story 5: Interactive Examples
 * Controlled radio groups with state management
 */
export const InteractiveExamples: Story = {
  render: () => {
    const [shippingMethod, setShippingMethod] = useState('standard');
    const [paymentMethod, setPaymentMethod] = useState('credit-card');
    
    const shippingCosts = {
      standard: 5.99,
      express: 14.99,
      overnight: 29.99,
    };
    
    const subtotal = 99.99;
    const shipping = shippingCosts[shippingMethod as keyof typeof shippingCosts] || 0;
    const total = subtotal + shipping;
    
    return (
      <div className="space-y-6 w-[500px]">
        <div className="space-y-4">
          <Label className="text-base font-semibold">Shipping Method</Label>
          <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="standard" id="ship-standard" />
                <div>
                  <Label htmlFor="ship-standard">Standard Shipping</Label>
                  <p className="text-sm text-muted-foreground">5-7 business days</p>
                </div>
              </div>
              <span className="font-medium">$5.99</span>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="express" id="ship-express" />
                <div>
                  <Label htmlFor="ship-express">Express Shipping</Label>
                  <p className="text-sm text-muted-foreground">2-3 business days</p>
                </div>
              </div>
              <span className="font-medium">$14.99</span>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="overnight" id="ship-overnight" />
                <div>
                  <Label htmlFor="ship-overnight">Overnight Shipping</Label>
                  <p className="text-sm text-muted-foreground">Next business day</p>
                </div>
              </div>
              <span className="font-medium">$29.99</span>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-4">
          <Label className="text-base font-semibold">Payment Method</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-3 rounded-lg border p-3">
              <RadioGroupItem value="credit-card" id="pay-card" />
              <Label htmlFor="pay-card">Credit Card</Label>
            </div>
            
            <div className="flex items-center space-x-3 rounded-lg border p-3">
              <RadioGroupItem value="paypal" id="pay-paypal" />
              <Label htmlFor="pay-paypal">PayPal</Label>
            </div>
            
            <div className="flex items-center space-x-3 rounded-lg border p-3">
              <RadioGroupItem value="bank-transfer" id="pay-bank" />
              <Label htmlFor="pay-bank">Bank Transfer</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <p className="font-semibold">Order Summary</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping ({shippingMethod}):</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            Payment via: {paymentMethod.replace('-', ' ')}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled radio groups with real-time calculations and feedback.',
      },
    },
  },
};

/**
 * Story 6: Real-World Examples
 * Common radio group patterns in production applications
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8 w-[600px]">
      {/* Survey Question */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Customer Satisfaction Survey</h3>
        <p className="text-sm text-muted-foreground">
          How satisfied are you with our service?
        </p>
        <RadioGroup defaultValue="satisfied">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="very-satisfied" id="survey-5" />
            <Label htmlFor="survey-5">Very Satisfied</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="satisfied" id="survey-4" />
            <Label htmlFor="survey-4">Satisfied</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="neutral" id="survey-3" />
            <Label htmlFor="survey-3">Neutral</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dissatisfied" id="survey-2" />
            <Label htmlFor="survey-2">Dissatisfied</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="very-dissatisfied" id="survey-1" />
            <Label htmlFor="survey-1">Very Dissatisfied</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Account Type Selection */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Choose Account Type</h3>
        <RadioGroup defaultValue="personal">
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <RadioGroupItem value="personal" id="type-personal" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="type-personal" className="font-medium">Personal</Label>
              <p className="text-sm text-muted-foreground">
                For individual use. Includes basic features and 10GB storage.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <RadioGroupItem value="business" id="type-business" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="type-business" className="font-medium">Business</Label>
              <p className="text-sm text-muted-foreground">
                For teams and organizations. Advanced features and 100GB storage.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <RadioGroupItem value="education" id="type-education" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="type-education" className="font-medium">Education</Label>
              <p className="text-sm text-muted-foreground">
                For students and educators. All features with unlimited storage.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>
      
      {/* Notification Preferences */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Email Frequency</h3>
        <p className="text-sm text-muted-foreground">
          How often would you like to receive updates?
        </p>
        <RadioGroup defaultValue="weekly">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="real-time" id="freq-realtime" />
            <Label htmlFor="freq-realtime">Real-time (as they happen)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="daily" id="freq-daily" />
            <Label htmlFor="freq-daily">Daily digest</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="weekly" id="freq-weekly" />
            <Label htmlFor="freq-weekly">Weekly summary</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="never" id="freq-never" />
            <Label htmlFor="freq-never">Never (opt-out)</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Delivery Time Slots */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Preferred Delivery Time</h3>
        <RadioGroup defaultValue="afternoon">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="morning" id="time-morning" />
              <div>
                <Label htmlFor="time-morning">Morning</Label>
                <p className="text-sm text-muted-foreground">8:00 AM - 12:00 PM</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">Available</span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="afternoon" id="time-afternoon" />
              <div>
                <Label htmlFor="time-afternoon">Afternoon</Label>
                <p className="text-sm text-muted-foreground">12:00 PM - 5:00 PM</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">Available</span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="evening" id="time-evening" disabled />
              <div>
                <Label htmlFor="time-evening" className="text-muted-foreground">Evening</Label>
                <p className="text-sm text-muted-foreground">5:00 PM - 9:00 PM</p>
              </div>
            </div>
            <span className="text-sm text-red-600 font-medium">Unavailable</span>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world radio group patterns: surveys, account selection, preferences, and scheduling.',
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
        <h2 className="text-2xl font-bold mb-4">Radio Group Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using radio buttons in your applications.
        </p>
      </div>
      
      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use for mutually exclusive options</p>
            <RadioGroup defaultValue="yes">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="do-1a" />
                <Label htmlFor="do-1a">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="do-1b" />
                <Label htmlFor="do-1b">No</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Only one option can be selected
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Always have one option selected</p>
            <RadioGroup defaultValue="option1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="do-2a" />
                <Label htmlFor="do-2a">Default option</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="do-2b" />
                <Label htmlFor="do-2b">Alternative</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Set a sensible default value
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use clear, concise labels</p>
            <RadioGroup defaultValue="small">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="do-3a" />
                <Label htmlFor="do-3a">Small</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="do-3b" />
                <Label htmlFor="do-3b">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="do-3c" />
                <Label htmlFor="do-3c">Large</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Add descriptions for complex choices</p>
            <RadioGroup defaultValue="standard">
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="standard" id="do-4a" className="mt-1" />
                <div>
                  <Label htmlFor="do-4a">Standard</Label>
                  <p className="text-sm text-muted-foreground">Best for most users</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
      
      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use for multiple selections</p>
            <RadioGroup>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="dont-1a" />
                <Label htmlFor="dont-1a">Option 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="dont-1b" />
                <Label htmlFor="dont-1b">Option 2</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Use checkboxes for multiple selections
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't have too many options</p>
            <RadioGroup>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="dont-2a" />
                  <Label htmlFor="dont-2a">Option 1</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  ...8 more options...
                </p>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Use a select dropdown for 7+ options
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use without default</p>
            <RadioGroup>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="dont-3a" />
                <Label htmlFor="dont-3a">Option A</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="dont-3b" />
                <Label htmlFor="dont-3b">Option B</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Always set a default value
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use for immediate actions</p>
            <RadioGroup>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="save" id="dont-4a" />
                <Label htmlFor="dont-4a">Save now</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Use buttons for actions
            </p>
          </div>
        </div>
      </div>
      
      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Radio Group</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

<RadioGroup defaultValue="option1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="r2" />
    <Label htmlFor="r2">Option 2</Label>
  </div>
</RadioGroup>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Controlled Radio Group</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`const [value, setValue] = useState('option1');

<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="r2" />
    <Label htmlFor="r2">Option 2</Label>
  </div>
</RadioGroup>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Horizontal Layout</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<RadioGroup defaultValue="option1" className="flex space-x-4">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="r2" />
    <Label htmlFor="r2">Option 2</Label>
  </div>
</RadioGroup>`}</code>
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
            <span>Built on Radix UI Radio Group primitive - fully accessible</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Arrow keys navigate between options in the group</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Space key selects the focused option</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Tab key moves focus to/from the radio group</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Screen readers announce selection state and group</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Always pair RadioGroupItem with Label using htmlFor/id</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Disabled state prevents interaction and is announced</span>
          </li>
        </ul>
      </div>
      
      {/* When to Use */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">When to Use Radio Group vs Other Components</h3>
        <div className="grid gap-4">
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-2">✓ Use Radio Group when:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• User must select exactly one option from 2-6 choices</li>
              <li>• All options should be visible at once</li>
              <li>• Options are mutually exclusive</li>
              <li>• Selection is part of a form (submit later)</li>
            </ul>
          </div>
          
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-2">Consider alternatives when:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 7+ options: Use Select dropdown to save space</li>
              <li>• Multiple selections needed: Use Checkbox group</li>
              <li>• Binary choice with immediate effect: Use Switch</li>
              <li>• Two options: Consider Button group or Toggle</li>
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
