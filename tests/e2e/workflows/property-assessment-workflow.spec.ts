/**
 * Critical Property Assessment Workflow E2E Tests
 * Tests complete user workflows from login to assessment completion
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Property Assessment Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Login as assessor
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'assessor@bentoncounty.gov');
    await page.fill('[data-testid="password"]', 'test-password');
    await page.click('[data-testid="login-button"]');

    // Wait for login to complete
    await page.waitForURL('/dashboard');
    await expect(page.locator('[data-testid="user-role"]')).toContainText('Assessor');
  });

  test('Complete property assessment workflow', async () => {
    // Step 1: Navigate to property search
    await page.click('[data-testid="nav-property-search"]');
    await page.waitForURL('/properties/search');

    // Step 2: Search for a property
    await page.fill('[data-testid="property-search"]', '123 Championship Way');
    await page.click('[data-testid="search-button"]');

    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]');
    await expect(page.locator('[data-testid="property-result"]')).toBeVisible();

    // Step 3: Select property for assessment
    await page.click('[data-testid="property-result"]:first-child');
    await page.waitForURL(/\/properties\/\d+/);

    // Step 4: Start new assessment
    await page.click('[data-testid="start-assessment"]');
    await page.waitForSelector('[data-testid="assessment-form"]');

    // Step 5: Fill assessment details
    await page.fill('[data-testid="square-feet"]', '2100');
    await page.fill('[data-testid="bedrooms"]', '3');
    await page.fill('[data-testid="bathrooms"]', '2');
    await page.selectOption('[data-testid="condition"]', 'good');
    await page.fill('[data-testid="lot-size"]', '0.25');

    // Step 6: Add comparable properties
    await page.click('[data-testid="add-comparable"]');
    await page.fill('[data-testid="comp-address"]', '125 Victory Lane');
    await page.fill('[data-testid="comp-sale-price"]', '847500');
    await page.fill('[data-testid="comp-sale-date"]', '2024-11-15');
    await page.click('[data-testid="save-comparable"]');

    // Step 7: Run AI valuation
    await page.click('[data-testid="run-ai-valuation"]');

    // Wait for AI processing
    await page.waitForSelector('[data-testid="ai-valuation-result"]', { timeout: 10000 });

    // Verify AI results are displayed
    await expect(page.locator('[data-testid="estimated-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();

    const estimatedValue = await page.locator('[data-testid="estimated-value"]').textContent();
    expect(estimatedValue).toMatch(/\$[\d,]+/); // Should be a dollar amount

    // Step 8: Review and adjust assessment
    await page.fill('[data-testid="final-assessment"]', '820000');
    await page.fill(
      '[data-testid="assessment-notes"]',
      'Property assessed using AI valuation with manual adjustment for market conditions'
    );

    // Step 9: Submit assessment
    await page.click('[data-testid="submit-assessment"]');

    // Wait for confirmation
    await page.waitForSelector('[data-testid="assessment-success"]');
    await expect(page.locator('[data-testid="assessment-success"]')).toContainText(
      'Assessment completed successfully'
    );

    // Step 10: Verify assessment appears in queue
    await page.goto('/assessments/pending');
    await page.waitForSelector('[data-testid="pending-assessments"]');

    // Should see our new assessment
    await expect(page.locator('[data-testid="assessment-item"]')).toContainText(
      '123 Championship Way'
    );
  });

  test('Bulk assessment workflow', async () => {
    // Navigate to bulk assessment tool
    await page.goto('/assessments/bulk');

    // Upload CSV file with properties
    const fileInput = page.locator('[data-testid="bulk-upload"]');
    await fileInput.setInputFiles('tests/fixtures/bulk-properties.csv');

    // Start bulk processing
    await page.click('[data-testid="start-bulk-assessment"]');

    // Wait for processing to complete
    await page.waitForSelector('[data-testid="bulk-progress"]');
    await page.waitForSelector('[data-testid="bulk-complete"]', { timeout: 30000 });

    // Verify results
    await expect(page.locator('[data-testid="processed-count"]')).toContainText('10'); // Assuming 10 properties in CSV
    await expect(page.locator('[data-testid="success-count"]')).toContainText('10');
    await expect(page.locator('[data-testid="error-count"]')).toContainText('0');
  });

  test('Assessment review and approval workflow', async () => {
    // Navigate to assessments requiring approval
    await page.goto('/assessments/review');

    // Select an assessment for review
    await page.click('[data-testid="review-item"]:first-child');
    await page.waitForURL(/\/assessments\/review\/\d+/);

    // Review assessment details
    await expect(page.locator('[data-testid="property-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="assessment-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="comparable-sales"]')).toBeVisible();

    // Check AI validation score
    const aiScore = await page.locator('[data-testid="ai-validation-score"]').textContent();
    const scoreValue = parseFloat(aiScore?.replace('%', '') || '0');
    expect(scoreValue).toBeGreaterThan(85); // Should have high confidence

    // Approve assessment
    await page.fill(
      '[data-testid="reviewer-notes"]',
      'Assessment approved - values consistent with market analysis'
    );
    await page.click('[data-testid="approve-assessment"]');

    // Confirm approval
    await page.click('[data-testid="confirm-approval"]');

    // Verify approval success
    await page.waitForSelector('[data-testid="approval-success"]');
    await expect(page.locator('[data-testid="approval-success"]')).toContainText(
      'Assessment approved'
    );
  });

  test('Assessment appeal workflow', async () => {
    // Navigate to appeals section
    await page.goto('/assessments/appeals');

    // Create new appeal (simulating property owner)
    await page.click('[data-testid="new-appeal"]');

    // Fill appeal form
    await page.fill('[data-testid="property-address"]', '456 Test Street');
    await page.fill('[data-testid="current-assessment"]', '750000');
    await page.fill('[data-testid="requested-assessment"]', '650000');
    await page.fill(
      '[data-testid="appeal-reason"]',
      'Property overvalued compared to recent sales in area'
    );

    // Upload supporting documents
    await page
      .locator('[data-testid="upload-documents"]')
      .setInputFiles('tests/fixtures/appeal-documents.pdf');

    // Submit appeal
    await page.click('[data-testid="submit-appeal"]');

    // Wait for confirmation
    await page.waitForSelector('[data-testid="appeal-submitted"]');

    // Verify appeal appears in queue
    await page.goto('/assessments/appeals/queue');
    await expect(page.locator('[data-testid="appeal-item"]')).toContainText('456 Test Street');
  });

  test('Multi-county coordination workflow', async () => {
    // Navigate to multi-county dashboard
    await page.goto('/multi-county');

    // Check Yakima County status
    await expect(page.locator('[data-testid="yakima-status"]')).toContainText('Active');
    await expect(page.locator('[data-testid="yakima-agents"]')).toContainText('252');

    // Check Cowlitz County status
    await expect(page.locator('[data-testid="cowlitz-status"]')).toContainText('Active');

    // Test cross-county property comparison
    await page.click('[data-testid="cross-county-comparison"]');

    // Select properties from different counties
    await page.selectOption('[data-testid="county-a"]', 'benton');
    await page.selectOption('[data-testid="county-b"]', 'yakima');

    await page.fill('[data-testid="property-type"]', 'residential');
    await page.fill('[data-testid="square-feet-range"]', '2000-2500');

    // Run comparison
    await page.click('[data-testid="run-comparison"]');

    // Wait for results
    await page.waitForSelector('[data-testid="comparison-results"]');

    // Verify comparison data
    await expect(page.locator('[data-testid="benton-avg"]')).toBeVisible();
    await expect(page.locator('[data-testid="yakima-avg"]')).toBeVisible();
    await expect(page.locator('[data-testid="market-difference"]')).toBeVisible();
  });

  test('Government compliance audit trail', async () => {
    // Navigate to audit section
    await page.goto('/audit/trail');

    // Verify audit log is accessible
    await expect(page.locator('[data-testid="audit-log"]')).toBeVisible();

    // Check recent activities are logged
    const auditEntries = page.locator('[data-testid="audit-entry"]');
    await expect(auditEntries).not.toHaveCount(0);

    // Verify audit entry contains required information
    const firstEntry = auditEntries.first();
    await expect(firstEntry.locator('[data-testid="timestamp"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="user"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="action"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="resource"]')).toBeVisible();

    // Test audit filtering
    await page.fill('[data-testid="audit-filter"]', 'assessment');
    await page.click('[data-testid="apply-filter"]');

    // Verify filtered results
    await page.waitForSelector('[data-testid="filtered-results"]');
    const filteredEntries = page.locator('[data-testid="audit-entry"]');

    // All visible entries should be assessment-related
    const entryTexts = await filteredEntries.allTextContents();
    entryTexts.forEach(text => {
      expect(text.toLowerCase()).toContain('assessment');
    });
  });
});
