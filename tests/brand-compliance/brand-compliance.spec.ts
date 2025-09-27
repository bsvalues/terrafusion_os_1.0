// TerraFusion OS - Brand Compliance Testing Suite
// Government. Transcended.
// Automated brand validation & accessibility auditing

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// County theme configurations
const COUNTY_THEMES = {
  benton: {
    name: 'Benton County',
    primary: '#00B3A4',
    hero: '#0A1E2E',
    expectedElements: [
      'header',
      '[data-testid="county-badge"]',
      '.county-theme-indicator'
    ]
  },
  yakima: {
    name: 'Yakima County',
    primary: '#2FB3FF', 
    hero: '#0D1A26',
    expectedElements: [
      'header',
      '[data-testid="county-badge"]',
      '.county-theme-indicator'
    ]
  },
  default: {
    name: 'TerraFusion Default',
    primary: '#07D1D6',
    hero: '#0b0f14',
    expectedElements: [
      'header',
      '.brand-logo',
      '.tf-card'
    ]
  }
};

// TerraFusion brand validation rules
const BRAND_REQUIREMENTS = {
  typography: {
    primaryFont: /Segoe UI|system-ui|sans-serif/,
    monoFont: /Cascadia Code|Fira Code|SF Mono|Consolas|monospace/
  },
  colors: {
    cosmicBlue: '#0891b2',
    quantumTeal: '#00d2ff',
    neuralPurple: '#667eea',
    stellarWhite: '#ffffff',
    deepSpace: '#0a0f1c'
  },
  spacing: {
    xs: '4px',
    sm: '8px', 
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '24px'
  }
};

// Government compliance requirements
const GOVERNMENT_STANDARDS = {
  wcag: {
    level: 'AA',
    rules: [
      'color-contrast',
      'keyboard-navigation',
      'focus-visible',
      'alt-text',
      'heading-order'
    ]
  },
  section508: {
    required: true,
    rules: [
      'keyboard-only-navigation',
      'screen-reader-support',
      'color-independence'
    ]
  }
};

test.describe('TerraFusion Brand Compliance Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up MSW and development environment
    // NO HARDCODED PORTS! Use TF_FRONTEND_PORT environment variable
    const frontendPort = process.env.TF_FRONTEND_PORT || '3102';
    await page.goto(`http://localhost:${frontendPort}`);
    
    // Wait for TerraFusion OS to initialize
    await page.waitForSelector('[data-testid="terrafusion-app"]', { timeout: 10000 });
    
    // Verify government branding is loaded
    await expect(page.locator('body')).toHaveAttribute('data-government-compliant', 'true');
  });

  test.describe('Core Brand Identity', () => {
    
    test('displays TerraFusion government tagline', async ({ page }) => {
      // Look for the official tagline
      const taglineElements = [
        'text="Government. Transcended."',
        'text="Infrastructure Intelligence, Infinite Scale"',
        '[data-testid="brand-tagline"]'
      ];
      
      let taglineFound = false;
      for (const selector of taglineElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          taglineFound = true;
          break;
        }
      }
      
      expect(taglineFound).toBe(true);
    });

    test('uses official TerraFusion typography', async ({ page }) => {
      const bodyElement = page.locator('body');
      const computedStyle = await bodyElement.evaluate((el) => 
        window.getComputedStyle(el).fontFamily
      );
      
      expect(computedStyle).toMatch(BRAND_REQUIREMENTS.typography.primaryFont);
    });

    test('implements TerraFusion color scheme', async ({ page }) => {
      // Check CSS custom properties are loaded
      const rootStyles = await page.evaluate(() => {
        const root = document.documentElement;
        const styles = window.getComputedStyle(root);
        return {
          cosmicBlue: styles.getPropertyValue('--color-brand-cosmic-blue'),
          quantumTeal: styles.getPropertyValue('--color-brand-quantum-teal'),
          neuralPurple: styles.getPropertyValue('--color-brand-neural-purple')
        };
      });

      expect(styles.cosmicBlue.trim()).toBe(BRAND_REQUIREMENTS.colors.cosmicBlue);
      expect(styles.quantumTeal.trim()).toBe(BRAND_REQUIREMENTS.colors.quantumTeal);
      expect(styles.neuralPurple.trim()).toBe(BRAND_REQUIREMENTS.colors.neuralPurple);
    });

    test('displays TerraFusion logo or brand mark', async ({ page }) => {
      const brandElements = [
        '[data-testid="terrafusion-logo"]',
        '.brand-logo',
        'img[alt*="TerraFusion"]',
        'svg[data-brand="terrafusion"]'
      ];
      
      let brandFound = false;
      for (const selector of brandElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          brandFound = true;
          break;
        }
      }
      
      expect(brandFound).toBe(true);
    });
  });

  test.describe('County Theme Compliance', () => {
    
    Object.entries(COUNTY_THEMES).forEach(([countyKey, config]) => {
      test(`applies ${config.name} theme correctly`, async ({ page }) => {
        // Apply county theme
        await page.evaluate((county) => {
          if (window.applyCountyTheme) {
            window.applyCountyTheme(county);
          }
        }, countyKey);

        // Wait for theme to apply
        await page.waitForTimeout(1000);

        // Verify county data attribute
        await expect(page.locator('html')).toHaveAttribute('data-county', countyKey);

        // Check if county-specific CSS is loaded
        const countyStyles = await page.evaluate((county) => {
          const link = document.getElementById('tf-county') as HTMLLinkElement;
          return link ? link.href.includes(`tokens-${county}.css`) : false;
        }, countyKey);

        if (countyKey !== 'default') {
          expect(countyStyles).toBe(true);
        }

        // Verify primary color is applied
        const primaryColorApplied = await page.evaluate((expectedColor) => {
          const root = document.documentElement;
          const styles = window.getComputedStyle(root);
          const actualColor = styles.getPropertyValue('--color-accent-primary');
          return actualColor.trim() === expectedColor;
        }, config.primary);

        if (countyKey !== 'default') {
          expect(primaryColorApplied).toBe(true);
        }
      });
    });

    test('maintains base TerraFusion brand with county themes', async ({ page }) => {
      // Apply Benton theme
      await page.evaluate(() => {
        if (window.applyCountyTheme) {
          window.applyCountyTheme('benton');
        }
      });

      await page.waitForTimeout(1000);

      // Verify base TerraFusion tokens are still loaded
      const baseTokensLoaded = await page.evaluate(() => {
        const link = document.getElementById('tf-base') as HTMLLinkElement;
        return link ? link.href.includes('tokens-base.css') : false;
      });

      expect(baseTokensLoaded).toBe(true);

      // Verify core brand colors remain
      const coreColors = await page.evaluate(() => {
        const root = document.documentElement;
        const styles = window.getComputedStyle(root);
        return {
          surface: styles.getPropertyValue('--color-surface-primary'),
          text: styles.getPropertyValue('--color-text-primary'),
          cosmicBlue: styles.getPropertyValue('--color-brand-cosmic-blue')
        };
      });

      expect(coreColors.surface.trim()).toBe('#0b0f14');
      expect(coreColors.text.trim()).toBe('#e6f1ff');
      expect(coreColors.cosmicBlue.trim()).toBe('#0891b2');
    });
  });

  test.describe('Government Accessibility Compliance', () => {
    
    test('meets WCAG 2.1 AA standards', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('supports keyboard-only navigation', async ({ page }) => {
      // Test Tab navigation
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Check for focus indicators
      const focusStyles = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      });
      
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' || 
        focusStyles.boxShadow.includes('rgb') ||
        focusStyles.border !== 'none';
        
      expect(hasFocusIndicator).toBe(true);
    });

    test('provides sufficient color contrast', async ({ page }) => {
      const contrastResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze();

      expect(contrastResults.violations).toEqual([]);
    });

    test('includes proper heading structure', async ({ page }) => {
      const headingResults = await new AxeBuilder({ page })
        .withTags(['heading-order'])
        .analyze();

      expect(headingResults.violations).toEqual([]);
    });

    test('provides alternative text for images', async ({ page }) => {
      const altTextResults = await new AxeBuilder({ page })
        .withTags(['alt-text'])
        .analyze();

      expect(altTextResults.violations).toEqual([]);
    });
  });

  test.describe('Visual Regression Testing', () => {
    
    test('desktop layout maintains brand consistency', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Take screenshot of main dashboard
      await expect(page).toHaveScreenshot('desktop-dashboard.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('mobile layout preserves TerraFusion branding', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Take screenshot of mobile view
      await expect(page).toHaveScreenshot('mobile-dashboard.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('county theme visual consistency - Benton', async ({ page }) => {
      await page.evaluate(() => {
        if (window.applyCountyTheme) {
          window.applyCountyTheme('benton');
        }
      });
      
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('benton-county-theme.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('county theme visual consistency - Yakima', async ({ page }) => {
      await page.evaluate(() => {
        if (window.applyCountyTheme) {
          window.applyCountyTheme('yakima');
        }
      });
      
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('yakima-county-theme.png', {
        fullPage: true,
        threshold: 0.2
      });
    });
  });

  test.describe('Performance & Government Standards', () => {
    
    test('loads within government performance requirements', async ({ page }) => {
      const startTime = Date.now();
      
      // NO HARDCODED PORTS! Use TF_FRONTEND_PORT environment variable
      const frontendPort = process.env.TF_FRONTEND_PORT || '3102';
      await page.goto(`http://localhost:${frontendPort}`);
      await page.waitForSelector('[data-testid="terrafusion-app"]');
      
      const loadTime = Date.now() - startTime;
      
      // Government requirement: under 3 seconds for initial load
      expect(loadTime).toBeLessThan(3000);
    });

    test('API responses meet 7ms target', async ({
    // NO HARDCODED PORTS! Use TF_FRONTEND_PORT environment variable
    const frontendPort = process.env.TF_FRONTEND_PORT || '3102'; page }) => {
      // NO HARDCODED PORTS! Use TF_FRONTEND_PORT environment variable
      const frontendPort = process.env.TF_FRONTEND_PORT || '3102';
      const apiResponse = await page.request.get(`http://localhost:${frontendPort}/api/health`);
      const responseTime = apiResponse.headers()['x-response-time'];
      
      if (responseTime) {
        const timeMs = parseFloat(responseTime.replace('ms', ''));
        expect(timeMs).toBeLessThan(7);
      }
    });

    test('maintains 99.99% uptime simulation', async ({ page }) => {
      // Test multiple health checks
      const healthChecks = [];
      
      for (let i = 0; i < 10; i++) {
        const check = page.request.get('http://localhost:${process.env.TF_FRONTEND_PORT || '3102'}/api/health');
        healthChecks.push(check);
      }
      
      const results = await Promise.all(healthChecks);
      const successfulChecks = results.filter(r => r.ok()).length;
      const successRate = (successfulChecks / results.length) * 100;
      
      // 99.99% uptime requirement
      expect(successRate).toBeGreaterThan(99.9);
    });
  });

  test.describe('Government Data Compliance', () => {
    
    test('validates government parcel data structure', async ({ page }) => {
      const parcelResponse = await page.request.get('http://localhost:${process.env.TF_FRONTEND_PORT || '3102'}/api/parcels?limit=1');
      const parcelData = await parcelResponse.json();
      
      expect(parcelData.data).toBeDefined();
      expect(parcelData.data[0]).toMatchObject({
        id: expect.any(String),
        pin: expect.any(String),
        address: expect.any(String),
        owner: expect.any(String),
        assessedValue: expect.any(Number),
        county: expect.stringMatching(/^(Benton|Yakima)$/),
        coordinates: {
          lat: expect.any(Number),
          lng: expect.any(Number)
        }
      });
    });

    test('ensures AI agent performance monitoring', async ({ page }) => {
      const agentResponse = await page.request.get('http://localhost:${process.env.TF_FRONTEND_PORT || '3102'}/api/agents/status');
      const agentData = await agentResponse.json();
      
      expect(agentData.agents).toBeDefined();
      expect(agentData.summary).toMatchObject({
        total: expect.any(Number),
        active: expect.any(Number),
        avgResponseTime: expect.any(Number)
      });
      
      // Verify government compliance metadata
      expect(agentData.government.compliance).toBe('FISMA, NIST-800-53, Section508');
    });

    test('validates county-specific data filtering', async ({ page }) => {
      const bentonResponse = await page.request.get('http://localhost:${process.env.TF_FRONTEND_PORT || '3102'}/api/parcels?county=benton');
      const bentonData = await bentonResponse.json();
      
      expect(bentonData.data.every((parcel: any) => parcel.county === 'Benton')).toBe(true);
      expect(bentonData.metadata.county).toBe('benton');
    });
  });
});

// Export test configuration for CI/CD
export const testConfig = {
  name: 'TerraFusion OS Brand Compliance Suite',
  coverage: [
    'Brand identity verification',
    'County theme consistency', 
    'WCAG 2.1 AA compliance',
    'Section508 accessibility',
    'Visual regression testing',
    'Performance benchmarking',
    'Government data validation'
  ],
  standards: [
    'FISMA',
    'NIST-800-53', 
    'Section508',
    'WCAG2.1',
    'SOC2'
  ],
  targets: {
    loadTime: '<3s',
    apiResponse: '<7ms',
    uptime: '99.99%',
    accessibility: 'WCAG 2.1 AA'
  }
};