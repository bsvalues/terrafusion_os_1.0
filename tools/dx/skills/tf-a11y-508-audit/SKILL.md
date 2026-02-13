---
name: tf-a11y-508-audit
lane: ui
riskLevel: read
triggers: ["accessibility audit", "WCAG 2.1 AA", "Section 508", "a11y compliance", "keyboard navigation", "screen reader", "aria labels"]
description: Validates WCAG 2.1 AA + Section 508 compliance
version: 1.0.0
contractVersion: 1.0.0
---

# TerraFusion Accessibility Audit (WCAG 2.1 AA + Section 508)

**Status:** Operational (Phase 7 delivered 2026-02-13)  
**Owner:** UI Lane + Compliance Lane  
**Risk Level:** Read-only  
**Compliance:** Government mandated (WCAG 2.1 AA + Section 508)

## Purpose

Ensures TerraFusion OS meets **WCAG 2.1 Level AA** and **Section 508** accessibility standards required for government software. Non-negotiable for county deployment.

## Critical Rules

### 1. **Accessible Names (WCAG 4.1.2)**

✅ **PASS:**
```tsx
<button aria-label="Save property assessment">
  <IconSave />
</button>

<img src="logo.png" alt="Benton County logo" />

<input type="text" id="parcel" />
<label htmlFor="parcel">Parcel ID</label>
```

❌ **FAIL:**
```tsx
<button><IconSave /></button>  {/* Missing aria-label */}
<img src="logo.png" />          {/* Missing alt text */}
<input type="text" />           {/* No associated label */}
```

### 2. **Keyboard Navigation (WCAG 2.1.1)**

✅ **PASS:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>  {/* Keyboard accessible */}
  </DialogTrigger>
  <DialogContent onEscapeKeyDown={() => setIsOpen(false)}>
    {/* Escape key closes dialog */}
  </DialogContent>
</Dialog>
```

❌ **FAIL:**
```tsx
<div onClick={handleClick}>Click me</div>  {/* Not keyboard accessible */}
<dialog>...</dialog>  {/* No Escape key handler */}
```

### 3. **Form Validation (WCAG 3.3.1, 3.3.3)**

✅ **PASS:**
```tsx
<Form>
  <FormField>
    <FormLabel htmlFor="ssn">SSN</FormLabel>
    <FormControl>
      <Input
        id="ssn"
        aria-invalid={!!errors.ssn}
        aria-describedby={errors.ssn ? "ssn-error" : undefined}
      />
    </FormControl>
    {errors.ssn && (
      <FormMessage id="ssn-error" role="alert">
        {errors.ssn.message}
      </FormMessage>
    )}
  </FormField>
</Form>
```

❌ **FAIL:**
```tsx
<input />  {/* No error announcements */}
{error && <span>{error}</span>}  {/* No role="alert" */}
```

### 4. **Dialog Focus Management (WCAG 2.4.3)**

✅ **PASS:**
```tsx
// Using Radix Dialog (auto-handles focus trap)
<Dialog>
  <DialogContent>
    <DialogTitle>Confirm Delete</DialogTitle>
    <DialogClose>Cancel</DialogClose>
  </DialogContent>
</Dialog>
```

❌ **FAIL:**
```tsx
// Custom modal without focus trap
<div className="modal">
  <h2>Confirm Delete</h2>
  {/* Focus escapes modal, keyboard nav breaks */}
</div>
```

### 5. **Data Tables (Section 508 §1194.22(g))**

✅ **PASS:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Parcel ID</TableHead>
      <TableHead>Owner</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>12345</TableCell>
      <TableCell>John Doe</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

❌ **FAIL:**
```tsx
<div className="table">  {/* Not semantic table */}
  <div className="row">12345 | John Doe</div>
</div>
```

## Violation Codes

| Code | Description | Severity |
|------|-------------|----------|
| `TF_A11Y_001_NO_ALT_TEXT` | Image missing alt attribute | error |
| `TF_A11Y_002_NO_LABEL` | Form input without associated label | error |
| `TF_A11Y_003_NO_ARIA_LABEL` | Icon button missing aria-label | error |
| `TF_A11Y_004_CLICK_DIV` | div with onClick (not keyboard accessible) | error |
| `TF_A11Y_005_NO_ESC_HANDLER` | Dialog missing Escape key handler | error |
| `TF_A11Y_006_NO_ARIA_INVALID` | Form input missing aria-invalid | warning |
| `TF_A11Y_007_NO_ROLE_ALERT` | Error message missing role="alert" | error |
| `TF_A11Y_008_NON_SEMANTIC_TABLE` | Data table using divs instead of <table> | error |

## Contract Schema

**File:** `ui-a11y-508.contract.json`

```json
{
  "skillName": "tf-a11y-508-audit",
  "lane": "ui",
  "status": "FAIL",
  "violationsCount": 3,
  "violations": [
    {
      "code": "TF_A11Y_001_NO_ALT_TEXT",
      "severity": "error",
      "file": "frontend/src/components/Header.tsx",
      "line": 15,
      "wcagCriterion": "1.1.1",
      "section508": "§1194.22(a)",
      "message": "Image missing alt attribute",
      "suggestion": "Add alt='Benton County logo'"
    }
  ]
}
```

## TDC Command

```bash
tdc ui audit --a11y [path]
```

---

**Government. Transcended. Accessible.** 🏛️
