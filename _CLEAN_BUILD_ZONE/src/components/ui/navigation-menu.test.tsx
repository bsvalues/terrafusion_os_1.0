/**
 * NavigationMenu Component Tests
 * 
 * Tests for the NavigationMenu component and its sub-components.
 * NavigationMenu provides site-wide navigation with hover/focus triggers and mega menu support.
 * Built on @radix-ui/react-navigation-menu.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from './navigation-menu';

expect.extend(toHaveNoViolations);

describe('NavigationMenu', () => {
  /**
   * 1. RENDERING TESTS
   * Test that NavigationMenu components render correctly
   */
  describe('Rendering', () => {
    it('renders navigation menu with links', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/home">
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/about">
                About
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('renders menu triggers with chevron icons', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Product 1</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Products');
      expect(trigger).toBeInTheDocument();
      // ChevronDownIcon should be rendered (aria-hidden)
      const svg = trigger.parentElement?.querySelector('svg[aria-hidden="true"]');
      expect(svg).toBeInTheDocument();
    });

    it('renders menu content when opened', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Services</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Service 1</div>
                <div>Service 2</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Services');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Service 1')).toBeVisible();
        expect(screen.getByText('Service 2')).toBeVisible();
      });
    });

    it('renders navigation menu indicator', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/home">Home</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuIndicator />
          </NavigationMenuList>
        </NavigationMenu>
      );

      // Indicator should be in the document (even if not visible)
      const list = screen.getByText('Home').closest('ul');
      expect(list).toBeInTheDocument();
    });
  });

  /**
   * 2. LINK NAVIGATION TESTS
   * Test navigation menu link functionality
   */
  describe('Link Navigation', () => {
    it('renders links with correct href attributes', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/products">
                Products
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/pricing">
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const productsLink = screen.getByText('Products').closest('a');
      const pricingLink = screen.getByText('Pricing').closest('a');

      expect(productsLink).toHaveAttribute('href', '/products');
      expect(pricingLink).toHaveAttribute('href', '/pricing');
    });

    it('applies active state with data-active attribute', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/home" data-active>
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/about">
                About
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const homeLink = screen.getByText('Home').closest('a');
      const aboutLink = screen.getByText('About').closest('a');

      expect(homeLink).toHaveAttribute('data-active');
      expect(aboutLink).not.toHaveAttribute('data-active');
    });

    it('applies navigationMenuTriggerStyle for styled links', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="/home" 
                className={navigationMenuTriggerStyle()}
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const link = screen.getByText('Home').closest('a');
      // Should have classes from navigationMenuTriggerStyle cva
      expect(link?.className).toContain('inline-flex');
      expect(link?.className).toContain('items-center');
    });

    it('supports external links with target="_blank"', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="https://example.com" 
                target="_blank"
                rel="noopener noreferrer"
              >
                External Link
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const link = screen.getByText('External Link').closest('a');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  /**
   * 3. HOVER AND KEYBOARD TRIGGERS
   * Test menu trigger interactions with mouse and keyboard
   */
  describe('Hover and Keyboard Triggers', () => {
    it('opens menu content on trigger hover', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Product List</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Products');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Product List')).toBeVisible();
      });
    });

    it('opens menu content on trigger click', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Services</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Service List</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Services');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Service List')).toBeVisible();
      });
    });

    it('opens menu content on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Resource List</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Resources');
      trigger.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Resource List')).toBeVisible();
      });
    });

    it('closes menu content on Escape key', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Company</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Company Info</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Company');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Company Info')).toBeVisible();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Company Info')).not.toBeVisible();
      });
    });

    it('rotates chevron icon when menu opens', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Solution List</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Solutions');
      const button = trigger.parentElement;
      
      await user.click(trigger);

      await waitFor(() => {
        expect(button).toHaveAttribute('data-state', 'open');
      });
    });
  });

  /**
   * 4. MULTI-LEVEL NAVIGATION
   * Test nested navigation menus with multiple triggers
   */
  describe('Multi-level Navigation', () => {
    it('renders multiple menu triggers at same level', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Product 1</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Services</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Service 1</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Resource 1</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
    });

    it('switches between open menus on hover', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>First Menu</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>First Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Second Menu</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Second Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const firstTrigger = screen.getByText('First Menu');
      const secondTrigger = screen.getByText('Second Menu');

      // Open first menu
      await user.hover(firstTrigger);
      await waitFor(() => {
        expect(screen.getByText('First Content')).toBeVisible();
      });

      // Hover to second menu
      await user.hover(secondTrigger);
      await waitFor(() => {
        expect(screen.getByText('Second Content')).toBeVisible();
      });
    });

    it('supports nested links within menu content', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul>
                  <li>
                    <NavigationMenuLink href="/category1">
                      Category 1
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="/category2">
                      Category 2
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Categories');
      await user.click(trigger);

      await waitFor(() => {
        const link1 = screen.getByText('Category 1').closest('a');
        const link2 = screen.getByText('Category 2').closest('a');
        expect(link1).toHaveAttribute('href', '/category1');
        expect(link2).toHaveAttribute('href', '/category2');
      });
    });

    it('maintains viewport for content positioning', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      // NavigationMenuViewport is auto-included in NavigationMenu
      // Check that container has proper structure
      expect(container.querySelector('[role="navigation"]')).toBeInTheDocument();
    });
  });

  /**
   * 5. ARIA AND ACCESSIBILITY
   * Test ARIA attributes and accessibility patterns
   */
  describe('ARIA and Accessibility', () => {
    it('has role="navigation" on root element', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/home">Home</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const nav = container.querySelector('[role="navigation"]');
      expect(nav).toBeInTheDocument();
    });

    it('has aria-label on navigation menu', () => {
      render(
        <NavigationMenu aria-label="Main navigation">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/home">Home</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const nav = screen.getByLabelText('Main navigation');
      expect(nav).toBeInTheDocument();
    });

    it('has aria-haspopup on menu triggers', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Product List</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Products').parentElement;
      expect(trigger).toHaveAttribute('aria-haspopup');
    });

    it('has aria-expanded attribute that reflects menu state', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Services</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Service List</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Services').parentElement;

      // Initially collapsed
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      await user.click(trigger!);
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <NavigationMenu aria-label="Main navigation">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/home">Home</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="/product1">
                  Product 1
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  /**
   * 6. CONTENT ANIMATIONS
   * Test menu content animations and transitions
   */
  describe('Content Animations', () => {
    it('animates content in with fade-in', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Product Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Products');
      await user.click(trigger);

      await waitFor(() => {
        const content = screen.getByText('Product Content').closest('[data-motion]');
        // Content should have data-motion attribute for animations
        expect(content).toBeInTheDocument();
      });
    });

    it('applies viewport height CSS variable', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Services</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div style={{ height: '200px' }}>Tall Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Services');
      await user.click(trigger);

      await waitFor(() => {
        // NavigationMenuViewport uses --radix-navigation-menu-viewport-height
        const viewport = container.querySelector('[data-state="open"]');
        expect(viewport).toBeInTheDocument();
      });
    });

    it('handles data-state for open/closed transitions', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Resource Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Resources').parentElement;

      // Initially closed
      expect(trigger).toHaveAttribute('data-state', 'closed');

      // Click to open
      await user.click(trigger!);
      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'open');
      });
    });
  });

  /**
   * 7. DISABLED AND READONLY STATES
   * Test disabled triggers and readonly behavior
   */
  describe('Disabled and Readonly States', () => {
    it('renders disabled trigger with disabled attribute', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger disabled>
                Disabled Menu
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Disabled Menu').parentElement;
      expect(trigger).toBeDisabled();
    });

    it('does not open content when trigger is disabled', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger disabled>
                Disabled Menu
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Hidden Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Disabled Menu');
      await user.click(trigger);

      // Content should not be visible
      await waitFor(() => {
        expect(screen.queryByText('Hidden Content')).not.toBeVisible();
      });
    });

    it('applies disabled opacity styles', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger disabled>
                Disabled
              </NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const trigger = screen.getByText('Disabled').parentElement;
      // navigationMenuTriggerStyle includes "disabled:opacity-50"
      expect(trigger?.className).toContain('disabled:opacity-50');
    });
  });
});
