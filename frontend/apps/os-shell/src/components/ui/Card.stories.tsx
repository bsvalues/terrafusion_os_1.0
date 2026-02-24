import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

/**
 * The Card component is a versatile container for grouping related content.
 * It consists of multiple sub-components that work together to create structured layouts.
 *
 * ## Features
 * - Flexible composition with CardHeader, CardContent, CardFooter
 * - CardTitle and CardDescription for consistent typography
 * - Built-in shadow and border styling
 * - Fully responsive and accessible
 * - Can be used standalone or composed with other components
 *
 * ## Usage
 * ```tsx
 * import {
 *   Card,
 *   CardHeader,
 *   CardTitle,
 *   CardDescription,
 *   CardContent,
 *   CardFooter
 * } from '@/components/ui/card';
 *
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Content goes here</CardContent>
 *   <CardFooter>Footer content</CardFooter>
 * </Card>
 * ```
 *
 * ## Accessibility
 * - Semantic HTML structure
 * - Proper heading hierarchy with CardTitle
 * - Screen reader friendly
 * - Keyboard navigable when interactive
 */
const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible card component for grouping related content with optional header, content, and footer sections.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic card with all sections: header, content, and footer
 */
export const Default: Story = {
  render: () => (
    <Card
      style={{
        maxWidth: '400px',
      }}
    >
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>
          Card description goes here. This provides context about the card content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          This is the main content area of the card. You can place any content here including text,
          images, forms, or other components.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant='outline'>Cancel</Button>
        <Button
          style={{
            marginLeft: '8px',
          }}
        >
          Confirm
        </Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card with only content - minimal structure
 */
export const SimpleCard: Story = {
  render: () => (
    <Card
      style={{
        maxWidth: '400px',
        padding: '24px',
      }}
    >
      <p>Simple card with just content. No header or footer needed.</p>
    </Card>
  ),
};

/**
 * Card with header only - good for section titles
 */
export const WithHeaderOnly: Story = {
  render: () => (
    <Card
      style={{
        maxWidth: '400px',
      }}
    >
      <CardHeader>
        <CardTitle>Section Title</CardTitle>
        <CardDescription>This card only has a header section.</CardDescription>
      </CardHeader>
    </Card>
  ),
};

/**
 * Multiple cards in a grid layout - common pattern
 */
export const CardGrid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        padding: '24px',
        backgroundColor: '#0a0a0a',
        borderRadius: '12px',
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View your analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            12,543
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--gray-400)',
            }}
          >
            Total page views
          </p>
        </CardContent>
        <CardFooter>
          <Button variant='ghost' size='sm'>
            View Details
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Active users this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            2,847
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--gray-400)',
            }}
          >
            +12% from last month
          </p>
        </CardContent>
        <CardFooter>
          <Button variant='ghost' size='sm'>
            View Details
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Monthly revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            $45,231
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--gray-400)',
            }}
          >
            +8% from last month
          </p>
        </CardContent>
        <CardFooter>
          <Button variant='ghost' size='sm'>
            View Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

/**
 * Card with form - common use case
 */
export const CardWithForm: Story = {
  render: () => (
    <Card
      style={{
        maxWidth: '500px',
      }}
    >
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
        <CardDescription>Deploy your new project in one click.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex'>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Name
            </label>
            <input type='text' placeholder='Project name' className='w-full' />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Description
            </label>
            <textarea placeholder='Project description' rows={3} className='w-full' />
          </div>
        </div>
      </CardContent>
      <CardFooter
        style={{
          justifyContent: 'flex-end',
          gap: '12px',
        }}
      >
        <Button variant='ghost'>Cancel</Button>
        <Button>Create Project</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Interactive card - clickable/hoverable
 */
export const InteractiveCard: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '16px',
        padding: '24px',
        backgroundColor: '#0a0a0a',
        borderRadius: '12px',
      }}
    >
      <Card
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 153, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <CardHeader>
          <div className='flex items-center'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--tf-network-blue)'
              strokeWidth='2'
            >
              <rect x='3' y='3' width='18' height='18' rx='2' />
              <path d='M3 9h18M9 21V9' />
            </svg>
          </div>
          <CardTitle
            style={{
              fontSize: '18px',
            }}
          >
            Dashboard
          </CardTitle>
          <CardDescription>View your metrics and analytics</CardDescription>
        </CardHeader>
      </Card>

      <Card
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 153, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <CardHeader>
          <div className='flex items-center'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--tf-network-blue)'
              strokeWidth='2'
            >
              <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
            </svg>
          </div>
          <CardTitle
            style={{
              fontSize: '18px',
            }}
          >
            Billing
          </CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
      </Card>

      <Card
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 153, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <CardHeader>
          <div className='flex items-center'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--tf-network-blue)'
              strokeWidth='2'
            >
              <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
              <circle cx='12' cy='12' r='3' />
            </svg>
          </div>
          <CardTitle
            style={{
              fontSize: '18px',
            }}
          >
            Settings
          </CardTitle>
          <CardDescription>Configure your preferences</CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
};

/**
 * Real-world example - user profile card
 */
export const RealWorldExample: Story = {
  render: () => (
    <div className='flex'>
      {/* Profile Card */}
      <Card
        style={{
          width: '350px',
        }}
      >
        <CardHeader>
          <div className='flex items-center'>
            <div className='flex items-center'>JD</div>
            <div>
              <CardTitle
                style={{
                  fontSize: '20px',
                  marginBottom: '4px',
                }}
              >
                John Doe
              </CardTitle>
              <CardDescription>Software Engineer</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex'>
            <div className='flex justify-between'>
              <span
                style={{
                  color: 'var(--gray-400)',
                }}
              >
                Email:
              </span>
              <span>john.doe@example.com</span>
            </div>
            <div className='flex justify-between'>
              <span
                style={{
                  color: 'var(--gray-400)',
                }}
              >
                Location:
              </span>
              <span>San Francisco, CA</span>
            </div>
            <div className='flex justify-between'>
              <span
                style={{
                  color: 'var(--gray-400)',
                }}
              >
                Member since:
              </span>
              <span>Jan 2024</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className='justify-between'>
          <Button variant='outline' size='sm'>
            Message
          </Button>
          <Button size='sm'>View Profile</Button>
        </CardFooter>
      </Card>

      {/* Stats Card */}
      <Card
        style={{
          width: '350px',
        }}
      >
        <CardHeader>
          <CardTitle>Project Statistics</CardTitle>
          <CardDescription>Overview of your recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div className='text-center'>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                }}
              >
                24
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--gray-400)',
                }}
              >
                Projects
              </div>
            </div>
            <div className='text-center'>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                }}
              >
                156
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--gray-400)',
                }}
              >
                Commits
              </div>
            </div>
            <div className='text-center'>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                }}
              >
                89
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--gray-400)',
                }}
              >
                Pull Requests
              </div>
            </div>
            <div className='text-center'>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                }}
              >
                12
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--gray-400)',
                }}
              >
                Issues
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

/**
 * Accessibility testing - WCAG 2.1 AAA compliance
 */
export const AccessibilityTest: Story = {
  render: () => {
    const [announcements, setAnnouncements] = React.useState<string[]>([]);

    const logAnnouncement = (message: string) => {
      setAnnouncements((prev) => [...prev.slice(-3), message]);
    };

    return (
      <div className='space-y-8 max-w-4xl'>
        <div>
          <h3 className='text-lg font-semibold mb-4'>Keyboard Navigation</h3>
          <p className='text-sm text-muted-foreground mb-4'>
            Interactive cards should be keyboard accessible. Test with Tab and Enter keys.
          </p>
          <div className='grid grid-cols-2 gap-4'>
            <Card
              tabIndex={0}
              role='article'
              aria-label='Product card for Premium Plan'
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  logAnnouncement('Premium Plan card activated');
                }
              }}
              onClick={() => logAnnouncement('Premium Plan clicked')}
              className='cursor-pointer hover:border-primary focus:ring-2 focus:ring-primary transition-all'
            >
              <CardHeader>
                <CardTitle>Premium Plan</CardTitle>
                <CardDescription>Full access to all features</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-3xl font-bold'>
                  $49<span className='text-sm'>/mo</span>
                </p>
              </CardContent>
              <CardFooter>
                <Button className='w-full'>Select Plan</Button>
              </CardFooter>
            </Card>

            <Card
              tabIndex={0}
              role='article'
              aria-label='Product card for Enterprise Plan'
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  logAnnouncement('Enterprise Plan card activated');
                }
              }}
              onClick={() => logAnnouncement('Enterprise Plan clicked')}
              className='cursor-pointer hover:border-primary focus:ring-2 focus:ring-primary transition-all'
            >
              <CardHeader>
                <CardTitle>Enterprise Plan</CardTitle>
                <CardDescription>Custom solutions for teams</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-3xl font-bold'>
                  $99<span className='text-sm'>/mo</span>
                </p>
              </CardContent>
              <CardFooter>
                <Button className='w-full'>Contact Sales</Button>
              </CardFooter>
            </Card>
          </div>

          {announcements.length > 0 && (
            <div className='mt-4 p-4 bg-muted rounded-lg'>
              <p className='text-sm font-medium mb-2'>Recent Interactions:</p>
              <ul className='space-y-1'>
                {announcements.map((msg, i) => (
                  <li key={i} className='text-sm text-muted-foreground'>
                    • {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <h3 className='text-lg font-semibold mb-4'>Semantic HTML Structure</h3>
          <Card role='article' aria-labelledby='card-title-1'>
            <CardHeader>
              <CardTitle id='card-title-1'>Article Title</CardTitle>
              <CardDescription>Published on Oct 13, 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Cards should use semantic HTML with proper ARIA attributes. This card uses
                role="article" and aria-labelledby to connect the title.
              </p>
            </CardContent>
            <CardFooter>
              <Button>Read More</Button>
            </CardFooter>
          </Card>
        </div>

        <div className='p-4 bg-blue-50 dark:bg-blue-950 rounded-lg'>
          <h4 className='font-semibold mb-2'>✅ WCAG 2.1 AAA Compliance Checklist</h4>
          <ul className='space-y-1 text-sm'>
            <li className='flex items-start gap-2'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>1.3.1 Info and Relationships:</strong> Semantic HTML with proper heading
                hierarchy
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>1.4.3 Contrast (Minimum):</strong> 4.5:1 text contrast ratio
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>2.1.1 Keyboard:</strong> Interactive cards accessible via Tab and Enter
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>2.4.3 Focus Order:</strong> Logical tab order through card elements
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>2.4.7 Focus Visible:</strong> Clear focus ring on interactive cards
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>2.5.5 Target Size:</strong> Buttons within cards meet 44×44px minimum
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-green-600'>✓</span>
              <span>
                <strong>4.1.2 Name, Role, Value:</strong> Proper ARIA labels and roles
              </span>
            </li>
          </ul>
        </div>
      </div>
    );
  },
};

/**
 * Edge cases and boundary conditions
 */
export const EdgeCases: Story = {
  render: () => (
    <div className='space-y-8 max-w-4xl'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Empty Content</h3>
        <Card>
          <CardHeader>
            <CardTitle>No Content</CardTitle>
            <CardDescription>Card with header but no content section</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Very Long Text</h3>
        <Card>
          <CardHeader>
            <CardTitle>
              This is an extremely long card title that might wrap to multiple lines and we need to
              ensure it still looks good and maintains proper spacing
            </CardTitle>
            <CardDescription>
              And here's an equally long description that goes on and on explaining various aspects
              of the card content in excessive detail to test text wrapping behavior and ensure the
              card layout remains stable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
              dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Minimal Content</h3>
        <Card>
          <CardContent className='py-4'>
            <p>Hi</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>No Padding Override</h3>
        <Card className='p-0 overflow-hidden'>
          <div className='h-32 bg-gradient-to-r from-purple-500 to-pink-500' />
          <div className='p-6'>
            <h3 className='font-bold text-lg'>Image Card</h3>
            <p className='text-sm text-muted-foreground'>Card with no padding, full-bleed image</p>
          </div>
        </Card>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Multiple Actions</h3>
        <Card>
          <CardHeader>
            <CardTitle>Actions Overflow</CardTitle>
            <CardDescription>Many buttons in footer</CardDescription>
          </CardHeader>
          <CardFooter className='flex-wrap gap-2'>
            <Button size='sm'>Action 1</Button>
            <Button size='sm' variant='outline'>
              Action 2
            </Button>
            <Button size='sm' variant='outline'>
              Action 3
            </Button>
            <Button size='sm' variant='outline'>
              Action 4
            </Button>
            <Button size='sm' variant='destructive'>
              Delete
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Nested Cards</h3>
        <Card>
          <CardHeader>
            <CardTitle>Parent Card</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Card>
              <CardContent className='py-4'>
                <p className='text-sm'>Nested card level 1</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='py-4'>
                <p className='text-sm'>Nested card level 1</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      <div className='p-4 bg-amber-50 dark:bg-amber-950 rounded-lg'>
        <h4 className='font-semibold mb-2'>🔧 Edge Case Handling Tips</h4>
        <ul className='text-sm space-y-1'>
          <li>
            • <strong>Empty content:</strong> Cards still maintain proper structure
          </li>
          <li>
            • <strong>Long text:</strong> Text wraps naturally, maintains readability
          </li>
          <li>
            • <strong>Minimal content:</strong> Card maintains minimum height
          </li>
          <li>
            • <strong>Full-bleed images:</strong> Use p-0 and overflow-hidden
          </li>
          <li>
            • <strong>Many actions:</strong> Use flex-wrap in footer
          </li>
          <li>
            • <strong>Nested cards:</strong> Use subtle borders to distinguish levels
          </li>
        </ul>
      </div>
    </div>
  ),
};

/**
 * Responsive behavior across breakpoints
 */
export const Responsive: Story = {
  render: () => (
    <div className='space-y-8'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Grid Layout (Responsive)</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Cards automatically stack on mobile, show 2 columns on tablet, 3 on desktop
        </p>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Card {i}</CardTitle>
                <CardDescription>Responsive card layout</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm'>This card adapts to different screen sizes automatically.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Horizontal on Desktop, Vertical on Mobile</h3>
        <Card>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='h-48 md:h-auto md:w-48 bg-gradient-to-br from-blue-500 to-purple-500 rounded-t-lg md:rounded-l-lg md:rounded-tr-none flex-shrink-0' />
            <div className='p-6 flex-1'>
              <h3 className='font-bold text-xl mb-2'>Responsive Card</h3>
              <p className='text-muted-foreground mb-4'>
                Image on top for mobile, on left for desktop. Flex direction changes at md
                breakpoint.
              </p>
              <Button>Learn More</Button>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Adaptive Content</h3>
        <Card>
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold'>10GB</div>
                <div className='text-xs text-muted-foreground'>Storage</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>50</div>
                <div className='text-xs text-muted-foreground'>Users</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>24/7</div>
                <div className='text-xs text-muted-foreground'>Support</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>∞</div>
                <div className='text-xs text-muted-foreground'>Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='p-4 bg-blue-50 dark:bg-blue-950 rounded-lg'>
        <h4 className='font-semibold mb-2'>📱 Responsive Design Patterns</h4>
        <ul className='text-sm space-y-1'>
          <li>
            • <strong>Grid layouts:</strong> Use grid-cols-1 md:grid-cols-2 lg:grid-cols-3
          </li>
          <li>
            • <strong>Image placement:</strong> Use flex-col md:flex-row to change layout
          </li>
          <li>
            • <strong>Content density:</strong> Show/hide details at different breakpoints
          </li>
          <li>
            • <strong>Touch targets:</strong> Ensure buttons are 44×44px minimum on mobile
          </li>
          <li>
            • <strong>Text size:</strong> Use responsive text classes (text-sm md:text-base)
          </li>
        </ul>
      </div>
    </div>
  ),
};

/**
 * Composition patterns and reusable card layouts
 */
export const CompositionPatterns: Story = {
  render: () => (
    <div className='space-y-8 max-w-6xl'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Product Card Pattern</h3>
        <div className='grid grid-cols-3 gap-4'>
          {[
            { name: 'Basic', price: 9, features: ['1 User', '10GB Storage', 'Email Support'] },
            {
              name: 'Pro',
              price: 29,
              features: ['5 Users', '100GB Storage', 'Priority Support', 'Advanced Features'],
            },
            {
              name: 'Enterprise',
              price: 99,
              features: [
                'Unlimited Users',
                '1TB Storage',
                '24/7 Phone Support',
                'Custom Integration',
              ],
            },
          ].map((plan) => (
            <Card key={plan.name} className='flex flex-col'>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className='text-3xl font-bold mt-4'>
                  ${plan.price}
                  <span className='text-sm font-normal text-muted-foreground'>/mo</span>
                </div>
              </CardHeader>
              <CardContent className='flex-1'>
                <ul className='space-y-2'>
                  {plan.features.map((feature) => (
                    <li key={feature} className='flex items-center gap-2 text-sm'>
                      <span className='text-green-600'>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className='w-full'>Choose Plan</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Article Card Pattern</h3>
        <div className='grid grid-cols-2 gap-4'>
          {[1, 2].map((i) => (
            <Card key={i} className='overflow-hidden'>
              <div className='h-48 bg-gradient-to-br from-orange-400 to-pink-500' />
              <CardHeader>
                <div className='flex items-center gap-2 text-sm text-muted-foreground mb-2'>
                  <span>Oct 13, 2025</span>
                  <span>•</span>
                  <span>5 min read</span>
                </div>
                <CardTitle>Article Title {i}</CardTitle>
                <CardDescription>
                  Brief description of the article content that gives readers an idea of what to
                  expect.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant='ghost'>Read More →</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Dashboard Widget Pattern</h3>
        <div className='grid grid-cols-4 gap-4'>
          {[
            { label: 'Total Users', value: '10,234', change: '+12%', positive: true },
            { label: 'Revenue', value: '$45.2K', change: '+8%', positive: true },
            { label: 'Bounce Rate', value: '42%', change: '-5%', positive: false },
            { label: 'Avg. Session', value: '3:24', change: '+2%', positive: true },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader className='pb-2'>
                <CardDescription className='text-xs'>{stat.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stat.value}</div>
                <p className={`text-sm mt-1 ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>List Item Card Pattern</h3>
        <div className='space-y-2'>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className='flex items-center gap-4 p-4'>
                <div className='h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold'>
                  {i}
                </div>
                <div className='flex-1'>
                  <h4 className='font-semibold'>List Item {i}</h4>
                  <p className='text-sm text-muted-foreground'>Supporting description text</p>
                </div>
                <Button variant='ghost' size='sm'>
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className='p-4 bg-green-50 dark:bg-green-950 rounded-lg'>
        <h4 className='font-semibold mb-2'>🎨 Composition Best Practices</h4>
        <ul className='text-sm space-y-1'>
          <li>
            • <strong>Product cards:</strong> Price prominent, features list, clear CTA
          </li>
          <li>
            • <strong>Article cards:</strong> Image first, metadata, brief description
          </li>
          <li>
            • <strong>Dashboard widgets:</strong> Key metric large, trend indicator
          </li>
          <li>
            • <strong>List items:</strong> Horizontal layout, avatar/icon, quick action
          </li>
          <li>
            • <strong>Consistency:</strong> Use same card pattern across similar content
          </li>
        </ul>
      </div>
    </div>
  ),
};

/**
 * Usage guidelines with Do's and Don'ts
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div
      style={{
        maxWidth: '900px',
        padding: '24px',
      }}
    >
      <h3 className='font-semibold'>Card Usage Guidelines</h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
        }}
      >
        {/* DO Section */}
        <div>
          <h4 className='font-semibold flex items-center'>
            <span
              style={{
                fontSize: '20px',
              }}
            >
              ✓
            </span>{' '}
            Do
          </h4>
          <ul className='flex'>
            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Use for grouping related content
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Cards are perfect for containing forms, user profiles, or statistics
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Keep consistent spacing
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Use consistent gaps between cards in grids (16px-24px recommended)
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Use CardHeader for titles
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                CardTitle and CardDescription provide consistent typography
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderLeft: '3px solid var(--tf-success-green)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Make interactive cards obvious
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Add hover states and cursor: pointer for clickable cards
              </p>
            </li>
          </ul>
        </div>

        {/* DON'T Section */}
        <div>
          <h4 className='font-semibold flex items-center'>
            <span
              style={{
                fontSize: '20px',
              }}
            >
              ✗
            </span>{' '}
            Don't
          </h4>
          <ul className='flex'>
            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Overuse cards
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Not every piece of content needs a card - avoid visual clutter
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Nest cards deeply
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Avoid cards within cards - it creates confusing hierarchy
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Make cards too wide
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Cards lose readability when wider than 600px - use max-width
              </p>
            </li>

            <li
              style={{
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid var(--tf-accent-error)',
                borderRadius: '6px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Skip semantic structure
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.9,
                  lineHeight: '1.5',
                }}
              >
                Always use CardHeader, CardContent, CardFooter for proper structure
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Code Examples */}
      <div
        style={{
          marginTop: '40px',
        }}
      >
        <h4 className='font-semibold'>Code Examples</h4>
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '20px',
            borderRadius: '8px',
            fontFamily: '"Fira Code", monospace',
            fontSize: '13px',
            overflow: 'auto',
            border: '1px solid #2a2a2a',
          }}
        >
          <pre
            style={{
              margin: 0,
              lineHeight: '1.6',
            }}
          >
            {`// Complete card structure
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Simple card
<Card className="p-6">
  <p>Simple content</p>
</Card>

// Interactive card with hover effect
<Card
  className="cursor-pointer transition-all hover:shadow-lg"
  onClick={() => handleClick()}
>
  <CardHeader>
    <CardTitle>Clickable Card</CardTitle>
  </CardHeader>
</Card>

// Card grid
<div className="grid grid-cols-3 gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>`}
          </pre>
        </div>
      </div>
    </div>
  ),
};
