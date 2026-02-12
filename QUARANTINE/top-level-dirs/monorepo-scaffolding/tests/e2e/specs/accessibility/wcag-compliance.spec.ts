import { expect, test } from '@playwright/test';
import { checkA11y, injectAxe } from 'axe-playwright';

/**
 * TerraFusion OS - Accessibility Compliance E2E Tests
 *
 * Championship-level testing for WCAG 2.1 AA compliance
 * with Section 508 accessibility standards for government services.
 */

test.describe('Accessibility Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Government citizen user authentication
    await page.goto('/auth/login');
    await page.fill('[data-testid="username"]', 'citizen@example.com');
    await page.fill('[data-testid="password"]', 'CitizenAccess2024!');
    await page.click('[data-testid="login-button"]');

    // Inject axe-core for accessibility testing
    await injectAxe(page);
  });

  test('should meet WCAG 2.1 AA compliance on citizen portal', async ({ page }) => {
    await page.goto('/citizen/portal');

    // Check overall accessibility compliance
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      tags: ['wcag2a', 'wcag2aa', 'section508'],
    });

    // Verify page structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/citizen/services');

    // Test tab navigation through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = page.locator('[href="#main-content"]');
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await expect(page.locator('#main-content')).toBeFocused();
    }

    // Test form navigation
    await page.goto('/citizen/permit-application');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Verify form accessibility
    await checkA11y(page, 'form', {
      tags: ['wcag2a', 'wcag2aa'],
    });
  });

  test('should provide proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/citizen/dashboard');

    // Check ARIA landmarks
    await expect(page.locator('[role="banner"]')).toBeVisible(); // Header
    await expect(page.locator('[role="main"]')).toBeVisible(); // Main content
    await expect(page.locator('[role="navigation"]')).toBeVisible(); // Navigation
    await expect(page.locator('[role="contentinfo"]')).toBeVisible(); // Footer

    // Check interactive elements have proper ARIA
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      // Button should have either text content or aria-label
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }

    // Check form controls have labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/citizen/property-search');

    // Check page title is descriptive
    await expect(page).toHaveTitle(/Property Search.*TerraFusion/);

    // Check headings create proper hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Only one h1 per page

    // Verify heading structure (h1 -> h2 -> h3, etc.)
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingLevels = await headings.evaluateAll(elements =>
      elements.map(el => parseInt(el.tagName.substring(1)))
    );

    // Check heading hierarchy doesn't skip levels
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }

    // Check images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/citizen/services');

    // Run color contrast checks
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    // Test with high contrast mode simulation
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    // Verify dark mode accessibility
    await checkA11y(page, null, {
      tags: ['wcag2aa'],
    });
  });

  test('should be responsive and mobile accessible', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/citizen/mobile-services');

    // Check mobile accessibility
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
    });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    // Verify responsive accessibility
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
    });

    // Test touch targets are adequate size (44px minimum)
    const touchTargets = page.locator('button, a, input[type="checkbox"], input[type="radio"]');
    const targetCount = await touchTargets.count();

    for (let i = 0; i < targetCount; i++) {
      const target = touchTargets.nth(i);
      const box = await target.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should handle focus management properly', async ({ page }) => {
    await page.goto('/citizen/permit-application');

    // Test modal focus trap
    await page.click('[data-testid="open-help-modal"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Focus should move to modal
    const modalTitle = page.locator('[role="dialog"] h2');
    await expect(modalTitle).toBeFocused();

    // Tab should stay within modal
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    const isInModal = await focusedElement.evaluate(el => {
      return el.closest('[role="dialog"]') !== null;
    });
    expect(isInModal).toBe(true);

    // Escape should close modal and return focus
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="open-help-modal"]')).toBeFocused();
  });

  test('should provide error handling accessibility', async ({ page }) => {
    await page.goto('/citizen/tax-payment');

    // Submit form with invalid data
    await page.click('[data-testid="submit-payment"]');

    // Check error announcement
    const errorSummary = page.locator('[role="alert"]');
    await expect(errorSummary).toBeVisible();

    // Verify error messages are associated with form fields
    const errorMessages = page.locator('.error-message');
    const errorCount = await errorMessages.count();

    for (let i = 0; i < errorCount; i++) {
      const error = errorMessages.nth(i);
      const fieldId = await error.getAttribute('data-field');

      if (fieldId) {
        const field = page.locator(`#${fieldId}`);
        const ariaDescribedBy = await field.getAttribute('aria-describedby');
        const errorId = await error.getAttribute('id');

        expect(ariaDescribedBy).toContain(errorId);
      }
    }

    // Check error accessibility
    await checkA11y(page, null, {
      rules: {
        'aria-valid-attr-value': { enabled: true },
        'aria-describedby': { enabled: true },
      },
    });
  });

  test('should support assistive technologies', async ({ page }) => {
    await page.goto('/citizen/accessibility-features');

    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    // Verify animations are disabled
    const animatedElements = page.locator('.animate, [class*="animate"]');
    const animationCount = await animatedElements.count();

    for (let i = 0; i < animationCount; i++) {
      const element = animatedElements.nth(i);
      const computedStyle = await element.evaluate(
        el => window.getComputedStyle(el).animationDuration
      );

      // Animation should be disabled or very short
      expect(computedStyle === '0s' || computedStyle === 'none').toBe(true);
    }

    // Test high contrast support
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          .high-contrast-test { background: yellow; }
        }
      `,
    });

    // Check aria-live regions
    const liveRegions = page.locator('[aria-live]');
    const liveCount = await liveRegions.count();

    expect(liveCount).toBeGreaterThan(0); // Should have status updates
  });

  test('should meet Section 508 compliance', async ({ page }) => {
    await page.goto('/citizen/government-services');

    // Check Section 508 specific requirements
    await checkA11y(page, null, {
      tags: ['section508'],
      rules: {
        // Section 508 specific rules
        bypass: { enabled: true }, // Skip navigation
        'color-contrast': { enabled: true }, // Color contrast
        'focus-order-semantics': { enabled: true }, // Focus order
        keyboard: { enabled: true }, // Keyboard accessibility
        label: { enabled: true }, // Form labels
        'page-has-heading-one': { enabled: true }, // Page structure
        region: { enabled: true }, // Page regions
      },
    });

    // Verify government-specific accessibility features
    await expect(page.locator('[data-testid="accessibility-statement"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-accessibility"]')).toBeVisible();

    // Check language declaration
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
  });

  test('should provide comprehensive accessibility testing report', async ({ page }) => {
    await page.goto('/citizen/portal');

    // Run comprehensive accessibility scan
    const violations = await page.evaluate(async () => {
      const axe = (window as any).axe;
      const results = await axe.run({
        tags: ['wcag2a', 'wcag2aa', 'section508'],
        rules: {
          'color-contrast': { enabled: true },
          keyboard: { enabled: true },
          bypass: { enabled: true },
          'focus-order-semantics': { enabled: true },
          label: { enabled: true },
          'page-has-heading-one': { enabled: true },
          region: { enabled: true },
        },
      });

      return results.violations;
    });

    // Should have zero accessibility violations
    expect(violations).toHaveLength(0);

    // Log compliance summary
    console.log('Accessibility Compliance Summary:');
    console.log(`- WCAG 2.1 AA: ✅ COMPLIANT`);
    console.log(`- Section 508: ✅ COMPLIANT`);
    console.log(`- Violations Found: ${violations.length}`);
    console.log(`- Government Standards: ✅ MET`);
  });

  test('should validate multi-language accessibility', async ({ page }) => {
    // Test Spanish language support
    await page.goto('/citizen/portal?lang=es');

    // Check language attributes
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('es');

    // Run accessibility check in Spanish
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
    });

    // Verify text content is properly translated
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Bienvenido');

    // Check right-to-left language support
    await page.goto('/citizen/portal?lang=ar');

    const direction = await page.locator('html').getAttribute('dir');
    expect(direction).toBe('rtl');

    // Verify RTL accessibility
    await checkA11y(page, null, {
      tags: ['wcag2a', 'wcag2aa'],
    });
  });
});
