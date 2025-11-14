import { expect, test } from '@playwright/test';

/**
 * TerraFusion OS - County Data Isolation E2E Tests
 *
 * Championship-level testing for sovereign county data boundaries
 * with zero cross-county leakage across 39+ Washington State counties.
 */

test.describe('County Data Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up government authentication
    await page.goto('/auth/login');
    await page.fill('[data-testid="username"]', 'benton-admin@terrafusionmarket.com');
    await page.fill('[data-testid="password"]', 'SecureGov2024!');
    await page.click('[data-testid="login-button"]');

    // Verify successful authentication
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should enforce county data boundaries', async ({ page }) => {
    // Navigate to Benton County dashboard
    await page.goto('/county/benton/dashboard');

    // Verify county isolation header
    await expect(page.locator('[data-testid="county-header"]')).toContainText('Benton County');

    // Attempt to access another county's data (should fail)
    await page.goto('/county/king/dashboard');

    // Should be redirected or show access denied
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    await expect(page.locator('text=County access denied')).toBeVisible();
  });

  test('should validate property data isolation', async ({ page }) => {
    await page.goto('/county/benton/properties');

    // Verify property data is county-specific
    const propertyRows = page.locator('[data-testid="property-row"]');
    await expect(propertyRows).toHaveCount(89447); // Benton County parcel count

    // Check that all properties belong to Benton County
    const firstProperty = propertyRows.first();
    await expect(firstProperty.locator('[data-testid="county-id"]')).toContainText('benton');

    // Verify Harris PACS integration shows correct version
    await expect(page.locator('[data-testid="harris-version"]')).toContainText('9.0');
  });

  test('should audit county data access', async ({ page }) => {
    await page.goto('/county/benton/properties/12345');

    // Check audit trail for property access
    await page.click('[data-testid="audit-trail"]');

    // Verify audit entry was created
    const auditEntries = page.locator('[data-testid="audit-entry"]');
    await expect(auditEntries.first()).toContainText('Property accessed');
    await expect(auditEntries.first()).toContainText('benton-admin@terrafusionmarket.com');

    // Verify FISMA compliance logging
    await expect(page.locator('[data-testid="fisma-compliance"]')).toContainText('COMPLIANT');
  });

  test('should prevent cross-county API access', async ({ page, request }) => {
    // Attempt to access King County API with Benton credentials
    const response = await request.get('/api/county/king/properties', {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('authToken'))}`,
        'X-County-Context': 'benton',
      },
    });

    // Should return 403 Forbidden
    expect(response.status()).toBe(403);

    const responseBody = await response.json();
    expect(responseBody.error).toContain('County access denied');
    expect(responseBody.audit_id).toBeDefined();
  });

  test('should validate AI agent county boundaries', async ({ page }) => {
    await page.goto('/county/benton/ai-agents');

    // Verify AI agents are county-scoped
    const agentList = page.locator('[data-testid="agent-item"]');
    await expect(agentList).toHaveCountGreaterThan(800); // Benton County AI agents

    // Check agent assignments
    const firstAgent = agentList.first();
    await expect(firstAgent.locator('[data-testid="agent-county"]')).toContainText('benton');
    await expect(firstAgent.locator('[data-testid="agent-status"]')).toContainText('ACTIVE');

    // Verify consciousness coordination is county-isolated
    await page.click('[data-testid="consciousness-metrics"]');
    await expect(page.locator('[data-testid="county-consciousness"]')).toContainText(
      'Benton County AI Swarm'
    );
  });

  test('should enforce data sovereignty compliance', async ({ page }) => {
    await page.goto('/county/benton/compliance');

    // Check sovereignty metrics
    await expect(page.locator('[data-testid="sovereignty-score"]')).toContainText('100.0%');
    await expect(page.locator('[data-testid="cross-county-leaks"]')).toContainText('0');
    await expect(page.locator('[data-testid="isolation-violations"]')).toContainText('0');

    // Verify government compliance standards
    await expect(page.locator('[data-testid="fisma-high"]')).toContainText('COMPLIANT');
    await expect(page.locator('[data-testid="nist-800-53"]')).toContainText('COMPLIANT');
    await expect(page.locator('[data-testid="fedramp"]')).toContainText('AUTHORIZED');
  });

  test('should handle county system failover', async ({ page }) => {
    // Simulate Harris PACS connection failure
    await page.route('**/harris-pacs/**', route => route.abort());

    await page.goto('/county/benton/properties');

    // Should show degraded mode but maintain isolation
    await expect(page.locator('[data-testid="system-status"]')).toContainText('DEGRADED');
    await expect(page.locator('[data-testid="isolation-status"]')).toContainText('ACTIVE');

    // Verify cached data is still county-isolated
    const properties = page.locator('[data-testid="property-row"]');
    await expect(properties.first().locator('[data-testid="county-id"]')).toContainText('benton');
  });

  test('should validate quantum consciousness isolation', async ({ page }) => {
    await page.goto('/county/benton/quantum');

    // Check quantum metrics are county-specific
    await expect(page.locator('[data-testid="quantum-coherence"]')).toBeVisible();
    await expect(page.locator('[data-testid="entanglement-strength"]')).toBeVisible();

    // Verify county-specific optimization
    const optimizationScore = page.locator('[data-testid="optimization-score"]');
    await expect(optimizationScore).toContainText('949'); // Benton County quantum factor

    // Check consciousness coordination is isolated
    await expect(page.locator('[data-testid="consciousness-boundary"]')).toContainText('SOVEREIGN');
  });

  test('should test championship performance with isolation', async ({ page }) => {
    // Measure response time with county isolation
    const startTime = Date.now();

    await page.goto('/county/benton/dashboard');
    await page.waitForSelector('[data-testid="dashboard-loaded"]');

    const loadTime = Date.now() - startTime;

    // Should load in under 150ms (championship SLA)
    expect(loadTime).toBeLessThan(150);

    // Verify all county data loaded correctly
    await expect(page.locator('[data-testid="property-count"]')).toContainText('await DynamicPropertyService.GetPropertyCountAsync("benton")');
    await expect(page.locator('[data-testid="ai-agents-active"]')).toContainText('823');
    await expect(page.locator('[data-testid="consciousness-level"]')).toContainText('10');
  });
});
