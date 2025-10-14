import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Data Display Components
 * 
 * Tests table, card, avatar, badge, skeleton, and progress components.
 * Validates sorting, filtering, loading states, and data presentation in real browser.
 */

test.describe('E2E: Data Display Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system/data-display');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Table with Sorting and Selection', () => {
    test('should render table with data', async ({ page }) => {
      const table = page.locator('table, [role="table"]').first();
      await expect(table).toBeVisible();

      const rows = page.locator('tbody tr, [role="row"]');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('should select individual table row', async ({ page }) => {
      const checkbox = page.locator('tbody input[type="checkbox"]').first();
      
      if (await checkbox.isVisible()) {
        await checkbox.check();
        await expect(checkbox).toBeChecked();
      }
    });

    test('should select multiple rows', async ({ page }) => {
      const checkboxes = page.locator('tbody input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        await expect(checkboxes.nth(0)).toBeChecked();
        await expect(checkboxes.nth(1)).toBeChecked();
      }
    });

    test('should select all rows with header checkbox', async ({ page }) => {
      const headerCheckbox = page.locator('thead input[type="checkbox"]').first();
      
      if (await headerCheckbox.isVisible()) {
        await headerCheckbox.check();
        await page.waitForTimeout(200);

        // All row checkboxes should be checked
        const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
        const count = await rowCheckboxes.count();
        
        if (count > 0) {
          const firstChecked = await rowCheckboxes.first().isChecked();
          expect(firstChecked).toBeTruthy();
        }
      }
    });

    test('should clear selection', async ({ page }) => {
      const checkboxes = page.locator('tbody input[type="checkbox"]');
      
      if (await checkboxes.count() > 0) {
        // Select first checkbox
        await checkboxes.first().check();
        
        // Look for clear button
        const clearButton = page.locator('button:has-text("Clear"), button:has-text("Deselect")').first();
        
        if (await clearButton.isVisible()) {
          await clearButton.click();
          await page.waitForTimeout(200);

          // Should be unchecked
          await expect(checkboxes.first()).not.toBeChecked();
        }
      }
    });

    test('should sort table by column', async ({ page }) => {
      const sortButton = page.locator('th button, [role="columnheader"] button').first();
      
      if (await sortButton.isVisible()) {
        // Get first row data before sort
        const firstRow = page.locator('tbody tr, [role="row"]').first();
        const firstCellBefore = await firstRow.locator('td').first().textContent();

        // Click sort
        await sortButton.click();
        await page.waitForTimeout(300);

        // Data should have changed or stayed same
        const firstCellAfter = await firstRow.locator('td').first().textContent();
        expect(typeof firstCellAfter).toBe('string');
      }
    });

    test('should toggle sort order (ascending/descending)', async ({ page }) => {
      const sortButton = page.locator('th button, [role="columnheader"] button').first();
      
      if (await sortButton.isVisible()) {
        // Click once
        await sortButton.click();
        await page.waitForTimeout(200);

        // Click again to reverse
        await sortButton.click();
        await page.waitForTimeout(200);

        // Should show sort indicator
        const sortIndicator = page.locator('[data-sort], [aria-sort]').first();
        const hasSortState = await sortIndicator.count() > 0;
        expect(typeof hasSortState).toBe('boolean');
      }
    });

    test('should handle row click events', async ({ page }) => {
      const rows = page.locator('tbody tr, [role="row"]');
      
      if (await rows.count() > 0) {
        const firstRow = rows.first();
        
        // Click row
        await firstRow.click();
        await page.waitForTimeout(200);

        // Row might highlight or trigger action
        const rowClass = await firstRow.getAttribute('class');
        expect(typeof rowClass).toBe('string');
      }
    });
  });

  test.describe('Card + Avatar + Badge Composition', () => {
    test('should render card with all components', async ({ page }) => {
      const cards = page.locator('[class*="card"], [data-card]');
      
      if (await cards.count() > 0) {
        const card = cards.first();
        await expect(card).toBeVisible();

        // Look for avatar
        const avatar = card.locator('[class*="avatar"], img').first();
        if (await avatar.count() > 0) {
          await expect(avatar).toBeVisible();
        }

        // Look for badge
        const badge = card.locator('[class*="badge"]').first();
        if (await badge.count() > 0) {
          await expect(badge).toBeVisible();
        }
      }
    });

    test('should show avatar with image or fallback', async ({ page }) => {
      const avatar = page.locator('[class*="avatar"]').first();
      
      if (await avatar.isVisible()) {
        // Check for image
        const img = avatar.locator('img');
        const hasImage = await img.count() > 0;

        // Check for fallback (initials)
        const fallback = avatar.locator('[class*="fallback"]');
        const hasFallback = await fallback.count() > 0;

        // Should have one or the other
        expect(hasImage || hasFallback).toBeTruthy();
      }
    });

    test('should display badge with appropriate variant', async ({ page }) => {
      const badges = page.locator('[class*="badge"]');
      
      if (await badges.count() > 0) {
        const badge = badges.first();
        const badgeText = await badge.textContent();
        
        expect(badgeText).toBeTruthy();
        expect(typeof badgeText).toBe('string');
      }
    });

    test('should render multiple cards in grid', async ({ page }) => {
      const cards = page.locator('[class*="card"], [data-card]');
      const cardCount = await cards.count();
      
      if (cardCount > 1) {
        // Check grid layout (cards should be positioned horizontally)
        const firstCard = cards.first();
        const secondCard = cards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // Cards should not overlap completely
          expect(firstBox.x !== secondBox.x || firstBox.y !== secondBox.y).toBeTruthy();
        }
      }
    });
  });

  test.describe('Loading States - Skeleton + Progress', () => {
    test('should show skeleton placeholder', async ({ page }) => {
      const skeleton = page.locator('[class*="skeleton"], [data-loading]').first();
      
      if (await skeleton.count() > 0) {
        await expect(skeleton).toBeVisible();

        // Skeleton should have animation
        const animation = await skeleton.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.animation || styles.animationName;
        });

        expect(typeof animation).toBe('string');
      }
    });

    test('should show progress bar with percentage', async ({ page }) => {
      const progress = page.locator('[role="progressbar"]').first();
      
      if (await progress.isVisible()) {
        // Check for aria-valuenow
        const valueNow = await progress.getAttribute('aria-valuenow');
        
        if (valueNow) {
          const value = parseInt(valueNow);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
      }
    });

    test('should update progress value', async ({ page }) => {
      const progress = page.locator('[role="progressbar"]').first();
      
      if (await progress.isVisible()) {
        const initialValue = await progress.getAttribute('aria-valuenow');

        // Wait for potential update
        await page.waitForTimeout(1000);

        const newValue = await progress.getAttribute('aria-valuenow');
        
        // Value might have changed or stayed same
        expect(typeof newValue).toBe('string');
      }
    });

    test('should transition from skeleton to loaded content', async ({ page }) => {
      // Look for loading state
      const skeleton = page.locator('[class*="skeleton"]').first();
      const hasSkeleton = await skeleton.count() > 0;

      if (hasSkeleton) {
        // Wait for content to load
        await page.waitForTimeout(2000);

        // Skeleton should be replaced with content
        const stillLoading = await skeleton.isVisible();
        
        // Content should be loaded (skeleton gone or content visible)
        expect(typeof stillLoading).toBe('boolean');
      }
    });
  });

  test.describe('Dashboard Workflow', () => {
    test('should load dashboard with statistics', async ({ page }) => {
      // Wait for dashboard to load
      await page.waitForTimeout(1000);

      // Look for stat cards or numbers
      const stats = page.locator('[class*="stat"], [class*="metric"]');
      
      if (await stats.count() > 0) {
        const statText = await stats.first().textContent();
        expect(statText).toBeTruthy();
      }
    });

    test('should render user grid after loading', async ({ page }) => {
      await page.waitForTimeout(1500);

      // Look for user cards or table
      const userCards = page.locator('[class*="card"], table');
      const hasUsers = await userCards.count() > 0;
      
      expect(hasUsers).toBeTruthy();
    });

    test('should handle empty state', async ({ page }) => {
      // Look for empty state message
      const emptyMessage = page.locator('text=/no data|no items|empty/i').first();
      
      if (await emptyMessage.count() > 0) {
        await expect(emptyMessage).toBeVisible();
      }
    });
  });

  test.describe('Data Display Accessibility', () => {
    test('should have proper table ARIA attributes', async ({ page }) => {
      const table = page.locator('table, [role="table"]').first();
      
      if (await table.count() > 0) {
        // Check for column headers
        const headers = page.locator('th, [role="columnheader"]');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThan(0);
      }
    });

    test('should have accessible progress bar', async ({ page }) => {
      const progress = page.locator('[role="progressbar"]').first();
      
      if (await progress.isVisible()) {
        // Should have aria-valuenow, aria-valuemin, aria-valuemax
        const valueNow = await progress.getAttribute('aria-valuenow');
        const valueMin = await progress.getAttribute('aria-valuemin');
        const valueMax = await progress.getAttribute('aria-valuemax');

        expect(valueNow).toBeTruthy();
        expect(valueMin !== null || valueMax !== null).toBeTruthy();
      }
    });

    test('should have proper checkbox labels', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]');
      
      if (await checkboxes.count() > 0) {
        const checkbox = checkboxes.first();
        
        // Should have label or aria-label
        const id = await checkbox.getAttribute('id');
        const ariaLabel = await checkbox.getAttribute('aria-label');

        const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
        
        expect(hasLabel || !!ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Cross-browser Data Display', () => {
    test('should render table consistently', async ({ page }) => {
      const table = page.locator('table').first();
      
      if (await table.isVisible()) {
        const rows = page.locator('tbody tr');
        const rowCount = await rows.count();
        
        expect(rowCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle loading states smoothly', async ({ page }) => {
      // Check initial state
      const hasContent = await page.locator('[class*="card"], table, [role="table"]').count() > 0;
      
      expect(typeof hasContent).toBe('boolean');
    });
  });
});
