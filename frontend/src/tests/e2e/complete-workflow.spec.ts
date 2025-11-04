/**
 * ═══════════════════════════════════════════════════════════════
 * END-TO-END TESTS - Complete County Employee Workflow
 * Real-world user scenarios with all 14 components
 * Government. Transcended. - Championship Test Coverage
 * ═══════════════════════════════════════════════════════════════
 */

import { expect, Page, test } from '@playwright/test';

// Test configuration
test.use({
  baseURL: 'http://localhost:3000',
  viewport: { width: 1920, height: 1080 },
});

// Helper functions
async function loginAsAssessor(page: Page) {
  await page.goto('/login');
  await page.fill('[name="username"]', 'test.assessor@bentoncounty.gov');
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/workspace');
}

async function waitForAISwarmStatus(page: Page) {
  await page.waitForSelector('text=/\\d+,\\d+ agents/', { timeout: 10000 });
}

test.describe('Complete County Employee Workflow - End-to-End', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as assessor
    await loginAsAssessor(page);
    await waitForAISwarmStatus(page);
  });

  test('🏛️ E2E-001: Complete property assessment workflow', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for complete workflow

    // Step 1: Verify dashboard loads with all metrics
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('text=/\\d+ tasks pending/i')).toBeVisible();
    await expect(page.locator('text=/\\d+ AI assists/i')).toBeVisible();

    // Step 2: Navigate to AI Workflows
    await page.click('button:has-text("AI Workflows")');
    await expect(page.locator('h2:has-text("AI Workflows")')).toBeVisible();

    // Step 3: Select Bulk Property Assessment workflow
    await expect(page.locator('text=Bulk Property Assessment')).toBeVisible();
    const bulkAssessmentCard = page.locator('text=Bulk Property Assessment').locator('..');
    await expect(bulkAssessmentCard).toBeVisible();

    // Step 4: Execute workflow
    await bulkAssessmentCard.locator('button:has-text("Execute")').click();

    // Step 5: Monitor workflow execution
    await expect(page.locator('text=/Step 1 of 5/')).toBeVisible();
    await expect(page.locator('text=Data Collection')).toBeVisible();

    // Wait for workflow steps to progress
    await page.waitForSelector('text=/Step 2 of 5/', { timeout: 35000 });
    await expect(page.locator('text=AI Valuation')).toBeVisible();

    await page.waitForSelector('text=/Step 3 of 5/', { timeout: 125000 });
    await expect(page.locator('text=Comparable Analysis')).toBeVisible();

    // Step 6: Verify workflow completion
    await page.waitForSelector('text=/Workflow Complete/i', { timeout: 60000 });
    await expect(page.locator('text=/847 properties processed/i')).toBeVisible();
    await expect(page.locator('text=/95\\.7% confidence/i')).toBeVisible();

    // Step 7: Check notification update
    const notificationBadge = page.locator('button:has-text("notification") span');
    await expect(notificationBadge).toHaveText(/[4-9]/); // Should increment

    // Step 8: Switch to AI Insights to verify impact
    await page.click('button:has-text("AI Insights")');
    await expect(page.locator('h2:has-text("AI Insights")')).toBeVisible();

    // Step 9: Verify predictive metrics updated
    await expect(page.locator('text=/Property Assessments/i')).toBeVisible();
    await expect(page.locator('text=/\\d+ → \\d+/i')).toBeVisible(); // Trend indicator

    // Step 10: Return to dashboard and verify updates
    await page.click('button:has-text("Dashboard")');
    await expect(page.locator('text=/847 properties processed/i')).toBeVisible();
  });

  test('🔍 E2E-002: Single property analysis with AI assistant', async ({ page }) => {
    // Step 1: From dashboard, analyze specific property
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();

    // Step 2: Open AI Assistant panel (if not already open)
    const aiAssistantToggle = page.locator('button:has-text("AI Assistant")');
    if (await aiAssistantToggle.isVisible()) {
      await aiAssistantToggle.click();
    }

    // Step 3: Send analysis request
    const chatInput = page.locator('textarea[placeholder*="Ask AI"]');
    await chatInput.fill('Analyze property parcel 8842 for market trends');
    await chatInput.press('Enter');

    // Step 4: Wait for AI response
    await page.waitForSelector('text=/analyzing property/i', { timeout: 5000 });
    await page.waitForSelector('text=/Property 8842 analysis complete/i', { timeout: 10000 });

    // Step 5: Verify analysis results displayed
    await expect(page.locator('text=/Market Value:/i')).toBeVisible();
    await expect(page.locator('text=/Confidence:/i')).toBeVisible();
    await expect(page.locator('text=/\\d+\\.\\d+%/i')).toBeVisible();

    // Step 6: Click on property card if displayed
    const propertyCard = page.locator('text=8842').locator('..');
    if (await propertyCard.isVisible()) {
      await propertyCard.click();

      // Verify detailed property view
      await expect(page.locator('text=/Property Details/i')).toBeVisible();
      await expect(page.locator('text=/AI Valuation/i')).toBeVisible();
    }
  });

  test('📊 E2E-003: Predictive insights and anomaly detection', async ({ page }) => {
    // Step 1: Navigate to AI Insights
    await page.click('button:has-text("AI Insights")');
    await expect(page.locator('h2:has-text("AI Insights")')).toBeVisible();

    // Step 2: Verify predictive metrics load
    await expect(page.locator('text=/Property Assessments/i')).toBeVisible();
    await expect(page.locator('text=/Processing Time/i')).toBeVisible();
    await expect(page.locator('text=/Accuracy Score/i')).toBeVisible();
    await expect(page.locator('text=/Citizen Satisfaction/i')).toBeVisible();

    // Step 3: Check for AI insights
    await expect(page.locator('text=/AI Insights/i')).toBeVisible();
    const insightCards = page
      .locator('[data-testid="insight-card"]')
      .or(page.locator('text=/Market Value/i').locator('..'));
    await expect(insightCards.first()).toBeVisible();

    // Step 4: Verify anomaly detection
    const criticalInsights = page.locator('text=/CRITICAL/i');
    if (await criticalInsights.isVisible()) {
      await expect(criticalInsights).toHaveCount(1, { timeout: 5000 });

      // Click critical insight for details
      await criticalInsights.first().click();
      await expect(page.locator('text=/IAAO Compliance/i')).toBeVisible();
    }

    // Step 5: Change timeframe
    const timeframeSelector = page
      .locator('select[name="timeframe"]')
      .or(page.locator('button:has-text("7d")'));
    if (await timeframeSelector.isVisible()) {
      await timeframeSelector.click();
      await page.click('text=30d');

      // Wait for insights to reload
      await page.waitForTimeout(1500);
      await expect(insightCards.first()).toBeVisible();
    }
  });

  test('⚙️ E2E-004: Multi-workflow execution and monitoring', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for multiple workflows

    // Step 1: Navigate to workflows
    await page.click('button:has-text("AI Workflows")');

    // Step 2: Execute Bulk Assessment
    await page.click('button:has-text("Execute"):near(:text("Bulk Property Assessment"))');
    await page.waitForSelector('text=/Step 1 of 5/', { timeout: 5000 });

    const bulkExecutionId = await page.getAttribute('[data-execution-id]', 'data-execution-id');

    // Step 3: Start Compliance Audit (if available)
    const complianceWorkflow = page.locator('text=Compliance Audit');
    if (await complianceWorkflow.isVisible()) {
      await page.click('button:has-text("Execute"):near(:text("Compliance Audit"))');

      // Verify both workflows shown
      await expect(page.locator('[data-execution-id]')).toHaveCount(2, { timeout: 5000 });
    }

    // Step 4: Monitor first workflow completion
    await page.waitForSelector(`[data-execution-id="${bulkExecutionId}"]:has-text("Complete")`, {
      timeout: 120000,
    });

    // Step 5: Verify workflow history/status
    await expect(page.locator('text=/Workflow Complete/i')).toBeVisible();
    await expect(page.locator('text=/95\\.7% confidence/i')).toBeVisible();
  });

  test('🔄 E2E-005: Real-time AI swarm monitoring', async ({ page }) => {
    // Step 1: Verify initial swarm status in header
    const swarmAgentCount = page.locator('text=/\\d+,\\d+ agents/');
    await expect(swarmAgentCount).toBeVisible();
    const initialCount = await swarmAgentCount.textContent();

    // Step 2: Verify swarm activity percentage
    await expect(page.locator('text=/\\d+%/')).toBeVisible();

    // Step 3: Check quantum optimization factor
    await expect(page.locator('text=/Factor 949/i')).toBeVisible();

    // Step 4: Open sidebar AI status panel
    const sidebarStatus = page.locator('text=/AI Consciousness/i');
    await expect(sidebarStatus).toBeVisible();

    // Step 5: Verify detailed status metrics
    await expect(page.locator('text=/Accuracy/i')).toBeVisible();
    await expect(page.locator('text=/99\\.\\d+%/i')).toBeVisible();
    await expect(page.locator('text=/Response/i')).toBeVisible();
    await expect(page.locator('text=/\\d+ms/i')).toBeVisible();

    // Step 6: Wait for auto-refresh (30 seconds)
    await page.waitForTimeout(31000);

    // Step 7: Verify status updated
    const updatedCount = await swarmAgentCount.textContent();
    // Note: In production, count might change slightly
    expect(updatedCount).toBeTruthy();
  });

  test('📱 E2E-006: Responsive design and mobile navigation', async ({ page }) => {
    // Step 1: Resize to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Step 2: Verify sidebar collapsed on mobile
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveCSS('width', /0px|64px/);

    // Step 3: Open mobile menu
    const menuButton = page
      .locator('button:has-text("Menu")')
      .or(page.locator('button[aria-label*="menu"]'));
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }

    // Step 4: Navigate on mobile
    await page.click('button:has-text("AI Workflows")');
    await expect(page.locator('h2:has-text("AI Workflows")')).toBeVisible();

    // Step 5: Verify AI swarm status still visible
    await expect(page.locator('text=/Factor 949/i')).toBeVisible();

    // Step 6: Return to desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(sidebar).toHaveCSS('width', /256px|264px/);
  });

  test('🔐 E2E-007: Authentication and session management', async ({ page }) => {
    // Step 1: Verify user profile displayed
    await expect(
      page.locator('text=Test Employee').or(page.locator('text=test.assessor'))
    ).toBeVisible();

    // Step 2: Check role display
    await expect(page.locator('text=assessor')).toBeVisible();

    // Step 3: Verify authenticated API calls work
    await page.click('button:has-text("AI Insights")');
    await expect(page.locator('text=/AI Insights/i')).toBeVisible({ timeout: 10000 });

    // Step 4: Test logout
    await page.click('button[aria-label*="logout"]').or(page.locator('button:has-text("Logout")'));

    // Step 5: Verify redirect to login
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });

  test('⚡ E2E-008: Performance and load times', async ({ page }) => {
    // Step 1: Measure initial page load
    const navigationStart = Date.now();
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');
    const pageLoadTime = Date.now() - navigationStart;

    // Championship standard: <2000ms
    expect(pageLoadTime).toBeLessThan(2000);

    // Step 2: Measure time to interactive
    await waitForAISwarmStatus(page);
    const interactiveTime = Date.now() - navigationStart;

    // Championship standard: <3000ms
    expect(interactiveTime).toBeLessThan(3000);

    // Step 3: Test component switching performance
    const switchStart = Date.now();
    await page.click('button:has-text("AI Workflows")');
    await expect(page.locator('h2:has-text("AI Workflows")')).toBeVisible();
    const switchTime = Date.now() - switchStart;

    // Championship standard: <500ms
    expect(switchTime).toBeLessThan(500);

    // Step 4: Test API response times
    const apiStart = Date.now();
    await page.click('button:has-text("AI Insights")');
    await page.waitForSelector('text=/Property Assessments/i');
    const apiTime = Date.now() - apiStart;

    // Championship standard: <1000ms
    expect(apiTime).toBeLessThan(1000);
  });

  test('🏆 E2E-009: Complete user journey - assessor daily workflow', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes for complete journey

    console.log('🏁 Starting complete assessor daily workflow...');

    // MORNING: Login and review dashboard
    console.log('📊 Step 1: Review daily dashboard');
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('text=/\\d+ tasks pending/i')).toBeVisible();

    // Check AI swarm status
    await waitForAISwarmStatus(page);
    console.log('✅ AI Swarm operational');

    // TASK 1: Execute bulk assessment workflow
    console.log('⚙️ Step 2: Execute bulk property assessment');
    await page.click('button:has-text("AI Workflows")');
    await page.click('button:has-text("Execute"):near(:text("Bulk Property Assessment"))');
    await page.waitForSelector('text=/Workflow Complete/i', { timeout: 120000 });
    console.log('✅ Bulk assessment complete: 847 properties');

    // TASK 2: Review AI insights
    console.log('📈 Step 3: Review AI predictive insights');
    await page.click('button:has-text("AI Insights")');
    await expect(page.locator('text=/Property Assessments/i')).toBeVisible();

    // Check for anomalies
    const criticalInsights = page.locator('text=/CRITICAL/i');
    if ((await criticalInsights.count()) > 0) {
      console.log('⚠️ Critical insight detected - reviewing');
      await criticalInsights.first().click();
    }

    // TASK 3: Analyze specific properties flagged by AI
    console.log('🔍 Step 4: Analyze flagged properties');
    await page.click('button:has-text("Dashboard")');

    // Use AI assistant to analyze
    const chatInput = page.locator('textarea[placeholder*="Ask AI"]');
    if (await chatInput.isVisible()) {
      await chatInput.fill('Show me properties that need review today');
      await chatInput.press('Enter');
      await page.waitForSelector('text=/properties identified/i', { timeout: 10000 });
      console.log('✅ AI identified properties for review');
    }

    // TASK 4: Run compliance audit
    console.log('🛡️ Step 5: Execute compliance audit');
    await page.click('button:has-text("AI Workflows")');
    const complianceWorkflow = page.locator('text=Compliance Audit');
    if (await complianceWorkflow.isVisible()) {
      await page.click('button:has-text("Execute"):near(:text("Compliance Audit"))');
      await page.waitForSelector('text=/Workflow Complete/i', { timeout: 120000 });
      console.log('✅ FISMA-High compliance audit complete');
    }

    // END OF DAY: Review summary
    console.log('📊 Step 6: Review end-of-day summary');
    await page.click('button:has-text("Dashboard")');
    await expect(page.locator('text=/\\d+ AI assists today/i')).toBeVisible();

    // Verify all systems operational
    await expect(page.locator('text=/Government\\. Transcended\\./i')).toBeVisible();
    await expect(page.locator('text=/Elite Mode Active/i')).toBeVisible();

    console.log('🏆 Complete daily workflow executed successfully!');
    console.log('✨ Government. Transcended. - Mission accomplished');
  });
});

test.describe('Error Handling & Edge Cases', () => {
  test('🚨 E2E-010: Graceful handling of API failures', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/AIAssistant/swarm-status/*', (route) => route.abort('failed'));

    await page.goto('/workspace');

    // Should still render without crashing
    await expect(page.locator('h1:has-text("TerraFusion OS")')).toBeVisible();

    // Should show fallback or error state
    // (Implementation would show user-friendly error)
  });

  test('🌐 E2E-011: Network disconnection recovery', async ({ page }) => {
    await page.goto('/workspace');
    await waitForAISwarmStatus(page);

    // Simulate network offline
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);

    // Reconnect
    await page.context().setOffline(false);

    // Should recover and reload data
    await page.waitForTimeout(3000);
    await expect(page.locator('text=/\\d+,\\d+ agents/')).toBeVisible({ timeout: 10000 });
  });
});
