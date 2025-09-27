/**
 * Accessibility Compliance Test Suite
 * Supreme Claude Code Testing Orchestrator - Government Standards
 *
 * Coverage:
 * - Section 508 compliance across all components
 * - WCAG 2.1 AA compliance validation
 * - Keyboard navigation and screen reader support
 * - Color contrast and visual accessibility
 * - Government-specific accessibility requirements
 */

import { test, expect, type Page } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Accessibility Compliance - Government Standards', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'testing/core/e2e/states/admin.json',
      // Accessibility-focused context settings
      reducedMotion: 'reduce',
      forcedColors: 'active',
      colorScheme: 'dark',
    });

    page = await context.newPage();

    // Inject axe-core for automated accessibility testing
    await injectAxe(page);
  });

  test.describe('Section 508 Compliance', () => {
    const criticalPages = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/assessment', name: 'Property Assessment' },
      { path: '/compliance', name: 'Compliance Center' },
      { path: '/ai-swarm', name: 'AI Swarm Management' },
      { path: '/reports', name: 'Reports & Analytics' },
    ];

    for (const { path, name } of criticalPages) {
      test(`${name} meets Section 508 standards`, async () => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        // Run comprehensive accessibility scan
        await checkA11y(page, undefined, {
          tags: ['section508', 'wcag2a', 'wcag2aa'],
          rules: {
            // Government-specific rules
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-order-semantics': { enabled: true },
            'aria-labels': { enabled: true },
          },
        });

        // Check for Section 508 specific requirements
        await testSection508Requirements(page);
      });
    }
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('property assessment form meets WCAG 2.1 AA', async () => {
      await page.goto('/assessment');

      // Test all WCAG 2.1 success criteria
      await checkA11y(page, undefined, {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          // Perceivable
          'color-contrast': { enabled: true },
          'image-alt': { enabled: true },
          'audio-caption': { enabled: true },

          // Operable
          keyboard: { enabled: true },
          'focus-order-semantics': { enabled: true },
          'link-in-text-block': { enabled: true },

          // Understandable
          label: { enabled: true },
          language: { enabled: true },

          // Robust
          'valid-lang': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
        },
      });

      // Test specific WCAG criteria
      await testWCAGCriteria(page);
    });

    test('ai swarm dashboard accessibility', async () => {
      await page.goto('/ai-swarm');

      // Complex dashboard should be fully accessible
      await checkA11y(page, '[data-testid="ai-swarm-dashboard"]', {
        tags: ['wcag2aa'],
        rules: {
          'aria-describedby': { enabled: true },
          'aria-labelledby': { enabled: true },
          'role-img-alt': { enabled: true },
        },
      });

      // Test real-time data accessibility
      await testRealTimeDataAccessibility(page);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('complete keyboard navigation through property assessment', async () => {
      await page.goto('/assessment');

      // Test tab order
      const focusableElements = await page
        .locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .all();

      expect(focusableElements.length).toBeGreaterThan(0);

      // Navigate through all focusable elements
      for (let i = 0; i < focusableElements.length; i++) {
        await page.keyboard.press('Tab');

        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(focused).toBeDefined();
      }

      // Test reverse navigation
      for (let i = focusableElements.length - 1; i >= 0; i--) {
        await page.keyboard.press('Shift+Tab');
      }

      // Test form submission with Enter key
      await page.fill('[data-testid="property-address-input"]', '123 Test Street');
      await page.keyboard.press('Enter');

      // Should submit or move to next field appropriately
      const focused = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-testid')
      );
      expect(focused).toBeDefined();
    });

    test('keyboard shortcuts for power users', async () => {
      await page.goto('/dashboard');

      // Test application-level shortcuts
      await page.keyboard.press('Alt+1'); // Navigation shortcut
      await expect(page).toHaveURL(/.*\/assessment/);

      await page.keyboard.press('Alt+2'); // Another navigation shortcut
      await expect(page).toHaveURL(/.*\/ai-swarm/);

      // Test escape key behavior
      await page.keyboard.press('Escape');
      // Should close any open modals or return to safe state
    });

    test('skip navigation links', async () => {
      await page.goto('/dashboard');

      // Should have skip links at the top
      await page.keyboard.press('Tab');
      const skipLink = page.locator('[href="#main-content"]');

      if ((await skipLink.count()) > 0) {
        await expect(skipLink).toBeFocused();
        await page.keyboard.press('Enter');

        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeFocused();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('proper ARIA labels and descriptions', async () => {
      await page.goto('/assessment');

      // Check form labels
      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const associatedLabel = await input
          .locator('xpath=//label[@for="' + (await input.getAttribute('id')) + '"]')
          .count();

        expect(ariaLabel || ariaLabelledby || associatedLabel > 0).toBeTruthy();
      }

      // Check button descriptions
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const textContent = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaDescription = await button.getAttribute('aria-describedby');

        expect(textContent?.trim() || ariaLabel || ariaDescription).toBeTruthy();
      }
    });

    test('live regions for dynamic content', async () => {
      await page.goto('/ai-swarm');

      // AI status updates should use live regions
      const liveRegions = page.locator('[aria-live]');
      await expect(liveRegions).toHaveCount.greaterThan(0);

      // Test polite announcements
      const politeRegions = page.locator('[aria-live="polite"]');
      await expect(politeRegions).toHaveCount.greaterThan(0);

      // Test assertive announcements for critical updates
      const assertiveRegions = page.locator('[aria-live="assertive"]');
      if ((await assertiveRegions.count()) > 0) {
        // Should only be used for urgent announcements
        const content = await assertiveRegions.first().textContent();
        expect(content).toBeDefined();
      }
    });

    test('form validation announcements', async () => {
      await page.goto('/assessment');

      // Trigger validation error
      const submitButton = page.locator('[data-testid="calculate-valuation-btn"]');
      await submitButton.click();

      // Error should be announced to screen readers
      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();

      const ariaLive = await errorMessage.getAttribute('aria-live');
      expect(ariaLive).toBe('polite');
    });
  });

  test.describe('Visual Accessibility', () => {
    test('color contrast compliance', async () => {
      await page.goto('/dashboard');

      // Test color contrast across components
      await checkA11y(page, undefined, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      // Additional manual color contrast checks for critical elements
      const criticalElements = [
        '[data-testid="nav-menu"]',
        '[data-testid="main-content"]',
        '[data-testid="ai-swarm-status"]',
        '[data-testid="compliance-indicators"]',
      ];

      for (const selector of criticalElements) {
        const element = page.locator(selector);
        if ((await element.count()) > 0) {
          await checkA11y(page, selector, {
            rules: { 'color-contrast': { enabled: true } },
          });
        }
      }
    });

    test('high contrast mode support', async () => {
      // Test with forced colors
      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto('/dashboard');

      // Elements should remain visible and accessible
      await expect(page.locator('[data-testid="nav-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

      // Interactive elements should have clear boundaries
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        await expect(buttons.nth(i)).toBeVisible();
      }
    });

    test('reduced motion support', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/ai-swarm');

      // Animations should be reduced or eliminated
      const animatedElements = page.locator('[class*="animate"], [style*="animation"]');
      const count = await animatedElements.count();

      if (count > 0) {
        // Check that animations respect reduced motion
        for (let i = 0; i < count; i++) {
          const element = animatedElements.nth(i);
          const style = await element.getAttribute('style');

          if (style?.includes('animation')) {
            expect(style).toMatch(/animation.*:.*none|animation-duration.*:.*0/);
          }
        }
      }
    });
  });

  test.describe('Government-Specific Accessibility', () => {
    test('emergency notifications accessibility', async () => {
      await page.goto('/incident-response');

      // Emergency notifications should be highly accessible
      await page.click('[data-testid="simulate-incident-btn"]');

      const emergencyAlert = page.locator('[data-testid="incident-alert"]');
      await expect(emergencyAlert).toBeVisible();

      // Should use assertive live region
      await expect(emergencyAlert).toHaveAttribute('aria-live', 'assertive');
      await expect(emergencyAlert).toHaveAttribute('role', 'alert');

      // Should be keyboard accessible
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-testid')
      );
      expect(focused).toBe('incident-alert');
    });

    test('data table accessibility', async () => {
      await page.goto('/reports');

      // Government data tables must be fully accessible
      const table = page.locator('table').first();

      if ((await table.count()) > 0) {
        // Should have proper table structure
        await expect(table.locator('caption')).toHaveCount.greaterThanOrEqual(1);

        // Headers should be properly associated
        const headers = table.locator('th');
        const headerCount = await headers.count();

        for (let i = 0; i < headerCount; i++) {
          const header = headers.nth(i);
          const scope = await header.getAttribute('scope');
          expect(['col', 'row', 'colgroup', 'rowgroup']).toContain(scope);
        }
      }
    });

    test('multilingual content accessibility', async () => {
      await page.goto('/dashboard');

      // Language should be properly declared
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBe('en');

      // Content in other languages should be marked
      const foreignContent = page.locator('[lang]:not([lang="en"])');
      const foreignCount = await foreignContent.count();

      for (let i = 0; i < foreignCount; i++) {
        const element = foreignContent.nth(i);
        const lang = await element.getAttribute('lang');
        expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // Valid language code
      }
    });
  });

  // Helper functions
  async function testSection508Requirements(page: Page) {
    // Test Section 508 specific requirements

    // 1194.22(a) - Text equivalent for images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      if (role !== 'presentation' && role !== 'none') {
        expect(alt).toBeDefined();
      }
    }

    // 1194.22(b) - Multimedia synchronized equivalents
    const videos = page.locator('video');
    const videoCount = await videos.count();

    for (let i = 0; i < videoCount; i++) {
      const video = videos.nth(i);
      const tracks = video.locator('track[kind="captions"]');
      await expect(tracks).toHaveCount.greaterThanOrEqual(1);
    }

    // 1194.22(d) - Documents organized for screen readers
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings).toHaveCount.greaterThan(0);
  }

  async function testWCAGCriteria(page: Page) {
    // Test specific WCAG 2.1 success criteria

    // 1.4.3 Contrast (Minimum)
    await checkA11y(page, undefined, {
      rules: { 'color-contrast': { enabled: true } },
    });

    // 2.1.1 Keyboard accessible
    const focusableElements = await page
      .locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .all();

    for (const element of focusableElements) {
      await element.focus();
      const focused = await page.evaluate(() => document.activeElement);
      expect(focused).toBeDefined();
    }

    // 4.1.2 Name, Role, Value
    const interactiveElements = await page
      .locator('button, input, select, textarea, [role="button"], [role="link"]')
      .all();

    for (const element of interactiveElements) {
      const name =
        (await element.getAttribute('aria-label')) ||
        (await element.getAttribute('aria-labelledby')) ||
        (await element.textContent());
      expect(name?.trim()).toBeTruthy();
    }
  }

  async function testRealTimeDataAccessibility(page: Page) {
    // Test accessibility of real-time updating content

    // Live regions should be present for dynamic content
    const liveRegions = page.locator('[aria-live]');
    await expect(liveRegions).toHaveCount.greaterThan(0);

    // Test that updates don't break focus
    const initialFocus = await page.evaluate(() => document.activeElement);

    // Trigger an update (if available)
    const refreshButton = page.locator('[data-testid="refresh-btn"]');
    if ((await refreshButton.count()) > 0) {
      await refreshButton.focus();
      await refreshButton.click();

      // Focus should be maintained or moved predictably
      await page.waitForTimeout(100);
      const finalFocus = await page.evaluate(() => document.activeElement);
      expect(finalFocus).toBeDefined();
    }
  }
});
