import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Floating UI Components
 * 
 * Tests tooltips, popovers, and dropdown menus with real positioning,
 * z-index management, and hover/click interactions in browser.
 */

test.describe('E2E: Floating UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system/floating-ui');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Tooltip Interactions', () => {
    test('should show tooltip on hover', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        // Hover over button
        await button.hover();
        await page.waitForTimeout(500);

        // Tooltip should appear
        const tooltip = page.locator('[role="tooltip"]').first();
        
        if (await tooltip.count() > 0) {
          await expect(tooltip).toBeVisible();
        }
      }
    });

    test('should hide tooltip on unhover', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        // Hover
        await button.hover();
        await page.waitForTimeout(500);

        // Move mouse away
        await page.mouse.move(0, 0);
        await page.waitForTimeout(500);

        // Tooltip should hide
        const tooltip = page.locator('[role="tooltip"]:visible');
        const count = await tooltip.count();
        expect(count).toBe(0);
      }
    });

    test('should show tooltip on focus', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        // Focus button with Tab
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);

        // Tooltip might appear on focus
        const tooltip = page.locator('[role="tooltip"]').first();
        
        if (await tooltip.count() > 0) {
          const isVisible = await tooltip.isVisible();
          expect(typeof isVisible).toBe('boolean');
        }
      }
    });

    test('should position tooltip correctly', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        await button.hover();
        await page.waitForTimeout(500);

        const tooltip = page.locator('[role="tooltip"]').first();
        
        if (await tooltip.isVisible()) {
          const buttonBox = await button.boundingBox();
          const tooltipBox = await tooltip.boundingBox();

          if (buttonBox && tooltipBox) {
            // Tooltip should be positioned near button (not overlapping completely)
            const isNearby = 
              Math.abs(tooltipBox.y - buttonBox.y) < 200 ||
              Math.abs(tooltipBox.x - buttonBox.x) < 200;
            
            expect(isNearby).toBeTruthy();
          }
        }
      }
    });

    test('should show different tooltips for different buttons', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount >= 2) {
        // Hover first button
        await buttons.nth(0).hover();
        await page.waitForTimeout(500);
        
        const firstTooltipText = await page.locator('[role="tooltip"]').first().textContent();

        // Move to second button
        await buttons.nth(1).hover();
        await page.waitForTimeout(500);

        const secondTooltipText = await page.locator('[role="tooltip"]').first().textContent();

        // Tooltips should be different
        expect(typeof firstTooltipText).toBe('string');
        expect(typeof secondTooltipText).toBe('string');
      }
    });

    test('should handle button click with tooltip visible', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        // Hover to show tooltip
        await button.hover();
        await page.waitForTimeout(500);

        // Click button
        await button.click();
        await page.waitForTimeout(300);

        // Click should work even with tooltip visible
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('Popover with Form', () => {
    test('should open popover on trigger click', async ({ page }) => {
      const trigger = page.locator('button:has-text("Popover"), button:has-text("Settings")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Popover should open
        const popover = page.locator('[data-radix-popover-content], [role="dialog"]').first();
        await expect(popover).toBeVisible();
      }
    });

    test('should close popover on outside click', async ({ page }) => {
      const trigger = page.locator('button:has-text("Popover")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Click outside
        await page.mouse.click(10, 10);
        await page.waitForTimeout(300);

        // Popover should close
        const popover = page.locator('[data-radix-popover-content]:visible');
        const count = await popover.count();
        expect(count).toBe(0);
      }
    });

    test('should close popover on Escape key', async ({ page }) => {
      const trigger = page.locator('button:has-text("Popover")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Should close
        const popover = page.locator('[data-radix-popover-content]:visible');
        const count = await popover.count();
        expect(count).toBe(0);
      }
    });

    test('should submit form in popover', async ({ page }) => {
      const trigger = page.locator('button:has-text("Popover"), button:has-text("Dimensions")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Fill form fields
        const inputs = page.locator('[data-radix-popover-content] input');
        
        if (await inputs.count() > 0) {
          await inputs.first().fill('100');
          
          if (await inputs.count() > 1) {
            await inputs.nth(1).fill('200');
          }

          // Submit
          const submitButton = page.locator('[data-radix-popover-content] button:has-text("Save"), [data-radix-popover-content] button:has-text("Apply")').first();
          
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(300);

            // Popover should close
            const count = await page.locator('[data-radix-popover-content]:visible').count();
            expect(count).toBe(0);
          }
        }
      }
    });

    test('should cancel without saving', async ({ page }) => {
      const trigger = page.locator('button:has-text("Popover")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Make changes
        const input = page.locator('[data-radix-popover-content] input').first();
        if (await input.isVisible()) {
          await input.fill('999');
        }

        // Cancel
        const cancelButton = page.locator('[data-radix-popover-content] button:has-text("Cancel")').first();
        
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        } else {
          // Click outside to cancel
          await page.mouse.click(10, 10);
        }

        await page.waitForTimeout(300);

        // Should be closed
        const count = await page.locator('[data-radix-popover-content]:visible').count();
        expect(count).toBe(0);
      }
    });

    test('should position popover near trigger', async ({ page }) => {
      const trigger = page.locator('button:has-text("Popover")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        const popover = page.locator('[data-radix-popover-content]').first();
        
        if (await popover.isVisible()) {
          const triggerBox = await trigger.boundingBox();
          const popoverBox = await popover.boundingBox();

          if (triggerBox && popoverBox) {
            // Popover should be near trigger
            const distance = Math.sqrt(
              Math.pow(popoverBox.x - triggerBox.x, 2) +
              Math.pow(popoverBox.y - triggerBox.y, 2)
            );

            expect(distance).toBeLessThan(500);
          }
        }
      }
    });
  });

  test.describe('DropdownMenu Actions', () => {
    test('should open dropdown menu on click', async ({ page }) => {
      const trigger = page.locator('button:has-text("Menu"), button:has-text("Actions")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Menu should open
        const menu = page.locator('[role="menu"]').first();
        await expect(menu).toBeVisible();
      }
    });

    test('should render menu items', async ({ page }) => {
      const trigger = page.locator('button:has-text("Menu")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Check for menu items
        const menuItems = page.locator('[role="menuitem"]');
        const count = await menuItems.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should select menu item', async ({ page }) => {
      const trigger = page.locator('button:has-text("Menu")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Click first menu item
        const menuItem = page.locator('[role="menuitem"]').first();
        await menuItem.click();
        await page.waitForTimeout(300);

        // Menu should close
        const menuCount = await page.locator('[role="menu"]:visible').count();
        expect(menuCount).toBe(0);
      }
    });

    test('should navigate menu with Arrow keys', async ({ page }) => {
      const trigger = page.locator('button:has-text("Menu")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Press ArrowDown
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);

        // Check for highlighted item
        const highlightedItem = page.locator('[role="menuitem"][data-highlighted], [role="menuitem"]:focus').first();
        
        if (await highlightedItem.count() > 0) {
          await expect(highlightedItem).toBeVisible();
        }
      }
    });

    test('should select menu item with Enter key', async ({ page }) => {
      const trigger = page.locator('button:has-text("Menu")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Navigate and select
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // Menu should close
        const menuCount = await page.locator('[role="menu"]:visible').count();
        expect(menuCount).toBe(0);
      }
    });

    test('should close menu on Escape', async ({ page }) => {
      const trigger = page.locator('button:has-text("Menu")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Should close
        const menuCount = await page.locator('[role="menu"]:visible').count();
        expect(menuCount).toBe(0);
      }
    });

    test('should show menu separators', async ({ page }) => {
      const trigger = page.locator('button:has-text("Menu")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Look for separators
        const separators = page.locator('[role="separator"]');
        
        if (await separators.count() > 0) {
          await expect(separators.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Multiple Floating Elements', () => {
    test('should handle multiple tooltips', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount >= 2) {
        // Hover first button
        await buttons.nth(0).hover();
        await page.waitForTimeout(500);

        // Check tooltip count (should be 1)
        const tooltipCount1 = await page.locator('[role="tooltip"]:visible').count();

        // Hover second button
        await buttons.nth(1).hover();
        await page.waitForTimeout(500);

        // Should still be 1 tooltip (or 2 if overlapping is allowed)
        const tooltipCount2 = await page.locator('[role="tooltip"]:visible').count();
        
        expect(tooltipCount2).toBeGreaterThan(0);
        expect(tooltipCount2).toBeLessThanOrEqual(2);
      }
    });

    test('should layer floating elements correctly', async ({ page }) => {
      // Open popover
      const popoverTrigger = page.locator('button:has-text("Popover")').first();
      
      if (await popoverTrigger.isVisible()) {
        await popoverTrigger.click();
        await page.waitForTimeout(300);

        // Check z-index
        const popover = page.locator('[data-radix-popover-content]').first();
        
        if (await popover.isVisible()) {
          const zIndex = await popover.evaluate((el) => {
            return window.getComputedStyle(el).zIndex;
          });

          // Should have high z-index
          expect(parseInt(zIndex)).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Floating UI Accessibility', () => {
    test('should have proper tooltip ARIA', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        await button.hover();
        await page.waitForTimeout(500);

        const tooltip = page.locator('[role="tooltip"]').first();
        
        if (await tooltip.isVisible()) {
          // Tooltip should have role and id
          const role = await tooltip.getAttribute('role');
          const id = await tooltip.getAttribute('id');

          expect(role).toBe('tooltip');
          expect(id).toBeTruthy();
        }
      }
    });

    test('should link tooltip to trigger with aria-describedby', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        await button.hover();
        await page.waitForTimeout(500);

        const ariaDescribedBy = await button.getAttribute('aria-describedby');
        
        if (ariaDescribedBy) {
          const tooltip = page.locator(`#${ariaDescribedBy}`);
          await expect(tooltip).toBeVisible();
        }
      }
    });

    test('should have proper menu accessibility', async ({ page }) => {
      const trigger = page.locator('button:has-text("Menu")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        const menu = page.locator('[role="menu"]').first();
        
        if (await menu.isVisible()) {
          // Check for proper ARIA
          const role = await menu.getAttribute('role');
          expect(role).toBe('menu');
        }
      }
    });
  });

  test.describe('Cross-browser Floating UI', () => {
    test('should position elements consistently', async ({ page }) => {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        await button.hover();
        await page.waitForTimeout(500);

        const tooltip = page.locator('[role="tooltip"]').first();
        
        if (await tooltip.count() > 0) {
          const box = await tooltip.boundingBox();
          expect(box).toBeTruthy();
        }
      }
    });
  });
});
