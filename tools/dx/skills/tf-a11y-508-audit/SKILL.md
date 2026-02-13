---
id: tf-a11y-508-audit
name: Section 508 Accessibility Audit
version: 1.0.0
ownerLane: governance
riskLevel: read
triggers:
  - pre-pr
  - manual
  - evidence-pack
inputs:
  - component-paths
  - page-urls
outputs:
  - audit-report
  - violations-list
  - remediation-guide
dependencies:
  - tf-ui-foundation
tags: [accessibility, 508, wcag, audit, compliance, government]
---

# Section 508 Accessibility Audit

Automated WCAG 2.1 AA and Section 508 compliance auditing for TerraFusion government interfaces. Required for FISMA-HIGH compliance.

## Audit Checklist

### Perceivable (WCAG 1.x)
- [ ] **1.1.1** Non-text content has text alternatives
- [ ] **1.3.1** Info and relationships are programmatically determinable
- [ ] **1.3.2** Meaningful reading sequence is preserved
- [ ] **1.4.1** Color is not the only visual means of conveying information
- [ ] **1.4.3** Contrast ratio of at least 4.5:1 for normal text
- [ ] **1.4.4** Text can be resized up to 200% without loss of content
- [ ] **1.4.11** Non-text contrast of at least 3:1 for UI components

### Operable (WCAG 2.x)
- [ ] **2.1.1** All functionality is keyboard accessible
- [ ] **2.1.2** No keyboard traps exist
- [ ] **2.4.1** Skip navigation links are provided
- [ ] **2.4.2** Pages have descriptive titles
- [ ] **2.4.3** Focus order is logical and intuitive
- [ ] **2.4.6** Headings and labels are descriptive
- [ ] **2.4.7** Focus is visible on all interactive elements

### Understandable (WCAG 3.x)
- [ ] **3.1.1** Language of page is programmatically determinable
- [ ] **3.2.1** No unexpected context changes on focus
- [ ] **3.2.2** No unexpected context changes on input
- [ ] **3.3.1** Input errors are identified and described
- [ ] **3.3.2** Labels or instructions are provided for inputs

### Robust (WCAG 4.x)
- [ ] **4.1.1** HTML is well-formed and valid
- [ ] **4.1.2** Name, role, value are programmatically determinable
- [ ] **4.1.3** Status messages use ARIA live regions

## Government-Specific Requirements

### Section 508 (Rehabilitation Act)
- All electronic and information technology must be accessible
- Federal agencies must comply with WCAG 2.0 Level AA (minimum)
- TerraFusion targets WCAG 2.1 Level AA (exceeds requirement)

### County Government Considerations
- Property assessment interfaces must support screen readers
- Tax levy information must be perceivable without color
- GIS map interfaces require keyboard alternatives
- PDF exports must be tagged and accessible

## Usage

```bash
# Run full accessibility audit
tdc a11y audit --scope frontend

# Audit specific component
tdc a11y audit --component PropertyAssessmentTable

# Generate remediation guide
tdc a11y remediate --violations ./audit-report.json

# Check contrast ratios
tdc a11y contrast --tokens terra-midnight terra-white
```

## Integration with Evidence Pack

Accessibility audit results feed directly into the Evidence Pack:
```json
{
  "accessibility": {
    "wcag21AA": true,
    "section508": true,
    "violations": 0,
    "warnings": 2
  }
}
```
