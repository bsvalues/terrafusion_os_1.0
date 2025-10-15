/**
 * Terrafusion OS - Visual Regression Testing
 * Government. Transcended.
 */

import { test, expect } from '@playwright/test'

test.describe('Visual Regression - Government UI Standards', () => {
  
  test('dashboard maintains government branding consistency', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('dashboard-government-branding.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })

  test('property assessment form visual consistency', async ({ page }) => {
    await page.goto('/assessment')
    await page.fill('[data-testid="property-address"]', '123 Test St, Richland, WA')
    
    await expect(page.locator('[data-testid="assessment-form"]')).toHaveScreenshot('assessment-form.png')
  })

  test('AI swarm dashboard visual stability', async ({ page }) => {
    await page.goto('/ai-swarm')
    
    // Wait for AI status to load
    await page.waitForSelector('[data-testid="swarm-status"]')
    
    await expect(page.locator('[data-testid="ai-swarm-dashboard"]')).toHaveScreenshot('ai-swarm-dashboard.png')
  })

  test('compliance center maintains accessibility colors', async ({ page }) => {
    await page.goto('/compliance')
    
    // Test both light and dark modes
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page).toHaveScreenshot('compliance-light-mode.png')
    
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page).toHaveScreenshot('compliance-dark-mode.png')
  })

  test('mobile responsive design consistency', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/dashboard')
    
    await expect(page).toHaveScreenshot('mobile-dashboard.png')
  })

  test('high contrast mode visual validation', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await page.goto('/dashboard')
    
    await expect(page).toHaveScreenshot('high-contrast-dashboard.png')
  })
})
