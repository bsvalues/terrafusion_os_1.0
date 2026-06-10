# WO-0016 — Dock/Top-Bar Deep Sweep + G2 Module-ID Alignment (evidence)

**Date:** 2026-06-10 · **Sweep verdict: 403/408 green; 2 failures, both classified, neither mine. G2 verdict: MISALIGNED (new D-017).**

## Batch results
`npx vitest run apps/os-shell/src/__tests__/shell apps/os-shell/src/__tests__/launcher apps/os-shell/src/__tests__/desktop/DesktopLaunchSmoke.test.tsx`
→ **Test files 34 passed / 2 failed / 3 skipped (39) · Tests 403 passed / 2 failed / 3 skipped (408)**, 117s. Launcher batch (behavior/materials/pins/ranking/recents/routing) fully green; DesktopLaunchSmoke green; shell batch green except the two below.

## Failure classification
1. **`shellTruthAudit.contract.test.ts` › "TerraForge suite entry does not present unfinished surfaces as Benton operations" — KNOWN = D-013, FLEET lane, unchanged.** Fails fast at the pinned prose `toContain('TerraFusion DB/API-backed Benton proof path')` (test line 83); ForgeSuiteHome (fleet DO-NOT-EDIT, last touched by today's `9dc2ff5cb` IncomeForge re-promote) still has `'Benton Runtime Pilot'` and still lacks the proof-path phrase. All four not-contains overclaim assertions still PASS — line 840's "recommended next tool for the Benton Runtime Pilot" is a NEAR-MISS of the banned "recommended next tool for Benton County" (different ending; honesty intent intact, worth fleet awareness).
2. **`workbenchHostIntegrity.contract.test.ts` › "PropertyWorkbench is wrapped in error boundary or suspense pattern" — STALE CONTRACT (D-011 family), components LIVE.** The test greps `PropertyWorkbench.tsx` (thin delegator, 0 ErrorBoundary/Suspense hits) but the boundary lives in `PropertyWorkbenchSurface.tsx` (5 hits) post-consolidation. Phase-16 intent (no white-screen) is alive at the Surface. Same retarget pattern as WO-0008; NOT retargeted here (WO non-goal) → D-018 (P3, test lane).

## G2: registry keys ↔ shell moduleIds — MISALIGNED (D-017, P2)
Three namespaces, zero overlap where it matters:
- **Registry keys** (platform.json `ports`, now seeded by WO-0014): api, frontend, shell, desktop, levy, trends, consciousness, postgres, redis
- **AppFrame moduleIds** in code: costforge, gis-pro, legislative-pulse, property-tax-ai, terra-flow, terra-insight, **terra-levy**, terra-miner, terra-permit, terra-sync
- **generatedModules ids**: costforge-ai, terraforge, terra-levy, … (a third naming scheme)

`AppFrame.resolveTarget()` looks up `registry.Services[moduleId]` → `terra-levy` ≠ `levy`, `costforge` ∉ registry, etc. → every native-app frame resolves `notFound` even with seeding fixed. Additionally seeded entries carry no `ShellRoute` field and `Status: "stopped"`, so both resolution branches dead-end. **Conclusion: D-015 fixed plumbing; the naming contract was never defined.** Canonical-6 workbench tabs are unaffected (in-shell components, not AppFrame iframes) — severity P2 not P1.

## Disposition
- Gate recorded substantially CLEAN for dock/top-bar/launcher truth (403/408; both failures known/classified, fleet or test-lane).
- D-017 (P2, Shell+Build): define the moduleId↔service-key naming contract (alias map in platform.json, mapping in AppFrame, or key rename) — own WO, naming-contract decision → operator/architect.
- D-018 (P3, test lane): retarget host-integrity boundary assertion at the Surface (WO-0008 pattern).
- D-013 stays fleet-lane; near-miss prose noted for their next ForgeSuiteHome pass.
