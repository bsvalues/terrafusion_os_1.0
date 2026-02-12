import type { Meta, StoryObj } from '@storybook/react';
import { /* COMPONENT_NAME */ } from './/* COMPONENT_FILE */';

/**
 * COMPONENT_DESCRIPTION
 * 
 * ## Features
 * - Feature 1
 * - Feature 2
 * - Feature 3
 * 
 * ## Usage
 * ```tsx
 * import { COMPONENT_NAME } from '@/components/ui/COMPONENT_FILE';
 * 
 * <COMPONENT_NAME>
 *   Content here
 * </COMPONENT_NAME>
 * ```
 * 
 * ## Accessibility
 * - Keyboard navigation: [describe]
 * - Screen reader support: [describe]
 * - Focus management: [describe]
 * - ARIA attributes: [describe]
 */
const meta = {
  title: 'UI/COMPONENT_NAME',
  component: /* COMPONENT_NAME */,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'COMPONENT_DESCRIPTION',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Define arg types here
  },
} satisfies Meta<typeof /* COMPONENT_NAME */>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default variant showing the basic component usage
 */
export const Default: Story = {
  args: {
    // Default props
  },
};

/**
 * All variants of the component displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add variant examples here */}
    </div>
  ),
};

/**
 * Interactive example showing component in real-world usage
 */
export const Interactive: Story = {
  render: () => {
    return (
      <div style={{ padding: '24px' }}>
        {/* Interactive example here */}
      </div>
    );
  },
};

/**
 * All possible sizes of the component
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {/* Size variants here */}
    </div>
  ),
};

/**
 * All possible states (hover, focus, disabled, loading, error)
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* State examples here */}
    </div>
  ),
};

/**
 * Real-world example showing the component in context
 */
export const RealWorldExample: Story = {
  render: () => (
    <div style={{ maxWidth: '600px', padding: '24px' }}>
      {/* Real-world example here */}
    </div>
  ),
};

/**
 * Usage guidelines with Do's and Don'ts
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div style={{ maxWidth: '800px', padding: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>Usage Guidelines</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* DO Section */}
        <div>
          <h4 style={{ 
            color: '#22c55e', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✓ Do
          </h4>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <li style={{ 
              padding: '12px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderLeft: '3px solid #22c55e',
              borderRadius: '4px'
            }}>
              <strong>Guideline 1</strong>
              <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>
                Explanation of what to do
              </p>
            </li>
            {/* Add more guidelines */}
          </ul>
        </div>

        {/* DON'T Section */}
        <div>
          <h4 style={{ 
            color: '#ef4444', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✗ Don't
          </h4>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <li style={{ 
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderLeft: '3px solid #ef4444',
              borderRadius: '4px'
            }}>
              <strong>Guideline 1</strong>
              <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.8 }}>
                Explanation of what not to do
              </p>
            </li>
            {/* Add more guidelines */}
          </ul>
        </div>
      </div>

      {/* Code Examples */}
      <div style={{ marginTop: '32px' }}>
        <h4 style={{ marginBottom: '16px' }}>Code Examples</h4>
        <div style={{ 
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          overflow: 'auto'
        }}>
          <pre style={{ margin: 0 }}>
{`// Example usage
import { COMPONENT_NAME } from '@/components/ui/COMPONENT_FILE';

function MyComponent() {
  return (
    <COMPONENT_NAME>
      Example content
    </COMPONENT_NAME>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  ),
};
