/**
 * Select Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Select component
 * - All variants and states
 * - Single and multi-select patterns
 * - Grouped options
 * - Real-world usage examples
 * - Accessibility patterns
 * 
 * Architecture: Built on Radix UI Select primitive
 * - Fully accessible with keyboard navigation
 * - ARIA attributes out of the box
 * - Portal rendering for z-index management
 * - Scroll buttons for long lists
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select';
import { Label } from './label';
import { useState } from 'react';

const meta = {
  title: 'Design System/Atoms/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Select Component

A fully accessible dropdown select component built on Radix UI primitives.

## Features
- ✅ Full keyboard navigation (Arrow keys, Home, End, Type to search)
- ✅ ARIA attributes for screen readers
- ✅ Portal rendering for proper z-index layering
- ✅ Scroll indicators for long lists
- ✅ Grouped options support
- ✅ Disabled state for trigger and items
- ✅ Custom styling with Tailwind CSS
- ✅ Dark mode support
- ✅ Smooth animations

## Usage
\`\`\`tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
\`\`\`

## Accessibility
- Built on Radix UI Select primitive
- Follows WAI-ARIA Select Pattern
- Full keyboard support
- Screen reader announcements
- Focus management
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Select
 * Basic select with a few options
 */
export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
        <SelectItem value="mango">Mango</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default select with standard options.',
      },
    },
  },
};

/**
 * Story 2: With Label
 * Select with proper label for accessibility
 */
export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="framework">Framework</Label>
      <Select>
        <SelectTrigger id="framework" className="w-[280px]">
          <SelectValue placeholder="Select framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="react">React</SelectItem>
          <SelectItem value="vue">Vue</SelectItem>
          <SelectItem value="angular">Angular</SelectItem>
          <SelectItem value="svelte">Svelte</SelectItem>
          <SelectItem value="solid">SolidJS</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select with label for better accessibility and user experience.',
      },
    },
  },
};

/**
 * Story 3: Grouped Options
 * Select with grouped options using SelectGroup
 */
export const GroupedOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select technology" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Frontend</SelectLabel>
          <SelectItem value="react">React</SelectItem>
          <SelectItem value="vue">Vue</SelectItem>
          <SelectItem value="angular">Angular</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Backend</SelectLabel>
          <SelectItem value="node">Node.js</SelectItem>
          <SelectItem value="django">Django</SelectItem>
          <SelectItem value="rails">Ruby on Rails</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Database</SelectLabel>
          <SelectItem value="postgres">PostgreSQL</SelectItem>
          <SelectItem value="mongodb">MongoDB</SelectItem>
          <SelectItem value="redis">Redis</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Organize options into logical groups with labels.',
      },
    },
  },
};

/**
 * Story 4: Select States
 * Different states: default, disabled, with value
 */
export const States: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="default-state">Default State</Label>
        <Select>
          <SelectTrigger id="default-state">
            <SelectValue placeholder="Choose an option..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
            <SelectItem value="3">Option 3</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Ready for user interaction</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="with-value">With Selected Value</Label>
        <Select defaultValue="2">
          <SelectTrigger id="with-value">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
            <SelectItem value="3">Option 3</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Pre-selected value displayed</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="disabled-state">Disabled State</Label>
        <Select disabled>
          <SelectTrigger id="disabled-state" disabled>
            <SelectValue placeholder="Cannot interact" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Select is disabled</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="disabled-items">With Disabled Items</Label>
        <Select>
          <SelectTrigger id="disabled-items">
            <SelectValue placeholder="Some options disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Available Option</SelectItem>
            <SelectItem value="2" disabled>Disabled Option</SelectItem>
            <SelectItem value="3">Available Option</SelectItem>
            <SelectItem value="4" disabled>Disabled Option</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Individual items can be disabled</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All select states with visual and functional differences.',
      },
    },
  },
};

/**
 * Story 5: Long Lists with Scroll
 * Handling long option lists with scroll indicators
 */
export const LongLists: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="countries">Country</Label>
      <Select>
        <SelectTrigger id="countries" className="w-[280px]">
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="uk">United Kingdom</SelectItem>
          <SelectItem value="ca">Canada</SelectItem>
          <SelectItem value="au">Australia</SelectItem>
          <SelectItem value="de">Germany</SelectItem>
          <SelectItem value="fr">France</SelectItem>
          <SelectItem value="it">Italy</SelectItem>
          <SelectItem value="es">Spain</SelectItem>
          <SelectItem value="nl">Netherlands</SelectItem>
          <SelectItem value="be">Belgium</SelectItem>
          <SelectItem value="ch">Switzerland</SelectItem>
          <SelectItem value="at">Austria</SelectItem>
          <SelectItem value="se">Sweden</SelectItem>
          <SelectItem value="no">Norway</SelectItem>
          <SelectItem value="dk">Denmark</SelectItem>
          <SelectItem value="fi">Finland</SelectItem>
          <SelectItem value="pl">Poland</SelectItem>
          <SelectItem value="cz">Czech Republic</SelectItem>
          <SelectItem value="hu">Hungary</SelectItem>
          <SelectItem value="ro">Romania</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Scroll indicators appear automatically for long lists
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Long option lists automatically show scroll indicators.',
      },
    },
  },
};

/**
 * Story 6: Interactive Examples
 * Controlled selects with state management
 */
export const InteractiveExamples: Story = {
  render: () => {
    const [framework, setFramework] = useState('');
    const [language, setLanguage] = useState('');
    const [styling, setStyling] = useState('');
    
    const isStackComplete = framework && language && styling;
    
    return (
      <div className="space-y-6 w-[400px]">
        <div className="space-y-2">
          <Label htmlFor="framework-select">Frontend Framework</Label>
          <Select value={framework} onValueChange={setFramework}>
            <SelectTrigger id="framework-select">
              <SelectValue placeholder="Choose framework..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="angular">Angular</SelectItem>
              <SelectItem value="svelte">Svelte</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="language-select">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language-select">
              <SelectValue placeholder="Choose language..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="styling-select">Styling Solution</Label>
          <Select value={styling} onValueChange={setStyling}>
            <SelectTrigger id="styling-select">
              <SelectValue placeholder="Choose styling..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tailwind">Tailwind CSS</SelectItem>
              <SelectItem value="styled">Styled Components</SelectItem>
              <SelectItem value="css-modules">CSS Modules</SelectItem>
              <SelectItem value="emotion">Emotion</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="rounded-lg border p-4 space-y-2">
          <p className="font-medium">Your Tech Stack:</p>
          {isStackComplete ? (
            <div className="space-y-1 text-sm">
              <p>✓ Framework: <span className="font-mono">{framework}</span></p>
              <p>✓ Language: <span className="font-mono">{language}</span></p>
              <p>✓ Styling: <span className="font-mono">{styling}</span></p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select all options to see your stack
            </p>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled selects with state management and real-time feedback.',
      },
    },
  },
};

/**
 * Story 7: Real-World Examples
 * Common select patterns in production applications
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8 w-[500px]">
      {/* User Profile Settings */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Profile Settings</h3>
        
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select defaultValue="pst">
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>North America</SelectLabel>
                <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                <SelectItem value="cst">Central Time (CST)</SelectItem>
                <SelectItem value="est">Eastern Time (EST)</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Europe</SelectLabel>
                <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                <SelectItem value="cet">Central European Time (CET)</SelectItem>
                <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="language-pref">Language</Label>
          <Select defaultValue="en">
            <SelectTrigger id="language-pref">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Filter Projects</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority-filter">Priority</Label>
            <Select>
              <SelectTrigger id="priority-filter">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="assignee-filter">Assignee</Label>
          <Select>
            <SelectTrigger id="assignee-filter">
              <SelectValue placeholder="All team members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Members</SelectItem>
              <SelectItem value="me">Assigned to me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectGroup>
                <SelectLabel>Team Members</SelectLabel>
                <SelectItem value="alice">Alice Johnson</SelectItem>
                <SelectItem value="bob">Bob Smith</SelectItem>
                <SelectItem value="carol">Carol Williams</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Form with Cascading Selects */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Shipping Address</h3>
        
        <div className="space-y-2">
          <Label htmlFor="country-select">Country</Label>
          <Select defaultValue="us">
            <SelectTrigger id="country-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us">United States</SelectItem>
              <SelectItem value="ca">Canada</SelectItem>
              <SelectItem value="uk">United Kingdom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state-select">State / Province</Label>
          <Select>
            <SelectTrigger id="state-select">
              <SelectValue placeholder="Select state..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ca">California</SelectItem>
              <SelectItem value="ny">New York</SelectItem>
              <SelectItem value="tx">Texas</SelectItem>
              <SelectItem value="fl">Florida</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world select patterns: settings, filters, and forms.',
      },
    },
  },
};

/**
 * Story 8: Usage Guidelines
 * Best practices and common patterns
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Select Component Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using the Select component in your applications.
        </p>
      </div>
      
      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use clear placeholder text</p>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">Developer</SelectItem>
                <SelectItem value="designer">Designer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Placeholders guide users on what to select
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Group related options</p>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Vegetables</SelectLabel>
                  <SelectItem value="carrot">Carrot</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Groups improve scannability
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use labels for accessibility</p>
            <div className="space-y-2">
              <Label htmlFor="good-label">Priority</Label>
              <Select>
                <SelectTrigger id="good-label" className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Labels improve usability and accessibility
            </p>
          </div>
          
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Set appropriate width</p>
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="US" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Width should fit the longest option
            </p>
          </div>
        </div>
      </div>
      
      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use vague placeholders</p>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Option</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Be specific about what to select
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't make selects too narrow</p>
            <Select>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Choose..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Long Option Name</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Text gets truncated awkwardly
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't overuse long lists</p>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="100+ items..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Item 1</SelectItem>
                <SelectItem value="2">Item 2</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Consider search/autocomplete instead
            </p>
          </div>
          
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't forget helper text</p>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Complex choice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Option A</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Explain complex choices
            </p>
          </div>
        </div>
      </div>
      
      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Select</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select>
  <SelectTrigger className="w-[280px]">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Controlled Select with State</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`const [value, setValue] = useState('');

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>`}</code>
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Grouped Options</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Group 1</SelectLabel>
      <SelectItem value="1">Item 1</SelectItem>
      <SelectItem value="2">Item 2</SelectItem>
    </SelectGroup>
    <SelectGroup>
      <SelectLabel>Group 2</SelectLabel>
      <SelectItem value="3">Item 3</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`}</code>
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
            <span>Built on Radix UI - fully accessible out of the box</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Keyboard navigation: Arrow keys, Home, End, Type to search</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Always pair with Label component using htmlFor/id</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Portal rendering prevents z-index issues</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Screen readers announce selected values and state changes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Focus management handled automatically</span>
          </li>
        </ul>
      </div>
      
      {/* When to Use */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">When to Use Select vs Other Components</h3>
        <div className="grid gap-4">
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-2">✓ Use Select when:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• User needs to choose one option from 5-20 items</li>
              <li>• Options are well-known or predictable</li>
              <li>• Space is limited (dropdown saves screen space)</li>
              <li>• Single selection is required</li>
            </ul>
          </div>
          
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-2">Consider alternatives when:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 2-4 options: Use Radio buttons (visible options better UX)</li>
              <li>• 20+ options: Use Combobox with search/filtering</li>
              <li>• Multiple selections: Use Checkbox group or Multi-select</li>
              <li>• Binary choice: Use Switch or Toggle</li>
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
        story: 'Comprehensive guidelines with best practices, code examples, and accessibility requirements.',
      },
    },
  },
};
