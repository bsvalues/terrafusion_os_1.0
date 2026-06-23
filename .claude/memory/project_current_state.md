---
type: project
title: TerraFusion OS — Current State Snapshot
updated: 2026-06-14
branch: claude/terrafusion-home-screen-6la5b3
pr: bsvalues/terrafusion_os_1.0#995
---

# TerraFusion OS — Current State Snapshot (Claude Code Handoff)

## Stopped at
PR #995 (Pulse truth layer + gated `TerraFusionHome` renderer) is green on tip
`1c8dcd4df` and in its final intended scope; working tree is clean and the last
several CI/webhook events were confirmed as superseded-run noise, not regressions.

## What is true now
- **HEAD = `1c8dcd4df`** ("Harden daisService scopeQuery: reject non-finite/non-positive taxYear"), working tree **clean** (no uncommitted files, no stash).
- **CI is passing on the current SHA**: run `27485745275` reported 11/13 jobs passed (Vitest merge gate ✅, Backend .NET ✅, Frontend Build ✅, Quality Gate ✅, Warning Gate ✅, UI Token Contract ✅); only Build & Package + Seal Gate were finishing. The two earlier Seal Gate/SEAL "failures" were on the prior SHA `5e716496d` (run `27485546256`) — GitHub cancelling the superseded commit's run, not a real failure.
- **Branch**: `claude/terrafusion-home-screen-6la5b3`. PR #995 remains a **draft** (per standing instruction — do not mark ready without explicit go).
- **No git tags** exist in this repo checkout.
- **Academy is owned by main #996** (canonical). This PR's duplicate `AcademyHome`/`common/TeachMeWhyPanel` and the `/academy` route were deleted in `5e716496d` to avoid the duplicate-build failure.

## Active variables
- **PR #995 is draft, awaiting "mark ready" decision.** CI is green; the only open items are CodeRabbit *advisory* (non-gating) suggestions: PR-description template + docstring coverage ≥80%. Neither blocks merge.
- **Webhook subscription** to PR #995 is active; recurring CodeRabbit/Seal-Gate-supersession noise should be treated as no-action.
- **Deferred follow-ups (user-prioritized, NOT started — require explicit go):**
  1. Pulse Explanation Contract (the "Why" layer; bridges to Academy via `TeachMeWhyPanel`).
  2. Live Home route behind a feature flag (wire `TerraFusionHome` to a real route).
  3. Third Pulse provider (after the first two land).
  - Also mentioned: a "Pulse Source Review" constitutional check.

## Pulse truth layer — what shipped (the trust pattern)
governed source → guarded provider → `PulseRead<T>` contract → read layer/aggregator → gated renderer.
- `frontend/apps/os-shell/src/contracts/pulseHome.ts` — `PulseRead<T>` union (`live`+source | `unavailable`+reason | `loading`), constructors/guards, `PulseHomeSnapshot`.
- `services/pulse/pulseHomeService.ts` — `getPulseHomeSnapshot(countyId, rollYear, options?)`, unavailable-safe.
- `services/pulse/providers/certificationPulseProvider.ts` — first real source (DAIS cert status), scope-guarded, rejects 0/0.
- `services/pulse/providers/appealsPulseProvider.ts` — second source (DAIS appeals), scope-guarded.
- `services/pulse/pulseFunctionSummary.ts` — no condition-borrowing aggregation.
- `services/suites/daisService.ts` — `DaisQueryScope{countyId?,taxYear?}` + `scopeQuery` (taxYear validated finite & >0).
- `pages/TerraFusionHome.tsx` — pure `render(snapshot)`, gated (no route), honest unavailable/loading fallbacks.
- `__tests__/governance/pulseHonestyGuard.contract.test.ts` — CI fails on fabricated live data (sample/demo/mock/count:0/etc.).
- `docs/prototypes/terrafusion_home_county_nerve_center.html` — design reference only.

## Doctrine (do not violate)
- **No fabricated live county data**; no live datum without source attribution; no count outside a live read.
- **`StageZeroState` is proof-sealed — zero diff.** Do not replace or edit it.
- Inline `style={{ color: 'hsl(var(--tf-*)) }}` is the sanctioned token pattern (passes UI Token Contract gate); `tracking-[...]` arbitrary classes are banned → use `tracking-widest`.
- No new routes/desktop icons/launcher entries without explicit safe approval.

## Next smallest step
Confirm with the user whether to **mark PR #995 ready for review** (CI is green on `1c8dcd4df`) — that is the single gating decision before any deferred follow-up begins.

## Risks not yet handled
- CI builds the PR-merge ref, so **main divergence can break this PR even with no new commits** — if main moves, re-check #995's merge-ref build before declaring green.
- The Windows memory path in the `save-state` skill (`C:\Users\bsval\...`) does not exist in this remote Linux container; this snapshot was written to `.claude/memory/project_current_state.md` instead. Reconcile if running locally.
- Deferred follow-ups are sequenced; starting the Live Home route before the Pulse Explanation Contract would invert the user's stated priority.
