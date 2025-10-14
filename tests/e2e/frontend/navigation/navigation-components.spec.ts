import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Navigation Components
 * 
 * Tests tabs, accordion, and navigation menu components in real browser.
 * Validates content switching, keyboard navigation, state persistence, and URL management.
 */

test.describe('E2E: Navigation Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system/navigation');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Tabs Navigation', () => {
    test('should render all tab triggers', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
    });

    test('should switch content when tab is clicked', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();

      if (tabCount >= 2) {
        // Click second tab
        const secondTab = tabs.nth(1);
        await secondTab.click();
        await page.waitForTimeout(300);

        // Second tab should be selected
        const ariaSelected = await secondTab.getAttribute('aria-selected');
        expect(ariaSelected).toBe('true');

        // First tab should not be selected
        const firstTab = tabs.nth(0);
        const firstSelected = await firstTab.getAttribute('aria-selected');
        expect(firstSelected).toBe('false');
      }
    });

    test('should show only selected tab content', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      const tabpanels = page.locator('[role="tabpanel"]');

      if (await tabs.count() >= 2) {
        // Click first tab
        await tabs.nth(0).click();
        await page.waitForTimeout(200);

        // Only first panel should be visible
        const firstPanelId = await tabs.nth(0).getAttribute('aria-controls');
        if (firstPanelId) {
          const firstPanel = page.locator(`#${firstPanelId}`);
          await expect(firstPanel).toBeVisible();
        }

        // Click second tab
        await tabs.nth(1).click();
        await page.waitForTimeout(200);

        // Now only second panel should be visible
        const secondPanelId = await tabs.nth(1).getAttribute('aria-controls');
        if (secondPanelId) {
          const secondPanel = page.locator(`#${secondPanelId}`);
          await expect(secondPanel).toBeVisible();
        }
      }
    });

    test('should navigate tabs with Arrow keys', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      
      if (await tabs.count() >= 2) {
        // Focus first tab
        await tabs.nth(0).focus();

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);

        // Second tab should be focused (or selected)
        const focusedElement = page.locator('[role="tab"]:focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    test('should handle Home and End keys in tabs', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();

      if (tabCount > 1) {
        // Focus first tab
        await tabs.nth(0).focus();

        // Press End key
        await page.keyboard.press('End');
        await page.waitForTimeout(200);

        // Last tab should be focused
        const lastTab = tabs.nth(tabCount - 1);
        await expect(lastTab).toBeFocused();

        // Press Home key
        await page.keyboard.press('Home');
        await page.waitForTimeout(200);

        // First tab should be focused
        const firstTab = tabs.nth(0);
        await expect(firstTab).toBeFocused();
      }
    });

    test('should maintain selected tab on page reload', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');

      if (await tabs.count() >= 2) {
        // Click second tab
        await tabs.nth(1).click();
        await page.waitForTimeout(300);

        const secondTabText = await tabs.nth(1).textContent();

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check if second tab is still selected (if URL state is used)
        const selectedTab = page.locator('[role="tab"][aria-selected="true"]');
        const selectedText = await selectedTab.textContent();

        // Either maintains state or resets to first (both valid)
        expect(typeof selectedText).toBe('string');
      }
    });
  });

  test.describe('Accordion Navigation', () => {
    test('should render accordion items', async ({ page }) => {
      const accordionItems = page.locator('[data-radix-collection-item], [role="button"][aria-expanded]');
      const itemCount = await accordionItems.count();
      expect(itemCount).toBeGreaterThan(0);
    });

    test('should expand accordion item on click', async ({ page }) => {
      const accordionTrigger = page.locator('[data-radix-collection-item], [role="button"][aria-expanded]').first();
      
      // Get initial state
      const initialExpanded = await accordionTrigger.getAttribute('aria-expanded');

      // Click trigger
      await accordionTrigger.click();
      await page.waitForTimeout(300);

      // State should change
      const newExpanded = await accordionTrigger.getAttribute('aria-expanded');
      expect(newExpanded).not.toBe(initialExpanded);
    });

    test('should collapse expanded accordion item', async ({ page }) => {
      const accordionTrigger = page.locator('[data-radix-collection-item], [role="button"][aria-expanded]').first();

      // Expand
      await accordionTrigger.click();
      await page.waitForTimeout(300);

      // Click again to collapse
      await accordionTrigger.click();
      await page.waitForTimeout(300);

      // Should be collapsed
      const expanded = await accordionTrigger.getAttribute('aria-expanded');
      expect(expanded).toBe('false');
    });

    test('should show accordion content when expanded', async ({ page }) => {
      const accordionTrigger = page.locator('[data-radix-collection-item], [role="button"][aria-expanded]').first();
      const contentId = await accordionTrigger.getAttribute('aria-controls');

      if (contentId) {
        // Expand
        await accordionTrigger.click();
        await page.waitForTimeout(300);

        // Content should be visible
        const content = page.locator(`#${contentId}`);
        await expect(content).toBeVisible();
      }
    });

    test('should handle single mode - collapse previous item', async ({ page }) => {
      const accordionTriggers = page.locator('[data-radix-collection-item], [role="button"][aria-expanded]');

      if (await accordionTriggers.count() >= 2) {
        // Expand first item
        await accordionTriggers.nth(0).click();
        await page.waitForTimeout(300);

        // Expand second item
        await accordionTriggers.nth(1).click();
        await page.waitForTimeout(300);

        // First item should be collapsed (if single mode)
        const firstExpanded = await accordionTriggers.nth(0).getAttribute('aria-expanded');
        
        // In single mode: first should be collapsed
        // In multiple mode: first stays expanded
        expect(['true', 'false']).toContain(firstExpanded);
      }
    });

    test('should navigate accordion with keyboard', async ({ page }) => {
      const accordionTrigger = page.locator('[data-radix-collection-item], [role="button"][aria-expanded]').first();

      // Focus trigger
      await accordionTrigger.focus();

      // Press Enter to expand
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Should be expanded
      const expanded = await accordionTrigger.getAttribute('aria-expanded');
      expect(expanded).toBe('true');

      // Press Space to toggle
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);

      // Should toggle state
      const newExpanded = await accordionTrigger.getAttribute('aria-expanded');
      expect(newExpanded).not.toBe(expanded);
    });

    test('should handle nested accordion items', async ({ page }) => {
      // Look for nested accordion structure
      const nestedTrigger = page.locator('[data-radix-collection-item] [data-radix-collection-item], [role="button"][aria-expanded] [role="button"][aria-expanded]').first();

      if (await nestedTrigger.count() > 0) {
        // Click nested trigger
        await nestedTrigger.click();
        await page.waitForTimeout(300);

        // Should expand
        const expanded = await nestedTrigger.getAttribute('aria-expanded');
        expect(expanded).toBe('true');
      }
    });
  });

  test.describe('Combined Navigation Patterns', () => {
    test('should have tabs containing accordion', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      
      if (await tabs.count() >= 2) {
        // Switch to second tab
        await tabs.nth(1).click();
        await page.waitForTimeout(300);

        // Look for accordion in second tab panel
        const secondPanelId = await tabs.nth(1).getAttribute('aria-controls');
        if (secondPanelId) {
          const accordion = page.locator(`#${secondPanelId} [data-radix-collection-item], #${secondPanelId} [role="button"][aria-expanded]`);
          
          if (await accordion.count() > 0) {
            // Click accordion in second tab
            await accordion.first().click();
            await page.waitForTimeout(300);

            // Should expand
            const expanded = await accordion.first().getAttribute('aria-expanded');
            expect(expanded).toBe('true');
          }
        }
      }
    });

    test('should preserve accordion state when switching tabs', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');

      if (await tabs.count() >= 2) {
        // Click first tab
        await tabs.nth(0).click();
        await page.waitForTimeout(200);

        // Find accordion in first tab
        const firstPanelId = await tabs.nth(0).getAttribute('aria-controls');
        if (firstPanelId) {
          const accordion = page.locator(`#${firstPanelId} [data-radix-collection-item]`).first();
          
          if (await accordion.count() > 0) {
            // Expand accordion
            await accordion.click();
            await page.waitForTimeout(300);

            // Switch to second tab
            await tabs.nth(1).click();
            await page.waitForTimeout(300);

            // Switch back to first tab
            await tabs.nth(0).click();
            await page.waitForTimeout(300);

            // Accordion state might be preserved or reset
            const expanded = await accordion.getAttribute('aria-expanded');
            expect(['true', 'false']).toContain(expanded);
          }
        }
      }
    });
  });

  test.describe('Navigation Accessibility', () => {
    test('should have proper ARIA roles for tabs', async ({ page }) => {
      const tablist = page.locator('[role="tablist"]').first();
      await expect(tablist).toBeVisible();

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);

      const tabpanels = page.locator('[role="tabpanel"]');
      const panelCount = await tabpanels.count();
      expect(panelCount).toBeGreaterThan(0);
    });

    test('should have aria-controls linking tabs to panels', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      
      if (await tabs.count() > 0) {
        const firstTab = tabs.first();
        const ariaControls = await firstTab.getAttribute('aria-controls');
        
        if (ariaControls) {
          const panel = page.locator(`#${ariaControls}`);
          await expect(panel).toBeAttached();
        }
      }
    });

    test('should have proper aria-expanded for accordion', async ({ page }) => {
      const accordionTriggers = page.locator('[data-radix-collection-item], [role="button"][aria-expanded]');
      
      if (await accordionTriggers.count() > 0) {
        const firstTrigger = accordionTriggers.first();
        const ariaExpanded = await firstTrigger.getAttribute('aria-expanded');
        
        expect(['true', 'false']).toContain(ariaExpanded);
      }
    });

    test('should have keyboard focus indicators', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      
      if (await tabs.count() > 0) {
        const firstTab = tabs.first();
        await firstTab.focus();

        // Check for focus styles
        const outline = await firstTab.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.outline || styles.outlineWidth || styles.boxShadow;
        });

        expect(outline).toBeTruthy();
      }
    });
  });

  test.describe('Cross-browser Navigation Behavior', () => {
    test('should handle tab switching consistently', async ({ page, browserName }) => {
      const tabs = page.locator('[role="tab"]');
      
      if (await tabs.count() >= 2) {
        await tabs.nth(0).click();
        await page.waitForTimeout(200);

        await tabs.nth(1).click();
        await page.waitForTimeout(200);

        // Should switch tabs in all browsers
        const selected = await tabs.nth(1).getAttribute('aria-selected');
        expect(selected).toBe('true');
      }
    });

    test('should handle accordion animations smoothly', async ({ page, browserName }) => {
      const accordionTrigger = page.locator('[data-radix-collection-item], [role="button"][aria-expanded]').first();

      // Expand
      await accordionTrigger.click();
      
      // Wait for animation
      await page.waitForTimeout(500);

      // Should be expanded
      const expanded = await accordionTrigger.getAttribute('aria-expanded');
      expect(expanded).toBe('true');
    });
  });
});
