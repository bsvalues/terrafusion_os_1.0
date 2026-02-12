/**
 * Button Component Stories
 *
 * Storybook documentation for TerraFusion Button component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'TerraFusion quantum-themed button component with multiple variants and effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'quantum', 'glass', 'ghost'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    pulse: {
      control: 'boolean',
      description: 'Enable quantum pulse animation',
    },
    glow: {
      control: 'boolean',
      description: 'Enable terra-cyan glow effect',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Primary button with terra-cyan gradient
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Secondary button with terra-blue accent
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Quantum variant with multi-color gradient animation
 */
export const Quantum: Story = {
  args: {
    variant: 'quantum',
    children: 'Execute Quantum Protocol',
    pulse: true,
    glow: true,
  },
};

/**
 * Glassmorphic variant with backdrop blur
 */
export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass Effect Button',
    glow: true,
  },
};

/**
 * Ghost variant for subtle actions
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Small size button
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

/**
 * Large size button
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

/**
 * Button with pulse animation
 */
export const WithPulse: Story = {
  args: {
    variant: 'quantum',
    pulse: true,
    children: 'Pulsing Button',
  },
};

/**
 * Button with glow effect
 */
export const WithGlow: Story = {
  args: {
    variant: 'primary',
    glow: true,
    children: 'Glowing Button',
  },
};

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
};

/**
 * Button group example
 */
export const ButtonGroup: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Reset</Button>
    </div>
  ),
};

/**
 * Responsive button sizes
 */
export const ResponsiveSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button size="sm">Small Button</Button>
      <Button size="md">Medium Button</Button>
      <Button size="lg">Large Button</Button>
    </div>
  ),
};

/**
 * All quantum effects combined
 */
export const AllQuantumEffects: Story = {
  args: {
    variant: 'quantum',
    pulse: true,
    glow: true,
    children: 'Ultimate Quantum Button',
  },
};
