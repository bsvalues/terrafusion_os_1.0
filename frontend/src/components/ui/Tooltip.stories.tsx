/**
 * Tooltip Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Tooltip component
 * - Contextual help text on hover
 * - Keyboard accessibility with focus
 * - Positioning strategies (top, right, bottom, left)
 * - Delay customization
 * 
 * Architecture: Built on Radix UI Tooltip primitive
 * - Portal rendering for z-index
 * - Automatic collision detection
 * - Focus and hover triggers
 * - Smooth animations
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { Button } from './button';

const meta = {
  title: 'Design System/Atoms/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Tooltip Component

A hover tooltip component for providing contextual information.

## Features
- ✅ Hover and focus triggers
- ✅ Portal rendering for proper z-index
- ✅ Automatic positioning (top, right, bottom, left)
- ✅ Collision detection and boundary awareness
- ✅ Customizable delay
- ✅ Keyboard accessible
- ✅ Smooth fade animations

## Usage
\`\`\`tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
\`\`\`

## Accessibility
- Triggered on hover and keyboard focus
- Escape key dismisses tooltip
- ARIA attributes automatically applied
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Tooltip
 * Basic tooltip on hover
 */
export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a helpful tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic tooltip that appears on hover.',
      },
    },
  },
};

/**
 * Story 2: Positioning Variants
 * Tooltips positioned on all sides
 */
export const PositioningVariants: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-16">
      {/* Top */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tooltip on top</p>
        </TooltipContent>
      </Tooltip>

      <div className="flex gap-32">
        {/* Left */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Left</Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Tooltip on left</p>
          </TooltipContent>
        </Tooltip>

        {/* Right */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Right</Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Tooltip on right</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Bottom */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tooltip on bottom</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips can be positioned on any side: top, right, bottom, or left.',
      },
    },
  },
};

/**
 * Story 3: Delay Variants
 * Tooltips with different delay timings
 */
export const DelayVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Instant</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>No delay (0ms)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Fast</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>300ms delay</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={700}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Default</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>700ms delay (default)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={1500}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Slow</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>1500ms delay</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Control tooltip appearance delay with `delayDuration` prop on TooltipProvider.',
      },
    },
  },
};

/**
 * Story 4: Rich Content Tooltips
 * Tooltips with formatted content
 */
export const RichContentTooltips: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      {/* Bold text */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bold</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p><strong>Important:</strong> This action cannot be undone</p>
        </TooltipContent>
      </Tooltip>

      {/* Multi-line */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Multi-line</Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>This tooltip has multiple lines of text to provide more detailed information about the feature.</p>
        </TooltipContent>
      </Tooltip>

      {/* With emoji */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Emoji</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>✨ Save your work</p>
        </TooltipContent>
      </Tooltip>

      {/* Keyboard shortcut */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Shortcut</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save <kbd className="ml-2 px-1.5 py-0.5 text-xs border rounded">⌘S</kbd></p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips can contain rich content including bold text, multi-line text, emoji, and keyboard shortcuts.',
      },
    },
  },
};

/**
 * Story 5: Interactive Tooltips on Icons
 * Tooltips providing context for icon-only buttons
 */
export const IconTooltips: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <span className="text-lg">💾</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <span className="text-lg">✏️</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <span className="text-lg">🗑️</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <span className="text-lg">⚙️</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <span className="text-lg">🔍</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Search</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Essential for icon-only buttons - tooltips provide labels for accessibility.',
      },
    },
  },
};

/**
 * Story 6: Real-World Examples
 * Common tooltip patterns in production apps
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Toolbar */}
      <div>
        <p className="text-sm font-medium mb-2">Editor Toolbar</p>
        <div className="flex gap-1 border rounded p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                <strong>B</strong>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold <kbd className="ml-2 px-1 text-xs border rounded">⌘B</kbd></p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                <em>I</em>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italic <kbd className="ml-2 px-1 text-xs border rounded">⌘I</kbd></p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                <u>U</u>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Underline <kbd className="ml-2 px-1 text-xs border rounded">⌘U</kbd></p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                📎
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Attach file</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                🔗
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Insert link</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Status indicators */}
      <div>
        <p className="text-sm font-medium mb-2">Status Indicators</p>
        <div className="flex gap-4">
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm">Online</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>System is operational</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm">Degraded</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Some features may be slow</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm">Offline</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>System maintenance in progress</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Help text on form fields */}
      <div>
        <p className="text-sm font-medium mb-2">Form Field Help</p>
        <div className="flex items-center gap-2">
          <label className="text-sm">API Key</label>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-muted-foreground cursor-help">ⓘ</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Your API key is used to authenticate requests. Keep it secret!</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Disabled button explanation */}
      <div>
        <p className="text-sm font-medium mb-2">Disabled State Context</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button disabled>Submit</Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Complete all required fields to enable</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Common production patterns: toolbars, status indicators, form help, and disabled state explanations.',
      },
    },
  },
};

/**
 * Story 7: Usage Guidelines
 * Best practices for using tooltips
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Tooltip Component Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using tooltips in your applications.
        </p>
      </div>

      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Keep it short</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline">Good</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save changes</p>
              </TooltipContent>
            </Tooltip>
            <p className="text-sm text-muted-foreground">
              1-2 sentences maximum
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use for icon-only buttons</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline">✏️</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
            <p className="text-sm text-muted-foreground">
              Essential for accessibility
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Show keyboard shortcuts</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline">Save</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save <kbd className="ml-2 px-1 text-xs border rounded">⌘S</kbd></p>
              </TooltipContent>
            </Tooltip>
            <p className="text-sm text-muted-foreground">
              Help users learn shortcuts
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Explain disabled states</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button size="sm" disabled>Submit</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete form first</p>
              </TooltipContent>
            </Tooltip>
            <p className="text-sm text-muted-foreground">
              Tell users why it's disabled
            </p>
          </div>
        </div>
      </div>

      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use for critical info</p>
            <p className="text-sm text-muted-foreground">
              Tooltips are easily missed. Critical information should be always visible.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't make them too long</p>
            <p className="text-sm text-muted-foreground">
              Long explanations belong in help documentation, not tooltips.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use on mobile</p>
            <p className="text-sm text-muted-foreground">
              Hover doesn't exist on touch. Use visible labels or a different pattern.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't repeat visible text</p>
            <p className="text-sm text-muted-foreground">
              If button says "Save", tooltip shouldn't just say "Save" again.
            </p>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Tooltip</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip text</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">With Custom Delay</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<TooltipProvider delayDuration={300}>
  <Tooltip>
    <TooltipTrigger>Hover</TooltipTrigger>
    <TooltipContent>
      <p>Fast tooltip (300ms)</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Positioned Tooltip</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<TooltipContent side="right">
  <p>Appears on the right</p>
</TooltipContent>`}</code>
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
            <span>Appears on both hover and keyboard focus</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Escape key dismisses tooltip</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>ARIA role="tooltip" applied automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Screen readers announce tooltip content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Essential for icon-only buttons (provides accessible name)</span>
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
              <p className="font-medium">Icon-only buttons</p>
              <p className="text-muted-foreground">
                Provide text labels for accessibility
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Additional context</p>
              <p className="text-muted-foreground">
                Brief explanations that supplement visible UI
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Keyboard shortcuts</p>
              <p className="text-muted-foreground">
                Display shortcuts to help users learn
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Disabled state explanations</p>
              <p className="text-muted-foreground">
                Explain why something is disabled and how to enable it
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
        story: 'Comprehensive guidelines with best practices, code examples, accessibility, and usage patterns.',
      },
    },
  },
};
