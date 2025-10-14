/**
 * Badge Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Badge component
 * - Status indicators
 * - Labels and tags
 * - Notification counts
 * - Category markers
 * 
 * Architecture: Built with Class Variance Authority (CVA)
 * - Four variants: default, secondary, destructive, outline
 * - Flexible sizing and customization
 * - Semantic color usage
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';
import { Button } from './button';

const meta = {
  title: 'Design System/Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Badge Component

A versatile badge component for displaying labels, tags, and status indicators.

## Features
- ✅ Four semantic variants: default, secondary, destructive, outline
- ✅ Built with Class Variance Authority (CVA)
- ✅ Flexible and customizable
- ✅ Hover states
- ✅ Focus ring for accessibility

## Usage
\`\`\`tsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
\`\`\`

## Accessibility
- Proper color contrast ratios
- Focus ring for keyboard navigation
- Semantic HTML
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: All Variants
 * All available badge variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All badge variants: default (primary), secondary, destructive (red), and outline.',
      },
    },
  },
};

/**
 * Story 2: Status Indicators
 * Badges used as status indicators
 */
export const StatusIndicators: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">Order Status:</span>
        <Badge variant="secondary">Pending</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Payment Status:</span>
        <Badge>Processing</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Shipment Status:</span>
        <Badge>Shipped</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Error Status:</span>
        <Badge variant="destructive">Failed</Badge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges indicating various statuses in a workflow.',
      },
    },
  },
};

/**
 * Story 3: With Icons
 * Badges with emoji or icon indicators
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>✓ Verified</Badge>
      <Badge variant="secondary">⏳ Pending</Badge>
      <Badge variant="destructive">✗ Failed</Badge>
      <Badge variant="outline">ℹ Info</Badge>
      <Badge>⭐ Premium</Badge>
      <Badge variant="secondary">🔒 Private</Badge>
      <Badge>🆕 New</Badge>
      <Badge variant="destructive">🔥 Hot</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges enhanced with icons or emoji for better visual communication.',
      },
    },
  },
};

/**
 * Story 4: Notification Counts
 * Badges displaying numeric counts
 */
export const NotificationCounts: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline">
          Messages
          <Badge className="ml-2">3</Badge>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          Notifications
          <Badge variant="destructive" className="ml-2">12</Badge>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          Tasks
          <Badge variant="secondary" className="ml-2">5</Badge>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          Updates
          <Badge variant="outline" className="ml-2">99+</Badge>
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges displaying counts on buttons - common for notifications and messaging.',
      },
    },
  },
};

/**
 * Story 5: Tags and Labels
 * Badges as category tags or labels
 */
export const TagsAndLabels: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Article tags */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Article Tags:</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">React</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">Design System</Badge>
          <Badge variant="secondary">UI/UX</Badge>
          <Badge variant="secondary">Frontend</Badge>
        </div>
      </div>

      {/* Product categories */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Product Categories:</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Electronics</Badge>
          <Badge variant="outline">Computers</Badge>
          <Badge variant="outline">Accessories</Badge>
        </div>
      </div>

      {/* Feature flags */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Feature Flags:</p>
        <div className="flex flex-wrap gap-2">
          <Badge>Enabled</Badge>
          <Badge>Beta</Badge>
          <Badge variant="secondary">Experimental</Badge>
          <Badge variant="destructive">Deprecated</Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Badges used as tags, labels, and category indicators.',
      },
    },
  },
};

/**
 * Story 6: Interactive Badges
 * Badges with interactive behavior
 */
export const InteractiveBadges: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Clickable filter badges */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Filter Tags (clickable):</p>
        <div className="flex flex-wrap gap-2">
          <Badge className="cursor-pointer hover:opacity-80">JavaScript</Badge>
          <Badge className="cursor-pointer hover:opacity-80">Python</Badge>
          <Badge className="cursor-pointer hover:opacity-80">Go</Badge>
          <Badge className="cursor-pointer hover:opacity-80">Rust</Badge>
        </div>
      </div>

      {/* Removable badges */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Selected Tags (removable):</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="cursor-pointer">
            React ✕
          </Badge>
          <Badge variant="secondary" className="cursor-pointer">
            TypeScript ✕
          </Badge>
          <Badge variant="secondary" className="cursor-pointer">
            Tailwind ✕
          </Badge>
        </div>
      </div>

      {/* Badges on cards */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Card Badge:</p>
        <div className="border rounded-lg p-4 max-w-sm">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold">Project Alpha</h3>
            <Badge>Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            A revolutionary new project in development.
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Interactive badges for filters, selections, and card decorations.',
      },
    },
  },
};

/**
 * Story 7: Real-World Examples
 * Common badge patterns in production apps
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-6">
      {/* GitHub-style issue badges */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Issue Tracker:</p>
        <div className="border rounded-lg divide-y">
          <div className="p-3 flex items-center gap-3">
            <Badge>Open</Badge>
            <span className="text-sm">Login page not responsive</span>
            <div className="ml-auto flex gap-1">
              <Badge variant="outline">bug</Badge>
              <Badge variant="outline">high-priority</Badge>
            </div>
          </div>
          <div className="p-3 flex items-center gap-3">
            <Badge variant="secondary">Closed</Badge>
            <span className="text-sm">Add dark mode support</span>
            <div className="ml-auto flex gap-1">
              <Badge variant="outline">enhancement</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* E-commerce product badges */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Product Listing:</p>
        <div className="border rounded-lg p-4 max-w-md">
          <div className="flex gap-2 mb-2">
            <Badge variant="destructive">Sale</Badge>
            <Badge>🆕 New</Badge>
            <Badge variant="secondary">Limited Stock</Badge>
          </div>
          <h3 className="font-semibold mb-1">Premium Headphones</h3>
          <p className="text-sm text-muted-foreground mb-2">
            High-quality wireless headphones with noise cancellation
          </p>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">$149.99</span>
            <span className="text-sm text-muted-foreground line-through">$199.99</span>
          </div>
        </div>
      </div>

      {/* User profile badges */}
      <div className="space-y-2">
        <p className="text-sm font-medium">User Profile:</p>
        <div className="border rounded-lg p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Sarah Johnson</h3>
                <Badge>✓ Verified</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Product Designer</p>
              <div className="flex gap-1 mt-2">
                <Badge variant="secondary">Pro</Badge>
                <Badge variant="outline">Team Lead</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status dashboard */}
      <div className="space-y-2">
        <p className="text-sm font-medium">System Status:</p>
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">API Server</span>
            <Badge>✓ Operational</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Database</span>
            <Badge>✓ Operational</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">File Storage</span>
            <Badge variant="secondary">⚠ Degraded</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Email Service</span>
            <Badge variant="destructive">✗ Down</Badge>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Production patterns: issue tracking, e-commerce, user profiles, and status dashboards.',
      },
    },
  },
};

/**
 * Story 8: Usage Guidelines
 * Best practices for using badges
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Badge Component Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using badges in your applications.
        </p>
      </div>

      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use for status</p>
            <Badge>Active</Badge>
            <p className="text-sm text-muted-foreground">
              Clear status indicators
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Keep text short</p>
            <Badge>New</Badge>
            <p className="text-sm text-muted-foreground">
              1-2 words maximum
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use semantic colors</p>
            <Badge variant="destructive">Error</Badge>
            <p className="text-sm text-muted-foreground">
              Red for errors, warnings
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Add icons for clarity</p>
            <Badge>✓ Verified</Badge>
            <p className="text-sm text-muted-foreground">
              Visual reinforcement
            </p>
          </div>
        </div>
      </div>

      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use long text</p>
            <p className="text-sm text-muted-foreground">
              Badges aren't for sentences - keep it 1-2 words
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't overuse</p>
            <p className="text-sm text-muted-foreground">
              Too many badges create visual clutter
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use for buttons</p>
            <p className="text-sm text-muted-foreground">
              Use Button component for actions
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't misuse colors</p>
            <p className="text-sm text-muted-foreground">
              Red should indicate errors, not preferences
            </p>
          </div>
        </div>
      </div>

      {/* Variant Guide */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Variant Selection Guide</h3>
        <div className="border rounded-lg divide-y">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Default (Primary)</p>
              <p className="text-sm text-muted-foreground">Use for primary status, active states</p>
            </div>
            <Badge>Active</Badge>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Secondary</p>
              <p className="text-sm text-muted-foreground">Use for neutral states, categories, tags</p>
            </div>
            <Badge variant="secondary">Category</Badge>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Destructive</p>
              <p className="text-sm text-muted-foreground">Use for errors, failures, urgent warnings</p>
            </div>
            <Badge variant="destructive">Error</Badge>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Outline</p>
              <p className="text-sm text-muted-foreground">Use for subtle labels, non-critical info</p>
            </div>
            <Badge variant="outline">Info</Badge>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Badge</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">With Icon</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<Badge>✓ Verified</Badge>
<Badge variant="destructive">✗ Failed</Badge>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">On Button</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<Button>
  Messages
  <Badge className="ml-2">3</Badge>
</Button>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Custom Styling</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<Badge className="cursor-pointer hover:opacity-80">
  Clickable
</Badge>`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Accessibility Notes</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Use proper color contrast (WCAG AA compliant)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Text should be readable at small size</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Don't rely on color alone - use icons or text</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>If clickable, ensure focus ring is visible</span>
          </li>
        </ul>
      </div>

      {/* When to Use */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">When to Use</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Status Indicators</p>
              <p className="text-muted-foreground">
                Show active/inactive, online/offline, success/failure
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Notification Counts</p>
              <p className="text-muted-foreground">
                Display unread messages, pending tasks, alerts
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Labels and Tags</p>
              <p className="text-muted-foreground">
                Categorize content, filter items, show metadata
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Feature Highlights</p>
              <p className="text-muted-foreground">
                Mark items as "New", "Beta", "Sale", "Premium"
              </p>
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
        story: 'Comprehensive guidelines with best practices, variant selection, code examples, accessibility, and usage patterns.',
      },
    },
  },
};
