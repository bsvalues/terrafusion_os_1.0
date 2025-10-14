import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { 
  Home, FileText, Users, Settings, ChevronDown, 
  LayoutDashboard, BarChart3, Package, ShoppingCart,
  Inbox, Calendar, Search, Bell, User, LogOut
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './navigation-menu';
import { cn } from '@/lib/utils';

/**
 * # NavigationMenu Component
 * 
 * A collection of links for navigating websites, with dropdown content support
 * for organizing navigation items hierarchically.
 * 
 * ## Features
 * - **Mega Menus:** Dropdown content with rich layouts
 * - **Keyboard Navigation:** Full arrow key and Enter/Escape support
 * - **Hover & Click:** Works with both interaction methods
 * - **Responsive:** Adapts to different screen sizes
 * - **Smooth Animations:** Content animates in/out gracefully
 * - **Accessibility:** Complete ARIA implementation
 * 
 * ## Use Cases
 * - Website navigation headers
 * - Product category menus
 * - Documentation navigation
 * - Application main navigation
 * 
 * Built on @radix-ui/react-navigation-menu
 */

const meta: Meta<typeof NavigationMenu> = {
  title: 'Components/NavigationMenu',
  component: NavigationMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A navigation menu with dropdown content for organizing site navigation.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NavigationMenu>;

/**
 * ## Default Navigation Menu
 * 
 * Basic navigation menu with simple links.
 */
export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            <FileText className="mr-2 h-4 w-4" />
            Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            <Users className="mr-2 h-4 w-4" />
            Team
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/**
 * ## With Dropdown Content
 * 
 * Navigation menu with dropdown panels containing links and descriptions.
 */
export const WithDropdown: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px]">
              <ListItem href="/docs" title="Introduction">
                Re-usable components built using Radix UI and Tailwind CSS.
              </ListItem>
              <ListItem href="/docs/installation" title="Installation">
                How to install dependencies and structure your app.
              </ListItem>
              <ListItem href="/docs/primitives/typography" title="Typography">
                Styles for headings, paragraphs, lists...etc
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/**
 * ## With Icons
 * 
 * Navigation items with icon prefixes for better visual recognition.
 */
export const WithIcons: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px]">
              <ListItem href="/dashboard/overview" title="Overview">
                <BarChart3 className="mr-2 inline h-4 w-4" />
                View your key metrics and analytics
              </ListItem>
              <ListItem href="/dashboard/reports" title="Reports">
                <FileText className="mr-2 inline h-4 w-4" />
                Generate and download reports
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Package className="mr-2 h-4 w-4" />
            Products
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px]">
              <ListItem href="/products/catalog" title="Catalog">
                <Package className="mr-2 inline h-4 w-4" />
                Browse all products
              </ListItem>
              <ListItem href="/products/orders" title="Orders">
                <ShoppingCart className="mr-2 inline h-4 w-4" />
                Manage customer orders
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/**
 * ## Mega Menu Layout
 * 
 * Rich dropdown content with multiple columns and sections.
 */
export const MegaMenu: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-4 p-6 md:w-[600px] lg:w-[800px] lg:grid-cols-3">
              <div className="space-y-3">
                <h4 className="text-sm font-medium leading-none">Categories</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:underline">Electronics</a></li>
                  <li><a href="#" className="hover:underline">Clothing</a></li>
                  <li><a href="#" className="hover:underline">Home & Garden</a></li>
                  <li><a href="#" className="hover:underline">Sports</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium leading-none">Collections</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:underline">New Arrivals</a></li>
                  <li><a href="#" className="hover:underline">Best Sellers</a></li>
                  <li><a href="#" className="hover:underline">Sale Items</a></li>
                  <li><a href="#" className="hover:underline">Trending</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium leading-none">Brands</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:underline">Brand A</a></li>
                  <li><a href="#" className="hover:underline">Brand B</a></li>
                  <li><a href="#" className="hover:underline">Brand C</a></li>
                  <li><a href="#" className="hover:underline">View All</a></li>
                </ul>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            About
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Contact
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/**
 * ## Real-World: Website Header
 * 
 * Complete website navigation with products, resources, and company sections.
 */
export const RealWorldHeader: Story = {
  render: () => (
    <div className="w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold">TerraFusion</div>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[600px] lg:grid-cols-2">
                    <ListItem href="/products/analytics" title="Analytics Platform">
                      <BarChart3 className="mr-2 inline h-4 w-4" />
                      Real-time data visualization and insights
                    </ListItem>
                    <ListItem href="/products/dashboard" title="Dashboard Builder">
                      <LayoutDashboard className="mr-2 inline h-4 w-4" />
                      Create custom dashboards in minutes
                    </ListItem>
                    <ListItem href="/products/api" title="API Access">
                      <FileText className="mr-2 inline h-4 w-4" />
                      RESTful API for integrations
                    </ListItem>
                    <ListItem href="/products/mobile" title="Mobile Apps">
                      <Package className="mr-2 inline h-4 w-4" />
                      iOS and Android applications
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px]">
                    <ListItem href="/docs" title="Documentation">
                      <FileText className="mr-2 inline h-4 w-4" />
                      Comprehensive guides and API references
                    </ListItem>
                    <ListItem href="/blog" title="Blog">
                      <FileText className="mr-2 inline h-4 w-4" />
                      Latest news and best practices
                    </ListItem>
                    <ListItem href="/community" title="Community">
                      <Users className="mr-2 inline h-4 w-4" />
                      Join our developer community
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>Company</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[300px]">
                    <ListItem href="/about" title="About Us">
                      Our mission and team
                    </ListItem>
                    <ListItem href="/careers" title="Careers">
                      Join our growing team
                    </ListItem>
                    <ListItem href="/contact" title="Contact">
                      Get in touch with us
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="rounded-md px-4 py-2 text-sm hover:bg-accent">Sign In</button>
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">Get Started</button>
        </div>
      </div>
    </div>
  ),
};

/**
 * ## Real-World: Dashboard Navigation
 * 
 * Application navigation for dashboard interface.
 */
export const RealWorldDashboard: Story = {
  render: () => (
    <div className="w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-background p-4">
        <div className="flex items-center gap-8">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <Package className="mr-2 h-4 w-4" />
                  Projects
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px]">
                    <ListItem href="/projects/active" title="Active Projects">
                      View and manage your active projects
                    </ListItem>
                    <ListItem href="/projects/archived" title="Archived">
                      Browse archived project history
                    </ListItem>
                    <ListItem href="/projects/new" title="Create New">
                      Start a new project
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="rounded-md p-2 hover:bg-accent">
            <Search className="h-5 w-5" />
          </button>
          <button className="rounded-md p-2 hover:bg-accent">
            <Bell className="h-5 w-5" />
          </button>
          <button className="rounded-md p-2 hover:bg-accent">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
        Dashboard content area
      </div>
    </div>
  ),
};

/**
 * ## Usage Guidelines
 * 
 * ### When to Use
 * - ✅ Website primary navigation
 * - ✅ Organizing content into categories with subcategories
 * - ✅ E-commerce product menus
 * - ✅ Documentation site navigation
 * - ✅ Application main navigation
 * 
 * ### When Not to Use
 * - ❌ Application menu bars (use Menubar instead)
 * - ❌ Context menus (use DropdownMenu)
 * - ❌ Mobile navigation (use Sheet/Drawer)
 * - ❌ Excessive nesting (keep it simple)
 * 
 * ### Keyboard Navigation
 * 
 * | Key | Action |
 * |-----|--------|
 * | `Tab` | Move focus to/from navigation |
 * | `→ / ←` | Navigate between triggers |
 * | `↓` | Open dropdown and move to first item |
 * | `↑` | Move to last item in dropdown |
 * | `Enter / Space` | Activate focused link |
 * | `Escape` | Close dropdown |
 * | `Home / End` | Jump to first/last trigger |
 * 
 * ### Best Practices
 * 
 * **Do:**
 * - Keep navigation structure shallow (1-2 levels)
 * - Use clear, descriptive labels
 * - Group related items logically
 * - Include search for large sites
 * - Make active page visually distinct
 * - Ensure touch targets are large enough (44px minimum)
 * - Test on mobile devices
 * - Provide alternative navigation for mobile
 * 
 * **Don't:**
 * - Don't create overly complex mega menus
 * - Don't hide essential navigation in dropdowns
 * - Don't use too many top-level items (5-7 max)
 * - Don't forget hover states
 * - Don't use only icons without labels
 * - Don't nest more than 2 levels deep
 * 
 * ### Accessibility
 * 
 * - Full keyboard navigation support
 * - ARIA navigation role and attributes
 * - Focus management and visual indicators
 * - Screen reader friendly labels
 * - Respects prefers-reduced-motion
 * - Touch-friendly for mobile devices
 * 
 * ### Common Patterns
 * 
 * ```tsx
 * // Simple navigation
 * <NavigationMenu>
 *   <NavigationMenuList>
 *     <NavigationMenuItem>
 *       <NavigationMenuLink className={navigationMenuTriggerStyle()}>
 *         Home
 *       </NavigationMenuLink>
 *     </NavigationMenuItem>
 *   </NavigationMenuList>
 * </NavigationMenu>
 * 
 * // With dropdown
 * <NavigationMenuItem>
 *   <NavigationMenuTrigger>Products</NavigationMenuTrigger>
 *   <NavigationMenuContent>
 *     <ul className="grid gap-3 p-6 md:w-[400px]">
 *       <ListItem href="/product1" title="Product 1">
 *         Description here
 *       </ListItem>
 *     </ul>
 *   </NavigationMenuContent>
 * </NavigationMenuItem>
 * ```
 */
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">✅ Do's</h3>
        <ul className="space-y-2 text-sm">
          <li>✓ Keep navigation structure shallow (1-2 levels max)</li>
          <li>✓ Use clear, descriptive labels for all items</li>
          <li>✓ Group related items together logically</li>
          <li>✓ Ensure touch targets are at least 44px</li>
          <li>✓ Provide alternative navigation for mobile</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">❌ Don'ts</h3>
        <ul className="space-y-2 text-sm">
          <li>✗ Don't create overly complex mega menus</li>
          <li>✗ Don't hide essential navigation in dropdowns</li>
          <li>✗ Don't use more than 5-7 top-level items</li>
          <li>✗ Don't nest more than 2 levels deep</li>
          <li>✗ Don't use only icons without text labels</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Example Usage</h3>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>More</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[300px]">
                  <ListItem href="#" title="Option 1">
                    Description for option 1
                  </ListItem>
                  <ListItem href="#" title="Option 2">
                    Description for option 2
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  ),
};

// Helper component for list items
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
});
ListItem.displayName = "ListItem";

// Sample data
const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
];
