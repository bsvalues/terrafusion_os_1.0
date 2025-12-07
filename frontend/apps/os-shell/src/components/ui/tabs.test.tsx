/**
 * Tabs Component Tests
 *
 * Tests for the Tabs component and its sub-components.
 * Tabs organize content into multiple panels with keyboard navigation support.
 * Built on @radix-ui/react-tabs.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

expect.extend(toHaveNoViolations);

describe('Tabs', () => {
  /**
   * 1. RENDERING TESTS
   * Test that Tabs components render correctly
   */
  describe('Rendering', () => {
    it('renders tabs with triggers and content', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeVisible();
    });

    it('renders multiple tabs in tablist', () => {
      render(
        <Tabs defaultValue='overview'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='details'>Details</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
          </TabsList>
          <TabsContent value='overview'>Overview content</TabsContent>
          <TabsContent value='details'>Details content</TabsContent>
          <TabsContent value='settings'>Settings content</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('shows only active tab content by default', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeVisible();
      expect(screen.queryByText('Content 2')).not.toBeVisible();
    });

    it('renders tabs with custom className', () => {
      const { container } = render(
        <Tabs defaultValue='tab1' className='custom-tabs'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>
      );

      const tabs = container.querySelector('.custom-tabs');
      expect(tabs).toBeInTheDocument();
    });

    it('renders tab triggers with data-state attribute', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      const tab2 = screen.getByText('Tab 2');

      expect(tab1).toHaveAttribute('data-state', 'active');
      expect(tab2).toHaveAttribute('data-state', 'inactive');
    });
  });

  /**
   * 2. TAB SWITCHING (CLICK) TESTS
   * Test switching between tabs via mouse clicks
   */
  describe('Tab Switching (Click)', () => {
    it('switches content when clicking different tab', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeVisible();
      expect(screen.queryByText('Content 2')).not.toBeVisible();

      const tab2 = screen.getByText('Tab 2');
      await user.click(tab2);

      await waitFor(() => {
        expect(screen.queryByText('Content 1')).not.toBeVisible();
        expect(screen.getByText('Content 2')).toBeVisible();
      });
    });

    it('updates data-state when switching tabs', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      const tab2 = screen.getByText('Tab 2');

      expect(tab1).toHaveAttribute('data-state', 'active');
      expect(tab2).toHaveAttribute('data-state', 'inactive');

      await user.click(tab2);

      await waitFor(() => {
        expect(tab1).toHaveAttribute('data-state', 'inactive');
        expect(tab2).toHaveAttribute('data-state', 'active');
      });
    });

    it('handles clicking same tab (stays active)', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');

      expect(tab1).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 1')).toBeVisible();

      await user.click(tab1);

      // Should remain active
      expect(tab1).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 1')).toBeVisible();
    });

    it('switches between multiple tabs correctly', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
            <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
          <TabsContent value='tab3'>Content 3</TabsContent>
        </Tabs>
      );

      // Start with tab1
      expect(screen.getByText('Content 1')).toBeVisible();

      // Switch to tab2
      await user.click(screen.getByText('Tab 2'));
      await waitFor(() => {
        expect(screen.getByText('Content 2')).toBeVisible();
        expect(screen.queryByText('Content 1')).not.toBeVisible();
      });

      // Switch to tab3
      await user.click(screen.getByText('Tab 3'));
      await waitFor(() => {
        expect(screen.getByText('Content 3')).toBeVisible();
        expect(screen.queryByText('Content 2')).not.toBeVisible();
      });

      // Switch back to tab1
      await user.click(screen.getByText('Tab 1'));
      await waitFor(() => {
        expect(screen.getByText('Content 1')).toBeVisible();
        expect(screen.queryByText('Content 3')).not.toBeVisible();
      });
    });
  });

  /**
   * 3. KEYBOARD NAVIGATION TESTS
   * Test arrow key navigation between tabs
   */
  describe('Keyboard Navigation', () => {
    it('moves to next tab with ArrowRight key', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
            <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
          <TabsContent value='tab3'>Content 3</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      tab1.focus();

      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('Tab 2')).toHaveFocus();
      });
    });

    it('moves to previous tab with ArrowLeft key', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab2'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
            <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
          <TabsContent value='tab3'>Content 3</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2');
      tab2.focus();

      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.getByText('Tab 1')).toHaveFocus();
      });
    });

    it('wraps to first tab from last with ArrowRight', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab3'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
            <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
          <TabsContent value='tab3'>Content 3</TabsContent>
        </Tabs>
      );

      const tab3 = screen.getByText('Tab 3');
      tab3.focus();

      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('Tab 1')).toHaveFocus();
      });
    });

    it('wraps to last tab from first with ArrowLeft', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
            <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
          <TabsContent value='tab3'>Content 3</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      tab1.focus();

      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.getByText('Tab 3')).toHaveFocus();
      });
    });

    it('activates tab with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2');
      tab2.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Content 2')).toBeVisible();
      });
    });

    it('activates tab with Space key', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2');
      tab2.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByText('Content 2')).toBeVisible();
      });
    });
  });

  /**
   * 4. CONTROLLED STATE TESTS
   * Test controlled tabs with external state management
   */
  describe('Controlled State', () => {
    it('respects controlled value prop', () => {
      render(
        <Tabs value='tab2'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Tab 2')).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 2')).toBeVisible();
      expect(screen.queryByText('Content 1')).not.toBeVisible();
    });

    it('calls onValueChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const handleValueChange = jest.fn();

      render(
        <Tabs defaultValue='tab1' onValueChange={handleValueChange}>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2');
      await user.click(tab2);

      expect(handleValueChange).toHaveBeenCalledWith('tab2');
    });

    it('updates controlled value externally', async () => {
      const ControlledTabs = () => {
        const [value, setValue] = React.useState('tab1');

        return (
          <div>
            <button onClick={() => setValue('tab2')}>Switch to Tab 2</button>
            <Tabs value={value} onValueChange={setValue}>
              <TabsList>
                <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
                <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
              </TabsList>
              <TabsContent value='tab1'>Content 1</TabsContent>
              <TabsContent value='tab2'>Content 2</TabsContent>
            </Tabs>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<ControlledTabs />);

      expect(screen.getByText('Content 1')).toBeVisible();

      const button = screen.getByText('Switch to Tab 2');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Content 2')).toBeVisible();
        expect(screen.queryByText('Content 1')).not.toBeVisible();
      });
    });

    it('maintains controlled state after multiple changes', async () => {
      const user = userEvent.setup();
      const handleValueChange = jest.fn();

      render(
        <Tabs defaultValue='tab1' onValueChange={handleValueChange}>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
            <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
          <TabsContent value='tab3'>Content 3</TabsContent>
        </Tabs>
      );

      await user.click(screen.getByText('Tab 2'));
      await user.click(screen.getByText('Tab 3'));
      await user.click(screen.getByText('Tab 1'));

      expect(handleValueChange).toHaveBeenCalledTimes(3);
      expect(handleValueChange).toHaveBeenNthCalledWith(1, 'tab2');
      expect(handleValueChange).toHaveBeenNthCalledWith(2, 'tab3');
      expect(handleValueChange).toHaveBeenNthCalledWith(3, 'tab1');
    });
  });

  /**
   * 5. DISABLED TABS TESTS
   * Test disabled tab behavior
   */
  describe('Disabled Tabs', () => {
    it('renders disabled tab with disabled attribute', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2' disabled>
              Tab 2 (Disabled)
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2 (Disabled)');
      expect(tab2).toBeDisabled();
    });

    it('does not activate disabled tab on click', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2' disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2');
      await user.click(tab2);

      // Content 1 should still be visible
      expect(screen.getByText('Content 1')).toBeVisible();
      expect(screen.queryByText('Content 2')).not.toBeVisible();
    });

    it('skips disabled tab during keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2' disabled>
              Tab 2
            </TabsTrigger>
            <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
          <TabsContent value='tab3'>Content 3</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      tab1.focus();

      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        // Should skip tab2 and go to tab3
        expect(screen.getByText('Tab 3')).toHaveFocus();
      });
    });

    it('applies disabled opacity styles', () => {
      const { container } = render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2' disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2');
      // Should have disabled:opacity-50 class from TabsTrigger styles
      expect(tab2.className).toContain('disabled:opacity-50');
    });
  });

  /**
   * 6. ARIA AND ACCESSIBILITY TESTS
   * Test ARIA tablist pattern compliance
   */
  describe('ARIA and Accessibility', () => {
    it('has role="tablist" on TabsList', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });

    it('has role="tab" on TabsTrigger', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });

    it('has role="tabpanel" on TabsContent', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('has aria-selected on active tab', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByText('Tab 1');
      const tab2 = screen.getByText('Tab 2');

      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
    });

    it('has aria-controls linking tab to panel', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>
      );

      const tab = screen.getByText('Tab 1');
      const panel = screen.getByText('Content 1').closest('[role="tabpanel"]');

      const controlsId = tab.getAttribute('aria-controls');
      const panelId = panel?.getAttribute('id');

      expect(controlsId).toBe(panelId);
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
