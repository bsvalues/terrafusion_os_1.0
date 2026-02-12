import { test, expect } from '@playwright/test';

/**
 * TerraFusion E2E Test Suite with Playwright
 * 
 * Comprehensive end-to-end testing for government citizen services
 * covering critical user journeys across the 3-county federation.
 * 
 * Test Coverage:
 * - Citizen portal user flows
 * - Permit application workflows
 * - Emergency reporting system
 * - Cross-county service requests
 * - Accessibility compliance (ADA/Section 508)
 * - Mobile responsiveness
 */

// Test configuration
const config = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  apiURL: process.env.API_URL || 'http://localhost:8080',
  testTimeout: 30000,
  counties: ['benton', 'franklin', 'yakima'],
  testUser: {
    name: 'Test Citizen',
    email: 'test@example.com',
    phone: '(509) 555-0123',
  },
};

// Test data
const testData = {
  permitApplication: {
    applicantName: 'TerraFusion Test Applicant',
    projectAddress: '123 Test Street, Test City',
    projectType: 'new_construction',
    estimatedCost: '250000',
    description: 'Test building permit application for new commercial construction project.',
  },
  serviceRequest: {
    issueType: 'pothole_repair',
    location: '456 Main Avenue, Test Location',
    description: 'Large pothole causing vehicle damage and safety concerns.',
    severity: 'high',
  },
  emergencyReport: {
    type: 'utility_outage',
    location: '789 Emergency Lane',
    description: 'Power outage affecting multiple residential blocks.',
    severity: 'medium',
  },
};

test.describe('TerraFusion Citizen Portal E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate to home page
    await page.goto(config.baseURL);
    
    // Wait for page to be fully loaded
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test.describe('Homepage and Navigation', () => {
    
    test('should load homepage with all essential elements', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/TerraFusion/);
      
      // Verify main navigation elements
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('text=Services')).toBeVisible();
      await expect(page.locator('text=Permits')).toBeVisible();
      await expect(page.locator('text=Emergency')).toBeVisible();
      
      // Check hero section
      await expect(page.locator('h1')).toContainText('TerraFusion');
      
      // Verify county selector
      await expect(page.locator('[data-testid="county-selector"]')).toBeVisible();
      
      // Check service cards are displayed
      const serviceCards = page.locator('[data-testid="service-card"]');
      await expect(serviceCards).toHaveCount(3, { timeout: 5000 });
    });

    test('should navigate between different sections', async ({ page }) => {
      // Navigate to Services
      await page.click('text=Services');
      await expect(page.url()).toContain('/services');
      await expect(page.locator('h1')).toContainText('Citizen Services');
      
      // Navigate to Permits
      await page.click('text=Permits');
      await expect(page.url()).toContain('/permits');
      await expect(page.locator('h1')).toContainText('Permits');
      
      // Navigate to Emergency
      await page.click('text=Emergency');
      await expect(page.url()).toContain('/emergency');
      await expect(page.locator('h1')).toContainText('Emergency');
    });

    test('should handle county selection', async ({ page }) => {
      const countySelector = page.locator('[data-testid="county-selector"]');
      
      // Test each county selection
      for (const county of config.counties) {
        await countySelector.selectOption(county);
        
        // Verify URL updates
        await expect(page.url()).toContain(`county=${county}`);
        
        // Verify county-specific content loads
        await expect(page.locator(`text=${county} County`)).toBeVisible();
        
        // Wait for county-specific services to load
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Permit Application Workflow', () => {
    
    test('should complete full permit application flow', async ({ page }) => {
      // Navigate to permit application
      await page.goto(`${config.baseURL}/permits/apply`);
      
      // Fill out permit application form
      await page.fill('[data-testid="applicant-name"]', testData.permitApplication.applicantName);
      await page.fill('[data-testid="project-address"]', testData.permitApplication.projectAddress);
      await page.selectOption('[data-testid="project-type"]', testData.permitApplication.projectType);
      await page.fill('[data-testid="estimated-cost"]', testData.permitApplication.estimatedCost);
      await page.fill('[data-testid="project-description"]', testData.permitApplication.description);
      
      // Handle file upload simulation
      const fileInput = page.locator('[data-testid="architect-plans"]');
      if (await fileInput.isVisible()) {
        // Create a test file for upload
        const testFile = Buffer.from('test file content');
        await fileInput.setInputFiles({
          name: 'test-plans.pdf',
          mimeType: 'application/pdf',
          buffer: testFile,
        });
      }
      
      // Accept environmental impact checkbox
      await page.check('[data-testid="environmental-impact"]');
      
      // Submit application
      await page.click('[data-testid="submit-application"]');
      
      // Verify submission success
      await expect(page.locator('text=Application Submitted Successfully')).toBeVisible({ timeout: 10000 });
      
      // Verify application ID is displayed
      const applicationId = await page.locator('[data-testid="application-id"]').textContent();
      expect(applicationId).toBeTruthy();
      
      // Verify workflow status is displayed
      await expect(page.locator('[data-testid="workflow-progress"]')).toBeVisible();
      await expect(page.locator('text=Initial Review')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto(`${config.baseURL}/permits/apply`);
      
      // Try to submit without filling required fields
      await page.click('[data-testid="submit-application"]');
      
      // Verify validation errors appear
      await expect(page.locator('text=is required')).toHaveCount(5, { timeout: 5000 });
      
      // Fill one field and verify error disappears
      await page.fill('[data-testid="applicant-name"]', testData.permitApplication.applicantName);
      await expect(page.locator('text=Applicant Name is required')).not.toBeVisible();
    });

    test('should save draft and resume application', async ({ page }) => {
      await page.goto(`${config.baseURL}/permits/apply`);
      
      // Partially fill form
      await page.fill('[data-testid="applicant-name"]', testData.permitApplication.applicantName);
      await page.fill('[data-testid="project-address"]', testData.permitApplication.projectAddress);
      
      // Save as draft
      await page.click('[data-testid="save-draft"]');
      await expect(page.locator('text=Draft Saved')).toBeVisible();
      
      // Navigate away and back
      await page.goto(`${config.baseURL}/`);
      await page.goto(`${config.baseURL}/permits/apply`);
      
      // Verify form data is restored
      await expect(page.locator('[data-testid="applicant-name"]')).toHaveValue(testData.permitApplication.applicantName);
      await expect(page.locator('[data-testid="project-address"]')).toHaveValue(testData.permitApplication.projectAddress);
    });
  });

  test.describe('Citizen Service Requests', () => {
    
    test('should submit service request successfully', async ({ page }) => {
      await page.goto(`${config.baseURL}/services/request`);
      
      // Fill service request form
      await page.fill('[data-testid="citizen-name"]', config.testUser.name);
      await page.fill('[data-testid="contact-phone"]', config.testUser.phone);
      await page.fill('[data-testid="issue-location"]', testData.serviceRequest.location);
      await page.selectOption('[data-testid="issue-severity"]', testData.serviceRequest.severity);
      await page.fill('[data-testid="issue-description"]', testData.serviceRequest.description);
      
      // Submit request
      await page.click('[data-testid="submit-request"]');
      
      // Verify success
      await expect(page.locator('text=Service Request Submitted')).toBeVisible({ timeout: 10000 });
      
      // Verify tracking number is provided
      const trackingNumber = await page.locator('[data-testid="tracking-number"]').textContent();
      expect(trackingNumber).toBeTruthy();
      
      // Verify user can track the request
      await page.click('[data-testid="track-request"]');
      await expect(page.locator('[data-testid="request-status"]')).toBeVisible();
    });

    test('should handle photo upload for service requests', async ({ page }) => {
      await page.goto(`${config.baseURL}/services/request`);
      
      // Fill required fields
      await page.fill('[data-testid="citizen-name"]', config.testUser.name);
      await page.fill('[data-testid="contact-phone"]', config.testUser.phone);
      await page.fill('[data-testid="issue-location"]', testData.serviceRequest.location);
      await page.selectOption('[data-testid="issue-severity"]', testData.serviceRequest.severity);
      await page.fill('[data-testid="issue-description"]', testData.serviceRequest.description);
      
      // Upload photo
      const photoInput = page.locator('[data-testid="photo-evidence"]');
      const testImage = Buffer.from('fake image data');
      await photoInput.setInputFiles({
        name: 'issue-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: testImage,
      });
      
      // Verify photo upload feedback
      await expect(page.locator('text=issue-photo.jpg')).toBeVisible();
      
      // Submit with photo
      await page.click('[data-testid="submit-request"]');
      await expect(page.locator('text=Service Request Submitted')).toBeVisible();
    });
  });

  test.describe('Emergency Reporting System', () => {
    
    test('should handle emergency report submission', async ({ page }) => {
      await page.goto(`${config.baseURL}/emergency/report`);
      
      // Verify emergency warning is displayed
      await expect(page.locator('text=For Life-Threatening Emergencies')).toBeVisible();
      await expect(page.locator('text=Call 911')).toBeVisible();
      
      // Fill emergency report
      await page.selectOption('[data-testid="emergency-type"]', testData.emergencyReport.type);
      await page.fill('[data-testid="emergency-location"]', testData.emergencyReport.location);
      await page.fill('[data-testid="emergency-description"]', testData.emergencyReport.description);
      await page.selectOption('[data-testid="emergency-severity"]', testData.emergencyReport.severity);
      
      // Submit emergency report
      await page.click('[data-testid="submit-emergency"]');
      
      // Verify immediate response
      await expect(page.locator('text=Emergency Report Submitted')).toBeVisible({ timeout: 5000 });
      
      // Verify incident number is provided
      const incidentNumber = await page.locator('[data-testid="incident-number"]').textContent();
      expect(incidentNumber).toBeTruthy();
      
      // Verify emergency contact information is displayed
      await expect(page.locator('[data-testid="emergency-contacts"]')).toBeVisible();
    });

    test('should prioritize high-severity emergencies', async ({ page }) => {
      await page.goto(`${config.baseURL}/emergency/report`);
      
      // Select high severity emergency
      await page.selectOption('[data-testid="emergency-type"]', 'fire');
      await page.selectOption('[data-testid="emergency-severity"]', 'high');
      await page.fill('[data-testid="emergency-location"]', testData.emergencyReport.location);
      await page.fill('[data-testid="emergency-description"]', 'Structure fire with people trapped');
      
      // Submit
      await page.click('[data-testid="submit-emergency"]');
      
      // Verify priority handling message
      await expect(page.locator('text=High Priority Emergency')).toBeVisible();
      await expect(page.locator('text=Emergency Services Notified')).toBeVisible();
    });
  });

  test.describe('Cross-County Federation', () => {
    
    test('should handle cross-county service requests', async ({ page }) => {
      await page.goto(`${config.baseURL}/services/request`);
      
      // Select different county than user's home county
      await page.selectOption('[data-testid="service-county"]', 'franklin');
      
      // Fill request for different county
      await page.fill('[data-testid="citizen-name"]', config.testUser.name);
      await page.fill('[data-testid="contact-phone"]', config.testUser.phone);
      await page.fill('[data-testid="issue-location"]', 'Cross-county location in Franklin County');
      await page.selectOption('[data-testid="issue-severity"]', 'normal');
      await page.fill('[data-testid="issue-description"]', 'Cross-county service request test');
      
      // Submit
      await page.click('[data-testid="submit-request"]');
      
      // Verify federation routing message
      await expect(page.locator('text=Routing to Franklin County')).toBeVisible();
      await expect(page.locator('text=Cross-County Request')).toBeVisible();
      
      // Verify tracking includes federation info
      const trackingInfo = page.locator('[data-testid="tracking-info"]');
      await expect(trackingInfo).toContainText('Franklin County');
    });

    test('should display federation status', async ({ page }) => {
      await page.goto(`${config.baseURL}/federation/status`);
      
      // Verify federation health dashboard
      await expect(page.locator('[data-testid="federation-health"]')).toBeVisible();
      
      // Check each county status
      for (const county of config.counties) {
        await expect(page.locator(`[data-testid="county-${county}-status"]`)).toBeVisible();
      }
      
      // Verify connectivity matrix
      await expect(page.locator('[data-testid="connectivity-matrix"]')).toBeVisible();
    });
  });

  test.describe('Accessibility Compliance', () => {
    
    test('should meet basic accessibility standards', async ({ page }) => {
      await page.goto(config.baseURL);
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test skip link
      await page.keyboard.press('Tab');
      const skipLink = page.locator('text=Skip to main content');
      if (await skipLink.isVisible()) {
        await skipLink.click();
        await expect(page.locator('main')).toBeFocused();
      }
      
      // Verify headings hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Check for alt text on images
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
      
      // Verify form labels
      const inputs = await page.locator('input[type="text"], input[type="email"], textarea, select').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        if (id) {
          await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
        }
      }
    });

    test('should support screen reader navigation', async ({ page }) => {
      await page.goto(`${config.baseURL}/permits/apply`);
      
      // Check ARIA labels
      const ariaElements = await page.locator('[aria-label], [aria-labelledby], [aria-describedby]').all();
      expect(ariaElements.length).toBeGreaterThan(0);
      
      // Verify form field descriptions
      const requiredFields = await page.locator('[required]').all();
      for (const field of requiredFields) {
        const ariaDescribedBy = await field.getAttribute('aria-describedby');
        if (ariaDescribedBy) {
          await expect(page.locator(`#${ariaDescribedBy}`)).toBeVisible();
        }
      }
      
      // Check role attributes
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(config.baseURL);
      
      // Verify mobile navigation menu
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      }
      
      // Test mobile form interaction
      await page.goto(`${config.baseURL}/services/request`);
      
      // Verify form is usable on mobile
      await page.fill('[data-testid="citizen-name"]', config.testUser.name);
      await page.fill('[data-testid="contact-phone"]', config.testUser.phone);
      
      // Verify touch-friendly elements
      const submitButton = page.locator('[data-testid="submit-request"]');
      const buttonSize = await submitButton.boundingBox();
      expect(buttonSize?.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
    });

    test('should handle tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(config.baseURL);
      
      // Verify layout adapts to tablet
      const serviceCards = page.locator('[data-testid="service-card"]');
      const cardCount = await serviceCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Verify navigation remains accessible
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('text=Services')).toBeVisible();
    });
  });

  test.describe('Performance and Loading', () => {
    
    test('should load pages within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(config.baseURL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Verify page loads within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check for performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        };
      });
      
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
    });

    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow 3G
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      await page.goto(config.baseURL);
      
      // Verify loading states are shown
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
      }
      
      // Verify page eventually loads completely
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    });
  });
});

// Custom test utilities
test.describe('Test Utilities and Helpers', () => {
  
  test('should connect to test database', async ({ page }) => {
    // Verify test environment connectivity
    const response = await page.request.get(`${config.apiURL}/health`);
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    expect(health.status).toBe('healthy');
  });

  test('should clean up test data', async ({ page }) => {
    // Cleanup any test data created during testing
    if (process.env.TEST_ENV === 'staging') {
      const response = await page.request.delete(`${config.apiURL}/test/cleanup`);
      expect(response.status()).toBe(200);
    }
  });
});

// Test hooks for setup and teardown
test.afterEach(async ({ page }, testInfo) => {
  // Capture screenshot on failure
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot();
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
  }
  
  // Clear any localStorage/sessionStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

test.afterAll(async () => {
  // Final cleanup after all tests
  // eslint-disable-next-line no-console
  console.log('🧹 Cleaning up after TerraFusion E2E tests');
});