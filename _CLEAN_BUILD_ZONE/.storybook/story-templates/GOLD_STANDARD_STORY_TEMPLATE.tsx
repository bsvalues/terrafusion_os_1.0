/**
 * TERRAFUSION GOLD STANDARD COMPONENT STORY TEMPLATE
 * 
 * This template defines what world-class component documentation looks like.
 * Every story following this pattern becomes a reference implementation.
 * 
 * MIT/PhD-Level Systems Engineering Applied to Component Documentation
 * 
 * @version 2.0.0
 * @author TerraFusion Systems Design Engineering Team
 * @license MIT
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { COMPONENT_NAME } from './component-name'; // Replace with actual component

// ============================================================================
// METADATA CONFIGURATION
// ============================================================================

const meta = {
  title: 'Design System/[Category]/[ComponentName]', // e.g., 'Design System/Primitives/Button'
  component: COMPONENT_NAME,
  
  // Storybook configuration
  tags: ['autodocs', 'accessibility-tested', 'design-system'],
  
  parameters: {
    layout: 'centered', // or 'fullscreen', 'padded'
    
    // Component description (supports Markdown)
    docs: {
      description: {
        component: `
# Component Purpose

[Clear, concise description of what this component does]

## Design Tokens Used

- **Colors:** \`primary\`, \`secondary\`, \`destructive\`
- **Spacing:** \`spacing-4\` (1rem), \`spacing-2\` (0.5rem)
- **Typography:** \`text-sm\`, \`font-medium\`
- **Radius:** \`rounded-md\` (0.375rem)
- **Shadows:** \`shadow-sm\`

## Accessibility Features

- ✅ Keyboard Navigation: [Tab, Enter, Space, Arrow keys]
- ✅ Screen Reader Support: [ARIA attributes, roles, labels]
- ✅ Focus Management: [Focus visible, focus trap if applicable]
- ✅ WCAG 2.1 AA Compliant: [Color contrast, text sizing, etc.]

## Usage Guidelines

### ✅ Do
- Use for [specific use case]
- Prefer [variant] for [scenario]
- Combine with [related component] for [pattern]

### ❌ Don't
- Avoid using for [anti-pattern]
- Don't mix [incompatible pattern]
- Never [dangerous usage]

## Performance Notes

- Bundle size: [X KB gzipped]
- Render performance: [milliseconds]
- Re-render optimization: [memo, useMemo, etc.]

## Related Components

- [Component A] - Use when [scenario]
- [Component B] - Alternative for [use case]
        `,
      },
    },
    
    // Accessibility testing configuration
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'aria-valid-attr', enabled: true },
          { id: 'aria-valid-attr-value', enabled: true },
          { id: 'interactive-controls', enabled: true },
        ],
      },
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    },
    
    // Design specifications
    design: {
      type: 'figma', // Optional: Link to Figma designs
      url: '[Figma URL]',
    },
  },
  
  // Interactive controls configuration
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
      description: 'Visual style variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
        category: 'Appearance',
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
        category: 'Appearance',
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
  },
  
  // Default args
  args: {
    children: 'Component Label',
  },
} satisfies Meta<typeof COMPONENT_NAME>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// PRIMARY STORY (Default Usage)
// ============================================================================

/**
 * The default component usage.
 * 
 * This is the most common implementation pattern.
 * Shows the component with sensible defaults.
 * 
 * @accessibility Fully keyboard navigable, screen reader friendly
 * @performance Optimized for rendering, no unnecessary re-renders
 */
export const Default: Story = {
  args: {
    children: 'Default Component',
  },
  
  // Interaction testing
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Component renders correctly', async () => {
      const element = canvas.getByRole('[role]'); // e.g., 'button', 'checkbox', 'textbox'
      expect(element).toBeInTheDocument();
      expect(element).toBeVisible();
    });
    
    await step('Has accessible name', async () => {
      const element = canvas.getByRole('[role]', { name: /[expected name]/i });
      expect(element).toHaveAccessibleName();
    });
    
    await step('Interactive behavior works', async () => {
      const element = canvas.getByRole('[role]');
      await userEvent.click(element);
      // Add assertions for expected behavior
    });
    
    await step('Keyboard navigation works', async () => {
      const element = canvas.getByRole('[role]');
      element.focus();
      await userEvent.keyboard('{Enter}');
      // Add assertions
    });
  },
};

// ============================================================================
// VARIANT SHOWCASE (All Variants at Once)
// ============================================================================

/**
 * All available variants displayed together.
 * 
 * Use this to understand visual differences between variants.
 * Helps designers verify implementation matches specifications.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <COMPONENT_NAME variant="default">Default</COMPONENT_NAME>
      <COMPONENT_NAME variant="secondary">Secondary</COMPONENT_NAME>
      <COMPONENT_NAME variant="destructive">Destructive</COMPONENT_NAME>
      <COMPONENT_NAME variant="outline">Outline</COMPONENT_NAME>
      <COMPONENT_NAME variant="ghost">Ghost</COMPONENT_NAME>
      <COMPONENT_NAME variant="link">Link</COMPONENT_NAME>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all available variants. Each variant serves a specific semantic purpose.',
      },
    },
  },
};

// ============================================================================
// SIZE VARIANTS
// ============================================================================

/**
 * All available sizes displayed together.
 * 
 * Shows relative sizing and appropriate use cases.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <COMPONENT_NAME size="sm">Small</COMPONENT_NAME>
      <COMPONENT_NAME size="default">Default</COMPONENT_NAME>
      <COMPONENT_NAME size="lg">Large</COMPONENT_NAME>
    </div>
  ),
};

// ============================================================================
// STATE VARIATIONS
// ============================================================================

/**
 * All component states.
 * 
 * Shows default, hover, focus, active, disabled, and loading states.
 */
export const States: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Default State</p>
        <COMPONENT_NAME>Default</COMPONENT_NAME>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Disabled State</p>
        <COMPONENT_NAME disabled>Disabled</COMPONENT_NAME>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Loading State</p>
        <COMPONENT_NAME loading>Loading</COMPONENT_NAME>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Focus State (simulated)</p>
        <COMPONENT_NAME className="focus:ring-2">Focused</COMPONENT_NAME>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive state variations. All states maintain accessibility and visual clarity.',
      },
    },
  },
};

// ============================================================================
// INTERACTIVE DEMO (Controlled Component)
// ============================================================================

/**
 * Interactive demo with live controls.
 * 
 * Demonstrates controlled component pattern.
 * Users can interact and see state changes.
 */
export const Interactive: Story = {
  render: () => {
    const [state, setState] = React.useState(false);
    const [count, setCount] = React.useState(0);

    return (
      <div className="space-y-4">
        <COMPONENT_NAME
          onClick={() => {
            setState(!state);
            setCount(count + 1);
          }}
        >
          Click Me
        </COMPONENT_NAME>
        
        <div className="text-sm space-y-1">
          <p>State: <strong>{state ? 'Active' : 'Inactive'}</strong></p>
          <p>Click Count: <strong>{count}</strong></p>
        </div>
      </div>
    );
  },
};

// ============================================================================
// WITH ICONS
// ============================================================================

/**
 * Component with icon integration.
 * 
 * Shows proper icon sizing and spacing.
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <COMPONENT_NAME>
        <span className="mr-2">📁</span>
        Left Icon
      </COMPONENT_NAME>
      
      <COMPONENT_NAME>
        Right Icon
        <span className="ml-2">🚀</span>
      </COMPONENT_NAME>
      
      <COMPONENT_NAME>
        <span className="mr-2">💾</span>
        Both Sides
        <span className="ml-2">✅</span>
      </COMPONENT_NAME>
    </div>
  ),
};

// ============================================================================
// ACCESSIBILITY TESTING STORY
// ============================================================================

/**
 * Comprehensive accessibility testing.
 * 
 * Validates WCAG 2.1 AA compliance.
 * Tests keyboard navigation, screen reader support, focus management.
 */
export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-4">
      <COMPONENT_NAME aria-label="Accessible button with clear label">
        Properly Labeled
      </COMPONENT_NAME>
      
      <COMPONENT_NAME disabled aria-disabled="true">
        Disabled (announced to screen readers)
      </COMPONENT_NAME>
      
      <COMPONENT_NAME aria-describedby="button-description">
        With Description
      </COMPONENT_NAME>
      <p id="button-description" className="text-sm text-gray-600">
        This button performs [action]
      </p>
    </div>
  ),
  
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('All elements have accessible names', async () => {
      const elements = canvas.getAllByRole('[role]');
      elements.forEach(element => {
        expect(element).toHaveAccessibleName();
      });
    });
    
    await step('Disabled state is properly communicated', async () => {
      const disabledElement = canvas.getByRole('[role]', { name: /disabled/i });
      expect(disabledElement).toBeDisabled();
      expect(disabledElement).toHaveAttribute('aria-disabled', 'true');
    });
    
    await step('Focus management works correctly', async () => {
      const element = canvas.getByRole('[role]', { name: /properly labeled/i });
      element.focus();
      expect(element).toHaveFocus();
      expect(element).toHaveClass(/focus:/); // Focus visible styles
    });
  },
  
  parameters: {
    docs: {
      description: {
        story: `
### Accessibility Checklist ✅

- [x] Keyboard navigable (Tab, Enter, Space)
- [x] Screen reader announces role and state
- [x] Focus visible with clear indicator
- [x] Disabled state properly communicated
- [x] ARIA attributes are valid and necessary
- [x] Color contrast meets WCAG AA (4.5:1 for text)
- [x] Touch targets are at least 44x44px
- [x] Works without JavaScript (progressive enhancement)

### Testing Tools Used

- **axe-core:** Automated accessibility testing
- **@storybook/test:** Interaction testing
- **Manual testing:** NVDA, JAWS, VoiceOver
        `,
      },
    },
  },
};

// ============================================================================
// EDGE CASES & ERROR STATES
// ============================================================================

/**
 * Edge cases and error handling.
 * 
 * Tests component behavior with unusual inputs.
 */
export const EdgeCases: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Empty Children</p>
        <COMPONENT_NAME>{''}</COMPONENT_NAME>
      </div>
      
      <div>
        <p className="text-sm font-medium mb-2">Very Long Text</p>
        <COMPONENT_NAME>
          This is an extremely long text that tests how the component handles text overflow and wrapping behavior when the content exceeds the expected width
        </COMPONENT_NAME>
      </div>
      
      <div>
        <p className="text-sm font-medium mb-2">Special Characters</p>
        <COMPONENT_NAME>
          {"<script>alert('XSS')</script> & special chars: !@#$%^&*()"}
        </COMPONENT_NAME>
      </div>
      
      <div>
        <p className="text-sm font-medium mb-2">RTL Text Support</p>
        <COMPONENT_NAME dir="rtl">
          مرحبا بك في تيرافيوجن
        </COMPONENT_NAME>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Edge cases ensure component robustness. All edge cases should gracefully degrade or provide clear feedback.',
      },
    },
  },
};

// ============================================================================
// RESPONSIVE BEHAVIOR
// ============================================================================

/**
 * Responsive design demonstration.
 * 
 * Shows component behavior at different viewport sizes.
 */
export const Responsive: Story = {
  render: () => (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium">Mobile (320px)</p>
        <div className="w-[320px] border p-4">
          <COMPONENT_NAME className="w-full">
            Mobile View
          </COMPONENT_NAME>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Tablet (768px)</p>
        <div className="w-[768px] border p-4">
          <COMPONENT_NAME className="w-full">
            Tablet View
          </COMPONENT_NAME>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Desktop (1200px)</p>
        <div className="w-[1200px] border p-4">
          <COMPONENT_NAME className="w-full">
            Desktop View
          </COMPONENT_NAME>
        </div>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'responsive',
    },
  },
};

// ============================================================================
// COMPOSITION PATTERNS
// ============================================================================

/**
 * Common composition patterns.
 * 
 * Shows how this component is typically used with others.
 */
export const CompositionPatterns: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium">Pattern 1: [Description]</p>
        <div className="border p-4">
          {/* Example composition */}
          <COMPONENT_NAME>Example</COMPONENT_NAME>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Pattern 2: [Description]</p>
        <div className="border p-4">
          {/* Example composition */}
          <COMPONENT_NAME>Example</COMPONENT_NAME>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common patterns for composing this component with others in the design system.',
      },
    },
  },
};

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

/**
 * Performance testing story.
 * 
 * Renders many instances to test performance.
 */
export const Performance: Story = {
  render: () => {
    const [renderTime, setRenderTime] = React.useState(0);
    
    React.useEffect(() => {
      const start = performance.now();
      // Trigger re-render
      requestAnimationFrame(() => {
        const end = performance.now();
        setRenderTime(end - start);
      });
    }, []);

    return (
      <div className="space-y-4">
        <p className="text-sm">
          Render time: <strong>{renderTime.toFixed(2)}ms</strong>
        </p>
        
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 100 }, (_, i) => (
            <COMPONENT_NAME key={i} size="sm">
              {i + 1}
            </COMPONENT_NAME>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance test with 100 component instances. Render time should be <50ms on modern hardware.',
      },
    },
  },
};

// ============================================================================
// PLAYGROUND (Fully Interactive)
// ============================================================================

/**
 * Interactive playground.
 * 
 * Modify all props through Storybook controls.
 * Perfect for exploring component API.
 */
export const Playground: Story = {
  args: {
    children: 'Playground Component',
    variant: 'default',
    size: 'default',
    disabled: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground. Use the controls panel to modify all props and see changes in real-time.',
      },
    },
  },
};
