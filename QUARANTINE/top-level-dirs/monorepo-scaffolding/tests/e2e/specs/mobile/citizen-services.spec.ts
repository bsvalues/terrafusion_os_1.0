import { expect, test } from '@playwright/test';

/**
 * TerraFusion OS - Mobile Citizen Services E2E Tests
 *
 * Championship-level testing for mobile government services
 * with responsive design and citizen-centric user experience.
 */

test.describe('Mobile Citizen Services', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    // Citizen authentication
    await page.goto('/auth/login');
    await page.fill('[data-testid="username"]', 'mobile-citizen@example.com');
    await page.fill('[data-testid="password"]', 'MobileCitizen2024!');
    await page.click('[data-testid="login-button"]');

    // Navigate to mobile citizen portal
    await page.goto('/citizen/mobile');
    await expect(page.locator('[data-testid="mobile-portal-loaded"]')).toBeVisible();
  });

  test('should display mobile-optimized citizen dashboard', async ({ page }) => {
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();

    // Verify citizen services grid
    await expect(page.locator('[data-testid="services-grid"]')).toBeVisible();
    const serviceCards = page.locator('[data-testid="service-card"]');
    await expect(serviceCards).toHaveCountGreaterThan(6);

    // Check touch-friendly interface
    const firstCard = serviceCards.first();
    const cardBox = await firstCard.boundingBox();
    expect(cardBox?.height).toBeGreaterThan(80); // Touch target size
  });

  test('should handle property lookup on mobile', async ({ page }) => {
    await page.click('[data-testid="property-lookup-service"]');

    // Mobile property search form
    await expect(page.locator('[data-testid="mobile-property-search"]')).toBeVisible();

    // Test autocomplete address input
    await page.fill('[data-testid="address-input"]', '123 Main St');
    await page.waitForSelector('[data-testid="address-suggestions"]');

    const suggestions = page.locator('[data-testid="address-suggestion"]');
    await expect(suggestions.first()).toBeVisible();
    await suggestions.first().click();

    // Submit search
    await page.click('[data-testid="search-property"]');
    await page.waitForSelector('[data-testid="property-results"]');

    // Verify mobile-friendly results
    const results = page.locator('[data-testid="property-result"]');
    await expect(results).toHaveCountGreaterThan(0);

    // Check property details view
    await results.first().click();
    await expect(page.locator('[data-testid="property-details-mobile"]')).toBeVisible();
    await expect(page.locator('[data-testid="property-images"]')).toBeVisible();
    await expect(page.locator('[data-testid="assessment-info"]')).toBeVisible();
  });

  test('should support mobile permit applications', async ({ page }) => {
    await page.click('[data-testid="permit-application-service"]');

    // Select permit type
    await expect(page.locator('[data-testid="permit-types-mobile"]')).toBeVisible();
    await page.click('[data-testid="building-permit"]');

    // Mobile form interface
    await expect(page.locator('[data-testid="mobile-permit-form"]')).toBeVisible();

    // Fill form with mobile-optimized inputs
    await page.fill('[data-testid="applicant-name"]', 'John Mobile Citizen');
    await page.fill('[data-testid="phone-number"]', '(555) 123-4567');
    await page.fill('[data-testid="email"]', 'john@example.com');

    // Test mobile file upload
    await page.click('[data-testid="upload-documents"]');
    await expect(page.locator('[data-testid="mobile-file-upload"]')).toBeVisible();

    // Simulate camera upload
    await page.click('[data-testid="camera-upload"]');
    await expect(page.locator('[data-testid="camera-interface"]')).toBeVisible();

    // Mock photo capture
    await page.click('[data-testid="capture-photo"]');
    await page.click('[data-testid="use-photo"]');

    // Verify document was added
    await expect(page.locator('[data-testid="uploaded-document"]')).toBeVisible();

    // Submit application
    await page.click('[data-testid="submit-permit"]');
    await page.waitForSelector('[data-testid="application-submitted"]');

    // Check confirmation
    await expect(page.locator('[data-testid="permit-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="tracking-info"]')).toBeVisible();
  });

  test('should handle mobile tax payments', async ({ page }) => {
    await page.click('[data-testid="tax-payment-service"]');

    // Tax payment mobile interface
    await expect(page.locator('[data-testid="mobile-tax-payment"]')).toBeVisible();

    // Search for property
    await page.fill('[data-testid="parcel-search"]', '12345');
    await page.click('[data-testid="search-parcel"]');

    // Select tax bill
    await page.waitForSelector('[data-testid="tax-bills"]');
    const taxBills = page.locator('[data-testid="tax-bill"]');
    await expect(taxBills.first()).toBeVisible();
    await taxBills.first().click();

    // Mobile payment form
    await expect(page.locator('[data-testid="mobile-payment-form"]')).toBeVisible();

    // Fill payment details
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="expiry"]', '12/25');
    await page.fill('[data-testid="cvv"]', '123');
    await page.fill('[data-testid="cardholder-name"]', 'John Citizen');

    // Mobile address form
    await page.fill('[data-testid="billing-address"]', '123 Citizen St');
    await page.fill('[data-testid="billing-city"]', 'Richland');
    await page.fill('[data-testid="billing-zip"]', '99352');

    // Process payment
    await page.click('[data-testid="process-payment"]');
    await page.waitForSelector('[data-testid="payment-processing"]');
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });

    // Verify mobile receipt
    await expect(page.locator('[data-testid="mobile-receipt"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-download"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-receipt"]')).toBeVisible();
  });

  test('should support mobile notifications and alerts', async ({ page }) => {
    await page.goto('/citizen/mobile/notifications');

    // Check notification center
    await expect(page.locator('[data-testid="notification-center-mobile"]')).toBeVisible();

    // Verify notification types
    const notifications = page.locator('[data-testid="notification-item"]');
    await expect(notifications).toHaveCountGreaterThan(0);

    // Test notification interaction
    await notifications.first().click();
    await expect(page.locator('[data-testid="notification-detail-mobile"]')).toBeVisible();

    // Check push notification settings
    await page.click('[data-testid="notification-settings"]');
    await expect(page.locator('[data-testid="mobile-notification-preferences"]')).toBeVisible();

    // Toggle notification types
    await page.check('[data-testid="permit-updates"]');
    await page.check('[data-testid="tax-reminders"]');
    await page.check('[data-testid="service-alerts"]');

    // Save preferences
    await page.click('[data-testid="save-preferences"]');
    await expect(page.locator('[data-testid="preferences-saved"]')).toBeVisible();
  });

  test('should provide offline capability indicators', async ({ page }) => {
    // Check online status
    await expect(page.locator('[data-testid="online-status"]')).toContainText('Online');

    // Simulate offline mode
    await page.context().setOffline(true);
    await page.reload();

    // Check offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-message"]')).toContainText('Working Offline');

    // Verify cached services are available
    await expect(page.locator('[data-testid="cached-services"]')).toBeVisible();

    // Test offline form submission queue
    await page.click('[data-testid="contact-form-offline"]');
    await page.fill('[data-testid="offline-message"]', 'This is an offline message');
    await page.click('[data-testid="submit-offline"]');

    // Verify queued for sync
    await expect(page.locator('[data-testid="queued-for-sync"]')).toBeVisible();

    // Restore online
    await page.context().setOffline(false);
    await page.reload();

    // Check sync indicator
    await expect(page.locator('[data-testid="syncing-data"]')).toBeVisible();
    await page.waitForSelector('[data-testid="sync-complete"]');
  });

  test('should handle mobile geolocation services', async ({ page }) => {
    // Grant geolocation permission
    await page.context().grantPermissions(['geolocation']);
    await page.goto('/citizen/mobile/location-services');

    // Test location detection
    await page.click('[data-testid="find-my-location"]');
    await page.waitForSelector('[data-testid="location-detected"]');

    // Verify location-based services
    await expect(page.locator('[data-testid="nearby-services"]')).toBeVisible();
    const nearbyServices = page.locator('[data-testid="nearby-service"]');
    await expect(nearbyServices).toHaveCountGreaterThan(0);

    // Test service directions
    await nearbyServices.first().click();
    await page.click('[data-testid="get-directions"]');
    await expect(page.locator('[data-testid="mobile-map"]')).toBeVisible();

    // Check address verification
    await page.goto('/citizen/mobile/address-verification');
    await page.click('[data-testid="verify-current-location"]');
    await page.waitForSelector('[data-testid="address-verified"]');

    await expect(page.locator('[data-testid="verified-address"]')).toBeVisible();
  });

  test('should validate mobile performance and loading', async ({ page }) => {
    // Measure initial load time
    const startTime = Date.now();
    await page.goto('/citizen/mobile');
    await page.waitForSelector('[data-testid="mobile-portal-loaded"]');
    const loadTime = Date.now() - startTime;

    // Should load quickly on mobile
    expect(loadTime).toBeLessThan(3000); // 3 seconds max

    // Check progressive loading
    await expect(page.locator('[data-testid="skeleton-loader"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="content-loaded"]')).toBeVisible();

    // Test lazy loading of images
    await page.scrollTo(0, 1000);
    await page.waitForSelector('[data-testid="lazy-loaded-image"]');

    // Verify mobile optimizations
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const loading = await img.getAttribute('loading');
      expect(loading === 'lazy' || loading === null).toBe(true);
    }
  });

  test('should support mobile accessibility features', async ({ page }) => {
    // Test touch targets are adequate size
    const touchTargets = page.locator('button, a, input[type="checkbox"], input[type="radio"]');
    const targetCount = await touchTargets.count();

    for (let i = 0; i < Math.min(targetCount, 10); i++) {
      const target = touchTargets.nth(i);
      const box = await target.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44); // WCAG minimum
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Test mobile zoom support
    await page.setViewportSize({ width: 390 * 2, height: 844 * 2 }); // 200% zoom
    await page.reload();

    // Verify content is still accessible at 200% zoom
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="services-grid"]')).toBeVisible();

    // Test dark mode on mobile
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    // Verify dark mode mobile interface
    await expect(page.locator('[data-testid="dark-mode-active"]')).toBeVisible();

    // Check reduced motion support
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    // Verify animations are reduced
    await expect(page.locator('[data-testid="reduced-motion-active"]')).toBeVisible();
  });

  test('should handle mobile device features', async ({ page }) => {
    // Test device orientation changes
    await page.setViewportSize({ width: 844, height: 390 }); // Landscape
    await page.reload();

    // Verify landscape layout
    await expect(page.locator('[data-testid="landscape-layout"]')).toBeVisible();

    // Return to portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    // Verify portrait layout
    await expect(page.locator('[data-testid="portrait-layout"]')).toBeVisible();

    // Test mobile sharing
    await page.goto('/citizen/mobile/property/12345');
    await page.click('[data-testid="share-property"]');

    // Mock native share API
    const shareData = await page.evaluate(() => {
      return (window as any).mockShareData || null;
    });

    // Verify share functionality
    await expect(page.locator('[data-testid="share-options"]')).toBeVisible();

    // Test mobile print functionality
    await page.click('[data-testid="mobile-print"]');
    await expect(page.locator('[data-testid="print-preview-mobile"]')).toBeVisible();
  });

  test('should validate mobile security features', async ({ page }) => {
    // Test mobile logout
    await page.click('[data-testid="mobile-menu"]');
    await page.click('[data-testid="mobile-logout"]');

    // Verify secure logout
    await expect(page.locator('[data-testid="logout-confirmation"]')).toBeVisible();
    await page.click('[data-testid="confirm-logout"]');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Test mobile session timeout
    await page.fill('[data-testid="username"]', 'mobile-citizen@example.com');
    await page.fill('[data-testid="password"]', 'MobileCitizen2024!');
    await page.click('[data-testid="login-button"]');

    // Navigate to secure area
    await page.goto('/citizen/mobile/secure');

    // Verify mobile security warnings
    await expect(page.locator('[data-testid="mobile-security-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-timeout-warning"]')).toBeVisible();

    // Test biometric authentication prompt (mock)
    await page.click('[data-testid="enable-biometric"]');
    await expect(page.locator('[data-testid="biometric-setup"]')).toBeVisible();
  });
});
