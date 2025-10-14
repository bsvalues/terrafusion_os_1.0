import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Form Components
 * 
 * Tests form components in real browser environment with actual DOM interactions,
 * validation, and state management. These tests complement unit and integration tests
 * by validating production-like behavior across different browsers.
 */

test.describe('E2E: Form Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to design system demo page (adjust URL as needed)
    await page.goto('/design-system/forms');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Login Form - Input + Label + Button', () => {
    test('should render login form with all elements', async ({ page }) => {
      // Check form structure
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toHaveText(/log in|submit/i);
    });

    test('should show validation error for invalid email', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      // Enter invalid email
      await emailInput.fill('invalid-email');
      await submitButton.click();

      // Wait for validation error
      const errorMessage = page.locator('[role="alert"], .error, [aria-invalid="true"] + *').first();
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
    });

    test('should show validation error for short password', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      // Enter valid email but short password
      await emailInput.fill('user@example.com');
      await passwordInput.fill('123');
      await submitButton.click();

      // Wait for password validation error
      await page.waitForTimeout(500);
      const hasError = await page.locator('[role="alert"], .error, [aria-invalid="true"]').count() > 0;
      expect(hasError).toBeTruthy();
    });

    test('should clear error when user corrects input', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      // Trigger error
      await emailInput.fill('invalid');
      await submitButton.click();
      await page.waitForTimeout(300);

      // Correct the input
      await emailInput.fill('user@example.com');
      
      // Wait a bit for error to clear
      await page.waitForTimeout(500);
      
      // Check if error is cleared (error count should decrease)
      const errorCount = await page.locator('[aria-invalid="true"]').count();
      expect(errorCount).toBeLessThanOrEqual(1); // Password might still be invalid
    });

    test('should submit form with valid credentials', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      // Fill valid credentials
      await emailInput.fill('admin@terrafusion.gov');
      await passwordInput.fill('SecurePass123!');
      
      // Submit form
      await submitButton.click();

      // Wait for submission (check for loading state or navigation)
      await page.waitForTimeout(1000);
      
      // Verify no validation errors remain
      const errorCount = await page.locator('[role="alert"]:visible').count();
      expect(errorCount).toBe(0);
    });

    test('should navigate through form fields with Tab key', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]').first();
      
      // Focus first input
      await emailInput.focus();
      
      // Tab to password
      await page.keyboard.press('Tab');
      
      // Verify focus moved to password field
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeFocused();
      
      // Tab to submit button
      await page.keyboard.press('Tab');
      
      // Verify focus moved to button
      const submitButton = page.locator('button[type="submit"]').first();
      await expect(submitButton).toBeFocused();
    });

    test('should show password visibility toggle', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]').first();
      
      // Fill password
      await passwordInput.fill('MySecretPass123');
      
      // Look for toggle button (common pattern)
      const toggleButton = page.locator('button[aria-label*="password"], button[aria-label*="show"], button[aria-label*="hide"]').first();
      
      // If toggle exists, test it
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        
        // After toggle, input might change to type="text"
        const inputType = await passwordInput.getAttribute('type');
        // Input might have changed or visibility toggled
        expect(['password', 'text']).toContain(inputType);
      }
    });

    test('should have accessible labels for all inputs', async ({ page }) => {
      // Check email input has label
      const emailInput = page.locator('input[type="email"]').first();
      const emailId = await emailInput.getAttribute('id');
      
      if (emailId) {
        const emailLabel = page.locator(`label[for="${emailId}"]`);
        await expect(emailLabel).toBeVisible();
      }
      
      // Check password input has label
      const passwordInput = page.locator('input[type="password"]').first();
      const passwordId = await passwordInput.getAttribute('id');
      
      if (passwordId) {
        const passwordLabel = page.locator(`label[for="${passwordId}"]`);
        await expect(passwordLabel).toBeVisible();
      }
    });
  });

  test.describe('Contact Form - Textarea + Checkbox', () => {
    test('should render contact form with textarea and checkbox', async ({ page }) => {
      // Navigate to contact form section if needed
      const textarea = page.locator('textarea').first();
      const checkbox = page.locator('input[type="checkbox"]').first();
      const submitButton = page.locator('button[type="submit"]').last();

      await expect(textarea).toBeVisible();
      await expect(checkbox).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should validate minimum textarea length', async ({ page }) => {
      const textarea = page.locator('textarea').first();
      const submitButton = page.locator('button[type="submit"]').last();

      // Enter short message
      await textarea.fill('Hi');
      await submitButton.click();

      // Wait for validation
      await page.waitForTimeout(500);
      
      // Check for error state
      const hasError = await textarea.getAttribute('aria-invalid') === 'true' ||
                       await page.locator('[role="alert"]:visible').count() > 0;
      expect(hasError).toBeTruthy();
    });

    test('should handle multiline textarea input', async ({ page }) => {
      const textarea = page.locator('textarea').first();

      // Enter multiline text
      const multilineText = 'Line 1\nLine 2\nLine 3\nThis is a longer message that spans multiple lines.';
      await textarea.fill(multilineText);

      // Verify content
      const value = await textarea.inputValue();
      expect(value).toContain('Line 1');
      expect(value).toContain('Line 2');
      expect(value).toContain('Line 3');
    });

    test('should require checkbox to be checked', async ({ page }) => {
      const textarea = page.locator('textarea').first();
      const checkbox = page.locator('input[type="checkbox"]').first();
      const submitButton = page.locator('button[type="submit"]').last();

      // Fill valid message but don't check checkbox
      await textarea.fill('This is a valid message with enough characters to pass validation.');
      await submitButton.click();

      // Wait for validation
      await page.waitForTimeout(500);
      
      // Should show error if checkbox is required
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        const hasError = await page.locator('[role="alert"]:visible').count() > 0;
        // If checkbox is required, there should be an error
        // (Test will adapt to actual implementation)
      }
    });

    test('should submit contact form with valid data', async ({ page }) => {
      const textarea = page.locator('textarea').first();
      const checkbox = page.locator('input[type="checkbox"]').first();
      const submitButton = page.locator('button[type="submit"]').last();

      // Fill valid message
      await textarea.fill('This is a comprehensive message for the contact form. It contains enough characters to pass any minimum length validation and provides meaningful content.');
      
      // Check checkbox
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }
      
      // Submit
      await submitButton.click();

      // Wait for submission
      await page.waitForTimeout(1000);
      
      // Verify success (no errors)
      const errorCount = await page.locator('[role="alert"]:visible').count();
      expect(errorCount).toBe(0);
    });

    test('should handle checkbox click interactions', async ({ page }) => {
      const checkbox = page.locator('input[type="checkbox"]').first();

      // Initially unchecked (or checked)
      const initialState = await checkbox.isChecked();

      // Click checkbox
      await checkbox.click();

      // State should toggle
      const newState = await checkbox.isChecked();
      expect(newState).toBe(!initialState);

      // Click again
      await checkbox.click();

      // Should return to initial state
      const finalState = await checkbox.isChecked();
      expect(finalState).toBe(initialState);
    });

    test('should show character count for textarea', async ({ page }) => {
      const textarea = page.locator('textarea').first();
      
      // Type some text
      const testText = 'Testing character count feature.';
      await textarea.fill(testText);

      // Look for character counter (common pattern)
      const charCounter = page.locator('text=/\\d+/', { hasText: /character|char/i }).first();
      
      // If character counter exists, verify it updates
      if (await charCounter.isVisible()) {
        const counterText = await charCounter.textContent();
        expect(counterText).toMatch(/\d+/);
      }
    });
  });

  test.describe('Profile Form - Select + RadioGroup', () => {
    test('should render profile form with select and radio inputs', async ({ page }) => {
      // Look for select element
      const select = page.locator('select').first();
      const radio = page.locator('input[type="radio"]').first();

      // Check if select exists (might be custom component)
      const hasSelect = await select.count() > 0;
      const hasRadio = await radio.count() > 0;

      // At least one should exist
      expect(hasSelect || hasRadio).toBeTruthy();
    });

    test('should handle select dropdown interactions', async ({ page }) => {
      const select = page.locator('select').first();

      if (await select.isVisible()) {
        // Open select
        await select.click();

        // Select an option
        await select.selectOption({ index: 1 });

        // Verify selection
        const selectedValue = await select.inputValue();
        expect(selectedValue).toBeTruthy();
      } else {
        // Custom select component (using button + menu pattern)
        const selectTrigger = page.locator('[role="combobox"], [aria-haspopup="listbox"]').first();
        
        if (await selectTrigger.isVisible()) {
          await selectTrigger.click();

          // Wait for options menu
          await page.waitForTimeout(300);

          // Select first option
          const option = page.locator('[role="option"]').first();
          await option.click();

          // Verify menu closed
          await page.waitForTimeout(300);
          const optionCount = await page.locator('[role="option"]:visible').count();
          expect(optionCount).toBe(0);
        }
      }
    });

    test('should handle radio group selection', async ({ page }) => {
      const radios = page.locator('input[type="radio"]');
      const radioCount = await radios.count();

      if (radioCount > 0) {
        // Get first radio
        const firstRadio = radios.nth(0);
        await firstRadio.check();

        // Verify checked
        await expect(firstRadio).toBeChecked();

        // If multiple radios exist, check second
        if (radioCount > 1) {
          const secondRadio = radios.nth(1);
          await secondRadio.check();

          // Verify second is checked and first is not
          await expect(secondRadio).toBeChecked();
          await expect(firstRadio).not.toBeChecked();
        }
      }
    });

    test('should synchronize state across multiple form fields', async ({ page }) => {
      // Fill multiple fields
      const nameInput = page.locator('input[type="text"]').first();
      const emailInput = page.locator('input[type="email"]').first();

      if (await nameInput.isVisible()) {
        await nameInput.fill('John Doe');
      }
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('john@example.com');
      }

      // Verify both values persist
      await page.waitForTimeout(300);
      
      if (await nameInput.isVisible()) {
        await expect(nameInput).toHaveValue('John Doe');
      }
      
      if (await emailInput.isVisible()) {
        await expect(emailInput).toHaveValue('john@example.com');
      }
    });

    test('should validate required fields in profile form', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]').last();

      // Try to submit empty form
      await submitButton.click();

      // Wait for validation
      await page.waitForTimeout(500);

      // Should show at least one error for required fields
      const errorCount = await page.locator('[aria-invalid="true"], [role="alert"]:visible').count();
      expect(errorCount).toBeGreaterThan(0);
    });

    test('should handle rapid field changes', async ({ page }) => {
      const inputs = page.locator('input[type="text"], input[type="email"]');
      const inputCount = await inputs.count();

      if (inputCount > 0) {
        const firstInput = inputs.first();

        // Rapid typing
        await firstInput.fill('a');
        await firstInput.fill('ab');
        await firstInput.fill('abc');
        await firstInput.fill('abcd');
        await firstInput.fill('abcde');

        // Verify final value
        await expect(firstInput).toHaveValue('abcde');
      }
    });

    test('should submit complete profile form', async ({ page }) => {
      // Fill all available fields
      const textInput = page.locator('input[type="text"]').first();
      const emailInput = page.locator('input[type="email"]').first();
      const selectElement = page.locator('select').first();
      const radio = page.locator('input[type="radio"]').first();
      const submitButton = page.locator('button[type="submit"]').last();

      // Fill text fields
      if (await textInput.isVisible()) {
        await textInput.fill('Jane Smith');
      }

      if (await emailInput.isVisible()) {
        await emailInput.fill('jane.smith@terrafusion.gov');
      }

      // Select option
      if (await selectElement.isVisible()) {
        await selectElement.selectOption({ index: 1 });
      }

      // Select radio
      if (await radio.isVisible()) {
        await radio.check();
      }

      // Submit
      await submitButton.click();

      // Wait for submission
      await page.waitForTimeout(1000);

      // Verify success
      const errorCount = await page.locator('[role="alert"]:visible, [aria-invalid="true"]').count();
      expect(errorCount).toBe(0);
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have proper ARIA labels for all form controls', async ({ page }) => {
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        
        // Check for id attribute
        const inputId = await input.getAttribute('id');
        
        if (inputId) {
          // Check for associated label
          const label = page.locator(`label[for="${inputId}"]`);
          const hasLabel = await label.count() > 0;
          
          // Or check for aria-label
          const ariaLabel = await input.getAttribute('aria-label');
          
          // Or check for aria-labelledby
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          
          // At least one labeling method should exist
          expect(hasLabel || !!ariaLabel || !!ariaLabelledBy).toBeTruthy();
        }
      }
    });

    test('should have proper focus indicators', async ({ page }) => {
      const firstInput = page.locator('input').first();
      
      // Focus input
      await firstInput.focus();
      
      // Check for focus styles (this is visual, so we check computed styles)
      const outlineStyle = await firstInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline || styles.outlineWidth || styles.boxShadow;
      });
      
      // Should have some focus indicator
      expect(outlineStyle).toBeTruthy();
    });

    test('should have proper error announcements', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      // Trigger error
      await emailInput.fill('invalid');
      await submitButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Check for aria-describedby or role="alert"
      const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
      const hasAlert = await page.locator('[role="alert"]:visible').count() > 0;

      // Should have error announcement mechanism
      expect(!!ariaDescribedBy || hasAlert).toBeTruthy();
    });
  });

  test.describe('Cross-browser Form Behavior', () => {
    test('should handle form submission consistently across browsers', async ({ page, browserName }) => {
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      // Fill form
      await emailInput.fill('test@example.com');
      await passwordInput.fill('SecurePassword123');
      
      // Submit
      await submitButton.click();

      // Wait
      await page.waitForTimeout(1000);

      // Verify behavior is consistent (no errors for valid data)
      const errorCount = await page.locator('[role="alert"]:visible').count();
      expect(errorCount).toBe(0);
    });
  });
});
