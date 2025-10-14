/**
 * Tabs Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Tabs component
 * - Navigation between content sections
 * - Settings panels with categories
 * - Product details with multiple views
 * - Keyboard navigation (arrow keys)
 * 
 * Architecture: Built on Radix UI Tabs primitive
 * - Keyboard navigation (Left/Right arrows)
 * - ARIA attributes for accessibility
 * - Focus management
 * - State-based styling
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';

const meta = {
  title: 'Design System/Molecules/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Tabs Component

A tabbed navigation component for organizing content into sections.

## Features
- ✅ Keyboard navigation - Left/Right arrow keys
- ✅ Built on Radix UI Tabs primitive
- ✅ ARIA attributes for accessibility
- ✅ Active state styling with shadow
- ✅ Focus ring for keyboard users
- ✅ Controlled and uncontrolled modes
- ✅ Smooth transitions

## Usage
\`\`\`tsx
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
\`\`\`

## Accessibility
- Left/Right arrow keys navigate between tabs
- Tab key moves to tab content
- Enter/Space activates tab
- ARIA roles and labels automatically applied
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Tabs
 * Basic tabs with simple content
 */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-muted-foreground">
          Make changes to your account here. Click save when you're done.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-muted-foreground">
          Change your password here. After saving, you'll be logged out.
        </p>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic tabs with two sections.',
      },
    },
  },
};

/**
 * Story 2: Multiple Tabs
 * Tabs with more than two options
 */
export const MultipleTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <h3 className="text-lg font-semibold">Overview Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          Welcome to your dashboard. Here's a quick overview of your account activity.
        </p>
      </TabsContent>
      <TabsContent value="analytics" className="space-y-4">
        <h3 className="text-lg font-semibold">Analytics</h3>
        <p className="text-sm text-muted-foreground">
          View detailed analytics and insights about your performance.
        </p>
      </TabsContent>
      <TabsContent value="reports" className="space-y-4">
        <h3 className="text-lg font-semibold">Reports</h3>
        <p className="text-sm text-muted-foreground">
          Generate and download custom reports for your records.
        </p>
      </TabsContent>
      <TabsContent value="notifications" className="space-y-4">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Manage your notification preferences and view recent alerts.
        </p>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with four sections for a dashboard layout.',
      },
    },
  },
};

/**
 * Story 3: Tabs with Badges
 * Tabs displaying notification counts
 */
export const TabsWithBadges: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">
          All
        </TabsTrigger>
        <TabsTrigger value="unread">
          Unread
          <Badge className="ml-2">3</Badge>
        </TabsTrigger>
        <TabsTrigger value="archived">
          Archived
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <div className="rounded-lg border p-4">
          <p className="text-sm">All messages will be displayed here.</p>
        </div>
      </TabsContent>
      <TabsContent value="unread">
        <div className="rounded-lg border p-4">
          <p className="text-sm">You have 3 unread messages.</p>
        </div>
      </TabsContent>
      <TabsContent value="archived">
        <div className="rounded-lg border p-4">
          <p className="text-sm">Your archived messages appear here.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with badge indicators showing counts.',
      },
    },
  },
};

/**
 * Story 4: Settings Panel
 * Tabs for organizing settings into categories
 */
export const SettingsPanel: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-full max-w-2xl">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4">
        <div className="rounded-lg border p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" defaultValue="@johndoe" />
          </div>
          <Button>Save Changes</Button>
        </div>
      </TabsContent>
      <TabsContent value="security" className="space-y-4">
        <div className="rounded-lg border p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Current Password</Label>
            <Input id="current" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">New Password</Label>
            <Input id="new" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" />
          </div>
          <Button>Update Password</Button>
        </div>
      </TabsContent>
      <TabsContent value="notifications" className="space-y-4">
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about your account activity
              </p>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your devices
              </p>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly summary of your activity
              </p>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Settings organized into categories with full-width tab list.',
      },
    },
  },
};

/**
 * Story 5: Product Details
 * Tabs for e-commerce product views
 */
export const ProductDetails: Story = {
  render: () => (
    <Tabs defaultValue="description" className="w-full">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="specifications">Specifications</TabsTrigger>
        <TabsTrigger value="reviews">Reviews (24)</TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="space-y-4">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">Product Description</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This premium wireless headphone offers exceptional sound quality with active noise cancellation.
            Perfect for both work and leisure, featuring a comfortable over-ear design that you can wear all day.
          </p>
          <p className="text-sm text-muted-foreground">
            With up to 30 hours of battery life and quick charge capability, you'll never miss a beat.
            The intuitive touch controls make it easy to manage your music and calls without reaching for your device.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="specifications" className="space-y-4">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Driver Size:</span>
              <span className="font-medium">40mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frequency Response:</span>
              <span className="font-medium">20Hz - 20kHz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impedance:</span>
              <span className="font-medium">32 Ohms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Battery Life:</span>
              <span className="font-medium">30 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Charging Time:</span>
              <span className="font-medium">2 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight:</span>
              <span className="font-medium">250g</span>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="reviews" className="space-y-4">
        <div className="rounded-lg border p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Sarah M.</span>
              <span className="text-yellow-500">★★★★★</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Amazing sound quality! The noise cancellation works perfectly on my daily commute.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Alex K.</span>
              <span className="text-yellow-500">★★★★☆</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Great headphones, very comfortable. Battery life is as advertised. Would recommend!
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'E-commerce product details with description, specifications, and reviews.',
      },
    },
  },
};

/**
 * Story 6: Disabled Tab
 * Tabs with disabled states
 */
export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="available" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="available">Available</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="locked" disabled>
          Locked 🔒
        </TabsTrigger>
      </TabsList>
      <TabsContent value="available">
        <div className="rounded-lg border p-4">
          <p className="text-sm">This content is available to view.</p>
        </div>
      </TabsContent>
      <TabsContent value="pending">
        <div className="rounded-lg border p-4">
          <p className="text-sm">This content is pending review.</p>
        </div>
      </TabsContent>
      <TabsContent value="locked">
        <div className="rounded-lg border p-4">
          <p className="text-sm">This content is locked.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with disabled state for restricted content.',
      },
    },
  },
};

/**
 * Story 7: Real-World Examples
 * Common tab patterns in production apps
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Code Editor-style tabs */}
      <div>
        <h3 className="text-sm font-medium mb-2">Code Editor Tabs</h3>
        <Tabs defaultValue="jsx" className="w-full">
          <TabsList>
            <TabsTrigger value="jsx">App.jsx</TabsTrigger>
            <TabsTrigger value="css">styles.css</TabsTrigger>
            <TabsTrigger value="config">config.json</TabsTrigger>
          </TabsList>
          <TabsContent value="jsx" className="rounded-lg border bg-muted p-4 font-mono text-sm">
            {`function App() {
  return <div>Hello World</div>;
}`}
          </TabsContent>
          <TabsContent value="css" className="rounded-lg border bg-muted p-4 font-mono text-sm">
            {`.container {
  padding: 20px;
  background: white;
}`}
          </TabsContent>
          <TabsContent value="config" className="rounded-lg border bg-muted p-4 font-mono text-sm">
            {`{
  "name": "my-app",
  "version": "1.0.0"
}`}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dashboard tabs */}
      <div>
        <h3 className="text-sm font-medium mb-2">Analytics Dashboard</h3>
        <Tabs defaultValue="today" className="w-full">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <div className="rounded-lg border p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Views</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Visitors</p>
                  <p className="text-2xl font-bold">856</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">42</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="week">
            <div className="rounded-lg border p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Views</p>
                  <p className="text-2xl font-bold">8,642</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Visitors</p>
                  <p className="text-2xl font-bold">5,234</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">312</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="month">
            <div className="rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Monthly analytics data...</p>
            </div>
          </TabsContent>
          <TabsContent value="year">
            <div className="rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Yearly analytics data...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User profile tabs */}
      <div>
        <h3 className="text-sm font-medium mb-2">User Profile</h3>
        <Tabs defaultValue="posts" className="w-full">
          <TabsList>
            <TabsTrigger value="posts">Posts (42)</TabsTrigger>
            <TabsTrigger value="media">Media (18)</TabsTrigger>
            <TabsTrigger value="likes">Likes (156)</TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            <div className="rounded-lg border divide-y">
              <div className="p-4">
                <p className="font-medium mb-1">First post title</p>
                <p className="text-sm text-muted-foreground">Posted 2 hours ago</p>
              </div>
              <div className="p-4">
                <p className="font-medium mb-1">Second post title</p>
                <p className="text-sm text-muted-foreground">Posted 5 hours ago</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="media">
            <div className="rounded-lg border p-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-muted rounded" />
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="likes">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Liked posts appear here...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Production patterns: code editor files, analytics dashboard, and user profiles.',
      },
    },
  },
};

/**
 * Story 8: Usage Guidelines
 * Best practices for using tabs
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Tabs Component Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using tabs in your applications.
        </p>
      </div>

      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use clear, short labels</p>
            <Tabs defaultValue="tab1" className="w-full">
              <TabsList>
                <TabsTrigger value="tab1">Overview</TabsTrigger>
                <TabsTrigger value="tab2">Settings</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground">
              One or two words per tab
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Organize related content</p>
            <p className="text-sm text-muted-foreground">
              Use tabs to group related information logically
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Keep count reasonable</p>
            <p className="text-sm text-muted-foreground">
              3-7 tabs is ideal. More than that, consider alternatives
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Show counts when relevant</p>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  <Badge className="ml-2 text-xs">3</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground">
              Badges for notifications or counts
            </p>
          </div>
        </div>
      </div>

      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use too many tabs</p>
            <p className="text-sm text-muted-foreground">
              8+ tabs becomes overwhelming. Use a different navigation pattern.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't nest tabs</p>
            <p className="text-sm text-muted-foreground">
              Tabs within tabs creates confusion. Redesign the information architecture.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use for sequential steps</p>
            <p className="text-sm text-muted-foreground">
              Use a stepper component for multi-step processes, not tabs.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use long labels</p>
            <p className="text-sm text-muted-foreground">
              Long labels make tabs hard to scan. Keep them concise.
            </p>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Tabs</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Full-Width Tabs (Grid Layout)</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  <TabsTrigger value="tab3">Tab 3</TabsTrigger>
</TabsList>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">With Badges</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<TabsTrigger value="unread">
  Unread
  <Badge className="ml-2">3</Badge>
</TabsTrigger>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Disabled Tab</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<TabsTrigger value="locked" disabled>
  Locked 🔒
</TabsTrigger>`}</code>
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
            <span>Left/Right arrow keys navigate between tabs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Tab key moves focus from tab list to content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Enter or Space activates focused tab</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Home/End keys jump to first/last tab</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>ARIA role="tablist" and role="tab" applied automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>aria-selected indicates active tab</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Focus ring visible for keyboard users</span>
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
              <p className="font-medium">Settings and Configuration</p>
              <p className="text-muted-foreground">
                Organize settings into logical categories (General, Security, Notifications)
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Product Details</p>
              <p className="text-muted-foreground">
                Separate description, specifications, and reviews
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Dashboard Views</p>
              <p className="text-muted-foreground">
                Switch between different time periods or data views
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">User Profile Sections</p>
              <p className="text-muted-foreground">
                Navigate between posts, media, activity, etc.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Patterns */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Consider Alternatives When:</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span><strong>Sequential process:</strong> Use a stepper/wizard component</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span><strong>Too many sections (8+):</strong> Use navigation menu or sidebar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span><strong>Brief content:</strong> Use accordion or collapsible sections</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span><strong>Comparison needed:</strong> Show content side-by-side instead</span>
          </li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive guidelines with best practices, code examples, accessibility, and usage patterns.',
      },
    },
  },
};
