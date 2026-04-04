# TerraFusion OS — Copilot Execution Plan
# Visual DNA Restoration: Tier 1 → Tier 3
# Source of truth: .claude/plans/expressive-chasing-hare.md (48% compliance audit)
# Revision date: 2026-03-30 — Scene Agent separated into Wave 2B per structural review

---

## MANDATORY RULES (all waves)

- Forbidden files (NEVER touch): `backend/**`, `**/auth/**`, Atlas canvas/Leaflet work, `frontend/src/**` (legacy root), unplanned orchestration files
- After EVERY wave: run `git diff --name-only HEAD` and verify only planned files appear
- If type-check fails after a wave: STOP. Do not proceed to next wave.
- If vitest shows new failures after a wave: STOP. Investigate before continuing.

---

## WAVE 1 — Visual DNA Plumbing (parallel, no dependencies)

**Gate:** `pnpm run type-check` + `git diff --name-only HEAD` matches expected files only.

### Agent 1A — Token Agent
**File:** `frontend/apps/os-shell/src/styles/terrafusion-tokens.css`

| Token | Before | After | Source |
|-------|--------|-------|--------|
| `--tf-surface-dark-hs` | `222 47%` | `222 25%` | Engineering Certainty PDF: hsl(222 25% 7%) |
| `--tf-transcend-cyan-hs` | `180 100%` | `190 100%` | Audit: +10° hue shift toward teal |
| `--tf-success-hs` | `152 100%` | `135 90%` | Audit: spec hsl(135 90% 55%) |
| `--tf-quantum-cyan` lightness | `var(--tf-l-50)` | `var(--tf-l-60)` | Spec: 60% lightness |
| `--tf-bg` | `225 44% 7%` | `222 25% 7%` | Engineering PDF: plane-color |
| `--tf-surface-2` | `225 29% 11%` | `222 29% 11%` | Hue alignment |
| `--tf-accent` | `180 100% 50%` | `190 100% 60%` | Spec: hsl(190 100% 60%) |
| `--tf-success` | `152 100% 50%` | `135 90% 55%` | Spec: hsl(135 90% 55%) |
| `--tf-warning` | `40 100% 50%` | `40 100% 60%` | Spec: hsl(40 100% 60%) |
| `--glass-bg` | `hsl(var(--tf-surface-2) / 0.6)` | `hsl(210 20% 98% / 0.10)` | Spec glass-2 tint |
| `--glass-bg-light` | `hsl(var(--tf-surface) / 0.5)` | `hsl(210 20% 98% / 0.06)` | Spec glass-1 tint |
| `--glass-bg-heavy` | (missing) | `hsl(210 20% 98% / 0.14)` | Spec glass-3 tint, new token |
| dark-mode `--glass-bg` | `hsl(var(--tf-bg) / 0.5)` | `hsl(210 20% 98% / 0.10)` | Align with spec |
| `@keyframes squishIn` | (missing) | `from scale(1) to scale(0.96)` | Engineering PDF tailwind screenshot |

**Forbidden for this agent:** physics changes, glow removals, font changes, any .tsx/.ts changes.

---

### Agent 1B — Physics Agent
**File:** `frontend/apps/os-shell/src/ui/materials/TactileButton.tsx`
**File:** `frontend/apps/os-shell/src/ui/materials/tactile-button.css`

| Value | Before | After | Source |
|-------|--------|-------|--------|
| `SPRING_CONFIG.damping` | `30` | `10` | Engineering PDF code slide: "Spring: 400 stiffness, 10 damping" |
| `SPRING_CONFIG.mass` | (missing) | `0.6` | Engineering PDF: "mass: 0.6" |
| `TAP_SCALE` | `0.97` | `0.96` | squishIn target scale alignment |

squishIn CSS wiring to add in `tactile-button.css` (non-spring fallback path only):
```css
/* squishIn — fires on CSS path (reduced-motion). Spring path handled by framer-motion. */
[data-material="tactile"][data-reduced-motion="true"]:active:not(:disabled) {
  animation: squishIn 120ms ease-out forwards;
}
```

**Forbidden for this agent:** token changes, glow removals, font changes.

---

### Agent 1C — Cleanup Agent
**File:** `frontend/apps/os-shell/src/styles/terrafusion-os.css`

Remove decorative cyan glow (box-shadow) from 3 non-signal elements:

| Selector | Line (approx) | Remove |
|----------|---------------|--------|
| `.terrafusion-os-header:hover` | ~113 | `box-shadow: var(--shadow-quantum);` |
| `.terrafusion-nav-button.active` | ~236 | `box-shadow: var(--shadow-quantum);` |
| `.terrafusion-view-toggle:hover` | ~236 | `box-shadow: 0 10px 25px hsl(var(--tf-transcend-cyan-hs) var(--tf-l-50) / 0.3);` |

Rule: Neon is a signal, not a theme. Only Sentinel system health uses neon glow.

**Forbidden for this agent:** token changes, physics changes, font changes.

---

### Wave 1 Expected `git diff --name-only` Output
```
frontend/apps/os-shell/src/styles/terrafusion-tokens.css
frontend/apps/os-shell/src/ui/materials/TactileButton.tsx
frontend/apps/os-shell/src/ui/materials/tactile-button.css
frontend/apps/os-shell/src/styles/terrafusion-os.css
```
Any file outside this set = scope violation. STOP.

---

## WAVE 2 — Design System Plumbing (parallel, after Wave 1 gate passes)

**Gate:** `pnpm run type-check` + `npx vitest run` (no new failures) + `git diff --name-only HEAD` matches expected files only.

### Agent 2A — Font Agent

**Goal:** Load Switzer Regular + Editorial New Italic; remove Inter as primary font.

**Font sources:**
- Switzer: https://www.fontshare.com/fonts/switzer (free, download WOFF2 weights 400/500/600/700)
- Editorial New: https://www.fontshare.com/fonts/editorial-new (free, download WOFF2 italic 400)

**Files:**
```
frontend/apps/os-shell/public/fonts/switzer/          ← new WOFF2 files
frontend/apps/os-shell/public/fonts/editorial-new/   ← new WOFF2 files
frontend/apps/os-shell/src/styles/terrafusion-tokens.css  ← @font-face + --font-primary
frontend/apps/os-shell/src/styles/globals.css              ← remove Google Fonts import, update font-family
frontend/apps/os-shell/src/App.css                         ← update font-family
```

**Required changes:**
1. Add `@font-face` blocks for Switzer (400/500/600/700) in `terrafusion-tokens.css`
2. Add `@font-face` block for Editorial New Italic (400) in `terrafusion-tokens.css`
3. Update `--font-primary` to `'Switzer', 'Segoe UI', system-ui, sans-serif`
4. Update `--font-secondary` to `'Switzer', system-ui, sans-serif`
5. Add `--font-accent: 'Editorial New', serif` (new token)
6. Remove `@import url('https://fonts.googleapis.com/css2?family=Inter...')` from `globals.css`
7. Update `body { font-family: }` in `globals.css` to reference `--font-primary`
8. Update `App.css` SF Pro Display / Inter fallback chain

**Forbidden for this agent:** ANY backend files, auth, Atlas, scene store, token color changes.

---

### Agent 2B — Config Agent

**Goal:** Wire `tailwind.config.js` to CSS vars; remove hardcoded hex values (anti-pattern per spec).

**File:** `frontend/apps/os-shell/tailwind.config.js` (or `.ts`)

**Required changes:**
```js
// BEFORE (anti-pattern — spec explicitly marks ❌)
'terra-cyan': '#00FFFF'

// AFTER (spec pattern — references CSS var)  
'terra-cyan': 'hsl(var(--tf-accent) / <alpha-value>)'
```

Apply to all hardcoded hex color values in `theme.extend.colors`. Map each to its correct CSS var:

| Tailwind key | Before | After |
|--------------|--------|-------|
| `terra-cyan` | hardcoded hex | `hsl(var(--tf-accent) / <alpha-value>)` |
| `terra-midnight` | hardcoded hex | `hsl(var(--tf-bg) / <alpha-value>)` |
| `terra-blue` | hardcoded hex | `hsl(var(--tf-accent-2) / <alpha-value>)` |
| Other hardcoded hex entries | hardcoded hex | appropriate CSS var |

**Forbidden for this agent:** ANY backend files, font files, scene store, token color CSS changes.

---

### Wave 2 Expected `git diff --name-only` Output
```
frontend/apps/os-shell/public/fonts/switzer/          (new files)
frontend/apps/os-shell/public/fonts/editorial-new/   (new files)
frontend/apps/os-shell/src/styles/terrafusion-tokens.css
frontend/apps/os-shell/src/styles/globals.css
frontend/apps/os-shell/src/App.css
frontend/apps/os-shell/tailwind.config.js             (or .ts)
```
Any file outside this set = scope violation. STOP.

---

## WAVE 2B — Behavioral Layer (sequential — after Wave 2 gates pass)

**Separated from Wave 2 because:** Scene Agent changes behavior/orchestration and has higher regression risk than font/config plumbing. A behavioral break must not block visual-system improvements.

**Gate:** `pnpm run type-check` + `npx vitest run` (no new failures, scene tests explicitly pass) + `git diff --name-only HEAD` matches expected files only.

### Agent 2B-1 — Scene Agent

**Goal:** Add 3 missing canonical scenes to `sceneStore.ts`.

**File:** `frontend/apps/os-shell/src/stores/sceneStore.ts`

Missing scenes per Engineering Certainty PDF:
1. `calibration-run` — Calibration Run scene
   - Window composition (from PDF): Ratio Study + Model Tuning + Validation Output
2. `time-adjustment` — Time Adjustment Cockpit
   - Window composition (from PDF): Sales Timeline + Adjustment Matrix + Compliance Check
3. `drift-warning` — Drift Warning Cockpit  
   - Window composition (from PDF): Drift Monitor + QA Checklist + Governance Alerts (PDF: "Certification Scene: QA Checklist + Drift Warnings + Governance")

**Constraints:**
- Scene IDs must match the `SceneId` type definition exactly (add to union if needed)
- Each scene must follow existing `CanonicalScene` shape in the store
- Must not change existing scene definitions
- Must not change orchestration, activation, or routing logic
- Scene tests must still pass after addition

**Forbidden for this agent:** ANY backend files, auth, Atlas, token/CSS changes, routing changes.

---

### Wave 2B Expected `git diff --name-only` Output
```
frontend/apps/os-shell/src/stores/sceneStore.ts
```
If `SceneId` is defined in a types file, also:
```
frontend/apps/os-shell/src/types/scene.ts   (or wherever SceneId is defined)
```
Any file outside this set = scope violation. STOP.

---

## WAVE 3 — Proof Layer + Surface Cleanup (parallel, after Wave 2B gate passes)

**Gate:** `pnpm run type-check` + `npx vitest run` (no new failures) + `git diff --name-only HEAD` matches expected files only.

### Agent 3A — Receipt Agent

**Goal:** Create `ModelReceipt` as a standalone UI material component; wire it into `DefensePacket.tsx`.

**New file:** `frontend/apps/os-shell/src/components/dais/ModelReceipt.tsx`

Required shape (per spec: "Model Receipts" in Proof Layer):
```tsx
interface ModelReceiptProps {
  modelId: string;
  modelName: string;
  trainedAt: string;
  accuracy?: number;
  sampleSize?: number;
  overrideCount?: number;
  exportUrl?: string;
}
```

**Existing file to update:** `frontend/apps/os-shell/src/pages/dais/DefensePacket.tsx`
- Wire `<ModelReceipt>` into the defense packet output where model data is already available
- Do not change the backend call, narrative service, or audit trail

**Forbidden for this agent:** backend files, auth, scene store, token/CSS changes, routing changes.

---

### Agent 3B — Glass Agent

**Goal:** Remove LiquidPanel from 3 data-surface violations.

**Files with violations:**

| File | Violation | Fix |
|------|-----------|-----|
| `PropertyWorkbench.tsx` | LiquidPanel wrapping data table | Replace with plain `<div className="tf-panel">` or equivalent non-glass wrapper |
| `CanonHome.tsx` | LiquidPanel on IDE editor surface | Replace with plain panel |
| `PropertyWorkbenchWindow.tsx` | LiquidPanel as data wrapper | Replace with plain panel |

Spec rule: "Never use Liquid Glass for dense data walls, grids, or ratio study sheets."

**Forbidden for this agent:** backend files, auth, font/token changes, scene store, ModelReceipt changes.

---

### Wave 3 Expected `git diff --name-only` Output
```
frontend/apps/os-shell/src/components/dais/ModelReceipt.tsx  (new)
frontend/apps/os-shell/src/pages/dais/DefensePacket.tsx
frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx
frontend/apps/os-shell/src/pages/canon/CanonHome.tsx
frontend/apps/os-shell/src/ui/window/PropertyWorkbenchWindow.tsx  (or similar path)
```
Any file outside this set = scope violation. STOP.

---

## POST-ALL-WAVES COMMIT CHECKLIST

Before committing final state:
- [ ] `pnpm run type-check` passes
- [ ] `npx vitest run` passes (no new failures vs. 12/12 baseline)
- [ ] TDC ratchet: `pnpm run ui:token-check` at or below 790 violations
- [ ] `git diff --name-only HEAD` confirms only planned files
- [ ] No backend, auth, or Atlas Leaflet files in diff
- [ ] Commit message includes wave-level evidence summary

---

## REVISION HISTORY

| Date | Change |
|------|--------|
| 2026-03-30 | Initial plan created with Wave 1/2/3 structure |
| 2026-03-30 | Structural revision: Scene Agent moved from Wave 2 → Wave 2B (separate gate). Mandatory diff gate added after every wave. |
