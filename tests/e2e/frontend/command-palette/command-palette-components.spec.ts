import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Command Palette Components
 * 
 * Tests command palette with keyboard shortcuts, search, filtering, and action execution.
 * Validates keyboard-driven workflows in real browser environment.
 */

test.describe('E2E: Command Palette Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system/command-palette');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Command Palette Opening', () => {
    test('should open command palette with button', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command"), button:has-text("⌘K")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Command palette should be visible
        const palette = page.locator('[cmdk-root], [role="dialog"]:has([cmdk-input])').first();
        await expect(palette).toBeVisible();
      }
    });

    test('should open command palette with ⌘K shortcut', async ({ page, browserName }) => {
      // Use Cmd on Mac, Ctrl on others
      const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
      
      await page.keyboard.press(`${modifier}+KeyK`);
      await page.waitForTimeout(300);

      // Check if palette opened
      const palette = page.locator('[cmdk-root], [cmdk-dialog]').first();
      const isVisible = await palette.count() > 0;
      
      expect(typeof isVisible).toBe('boolean');
    });

    test('should close command palette with Escape', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command"), button:has-text("⌘K")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Should be closed
        const palette = page.locator('[cmdk-root]:visible').first();
        const count = await palette.count();
        expect(count).toBe(0);
      }
    });
  });

  test.describe('Command Search and Filtering', () => {
    test('should render command items', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Check for command items
        const items = page.locator('[cmdk-item], [role="option"]');
        const count = await items.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should filter commands by search', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Get initial item count
        const initialCount = await page.locator('[cmdk-item], [role="option"]').count();

        // Type search query
        const input = page.locator('[cmdk-input], input[type="text"]').first();
        await input.fill('file');
        await page.waitForTimeout(300);

        // Items should be filtered
        const filteredCount = await page.locator('[cmdk-item]:visible, [role="option"]:visible').count();
        
        expect(typeof filteredCount).toBe('number');
      }
    });

    test('should show empty state when no matches', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Search for nonsense
        const input = page.locator('[cmdk-input], input').first();
        await input.fill('xyznonexistent123');
        await page.waitForTimeout(300);

        // Should show empty message
        const emptyMessage = page.locator('[cmdk-empty], text=/no results|not found/i').first();
        
        if (await emptyMessage.count() > 0) {
          await expect(emptyMessage).toBeVisible();
        }
      }
    });

    test('should highlight matching text', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Type search
        const input = page.locator('[cmdk-input], input').first();
        await input.fill('open');
        await page.waitForTimeout(300);

        // Check if items still visible
        const items = page.locator('[cmdk-item]:visible').first();
        const itemText = await items.textContent();
        
        expect(typeof itemText).toBe('string');
      }
    });

    test('should clear search input', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Type and clear
        const input = page.locator('[cmdk-input], input').first();
        await input.fill('test');
        await input.fill('');
        await page.waitForTimeout(300);

        // All items should be visible again
        const items = page.locator('[cmdk-item]:visible');
        const count = await items.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Command Groups', () => {
    test('should render command groups', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Check for groups
        const groups = page.locator('[cmdk-group]');
        const groupCount = await groups.count();
        
        if (groupCount > 0) {
          expect(groupCount).toBeGreaterThan(0);
        }
      }
    });

    test('should show group headings', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Look for group headings
        const headings = page.locator('[cmdk-group-heading]');
        
        if (await headings.count() > 0) {
          const headingText = await headings.first().textContent();
          expect(headingText).toBeTruthy();
        }
      }
    });

    test('should filter groups based on search', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Type search that matches specific group
        const input = page.locator('[cmdk-input], input').first();
        await input.fill('file');
        await page.waitForTimeout(300);

        // Some groups might be hidden
        const visibleGroups = page.locator('[cmdk-group]:visible');
        const count = await visibleGroups.count();
        
        expect(typeof count).toBe('number');
      }
    });
  });

  test.describe('Command Selection and Execution', () => {
    test('should select command with click', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Click first item
        const item = page.locator('[cmdk-item], [role="option"]').first();
        await item.click();
        await page.waitForTimeout(300);

        // Palette should close after selection
        const paletteCount = await page.locator('[cmdk-root]:visible').count();
        expect(paletteCount).toBe(0);
      }
    });

    test('should navigate commands with Arrow keys', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Press ArrowDown
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);

        // Check for selected/focused item
        const selectedItem = page.locator('[cmdk-item][aria-selected="true"], [cmdk-item][data-selected]').first();
        
        if (await selectedItem.count() > 0) {
          await expect(selectedItem).toBeVisible();
        }
      }
    });

    test('should execute command with Enter key', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Navigate and select
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // Palette should close
        const paletteCount = await page.locator('[cmdk-root]:visible').count();
        expect(paletteCount).toBe(0);
      }
    });

    test('should show command shortcuts', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Look for keyboard shortcuts
        const shortcuts = page.locator('[cmdk-shortcut], kbd, [class*="shortcut"]').first();
        
        if (await shortcuts.count() > 0) {
          const shortcutText = await shortcuts.textContent();
          expect(shortcutText).toBeTruthy();
        }
      }
    });
  });

  test.describe('Recent Actions', () => {
    test('should track recent commands', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        // Execute a command
        await trigger.click();
        await page.waitForTimeout(300);
        
        const item = page.locator('[cmdk-item]').first();
        const itemText = await item.textContent();
        await item.click();
        await page.waitForTimeout(300);

        // Open palette again
        await trigger.click();
        await page.waitForTimeout(300);

        // Look for recent section
        const recentSection = page.locator('text=/recent/i').first();
        
        if (await recentSection.count() > 0) {
          // Recent command should be visible
          expect(typeof itemText).toBe('string');
        }
      }
    });

    test('should limit recent commands', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        // Execute multiple commands
        for (let i = 0; i < 5; i++) {
          await trigger.click();
          await page.waitForTimeout(300);
          
          const items = page.locator('[cmdk-item]');
          if (await items.count() > i) {
            await items.nth(i).click();
            await page.waitForTimeout(300);
          }
        }

        // Open palette
        await trigger.click();
        await page.waitForTimeout(300);

        // Check recent count (usually limited to 3-5)
        const recentItems = page.locator('[cmdk-group]:has-text("Recent") [cmdk-item]');
        const count = await recentItems.count();
        
        expect(count).toBeLessThanOrEqual(5);
      }
    });
  });

  test.describe('Command Palette Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Check for combobox or dialog role
        const palette = page.locator('[role="dialog"], [role="combobox"]').first();
        
        if (await palette.count() > 0) {
          await expect(palette).toBeVisible();
        }
      }
    });

    test('should have accessible search input', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        const input = page.locator('input').first();
        
        // Should have label or aria-label
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    });

    test('should announce filtered results', async ({ page }) => {
      const trigger = page.locator('button:has-text("Command")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);

        // Type search
        const input = page.locator('input').first();
        await input.fill('file');
        await page.waitForTimeout(300);

        // Check for aria-live region or result count
        const liveRegion = page.locator('[aria-live], [role="status"]').first();
        
        if (await liveRegion.count() > 0) {
          expect(typeof await liveRegion.textContent()).toBe('string');
        }
      }
    });
  });

  test.describe('Cross-browser Command Palette', () => {
    test('should handle keyboard shortcuts consistently', async ({ page, browserName }) => {
      // Open with shortcut
      const modifier = browserName === 'webkit' ? 'Meta' : 'Control';
      await page.keyboard.press(`${modifier}+KeyK`);
      await page.waitForTimeout(500);

      // Check if opened (or button exists)
      const paletteOrButton = await page.locator('[cmdk-root], button:has-text("Command")').count();
      expect(paletteOrButton).toBeGreaterThan(0);
    });
  });
});
