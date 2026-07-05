# WO-WB-C1-001 — Honesty-Contract Backfill Design / Scope Correction

**Program:** WORKBENCH-HONESTY-CONTRACT-BACKFILL (revised C1) · **Owner:** Claude Code · **Mode:** DESIGN / docs-only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `0ba65618` · **Method:** first-hand reads of the proven honesty-contract template + the 5 candidate tab components; cited `file:line`.

> **Write-surface authorization.** `docs/audit/**` sits outside the repo-root `AGENTS.md` "CORE GOVERNANCE SURFACE (ALLOWED SCOPE)", which states *"Anything outside this scope requires explicit authorization."* The operator explicitly authorized `docs/audit/workbench-readiness/` for this program; no core-governance or component code is touched by this WO.

This design WO records a **scope correction** discovered while planning C1: the original goal — backfill honesty-contract tests for the 5 uncovered tabs to reach 9/9 — is **not achievable tests-only**, because 4 of the 5 lack the honesty *instrumentation* the contract asserts. The revised, in-boundary target is **4/9 → 5/9** (Dossier only); the remaining 4 tabs require a separate implementation lane.

---

## 1. The proven template

`PropertyDais.honesty.contract.test.tsx` is the reference honesty contract (archetype-C tab). It asserts, at idle and without user action:

1. a disclosure box carries a `WorkbenchSourceBadge` (`data-testid="workbench-source-badge"`);
2. that badge shows `data-source="unavailable"` (no premature live claim);
3. all badges are `unavailable` or `live` (never a synthetic claim);
4. the subtitle uses **governed-tool disclosure wording** (`/requested via|returned from/`), not aspirational language;
5. it contains **no** `AI-powered` language;
6. **no** tool (`invokeTool`) fires on mount.

Assertions 1–4 are **positive** — they require the component to *render* source-badge instrumentation. That is the crux of the scope correction.

## 2. Instrumentation vs test coverage (the two different counts)

Reading each component (`git grep WorkbenchSourceBadge origin/main -- pages/workbench/**`):

| Tab | Renders `WorkbenchSourceBadge`? | Has honesty-contract test? |
|-----|-------------------------------|----------------------------|
| Summary | ✅ | ✅ `PropertySummary.honesty.contract.test.tsx` |
| Forge | ✅ | ✅ `PropertyForge.honesty.contract.test.tsx` |
| Atlas | ✅ | ✅ `PropertyAtlas.honesty.contract.test.tsx` |
| Dais | ✅ | ✅ `PropertyDais.honesty.contract.test.tsx` |
| **Dossier** | ✅ (4 refs; root `data-testid='property-dossier-tab'`, `PropertyDossier.tsx`) | ❌ **none** |
| **Clerk** | ❌ **0 refs** (`PropertyClerk.tsx`) | ❌ |
| **Treasury** | ❌ **0 refs** (`PropertyTreasury.tsx`) | ❌ |
| **Audit** | ❌ **0 refs** (`PropertyAudit.tsx`) | ❌ |
| **Pilot** | ❌ **0 refs** (`PropertyPilot.tsx`) | ❌ |

- **Badge instrumentation: 5/9** (Summary, Forge, Atlas, Dais, Dossier).
- **Honesty-contract test coverage: 4/9** (the same minus Dossier).

Clerk/Treasury/Audit render **no** container `data-testid` and **no** badge; they rely on the shared `ParcelContextHeader` + `InvocationHistory` + the workbench-wide "evidence unavailable" blocker for honesty — but not per-element source badges. Pilot renders `property-pilot-tab` / `pilot-muse-scope` testids but likewise **no** source badge.

## 3. The finding — an *instrumentation* gap, not a *test* gap

- **Dossier is tests-only viable.** It already renders source badges and a root testid, so a Dais-style honesty contract can be written for it **without touching component code**.
- **Clerk / Treasury / Audit / Pilot are not tests-only viable.** A Dais-style test would *fail* (assertions 1–4) because these components render no source badge. Making it pass requires **adding `WorkbenchSourceBadge` + disclosure boxes + testids to the components** — a runtime/component change, outside a tests-only backfill.

Therefore the honesty-coverage gap (readiness audit **G3**) is really an **instrumentation gap**: those 4 tab components are not yet instrumented for per-element source disclosure. This also **refines WO-WB-003**, which implied uniform per-element source-badge disclosure across surfaces — that holds for 5 of 9 tabs, not all 9. (It does **not** contradict WO-WB-004's "no mock" verdict: these tabs are still honest via the shared header + evidence blocker; they simply lack per-element badges.)

## 4. Revised scope

| | Original C1 | Revised C1 (this program) |
|---|---|---|
| Target | 4/9 → 9/9, tests-only | **4/9 → 5/9, tests-only** |
| Deliverable | 5 tab tests | **1 tab test (Dossier)** |
| Out of scope | — | Clerk/Treasury/Audit/Pilot instrumentation → separate WO |

- **WO-WB-C1-002** adds the Dossier honesty-contract test (tests-only; authorized because Dossier is already instrumented).
- **WO-WB-C1-003** rolls up C1 and emits a candidate packet for the follow-on **WORKBENCH-HONESTY-INSTRUMENTATION** program (Clerk/Treasury/Audit/Pilot) — which is real frontend implementation and requires its own explicit authorization.

## 5. Why the four are *deferred*, not done here

Adding source-badge/disclosure UI to Clerk/Treasury/Audit/Pilot is **frontend implementation**, not a tests-only backfill. Per the C1 boundary (tests-only; copy-only component changes at most) and the stop rule *"a tab cannot be tested without changing runtime behavior"*, those four are correctly **out of this program** and belong to a separately-authorized lane.

## 6. Validation

- `git diff --check` — clean.
- docs/audit scope check — only `docs/audit/workbench-readiness/**` touched.
- **no** runtime/frontend/backend/tool-registry changes.

**STOP_TYPE:** `WB_C1_DESIGN_SCOPE_CORRECTION_COMPLETE`
