import type { Meta, StoryObj } from '@storybook/react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose 
} from './sheet';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Separator } from './separator';
import { 
  HomeIcon, 
  FileTextIcon, 
  GearIcon, 
  PersonIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ExitIcon
} from '@radix-ui/react-icons';
import { useState } from 'react';

/**
 * # Sheet Component
 * 
 * A versatile slide-out panel component that overlays content from the edges of the viewport.
 * Built on Radix UI Dialog primitives with directional animations.
 * 
 * ## Features
 * - **4 Slide Directions**: Top, Bottom, Left, Right
 * - **Portal Rendering**: Overlays existing content
 * - **Focus Management**: Traps focus within sheet
 * - **Keyboard Accessible**: Escape to close, Tab navigation
 * - **Responsive**: Mobile-friendly with touch gestures
 * - **Customizable**: Headers, footers, scrollable content
 * 
 * ## Common Use Cases
 * - **Mobile Navigation**: Hamburger menu drawers
 * - **Settings Panels**: Quick access to preferences
 * - **Shopping Carts**: E-commerce checkout flows
 * - **Filters**: Search and filter sidebars
 * - **Notifications**: Slide-in notification panels
 * - **User Profiles**: Account information panels
 * 
 * ## Architecture
 * Built on `@radix-ui/react-dialog` with custom slide animations via `class-variance-authority`.
 * 
 * ### Sub-components:
 * - **Sheet**: Root component (context provider)
 * - **SheetTrigger**: Button to open sheet
 * - **SheetContent**: Main content container with side prop
 * - **SheetHeader**: Header section with title/description
 * - **SheetFooter**: Footer section for actions
 * - **SheetTitle**: Accessible title (aria-labelledby)
 * - **SheetDescription**: Accessible description (aria-describedby)
 * - **SheetClose**: Button to close sheet
 * - **SheetPortal**: Portal for overlay rendering
 * - **SheetOverlay**: Background overlay (semi-transparent)
 * 
 * @component
 */
const meta: Meta<typeof Sheet> = {
  title: 'UI/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Slide-out panels for navigation, settings, and contextual actions. Essential for mobile-first designs.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sheet>;

/**
 * ## Basic Sheet - Four Directions
 * 
 * Demonstrates all four slide directions: **Top**, **Bottom**, **Left**, **Right**.
 * 
 * ### When to use:
 * - **Left/Right**: Navigation menus, filters, settings (most common)
 * - **Top**: Notifications, alerts, quick actions
 * - **Bottom**: Mobile actions, confirmations, bottom sheets (iOS style)
 * 
 * ### Behavior:
 * - Click button to open sheet from specified direction
 * - Click overlay or X button to close
 * - Press Escape to close
 * - Focus trapped within sheet when open
 * 
 * ### Default Side:
 * `side="right"` is the default if not specified.
 */
export const BasicSheet: Story = {
  render: () => {
    const [openTop, setOpenTop] = useState(false);
    const [openBottom, setOpenBottom] = useState(false);
    const [openLeft, setOpenLeft] = useState(false);
    const [openRight, setOpenRight] = useState(false);

    return (
      <div className="flex flex-wrap gap-4 p-8">
        {/* Top Sheet */}
        <Sheet open={openTop} onOpenChange={setOpenTop}>
          <SheetTrigger asChild>
            <Button variant="outline">Open Top</Button>
          </SheetTrigger>
          <SheetContent side="top">
            <SheetHeader>
              <SheetTitle>Slide from Top</SheetTitle>
              <SheetDescription>
                This sheet slides in from the top of the viewport. Perfect for notifications or alerts.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Top sheets are ideal for temporary messages, search bars, or quick actions that don't 
                require full-screen focus.
              </p>
            </div>
          </SheetContent>
        </Sheet>

        {/* Bottom Sheet */}
        <Sheet open={openBottom} onOpenChange={setOpenBottom}>
          <SheetTrigger asChild>
            <Button variant="outline">Open Bottom</Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Slide from Bottom</SheetTitle>
              <SheetDescription>
                This sheet slides in from the bottom. Common in mobile apps for contextual actions.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Bottom sheets are popular in mobile design for confirmations, share dialogs, and 
                action menus. They feel native on iOS and Android.
              </p>
            </div>
          </SheetContent>
        </Sheet>

        {/* Left Sheet */}
        <Sheet open={openLeft} onOpenChange={setOpenLeft}>
          <SheetTrigger asChild>
            <Button variant="outline">Open Left</Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Slide from Left</SheetTitle>
              <SheetDescription>
                This sheet slides in from the left side. Commonly used for navigation menus.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Left sheets are the traditional "hamburger menu" pattern in web apps. They provide 
                primary navigation without leaving the current page.
              </p>
            </div>
          </SheetContent>
        </Sheet>

        {/* Right Sheet (Default) */}
        <Sheet open={openRight} onOpenChange={setOpenRight}>
          <SheetTrigger asChild>
            <Button variant="default">Open Right (Default)</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Slide from Right</SheetTitle>
              <SheetDescription>
                This is the default sheet direction. Commonly used for settings and details.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Right sheets are ideal for secondary actions like settings, filters, or detailed 
                information panels. They don't interfere with primary navigation.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  },
};

/**
 * ## Sheet with Form
 * 
 * Form inputs inside a sheet for quick data entry without full-page navigation.
 * 
 * ### Use Cases:
 * - **Edit Profile**: Quick profile updates
 * - **Add Item**: Create new records
 * - **Settings**: Preference adjustments
 * - **Filters**: Search and filter forms
 * 
 * ### Form Handling:
 * - Use `onSubmit` to handle form submission
 * - Close sheet on successful submit with `setOpen(false)`
 * - Validate inputs before closing
 * - Show loading states during async operations
 * 
 * ### Accessibility:
 * - Label all inputs with `<Label>`
 * - Use `htmlFor` to link labels to inputs
 * - Add `required` and validation as needed
 * - Provide clear error messages
 */
export const WithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('John Doe');
    const [email, setEmail] = useState('john@example.com');
    const [username, setUsername] = useState('@johndoe');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted:', { name, email, username });
      // Simulate successful save
      setOpen(false);
    };

    return (
      <div className="p-8">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>Edit Profile</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you're done.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@username"
                  />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit">Save Changes</Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    );
  },
};

/**
 * ## Sheet with Navigation
 * 
 * Mobile-style navigation menu with links and icons.
 * 
 * ### Navigation Patterns:
 * - **Primary Links**: Home, Documents, Settings, Profile
 * - **Icon + Text**: Visual hierarchy with Radix UI icons
 * - **Hover States**: Interactive feedback
 * - **Active States**: Highlight current page
 * - **Sections**: Group related links with separators
 * 
 * ### Mobile Navigation Best Practices:
 * 1. Keep menu items to 5-8 for easy scanning
 * 2. Use clear, concise labels
 * 3. Add icons for faster recognition
 * 4. Include close button for easy dismissal
 * 5. Auto-close on link click (single-page apps)
 * 
 * ### Implementation:
 * ```tsx
 * <Sheet>
 *   <SheetTrigger asChild>
 *     <Button variant="ghost" size="icon">
 *       <MenuIcon />
 *     </Button>
 *   </SheetTrigger>
 *   <SheetContent side="left">
 *     <nav>
 *       <a href="#" onClick={() => setOpen(false)}>Home</a>
 *     </nav>
 *   </SheetContent>
 * </Sheet>
 * ```
 */
export const WithNavigation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    const navItems = [
      { icon: HomeIcon, label: 'Home', href: '#', active: true },
      { icon: FileTextIcon, label: 'Documents', href: '#', active: false },
      { icon: MagnifyingGlassIcon, label: 'Search', href: '#', active: false },
      { icon: BellIcon, label: 'Notifications', href: '#', badge: 3, active: false },
    ];

    const settingsItems = [
      { icon: PersonIcon, label: 'Profile', href: '#' },
      { icon: GearIcon, label: 'Settings', href: '#' },
      { icon: ExitIcon, label: 'Logout', href: '#' },
    ];

    return (
      <div className="p-8">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <svg
                className="mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>
                Browse and navigate through the application
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      item.active
                        ? 'bg-secondary text-secondary-foreground'
                        : 'hover:bg-secondary/50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </a>
                ))}
              </nav>

              <Separator className="my-4" />

              <nav className="space-y-1">
                {settingsItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary/50"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  },
};

/**
 * ## Scrollable Content
 * 
 * Handle large amounts of content with internal scrolling.
 * 
 * ### Scrolling Patterns:
 * - **Fixed Header**: Title and description stay visible
 * - **Scrollable Body**: Long content scrolls independently
 * - **Fixed Footer**: Actions remain accessible
 * - **Scroll Indicators**: Visual cues for more content
 * 
 * ### Implementation:
 * ```tsx
 * <SheetContent>
 *   <SheetHeader>...Fixed...</SheetHeader>
 *   <div className="flex-1 overflow-y-auto">...Scrollable...</div>
 *   <SheetFooter>...Fixed...</SheetFooter>
 * </SheetContent>
 * ```
 * 
 * ### Content Guidelines:
 * - Keep headers concise (1-2 lines max)
 * - Add padding to scrollable areas
 * - Use visual separators between sections
 * - Consider infinite scroll for very long lists
 * - Add "Back to top" for long content
 */
export const ScrollableContent: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    const items = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      title: `Item ${i + 1}`,
      description: `This is a detailed description for item ${i + 1}. It contains multiple lines of text to demonstrate scrolling behavior.`,
    }));

    return (
      <div className="p-8">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>View Long List</Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>Scrollable Content</SheetTitle>
              <SheetDescription>
                This sheet contains a long list of items with internal scrolling.
              </SheetDescription>
            </SheetHeader>
            
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto py-4 pr-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="rounded-md border p-4">
                    <h4 className="mb-1 font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <SheetFooter className="border-t pt-4">
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
              <Button>Save Selection</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    );
  },
};

/**
 * ## Sheet with Footer Actions
 * 
 * Confirmation dialogs and forms with action buttons in the footer.
 * 
 * ### Footer Patterns:
 * - **Save/Cancel**: Most common pattern
 * - **Delete/Cancel**: Destructive actions
 * - **Previous/Next**: Multi-step flows
 * - **Submit**: Single action confirmation
 * 
 * ### Button Guidelines:
 * - **Primary Action**: Right side, solid button
 * - **Cancel**: Left side, outline button
 * - **Destructive**: Use `variant="destructive"`
 * - **Loading**: Disable buttons during async operations
 * 
 * ### SheetFooter Classes:
 * - Desktop: `flex-row justify-end space-x-2`
 * - Mobile: `flex-col-reverse` (primary action on top)
 * 
 * ### Accessibility:
 * - Use semantic button types (`type="submit"`, `type="button"`)
 * - Add loading states with aria-busy
 * - Provide clear action labels
 */
export const WithFooter: Story = {
  render: () => {
    const [openSave, setOpenSave] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openMultiStep, setOpenMultiStep] = useState(false);
    const [step, setStep] = useState(1);

    const handleDelete = () => {
      console.log('Delete confirmed');
      setOpenDelete(false);
    };

    const handleNext = () => {
      if (step < 3) setStep(step + 1);
      else {
        console.log('Wizard completed');
        setOpenMultiStep(false);
        setStep(1);
      }
    };

    return (
      <div className="flex gap-4 p-8">
        {/* Save/Cancel Pattern */}
        <Sheet open={openSave} onOpenChange={setOpenSave}>
          <SheetTrigger asChild>
            <Button variant="outline">Save/Cancel</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Document</SheetTitle>
              <SheetDescription>
                Make changes to your document. Your changes will be saved.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" defaultValue="Untitled Document" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <textarea
                    id="content"
                    className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="Start typing your content here..."
                  />
                </div>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                onClick={() => {
                  console.log('Saved');
                  setOpenSave(false);
                }}
              >
                Save Changes
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Delete/Cancel Pattern */}
        <Sheet open={openDelete} onOpenChange={setOpenDelete}>
          <SheetTrigger asChild>
            <Button variant="destructive">Delete Item</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Delete Item</SheetTitle>
              <SheetDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm">
                  <strong>Warning:</strong> Deleting this item will permanently remove all 
                  associated data. Make sure you have a backup if needed.
                </p>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Permanently
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Multi-step Pattern */}
        <Sheet open={openMultiStep} onOpenChange={setOpenMultiStep}>
          <SheetTrigger asChild>
            <Button variant="outline">Multi-Step</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Setup Wizard - Step {step} of 3</SheetTitle>
              <SheetDescription>
                Follow these steps to complete the setup process.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Step 1: Basic Information</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Enter your name" />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Step 2: Contact Details</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" />
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Step 3: Review</h4>
                  <p className="text-sm text-muted-foreground">
                    Please review your information before submitting.
                  </p>
                </div>
              )}
            </div>
            <SheetFooter>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button onClick={handleNext}>Finish</Button>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    );
  },
};

/**
 * ## Nested Sheets
 * 
 * Open sheets from within sheets for complex workflows.
 * 
 * ### Nesting Patterns:
 * - **Primary → Secondary**: Main action → confirmation
 * - **List → Detail**: Browse → view details
 * - **Form → Help**: Input → contextual help
 * 
 * ### Best Practices:
 * 1. **Limit Depth**: Maximum 2-3 levels
 * 2. **Clear Context**: Each sheet should have clear purpose
 * 3. **Close Order**: Inner sheets close first
 * 4. **Breadcrumbs**: Show navigation depth
 * 5. **Escape Key**: Closes current sheet only
 * 
 * ### Warning:
 * Deep nesting can be confusing. Consider alternative patterns:
 * - Multi-step wizards (single sheet, multiple steps)
 * - Tabs within sheet (single sheet, tabbed content)
 * - Modal dialogs for confirmations (lighter weight)
 */
export const NestedSheets: Story = {
  render: () => {
    const [openPrimary, setOpenPrimary] = useState(false);
    const [openSecondary, setOpenSecondary] = useState(false);

    return (
      <div className="p-8">
        <Sheet open={openPrimary} onOpenChange={setOpenPrimary}>
          <SheetTrigger asChild>
            <Button>Open Primary Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Primary Sheet</SheetTitle>
              <SheetDescription>
                This is the main sheet. You can open a secondary sheet from here.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Nested sheets are useful for complex workflows where you need to show related 
                content without losing context.
              </p>
              
              <div className="rounded-md border p-4">
                <h4 className="mb-2 font-semibold">Example Use Case:</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  You're editing a document and need to insert an image. Click the button below 
                  to open the image picker without closing the main editor.
                </p>

                {/* Secondary Sheet */}
                <Sheet open={openSecondary} onOpenChange={setOpenSecondary}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      Insert Image
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Select Image</SheetTitle>
                      <SheetDescription>
                        Choose an image to insert into your document.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="aspect-square cursor-pointer rounded-md border bg-muted hover:border-primary"
                          >
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              Image {i}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </SheetClose>
                      <Button
                        onClick={() => {
                          console.log('Image inserted');
                          setOpenSecondary(false);
                        }}
                      >
                        Insert Selected
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="rounded-md bg-yellow-500/10 border border-yellow-500/50 p-4">
                <p className="text-sm">
                  <strong>Tip:</strong> Keep nesting to a minimum. More than 2-3 levels becomes 
                  difficult to navigate. Consider alternative patterns like tabs or wizards.
                </p>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    );
  },
};

/**
 * ## Usage Guidelines
 * 
 * Best practices, dos and don'ts, and implementation guidance.
 * 
 * ### ✅ Do's
 * 
 * 1. **Use for Contextual Actions**
 *    ```tsx
 *    // ✅ Shopping cart (doesn't navigate away)
 *    <Sheet side="right">
 *      <SheetTrigger>Cart (3 items)</SheetTrigger>
 *      <SheetContent>...Cart items...</SheetContent>
 *    </Sheet>
 *    ```
 * 
 * 2. **Provide Clear Close Actions**
 *    ```tsx
 *    // ✅ Multiple ways to close
 *    <SheetContent>
 *      ...X button (automatic)...
 *      <SheetClose asChild>
 *        <Button>Cancel</Button>
 *      </SheetClose>
 *      ...Click overlay (automatic)...
 *      ...Escape key (automatic)...
 *    </SheetContent>
 *    ```
 * 
 * 3. **Use Appropriate Side**
 *    ```tsx
 *    // ✅ Left for navigation
 *    <Sheet side="left">...Menu items...</Sheet>
 *    
 *    // ✅ Right for details/settings
 *    <Sheet side="right">...Form fields...</Sheet>
 *    
 *    // ✅ Bottom for mobile actions
 *    <Sheet side="bottom">...Quick actions...</Sheet>
 *    ```
 * 
 * 4. **Mobile-First Widths**
 *    ```tsx
 *    // ✅ Responsive width (75% on mobile, 384px on desktop)
 *    // Default behavior: w-3/4 sm:max-w-sm
 *    ```
 * 
 * 5. **Controlled State for Complex Flows**
 *    ```tsx
 *    // ✅ Controlled state with validation
 *    const [open, setOpen] = useState(false);
 *    
 *    const handleSubmit = () => {
 *      if (isValid) setOpen(false);
 *    };
 *    ```
 * 
 * 6. **Loading States**
 *    ```tsx
 *    // ✅ Show loading feedback
 *    <Button disabled={isLoading}>
 *      {isLoading ? 'Saving...' : 'Save'}
 *    </Button>
 *    ```
 * 
 * ### ❌ Don'ts
 * 
 * 1. **Don't Use for Critical Confirmations**
 *    ```tsx
 *    // ❌ Use Dialog for important confirmations
 *    <Sheet>...Delete account?...</Sheet>
 *    
 *    // ✅ Use Dialog instead
 *    <Dialog>...Delete account?...</Dialog>
 *    ```
 * 
 * 2. **Don't Nest Too Deeply**
 *    ```tsx
 *    // ❌ 4+ levels of nesting
 *    <Sheet>
 *      <Sheet>
 *        <Sheet>
 *          <Sheet>...Too deep!...</Sheet>
 *        </Sheet>
 *      </Sheet>
 *    </Sheet>
 *    
 *    // ✅ Maximum 2-3 levels, or use alternatives
 *    ```
 * 
 * 3. **Don't Overcrowd Content**
 *    ```tsx
 *    // ❌ Too much content without scrolling
 *    <SheetContent>...50 items, no scroll...</SheetContent>
 *    
 *    // ✅ Add scrolling for long content
 *    <div className="overflow-y-auto">...Content...</div>
 *    ```
 * 
 * 4. **Don't Use for Full-Page Content**
 *    ```tsx
 *    // ❌ Entire page in a sheet
 *    <Sheet>...All content...</Sheet>
 *    
 *    // ✅ Navigate to a new page instead
 *    <Link to="/page">...Full page...</Link>
 *    ```
 * 
 * ### Common Patterns
 * 
 * #### Mobile Navigation Menu
 * ```tsx
 * <Sheet>
 *   <SheetTrigger asChild>
 *     <Button variant="ghost" size="icon">
 *       <MenuIcon />
 *     </Button>
 *   </SheetTrigger>
 *   <SheetContent side="left">
 *     <nav>...Navigation links...</nav>
 *   </SheetContent>
 * </Sheet>
 * ```
 * 
 * #### Shopping Cart
 * ```tsx
 * <Sheet>
 *   <SheetTrigger asChild>
 *     <Button>Cart (itemCount)</Button>
 *   </SheetTrigger>
 *   <SheetContent side="right">
 *     <SheetHeader>
 *       <SheetTitle>Shopping Cart</SheetTitle>
 *     </SheetHeader>
 *     <div className="overflow-y-auto">...Cart items...</div>
 *     <SheetFooter>
 *       <Button>Checkout</Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 * ```
 * 
 * #### Filters Panel
 * ```tsx
 * <Sheet>
 *   <SheetTrigger asChild>
 *     <Button variant="outline">Filters</Button>
 *   </SheetTrigger>
 *   <SheetContent>
 *     <SheetHeader>
 *       <SheetTitle>Filter Results</SheetTitle>
 *     </SheetHeader>
 *     <div>...Filter checkboxes, sliders, etc....</div>
 *     <SheetFooter>
 *       <Button variant="outline" onClick=clearFilters>
 *         Clear All
 *       </Button>
 *       <Button>Apply Filters</Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 * ```
 * 
 * ### Accessibility Checklist
 * 
 * - [ ] **Focus Management**: First focusable element receives focus on open
 * - [ ] **Focus Trap**: Tab/Shift+Tab cycles within sheet
 * - [ ] **Escape Key**: Closes sheet (unless prevented)
 * - [ ] **Overlay Click**: Closes sheet (unless prevented)
 * - [ ] **Accessible Labels**: SheetTitle provides aria-labelledby
 * - [ ] **Descriptions**: SheetDescription provides aria-describedby
 * - [ ] **Close Button**: Always visible with accessible label
 * - [ ] **Form Labels**: All inputs have associated labels
 * - [ ] **Keyboard Navigation**: All interactive elements reachable via keyboard
 * - [ ] **Screen Reader**: Announces sheet open/close states
 * 
 * ### Performance Tips
 * 
 * 1. **Lazy Load Content**: Don't render sheet content until opened
 *    ```tsx
 *    open && <SheetContent>...Heavy content...</SheetContent>
 *    ```
 * 
 * 2. **Debounce Search**: Delay search queries in filter sheets
 *    ```tsx
 *    const debouncedSearch = useDebouncedCallback(search, 300);
 *    ```
 * 
 * 3. **Virtualize Long Lists**: Use react-window for 100+ items
 *    ```tsx
 *    import { FixedSizeList } from 'react-window';
 *    ```
 * 
 * 4. **Optimize Animations**: Reduce motion for accessibility
 *    ```tsx
 *    @media (prefers-reduced-motion: reduce) {
 *      [data-state] { transition: none; }
 *    }
 *    ```
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="max-w-4xl space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Sheet Component Guidelines</h2>
        <p className="text-muted-foreground">
          Follow these best practices to create effective slide-out panels.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">✅ Do's</h3>
        <ul className="list-inside list-disc space-y-2 text-sm">
          <li>Use sheets for contextual actions that don't require full-page navigation</li>
          <li>Provide multiple ways to close (X button, overlay, Escape)</li>
          <li>Choose appropriate side: left for navigation, right for details, bottom for mobile</li>
          <li>Use responsive widths (75% mobile, 384px desktop)</li>
          <li>Add loading states for async operations</li>
          <li>Implement scrolling for long content</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">❌ Don'ts</h3>
        <ul className="list-inside list-disc space-y-2 text-sm">
          <li>Don't use sheets for critical confirmations (use Dialog instead)</li>
          <li>Don't nest more than 2-3 levels deep</li>
          <li>Don't overcrowd with content (add scrolling)</li>
          <li>Don't use for full-page content (navigate instead)</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Accessibility Checklist</h3>
        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>Focus trapped within sheet when open</li>
          <li>Escape key closes sheet</li>
          <li>Click overlay to close</li>
          <li>SheetTitle provides accessible label</li>
          <li>All inputs have labels</li>
          <li>Close button always visible</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Common Use Cases</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border p-4">
            <h4 className="mb-2 font-semibold">Mobile Navigation</h4>
            <p className="text-sm text-muted-foreground">
              Hamburger menu with primary navigation links. Slides from left.
            </p>
          </div>
          <div className="rounded-md border p-4">
            <h4 className="mb-2 font-semibold">Shopping Cart</h4>
            <p className="text-sm text-muted-foreground">
              Quick checkout without leaving product pages. Slides from right.
            </p>
          </div>
          <div className="rounded-md border p-4">
            <h4 className="mb-2 font-semibold">Filters Panel</h4>
            <p className="text-sm text-muted-foreground">
              Search and filter options for data tables. Slides from right.
            </p>
          </div>
          <div className="rounded-md border p-4">
            <h4 className="mb-2 font-semibold">Settings</h4>
            <p className="text-sm text-muted-foreground">
              Quick access to preferences without full-page navigation.
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};
