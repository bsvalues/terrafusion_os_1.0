import { test, expect } from '@playwright/test';

/**
 * Government Personas E2E Tests
 * Testing critical workflows for Benton County Washington government users
 */

test.describe('Benton County Government Personas', () => {
  
  test.describe('County Assessor Workflows', () => {
    
    test('assessor can access property dashboard', async ({ page }) => {
      // Navigate to assessor dashboard
      await page.goto('/assessor/dashboard');
      
      // Verify assessor authentication
      await expect(page.locator('[data-testid="user-role"]')).toContainText('County Assessor');
      
      // Check property count display
      await expect(page.locator('[data-testid="total-parcels"]')).toContainText('89,247');
      
      // Verify recent assessments section
      await expect(page.locator('[data-testid="recent-assessments"]')).toBeVisible();
      
      // Test search functionality
      await page.fill('[data-testid="property-search"]', 'MASKED_ADDRESS_001');
      await page.click('[data-testid="search-button"]');
      
      // Verify search results with masked data
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="property-details"]')).toContainText('MASKED');
    });
    
    test('assessor can perform property valuation', async ({ page }) => {
      await page.goto('/assessor/property/MASKED_PARCEL_001');
      
      // Verify property details load
      await expect(page.locator('[data-testid="property-id"]')).toBeVisible();
      
      // Test valuation methods
      await page.click('[data-testid="sales-comparison-tab"]');
      await expect(page.locator('[data-testid="comparable-sales"]')).toBeVisible();
      
      await page.click('[data-testid="cost-approach-tab"]');
      await expect(page.locator('[data-testid="replacement-cost"]')).toBeVisible();
      
      await page.click('[data-testid="income-approach-tab"]');
      await expect(page.locator('[data-testid="rental-income"]')).toBeVisible();
      
      // Test AI-assisted valuation
      await page.click('[data-testid="ai-valuation-button"]');
      await expect(page.locator('[data-testid="ai-recommendation"]')).toBeVisible();
    });
    
  });
  
  test.describe('County Administrator Workflows', () => {
    
    test('admin can access system overview', async ({ page }) => {
      await page.goto('/admin/dashboard');
      
      // Verify admin privileges
      await expect(page.locator('[data-testid="user-role"]')).toContainText('County Administrator');
      
      // Check AI agent status
      await expect(page.locator('[data-testid="ai-agents-count"]')).toContainText('1,008');
      await expect(page.locator('[data-testid="rust-agents-count"]')).toContainText('50,000');
      
      // Verify module ecosystem
      await expect(page.locator('[data-testid="active-modules"]')).toContainText('35+');
      
      // Test system health monitoring
      await page.click('[data-testid="system-health-tab"]');
      await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    });
    
    test('admin can manage AI agent coordination', async ({ page }) => {
      await page.goto('/admin/ai-coordination');
      
      // Verify Supreme Commander Claude status
      await expect(page.locator('[data-testid="supreme-commander"]')).toContainText('Active');
      
      // Check field generals
      await expect(page.locator('[data-testid="field-generals-count"]')).toContainText('1,220');
      
      // Test agent deployment controls
      await page.click('[data-testid="deploy-agents-button"]');
      await expect(page.locator('[data-testid="deployment-status"]')).toBeVisible();
    });
    
  });
  
  test.describe('Licensed Realtor Workflows', () => {
    
    test('realtor can access MLS integration', async ({ page }) => {
      await page.goto('/realtor/mls');
      
      // Verify realtor license status
      await expect(page.locator('[data-testid="license-status"]')).toContainText('Active');
      
      // Test property search with market data
      await page.fill('[data-testid="mls-search"]', 'MASKED_LISTING_001');
      await page.click('[data-testid="mls-search-button"]');
      
      // Verify market analytics
      await expect(page.locator('[data-testid="market-trends"]')).toBeVisible();
      await expect(page.locator('[data-testid="price-analysis"]')).toBeVisible();
    });
    
    test('realtor can generate CMA reports', async ({ page }) => {
      await page.goto('/realtor/cma/MASKED_PROPERTY_001');
      
      // Generate comparative market analysis
      await page.click('[data-testid="generate-cma-button"]');
      
      // Verify report components
      await expect(page.locator('[data-testid="subject-property"]')).toBeVisible();
      await expect(page.locator('[data-testid="comparable-properties"]')).toBeVisible();
      await expect(page.locator('[data-testid="market-adjustments"]')).toBeVisible();
      
      // Test PDF export
      await page.click('[data-testid="export-pdf-button"]');
      await expect(page.locator('[data-testid="export-status"]')).toContainText('Generated');
    });
    
  });
  
  test.describe('Citizen Portal Workflows', () => {
    
    test('citizen can view property information', async ({ page }) => {
      await page.goto('/citizen/property-lookup');
      
      // Test public property search
      await page.fill('[data-testid="address-search"]', 'MASKED_PUBLIC_ADDRESS');
      await page.click('[data-testid="lookup-button"]');
      
      // Verify public information display
      await expect(page.locator('[data-testid="property-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="tax-information"]')).toBeVisible();
      
      // Ensure sensitive data is masked
      await expect(page.locator('body')).not.toContainText('SSN');
      await expect(page.locator('body')).not.toContainText('PII');
    });
    
    test('citizen can access public services', async ({ page }) => {
      await page.goto('/citizen/services');
      
      // Verify service categories
      await expect(page.locator('[data-testid="permit-services"]')).toBeVisible();
      await expect(page.locator('[data-testid="tax-services"]')).toBeVisible();
      await expect(page.locator('[data-testid="records-services"]')).toBeVisible();
      
      // Test service request submission
      await page.click('[data-testid="submit-request-button"]');
      await expect(page.locator('[data-testid="request-form"]')).toBeVisible();
    });
    
  });
  
  test.describe('Cross-Persona Integration', () => {
    
    test('workflow handoffs between personas work correctly', async ({ page }) => {
      // Test assessor-to-admin workflow
      await page.goto('/assessor/dashboard');
      await page.click('[data-testid="escalate-to-admin"]');
      
      // Verify admin notification
      await page.goto('/admin/notifications');
      await expect(page.locator('[data-testid="assessor-escalation"]')).toBeVisible();
      
      // Test realtor-to-citizen information flow
      await page.goto('/realtor/mls');
      await page.click('[data-testid="publish-to-public"]');
      
      // Verify public listing availability
      await page.goto('/citizen/property-lookup');
      await expect(page.locator('[data-testid="new-listings"]')).toBeVisible();
    });
    
  });
  
});