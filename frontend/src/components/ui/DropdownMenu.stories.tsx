/**
 * Dropdown Menu Component Stories - TerraFusion Design System
 * Week 1, Day 2 - Component Documentation Phase
 * 
 * Purpose: Comprehensive documentation and testing of the Dropdown Menu component
 * - Context menus and action menus
 * - Nested submenus
 * - Checkbox and radio items
 * - Keyboard shortcuts display
 * 
 * Architecture: Built on Radix UI Dropdown Menu primitive
 * - Keyboard navigation with arrow keys
 * - Automatic positioning
 * - Portal rendering
 * - Focus management
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Button } from './button';
import { useState } from 'react';

const meta = {
  title: 'Design System/Molecules/DropdownMenu',
  component: DropdownMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Dropdown Menu Component

A context menu component for displaying actions and options.

## Features
- ✅ Keyboard navigation - Arrow keys, Enter, Escape
- ✅ Nested submenus with ChevronRightIcon
- ✅ Checkbox items with CheckIcon
- ✅ Radio items with DotFilledIcon
- ✅ Keyboard shortcuts display
- ✅ Labels and separators
- ✅ Portal rendering for proper z-index
- ✅ Automatic positioning
- ✅ Smooth animations

## Usage
\`\`\`tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
\`\`\`

## Accessibility
- Arrow keys navigate menu items
- Enter/Space activates items
- Escape closes menu
- Tab moves to next focusable element
- Type-ahead search
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Default Dropdown Menu
 * Basic menu with simple items
 */
export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic dropdown menu with simple items and separator.',
      },
    },
  },
};

/**
 * Story 2: Menu with Keyboard Shortcuts
 * Menu items with keyboard shortcut indicators
 */
export const WithKeyboardShortcuts: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Edit</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Undo
          <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Redo
          <DropdownMenuShortcut>⌘Y</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Cut
          <DropdownMenuShortcut>⌘X</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Copy
          <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Paste
          <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Select All
          <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Menu with keyboard shortcuts displayed for each action.',
      },
    },
  },
};

/**
 * Story 3: Nested Submenus
 * Menu with hierarchical submenu structure
 */
export const NestedSubmenus: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">File</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem>
          New File
          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Open Recent</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>project-1.tsx</DropdownMenuItem>
            <DropdownMenuItem>dashboard.tsx</DropdownMenuItem>
            <DropdownMenuItem>components.tsx</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>More...</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Save
          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Export As</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>PDF</DropdownMenuItem>
            <DropdownMenuItem>JSON</DropdownMenuItem>
            <DropdownMenuItem>CSV</DropdownMenuItem>
            <DropdownMenuItem>XML</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Print
          <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Menu with nested submenus for hierarchical navigation.',
      },
    },
  },
};

/**
 * Story 4: Checkbox Items
 * Menu with checkbox items for multi-select
 */
export const CheckboxItems: Story = {
  render: () => {
    const [showStatusBar, setShowStatusBar] = useState(true);
    const [showActivityBar, setShowActivityBar] = useState(false);
    const [showPanel, setShowPanel] = useState(false);

    return (
      <div className="space-y-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">View Options</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showStatusBar}
              onCheckedChange={setShowStatusBar}
            >
              Status Bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showActivityBar}
              onCheckedChange={setShowActivityBar}
            >
              Activity Bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showPanel}
              onCheckedChange={setShowPanel}
            >
              Panel
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="rounded-lg border p-4 bg-muted text-sm">
          <p className="font-medium mb-2">Active Views:</p>
          {showStatusBar && <p>• Status Bar</p>}
          {showActivityBar && <p>• Activity Bar</p>}
          {showPanel && <p>• Panel</p>}
          {!showStatusBar && !showActivityBar && !showPanel && (
            <p className="text-muted-foreground">No views enabled</p>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Menu with checkbox items for toggling multiple options.',
      },
    },
  },
};

/**
 * Story 5: Radio Group Items
 * Menu with radio items for single selection
 */
export const RadioGroupItems: Story = {
  render: () => {
    const [theme, setTheme] = useState('light');

    return (
      <div className="space-y-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Theme: {theme}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="rounded-lg border p-4 bg-muted text-sm">
          <p className="font-medium">Selected Theme: <span className="text-primary">{theme}</span></p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Menu with radio group for single selection.',
      },
    },
  },
};

/**
 * Story 6: Interactive Examples
 * Complex menu with multiple features combined
 */
export const InteractiveExamples: Story = {
  render: () => {
    const [position, setPosition] = useState('bottom');
    const [features, setFeatures] = useState({
      tooltips: true,
      animations: true,
      sounds: false,
    });

    return (
      <div className="space-y-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>User Settings</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Billing
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Preferences</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={features.tooltips}
              onCheckedChange={(checked) =>
                setFeatures({ ...features, tooltips: checked })
              }
            >
              Show Tooltips
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={features.animations}
              onCheckedChange={(checked) =>
                setFeatures({ ...features, animations: checked })
              }
            >
              Enable Animations
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={features.sounds}
              onCheckedChange={(checked) =>
                setFeatures({ ...features, sounds: checked })
              }
            >
              Sound Effects
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Panel Position</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                  <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="left">Left</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="rounded-lg border p-4 bg-muted text-sm space-y-2">
          <p className="font-medium mb-2">Current Configuration:</p>
          <p><strong>Panel Position:</strong> {position}</p>
          <p><strong>Features:</strong></p>
          <ul className="ml-4">
            <li>Tooltips: {features.tooltips ? '✓ On' : '✗ Off'}</li>
            <li>Animations: {features.animations ? '✓ On' : '✗ Off'}</li>
            <li>Sounds: {features.sounds ? '✓ On' : '✗ Off'}</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex menu combining groups, checkboxes, radio items, and submenus.',
      },
    },
  },
};

/**
 * Story 7: Real-World Examples
 * Common dropdown menu patterns in production apps
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {/* User Account Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">👤 Account</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>john@example.com</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Dashboard</DropdownMenuItem>
          <DropdownMenuItem>Profile Settings</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Team Settings</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
              <DropdownMenuItem>Message</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>More...</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem disabled>API (Coming soon)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">⋯ More Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem>
            Edit
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Duplicate
            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Share</DropdownMenuItem>
          <DropdownMenuItem>Move to</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Archive</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">🔍 Filter</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem>Active</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>Pending</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Completed</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Archived</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Clear filters</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">↕ Sort</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value="date">
            <DropdownMenuRadioItem value="date">Date Created</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name">Name (A-Z)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="modified">Last Modified</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem>Reverse order</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common production patterns: user account menu, actions menu, filters, and sorting.',
      },
    },
  },
};

/**
 * Story 8: Usage Guidelines
 * Best practices for using dropdown menus
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">Dropdown Menu Guidelines</h2>
        <p className="text-muted-foreground">
          Best practices for using dropdown menus in your applications.
        </p>
      </div>

      {/* DO's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✓ Do's</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Group related items</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Good</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Edit</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Cut</DropdownMenuItem>
                <DropdownMenuItem>Copy</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm text-muted-foreground">
              Use labels and separators to organize
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Show keyboard shortcuts</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Good</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  Save
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm text-muted-foreground">
              Help users learn shortcuts
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Use clear labels</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Delete permanently</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm text-muted-foreground">
              Be explicit about destructive actions
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <p className="font-medium">✓ Disable unavailable items</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Good</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Copy</DropdownMenuItem>
                <DropdownMenuItem disabled>Paste</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm text-muted-foreground">
              Show but disable unavailable actions
            </p>
          </div>
        </div>
      </div>

      {/* DON'T's Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">✗ Don'ts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't overcomplicate</p>
            <p className="text-sm text-muted-foreground">
              Avoid too many levels of nesting (max 2-3 levels)
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use for primary actions</p>
            <p className="text-sm text-muted-foreground">
              Primary actions should be visible buttons, not hidden in menus
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't use vague labels</p>
            <p className="text-sm text-muted-foreground">
              "Options" or "More" should be last resort. Be specific when possible.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 space-y-2">
            <p className="font-medium">✗ Don't make menus too long</p>
            <p className="text-sm text-muted-foreground">
              If menu has 10+ items, consider grouping or using different UI
            </p>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Code Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Basic Dropdown</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">With Checkboxes</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`const [checked, setChecked] = useState(false);

<DropdownMenuCheckboxItem 
  checked={checked}
  onCheckedChange={setChecked}
>
  Option
</DropdownMenuCheckboxItem>`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">With Submenu</h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<DropdownMenuSub>
  <DropdownMenuSubTrigger>
    More Options
  </DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuItem>Sub Item</DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>`}</code>
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
            <span>Arrow keys navigate menu items (Up/Down, Left/Right for submenus)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Enter or Space activates menu items</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Escape closes menu and returns focus to trigger</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Tab moves focus to next element outside menu</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Type-ahead: typing letter focuses first item starting with that letter</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>ARIA role="menu" applied automatically by Radix UI</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Screen reader announces menu items and their states</span>
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
              <p className="font-medium">Context Menus</p>
              <p className="text-muted-foreground">
                Actions relevant to a specific item (right-click menus)
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Action Menus</p>
              <p className="text-muted-foreground">
                Multiple actions for an item (⋯ more actions button)
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">User Account Menus</p>
              <p className="text-muted-foreground">
                User settings, profile, and logout options
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">→</span>
            <div>
              <p className="font-medium">Filter/Sort Controls</p>
              <p className="text-muted-foreground">
                Checkbox and radio options for filtering or sorting lists
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
