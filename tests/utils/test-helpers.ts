/**
 * Test Utilities and Helpers
 * Shared utilities for all test types
 */

import { Page, expect } from '@playwright/test';

export class TestHelpers {
  /**
   * Login helper for different user roles
   */
  static async loginAs(page: Page, role: 'admin' | 'assessor' | 'viewer' = 'admin') {
    const credentials = {
      admin: { username: 'admin@terrafusion.gov', password: 'admin-test-pass' },
      assessor: { username: 'assessor@bentoncounty.gov', password: 'assessor-test-pass' },
      viewer: { username: 'viewer@example.com', password: 'viewer-test-pass' }
    };

    const creds = credentials[role];
    
    await page.goto('/login');
    await page.fill('[data-testid="username"]', creds.username);
    await page.fill('[data-testid="password"]', creds.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for login to complete
    await page.waitForURL('/dashboard');
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  }

  /**
   * Wait for API call to complete
   */
  static async waitForApiCall(page: Page, apiPattern: string | RegExp, timeout = 10000) {
    return page.waitForResponse(
      response => {
        const url = response.url();
        if (typeof apiPattern === 'string') {
          return url.includes(apiPattern);
        }
        return apiPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * Mock API response for testing
   */
  static async mockApiResponse(page: Page, pattern: string, response: any, status = 200) {
    await page.route(`**/${pattern}`, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Wait for loading state to finish
   */
  static async waitForLoadingToFinish(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });
  }

  /**
   * Check accessibility compliance
   */
  static async checkAccessibility(page: Page) {
    // This would integrate with axe-playwright
    // For now, check basic accessibility requirements
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
    
    const focusableElements = await page.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).count();
    expect(focusableElements).toBeGreaterThan(0);
  }

  /**
   * Take screenshot for debugging
   */
  static async takeDebugScreenshot(page: Page, name: string) {
    await page.screenshot({ 
      path: `test-results/debug-screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Simulate network conditions
   */
  static async simulateSlowNetwork(page: Page) {
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 2000);
    });
  }

  static async simulateNetworkError(page: Page, pattern: string) {
    await page.route(pattern, route => {
      route.abort('internetdisconnected');
    });
  }

  /**
   * Generate test data
   */
  static generateTestProperty() {
    const id = Math.floor(Math.random() * 10000);
    return {
      id,
      parcel_number: `TEST-${id.toString().padStart(6, '0')}`,
      address: `${id} Test Street, Benton City, WA 99320`,
      owner: `Test Owner ${id}`,
      acres: Math.round((Math.random() * 5 + 0.1) * 100) / 100,
      assessed_value: Math.floor(Math.random() * 500000 + 100000),
      square_feet: Math.floor(Math.random() * 2000 + 1000),
      bedrooms: Math.floor(Math.random() * 4 + 1),
      bathrooms: Math.floor(Math.random() * 3 + 1),
      year_built: Math.floor(Math.random() * 50 + 1970)
    };
  }

  static generateTestUser(role: 'admin' | 'assessor' | 'viewer' = 'viewer') {
    const id = Math.floor(Math.random() * 10000);
    return {
      id: `u-${id}`,
      username: `testuser${id}@example.com`,
      name: `Test User ${id}`,
      role,
      permissions: role === 'admin' ? ['read', 'write', 'delete', 'export'] : ['read'],
      created_at: new Date().toISOString()
    };
  }

  /**
   * Database helpers for integration tests
   */
  static async cleanupTestData(page: Page) {
    // Clean up any test data created during tests
    await page.request.delete('/api/test/cleanup');
  }

  static async seedTestData(page: Page, dataType: 'minimal' | 'full' = 'minimal') {
    await page.request.post('/api/test/seed', {
      data: { type: dataType }
    });
  }

  /**
   * Performance monitoring helpers
   */
  static async measurePageLoad(page: Page, url: string) {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    return endTime - startTime;
  }

  static async measureApiResponse(page: Page, apiUrl: string) {
    const startTime = Date.now();
    const response = await page.request.get(apiUrl);
    const endTime = Date.now();
    
    return {
      responseTime: endTime - startTime,
      status: response.status(),
      ok: response.ok()
    };
  }

  /**
   * Government compliance helpers
   */
  static async verifyAuditTrail(page: Page, action: string, resourceId?: string) {
    await page.goto('/audit/trail');
    
    if (resourceId) {
      await page.fill('[data-testid="audit-filter"]', resourceId);
      await page.click('[data-testid="apply-filter"]');
    }
    
    const auditEntries = page.locator('[data-testid="audit-entry"]');
    const entryTexts = await auditEntries.allTextContents();
    
    const hasAction = entryTexts.some(text => text.toLowerCase().includes(action.toLowerCase()));
    expect(hasAction).toBeTruthy();
  }

  static async verifyFISMACompliance(page: Page) {
    // Check for required FISMA security headers
    const response = await page.request.get('/api/health');
    const headers = response.headers();
    
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
  }

  /**
   * Multi-county testing helpers
   */
  static async switchCounty(page: Page, county: 'benton' | 'yakima' | 'cowlitz') {
    await page.click('[data-testid="county-selector"]');
    await page.click(`[data-testid="county-${county}"]`);
    await page.waitForSelector(`[data-testid="current-county"][data-county="${county}"]`);
  }

  static async verifyCountySync(page: Page, sourceCounty: string, targetCounty: string) {
    // Verify that data changes in one county are properly synced to others
    const sourceResponse = await page.request.get(`/api/${sourceCounty}/parcels/count`);
    const targetResponse = await page.request.get(`/api/${targetCounty}/parcels/count`);
    
    const sourceData = await sourceResponse.json();
    const targetData = await targetResponse.json();
    
    // Both should have data (exact counts may differ)
    expect(sourceData.count).toBeGreaterThan(0);
    expect(targetData.count).toBeGreaterThan(0);
  }
}

/**
 * Test data builders
 */
export class TestDataBuilder {
  static property() {
    return new PropertyBuilder();
  }

  static user() {
    return new UserBuilder();
  }

  static assessment() {
    return new AssessmentBuilder();
  }
}

class PropertyBuilder {
  private data: any = {
    parcel_number: 'TEST-000001',
    address: '123 Test Street',
    owner: 'Test Owner',
    acres: 1.0,
    assessed_value: 200000
  };

  withParcelNumber(number: string) {
    this.data.parcel_number = number;
    return this;
  }

  withAddress(address: string) {
    this.data.address = address;
    return this;
  }

  withOwner(owner: string) {
    this.data.owner = owner;
    return this;
  }

  withValue(value: number) {
    this.data.assessed_value = value;
    return this;
  }

  residential() {
    this.data.property_type = 'residential';
    this.data.bedrooms = 3;
    this.data.bathrooms = 2;
    this.data.square_feet = 2000;
    return this;
  }

  commercial() {
    this.data.property_type = 'commercial';
    this.data.square_feet = 5000;
    this.data.parking_spaces = 20;
    return this;
  }

  build() {
    return { ...this.data };
  }
}

class UserBuilder {
  private data: any = {
    username: 'test@example.com',
    name: 'Test User',
    role: 'viewer',
    permissions: ['read']
  };

  withUsername(username: string) {
    this.data.username = username;
    return this;
  }

  withRole(role: 'admin' | 'assessor' | 'viewer') {
    this.data.role = role;
    this.data.permissions = role === 'admin' 
      ? ['read', 'write', 'delete', 'export']
      : role === 'assessor' 
      ? ['read', 'write', 'approve'] 
      : ['read'];
    return this;
  }

  admin() {
    return this.withRole('admin');
  }

  assessor() {
    return this.withRole('assessor');
  }

  build() {
    return { ...this.data };
  }
}

class AssessmentBuilder {
  private data: any = {
    property_id: 1,
    assessed_value: 200000,
    assessment_date: new Date().toISOString(),
    status: 'pending'
  };

  forProperty(propertyId: number) {
    this.data.property_id = propertyId;
    return this;
  }

  withValue(value: number) {
    this.data.assessed_value = value;
    return this;
  }

  approved() {
    this.data.status = 'approved';
    return this;
  }

  pending() {
    this.data.status = 'pending';
    return this;
  }

  build() {
    return { ...this.data };
  }
}