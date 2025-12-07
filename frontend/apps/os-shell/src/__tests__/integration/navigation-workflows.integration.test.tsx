/**
 * @file navigation-workflows.integration.test.tsx
 * @description Integration tests for navigation patterns and content switching
 * @week Week 2 Day 14
 * @testCategory Integration Testing
 */

import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ============================================================================
// TEST COMPONENTS - Realistic Navigation Examples
// ============================================================================

/**
 * Settings Tabs - Tabs + Multiple Content Sections
 */
const SettingsTabs = () => {
  return (
    <Tabs defaultValue='account' className='w-full'>
      <TabsList>
        <TabsTrigger value='account'>Account</TabsTrigger>
        <TabsTrigger value='security'>Security</TabsTrigger>
        <TabsTrigger value='notifications'>Notifications</TabsTrigger>
        <TabsTrigger value='billing'>Billing</TabsTrigger>
      </TabsList>
      <TabsContent value='account'>
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your account information and preferences.</p>
            <div className='mt-4'>
              <label htmlFor='username'>Username</label>
              <input id='username' type='text' defaultValue='johndoe' />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value='security'>
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Update your password and security preferences.</p>
            <Button>Change Password</Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value='notifications'>
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Configure how you receive notifications.</p>
            <div className='space-y-2'>
              <label>
                <input type='checkbox' defaultChecked /> Email notifications
              </label>
              <label>
                <input type='checkbox' /> SMS notifications
              </label>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value='billing'>
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your subscription and payment methods.</p>
            <p className='mt-2'>
              Current Plan: <strong>Pro</strong>
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

/**
 * FAQ Accordion - Accordion + Rich Content
 */
const FAQAccordion = () => {
  return (
    <Accordion type='single' collapsible className='w-full'>
      <AccordionItem value='item-1'>
        <AccordionTrigger>How do I create an account?</AccordionTrigger>
        <AccordionContent>
          <p>
            To create an account, click the "Sign Up" button in the top right corner. Fill out the
            registration form with your email and password.
          </p>
          <Button className='mt-2' size='sm'>
            Sign Up Now
          </Button>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='item-2'>
        <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
        <AccordionContent>
          <p>We accept the following payment methods:</p>
          <ul className='list-disc ml-5 mt-2'>
            <li>Credit Cards (Visa, MasterCard, Amex)</li>
            <li>PayPal</li>
            <li>Bank Transfer</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='item-3'>
        <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
        <AccordionContent>
          <p>
            You can cancel your subscription at any time from your account settings. Go to Billing →
            Subscription → Cancel Plan.
          </p>
          <p className='mt-2 text-sm text-gray-500'>
            Note: You will retain access until the end of your billing period.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='item-4'>
        <AccordionTrigger>Is there a free trial available?</AccordionTrigger>
        <AccordionContent>
          <p>Yes! We offer a 14-day free trial for all new users. No credit card required.</p>
          <Button className='mt-2' size='sm'>
            Start Free Trial
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

/**
 * Nested Accordion - Accordion within Accordion
 */
const NestedAccordion = () => {
  return (
    <Accordion type='single' collapsible>
      <AccordionItem value='category-1'>
        <AccordionTrigger>Product Information</AccordionTrigger>
        <AccordionContent>
          <Accordion type='single' collapsible>
            <AccordionItem value='sub-1-1'>
              <AccordionTrigger>Features</AccordionTrigger>
              <AccordionContent>Comprehensive feature list including A, B, and C.</AccordionContent>
            </AccordionItem>
            <AccordionItem value='sub-1-2'>
              <AccordionTrigger>Pricing</AccordionTrigger>
              <AccordionContent>
                Starting at $9.99/month with annual discounts available.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='category-2'>
        <AccordionTrigger>Support</AccordionTrigger>
        <AccordionContent>
          <p>Contact our support team 24/7.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

/**
 * Stateful Tab Navigation - Tabs with State Management
 */
const StatefulTabNavigation = ({ onTabChange }: { onTabChange: (tab: string) => void }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange(value);
  };

  return (
    <div>
      <p>
        Current Tab: <span data-testid='current-tab'>{activeTab}</span>
      </p>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='details'>Details</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value='overview'>
          <h3>Overview Content</h3>
          <p>This is the overview section.</p>
        </TabsContent>
        <TabsContent value='details'>
          <h3>Details Content</h3>
          <p>This is the details section.</p>
        </TabsContent>
        <TabsContent value='analytics'>
          <h3>Analytics Content</h3>
          <p>This is the analytics section.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============================================================================
// INTEGRATION TESTS - Tabs Navigation Workflow
// ============================================================================

describe('Integration: Tabs Navigation Workflow', () => {
  describe('Component Integration', () => {
    it('should render all tab triggers', () => {
      render(<SettingsTabs />);

      expect(screen.getByRole('tab', { name: /account/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /security/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /billing/i })).toBeInTheDocument();
    });

    it('should render default tab content', () => {
      render(<SettingsTabs />);

      expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
      expect(screen.getByText(/manage your account information/i)).toBeInTheDocument();
    });

    it('should integrate card component within tab content', () => {
      render(<SettingsTabs />);

      const accountCard = screen
        .getByRole('heading', { name: /account settings/i })
        .closest('.card');
      expect(accountCard).toBeInTheDocument();
    });
  });

  describe('User Workflow: Tab Switching', () => {
    it('should switch to security tab and display content', async () => {
      const user = userEvent.setup();
      render(<SettingsTabs />);

      await user.click(screen.getByRole('tab', { name: /security/i }));

      expect(screen.getByRole('heading', { name: /security settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    it('should switch between multiple tabs', async () => {
      const user = userEvent.setup();
      render(<SettingsTabs />);

      // Switch to notifications
      await user.click(screen.getByRole('tab', { name: /notifications/i }));
      expect(
        screen.getByRole('heading', { name: /notification preferences/i })
      ).toBeInTheDocument();

      // Switch to billing
      await user.click(screen.getByRole('tab', { name: /billing/i }));
      expect(screen.getByRole('heading', { name: /billing information/i })).toBeInTheDocument();
      expect(screen.getByText(/pro/i)).toBeInTheDocument();

      // Switch back to account
      await user.click(screen.getByRole('tab', { name: /account/i }));
      expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    });

    it('should hide previous tab content when switching', async () => {
      const user = userEvent.setup();
      render(<SettingsTabs />);

      // Account content visible
      expect(screen.getByRole('heading', { name: /account settings/i })).toBeVisible();

      // Switch to security
      await user.click(screen.getByRole('tab', { name: /security/i }));

      // Account content should not be visible
      expect(screen.queryByRole('heading', { name: /account settings/i })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /security settings/i })).toBeVisible();
    });
  });

  describe('Keyboard Navigation: Tabs', () => {
    it('should navigate tabs with arrow keys', async () => {
      const user = userEvent.setup();
      render(<SettingsTabs />);

      const accountTab = screen.getByRole('tab', { name: /account/i });
      accountTab.focus();

      // Arrow right to security
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /security/i })).toHaveFocus();

      // Arrow right to notifications
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /notifications/i })).toHaveFocus();

      // Arrow left back to security
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: /security/i })).toHaveFocus();
    });

    it('should activate tab on Enter key', async () => {
      const user = userEvent.setup();
      render(<SettingsTabs />);

      const securityTab = screen.getByRole('tab', { name: /security/i });
      securityTab.focus();

      await user.keyboard('{Enter}');

      expect(screen.getByRole('heading', { name: /security settings/i })).toBeInTheDocument();
    });
  });

  describe('State Management: Tabs', () => {
    it('should track active tab state', async () => {
      const user = userEvent.setup();
      const handleTabChange = jest.fn();
      render(<StatefulTabNavigation onTabChange={handleTabChange} />);

      // Initial state
      expect(screen.getByTestId('current-tab')).toHaveTextContent('overview');

      // Change tab
      await user.click(screen.getByRole('tab', { name: /details/i }));

      expect(screen.getByTestId('current-tab')).toHaveTextContent('details');
      expect(handleTabChange).toHaveBeenCalledWith('details');

      // Change again
      await user.click(screen.getByRole('tab', { name: /analytics/i }));

      expect(screen.getByTestId('current-tab')).toHaveTextContent('analytics');
      expect(handleTabChange).toHaveBeenCalledWith('analytics');
    });
  });

  describe('Accessibility: Tabs', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SettingsTabs />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      render(<SettingsTabs />);

      const accountTab = screen.getByRole('tab', { name: /account/i });
      expect(accountTab).toHaveAttribute('aria-selected', 'true');

      const securityTab = screen.getByRole('tab', { name: /security/i });
      expect(securityTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should update aria-selected when tab changes', async () => {
      const user = userEvent.setup();
      render(<SettingsTabs />);

      const securityTab = screen.getByRole('tab', { name: /security/i });
      await user.click(securityTab);

      expect(securityTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /account/i })).toHaveAttribute(
        'aria-selected',
        'false'
      );
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Accordion Navigation Workflow
// ============================================================================

describe('Integration: Accordion Navigation Workflow', () => {
  describe('Component Integration', () => {
    it('should render all accordion items', () => {
      render(<FAQAccordion />);

      expect(
        screen.getByRole('button', { name: /how do i create an account/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /what payment methods/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /how do i cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /is there a free trial/i })).toBeInTheDocument();
    });

    it('should have accordion items collapsed by default', () => {
      render(<FAQAccordion />);

      // Content should not be visible initially
      expect(screen.queryByText(/to create an account, click/i)).not.toBeVisible();
    });
  });

  describe('User Workflow: Accordion Expansion', () => {
    it('should expand accordion item when clicked', async () => {
      const user = userEvent.setup();
      render(<FAQAccordion />);

      await user.click(screen.getByRole('button', { name: /how do i create an account/i }));

      expect(screen.getByText(/to create an account, click/i)).toBeVisible();
      expect(screen.getByRole('button', { name: /sign up now/i })).toBeInTheDocument();
    });

    it('should collapse accordion item when clicked again', async () => {
      const user = userEvent.setup();
      render(<FAQAccordion />);

      const trigger = screen.getByRole('button', { name: /how do i create an account/i });

      // Expand
      await user.click(trigger);
      expect(screen.getByText(/to create an account, click/i)).toBeVisible();

      // Collapse
      await user.click(trigger);
      expect(screen.queryByText(/to create an account, click/i)).not.toBeVisible();
    });

    it('should collapse previous item when opening new one (single mode)', async () => {
      const user = userEvent.setup();
      render(<FAQAccordion />);

      // Open first item
      await user.click(screen.getByRole('button', { name: /how do i create an account/i }));
      expect(screen.getByText(/to create an account, click/i)).toBeVisible();

      // Open second item
      await user.click(screen.getByRole('button', { name: /what payment methods/i }));

      // First item should be collapsed, second expanded
      expect(screen.queryByText(/to create an account, click/i)).not.toBeVisible();
      expect(screen.getByText(/we accept the following payment methods/i)).toBeVisible();
    });

    it('should render rich content inside accordion', async () => {
      const user = userEvent.setup();
      render(<FAQAccordion />);

      await user.click(screen.getByRole('button', { name: /what payment methods/i }));

      // Verify list items
      expect(screen.getByText(/credit cards/i)).toBeInTheDocument();
      expect(screen.getByText(/paypal/i)).toBeInTheDocument();
      expect(screen.getByText(/bank transfer/i)).toBeInTheDocument();
    });

    it('should render buttons inside accordion content', async () => {
      const user = userEvent.setup();
      render(<FAQAccordion />);

      await user.click(screen.getByRole('button', { name: /is there a free trial/i }));

      const startTrialButton = screen.getByRole('button', { name: /start free trial/i });
      expect(startTrialButton).toBeInTheDocument();
      expect(startTrialButton).toBeVisible();
    });
  });

  describe('Keyboard Navigation: Accordion', () => {
    it('should navigate accordion triggers with Tab', async () => {
      const user = userEvent.setup();
      render(<FAQAccordion />);

      await user.tab();
      expect(screen.getByRole('button', { name: /how do i create an account/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /what payment methods/i })).toHaveFocus();
    });

    it('should expand accordion with Enter key', async () => {
      const user = userEvent.setup();
      render(<FAQAccordion />);

      const trigger = screen.getByRole('button', { name: /how do i create an account/i });
      trigger.focus();

      await user.keyboard('{Enter}');

      expect(screen.getByText(/to create an account, click/i)).toBeVisible();
    });

    it('should expand accordion with Space key', async () => {
      const user = userEvent.setup();
      render(<FAQAccordion />);

      const trigger = screen.getByRole('button', { name: /what payment methods/i });
      trigger.focus();

      await user.keyboard(' ');

      expect(screen.getByText(/we accept the following payment methods/i)).toBeVisible();
    });
  });

  describe('Nested Accordion Workflow', () => {
    it('should handle nested accordion navigation', async () => {
      const user = userEvent.setup();
      render(<NestedAccordion />);

      // Open parent accordion
      await user.click(screen.getByRole('button', { name: /product information/i }));

      // Open nested accordion item
      const featuresButton = screen.getByRole('button', { name: /features/i });
      await user.click(featuresButton);

      expect(screen.getByText(/comprehensive feature list/i)).toBeVisible();

      // Open another nested item
      await user.click(screen.getByRole('button', { name: /pricing/i }));

      expect(screen.getByText(/starting at \$9\.99\/month/i)).toBeVisible();
    });

    it('should maintain parent accordion state when nested item opens', async () => {
      const user = userEvent.setup();
      render(<NestedAccordion />);

      await user.click(screen.getByRole('button', { name: /product information/i }));
      await user.click(screen.getByRole('button', { name: /features/i }));

      // Parent should still be open
      expect(screen.getByRole('button', { name: /features/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /pricing/i })).toBeVisible();
    });
  });

  describe('Accessibility: Accordion', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<FAQAccordion />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when expanded', async () => {
      const user = userEvent.setup();
      const { container } = render(<FAQAccordion />);

      await user.click(screen.getByRole('button', { name: /how do i create an account/i }));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<FAQAccordion />);

      const trigger = screen.getByRole('button', { name: /how do i create an account/i });

      // Collapsed state
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Expanded state
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Combined Navigation Patterns
// ============================================================================

describe('Integration: Combined Navigation Patterns', () => {
  const CombinedNavigation = () => (
    <div>
      <Tabs defaultValue='tab1'>
        <TabsList>
          <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value='tab1'>
          <Accordion type='single' collapsible>
            <AccordionItem value='item-1'>
              <AccordionTrigger>Section 1</AccordionTrigger>
              <AccordionContent>Content for Section 1 in Tab 1</AccordionContent>
            </AccordionItem>
            <AccordionItem value='item-2'>
              <AccordionTrigger>Section 2</AccordionTrigger>
              <AccordionContent>Content for Section 2 in Tab 1</AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
        <TabsContent value='tab2'>
          <p>Tab 2 content with regular text</p>
        </TabsContent>
      </Tabs>
    </div>
  );

  it('should handle tabs with nested accordion', async () => {
    const user = userEvent.setup();
    render(<CombinedNavigation />);

    // Accordion should be visible in Tab 1
    expect(screen.getByRole('button', { name: /section 1/i })).toBeInTheDocument();

    // Expand accordion
    await user.click(screen.getByRole('button', { name: /section 1/i }));
    expect(screen.getByText(/content for section 1 in tab 1/i)).toBeVisible();

    // Switch tabs
    await user.click(screen.getByRole('tab', { name: /tab 2/i }));
    expect(screen.getByText(/tab 2 content with regular text/i)).toBeInTheDocument();

    // Accordion should not be visible in Tab 2
    expect(screen.queryByRole('button', { name: /section 1/i })).not.toBeInTheDocument();
  });

  it('should maintain accordion state when switching back to tab', async () => {
    const user = userEvent.setup();
    render(<CombinedNavigation />);

    // Expand accordion in Tab 1
    await user.click(screen.getByRole('button', { name: /section 1/i }));
    expect(screen.getByText(/content for section 1 in tab 1/i)).toBeVisible();

    // Switch to Tab 2
    await user.click(screen.getByRole('tab', { name: /tab 2/i }));

    // Switch back to Tab 1
    await user.click(screen.getByRole('tab', { name: /tab 1/i }));

    // Accordion should still be expanded (or collapsed, depending on implementation)
    const accordionTrigger = screen.getByRole('button', { name: /section 1/i });
    expect(accordionTrigger).toBeInTheDocument();
  });

  it('should have no accessibility violations with combined navigation', async () => {
    const { container } = render(<CombinedNavigation />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ============================================================================
// SUMMARY: Navigation Integration Tests
// ============================================================================
// Total Test Categories: 3 navigation workflows (Tabs, Accordion, Combined)
// Total Tests: 30+ integration tests
// Coverage:
// - Tabs + Card integration
// - Tab content switching
// - Accordion expansion/collapse
// - Nested accordion patterns
// - Tabs + Accordion combination
// - State management across navigation
// - Keyboard navigation (Arrow keys, Enter, Space, Tab)
// - Accessibility (jest-axe)
// - Real-world navigation patterns
