import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Visual Regression Testing
 * 
 * Captures screenshots of components in different states for visual comparison.
 * Detects unintended visual changes across code updates.
 */

test.describe('E2E: Visual Regression - Component Snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Button Component States', () => {
    test('should match button default state', async ({ page }) => {
      await page.goto('/design-system/buttons');
      await page.waitForLoadState('networkidle');

      const button = page.locator('button').first();
      await expect(button).toHaveScreenshot('button-default.png');
    });

    test('should match button hover state', async ({ page }) => {
      await page.goto('/design-system/buttons');
      await page.waitForLoadState('networkidle');

      const button = page.locator('button').first();
      await button.hover();
      await page.waitForTimeout(200);
      
      await expect(button).toHaveScreenshot('button-hover.png');
    });

    test('should match button focus state', async ({ page }) => {
      await page.goto('/design-system/buttons');
      await page.waitForLoadState('networkidle');

      const button = page.locator('button').first();
      await button.focus();
      await page.waitForTimeout(200);
      
      await expect(button).toHaveScreenshot('button-focus.png');
    });

    test('should match button disabled state', async ({ page }) => {
      await page.goto('/design-system/buttons');
      await page.waitForLoadState('networkidle');

      const disabledButton = page.locator('button[disabled]').first();
      
      if (await disabledButton.count() > 0) {
        await expect(disabledButton).toHaveScreenshot('button-disabled.png');
      }
    });

    test('should match button variants', async ({ page }) => {
      await page.goto('/design-system/buttons');
      await page.waitForLoadState('networkidle');

      const buttonsContainer = page.locator('div').first();
      await expect(buttonsContainer).toHaveScreenshot('button-variants.png');
    });
  });

  test.describe('Form Component States', () => {
    test('should match input default state', async ({ page }) => {
      await page.goto('/design-system/forms');
      await page.waitForLoadState('networkidle');

      const input = page.locator('input').first();
      await expect(input).toHaveScreenshot('input-default.png');
    });

    test('should match input focus state', async ({ page }) => {
      await page.goto('/design-system/forms');
      await page.waitForLoadState('networkidle');

      const input = page.locator('input').first();
      await input.focus();
      await page.waitForTimeout(200);
      
      await expect(input).toHaveScreenshot('input-focus.png');
    });

    test('should match input error state', async ({ page }) => {
      await page.goto('/design-system/forms');
      await page.waitForLoadState('networkidle');

      const input = page.locator('input[aria-invalid="true"]').first();
      
      if (await input.count() > 0) {
        await expect(input).toHaveScreenshot('input-error.png');
      }
    });

    test('should match input filled state', async ({ page }) => {
      await page.goto('/design-system/forms');
      await page.waitForLoadState('networkidle');

      const input = page.locator('input').first();
      await input.fill('Test Input Value');
      await page.waitForTimeout(200);
      
      await expect(input).toHaveScreenshot('input-filled.png');
    });
  });

  test.describe('Dialog Component States', () => {
    test('should match closed dialog state', async ({ page }) => {
      await page.goto('/design-system/dialogs');
      await page.waitForLoadState('networkidle');

      const trigger = page.locator('button:has-text("Open")').first();
      await expect(trigger).toHaveScreenshot('dialog-trigger.png');
    });

    test('should match open dialog state', async ({ page }) => {
      await page.goto('/design-system/dialogs');
      await page.waitForLoadState('networkidle');

      const trigger = page.locator('button:has-text("Open"), button:has-text("Edit")').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(500);

        const dialog = page.locator('[role="dialog"]').first();
        
        if (await dialog.isVisible()) {
          await expect(page).toHaveScreenshot('dialog-open.png');
        }
      }
    });
  });

  test.describe('Navigation Component States', () => {
    test('should match tabs default state', async ({ page }) => {
      await page.goto('/design-system/navigation');
      await page.waitForLoadState('networkidle');

      const tabs = page.locator('[role="tablist"]').first();
      
      if (await tabs.isVisible()) {
        await expect(tabs).toHaveScreenshot('tabs-default.png');
      }
    });

    test('should match accordion collapsed state', async ({ page }) => {
      await page.goto('/design-system/navigation');
      await page.waitForLoadState('networkidle');

      const accordion = page.locator('[data-radix-collection-item]').first();
      
      if (await accordion.isVisible()) {
        await expect(accordion).toHaveScreenshot('accordion-collapsed.png');
      }
    });

    test('should match accordion expanded state', async ({ page }) => {
      await page.goto('/design-system/navigation');
      await page.waitForLoadState('networkidle');

      const accordion = page.locator('[data-radix-collection-item]').first();
      
      if (await accordion.isVisible()) {
        await accordion.click();
        await page.waitForTimeout(500);
        
        await expect(accordion).toHaveScreenshot('accordion-expanded.png');
      }
    });
  });

  test.describe('Card Component States', () => {
    test('should match card default state', async ({ page }) => {
      await page.goto('/design-system/data-display');
      await page.waitForLoadState('networkidle');

      const card = page.locator('[class*="card"]').first();
      
      if (await card.isVisible()) {
        await expect(card).toHaveScreenshot('card-default.png');
      }
    });

    test('should match card with avatar and badge', async ({ page }) => {
      await page.goto('/design-system/data-display');
      await page.waitForLoadState('networkidle');

      const card = page.locator('[class*="card"]:has([class*="avatar"])').first();
      
      if (await card.isVisible()) {
        await expect(card).toHaveScreenshot('card-with-avatar-badge.png');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should match mobile viewport (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/design-system');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('responsive-mobile-375.png', { fullPage: true });
    });

    test('should match tablet viewport (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/design-system');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('responsive-tablet-768.png', { fullPage: true });
    });

    test('should match desktop viewport (1920x1080)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/design-system');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('responsive-desktop-1920.png', { fullPage: true });
    });
  });

  test.describe('Dark Mode (if applicable)', () => {
    test('should match dark mode components', async ({ page }) => {
      await page.goto('/design-system');
      await page.waitForLoadState('networkidle');

      // Toggle dark mode (adjust selector as needed)
      const darkModeToggle = page.locator('button:has-text("Dark"), [aria-label*="dark mode"]').first();
      
      if (await darkModeToggle.count() > 0) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('dark-mode.png', { fullPage: true });
      }
    });
  });

  test.describe('Loading States', () => {
    test('should match skeleton loading state', async ({ page }) => {
      await page.goto('/design-system/data-display');
      await page.waitForLoadState('networkidle');

      const skeleton = page.locator('[class*="skeleton"]').first();
      
      if (await skeleton.isVisible()) {
        await expect(skeleton).toHaveScreenshot('skeleton-loading.png');
      }
    });

    test('should match progress bar state', async ({ page }) => {
      await page.goto('/design-system/data-display');
      await page.waitForLoadState('networkidle');

      const progress = page.locator('[role="progressbar"]').first();
      
      if (await progress.isVisible()) {
        await expect(progress).toHaveScreenshot('progress-bar.png');
      }
    });
  });

  test.describe('Full Page Snapshots', () => {
    test('should match complete design system page', async ({ page }) => {
      await page.goto('/design-system');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('design-system-full-page.png', { 
        fullPage: true,
        timeout: 10000
      });
    });

    test('should match forms page', async ({ page }) => {
      await page.goto('/design-system/forms');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('forms-page-full.png', { 
        fullPage: true,
        timeout: 10000
      });
    });

    test('should match navigation page', async ({ page }) => {
      await page.goto('/design-system/navigation');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('navigation-page-full.png', { 
        fullPage: true,
        timeout: 10000
      });
    });
  });
});
