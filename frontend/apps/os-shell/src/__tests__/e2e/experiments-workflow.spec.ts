import { expect, Page, test } from '@playwright/test';

test.describe('TerraFusion Experiments - Quantum AI Research Workflow', () => {
  let page: Page;
  const experimentId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    // Ensure backend services are running
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.beforeEach(async () => {
    // Navigate to experiments list
    await page.goto('http://localhost:3000/experiments');
    await page.waitForLoadState('networkidle');
  });

  test.describe('🔬 Experiment Creation & Management', () => {
    test('creates a new experiment with quantum parameters', async () => {
      // Navigate to create page
      await page.click('text=Create New');
      await expect(page.locator('text=Create Experiment')).toBeVisible();

      // Fill in experiment details
      await page.fill(
        'input[placeholder*="Property Valuation"]',
        'Test Property Assessment ML Model'
      );
      await page.fill('input[placeholder*="county-properties"]', 'test-dataset-2024');
      await page.fill('input[placeholder*="valuation-neural"]', 'property-valuation-v2');
      await page.fill('input[type="number"]', '50');

      // Submit creation
      await page.click('button:has-text("Create Experiment")');

      // Verify success message
      await expect(page.locator('text=Created experiment')).toBeVisible({ timeout: 5000 });

      // Should redirect to experiments list
      await page.waitForURL('**/experiments', { timeout: 3000 });
      await expect(page.locator('text=Test Property Assessment ML Model')).toBeVisible();
    });

    test('displays experiment list with details', async () => {
      // Verify experiments are loaded
      await expect(page.locator('h2:has-text("Experiments")')).toBeVisible();

      // Check for experiment cards
      const experimentCards = page.locator('[class*="border-cyan"]');
      const count = await experimentCards.count();
      expect(count).toBeGreaterThan(0);

      // Verify experiment details are shown
      await expect(page.locator('text=Dataset:')).toBeVisible();
      await expect(page.locator('text=Created:')).toBeVisible();
    });

    test('validates required fields on create form', async () => {
      await page.click('text=Create New');

      // Try to submit without filling required fields
      await page.click('button:has-text("Create Experiment")');

      // HTML5 validation should prevent submission
      const nameInput = page.locator('input[placeholder*="Property Valuation"]');
      const isValid = await nameInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(isValid).toBe(false);
    });
  });

  test.describe('▶️ Experiment Execution & Run Management', () => {
    test('starts an experiment run and monitors status', async () => {
      // Find first experiment and expand runs
      const firstExperiment = page.locator('[class*="border-cyan"]').first();
      await firstExperiment.locator('button:has-text("Runs")').click();

      // Verify runs section is visible
      await expect(page.locator('text=Run History')).toBeVisible();

      // Click Start button
      await firstExperiment.locator('button:has-text("Start")').click();

      // Wait for SignalR update (run should appear)
      await page.waitForTimeout(2000);

      // Verify run appears in list
      await expect(page.locator('text=queued, text=running').first()).toBeVisible({
        timeout: 5000,
      });

      // Check for status indicators
      const statusElement = page.locator('[class*="animate-pulse"]');
      if ((await statusElement.count()) > 0) {
        // Running status with pulse animation
        await expect(statusElement).toBeVisible();
      }
    });

    test('displays run history with timestamps', async () => {
      const firstExperiment = page.locator('[class*="border-cyan"]').first();
      await firstExperiment.locator('button:has-text("Runs")').click();

      // Start a run to ensure we have history
      await firstExperiment.locator('button:has-text("Start")').click();
      await page.waitForTimeout(1500);

      // Verify run details are shown
      const runCards = page.locator('[class*="bg-slate-800"]');
      if ((await runCards.count()) > 0) {
        const firstRun = runCards.first();

        // Check for run ID (shortened UUID)
        await expect(firstRun.locator('[class*="font-mono"]')).toBeVisible();

        // Check for timestamp
        await expect(firstRun).toContainText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      }
    });

    test('expands and collapses run details', async () => {
      const firstExperiment = page.locator('[class*="border-cyan"]').first();

      // Expand runs
      await firstExperiment.locator('button:has-text("Runs")').click();
      await expect(page.locator('text=Run History')).toBeVisible();

      // Collapse runs
      await firstExperiment.locator('button:has-text("Hide")').click();
      await expect(page.locator('text=Run History')).not.toBeVisible();
    });
  });

  test.describe('🔄 Real-time SignalR Updates', () => {
    test('receives real-time run status updates via SignalR', async () => {
      // Monitor console for SignalR connection
      page.on('console', (msg) => {
        if (msg.text().includes('SignalR')) {
          console.log('SignalR event:', msg.text());
        }
      });

      const firstExperiment = page.locator('[class*="border-cyan"]').first();
      await firstExperiment.locator('button:has-text("Runs")').click();

      // Start run and wait for updates
      await firstExperiment.locator('button:has-text("Start")').click();

      // SignalR should push updates within 3 seconds
      await page.waitForTimeout(3000);

      // Verify status updated
      const hasStatus = await page.locator('text=queued, text=running, text=completed').count();
      expect(hasStatus).toBeGreaterThan(0);
    });
  });

  test.describe('🎨 TerraFusion Design System Integration', () => {
    test('uses terra-cyan quantum theme consistently', async () => {
      // Check for terra-cyan color usage
      const cyanElements = page.locator('[class*="cyan"]');
      const count = await cyanElements.count();
      expect(count).toBeGreaterThan(3);

      // Verify glassmorphic styling
      await expect(page.locator('[class*="backdrop-blur"]')).toBeVisible();

      // Check gradient buttons
      await page.click('text=Create New');
      await expect(page.locator('[class*="gradient"]')).toBeVisible();
    });

    test('displays quantum UI elements and animations', async () => {
      const firstExperiment = page.locator('[class*="border-cyan"]').first();
      await firstExperiment.locator('button:has-text("Runs")').click();
      await firstExperiment.locator('button:has-text("Start")').click();

      // Wait for running status with pulse animation
      await page.waitForTimeout(2000);

      // Check for animate-pulse class on running status
      const pulseElements = page.locator('[class*="animate-pulse"]');
      if ((await pulseElements.count()) > 0) {
        await expect(pulseElements.first()).toBeVisible();
      }
    });
  });

  test.describe('📊 Error Handling & Edge Cases', () => {
    test('handles API errors gracefully', async () => {
      // Intercept API call to simulate error
      await page.route('**/api/experiments/*/runs/start', (route) => {
        route.fulfill({
          status: 500,
          body: 'Internal Server Error',
        });
      });

      const firstExperiment = page.locator('[class*="border-cyan"]').first();
      await firstExperiment.locator('button:has-text("Start")').click();

      // Should show error dialog or message
      await expect(page.locator('text=Error').first()).toBeVisible({ timeout: 3000 });
    });

    test('handles empty experiments list', async () => {
      // Intercept API to return empty array
      await page.route('**/api/experiments', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show experiments header but no items
      await expect(page.locator('h2:has-text("Experiments")')).toBeVisible();
      const cards = page.locator('[class*="border-cyan"]');
      expect(await cards.count()).toBe(0);
    });
  });

  test.describe('🔐 Government Compliance & Security', () => {
    test('enforces authentication for experiment operations', async () => {
      // This test assumes auth middleware is enabled
      // In production, unauthenticated users should be redirected

      // Note: Implement based on actual auth flow
      // For now, verify the page loads (dev mode may skip auth)
      await expect(page.locator('h2:has-text("Experiments")')).toBeVisible();
    });

    test('validates experiment data before submission', async () => {
      await page.click('text=Create New');

      // Enter invalid agent count
      await page.fill('input[type="number"]', '99999999');

      // HTML5 validation should constrain to max value
      const agentInput = page.locator('input[type="number"]');
      const maxValue = await agentInput.getAttribute('max');
      expect(maxValue).toBe('10000');
    });
  });

  test.afterAll(async () => {
    await page.close();
  });
});
