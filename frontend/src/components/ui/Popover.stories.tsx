import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar, Settings, User, Info, HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';

/**
 * # Popover Component
 * 
 * A versatile overlay component for displaying rich contextual content anchored to a trigger element.
 * Built on @radix-ui/react-popover with smooth animations and intelligent positioning.
 * 
 * ## Architecture
 * 
 * ### Component Structure
 * ```
 * Popover (root container, manages state)
 * ├── PopoverTrigger (anchor element, usually a button)
 * └── PopoverContent (overlay panel)
 *     └── [Your content: forms, menus, info, etc.]
 * ```
 * 
 * ### Built on Radix UI Popover
 * - **@radix-ui/react-popover**: Accessible overlay primitive
 * - **Positioning**: Automatic collision detection and boundary awareness
 * - **Portal rendering**: Content rendered outside DOM hierarchy to avoid z-index issues
 * - **Focus management**: Traps focus when open, returns on close
 * 
 * ## Features
 * 
 * ### Built-in Capabilities
 * - ✅ Smart positioning (auto-adjusts to viewport boundaries)
 * - ✅ Multiple placements (top, bottom, left, right)
 * - ✅ Smooth animations (fade + zoom + slide)
 * - ✅ Click outside to close
 * - ✅ Escape key to close
 * - ✅ Focus trap (optional)
 * - ✅ Portal rendering (z-index friendly)
 * - ✅ Accessibility (ARIA dialog role)
 * 
 * ### Interaction Patterns
 * - **Click trigger**: Toggle popover open/closed
 * - **Click outside**: Close popover
 * - **Escape key**: Close popover
 * - **Tab**: Navigate through interactive elements (if focus trapped)
 * 
 * ## Design Tokens
 * 
 * ### Colors
 * - Background: `bg-popover`
 * - Text: `text-popover-foreground`
 * - Border: `border`
 * - Shadow: `shadow-md`
 * 
 * ### Sizing
 * - Default width: `w-72` (288px, configurable)
 * - Padding: `p-4` (16px)
 * - Border radius: `rounded-md`
 * - Offset from trigger: `sideOffset={4}` (4px)
 * 
 * ### Animations
 * - Entry: `fade-in-0 + zoom-in-95 + slide-in-from-*`
 * - Exit: `fade-out-0 + zoom-out-95`
 * - Duration: Controlled by Tailwind `animate-in`/`animate-out`
 * 
 * ## Accessibility
 * 
 * ### ARIA Dialog Pattern
 * - Role: `dialog` on PopoverContent
 * - `aria-labelledby`: Links to heading inside popover
 * - `aria-describedby`: Links to description text
 * - Focus management: Traps focus when open (optional via `trapFocus`)
 * 
 * ### Keyboard Navigation
 * - **Escape**: Close popover
 * - **Tab**: Navigate through interactive elements
 * - **Shift+Tab**: Navigate backward
 * - **Click outside**: Close popover
 * 
 * ### Screen Reader Support
 * - Popover content announced when opened
 * - Trigger state (expanded/collapsed) announced
 * - Focus returns to trigger when closed
 * 
 * ## Examples
 * 
 * The following stories demonstrate:
 * 
 * 1. **Basic Popover**: Simple content display with text and button
 * 2. **With Form**: Form inputs inside popover (login, settings)
 * 3. **With Commands**: Command menu items for quick actions
 * 4. **Placements**: Different positioning (top, bottom, left, right)
 * 5. **Triggers**: Various trigger elements (button, icon, text)
 * 6. **Sizes**: Different popover widths (small, medium, large)
 */
const meta = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile overlay component for displaying rich contextual content anchored to a trigger element with smart positioning and animations.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Basic Popover
 * 
 * Simple popover with text content and action button. Click trigger to toggle.
 * 
 * ### Use Cases
 * - User profile preview
 * - Quick info display
 * - Contextual help
 * - Confirmation dialogs (lightweight)
 * - Feature announcements
 * 
 * ### Features
 * - Click trigger to open/close
 * - Click outside to close
 * - Escape key to close
 * - Default placement (bottom-center)
 * - Standard animations
 */
export const BasicPopover: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Tips & Updates</h4>
            <p className="text-sm text-muted-foreground">
              Stay up to date with the latest features and improvements.
            </p>
          </div>
          <Button size="sm" className="w-full">
            Learn More
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * ## With Form
 * 
 * Form inputs inside popover for quick data entry without navigating to new page.
 * 
 * ### Use Cases
 * - Login/Register forms
 * - Settings adjustments
 * - Quick note creation
 * - Filter configuration
 * - Profile editing
 * 
 * ### Implementation
 * ```tsx
 * const [value, setValue] = useState('');
 * 
 * const handleSubmit = (e: React.FormEvent) => {
 *   e.preventDefault();
 *   // Process form data
 *   setOpen(false); // Close popover after submit
 * };
 * ```
 * 
 * ### Best Practices
 * - Keep forms short (2-4 fields max)
 * - Auto-focus first input when opened
 * - Close popover on successful submit
 * - Show validation errors inline
 * - Use controlled state for form values
 */
export const WithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Submitted:', { name, email });
      setOpen(false);
      setName('');
      setEmail('');
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Profile Settings</h4>
              <p className="text-sm text-muted-foreground">
                Update your profile information.
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1">
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    );
  },
};

/**
 * ## With Commands
 * 
 * Command menu items for quick actions. Similar to context menu but triggered by click.
 * 
 * ### Use Cases
 * - Quick actions menu (edit, delete, share)
 * - Keyboard shortcuts reference
 * - Navigation menu
 * - Settings menu
 * - Tools menu
 * 
 * ### Implementation
 * Compose Command component inside PopoverContent for searchable menu:
 * ```tsx
 * <PopoverContent className="w-[300px] p-0">
 *   <Command>
 *     <CommandInput placeholder="Search actions..." />
 *     <CommandList>
 *       <CommandGroup>
 *         <CommandItem onSelect={() => handleAction('edit')}>
 *           Edit
 *         </CommandItem>
 *       </CommandGroup>
 *     </CommandList>
 *   </Command>
 * </PopoverContent>
 * ```
 */
export const WithCommands: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    const actions = [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
      { id: 'help', label: 'Help Center', icon: HelpCircle },
    ];

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">
            Quick Actions
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search actions..." />
            <CommandList>
              <CommandEmpty>No action found.</CommandEmpty>
              <CommandGroup heading="Quick Actions">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem
                      key={action.id}
                      value={action.id}
                      onSelect={() => {
                        console.log('Selected:', action.id);
                        setOpen(false);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
};

/**
 * ## Placements
 * 
 * Different positioning options: top, bottom, left, right. Auto-adjusts if space limited.
 * 
 * ### Available Sides
 * - `top`: Above trigger (slides from bottom)
 * - `bottom`: Below trigger (slides from top) - **default**
 * - `left`: Left of trigger (slides from right)
 * - `right`: Right of trigger (slides from left)
 * 
 * ### Alignment Options
 * - `start`: Align to start edge (left for top/bottom, top for left/right)
 * - `center`: Center align - **default**
 * - `end`: Align to end edge (right for top/bottom, bottom for left/right)
 * 
 * ### Collision Detection
 * Radix UI automatically adjusts placement if:
 * - Not enough space on preferred side
 * - Content would overflow viewport
 * - Boundary constraints set
 * 
 * ### Implementation
 * ```tsx
 * <PopoverContent side="top" align="start" sideOffset=8>
 *   ...content...
 * </PopoverContent>
 * ```
 */
export const Placements: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="space-y-4">
        <h4 className="text-center text-sm font-medium">Placement Examples</h4>
        <p className="text-center text-sm text-muted-foreground max-w-md">
          Click each button to see popover positioning. Auto-adjusts if viewport space is limited.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Top placement */}
        <div className="col-start-2 flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Top</Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64">
              <div className="space-y-2">
                <h5 className="font-medium">Top Placement</h5>
                <p className="text-sm text-muted-foreground">
                  Popover appears above the trigger element.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Left placement */}
        <div className="col-start-1 flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Left</Button>
            </PopoverTrigger>
            <PopoverContent side="left" className="w-64">
              <div className="space-y-2">
                <h5 className="font-medium">Left Placement</h5>
                <p className="text-sm text-muted-foreground">
                  Popover appears to the left of the trigger.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Center (default bottom) */}
        <div className="col-start-2 flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="default" size="sm">Bottom (Default)</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <h5 className="font-medium">Bottom Placement</h5>
                <p className="text-sm text-muted-foreground">
                  Default placement. Appears below trigger.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right placement */}
        <div className="col-start-3 flex items-center justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Right</Button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-64">
              <div className="space-y-2">
                <h5 className="font-medium">Right Placement</h5>
                <p className="text-sm text-muted-foreground">
                  Popover appears to the right of the trigger.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  ),
};

/**
 * ## Triggers
 * 
 * Various trigger elements: buttons, icons, text, custom components.
 * 
 * ### Trigger Types
 * - **Button**: Most common (primary, secondary, outline, ghost)
 * - **Icon button**: Compact trigger (help icon, info icon)
 * - **Text link**: Inline popover (definitions, previews)
 * - **Custom element**: Any clickable element (avatar, badge, card)
 * 
 * ### Using `asChild`
 * The `asChild` prop merges PopoverTrigger with child element:
 * ```tsx
 * <PopoverTrigger asChild>
 *   <Button>Click me</Button>
 * </PopoverTrigger>
 * ```
 * 
 * Without `asChild`, PopoverTrigger wraps child in a `<button>`:
 * ```tsx
 * <PopoverTrigger>
 *   <span>Click me</span> ...Wrapped in button...
 * </PopoverTrigger>
 * ```
 * 
 * ### Use Cases
 * - Help tooltips (info icon)
 * - User menus (avatar)
 * - Contextual actions (ellipsis icon)
 * - Inline definitions (text link)
 * - Date pickers (calendar input)
 */
export const Triggers: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-6">
      <div className="space-y-4">
        <h4 className="text-center text-sm font-medium">Various Trigger Types</h4>
        <p className="text-center text-sm text-muted-foreground max-w-md">
          Popovers can be triggered by buttons, icons, text links, or any clickable element.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Button trigger */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="default">Button Trigger</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-2">
              <h5 className="font-medium">Button Trigger</h5>
              <p className="text-sm text-muted-foreground">
                Most common trigger type for popovers.
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {/* Icon button trigger */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-2">
              <h5 className="font-medium">Icon Trigger</h5>
              <p className="text-sm text-muted-foreground">
                Compact trigger for contextual information.
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {/* Text link trigger */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-sm text-primary underline-offset-4 hover:underline">
              Learn more
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-2">
              <h5 className="font-medium">Text Link Trigger</h5>
              <p className="text-sm text-muted-foreground">
                Inline popovers for definitions and previews.
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {/* Help icon trigger */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-2">
              <h5 className="font-medium">Help Trigger</h5>
              <p className="text-sm text-muted-foreground">
                Contextual help without leaving the page.
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {/* Settings icon trigger */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <h5 className="font-medium">Quick Settings</h5>
                <p className="text-sm text-muted-foreground">
                  Adjust common preferences.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="setting-1">Auto-save</Label>
                <Input id="setting-1" type="checkbox" />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  ),
};

/**
 * ## Sizes
 * 
 * Different popover widths for varying content complexity.
 * 
 * ### Size Guidelines
 * - **Small** (`w-60`, 240px): Single action, brief info, simple form (1-2 fields)
 * - **Medium** (`w-72`, 288px): **Default**, standard forms (3-4 fields), lists
 * - **Large** (`w-96`, 384px): Complex forms (5+ fields), rich content, tables
 * - **Full width** (`w-screen max-w-md`): Mobile-friendly, extensive content
 * 
 * ### Implementation
 * ```tsx
 * <PopoverContent className="w-60">  ...Small...
 * <PopoverContent>              ...Medium (default w-72)...
 * <PopoverContent className="w-96">  ...Large...
 * ```
 * 
 * ### Responsive Sizing
 * Use responsive classes for adaptive width:
 * ```tsx
 * <PopoverContent className="w-full sm:w-96">
 *   ...Full width on mobile, 384px on tablet+...
 * </PopoverContent>
 * ```
 * 
 * ### Content Guidelines
 * - **Small**: 1-2 paragraphs or 3-5 list items
 * - **Medium**: 2-3 paragraphs or 5-8 list items or 3-4 form fields
 * - **Large**: 3+ paragraphs or 8+ list items or 5+ form fields or small table
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-6">
      <div className="space-y-4">
        <h4 className="text-center text-sm font-medium">Popover Sizes</h4>
        <p className="text-center text-sm text-muted-foreground max-w-md">
          Choose width based on content complexity. Default is medium (288px).
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Small popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">Small (240px)</Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="space-y-2">
              <h5 className="font-medium">Small Popover</h5>
              <p className="text-sm text-muted-foreground">
                Brief information or single action.
              </p>
              <Button size="sm" className="w-full">Action</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Medium popover (default) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="default" size="sm">Medium (288px - Default)</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <h5 className="font-medium">Medium Popover</h5>
                <p className="text-sm text-muted-foreground">
                  Standard size for most use cases. Fits 3-4 form fields comfortably.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="input-1">Username</Label>
                <Input id="input-1" placeholder="Enter username" />
              </div>
              <Button size="sm" className="w-full">Submit</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Large popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">Large (384px)</Button>
          </PopoverTrigger>
          <PopoverContent className="w-96">
            <div className="space-y-3">
              <div className="space-y-2">
                <h5 className="font-medium">Large Popover</h5>
                <p className="text-sm text-muted-foreground">
                  For complex forms with 5+ fields or rich content displays.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter description" rows={3} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">Save</Button>
                <Button variant="outline" size="sm" className="flex-1">Cancel</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  ),
};
