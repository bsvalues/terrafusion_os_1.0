/**
 * Container Component Stories - TerraFusion Design System
 * Week 2, Day 1 - Layout Components Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Container component
 * - Page width constraints
 * - Responsive padding
 * - Breakpoint variants
 * - Nested container patterns
 * 
 * Architecture: Utility wrapper component
 * - Max-width constraints (sm, md, lg, xl, 2xl, full)
 * - Responsive horizontal padding
 * - Auto-centering with margins
 * - Flexible customization
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Container } from '../layout/container';

const meta = {
  title: 'Design System/Layout/Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Container Component

A responsive container component that constrains content width and provides consistent horizontal padding.

## Features
- ✅ Multiple max-width variants (sm, md, lg, xl, 2xl, full)
- ✅ Responsive padding that adapts to breakpoints
- ✅ Auto-centering with horizontal margins
- ✅ Flexible customization via className
- ✅ Semantic HTML (div wrapper)
- ✅ Full TypeScript support

## Usage
\`\`\`tsx
import { Container } from '@/components/layout/container';

<Container>
  <h1>Page Content</h1>
  <p>Content is automatically constrained and centered.</p>
</Container>
\`\`\`

## Max Width Variants
- \`sm\`: max-w-screen-sm (640px)
- \`md\`: max-w-screen-md (768px)
- \`lg\`: max-w-screen-lg (1024px)
- \`xl\`: max-w-screen-xl (1280px)
- \`2xl\`: max-w-screen-2xl (1536px)
- \`default\`: max-w-7xl (1280px) - recommended for most pages
- \`full\`: max-w-full (100%) - no width constraint

## Padding Variants
- \`none\`: No horizontal padding
- \`sm\`: px-4 (1rem) consistent across breakpoints
- \`default\`: px-4 md:px-6 lg:px-8 - responsive padding (recommended)
- \`lg\`: px-6 md:px-8 lg:px-12 - extra padding for spacious layouts
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', 'full', 'default'],
      description: 'Maximum width constraint',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'default', 'lg'],
      description: 'Horizontal padding amount',
    },
    center: {
      control: 'boolean',
      description: 'Whether to center the container with auto margins',
    },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Container
 * Standard container with default settings (max-w-7xl, responsive padding, centered)
 */
export const Default: Story = {
  render: () => (
    <div className="bg-muted min-h-screen py-8">
      <Container>
        <div className="bg-background border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Default Container</h2>
          <p className="text-muted-foreground mb-4">
            This is the default container with max-w-7xl (1280px) and responsive padding.
            It's centered on the page and provides consistent spacing across breakpoints.
          </p>
          <div className="bg-muted rounded p-4">
            <p className="text-sm">
              <strong>Max Width:</strong> 1280px (max-w-7xl)
            </p>
            <p className="text-sm">
              <strong>Padding:</strong> px-4 md:px-6 lg:px-8 (responsive)
            </p>
            <p className="text-sm">
              <strong>Centering:</strong> mx-auto (centered)
            </p>
          </div>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default container configuration with responsive padding and 1280px max-width.',
      },
    },
  },
};

/**
 * Story 2: Max Width Variants
 * All available max-width options displayed
 */
export const MaxWidthVariants: Story = {
  render: () => (
    <div className="bg-muted min-h-screen py-8 space-y-6">
      {/* Small */}
      <Container maxWidth="sm">
        <div className="bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Small (sm)</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">max-w-screen-sm (640px) - For narrow content like blog posts</p>
        </div>
      </Container>

      {/* Medium */}
      <Container maxWidth="md">
        <div className="bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-lg p-6">
          <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">Medium (md)</h3>
          <p className="text-sm text-green-700 dark:text-green-300">max-w-screen-md (768px) - For articles and single-column layouts</p>
        </div>
      </Container>

      {/* Large */}
      <Container maxWidth="lg">
        <div className="bg-yellow-100 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">Large (lg)</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">max-w-screen-lg (1024px) - For medium-complexity interfaces</p>
        </div>
      </Container>

      {/* Extra Large */}
      <Container maxWidth="xl">
        <div className="bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-700 rounded-lg p-6">
          <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-2">Extra Large (xl)</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">max-w-screen-xl (1280px) - For dashboards and data-rich pages</p>
        </div>
      </Container>

      {/* 2X Large */}
      <Container maxWidth="2xl">
        <div className="bg-pink-100 dark:bg-pink-950 border border-pink-300 dark:border-pink-700 rounded-lg p-6">
          <h3 className="font-bold text-pink-900 dark:text-pink-100 mb-2">2X Large (2xl)</h3>
          <p className="text-sm text-pink-700 dark:text-pink-300">max-w-screen-2xl (1536px) - For wide layouts on large screens</p>
        </div>
      </Container>

      {/* Default */}
      <Container maxWidth="default">
        <div className="bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-700 rounded-lg p-6">
          <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">Default</h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">max-w-7xl (1280px) - Recommended default for most pages</p>
        </div>
      </Container>

      {/* Full Width */}
      <Container maxWidth="full">
        <div className="bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg p-6">
          <h3 className="font-bold text-red-900 dark:text-red-100 mb-2">Full Width</h3>
          <p className="text-sm text-red-700 dark:text-red-300">max-w-full (100%) - Spans entire viewport width</p>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available max-width variants from sm (640px) to full width.',
      },
    },
  },
};

/**
 * Story 3: Padding Variants
 * Different padding options for various use cases
 */
export const PaddingVariants: Story = {
  render: () => (
    <div className="bg-muted min-h-screen py-8 space-y-6">
      {/* No Padding */}
      <Container padding="none">
        <div className="bg-background border rounded-lg p-6">
          <h3 className="font-bold mb-2">No Padding (none)</h3>
          <p className="text-sm text-muted-foreground">
            Container touches viewport edges. Useful when child content provides its own padding.
          </p>
          <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded p-2">
            <p className="text-xs text-destructive">⚠️ Content extends to edges on mobile</p>
          </div>
        </div>
      </Container>

      {/* Small Padding */}
      <Container padding="sm">
        <div className="bg-background border rounded-lg p-6">
          <h3 className="font-bold mb-2">Small Padding (sm)</h3>
          <p className="text-sm text-muted-foreground">
            Consistent px-4 (1rem) padding across all breakpoints. Good for minimal spacing.
          </p>
          <div className="mt-4 bg-primary/10 border border-primary/20 rounded p-2">
            <p className="text-xs text-primary">✓ Consistent 1rem padding on all screens</p>
          </div>
        </div>
      </Container>

      {/* Default Padding */}
      <Container padding="default">
        <div className="bg-background border rounded-lg p-6">
          <h3 className="font-bold mb-2">Default Padding (default)</h3>
          <p className="text-sm text-muted-foreground">
            Responsive padding: px-4 md:px-6 lg:px-8. Grows with viewport size (recommended).
          </p>
          <div className="mt-4 bg-primary/10 border border-primary/20 rounded p-2">
            <p className="text-xs text-primary">✓ Mobile: 1rem, Tablet: 1.5rem, Desktop: 2rem</p>
          </div>
        </div>
      </Container>

      {/* Large Padding */}
      <Container padding="lg">
        <div className="bg-background border rounded-lg p-6">
          <h3 className="font-bold mb-2">Large Padding (lg)</h3>
          <p className="text-sm text-muted-foreground">
            Extra padding: px-6 md:px-8 lg:px-12. For spacious, high-end layouts.
          </p>
          <div className="mt-4 bg-primary/10 border border-primary/20 rounded p-2">
            <p className="text-xs text-primary">✓ Mobile: 1.5rem, Tablet: 2rem, Desktop: 3rem</p>
          </div>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Four padding variants: none, sm, default (responsive), and lg.',
      },
    },
  },
};

/**
 * Story 4: Nested Containers
 * Demonstration of container nesting patterns
 */
export const NestedContainers: Story = {
  render: () => (
    <div className="bg-muted min-h-screen py-8">
      <Container maxWidth="2xl" className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg py-8">
        <h2 className="text-2xl font-bold mb-2 text-blue-900 dark:text-blue-100">Outer Container (2xl)</h2>
        <p className="text-muted-foreground mb-6">max-w-screen-2xl (1536px)</p>

        <Container maxWidth="lg" className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg py-6">
          <h3 className="text-xl font-bold mb-2 text-green-900 dark:text-green-100">Middle Container (lg)</h3>
          <p className="text-muted-foreground mb-4">max-w-screen-lg (1024px)</p>

          <Container maxWidth="md" className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg py-4">
            <h4 className="text-lg font-bold mb-2 text-yellow-900 dark:text-yellow-100">Inner Container (md)</h4>
            <p className="text-sm text-muted-foreground">max-w-screen-md (768px)</p>
            <p className="text-sm text-muted-foreground mt-2">
              Nested containers can create progressive width constraints for visual hierarchy.
            </p>
          </Container>
        </Container>

        <div className="mt-6 bg-background rounded-lg p-4">
          <p className="text-sm font-medium mb-2">✅ Best Practices for Nesting:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Use progressively smaller max-widths</li>
            <li>Avoid excessive nesting (2-3 levels max)</li>
            <li>Consider using padding instead of nested containers</li>
            <li>Nested containers work well for card-based layouts</li>
          </ul>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Nested container pattern showing progressive width constraints.',
      },
    },
  },
};

/**
 * Story 5: Full Width with Inner Containers
 * Full-width outer container with constrained inner content
 */
export const FullWidthWithInnerContainers: Story = {
  render: () => (
    <div className="bg-muted min-h-screen">
      {/* Full-width header */}
      <Container maxWidth="full" padding="none" className="bg-primary text-primary-foreground py-6">
        <Container maxWidth="default">
          <h1 className="text-3xl font-bold">Full-Width Header</h1>
          <p className="text-primary-foreground/80">Spans entire viewport with centered content</p>
        </Container>
      </Container>

      {/* Constrained content area */}
      <Container maxWidth="default" className="py-8">
        <div className="bg-background rounded-lg border p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Main Content Area</h2>
          <p className="text-muted-foreground mb-4">
            This pattern is common in modern web design: full-width colored sections with
            constrained content inside.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted rounded p-4">
              <h3 className="font-medium mb-2">Feature 1</h3>
              <p className="text-sm text-muted-foreground">Content stays within max-width</p>
            </div>
            <div className="bg-muted rounded p-4">
              <h3 className="font-medium mb-2">Feature 2</h3>
              <p className="text-sm text-muted-foreground">Consistent across sections</p>
            </div>
            <div className="bg-muted rounded p-4">
              <h3 className="font-medium mb-2">Feature 3</h3>
              <p className="text-sm text-muted-foreground">Professional appearance</p>
            </div>
          </div>
        </div>
      </Container>

      {/* Full-width footer */}
      <Container maxWidth="full" padding="none" className="bg-muted border-t py-6">
        <Container maxWidth="default">
          <p className="text-sm text-muted-foreground">© 2025 TerraFusion OS. All rights reserved.</p>
        </Container>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common pattern: full-width backgrounds with constrained content inside.',
      },
    },
  },
};

/**
 * Story 6: Real-World Page Layout
 * Complete page example using Container
 */
export const RealWorldPageLayout: Story = {
  render: () => (
    <div className="bg-background min-h-screen">
      {/* Navigation */}
      <Container maxWidth="full" padding="none" className="border-b bg-background">
        <Container maxWidth="default" className="py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">TerraFusion Dashboard</h1>
            <nav className="space-x-4">
              <a href="#" className="text-sm hover:underline">Dashboard</a>
              <a href="#" className="text-sm hover:underline">Projects</a>
              <a href="#" className="text-sm hover:underline">Settings</a>
            </nav>
          </div>
        </Container>
      </Container>

      {/* Hero Section */}
      <Container maxWidth="full" padding="none" className="bg-gradient-to-b from-primary/10 to-transparent py-12">
        <Container maxWidth="lg">
          <h2 className="text-4xl font-bold mb-4">Welcome Back, User</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Here's what's happening with your projects today.
          </p>
          <div className="flex gap-4">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90">
              New Project
            </button>
            <button className="border px-6 py-2 rounded-md hover:bg-accent">
              View All
            </button>
          </div>
        </Container>
      </Container>

      {/* Stats Section */}
      <Container maxWidth="default" className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Projects', value: '24' },
            { label: 'Active Tasks', value: '12' },
            { label: 'Completed', value: '156' },
            { label: 'Team Members', value: '8' },
          ].map((stat, i) => (
            <div key={i} className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              'Project Alpha updated by John Doe',
              'New task assigned to Marketing team',
              'Budget report generated for Q4',
              'Team meeting scheduled for tomorrow',
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 pb-3 border-b last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <p className="text-sm">{activity}</p>
                <span className="ml-auto text-xs text-muted-foreground">2h ago</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete dashboard page demonstrating Container usage in production.',
      },
    },
  },
};

/**
 * Story 7: Usage Guidelines
 * Best practices for using Container
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="bg-muted min-h-screen py-8">
      <Container maxWidth="lg">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Container Component Guidelines</h2>
            <p className="text-muted-foreground">
              Best practices for using containers in your layouts.
            </p>
          </div>

          {/* DO's Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
                <p className="font-medium text-green-900 dark:text-green-100 mb-2">✓ Use default maxWidth for most pages</p>
                <p className="text-sm text-muted-foreground">
                  max-w-7xl (1280px) provides excellent readability and works well on most screens
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
                <p className="font-medium text-green-900 dark:text-green-100 mb-2">✓ Use responsive padding</p>
                <p className="text-sm text-muted-foreground">
                  The default padding option adapts to screen size automatically
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
                <p className="font-medium text-green-900 dark:text-green-100 mb-2">✓ Combine with Grid/Stack</p>
                <p className="text-sm text-muted-foreground">
                  Container provides width constraint, Grid/Stack handle internal layout
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4">
                <p className="font-medium text-green-900 dark:text-green-100 mb-2">✓ Use full-width for backgrounds</p>
                <p className="text-sm text-muted-foreground">
                  Full-width container with nested default container for colored sections
                </p>
              </div>
            </div>
          </div>

          {/* DON'T's Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4">
                <p className="font-medium text-red-900 dark:text-red-100 mb-2">✗ Don't nest containers unnecessarily</p>
                <p className="text-sm text-muted-foreground">
                  Avoid more than 2-3 levels of nesting - use padding instead
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4">
                <p className="font-medium text-red-900 dark:text-red-100 mb-2">✗ Don't use padding="none" everywhere</p>
                <p className="text-sm text-muted-foreground">
                  Content needs breathing room - use none only for specific cases
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4">
                <p className="font-medium text-red-900 dark:text-red-100 mb-2">✗ Don't use sm/md for main content</p>
                <p className="text-sm text-muted-foreground">
                  Small containers are for specific use cases like blog posts
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4">
                <p className="font-medium text-red-900 dark:text-red-100 mb-2">✗ Don't forget mobile users</p>
                <p className="text-sm text-muted-foreground">
                  Always ensure content has adequate padding on small screens
                </p>
              </div>
            </div>
          </div>

          {/* Code Examples */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Code Examples</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Basic Page Layout</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import { Container } from '@/components/layout/container';

export default function Page() {
  return (
    <Container>
      <h1>Page Title</h1>
      <p>Content goes here</p>
    </Container>
  );
}`}</code>
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Full-Width Section with Constrained Content</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`<Container maxWidth="full" padding="none" className="bg-primary py-12">
  <Container maxWidth="default">
    <h2 className="text-3xl font-bold text-primary-foreground">
      Hero Section
    </h2>
  </Container>
</Container>`}</code>
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Custom Width and Padding</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`<Container maxWidth="lg" padding="lg">
  <article>
    <h1>Blog Post Title</h1>
    <p>Post content with generous spacing</p>
  </article>
</Container>`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Layout Best Practices</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <div>
                  <p className="font-medium">Choose the right max-width</p>
                  <p className="text-muted-foreground">
                    Default (1280px) for dashboards, md (768px) for articles, full for backgrounds
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <div>
                  <p className="font-medium">Use responsive padding</p>
                  <p className="text-muted-foreground">
                    Let padding grow with screen size for better UX across devices
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <div>
                  <p className="font-medium">Combine with other layout components</p>
                  <p className="text-muted-foreground">
                    Container handles width, Grid handles columns, Stack handles spacing
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                <div>
                  <p className="font-medium">Test on multiple screen sizes</p>
                  <p className="text-muted-foreground">
                    Verify your layout works from mobile (375px) to desktop (1920px+)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive guidelines with best practices and code examples.',
      },
    },
  },
};
