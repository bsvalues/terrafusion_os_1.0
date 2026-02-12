# 🎯 TERRAFUSION COMPONENT ACCESSIBILITY CHECKLIST

**THE TERRAFUSION WAY: Accessibility is Non-Negotiable**

Use this checklist for every component story. Every checkbox must be ✅ before merging.

---

## 📋 WCAG 2.1 AA COMPLIANCE CHECKLIST

### ✅ Perceivable

**Visual & Content**
- [ ] **Color Contrast:** Text has 4.5:1 contrast ratio minimum (3:1 for large text 18px+)
- [ ] **Color Independence:** Information not conveyed by color alone
- [ ] **Text Sizing:** Text can be resized to 200% without loss of content or functionality
- [ ] **Images:** All images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] **Focus Indicators:** Focus visible with clear visual indicator (outline, ring, border)

**Audio & Video (if applicable)**
- [ ] **Captions:** Video has synchronized captions
- [ ] **Audio Descriptions:** Video has audio descriptions for visual content
- [ ] **Transcripts:** Audio content has text transcript available

---

### ✅ Operable

**Keyboard Navigation**
- [ ] **Keyboard Only:** All functionality available via keyboard
- [ ] **Tab Order:** Logical tab order follows visual layout
- [ ] **No Keyboard Trap:** Focus can move away from every component
- [ ] **Shortcuts:** Keyboard shortcuts documented and don't conflict
- [ ] **Skip Links:** Skip navigation links provided (for layouts)

**Touch Targets**
- [ ] **Minimum Size:** All interactive elements at least 44x44px (iOS/Android standard)
- [ ] **Adequate Spacing:** At least 8px spacing between touch targets
- [ ] **Touch Gestures:** Alternative non-gesture methods provided

**Timing**
- [ ] **Adjustable Timing:** Users can extend or disable time limits
- [ ] **Pause/Stop:** Auto-updating content can be paused, stopped, or hidden
- [ ] **No Motion Required:** Functions don't require device motion (unless essential)

---

### ✅ Understandable

**Readable**
- [ ] **Language Set:** HTML `lang` attribute set correctly
- [ ] **Language Changes:** Language changes indicated with `lang` attribute
- [ ] **Clear Labels:** Form inputs have clear, descriptive labels
- [ ] **Error Messages:** Error messages are specific and provide correction suggestions
- [ ] **Instructions:** Complex forms have clear instructions

**Predictable**
- [ ] **On Focus:** Focus doesn't automatically trigger context change
- [ ] **On Input:** Input doesn't automatically trigger context change (unless warned)
- [ ] **Consistent Navigation:** Navigation is consistent across pages
- [ ] **Consistent Identification:** Components with same function have same labels

---

### ✅ Robust

**Compatible**
- [ ] **Valid HTML:** HTML passes W3C validator (or documented exceptions)
- [ ] **Name, Role, Value:** All custom controls have proper ARIA name, role, value
- [ ] **Status Messages:** Status messages use ARIA live regions appropriately
- [ ] **Screen Reader Tested:** Works with NVDA, JAWS, VoiceOver, TalkBack

---

## 🔧 ARIA IMPLEMENTATION CHECKLIST

### ARIA Attributes (Use Sparingly - Semantic HTML First)

- [ ] **No ARIA Better Than Bad ARIA:** Use native HTML when possible
- [ ] **Valid ARIA:** All ARIA attributes are valid (no typos, proper values)
- [ ] **Required ARIA Props:** Required ARIA properties present (e.g., `aria-expanded` with `role="button"`)
- [ ] **String Values:** ARIA boolean attributes use string values (`"true"` / `"false"`)
- [ ] **Live Regions:** Dynamic content updates announced via `aria-live`, `aria-atomic`
- [ ] **Hidden Content:** Hidden content uses `aria-hidden="true"` (not just CSS)

### Common ARIA Patterns

**Buttons**
```tsx
<button
  aria-label="Clear description"  // When no visible text
  aria-pressed="true"             // Toggle buttons (string!)
  aria-disabled="true"            // Disabled state (string!)
>
```

**Inputs**
```tsx
<input
  aria-label="Search properties"      // When no <label>
  aria-describedby="input-help"       // Help text ID
  aria-required="true"                // Required field
  aria-invalid="true"                 // Validation error
  aria-errormessage="error-id"        // Error message ID
/>
```

**Modals/Dialogs**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
```

**Comboboxes/Select**
```tsx
<div role="combobox" aria-expanded="false" aria-controls="listbox-id">
  <input aria-autocomplete="list" />
</div>
```

---

## 🧪 TESTING CHECKLIST

### Automated Testing

- [ ] **axe-core:** Run in Storybook (`@storybook/addon-a11y`)
- [ ] **Lighthouse:** Accessibility score 95+ in CI
- [ ] **Pa11y:** Automated testing in pipeline
- [ ] **TypeScript:** No `any` types, strict mode enabled

### Manual Testing

**Keyboard Testing**
- [ ] **Tab Navigation:** Tab through all interactive elements
- [ ] **Enter/Space:** Activate buttons, checkboxes, links
- [ ] **Arrow Keys:** Navigate menus, select options, comboboxes
- [ ] **Escape:** Close modals, cancel actions
- [ ] **Home/End:** Jump to first/last item in lists

**Screen Reader Testing** (Test on actual devices/software)
- [ ] **NVDA (Windows):** Free, widely used
- [ ] **JAWS (Windows):** Government/enterprise standard
- [ ] **VoiceOver (macOS/iOS):** Built-in Apple screen reader
- [ ] **TalkBack (Android):** Built-in Android screen reader

**Visual Testing**
- [ ] **High Contrast Mode:** Content visible in Windows High Contrast
- [ ] **Dark Mode:** Component works in dark theme
- [ ] **Zoom:** Usable at 200% browser zoom
- [ ] **Color Blindness:** Test with color blindness simulators

---

## 📊 COMPONENT ACCESSIBILITY SCORECARD

Rate each component (use this in Storybook story):

```typescript
/**
 * Accessibility Scorecard
 * 
 * Keyboard Navigation: ⭐⭐⭐⭐⭐ (5/5)
 * Screen Reader Support: ⭐⭐⭐⭐⭐ (5/5)
 * Visual Accessibility: ⭐⭐⭐⭐⭐ (5/5)
 * Touch Accessibility: ⭐⭐⭐⭐⭐ (5/5)
 * Documentation: ⭐⭐⭐⭐⭐ (5/5)
 * 
 * Overall: ⭐⭐⭐⭐⭐ WCAG 2.1 AAA COMPLIANT
 */
```

---

## 🚨 COMMON ACCESSIBILITY MISTAKES TO AVOID

### ❌ Don't Do This

```tsx
// ❌ Missing alt text
<img src="property.jpg" />

// ❌ Boolean instead of string
<button aria-pressed={isPressed}>Toggle</button>

// ❌ Div button without ARIA
<div onClick={handleClick}>Click me</div>

// ❌ Empty button
<button><Icon /></button>

// ❌ Form without labels
<input type="text" placeholder="Name" />

// ❌ Color only indication
<span style={{ color: 'red' }}>Error</span>

// ❌ Tiny touch targets
<button className="w-2 h-2">×</button>

// ❌ Hidden content without aria-hidden
<div style={{ display: 'none' }}>Hidden</div>
```

### ✅ Do This Instead

```tsx
// ✅ Descriptive alt text
<img src="property.jpg" alt="Single-family home at 123 Main St" />

// ✅ String values for ARIA booleans
<button aria-pressed={isPressed ? "true" : "false"}>Toggle</button>

// ✅ Use actual button element
<button onClick={handleClick}>Click me</button>

// ✅ Accessible button with icon
<button aria-label="Close dialog">
  <Icon aria-hidden="true" />
</button>

// ✅ Proper form labels
<label htmlFor="name">Name</label>
<input id="name" type="text" />

// ✅ Multiple indicators
<span className="text-red-600 font-bold">
  <Icon aria-label="Error:" /> Error
</span>

// ✅ Adequate touch target
<button className="min-w-[44px] min-h-[44px]">×</button>

// ✅ Properly hidden content
<div aria-hidden="true" style={{ display: 'none' }}>Hidden</div>
```

---

## 🎓 WCAG 2.1 LEVELS EXPLAINED

### Level A (Minimum)
- Basic accessibility
- Critical for any website
- **TerraFusion Standard: NOT ACCEPTABLE (we exceed this)**

### Level AA (Required for TerraFusion)
- Enhanced accessibility
- Government/enterprise requirement
- **TerraFusion Standard: MINIMUM (our baseline)**

### Level AAA (Aspirational for TerraFusion)
- Maximum accessibility
- Difficult to achieve for all content
- **TerraFusion Standard: TARGET (where possible)**

---

## 📚 RESOURCES

### Tools
- **axe DevTools:** Browser extension for accessibility testing
- **WAVE:** Web accessibility evaluation tool
- **Color Contrast Analyzer:** Check color contrast ratios
- **NoCoffee:** Vision simulator for Chrome
- **Lighthouse:** Built into Chrome DevTools

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [The A11y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Testing Guide](https://webaim.org/articles/keyboard/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## ✅ SIGN-OFF CHECKLIST

Before marking a component story as complete:

- [ ] All automated tests pass (axe-core, Lighthouse)
- [ ] Manually tested with keyboard navigation
- [ ] Manually tested with at least 2 screen readers
- [ ] Tested at 200% zoom
- [ ] Tested in high contrast mode
- [ ] Touch targets meet 44x44px minimum
- [ ] Color contrast meets 4.5:1 minimum
- [ ] All ARIA attributes are valid and necessary
- [ ] Documentation includes accessibility notes
- [ ] Storybook story includes accessibility testing story
- [ ] Code review approved by accessibility champion
- [ ] Component added to design system documentation

---

**THE TERRAFUSION WAY:**  
*"Accessibility is not an add-on. It's the foundation of every component we build."* ♿✨
