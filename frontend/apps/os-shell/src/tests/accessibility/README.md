# Accessibility Compliance Suite Documentation

This directory contains comprehensive accessibility testing infrastructure for TerraFusion Quantum Research Portal ensuring WCAG 2.1 Level AA compliance.

## ♿ Accessibility Test Suites

### 1. AccessibilityCompliance.test.tsx (800 LOC)
Elite accessibility compliance suite covering WCAG 2.1 AA requirements:

**Automated Testing (axe-core)**:
- Zero accessibility violations enforcement
- WCAG 2.1 rules validation
- ARIA attributes verification
- Form accessibility validation

**Keyboard Navigation**:
- Tab/Shift+Tab sequential navigation
- Enter/Space key activation
- Ctrl+1-5 panel switching shortcuts
- Skip navigation links
- Focus trap in modals
- Focus restoration after dialog close

**Color Contrast (WCAG AA)**:
- Normal text: 4.5:1 minimum ratio
- Large text: 3.0:1 minimum ratio
- TerraFusion Design System validation:
  - Terra-cyan (#00FFFF) on Terra-midnight (#0A0E1A): ≥4.5:1 ✅
  - Terra-cyan on Terra-slate (#1E293B): ≥3.0:1 ✅
  - White (#FFFFFF) on Terra-midnight: ≥4.5:1 ✅

**Focus Management**:
- Visible focus indicators (outline, ring)
- :focus-visible support for keyboard-only
- Focus trap within modal dialogs
- Focus restoration to trigger element

**Form Accessibility**:
- Label association (htmlFor/id)
- Required field marking (aria-required)
- Error announcements (role="alert", aria-live="assertive")
- Field descriptions (aria-describedby)
- Radio/checkbox groups (fieldset/legend)

**Dynamic Content**:
- Status updates (aria-live="polite")
- Critical alerts (aria-live="assertive", aria-atomic="true")
- Loading states (aria-busy)

**Semantic HTML**:
- Proper heading hierarchy (h1-h6)
- Landmark regions (header, nav, main, aside, footer)
- Lists for navigation (ul/li)
- Unique landmark labels (aria-label)

**Image Accessibility**:
- Meaningful alt text for content images
- Empty alt ("") for decorative images
- SVG accessibility (role="img", aria-label, <title>)

### 2. ScreenReaderCompatibility.test.tsx (650 LOC)
Screen reader compatibility validation for assistive technologies:

**Supported Screen Readers**:
- NVDA (NonVisual Desktop Access) - Windows ✅
- JAWS (Job Access With Speech) - Windows ✅
- VoiceOver - macOS/iOS ✅
- TalkBack - Android ✅
- Narrator - Windows ✅

**ARIA Landmarks**:
- Main content (role="main")
- Navigation (role="navigation")
- Complementary (role="complementary", aside)
- Banner (header)
- Contentinfo (footer)
- Multiple landmark differentiation with unique labels

**Interactive Element Announcements**:
- Buttons with accessible names (aria-label)
- Links with descriptive text
- Toggle buttons with aria-pressed state
- Icon buttons (aria-label, svg aria-hidden="true")

**Form Field Announcements**:
- Labels with descriptions (label + aria-describedby)
- Validation errors (aria-invalid + role="alert")
- Radio button groups (fieldset/legend)
- Checkbox groups with proper labels

**Live Region Announcements**:
- Status updates (role="status", aria-live="polite")
- Critical alerts (role="alert", aria-live="assertive")
- Loading states (aria-busy)

**Table Accessibility**:
- Table captions for context
- Column headers (scope="col")
- Row headers (scope="row")
- Sortable tables (aria-sort)

**Dialog Accessibility**:
- Modal dialogs (role="dialog", aria-modal="true")
- Alert dialogs (role="alertdialog")
- Title and description (aria-labelledby, aria-describedby)

**Accessible Name Computation (ARIA 1.2)**:
- aria-labelledby priority
- aria-label fallback
- Associated label element
- Title attribute
- Text content

## 📊 CI/CD Integration

### accessibility-validation.yml (GitHub Actions)
Automated accessibility pipeline with 7 comprehensive jobs:

**Job 1 - Axe-Core Testing**:
- Automated WCAG 2.1 AA validation
- Zero violation enforcement
- Coverage report generation
- 30-day artifact retention

**Job 2 - Pa11y Scan**:
- WCAG2AA standard validation
- Multi-page scanning (home, research-portal, quantum-dashboard)
- CLI reporter for detailed results
- Zero threshold enforcement

**Job 3 - Color Contrast Validation**:
- TerraFusion Design System verification
- 4.5:1 minimum ratio for normal text
- 3.0:1 minimum ratio for large text
- Automated contrast report generation

**Job 4 - Keyboard Navigation Testing**:
- Tab/Shift+Tab sequential navigation
- Enter/Space activation
- Keyboard shortcuts (Ctrl+1-5)
- Skip links and focus trap validation

**Job 5 - Screen Reader Testing**:
- ARIA landmark validation
- Button/link announcement verification
- Form field label testing
- Live region functionality

**Job 6 - Lighthouse Accessibility Audit**:
- 95% minimum accessibility score
- Multi-page audit
- Artifact upload for reports

**Job 7 - Accessibility Summary**:
- Aggregated test results
- Automated PR comments with status table
- Merge blocking on failures
- Compliance standards reporting

**Triggers**:
- Pull requests to main
- Push to main
- Weekly scheduled audits (Mondays 3 AM UTC)
- Manual workflow dispatch

## 🎯 Accessibility Targets (WCAG 2.1 AA)

### Compliance Standards
- ✅ **WCAG 2.1 Level AA**: Full compliance (target 100%)
- ✅ **Section 508**: U.S. government requirement
- ✅ **ADA Title II**: Americans with Disabilities Act
- ✅ **EN 301 549**: European accessibility standard

### Performance Benchmarks
- Zero axe-core violations (automated testing)
- 95%+ Lighthouse accessibility score
- 4.5:1 minimum color contrast ratio
- 100% keyboard navigation coverage
- Universal screen reader compatibility

### WCAG 2.1 Success Criteria Coverage

**Perceivable (Principle 1)**:
- 1.1.1 Non-text Content: Alt text for images ✅
- 1.3.1 Info and Relationships: Semantic HTML + ARIA ✅
- 1.3.2 Meaningful Sequence: Logical reading order ✅
- 1.4.1 Use of Color: Not color-only communication ✅
- 1.4.3 Contrast (Minimum): 4.5:1 ratio ✅
- 1.4.11 Non-text Contrast: 3:1 for UI components ✅
- 1.4.13 Content on Hover/Focus: Dismissible, hoverable, persistent ✅

**Operable (Principle 2)**:
- 2.1.1 Keyboard: All functionality keyboard accessible ✅
- 2.1.2 No Keyboard Trap: Focus can move away ✅
- 2.4.1 Bypass Blocks: Skip navigation links ✅
- 2.4.3 Focus Order: Logical tab order ✅
- 2.4.7 Focus Visible: Visible focus indicators ✅
- 2.5.3 Label in Name: Accessible name includes visible text ✅

**Understandable (Principle 3)**:
- 3.1.1 Language of Page: lang attribute set ✅
- 3.2.1 On Focus: No context change on focus ✅
- 3.2.2 On Input: No context change on input ✅
- 3.3.1 Error Identification: Errors identified in text ✅
- 3.3.2 Labels or Instructions: Form fields labeled ✅
- 3.3.3 Error Suggestion: Error correction suggestions ✅
- 3.3.4 Error Prevention: Confirmation for important actions ✅

**Robust (Principle 4)**:
- 4.1.2 Name, Role, Value: ARIA roles and properties ✅
- 4.1.3 Status Messages: ARIA live regions ✅

## 🚀 Running Accessibility Tests

### Local Execution
```bash
# Run all accessibility tests
npm test -- --testPathPattern=accessibility

# Run specific test suite
npm test -- AccessibilityCompliance.test.tsx
npm test -- ScreenReaderCompatibility.test.tsx

# Run with coverage
npm test -- --testPathPattern=accessibility --coverage

# Run axe-core violations check
npm test -- --testPathPattern="Axe-Core"

# Run keyboard navigation tests
npm test -- --testPathPattern="Keyboard Navigation"

# Run color contrast validation
npm test -- --testPathPattern="Color Contrast"
```

### Pa11y Automated Scanning
```bash
# Install Pa11y globally
npm install -g pa11y pa11y-ci

# Scan single page
pa11y http://localhost:5173 --standard WCAG2AA

# Scan multiple pages with Pa11y-CI
pa11y-ci --config pa11y-config.json
```

### Manual Screen Reader Testing
**NVDA (Windows)**:
```
1. Download NVDA from nvaccess.org
2. Press Ctrl+Alt+N to start NVDA
3. Navigate with arrow keys, Tab, and Enter
4. Use NVDA+F7 to list landmarks
5. Use NVDA+Ctrl+F to read forms list
```

**JAWS (Windows)**:
```
1. Install JAWS from freedomscientific.com
2. Press Insert+F6 for heading list
3. Press Insert+F5 for form fields list
4. Press Insert+Ctrl+; for landmarks list
```

**VoiceOver (macOS)**:
```
1. Press Cmd+F5 to enable VoiceOver
2. Use VO+A to read page
3. Use VO+U to open rotor
4. Navigate with Tab and arrow keys
```

## 📋 Accessibility Checklist

### Pre-Deployment Validation
- [ ] Zero axe-core violations
- [ ] 95%+ Lighthouse accessibility score
- [ ] Color contrast ≥4.5:1 (normal text)
- [ ] Full keyboard navigation support
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Focus indicators visible and clear
- [ ] Form labels and error announcements
- [ ] ARIA landmarks properly labeled
- [ ] Semantic HTML structure
- [ ] Skip navigation links functional
- [ ] Modal focus trap working
- [ ] Live regions announcing correctly

### WCAG 2.1 Level AA Requirements
- [ ] All images have meaningful alt text
- [ ] Sufficient color contrast ratios
- [ ] No keyboard traps
- [ ] Visible focus indicators
- [ ] Consistent navigation
- [ ] Error identification and suggestions
- [ ] Labels and instructions for forms
- [ ] Accessible names for all interactive elements
- [ ] Status messages announced to screen readers
- [ ] Proper heading hierarchy (no skipped levels)

## 🛠️ Accessibility Tools

### Browser Extensions
- **axe DevTools** (Chrome/Firefox): Automated accessibility testing
- **WAVE** (Chrome/Firefox): Visual feedback on accessibility issues
- **Lighthouse** (Chrome DevTools): Comprehensive accessibility audit
- **Color Contrast Analyzer**: Real-time contrast ratio checking

### Screen Readers
- **NVDA** (Windows): Free and open-source screen reader
- **JAWS** (Windows): Industry-standard screen reader
- **VoiceOver** (macOS): Built-in screen reader
- **TalkBack** (Android): Mobile screen reader
- **Narrator** (Windows): Built-in Windows screen reader

### Testing Services
- **Pa11y**: Command-line accessibility testing
- **axe-core**: JavaScript accessibility testing engine
- **jest-axe**: Jest integration for axe-core
- **Lighthouse CI**: Automated Lighthouse audits in CI/CD

## 📞 Accessibility Support

For accessibility questions or concerns:
- **Email**: accessibility@terrafusion.gov
- **Accessibility Coordinator**: Dr. Sarah Johnson
- **Response SLA**: Critical issues (48h), General inquiries (1 week)
- **Feedback**: accessibility-feedback@terrafusion.gov

## 🎓 Accessibility Resources

### Standards and Guidelines
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Section 508**: https://www.section508.gov/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/

### Learning Resources
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **Deque University**: https://dequeuniversity.com/

---

**Elite Accessibility Engineering**: Championship-grade accessibility validation ensuring WCAG 2.1 Level AA compliance, universal screen reader support, and inclusive design for all PhD researchers including those with disabilities.

**Government. Transcended. Accessible.**
