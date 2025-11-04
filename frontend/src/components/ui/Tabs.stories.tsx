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

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

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
    <Tabs defaultValue='account' className='w-[400px]'>
      <TabsList>
        <TabsTrigger value='account'>Account</TabsTrigger>
        <TabsTrigger value='password'>Password</TabsTrigger>
      </TabsList>
      <TabsContent value='account'>
        <p className='text-sm text-muted-foreground'>
          Make changes to your account here. Click save when you're done.
        </p>
      </TabsContent>
      <TabsContent value='password'>
        <p className='text-sm text-muted-foreground'>
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
    <Tabs defaultValue='overview' className='w-full'>
      <TabsList>
        <TabsTrigger value='overview'>Overview</TabsTrigger>
        <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        <TabsTrigger value='reports'>Reports</TabsTrigger>
        <TabsTrigger value='notifications'>Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value='overview' className='space-y-4'>
        <h3 className='text-lg font-semibold'>Overview Dashboard</h3>
        <p className='text-sm text-muted-foreground'>
          Welcome to your dashboard. Here's a quick overview of your account activity.
        </p>
      </TabsContent>
      <TabsContent value='analytics' className='space-y-4'>
        <h3 className='text-lg font-semibold'>Analytics</h3>
        <p className='text-sm text-muted-foreground'>
          View detailed analytics and insights about your performance.
        </p>
      </TabsContent>
      <TabsContent value='reports' className='space-y-4'>
        <h3 className='text-lg font-semibold'>Reports</h3>
        <p className='text-sm text-muted-foreground'>
          Generate and download custom reports for your records.
        </p>
      </TabsContent>
      <TabsContent value='notifications' className='space-y-4'>
        <h3 className='text-lg font-semibold'>Notifications</h3>
        <p className='text-sm text-muted-foreground'>
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
    <Tabs defaultValue='all' className='w-full'>
      <TabsList>
        <TabsTrigger value='all'>All</TabsTrigger>
        <TabsTrigger value='unread'>
          Unread
          <Badge className='ml-2'>3</Badge>
        </TabsTrigger>
        <TabsTrigger value='archived'>Archived</TabsTrigger>
      </TabsList>
      <TabsContent value='all'>
        <div className='rounded-lg border p-4'>
          <p className='text-sm'>All messages will be displayed here.</p>
        </div>
      </TabsContent>
      <TabsContent value='unread'>
        <div className='rounded-lg border p-4'>
          <p className='text-sm'>You have 3 unread messages.</p>
        </div>
      </TabsContent>
      <TabsContent value='archived'>
        <div className='rounded-lg border p-4'>
          <p className='text-sm'>Your archived messages appear here.</p>
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
    <Tabs defaultValue='general' className='w-full max-w-2xl'>
      <TabsList className='grid w-full grid-cols-3'>
        <TabsTrigger value='general'>General</TabsTrigger>
        <TabsTrigger value='security'>Security</TabsTrigger>
        <TabsTrigger value='notifications'>Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value='general' className='space-y-4'>
        <div className='rounded-lg border p-4 space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Name</Label>
            <Input id='name' defaultValue='John Doe' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' type='email' defaultValue='john@example.com' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='username'>Username</Label>
            <Input id='username' defaultValue='@johndoe' />
          </div>
          <Button>Save Changes</Button>
        </div>
      </TabsContent>
      <TabsContent value='security' className='space-y-4'>
        <div className='rounded-lg border p-4 space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='current'>Current Password</Label>
            <Input id='current' type='password' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new'>New Password</Label>
            <Input id='new' type='password' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='confirm'>Confirm Password</Label>
            <Input id='confirm' type='password' />
          </div>
          <Button>Update Password</Button>
        </div>
      </TabsContent>
      <TabsContent value='notifications' className='space-y-4'>
        <div className='rounded-lg border p-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Email Notifications</Label>
              <p className='text-sm text-muted-foreground'>
                Receive emails about your account activity
              </p>
            </div>
            <Button variant='outline' size='sm'>
              Configure
            </Button>
          </div>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Push Notifications</Label>
              <p className='text-sm text-muted-foreground'>
                Receive push notifications on your devices
              </p>
            </div>
            <Button variant='outline' size='sm'>
              Configure
            </Button>
          </div>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Weekly Digest</Label>
              <p className='text-sm text-muted-foreground'>Get a weekly summary of your activity</p>
            </div>
            <Button variant='outline' size='sm'>
              Configure
            </Button>
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
    <Tabs defaultValue='description' className='w-full'>
      <TabsList>
        <TabsTrigger value='description'>Description</TabsTrigger>
        <TabsTrigger value='specifications'>Specifications</TabsTrigger>
        <TabsTrigger value='reviews'>Reviews (24)</TabsTrigger>
      </TabsList>
      <TabsContent value='description' className='space-y-4'>
        <div className='rounded-lg border p-6'>
          <h3 className='text-lg font-semibold mb-2'>Product Description</h3>
          <p className='text-sm text-muted-foreground mb-4'>
            This premium wireless headphone offers exceptional sound quality with active noise
            cancellation. Perfect for both work and leisure, featuring a comfortable over-ear design
            that you can wear all day.
          </p>
          <p className='text-sm text-muted-foreground'>
            With up to 30 hours of battery life and quick charge capability, you'll never miss a
            beat. The intuitive touch controls make it easy to manage your music and calls without
            reaching for your device.
          </p>
        </div>
      </TabsContent>
      <TabsContent value='specifications' className='space-y-4'>
        <div className='rounded-lg border p-6'>
          <h3 className='text-lg font-semibold mb-4'>Technical Specifications</h3>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Driver Size:</span>
              <span className='font-medium'>40mm</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Frequency Response:</span>
              <span className='font-medium'>20Hz - 20kHz</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Impedance:</span>
              <span className='font-medium'>32 Ohms</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Battery Life:</span>
              <span className='font-medium'>30 hours</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Charging Time:</span>
              <span className='font-medium'>2 hours</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Weight:</span>
              <span className='font-medium'>250g</span>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value='reviews' className='space-y-4'>
        <div className='rounded-lg border p-6 space-y-4'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <span className='font-semibold'>Sarah M.</span>
              <span className='text-yellow-500'>★★★★★</span>
            </div>
            <p className='text-sm text-muted-foreground'>
              Amazing sound quality! The noise cancellation works perfectly on my daily commute.
            </p>
          </div>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <span className='font-semibold'>Alex K.</span>
              <span className='text-yellow-500'>★★★★☆</span>
            </div>
            <p className='text-sm text-muted-foreground'>
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
    <Tabs defaultValue='available' className='w-[400px]'>
      <TabsList>
        <TabsTrigger value='available'>Available</TabsTrigger>
        <TabsTrigger value='pending'>Pending</TabsTrigger>
        <TabsTrigger value='locked' disabled>
          Locked 🔒
        </TabsTrigger>
      </TabsList>
      <TabsContent value='available'>
        <div className='rounded-lg border p-4'>
          <p className='text-sm'>This content is available to view.</p>
        </div>
      </TabsContent>
      <TabsContent value='pending'>
        <div className='rounded-lg border p-4'>
          <p className='text-sm'>This content is pending review.</p>
        </div>
      </TabsContent>
      <TabsContent value='locked'>
        <div className='rounded-lg border p-4'>
          <p className='text-sm'>This content is locked.</p>
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
    <div className='space-y-8'>
      {/* Code Editor-style tabs */}
      <div>
        <h3 className='text-sm font-medium mb-2'>Code Editor Tabs</h3>
        <Tabs defaultValue='jsx' className='w-full'>
          <TabsList>
            <TabsTrigger value='jsx'>App.jsx</TabsTrigger>
            <TabsTrigger value='css'>styles.css</TabsTrigger>
            <TabsTrigger value='config'>config.json</TabsTrigger>
          </TabsList>
          <TabsContent value='jsx' className='rounded-lg border bg-muted p-4 font-mono text-sm'>
            {`function App() {
  return <div>Hello World</div>;
}`}
          </TabsContent>
          <TabsContent value='css' className='rounded-lg border bg-muted p-4 font-mono text-sm'>
            {`.container {
  padding: 20px;
  background: white;
}`}
          </TabsContent>
          <TabsContent value='config' className='rounded-lg border bg-muted p-4 font-mono text-sm'>
            {`{
  "name": "my-app",
  "version": "1.0.0"
}`}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dashboard tabs */}
      <div>
        <h3 className='text-sm font-medium mb-2'>Analytics Dashboard</h3>
        <Tabs defaultValue='today' className='w-full'>
          <TabsList>
            <TabsTrigger value='today'>Today</TabsTrigger>
            <TabsTrigger value='week'>This Week</TabsTrigger>
            <TabsTrigger value='month'>This Month</TabsTrigger>
            <TabsTrigger value='year'>This Year</TabsTrigger>
          </TabsList>
          <TabsContent value='today'>
            <div className='rounded-lg border p-6'>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>Views</p>
                  <p className='text-2xl font-bold'>1,234</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>Visitors</p>
                  <p className='text-2xl font-bold'>856</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>Conversions</p>
                  <p className='text-2xl font-bold'>42</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value='week'>
            <div className='rounded-lg border p-6'>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>Views</p>
                  <p className='text-2xl font-bold'>8,642</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>Visitors</p>
                  <p className='text-2xl font-bold'>5,234</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>Conversions</p>
                  <p className='text-2xl font-bold'>312</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value='month'>
            <div className='rounded-lg border p-6'>
              <p className='text-sm text-muted-foreground'>Monthly analytics data...</p>
            </div>
          </TabsContent>
          <TabsContent value='year'>
            <div className='rounded-lg border p-6'>
              <p className='text-sm text-muted-foreground'>Yearly analytics data...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User profile tabs */}
      <div>
        <h3 className='text-sm font-medium mb-2'>User Profile</h3>
        <Tabs defaultValue='posts' className='w-full'>
          <TabsList>
            <TabsTrigger value='posts'>Posts (42)</TabsTrigger>
            <TabsTrigger value='media'>Media (18)</TabsTrigger>
            <TabsTrigger value='likes'>Likes (156)</TabsTrigger>
          </TabsList>
          <TabsContent value='posts'>
            <div className='rounded-lg border divide-y'>
              <div className='p-4'>
                <p className='font-medium mb-1'>First post title</p>
                <p className='text-sm text-muted-foreground'>Posted 2 hours ago</p>
              </div>
              <div className='p-4'>
                <p className='font-medium mb-1'>Second post title</p>
                <p className='text-sm text-muted-foreground'>Posted 5 hours ago</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value='media'>
            <div className='rounded-lg border p-4'>
              <div className='grid grid-cols-3 gap-2'>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className='aspect-square bg-muted rounded' />
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value='likes'>
            <div className='rounded-lg border p-4'>
              <p className='text-sm text-muted-foreground'>Liked posts appear here...</p>
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
    <div className='space-y-8 max-w-4xl'>
      <div>
        <h2 className='text-2xl font-bold mb-4'>Tabs Component Guidelines</h2>
        <p className='text-muted-foreground'>Best practices for using tabs in your applications.</p>
      </div>

      {/* DO's Section */}
      <div className='space-y-4'>
        <h3 className='text-xl font-semibold text-green-600'>✓ Do's</h3>

        <div className='grid grid-cols-2 gap-4'>
          <div className='rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2'>
            <p className='font-medium'>✓ Use clear, short labels</p>
            <Tabs defaultValue='tab1' className='w-full'>
              <TabsList>
                <TabsTrigger value='tab1'>Overview</TabsTrigger>
                <TabsTrigger value='tab2'>Settings</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className='text-sm text-muted-foreground'>One or two words per tab</p>
          </div>

          <div className='rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2'>
            <p className='font-medium'>✓ Organize related content</p>
            <p className='text-sm text-muted-foreground'>
              Use tabs to group related information logically
            </p>
          </div>

          <div className='rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2'>
            <p className='font-medium'>✓ Keep count reasonable</p>
            <p className='text-sm text-muted-foreground'>
              3-7 tabs is ideal. More than that, consider alternatives
            </p>
          </div>

          <div className='rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2'>
            <p className='font-medium'>✓ Show counts when relevant</p>
            <Tabs defaultValue='all' className='w-full'>
              <TabsList>
                <TabsTrigger value='all'>All</TabsTrigger>
                <TabsTrigger value='unread'>
                  Unread
                  <Badge className='ml-2 text-xs'>3</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className='text-sm text-muted-foreground'>Badges for notifications or counts</p>
          </div>
        </div>
      </div>

      {/* DON'T's Section */}
      <div className='space-y-4'>
        <h3 className='text-xl font-semibold text-red-600'>✗ Don'ts</h3>

        <div className='grid grid-cols-2 gap-4'>
          <div className='rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2'>
            <p className='font-medium'>✗ Don't use too many tabs</p>
            <p className='text-sm text-muted-foreground'>
              8+ tabs becomes overwhelming. Use a different navigation pattern.
            </p>
          </div>

          <div className='rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2'>
            <p className='font-medium'>✗ Don't nest tabs</p>
            <p className='text-sm text-muted-foreground'>
              Tabs within tabs creates confusion. Redesign the information architecture.
            </p>
          </div>

          <div className='rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2'>
            <p className='font-medium'>✗ Don't use for sequential steps</p>
            <p className='text-sm text-muted-foreground'>
              Use a stepper component for multi-step processes, not tabs.
            </p>
          </div>

          <div className='rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2'>
            <p className='font-medium'>✗ Don't use long labels</p>
            <p className='text-sm text-muted-foreground'>
              Long labels make tabs hard to scan. Keep them concise.
            </p>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className='space-y-4'>
        <h3 className='text-xl font-semibold'>Code Examples</h3>

        <div className='space-y-4'>
          <div>
            <h4 className='font-medium mb-2'>Basic Tabs</h4>
            <pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
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
            <h4 className='font-medium mb-2'>Full-Width Tabs (Grid Layout)</h4>
            <pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
              <code>{`<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  <TabsTrigger value="tab3">Tab 3</TabsTrigger>
</TabsList>`}</code>
            </pre>
          </div>

          <div>
            <h4 className='font-medium mb-2'>With Badges</h4>
            <pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
              <code>{`<TabsTrigger value="unread">
  Unread
  <Badge className="ml-2">3</Badge>
</TabsTrigger>`}</code>
            </pre>
          </div>

          <div>
            <h4 className='font-medium mb-2'>Disabled Tab</h4>
            <pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
              <code>{`<TabsTrigger value="locked" disabled>
  Locked 🔒
</TabsTrigger>`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className='space-y-4'>
        <h3 className='text-xl font-semibold'>Accessibility Checklist</h3>
        <ul className='space-y-2'>
          <li className='flex items-start gap-2'>
            <span className='text-green-600 font-bold'>✓</span>
            <span>Left/Right arrow keys navigate between tabs</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-green-600 font-bold'>✓</span>
            <span>Tab key moves focus from tab list to content</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-green-600 font-bold'>✓</span>
            <span>Enter or Space activates focused tab</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-green-600 font-bold'>✓</span>
            <span>Home/End keys jump to first/last tab</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-green-600 font-bold'>✓</span>
            <span>ARIA role="tablist" and role="tab" applied automatically</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-green-600 font-bold'>✓</span>
            <span>aria-selected indicates active tab</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-green-600 font-bold'>✓</span>
            <span>Focus ring visible for keyboard users</span>
          </li>
        </ul>
      </div>

      {/* When to Use */}
      <div className='space-y-4'>
        <h3 className='text-xl font-semibold'>When to Use</h3>
        <div className='space-y-3 text-sm'>
          <div className='flex items-start gap-2'>
            <span className='text-primary font-bold'>→</span>
            <div>
              <p className='font-medium'>Settings and Configuration</p>
              <p className='text-muted-foreground'>
                Organize settings into logical categories (General, Security, Notifications)
              </p>
            </div>
          </div>

          <div className='flex items-start gap-2'>
            <span className='text-primary font-bold'>→</span>
            <div>
              <p className='font-medium'>Product Details</p>
              <p className='text-muted-foreground'>
                Separate description, specifications, and reviews
              </p>
            </div>
          </div>

          <div className='flex items-start gap-2'>
            <span className='text-primary font-bold'>→</span>
            <div>
              <p className='font-medium'>Dashboard Views</p>
              <p className='text-muted-foreground'>
                Switch between different time periods or data views
              </p>
            </div>
          </div>

          <div className='flex items-start gap-2'>
            <span className='text-primary font-bold'>→</span>
            <div>
              <p className='font-medium'>User Profile Sections</p>
              <p className='text-muted-foreground'>Navigate between posts, media, activity, etc.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Patterns */}
      <div className='space-y-4'>
        <h3 className='text-xl font-semibold'>Consider Alternatives When:</h3>
        <ul className='space-y-2 text-sm'>
          <li className='flex items-start gap-2'>
            <span className='text-primary'>•</span>
            <span>
              <strong>Sequential process:</strong> Use a stepper/wizard component
            </span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-primary'>•</span>
            <span>
              <strong>Too many sections (8+):</strong> Use navigation menu or sidebar
            </span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-primary'>•</span>
            <span>
              <strong>Brief content:</strong> Use accordion or collapsible sections
            </span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-primary'>•</span>
            <span>
              <strong>Comparison needed:</strong> Show content side-by-side instead
            </span>
          </li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive guidelines with best practices, code examples, accessibility, and usage patterns.',
      },
    },
  },
};

/**
 * ## Story 9: Accessibility Test
 *
 * Interactive demonstration of keyboard navigation and accessibility features.
 * Tests WCAG 2.1 AAA compliance for tab navigation.
 */
export const AccessibilityTest: Story = {
  render: () => {
    const [keyLog, setKeyLog] = React.useState<string[]>([]);
    const [focusLog, setFocusLog] = React.useState<string[]>([]);

    const logKey = (key: string, tab: string) => {
      const entry = `${new Date().toLocaleTimeString()}: ${key} on ${tab}`;
      setKeyLog((prev) => [entry, ...prev].slice(0, 5));
    };

    const logFocus = (tab: string) => {
      const entry = `${new Date().toLocaleTimeString()}: Focused ${tab}`;
      setFocusLog((prev) => [entry, ...prev].slice(0, 5));
    };

    return (
      <div className='space-y-8 w-[700px]'>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Keyboard Navigation Test</h3>
          <p className='text-sm text-muted-foreground'>Try these keyboard shortcuts:</p>
          <ul className='text-sm space-y-1 list-disc list-inside text-muted-foreground'>
            <li>
              <kbd className='px-2 py-1 bg-muted rounded text-xs'>Tab</kbd> - Move focus to/from tab
              list
            </li>
            <li>
              <kbd className='px-2 py-1 bg-muted rounded text-xs'>←</kbd>{' '}
              <kbd className='px-2 py-1 bg-muted rounded text-xs'>→</kbd> - Navigate between tabs
            </li>
            <li>
              <kbd className='px-2 py-1 bg-muted rounded text-xs'>Home</kbd> /{' '}
              <kbd className='px-2 py-1 bg-muted rounded text-xs'>End</kbd> - First/Last tab
            </li>
            <li>
              <kbd className='px-2 py-1 bg-muted rounded text-xs'>Enter</kbd> /{' '}
              <kbd className='px-2 py-1 bg-muted rounded text-xs'>Space</kbd> - Activate focused tab
            </li>
          </ul>
        </div>

        <Tabs defaultValue='overview' className='w-full'>
          <TabsList>
            <TabsTrigger
              value='overview'
              onKeyDown={(e) => logKey(e.key, 'Overview')}
              onFocus={() => logFocus('Overview')}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value='features'
              onKeyDown={(e) => logKey(e.key, 'Features')}
              onFocus={() => logFocus('Features')}
            >
              Features
            </TabsTrigger>
            <TabsTrigger
              value='specs'
              onKeyDown={(e) => logKey(e.key, 'Specs')}
              onFocus={() => logFocus('Specs')}
            >
              Specifications
            </TabsTrigger>
            <TabsTrigger
              value='reviews'
              onKeyDown={(e) => logKey(e.key, 'Reviews')}
              onFocus={() => logFocus('Reviews')}
            >
              Reviews
            </TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            <h4 className='font-semibold'>Overview Content</h4>
            <p className='text-sm text-muted-foreground'>
              This is the overview tab. Use arrow keys to navigate to other tabs.
            </p>
          </TabsContent>
          <TabsContent value='features'>
            <h4 className='font-semibold'>Features Content</h4>
          </TabsContent>
          <TabsContent value='specs'>
            <h4 className='font-semibold'>Specifications Content</h4>
          </TabsContent>
          <TabsContent value='reviews'>
            <h4 className='font-semibold'>Reviews Content</h4>
          </TabsContent>
        </Tabs>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <h4 className='text-sm font-semibold mb-2'>Keyboard Events</h4>
            <div className='bg-muted p-3 rounded-lg h-32 overflow-y-auto'>
              {keyLog.length === 0 ? (
                <p className='text-xs text-muted-foreground'>No keyboard events yet...</p>
              ) : (
                <div className='space-y-1'>
                  {keyLog.map((log, i) => (
                    <p key={i} className='text-xs font-mono'>
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className='text-sm font-semibold mb-2'>Focus Events</h4>
            <div className='bg-muted p-3 rounded-lg h-32 overflow-y-auto'>
              {focusLog.length === 0 ? (
                <p className='text-xs text-muted-foreground'>No focus events yet...</p>
              ) : (
                <div className='space-y-1'>
                  {focusLog.map((log, i) => (
                    <p key={i} className='text-xs font-mono'>
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>WCAG 2.1 AAA Compliance Checklist</h3>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded'>
              <span className='text-green-600 font-bold'>✓</span>
              <div>
                <p className='font-medium'>Keyboard Navigation</p>
                <p className='text-xs text-muted-foreground'>Arrow keys, Tab, Home/End support</p>
              </div>
            </div>
            <div className='flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded'>
              <span className='text-green-600 font-bold'>✓</span>
              <div>
                <p className='font-medium'>Focus Management</p>
                <p className='text-xs text-muted-foreground'>Clear focus ring, logical flow</p>
              </div>
            </div>
            <div className='flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded'>
              <span className='text-green-600 font-bold'>✓</span>
              <div>
                <p className='font-medium'>ARIA Attributes</p>
                <p className='text-xs text-muted-foreground'>role=tablist, aria-selected</p>
              </div>
            </div>
            <div className='flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded'>
              <span className='text-green-600 font-bold'>✓</span>
              <div>
                <p className='font-medium'>Screen Reader Support</p>
                <p className='text-xs text-muted-foreground'>Proper announcements</p>
              </div>
            </div>
          </div>
        </div>

        <div className='p-4 bg-primary/5 border border-primary/20 rounded-lg'>
          <h4 className='font-semibold text-sm mb-2'>Testing Tools:</h4>
          <ul className='text-sm space-y-1 text-muted-foreground'>
            <li>
              • <strong>NVDA/JAWS:</strong> Windows screen readers
            </li>
            <li>
              • <strong>VoiceOver:</strong> macOS/iOS screen reader
            </li>
            <li>
              • <strong>axe DevTools:</strong> Browser extension for accessibility audits
            </li>
            <li>
              • <strong>WAVE:</strong> Web accessibility evaluation tool
            </li>
          </ul>
        </div>
      </div>
    );
  },
};

/**
 * ## Story 10: Edge Cases
 *
 * Demonstrates how tabs handle unusual or extreme situations.
 */
export const EdgeCases: Story = {
  render: () => (
    <div className='space-y-8 w-[700px]'>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Single Tab</h3>
        <p className='text-sm text-muted-foreground'>
          Edge case: Only one tab (still functional, but consider alternatives)
        </p>
        <Tabs defaultValue='only' className='w-full'>
          <TabsList>
            <TabsTrigger value='only'>Only Tab</TabsTrigger>
          </TabsList>
          <TabsContent value='only'>
            <p className='text-sm'>Content for the only tab available.</p>
          </TabsContent>
        </Tabs>
        <p className='text-xs text-muted-foreground'>
          ⚠️ Consider: If you only have one section, do you really need tabs?
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Very Long Tab Labels</h3>
        <p className='text-sm text-muted-foreground'>Edge case: Labels that are excessively long</p>
        <Tabs defaultValue='long1' className='w-full'>
          <TabsList>
            <TabsTrigger value='long1' className='max-w-[200px] truncate'>
              This Is An Extremely Long Tab Label That Should Be Avoided
            </TabsTrigger>
            <TabsTrigger value='long2'>Short</TabsTrigger>
          </TabsList>
          <TabsContent value='long1'>
            <p className='text-sm'>Content with long label (truncated with ellipsis)</p>
          </TabsContent>
          <TabsContent value='long2'>
            <p className='text-sm'>Content with short label</p>
          </TabsContent>
        </Tabs>
        <p className='text-xs text-muted-foreground'>
          💡 Solution: Apply `max-w-[...]` and `truncate` classes to prevent overflow
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Many Tabs (Overflow)</h3>
        <p className='text-sm text-muted-foreground'>
          Edge case: More tabs than fit in available space
        </p>
        <div className='overflow-x-auto'>
          <Tabs defaultValue='tab1' className='w-full'>
            <TabsList className='w-max'>
              <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
              <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
              <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
              <TabsTrigger value='tab4'>Tab 4</TabsTrigger>
              <TabsTrigger value='tab5'>Tab 5</TabsTrigger>
              <TabsTrigger value='tab6'>Tab 6</TabsTrigger>
              <TabsTrigger value='tab7'>Tab 7</TabsTrigger>
              <TabsTrigger value='tab8'>Tab 8</TabsTrigger>
              <TabsTrigger value='tab9'>Tab 9</TabsTrigger>
              <TabsTrigger value='tab10'>Tab 10</TabsTrigger>
            </TabsList>
            <TabsContent value='tab1'>Content 1</TabsContent>
            <TabsContent value='tab2'>Content 2</TabsContent>
            <TabsContent value='tab3'>Content 3</TabsContent>
            <TabsContent value='tab4'>Content 4</TabsContent>
            <TabsContent value='tab5'>Content 5</TabsContent>
            <TabsContent value='tab6'>Content 6</TabsContent>
            <TabsContent value='tab7'>Content 7</TabsContent>
            <TabsContent value='tab8'>Content 8</TabsContent>
            <TabsContent value='tab9'>Content 9</TabsContent>
            <TabsContent value='tab10'>Content 10</TabsContent>
          </Tabs>
        </div>
        <p className='text-xs text-muted-foreground'>
          💡 Solution: Wrap TabsList in `overflow-x-auto` container, or use alternative navigation
          (sidebar, dropdown)
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Mixed Disabled Tabs</h3>
        <p className='text-sm text-muted-foreground'>Edge case: Some tabs disabled, some enabled</p>
        <Tabs defaultValue='tab1' className='w-full'>
          <TabsList>
            <TabsTrigger value='tab1'>Available</TabsTrigger>
            <TabsTrigger value='tab2' disabled>
              Locked 🔒
            </TabsTrigger>
            <TabsTrigger value='tab3'>Available</TabsTrigger>
            <TabsTrigger value='tab4' disabled>
              Premium Only 💎
            </TabsTrigger>
            <TabsTrigger value='tab5'>Available</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>
            <p className='text-sm'>Accessible content</p>
          </TabsContent>
          <TabsContent value='tab3'>
            <p className='text-sm'>More accessible content</p>
          </TabsContent>
          <TabsContent value='tab5'>
            <p className='text-sm'>Even more accessible content</p>
          </TabsContent>
        </Tabs>
        <p className='text-xs text-muted-foreground'>
          💡 Consider: Show tooltips explaining why tabs are disabled
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Empty Tab Content</h3>
        <p className='text-sm text-muted-foreground'>Edge case: Tab with no content</p>
        <Tabs defaultValue='filled' className='w-full'>
          <TabsList>
            <TabsTrigger value='filled'>Has Content</TabsTrigger>
            <TabsTrigger value='empty'>Empty</TabsTrigger>
          </TabsList>
          <TabsContent value='filled'>
            <p className='text-sm'>This tab has content.</p>
          </TabsContent>
          <TabsContent value='empty' className='min-h-[100px] flex items-center justify-center'>
            <p className='text-sm text-muted-foreground'>No content available</p>
          </TabsContent>
        </Tabs>
        <p className='text-xs text-muted-foreground'>
          💡 Solution: Show helpful empty state with explanation or call-to-action
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Tabs with Icons and Badges</h3>
        <p className='text-sm text-muted-foreground'>
          Edge case: Complex tab labels with multiple elements
        </p>
        <Tabs defaultValue='all' className='w-full'>
          <TabsList>
            <TabsTrigger value='all'>All Items</TabsTrigger>
            <TabsTrigger value='active'>
              Active
              <Badge variant='default' className='ml-2 text-xs'>
                12
              </Badge>
            </TabsTrigger>
            <TabsTrigger value='pending'>
              Pending
              <Badge variant='secondary' className='ml-2 text-xs'>
                5
              </Badge>
            </TabsTrigger>
            <TabsTrigger value='urgent'>
              Urgent
              <Badge variant='destructive' className='ml-2 text-xs'>
                2
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value='all'>All items content</TabsContent>
          <TabsContent value='active'>Active items content</TabsContent>
          <TabsContent value='pending'>Pending items content</TabsContent>
          <TabsContent value='urgent'>Urgent items content</TabsContent>
        </Tabs>
        <p className='text-xs text-muted-foreground'>
          ✅ Works well: Badges for counts, icons for visual hierarchy
        </p>
      </div>

      <div className='p-4 bg-muted rounded-lg'>
        <h4 className='font-semibold text-sm mb-2'>Best Practices for Edge Cases:</h4>
        <ul className='text-sm space-y-1 text-muted-foreground'>
          <li>1. Limit tabs to 3-7 for optimal UX</li>
          <li>2. Use `truncate` class for long labels</li>
          <li>3. Wrap in `overflow-x-auto` for many tabs</li>
          <li>4. Provide tooltips for disabled tabs</li>
          <li>5. Show empty states for tabs without content</li>
          <li>6. Consider dropdown menu for 8+ tabs</li>
        </ul>
      </div>
    </div>
  ),
};

/**
 * ## Story 11: Responsive
 *
 * Demonstrates responsive behavior of tabs across different screen sizes.
 */
export const Responsive: Story = {
  render: () => (
    <div className='space-y-8'>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Mobile Layout (&lt; 640px)</h3>
        <p className='text-sm text-muted-foreground'>Full-width grid layout with stacked tabs</p>
        <div className='max-w-sm border border-dashed border-primary p-4 rounded-lg'>
          <Tabs defaultValue='account' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='account'>Account</TabsTrigger>
              <TabsTrigger value='password'>Password</TabsTrigger>
            </TabsList>
            <TabsContent value='account' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name-mobile'>Name</Label>
                <Input id='name-mobile' placeholder='Your name' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email-mobile'>Email</Label>
                <Input id='email-mobile' type='email' placeholder='your@email.com' />
              </div>
            </TabsContent>
            <TabsContent value='password' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='current-mobile'>Current Password</Label>
                <Input id='current-mobile' type='password' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='new-mobile'>New Password</Label>
                <Input id='new-mobile' type='password' />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <p className='text-xs text-muted-foreground'>
          💡 Use `grid w-full grid-cols-N` for equal-width tabs on mobile
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Tablet Layout (640px - 1024px)</h3>
        <p className='text-sm text-muted-foreground'>Horizontal tabs with adequate spacing</p>
        <div className='max-w-2xl border border-dashed border-primary p-4 rounded-lg'>
          <Tabs defaultValue='overview' className='w-full'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics'>Analytics</TabsTrigger>
              <TabsTrigger value='reports'>Reports</TabsTrigger>
              <TabsTrigger value='settings'>Settings</TabsTrigger>
            </TabsList>
            <TabsContent value='overview'>
              <div className='grid grid-cols-2 gap-4 mt-4'>
                <div className='p-4 bg-muted rounded-lg'>
                  <p className='text-sm font-medium'>Metric 1</p>
                  <p className='text-2xl font-bold'>1,234</p>
                </div>
                <div className='p-4 bg-muted rounded-lg'>
                  <p className='text-sm font-medium'>Metric 2</p>
                  <p className='text-2xl font-bold'>5,678</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value='analytics'>Analytics content...</TabsContent>
            <TabsContent value='reports'>Reports content...</TabsContent>
            <TabsContent value='settings'>Settings content...</TabsContent>
          </Tabs>
        </div>
        <p className='text-xs text-muted-foreground'>
          ✅ Horizontal layout works well with 4-6 tabs on tablet
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Desktop Layout (&gt; 1024px)</h3>
        <p className='text-sm text-muted-foreground'>Full horizontal layout with optional badges</p>
        <div className='border border-dashed border-primary p-4 rounded-lg'>
          <Tabs defaultValue='all' className='w-full'>
            <TabsList>
              <TabsTrigger value='all'>All Tasks</TabsTrigger>
              <TabsTrigger value='active'>
                Active
                <Badge className='ml-2 text-xs'>8</Badge>
              </TabsTrigger>
              <TabsTrigger value='completed'>
                Completed
                <Badge variant='secondary' className='ml-2 text-xs'>
                  24
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='archived'>Archived</TabsTrigger>
            </TabsList>
            <TabsContent value='all'>
              <div className='grid grid-cols-3 gap-4 mt-4'>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className='p-4 bg-muted rounded-lg'>
                    <p className='text-sm font-medium'>Task {i}</p>
                    <p className='text-xs text-muted-foreground mt-1'>Description for task {i}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value='active'>Active tasks...</TabsContent>
            <TabsContent value='completed'>Completed tasks...</TabsContent>
            <TabsContent value='archived'>Archived tasks...</TabsContent>
          </Tabs>
        </div>
        <p className='text-xs text-muted-foreground'>
          ✅ Desktop can display more complex content in tab panels
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Responsive Grid: 2 Tabs</h3>
        <p className='text-sm text-muted-foreground'>Two tabs scale from mobile to desktop</p>
        <Tabs defaultValue='light' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='light'>Light Mode</TabsTrigger>
            <TabsTrigger value='dark'>Dark Mode</TabsTrigger>
          </TabsList>
          <TabsContent value='light' className='p-4 bg-background border rounded-lg'>
            <p className='text-sm'>Light mode preview content</p>
          </TabsContent>
          <TabsContent value='dark' className='p-4 bg-background border rounded-lg'>
            <p className='text-sm'>Dark mode preview content</p>
          </TabsContent>
        </Tabs>
        <p className='text-xs text-muted-foreground'>
          💡 `grid-cols-2` ensures equal width on all screen sizes
        </p>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Responsive Grid: 3 Tabs</h3>
        <p className='text-sm text-muted-foreground'>Three tabs with equal distribution</p>
        <Tabs defaultValue='day' className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='day'>Day</TabsTrigger>
            <TabsTrigger value='week'>Week</TabsTrigger>
            <TabsTrigger value='month'>Month</TabsTrigger>
          </TabsList>
          <TabsContent value='day'>Day view content</TabsContent>
          <TabsContent value='week'>Week view content</TabsContent>
          <TabsContent value='month'>Month view content</TabsContent>
        </Tabs>
      </div>

      <div className='p-4 bg-muted rounded-lg'>
        <h4 className='font-semibold text-sm mb-2'>Responsive Best Practices:</h4>
        <ul className='text-sm space-y-1 text-muted-foreground'>
          <li>• Mobile: Use `grid-cols-2` or `grid-cols-3` for equal-width tabs</li>
          <li>• Tablet: Horizontal layout works well with 4-6 tabs</li>
          <li>• Desktop: Can accommodate 6-8 tabs with badges/icons</li>
          <li>• Consider stacking tab content vertically on mobile</li>
          <li>• Use `overflow-x-auto` wrapper for many tabs on small screens</li>
          <li>• Test touch targets (minimum 44×44px for mobile)</li>
        </ul>
      </div>
    </div>
  ),
};

/**
 * ## Story 12: Composition Patterns
 *
 * Reusable composition patterns for tabs in real-world applications.
 */
export const CompositionPatterns: Story = {
  render: () => {
    const [settingsTab, setSettingsTab] = React.useState('general');
    const [dashboardTab, setDashboardTab] = React.useState('overview');

    return (
      <div className='space-y-8'>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Pattern 1: Settings Panel</h3>
          <p className='text-sm text-muted-foreground'>Organize settings into logical categories</p>
          <Tabs value={settingsTab} onValueChange={setSettingsTab} className='w-full'>
            <TabsList>
              <TabsTrigger value='general'>General</TabsTrigger>
              <TabsTrigger value='security'>Security</TabsTrigger>
              <TabsTrigger value='notifications'>Notifications</TabsTrigger>
              <TabsTrigger value='billing'>Billing</TabsTrigger>
            </TabsList>
            <TabsContent value='general' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='username'>Username</Label>
                <Input id='username' placeholder='johndoe' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' type='email' placeholder='john@example.com' />
              </div>
              <Button>Save Changes</Button>
            </TabsContent>
            <TabsContent value='security' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='current-pwd'>Current Password</Label>
                <Input id='current-pwd' type='password' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='new-pwd'>New Password</Label>
                <Input id='new-pwd' type='password' />
              </div>
              <Button>Update Password</Button>
            </TabsContent>
            <TabsContent value='notifications' className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                Configure your notification preferences
              </p>
              <div className='space-y-2'>
                <Label>Email notifications</Label>
                <Input type='checkbox' className='w-4 h-4' />
              </div>
            </TabsContent>
            <TabsContent value='billing' className='space-y-4'>
              <p className='text-sm text-muted-foreground'>Manage your subscription and billing</p>
              <Button>Upgrade Plan</Button>
            </TabsContent>
          </Tabs>
          <p className='text-xs text-muted-foreground'>
            💡 Controlled state with `value` and `onValueChange` props
          </p>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Pattern 2: Dashboard Views</h3>
          <p className='text-sm text-muted-foreground'>
            Switch between different data visualizations
          </p>
          <Tabs value={dashboardTab} onValueChange={setDashboardTab} className='w-full'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics'>Analytics</TabsTrigger>
              <TabsTrigger value='reports'>Reports</TabsTrigger>
            </TabsList>
            <TabsContent value='overview'>
              <div className='grid grid-cols-3 gap-4'>
                <div className='p-4 bg-primary/10 rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Total Users</p>
                  <p className='text-3xl font-bold'>12,453</p>
                  <p className='text-xs text-green-600'>+12% from last month</p>
                </div>
                <div className='p-4 bg-primary/10 rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Revenue</p>
                  <p className='text-3xl font-bold'>$45,231</p>
                  <p className='text-xs text-green-600'>+8% from last month</p>
                </div>
                <div className='p-4 bg-primary/10 rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Orders</p>
                  <p className='text-3xl font-bold'>1,234</p>
                  <p className='text-xs text-red-600'>-3% from last month</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value='analytics'>
              <div className='p-8 bg-muted rounded-lg text-center'>
                <p className='text-sm text-muted-foreground'>
                  Analytics charts and graphs would go here
                </p>
              </div>
            </TabsContent>
            <TabsContent value='reports'>
              <div className='p-8 bg-muted rounded-lg text-center'>
                <p className='text-sm text-muted-foreground'>
                  Detailed reports and exports would go here
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Pattern 3: Product Details</h3>
          <p className='text-sm text-muted-foreground'>
            Organize product information into sections
          </p>
          <Tabs defaultValue='description' className='w-full'>
            <TabsList>
              <TabsTrigger value='description'>Description</TabsTrigger>
              <TabsTrigger value='specs'>Specifications</TabsTrigger>
              <TabsTrigger value='reviews'>
                Reviews
                <Badge className='ml-2 text-xs'>24</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value='description' className='space-y-2'>
              <p className='text-sm'>
                This is a high-quality product designed for maximum efficiency and user
                satisfaction. Perfect for both beginners and professionals.
              </p>
              <p className='text-sm text-muted-foreground'>
                Features include advanced functionality, durable materials, and excellent customer
                support.
              </p>
            </TabsContent>
            <TabsContent value='specs'>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between p-2 bg-muted rounded'>
                  <span className='font-medium'>Dimensions:</span>
                  <span>10 × 5 × 2 inches</span>
                </div>
                <div className='flex justify-between p-2 bg-muted rounded'>
                  <span className='font-medium'>Weight:</span>
                  <span>1.2 lbs</span>
                </div>
                <div className='flex justify-between p-2 bg-muted rounded'>
                  <span className='font-medium'>Material:</span>
                  <span>Premium aluminum</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value='reviews'>
              <div className='space-y-3'>
                <div className='p-3 bg-muted rounded-lg'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='font-medium text-sm'>Jane D.</span>
                    <span className='text-yellow-500'>★★★★★</span>
                  </div>
                  <p className='text-sm'>Excellent product! Highly recommend.</p>
                </div>
                <div className='p-3 bg-muted rounded-lg'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='font-medium text-sm'>John S.</span>
                    <span className='text-yellow-500'>★★★★☆</span>
                  </div>
                  <p className='text-sm'>Good quality, fast shipping.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Pattern 4: Filterable List</h3>
          <p className='text-sm text-muted-foreground'>Filter content by status or category</p>
          <Tabs defaultValue='all' className='w-full'>
            <TabsList>
              <TabsTrigger value='all'>
                All
                <Badge variant='secondary' className='ml-2 text-xs'>
                  15
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='active'>
                Active
                <Badge className='ml-2 text-xs'>8</Badge>
              </TabsTrigger>
              <TabsTrigger value='pending'>
                Pending
                <Badge variant='outline' className='ml-2 text-xs'>
                  5
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='completed'>
                Completed
                <Badge variant='secondary' className='ml-2 text-xs'>
                  2
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value='all'>
              <div className='space-y-2'>
                {['Task 1', 'Task 2', 'Task 3'].map((task) => (
                  <div
                    key={task}
                    className='p-3 bg-muted rounded-lg flex items-center justify-between'
                  >
                    <span className='text-sm'>{task}</span>
                    <Badge variant='outline' className='text-xs'>
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value='active'>Filtered to active tasks...</TabsContent>
            <TabsContent value='pending'>Filtered to pending tasks...</TabsContent>
            <TabsContent value='completed'>Filtered to completed tasks...</TabsContent>
          </Tabs>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Pattern 5: Time Period Selector</h3>
          <p className='text-sm text-muted-foreground'>View data across different time ranges</p>
          <Tabs defaultValue='7d' className='w-full'>
            <TabsList>
              <TabsTrigger value='24h'>24 Hours</TabsTrigger>
              <TabsTrigger value='7d'>7 Days</TabsTrigger>
              <TabsTrigger value='30d'>30 Days</TabsTrigger>
              <TabsTrigger value='90d'>90 Days</TabsTrigger>
              <TabsTrigger value='1y'>1 Year</TabsTrigger>
            </TabsList>
            <TabsContent value='24h'>
              <div className='p-6 bg-muted rounded-lg text-center'>
                <p className='text-sm text-muted-foreground'>Last 24 hours data</p>
              </div>
            </TabsContent>
            <TabsContent value='7d'>
              <div className='p-6 bg-muted rounded-lg text-center'>
                <p className='text-sm text-muted-foreground'>Last 7 days data</p>
              </div>
            </TabsContent>
            <TabsContent value='30d'>
              <div className='p-6 bg-muted rounded-lg text-center'>
                <p className='text-sm text-muted-foreground'>Last 30 days data</p>
              </div>
            </TabsContent>
            <TabsContent value='90d'>
              <div className='p-6 bg-muted rounded-lg text-center'>
                <p className='text-sm text-muted-foreground'>Last 90 days data</p>
              </div>
            </TabsContent>
            <TabsContent value='1y'>
              <div className='p-6 bg-muted rounded-lg text-center'>
                <p className='text-sm text-muted-foreground'>Last year data</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className='p-4 bg-muted rounded-lg'>
          <h4 className='font-semibold text-sm mb-2'>Composition Pattern Best Practices:</h4>
          <ul className='text-sm space-y-1 text-muted-foreground'>
            <li>• Use controlled state for complex interactions</li>
            <li>• Add badges to show counts or status</li>
            <li>• Group related settings or content logically</li>
            <li>• Consider using tabs for filtering large datasets</li>
            <li>• Time period selectors work well with horizontal tabs</li>
            <li>• Keep tab labels concise (1-2 words maximum)</li>
          </ul>
        </div>
      </div>
    );
  },
};
