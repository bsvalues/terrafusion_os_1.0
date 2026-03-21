# Vitest Skip Baseline — Ratified 2026-03-21

**Sealed at commit**: `0099d44e2`
**Suite state**: 6190 / 6190 passing · 222 skipped
**Enforcement**: `tools/registry/check-skip-ceiling.mjs` (ceiling = 222)
**CI gate**: `ci.yml → vitest-full-suite → "Enforce skip ceiling"` step

---

## What this document is

This is the ratified skip floor for the TerraFusion OS frontend test suite.
`222` is a **governed allowance**, not mystery debt.
CI will fail if any PR adds new skips beyond this count or introduces an
unclassified skip (i.e., a file not listed in `check-skip-ceiling.mjs`).

To raise the ceiling you must:
1. Land a checkpoint commit that updates `SKIP_CEILING` in the script
2. Update this document with rationale
3. The commit message must include `[skip-ceiling: NNN]`

---

## How we got here

| Checkpoint | Passing | Skipped | Commit |
|---|---|---|---|
| Phase 17.5c green | 4 911 | — | prior session |
| Pre-stabilization lane | 6 186 | 226 | prior session |
| Launcher ranking fix + 2 un-skips | 6 188 | 224 | `6082eda9e` |
| DesktopErrorBoundary 2 un-skips | 6 190 | 222 | `0099d44e2` |

---

## Classified skip inventory (222 total)

### [jsdom] — CSS layout / scroll / focus cannot be simulated (≈116 skips)

JSDOM does not run a CSS engine or layout engine. Tests that assert computed
styles, scroll position, element focus triggered by CSS, or visual viewport
measurements will always fail in JSDOM regardless of product correctness.

**Affected files:**
- `src/components/ui/aspect-ratio.test.tsx` — 10 skips (container interactions, a11y)
- `src/components/ui/button.test.tsx` — 1 skip (ref forwarding, React 18 limitation)
- `src/components/ui/calendar.test.tsx` — 35 skips (react-day-picker renders no DOM in jsdom)
- `src/components/ui/dialog.test.tsx` — 5 skips (overlay selector, scroll lock, aria-modal timing)
- `src/components/ui/dropdown-menu.test.tsx` — 3 skips
- `src/components/ui/label.test.tsx` — 1 skip (label-click-focus not simulated)
- `src/components/ui/menubar.test.tsx` — 6 skips (keyboard nav in portalled menu)
- `src/components/ui/navigation-menu.test.tsx` — 13 skips (hover, portal, animation)
- `src/components/ui/popover.test.tsx` — 1 skip
- `src/components/ui/scroll-area.test.tsx` — 14 skips (scrollbar, scroll events)
- `src/components/ui/select.test.tsx` — 16 skips (Radix Select portal interactions)
- `src/components/ui/sheet.test.tsx` — 5 skips (focus trap)
- `src/components/ui/slider.test.tsx` — 7 skips (multi-thumb, a11y)
- `src/components/ui/sonner.test.tsx` — 8 skips (toast timing)
- `src/components/ui/toast.test.tsx` — 5 skips (toast timing)
- `src/components/ui/tooltip.test.tsx` — 3 skips (hover/unhover)
- `src/tests/switch.test.tsx` — 3 skips (Radix hidden-input form integration)
- `src/shell/desktop/Desktop.altTab.test.tsx` — 2 skips (ref-gated keyup commit/cancel)
- `src/tests/ErrorBoundary.test.tsx` — 5 skips (flaky async, import.meta.env.DEV)
- `src/__tests__/integration/dialog-workflows.integration.test.tsx` — 1 skip
- `src/__tests__/integration/navigation-workflows.integration.test.tsx` — 1 skip

**Resolution path**: Move to Playwright browser tests or mock CSS engine.
Do NOT attempt to zero these from within jsdom.

---

### [async] — Async timing / flaky (≈9 skips)

Tests that have race conditions between React state updates, timers, or
third-party async callbacks that are inherently non-deterministic in test
environments.

**Affected files:**
- `src/__tests__/smoke/gpt-studio-smoke.test.tsx` — 1 skip (GPT list load timing)
- Overlaps with [jsdom] toast/sonner files above

---

### [missing] — Feature not yet implemented (≈3 skips)

TDD-style "write the exam before the course" tests gating unbuilt features.

**Affected files:**
- `src/__tests__/costforge/EnhancedCostCalculator.test.tsx` — 1 skip
- `src/__tests__/desktop/CommandHistory.test.tsx` — 1 skip (Ctrl+K palette)
- `src/__tests__/EmergencyEliteQuantumInterface.test.tsx` — 1 skip

**Resolution path**: Implement the feature, then un-skip.

---

### [msw] — MSW TextEncoder polyfill not available (≈5 skips)

Mock Service Worker requires `TextEncoder` which is not available in this
Vitest environment configuration.

**Affected files:**
- `src/tests/integration/APIServices.integration.test.tsx` — 1 skip (stub)
- `src/tests/integration/AuthenticationFlow.integration.test.tsx` — 1 skip (stub)
- `src/tests/integration/CountyEmployeeWorkspace.integration.test.tsx` — 1 skip (stub)
- `src/tests/integration/ResearchPortal.integration.test.tsx` — 1 skip (stub)
- `src/tests/security/SecurityAudit.test.tsx` — 1 skip (stub)

**Resolution path**: Add `TextEncoder` polyfill in `vitest.setup.ts`, then expand stubs.

---

### [backend] — Requires running backend services (≈2 skips)

Tests that make real HTTP calls to .NET API / PACS SQL Server.

**Affected files:**
- `src/tests/integration/SystemIntegration.e2e.test.tsx` — 1 skip
- `src/tests/integration/EliteIntegrationTestSuite.test.ts` — 1 skip

**Resolution path**: Run in a service-backed CI lane with live backend.

---

### [ph] — Placeholder / "exam before course" TDD stubs (≈14 skips)

Phase 29 live-streaming tests written before `useSystemGptAtlasLive` is
wired. Bodies are `expect(true).toBe(true)`. Un-skipping would not add
meaningful coverage.

**Affected files:**
- `src/features/gpt/components/__tests__/SystemGptAtlasPanel.test.tsx` — 14 skips
  (C2.1 connection state, C2.2 county health, C2.3 live metrics, C2.4 alerts, C2.5 merge)

**Resolution path**: Implement `useSystemGptAtlasLive` hook wiring, then replace
bodies with real assertions before un-skipping.

---

## Governance rules going forward

1. **No new skips without a category tag** — every `it.skip` or `describe.skip`
   must have a `// Skip: [category] reason` comment on the line above.
2. **No ceiling raise without a checkpoint** — update `SKIP_CEILING` only in a
   commit tagged `[skip-ceiling: NNN]` with this doc updated.
3. **Improvements are free** — reducing skip count never needs approval.
4. **Browser/integration lane is the right fix** — do not re-engineer jsdom to
   simulate CSS; move tests to the correct environment instead.
