# 🎭 Frontend Component E2E Tests - THE TERRAFUSION WAY

## Overview

This directory contains **End-to-End (E2E) tests** for TerraFusion's frontend design system components using **Playwright**. These tests validate component behavior in **real browser environments** with **production-like conditions**, complementing our unit tests (component isolation) and integration tests (multi-component workflows).

### Testing Pyramid - Complete:
```
        /\
       /  \  E2E Tests (This Directory)
      /____\
     /      \  Integration Tests (frontend/src/__tests__/integration/)
    /________\
   /          \  Unit Tests (frontend/src/__tests__/)
  /____________\
```

---

## 🎯 E2E Test Categories

### **1. Forms (`forms/`)**
**Purpose:** Validate form components with real browser interactions and validation

**Components Tested:**
- Input + Label + Button workflows
- Textarea + Checkbox combinations
- Select + RadioGroup state management
- Real form submission with validation
- Error handling and recovery

**Key Scenarios:**
- Login form with email/password validation
- Contact form with multiline input
- Profile form with complex state
- Tab navigation through fields
- Real-time validation feedback

---

### **2. Dialogs/Modals (`dialogs/`)**
**Purpose:** Test modal components with real focus management and backdrop interactions

**Components Tested:**
- Dialog + Form integration
- AlertDialog confirmation flows
- Sheet side panels
- Nested dialog workflows

**Key Scenarios:**
- Edit profile dialog with save/cancel
- Delete confirmation with AlertDialog
- Settings panel with Sheet
- Focus trap and restoration in real browser
- Escape key handling
- Backdrop click interactions

---

### **3. Navigation (`navigation/`)**
**Purpose:** Test navigation patterns with real browser history and URL state

**Components Tested:**
- Tabs + content switching
- Accordion expand/collapse
- NavigationMenu
- Combined navigation patterns

**Key Scenarios:**
- Settings tabs with URL state
- FAQ accordion with deep linking
- Nested navigation structures
- Keyboard navigation (Arrow keys, Enter, Space)
- Browser back/forward button integration

---

### **4. Data Display (`data-display/`)**
**Purpose:** Validate data presentation with real fetching, loading, and error states

**Components Tested:**
- Table + sorting + pagination
- Card + Avatar + Badge compositions
- Skeleton → Content transitions
- Progress indicators
- Dashboard workflows

**Key Scenarios:**
- User table with real data fetching
- Sort/filter/paginate operations
- Loading state transitions
- Error state handling
- Empty state display

---

### **5. Command Palette (`command-palette/`)**
**Purpose:** Test keyboard-driven command palette with real shortcuts and actions

**Components Tested:**
- Command palette opening (⌘K)
- CommandInput + filtering
- CommandList + groups
- Recent actions tracking

**Key Scenarios:**
- Open palette with keyboard shortcut
- Search and filter commands
- Execute command actions
- Recent command tracking
- Keyboard navigation through items

---

### **6. Floating UI (`floating-ui/`)**
**Purpose:** Validate floating components with real positioning and z-index management

**Components Tested:**
- Tooltip on hover/focus
- Popover with form controls
- DropdownMenu selections
- Multiple floating elements

**Key Scenarios:**
- Tooltip display timing
- Popover positioning near viewport edges
- Dropdown menu interactions
- Z-index layering with multiple floaters
- Scroll behavior with floating elements

---

### **7. Visual Regression (`visual/`)**
**Purpose:** Screenshot comparison for visual consistency across changes

**Components Tested:**
- All design system components
- Different component states (default, hover, focus, error, disabled)
- Responsive breakpoints
- Dark/light mode variations

**Key Scenarios:**
- Baseline screenshot capture
- Visual diff on component changes
- Cross-browser visual consistency
- Responsive design validation

---

### **8. Accessibility (`accessibility/`)**
**Purpose:** Comprehensive accessibility audits with @axe-core/playwright

**Components Tested:**
- All components for WCAG 2.1 compliance
- Keyboard navigation end-to-end
- Screen reader announcements (ARIA)
- Focus management
- Color contrast

**Key Scenarios:**
- Axe accessibility scans
- Keyboard-only navigation paths
- Focus order validation
- ARIA attribute correctness
- High contrast mode testing

---

## 🛠️ Test Structure

### File Naming Convention:
```
[component-category].spec.ts
```

**Examples:**
- `form-components.spec.ts` - Form-related E2E tests
- `dialog-components.spec.ts` - Dialog/modal E2E tests
- `navigation-components.spec.ts` - Navigation E2E tests

### Test Structure Pattern:
```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E: [Component Category]', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page
    await page.goto('/design-system/[component]');
    
    // Wait for component to be ready
    await page.waitForLoadState('networkidle');
  });

  test.describe('[Component Name] - Real Browser Interactions', () => {
    test('should handle complete user workflow', async ({ page }) => {
      // Arrange: Navigate to component
      const component = page.locator('[data-testid="component"]');
      await expect(component).toBeVisible();
      
      // Act: Perform real user interactions
      await component.click();
      await page.keyboard.press('Enter');
      
      // Assert: Validate real browser state
      await expect(page).toHaveURL(/expected-url/);
    });
  });

  test.describe('Visual Regression', () => {
    test('should match baseline screenshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('[component]-state.png');
    });
  });

  test.describe('Accessibility Audit', () => {
    test('should have no accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});
```

---

## 🎯 Testing Standards - THE TERRAFUSION WAY

### **1. Real Browser Behavior**
- ✅ Test in actual browsers (Chromium, Firefox, WebKit)
- ✅ Real DOM rendering and interactions
- ✅ No mocking - production-like environment
- ✅ Real timing and network requests

### **2. Production-like Conditions**
- ✅ Test against running application (localhost:3000)
- ✅ Real API responses (or realistic test data)
- ✅ Real loading states and transitions
- ✅ Real error handling

### **3. Cross-browser Testing**
- ✅ Test on Chromium (Chrome, Edge)
- ✅ Test on Firefox
- ✅ Test on WebKit (Safari)
- ✅ Validate consistent behavior across browsers

### **4. Visual Validation**
- ✅ Screenshot comparison for visual regression
- ✅ Responsive design validation
- ✅ Dark/light mode consistency
- ✅ Component state variations

### **5. Accessibility Compliance**
- ✅ @axe-core/playwright for WCAG 2.1 audits
- ✅ Keyboard navigation end-to-end
- ✅ Screen reader compatibility (ARIA)
- ✅ Focus management validation
- ✅ Color contrast verification

### **6. Performance Validation**
- ✅ Page load times
- ✅ Component render times
- ✅ Interaction responsiveness
- ✅ Network request efficiency

---

## 📦 Running E2E Tests

### Install Playwright Browsers:
```bash
npx playwright install
```

### Run All E2E Tests:
```bash
npm run test:e2e
```

### Run Frontend Component E2E Tests:
```bash
npm run test:e2e:frontend
```

### Run Specific Test Category:
```bash
# Forms only
npx playwright test tests/e2e/frontend/forms/

# Dialogs only
npx playwright test tests/e2e/frontend/dialogs/

# Visual regression only
npx playwright test tests/e2e/frontend/visual/
```

### Run with UI Mode (Interactive):
```bash
npm run test:e2e:frontend:ui
```

### Run Specific Browser:
```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari) only
npx playwright test --project=webkit
```

### Debug Mode:
```bash
npx playwright test --debug
```

### Update Visual Baseline Screenshots:
```bash
npx playwright test --update-snapshots
```

---

## 🎓 E2E Testing Philosophy

### **Unit vs Integration vs E2E:**

**Unit Tests (Component Isolation):**
- Fast (milliseconds)
- Test individual component behavior
- Mocked dependencies
- Run on every file save
- 100% code coverage goal

**Integration Tests (Multi-component Workflows):**
- Medium speed (seconds)
- Test component interactions
- Minimal mocking
- Run before commit
- Workflow coverage goal

**E2E Tests (Production Validation):**
- Slower (seconds to minutes)
- Test complete user journeys in real browser
- No mocking - production-like
- Run before deployment
- Critical path coverage goal

### **When to Write E2E Tests:**

✅ **DO write E2E tests for:**
- Critical user paths (login, checkout, submission)
- Cross-browser compatibility
- Visual regression detection
- Accessibility compliance
- Performance benchmarks
- Real browser interactions (hover, focus, scroll)

❌ **DON'T write E2E tests for:**
- Simple component rendering (use unit tests)
- Edge cases (use unit tests)
- Fast feedback loops (use unit tests)
- Every possible scenario (E2E tests are expensive)

### **E2E Test Maintenance:**

- **Keep tests stable:** Use reliable selectors (data-testid)
- **Keep tests fast:** Focus on critical paths only
- **Keep tests independent:** Each test should be self-contained
- **Keep tests debuggable:** Use clear test names and assertions
- **Keep snapshots updated:** Review visual changes carefully

---

## 📊 Coverage Goals

### **Component E2E Coverage:**
- ✅ All critical user workflows tested
- ✅ All interactive components validated in real browser
- ✅ Cross-browser consistency verified
- ✅ Visual regression baselines established
- ✅ Accessibility compliance validated

### **Browser Coverage:**
- ✅ Chromium (Chrome, Edge, Brave)
- ✅ Firefox
- ✅ WebKit (Safari)

### **Device Coverage:**
- ✅ Desktop (1920x1080, 1366x768)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

---

## 🔧 Playwright Configuration

E2E tests use the root `playwright.config.ts` with these key settings:

```typescript
{
  testDir: './tests',
  baseURL: 'http://localhost:3000',
  
  // Retry flaky tests once
  retries: 1,
  
  // Parallel execution for speed
  fullyParallel: true,
  
  // Capture artifacts on failure
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  
  // Test on multiple browsers
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' }
  ]
}
```

---

## 🚀 Next Steps

After completing E2E tests for frontend components:

1. **Performance Optimization:** Bundle analysis, lazy loading, code splitting
2. **CI/CD Integration:** Automated E2E tests on PR, visual regression in pipeline
3. **Advanced Accessibility:** Manual screen reader testing, WCAG 2.1 AAA compliance
4. **Production Deployment:** Full confidence with complete test coverage

---

**THE TERRAFUSION WAY: Unit → Integration → E2E - Complete Testing Pyramid!**
