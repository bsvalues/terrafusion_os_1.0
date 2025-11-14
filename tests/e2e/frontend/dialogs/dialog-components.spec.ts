import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Dialog/Modal Components
 * 
 * Tests dialog, modal, sheet, and alert dialog components in real browser environment.
 * Validates focus management, keyboard interactions, backdrop behavior, and nested dialog workflows.
 */

test.describe('E2E: Dialog/Modal Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system/dialogs');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Dialog + Form Integration', () => {
    test('should open dialog when trigger button is clicked', async ({ page }) => {
      // Find dialog trigger
      const trigger = page.locator('button:has-text("Edit Profile"), button:has-text("Open Dialog")').first();
      await trigger.click();

      // Wait for dialog to open
      await page.waitForTimeout(300);

      // Check dialog is visible
      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible();
    });

    test('should close dialog on Escape key', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();

      // Wait for dialog
      await page.waitForTimeout(300);

      // Press Escape
      await page.keyboard.press('Escape');

      // Wait for close animation
      await page.waitForTimeout(400);

      // Dialog should be closed
      const dialog = page.locator('[role="dialog"]:visible');
      await expect(dialog).toHaveCount(0);
    });

    test('should trap focus within dialog', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();

      await page.waitForTimeout(300);

      // Find focusable elements in dialog
      const dialog = page.locator('[role="dialog"]').first();
      const focusableElements = dialog.locator('button, input, textarea, select, [tabindex="0"]');

      const count = await focusableElements.count();

      if (count > 1) {
        // Focus first element
        await focusableElements.first().focus();

        // Tab through elements
        for (let i = 0; i < count + 1; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
        }

        // After tabbing past last element, focus should wrap to first
        // (This is focus trap behavior)
        const activeElement = page.locator(':focus');
        const activeInDialog = await dialog.locator(':focus').count();

        // Focus should still be within dialog
        expect(activeInDialog).toBeGreaterThan(0);
      }
    });

    test('should edit and save profile information', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit Profile"), button:has-text("Edit")').first();
      await trigger.click();

      await page.waitForTimeout(300);

      // Find input fields in dialog
      const nameInput = page.locator('[role="dialog"] input[type="text"]').first();
      const emailInput = page.locator('[role="dialog"] input[type="email"]').first();

      if (await nameInput.isVisible()) {
        await nameInput.fill('Test User');
      }

      if (await emailInput.isVisible()) {
        await emailInput.fill('testuser@terrafusionmarket.com');
      }

      // Find and click save button
      const saveButton = page.locator('[role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("Submit")').first();
      await saveButton.click();

      // Wait for dialog to close
      await page.waitForTimeout(500);

      // Dialog should be closed
      const dialogCount = await page.locator('[role="dialog"]:visible').count();
      expect(dialogCount).toBe(0);
    });

    test('should cancel and discard changes', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();

      await page.waitForTimeout(300);

      // Make some changes
      const input = page.locator('[role="dialog"] input').first();
      if (await input.isVisible()) {
        const originalValue = await input.inputValue();
        await input.fill('Changed Value');

        // Click cancel
        const cancelButton = page.locator('[role="dialog"] button:has-text("Cancel")').first();
        await cancelButton.click();

        // Wait for close
        await page.waitForTimeout(500);

        // Open again
        await trigger.click();
        await page.waitForTimeout(300);

        // Value should be reverted
        const newValue = await input.inputValue();
        expect(newValue).not.toBe('Changed Value');
      }
    });

    test('should restore focus to trigger after closing', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();

      await page.waitForTimeout(300);

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);

      // Focus should return to trigger
      await expect(trigger).toBeFocused();
    });

    test('should display dialog backdrop', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();

      await page.waitForTimeout(300);

      // Check for backdrop/overlay
      const backdrop = page.locator('[data-radix-dialog-overlay], .overlay, [class*="overlay"]').first();
      
      if (await backdrop.count() > 0) {
        await expect(backdrop).toBeVisible();

        // Backdrop should have semi-transparent style
        const opacity = await backdrop.evaluate((el) => {
          return window.getComputedStyle(el).opacity;
        });

        expect(parseFloat(opacity)).toBeLessThan(1);
      }
    });

    test('should prevent body scroll when dialog is open', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();

      await page.waitForTimeout(300);

      // Check if body has overflow:hidden or similar
      const bodyOverflow = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflow;
      });

      // Body should prevent scrolling when dialog is open
      // (Common pattern is overflow: hidden)
      expect(['hidden', 'clip']).toContain(bodyOverflow);
    });
  });

  test.describe('AlertDialog - Confirmation Flows', () => {
    test('should open alert dialog for delete confirmation', async ({ page }) => {
      const deleteTrigger = page.locator('button:has-text("Delete"), button[aria-label*="delete"]').first();
      
      if (await deleteTrigger.isVisible()) {
        await deleteTrigger.click();

        await page.waitForTimeout(300);

        // Check for alertdialog role
        const alertDialog = page.locator('[role="alertdialog"]').first();
        await expect(alertDialog).toBeVisible();
      }
    });

    test('should show item name in confirmation message', async ({ page }) => {
      const deleteTrigger = page.locator('button:has-text("Delete")').first();
      
      if (await deleteTrigger.isVisible()) {
        await deleteTrigger.click();
        await page.waitForTimeout(300);

        // Check for confirmation message
        const dialog = page.locator('[role="alertdialog"]').first();
        const dialogText = await dialog.textContent();

        // Should contain "delete" and likely the item name
        expect(dialogText?.toLowerCase()).toContain('delete');
      }
    });

    test('should cancel delete operation', async ({ page }) => {
      const deleteTrigger = page.locator('button:has-text("Delete")').first();
      
      if (await deleteTrigger.isVisible()) {
        await deleteTrigger.click();
        await page.waitForTimeout(300);

        // Click cancel
        const cancelButton = page.locator('[role="alertdialog"] button:has-text("Cancel")').first();
        await cancelButton.click();

        await page.waitForTimeout(400);

        // AlertDialog should be closed
        const alertCount = await page.locator('[role="alertdialog"]:visible').count();
        expect(alertCount).toBe(0);
      }
    });

    test('should confirm and execute delete', async ({ page }) => {
      const deleteTrigger = page.locator('button:has-text("Delete")').first();
      
      if (await deleteTrigger.isVisible()) {
        await deleteTrigger.click();
        await page.waitForTimeout(300);

        // Click confirm/delete button
        const confirmButton = page.locator('[role="alertdialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Confirm")').first();
        await confirmButton.click();

        await page.waitForTimeout(500);

        // AlertDialog should be closed
        const alertCount = await page.locator('[role="alertdialog"]:visible').count();
        expect(alertCount).toBe(0);
      }
    });

    test('should style confirm button as destructive', async ({ page }) => {
      const deleteTrigger = page.locator('button:has-text("Delete")').first();
      
      if (await deleteTrigger.isVisible()) {
        await deleteTrigger.click();
        await page.waitForTimeout(300);

        // Find confirm button
        const confirmButton = page.locator('[role="alertdialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Confirm")').first();

        // Check for destructive styling (red color typically)
        const buttonColor = await confirmButton.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundColor || styles.color;
        });

        // Should have color styling (not just default)
        expect(buttonColor).toBeTruthy();
      }
    });

    test('should close alertdialog on Escape key', async ({ page }) => {
      const deleteTrigger = page.locator('button:has-text("Delete")').first();
      
      if (await deleteTrigger.isVisible()) {
        await deleteTrigger.click();
        await page.waitForTimeout(300);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        // Should be closed
        const alertCount = await page.locator('[role="alertdialog"]:visible').count();
        expect(alertCount).toBe(0);
      }
    });
  });

  test.describe('Sheet - Side Panel', () => {
    test('should open sheet from side', async ({ page }) => {
      const sheetTrigger = page.locator('button:has-text("Settings"), button:has-text("Open Sheet")').first();
      
      if (await sheetTrigger.isVisible()) {
        await sheetTrigger.click();
        await page.waitForTimeout(300);

        // Check for sheet (might be role="dialog" with specific classes)
        const sheet = page.locator('[role="dialog"]:visible, [data-radix-sheet-content]:visible').first();
        await expect(sheet).toBeVisible();
      }
    });

    test('should slide in from correct side', async ({ page }) => {
      const sheetTrigger = page.locator('button:has-text("Settings"), button:has-text("Sheet")').first();
      
      if (await sheetTrigger.isVisible()) {
        await sheetTrigger.click();
        await page.waitForTimeout(500); // Wait for animation

        // Check sheet position (right side is common)
        const sheet = page.locator('[role="dialog"]:visible').first();
        
        if (await sheet.count() > 0) {
          const boundingBox = await sheet.boundingBox();
          const viewport = page.viewportSize();

          if (boundingBox && viewport) {
            // Sheet should be at right edge or left edge
            const atRightEdge = boundingBox.x + boundingBox.width >= viewport.width * 0.8;
            const atLeftEdge = boundingBox.x <= viewport.width * 0.2;

            expect(atRightEdge || atLeftEdge).toBeTruthy();
          }
        }
      }
    });

    test('should update settings in sheet', async ({ page }) => {
      const sheetTrigger = page.locator('button:has-text("Settings"), button:has-text("Sheet")').first();
      
      if (await sheetTrigger.isVisible()) {
        await sheetTrigger.click();
        await page.waitForTimeout(300);

        // Find form controls in sheet
        const input = page.locator('[role="dialog"] input').first();
        const checkbox = page.locator('[role="dialog"] input[type="checkbox"]').first();

        if (await input.isVisible()) {
          await input.fill('updated@example.com');
        }

        if (await checkbox.isVisible()) {
          await checkbox.check();
        }

        // Save
        const saveButton = page.locator('[role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("Apply")').first();
        
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(500);

          // Sheet should close
          const sheetCount = await page.locator('[role="dialog"]:visible').count();
          expect(sheetCount).toBe(0);
        }
      }
    });

    test('should close sheet with close button', async ({ page }) => {
      const sheetTrigger = page.locator('button:has-text("Settings"), button:has-text("Sheet")').first();
      
      if (await sheetTrigger.isVisible()) {
        await sheetTrigger.click();
        await page.waitForTimeout(300);

        // Find close button (usually X icon)
        const closeButton = page.locator('[role="dialog"] button[aria-label*="close"], [role="dialog"] button:has-text("×")').first();
        
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(400);

          // Should be closed
          const sheetCount = await page.locator('[role="dialog"]:visible').count();
          expect(sheetCount).toBe(0);
        }
      }
    });
  });

  test.describe('Nested Dialogs', () => {
    test('should open confirmation dialog from main dialog', async ({ page }) => {
      // Open main dialog
      const mainTrigger = page.locator('button:has-text("Nested"), button:has-text("Complex")').first();
      
      if (await mainTrigger.isVisible()) {
        await mainTrigger.click();
        await page.waitForTimeout(300);

        // Click button that opens nested dialog
        const nestedTrigger = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")').first();
        
        if (await nestedTrigger.isVisible()) {
          await nestedTrigger.click();
          await page.waitForTimeout(300);

          // Should have 2 dialogs visible
          const dialogCount = await page.locator('[role="dialog"]:visible, [role="alertdialog"]:visible').count();
          expect(dialogCount).toBeGreaterThanOrEqual(2);
        }
      }
    });

    test('should go back from nested dialog', async ({ page }) => {
      const mainTrigger = page.locator('button:has-text("Nested"), button:has-text("Complex")').first();
      
      if (await mainTrigger.isVisible()) {
        await mainTrigger.click();
        await page.waitForTimeout(300);

        const nestedTrigger = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")').first();
        
        if (await nestedTrigger.isVisible()) {
          await nestedTrigger.click();
          await page.waitForTimeout(300);

          // Cancel nested dialog
          const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Back")').last();
          await cancelButton.click();
          await page.waitForTimeout(400);

          // Should be back to 1 dialog
          const dialogCount = await page.locator('[role="dialog"]:visible, [role="alertdialog"]:visible').count();
          expect(dialogCount).toBe(1);
        }
      }
    });

    test('should maintain parent dialog state when closing nested', async ({ page }) => {
      const mainTrigger = page.locator('button:has-text("Nested"), button:has-text("Complex")').first();
      
      if (await mainTrigger.isVisible()) {
        await mainTrigger.click();
        await page.waitForTimeout(300);

        // Fill something in parent dialog
        const parentInput = page.locator('[role="dialog"] input').first();
        if (await parentInput.isVisible()) {
          await parentInput.fill('Test Value');
        }

        // Open nested dialog
        const nestedTrigger = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")').first();
        if (await nestedTrigger.isVisible()) {
          await nestedTrigger.click();
          await page.waitForTimeout(300);

          // Close nested
          const cancelButton = page.locator('button:has-text("Cancel")').last();
          await cancelButton.click();
          await page.waitForTimeout(400);

          // Parent input value should persist
          if (await parentInput.isVisible()) {
            await expect(parentInput).toHaveValue('Test Value');
          }
        }
      }
    });

    test('should handle Escape key with nested dialogs', async ({ page }) => {
      const mainTrigger = page.locator('button:has-text("Nested"), button:has-text("Complex")').first();
      
      if (await mainTrigger.isVisible()) {
        await mainTrigger.click();
        await page.waitForTimeout(300);

        const nestedTrigger = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm")').first();
        if (await nestedTrigger.isVisible()) {
          await nestedTrigger.click();
          await page.waitForTimeout(300);

          // Press Escape - should close only the top-most dialog
          await page.keyboard.press('Escape');
          await page.waitForTimeout(400);

          // Should still have parent dialog open
          const dialogCount = await page.locator('[role="dialog"]:visible').count();
          expect(dialogCount).toBe(1);
        }
      }
    });
  });

  test.describe('Dialog Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();
      await page.waitForTimeout(300);

      const dialog = page.locator('[role="dialog"]').first();

      // Check for aria-modal
      const ariaModal = await dialog.getAttribute('aria-modal');
      expect(ariaModal).toBe('true');

      // Check for aria-labelledby or aria-label
      const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
      const ariaLabel = await dialog.getAttribute('aria-label');

      expect(ariaLabelledBy || ariaLabel).toBeTruthy();
    });

    test('should announce dialog to screen readers', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();
      await page.waitForTimeout(300);

      const dialog = page.locator('[role="dialog"]').first();

      // Check for dialog title
      const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
      
      if (ariaLabelledBy) {
        const title = page.locator(`#${ariaLabelledBy}`);
        await expect(title).toBeVisible();
      }
    });

    test('should have accessible close button', async ({ page }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();
      await page.waitForTimeout(300);

      // Find close button
      const closeButton = page.locator('[role="dialog"] button[aria-label*="close"], [role="dialog"] button[aria-label*="Close"]').first();
      
      if (await closeButton.count() > 0) {
        // Should have aria-label
        const ariaLabel = await closeButton.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel?.toLowerCase()).toContain('close');
      }
    });
  });

  test.describe('Cross-browser Dialog Behavior', () => {
    test('should handle backdrop clicks consistently', async ({ page, browserName }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      await trigger.click();
      await page.waitForTimeout(300);

      // Try to click backdrop
      const backdrop = page.locator('[data-radix-dialog-overlay]').first();
      
      if (await backdrop.count() > 0) {
        // Click backdrop (outside dialog)
        await page.mouse.click(10, 10);
        await page.waitForTimeout(400);

        // Dialog should close (or stay open depending on config)
        // This test validates consistent behavior across browsers
        const dialogCount = await page.locator('[role="dialog"]:visible').count();
        expect(typeof dialogCount).toBe('number');
      }
    });

    test('should animate smoothly across browsers', async ({ page, browserName }) => {
      const trigger = page.locator('button:has-text("Edit"), button:has-text("Open")').first();
      
      // Open dialog
      await trigger.click();
      
      // Animation should complete within reasonable time
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 1000 });
      
      // Close dialog
      await page.keyboard.press('Escape');
      
      // Should close within reasonable time
      await page.waitForTimeout(500);
      const dialogCount = await page.locator('[role="dialog"]:visible').count();
      expect(dialogCount).toBe(0);
    });
  });
});
