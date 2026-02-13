---
name: tf-ui-foundation
lane: ui
riskLevel: read
triggers: ["ui tokens", "color compliance", "OKLCH audit", "design token governance"]
description: Enforces TerraFusion Quantum theme token usage - OKLCH-only
version: 1.0.0
contractVersion: 1.0.0
---

# TerraFusion UI Foundation (Token Governance)

**Status:** Operational (Phase 7 delivered 2026-02-13)  
**Owner:** UI Lane  
**Risk Level:** Read-only

## Purpose

Enforces **TerraFusion Quantum Theme** token discipline to prevent hardcoded colors, ensure OKLCH color space compliance, and maintain design system consistency across all UI components.

## Rules

✅ **PASS Criteria:**
1. All color references use CSS variables from `terra-*` token namespace
2. No hardcoded hex values (#RRGGBB), rgb(), or hsl() in component styles
3. OKLCH-ready variables (using HSL bridge pattern until OKLCH browser support stabilizes)
4. Tailwind utility classes use configured theme tokens only

❌ **FAIL Criteria:**
- Hardcoded color values: `color: #3b82f6`, `bg-[#123456]`
- Direct rgb/hsl: `color: rgb(59, 130, 246)`, `hsl(210, 100%, 50%)`
- Non-theme Tailwind classes: `text-blue-500` (use `text-terra-cyan` instead)

## TerraFusion Quantum Theme Tokens

```css
:root {
  --terra-cyan: 180 100% 70%;      /* OKLCH(80% 0.2 200) ready */
  --terra-midnight: 220 40% 10%;   /* OKLCH(15% 0.05 240) ready */
  --terra-gold: 45 100% 60%;       /* OKLCH(85% 0.15 90) ready */
  --terra-obsidian: 0 0% 5%;       /* OKLCH(5% 0 0) ready */
  --terra-silver: 0 0% 85%;        /* OKLCH(85% 0 0) ready */
}
```

## Examples

### ✅ PASS

```tsx
// CSS variables (correct)
<div className="bg-terra-midnight text-terra-cyan">
  <h1 className="text-terra-gold">Property Assessment</h1>
</div>

// Tailwind with theme tokens (correct)
<Button className="bg-terra-cyan hover:bg-terra-cyan/90">
  Submit
</Button>
```

### ❌ FAIL

```tsx
// Hardcoded hex (violation: TF_UI_001_HARDCODED_HEX)
<div style={{ backgroundColor: '#1a1a2e', color: '#16f2b3' }}>

// Hardcoded rgb (violation: TF_UI_002_HARDCODED_RGB)
<div style={{ color: 'rgb(22, 242, 179)' }}>

// Non-theme Tailwind (violation: TF_UI_003_NON_THEME_CLASS)
<div className="bg-blue-500 text-green-400">
```

## Contract Schema

**File:** `ui-token-compliance.contract.json`

```json
{
  "skillName": "tf-ui-foundation",
  "lane": "ui",
  "status": "PASS|FAIL|WARN",
  "violationsCount": 0,
  "violations": [
    {
      "code": "TF_UI_001_HARDCODED_HEX",
      "severity": "error",
      "file": "frontend/src/components/Dashboard.tsx",
      "line": 42,
      "column": 15,
      "message": "Hardcoded hex color #3b82f6 found - use --terra-cyan token",
      "suggestion": "Replace with: className='text-terra-cyan'"
    }
  ]
}
```

## TDC Command

```bash
tdc ui audit --tokens [path]
```

---

**Government. Transcended. Token-Governed.** 🏛️
