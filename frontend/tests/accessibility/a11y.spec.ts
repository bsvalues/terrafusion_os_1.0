import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * TerraFusion OS - Accessibility Audit Test Suite
 *
 * WCAG 2.1 AA Compliance Testing with axe-core
 *
 * Government Requirements:
 * - Section 508 compliance
 * - WCAG 2.1 Level AA conformance
 * - FISMA-High accessibility standards
 */

test.describe('TerraFusion OS Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage using baseURL from playwright.config.ts
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should not have any automatically detectable accessibility violations on homepage', async ({
    page,
  }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'section508'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('\n🚨 Accessibility Violations Found:\n');
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id} - ${violation.impact}`);
        console.log(`   Description: ${violation.description}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Affected elements: ${violation.nodes.length}`);
        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`     ${nodeIndex + 1}. ${node.html}`);
          console.log(`        Target: ${node.target.join(' > ')}`);
        });
        console.log('');
      });
    }

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any critical or serious accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'section508'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      console.log('\n⚠️  Critical/Serious Accessibility Violations:\n');
      criticalViolations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id} - ${violation.impact}`);
        console.log(`   ${violation.description}`);
      });
    }

    expect(criticalViolations).toHaveLength(0);
  });

  test('should have proper page structure', async ({ page }) => {
    // Check for main landmark
    const mainLandmark = page.locator('main, [role="main"]');
    await expect(mainLandmark).toBeVisible();

    // Check for heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1
  });

  test('should have accessible navigation', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('nav, [role="navigation"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible forms (if present)', async ({ page }) => {
    const formCount = await page.locator('form').count();

    if (formCount > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page }).include('form').analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['color-contrast']) // Disable initially to see other issues
      .analyze();

    // Now specifically check color contrast
    const contrastResults = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

    if (contrastResults.violations.length > 0) {
      console.log('\n🎨 Color Contrast Issues:\n');
      contrastResults.violations.forEach((v) => {
        console.log(`- ${v.description}`);
        v.nodes.forEach((node) => {
          console.log(`  Target: ${node.target.join(' > ')}`);
        });
      });
    }

    // Expect no critical contrast violations
    const criticalContrastViolations = contrastResults.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(criticalContrastViolations).toHaveLength(0);
  });

  test('should have accessible images', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page }).include('img').analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('should have keyboard navigation support', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);

    // Should have at least one focusable element
    expect(focusedElement).toBeTruthy();
  });

  test('should have ARIA labels where needed', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['aria-allowed-attr', 'aria-required-attr', 'aria-valid-attr-value'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('TerraFusion OS Component Accessibility', () => {
  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('button, [role="button"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible links', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).include('a').analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('TerraFusion OS Key Routes Accessibility', () => {
  const routes = [
    { path: '/monitoring', name: 'Monitoring' },
    { path: '/marketplace', name: 'Marketplace' },
    { path: '/elite-research', name: 'Elite Research' },
    { path: '/experiments', name: 'Experiments' },
  ];

  for (const route of routes) {
    test(`should not have accessibility violations on ${route.name} page`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'section508'])
        .analyze();

      if (accessibilityScanResults.violations.length > 0) {
        console.log(`\n🚨 ${route.name} Violations:\n`);
        accessibilityScanResults.violations.forEach((violation, index) => {
          console.log(`${index + 1}. ${violation.id} - ${violation.impact}`);
          console.log(`   ${violation.description}`);
        });
      }

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test(`should not have critical/serious violations on ${route.name} page`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'section508'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toHaveLength(0);
    });
  }
});
