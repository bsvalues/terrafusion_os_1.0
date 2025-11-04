/**
 * Stack Component Stories - TerraFusion Design System
 * Week 2, Day 1 - Layout Components Phase
 *
 * Purpose: Comprehensive documentation and testing of Stack component
 * - Vertical and horizontal stacking
 * - Spacing variants
 * - Alignment and justification
 * - Responsive direction changes
 * - Form layouts
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, StackItem } from '../layout/stack';

const meta = {
  title: 'Design System/Layout/Stack',
  component: Stack,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Stack Component

A flexible Flexbox wrapper for stacking elements with consistent spacing and alignment.

## Features
- ✅ Vertical and horizontal stacking
- ✅ 7 spacing options (none, xs, sm, md, lg, xl, 2xl)
- ✅ Responsive direction (vertical on mobile, horizontal on desktop)
- ✅ Alignment and justification controls
- ✅ Wrap support for multi-line layouts
- ✅ StackItem for individual item control (grow, shrink, basis)
- ✅ Full TypeScript support

## Usage
\`\`\`tsx
import { Stack, StackItem } from '@/components/layout/stack';

// Vertical stack (default)
<Stack spacing="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Stack>

// Horizontal stack
<Stack direction="horizontal" spacing="lg">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
  <Button>Action 3</Button>
</Stack>

// Responsive stack (vertical on mobile, horizontal on desktop)
<Stack direction={{ base: 'vertical', md: 'horizontal' }} spacing="md">
  <div>Content 1</div>
  <div>Content 2</div>
</Stack>

// Stack with growing item
<Stack direction="horizontal" spacing="md">
  <StackItem grow>
    <input placeholder="Flexible input" />
  </StackItem>
  <button>Submit</button>
</Stack>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Direction of the stack',
    },
    spacing: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Spacing between items',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
      description: 'Cross-axis alignment',
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
      description: 'Main-axis justification',
    },
    wrap: {
      control: 'boolean',
      description: 'Whether items should wrap to new lines',
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Vertical Stack
 * Default vertical stacking with different spacing options
 */
export const VerticalStack: Story = {
  render: () => (
    <div className='space-y-8'>
      {(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((spacing) => (
        <div key={spacing}>
          <h3 className='text-lg font-bold mb-4'>Vertical Stack - Spacing: {spacing}</h3>
          <Stack direction='vertical' spacing={spacing} className='max-w-md'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='bg-primary text-primary-foreground rounded-lg p-4'>
                Item {i}
              </div>
            ))}
          </Stack>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vertical stacking with all spacing variants from none to 2xl.',
      },
    },
  },
};

/**
 * Story 2: Horizontal Stack
 * Horizontal stacking with different spacing options
 */
export const HorizontalStack: Story = {
  render: () => (
    <div className='space-y-8'>
      {(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((spacing) => (
        <div key={spacing}>
          <h3 className='text-lg font-bold mb-4'>Horizontal Stack - Spacing: {spacing}</h3>
          <Stack direction='horizontal' spacing={spacing}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='bg-secondary text-secondary-foreground rounded-lg p-4'>
                Item {i}
              </div>
            ))}
          </Stack>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Horizontal stacking with all spacing variants.',
      },
    },
  },
};

/**
 * Story 3: Alignment Options
 * Different alignment and justification patterns
 */
export const AlignmentOptions: Story = {
  render: () => (
    <div className='space-y-8'>
      {/* Vertical Stack Alignment */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Vertical Stack - Alignment (cross-axis)</h3>
        <div className='space-y-4'>
          {(['start', 'center', 'end', 'stretch'] as const).map((align) => (
            <div key={align}>
              <p className='text-sm font-medium mb-2'>align="{align}"</p>
              <Stack
                direction='vertical'
                spacing='md'
                align={align}
                className='bg-muted/30 rounded-lg p-4'
              >
                <div className='bg-primary text-primary-foreground rounded-lg p-4 w-32'>Short</div>
                <div className='bg-primary text-primary-foreground rounded-lg p-4 w-64'>
                  Medium Width
                </div>
                <div className='bg-primary text-primary-foreground rounded-lg p-4 w-48'>
                  Also Medium
                </div>
              </Stack>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal Stack Justification */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Horizontal Stack - Justification (main-axis)</h3>
        <div className='space-y-4'>
          {(['start', 'center', 'end', 'between', 'around', 'evenly'] as const).map((justify) => (
            <div key={justify}>
              <p className='text-sm font-medium mb-2'>justify="{justify}"</p>
              <Stack
                direction='horizontal'
                spacing='md'
                justify={justify}
                className='bg-muted/30 rounded-lg p-4'
              >
                <div className='bg-secondary text-secondary-foreground rounded-lg p-4'>A</div>
                <div className='bg-secondary text-secondary-foreground rounded-lg p-4'>B</div>
                <div className='bg-secondary text-secondary-foreground rounded-lg p-4'>C</div>
              </Stack>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal Alignment */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Horizontal Stack - Alignment (cross-axis)</h3>
        <div className='space-y-4'>
          {(['start', 'center', 'end', 'stretch'] as const).map((align) => (
            <div key={align}>
              <p className='text-sm font-medium mb-2'>align="{align}"</p>
              <Stack
                direction='horizontal'
                spacing='md'
                align={align}
                className='bg-muted/30 rounded-lg p-4 min-h-[120px]'
              >
                <div className='bg-accent text-accent-foreground rounded-lg p-4'>Short</div>
                <div className='bg-accent text-accent-foreground rounded-lg p-4 h-24'>Taller</div>
                <div className='bg-accent text-accent-foreground rounded-lg p-4'>Short</div>
              </Stack>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various alignment and justification patterns for both directions.',
      },
    },
  },
};

/**
 * Story 4: Responsive Direction
 * Stack changes direction at different breakpoints
 */
export const ResponsiveDirection: Story = {
  render: () => (
    <div className='space-y-8'>
      {/* Vertical to Horizontal */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Vertical (mobile) → Horizontal (tablet+)</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Resize browser to see direction change at md breakpoint (768px)
        </p>
        <Stack
          direction={{ base: 'vertical', md: 'horizontal' }}
          spacing='md'
          className='bg-muted/30 rounded-lg p-4'
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className='bg-primary text-primary-foreground rounded-lg p-6 text-center'>
              Card {i}
            </div>
          ))}
        </Stack>
      </div>

      {/* Horizontal to Vertical (less common) */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Horizontal (mobile) → Vertical (desktop)</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Useful for tab-like navigation that becomes vertical sidebar
        </p>
        <Stack
          direction={{ base: 'horizontal', lg: 'vertical' }}
          spacing='sm'
          className='bg-muted/30 rounded-lg p-4'
        >
          {['Home', 'About', 'Services', 'Contact'].map((label) => (
            <div
              key={label}
              className='bg-secondary text-secondary-foreground rounded-lg p-3 text-center text-sm font-medium'
            >
              {label}
            </div>
          ))}
        </Stack>
      </div>

      {/* Multi-breakpoint */}
      <div>
        <h3 className='text-lg font-bold mb-4'>
          Multi-breakpoint: Vertical → Horizontal → Vertical
        </h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Mobile: vertical | Tablet: horizontal | Desktop: vertical (sidebar)
        </p>
        <Stack
          direction={{ base: 'vertical', md: 'horizontal', lg: 'vertical' }}
          spacing='md'
          className='bg-muted/30 rounded-lg p-4 lg:max-w-xs'
        >
          {['Dashboard', 'Analytics', 'Reports', 'Settings'].map((label) => (
            <div key={label} className='bg-accent text-accent-foreground rounded-lg p-4'>
              {label}
            </div>
          ))}
        </Stack>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Stack direction adapts to different screen sizes.',
      },
    },
  },
};

/**
 * Story 5: StackItem with Flex Controls
 * Individual item control with grow, shrink, and basis
 */
export const StackItemControls: Story = {
  render: () => (
    <div className='space-y-8'>
      {/* Growing item */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Growing Item (flex-grow)</h3>
        <Stack direction='horizontal' spacing='md'>
          <div className='bg-primary text-primary-foreground rounded-lg p-4'>Fixed</div>
          <StackItem grow className='bg-secondary text-secondary-foreground rounded-lg p-4'>
            Growing Item (takes remaining space)
          </StackItem>
          <div className='bg-primary text-primary-foreground rounded-lg p-4'>Fixed</div>
        </Stack>
      </div>

      {/* Multiple growing items */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Multiple Growing Items</h3>
        <Stack direction='horizontal' spacing='md'>
          <StackItem grow className='bg-primary text-primary-foreground rounded-lg p-4'>
            Grow 1
          </StackItem>
          <StackItem grow className='bg-secondary text-secondary-foreground rounded-lg p-4'>
            Grow 2
          </StackItem>
          <div className='bg-accent text-accent-foreground rounded-lg p-4'>Fixed</div>
        </Stack>
      </div>

      {/* No shrink */}
      <div>
        <h3 className='text-lg font-bold mb-4'>No Shrink (flex-shrink-0)</h3>
        <p className='text-sm text-muted-foreground mb-2'>
          Middle item won't shrink below content size
        </p>
        <Stack direction='horizontal' spacing='md'>
          <StackItem grow className='bg-primary text-primary-foreground rounded-lg p-4'>
            Flexible
          </StackItem>
          <StackItem
            shrink={false}
            className='bg-secondary text-secondary-foreground rounded-lg p-4 whitespace-nowrap'
          >
            Fixed Width Content (won't shrink)
          </StackItem>
          <StackItem grow className='bg-primary text-primary-foreground rounded-lg p-4'>
            Flexible
          </StackItem>
        </Stack>
      </div>

      {/* Flex basis */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Flex Basis (initial size)</h3>
        <Stack direction='horizontal' spacing='md'>
          <StackItem basis='100px' className='bg-primary text-primary-foreground rounded-lg p-4'>
            100px basis
          </StackItem>
          <StackItem
            basis='200px'
            className='bg-secondary text-secondary-foreground rounded-lg p-4'
          >
            200px basis
          </StackItem>
          <StackItem grow className='bg-accent text-accent-foreground rounded-lg p-4'>
            Grows to fill
          </StackItem>
        </Stack>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StackItem component for fine-grained flex control.',
      },
    },
  },
};

/**
 * Story 6: Wrap Behavior
 * Stack with wrapping enabled for multi-line layouts
 */
export const WrapBehavior: Story = {
  render: () => (
    <div className='space-y-8'>
      {/* No wrap (default) */}
      <div>
        <h3 className='text-lg font-bold mb-4'>No Wrap (default) - Items overflow</h3>
        <Stack
          direction='horizontal'
          spacing='md'
          wrap={false}
          className='bg-muted/30 rounded-lg p-4'
        >
          {Array.from({ length: 15 }, (_, i) => i + 1).map((i) => (
            <div
              key={i}
              className='bg-primary text-primary-foreground rounded-lg p-4 whitespace-nowrap'
            >
              Item {i}
            </div>
          ))}
        </Stack>
      </div>

      {/* With wrap */}
      <div>
        <h3 className='text-lg font-bold mb-4'>With Wrap - Items flow to next line</h3>
        <Stack direction='horizontal' spacing='md' wrap className='bg-muted/30 rounded-lg p-4'>
          {Array.from({ length: 15 }, (_, i) => i + 1).map((i) => (
            <div
              key={i}
              className='bg-secondary text-secondary-foreground rounded-lg p-4 whitespace-nowrap'
            >
              Item {i}
            </div>
          ))}
        </Stack>
      </div>

      {/* Tags example */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Real-World: Tag Cloud</h3>
        <Stack direction='horizontal' spacing='sm' wrap className='bg-muted/30 rounded-lg p-4'>
          {[
            'React',
            'TypeScript',
            'Next.js',
            'TailwindCSS',
            'Storybook',
            'Jest',
            'Playwright',
            'Docker',
            'PostgreSQL',
            'GraphQL',
            'REST API',
            'CI/CD',
            'Git',
            'GitHub',
          ].map((tag) => (
            <div
              key={tag}
              className='bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium'
            >
              {tag}
            </div>
          ))}
        </Stack>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Wrap behavior for multi-line layouts like tag clouds.',
      },
    },
  },
};

/**
 * Story 7: Form Layout Examples
 * Real-world form layouts using Stack
 */
export const FormLayoutExamples: Story = {
  render: () => (
    <div className='space-y-8 max-w-2xl'>
      {/* Vertical form */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Vertical Form (default)</h3>
        <Stack direction='vertical' spacing='md' className='bg-card border rounded-lg p-6'>
          <div>
            <label className='block text-sm font-medium mb-2'>Full Name</label>
            <input
              type='text'
              placeholder='John Doe'
              className='w-full border rounded-lg px-4 py-2'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Email</label>
            <input
              type='email'
              placeholder='john@example.com'
              className='w-full border rounded-lg px-4 py-2'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Message</label>
            <textarea
              placeholder='Your message...'
              className='w-full border rounded-lg px-4 py-2 h-24'
            ></textarea>
          </div>
          <Stack direction='horizontal' spacing='sm' justify='end'>
            <button className='border rounded-lg px-6 py-2 hover:bg-accent'>Cancel</button>
            <button className='bg-primary text-primary-foreground rounded-lg px-6 py-2 hover:bg-primary/90'>
              Submit
            </button>
          </Stack>
        </Stack>
      </div>

      {/* Horizontal form fields */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Horizontal Form Fields</h3>
        <Stack direction='vertical' spacing='md' className='bg-card border rounded-lg p-6'>
          <Stack direction='horizontal' spacing='md' align='center'>
            <label className='text-sm font-medium w-24 text-right'>Name:</label>
            <StackItem grow>
              <input
                type='text'
                placeholder='John Doe'
                className='w-full border rounded-lg px-4 py-2'
              />
            </StackItem>
          </Stack>
          <Stack direction='horizontal' spacing='md' align='center'>
            <label className='text-sm font-medium w-24 text-right'>Email:</label>
            <StackItem grow>
              <input
                type='email'
                placeholder='john@example.com'
                className='w-full border rounded-lg px-4 py-2'
              />
            </StackItem>
          </Stack>
          <Stack direction='horizontal' spacing='md' align='center'>
            <label className='text-sm font-medium w-24 text-right'>Age:</label>
            <input type='number' placeholder='25' className='border rounded-lg px-4 py-2 w-32' />
          </Stack>
        </Stack>
      </div>

      {/* Responsive form (vertical on mobile, horizontal on desktop) */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Responsive Form Fields</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Vertical on mobile, horizontal on tablet+
        </p>
        <Stack direction='vertical' spacing='md' className='bg-card border rounded-lg p-6'>
          <Stack direction={{ base: 'vertical', md: 'horizontal' }} spacing='md'>
            <div className='flex-1'>
              <label className='block text-sm font-medium mb-2'>First Name</label>
              <input
                type='text'
                placeholder='John'
                className='w-full border rounded-lg px-4 py-2'
              />
            </div>
            <div className='flex-1'>
              <label className='block text-sm font-medium mb-2'>Last Name</label>
              <input type='text' placeholder='Doe' className='w-full border rounded-lg px-4 py-2' />
            </div>
          </Stack>
          <div>
            <label className='block text-sm font-medium mb-2'>Email Address</label>
            <input
              type='email'
              placeholder='john.doe@example.com'
              className='w-full border rounded-lg px-4 py-2'
            />
          </div>
          <Stack direction={{ base: 'vertical', sm: 'horizontal' }} spacing='md'>
            <div className='flex-1'>
              <label className='block text-sm font-medium mb-2'>City</label>
              <input
                type='text'
                placeholder='New York'
                className='w-full border rounded-lg px-4 py-2'
              />
            </div>
            <div className='w-full sm:w-32'>
              <label className='block text-sm font-medium mb-2'>Zip</label>
              <input
                type='text'
                placeholder='10001'
                className='w-full border rounded-lg px-4 py-2'
              />
            </div>
          </Stack>
        </Stack>
      </div>

      {/* Action bar */}
      <div>
        <h3 className='text-lg font-bold mb-4'>Form Actions with StackItem</h3>
        <div className='bg-card border rounded-lg p-6'>
          <p className='text-muted-foreground mb-4'>Spacer item pushes buttons to the right</p>
          <Stack direction='horizontal' spacing='md' align='center'>
            <p className='text-sm text-muted-foreground'>Unsaved changes</p>
            <StackItem grow /> {/* Spacer */}
            <button className='border rounded-lg px-4 py-2 hover:bg-accent text-sm'>Discard</button>
            <button className='bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 text-sm'>
              Save Changes
            </button>
          </Stack>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world form layouts demonstrating Stack versatility.',
      },
    },
  },
};
