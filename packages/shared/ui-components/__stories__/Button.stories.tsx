import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../src/Button';

// TerraFusion Button component stories
const meta: Meta<typeof Button> = {
  title: 'TerraFusion/Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TerraFusion Button Component

The TerraFusion Button component provides a comprehensive, accessible, and beautifully styled button for all TerraFusion applications. Built with the TerraFusion design system, featuring glass morphism effects, championship gradients, and smooth animations.

## Features

- 🎨 **TerraFusion Design System** - Official colors, gradients, and glow effects
- ♿ **Accessibility First** - Full ARIA support and keyboard navigation
- 🎯 **Multiple Variants** - Primary, secondary, success, danger, ghost, outline
- 📱 **Responsive Design** - Optimized for all screen sizes
- ⚡ **Performance** - Optimized rendering with React.memo
- 🔧 **TypeScript** - Full type safety and IntelliSense support

## Usage in TerraFusion Applications

Perfect for property assessment systems, government modules, and administrative interfaces.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'danger', 'ghost', 'outline'],
      description: 'Button visual style variant',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Shows loading state with spinner',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables button interaction',
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Makes button full width of container',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default button story
export const Default: Story = {
  args: {
    children: 'TerraFusion Button',
  },
};

// Variant examples
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

// Size examples
export const Small: Story = {
  args: {
    size: 'small',
    children: 'Small Button',
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
    children: 'Medium Button',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    children: 'Large Button',
  },
};

// State examples
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

// Icon examples
export const WithIcon: Story = {
  args: {
    icon: <span>📍</span>,
    children: 'With Icon',
  },
};

export const WithIconAfter: Story = {
  args: {
    iconAfter: <span>→</span>,
    children: 'With Icon After',
  },
};

// Government/Assessment use cases
export const AssessmentAction: Story = {
  args: {
    variant: 'primary',
    children: 'Start Assessment',
    icon: <span>📋</span>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example button for starting property assessments in TerraFusion government modules.',
      },
    },
  },
};

export const ApprovalAction: Story = {
  args: {
    variant: 'success',
    children: 'Approve Property',
    icon: <span>✅</span>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example button for approving property assessments or permits.',
      },
    },
  },
};

export const DangerAction: Story = {
  args: {
    variant: 'danger',
    children: 'Reject Application',
    icon: <span>❌</span>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example button for rejection actions in government workflows.',
      },
    },
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="success">Success</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants in the TerraFusion design system.',
      },
    },
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button sizes.',
      },
    },
  },
};