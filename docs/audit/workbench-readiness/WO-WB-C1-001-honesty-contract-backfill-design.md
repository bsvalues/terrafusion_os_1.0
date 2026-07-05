# WO-WB-C1-001 — Honesty-Contract Backfill Design / Scope Correction

**Program:** WORKBENCH-HONESTY-CONTRACT-BACKFILL (revised C1) · **Owner:** Claude Code · **Mode:** DESIGN / docs-only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `0ba65618` · **Method:** first-hand reads of the proven honesty-contract template + the 5 candidate tab components, cited by file/path with line numbers where quoted, plus `git grep` evidence.

> **Write-surface authorization.** `docs/audit/**` sits outside the repo-root `AGENTS.md` "CORE GOVERNANCE SURFACE (ALLOWED SCOPE)", which states *"Anything outside this scope requires explicit authorization."* The operator explicitly authorized `docs/audit/workbench-readiness/` for this program; no core-governance or component code is touched by this WO.

This design WO records a **scope correction** discovered while planning C1: the original goal — backfill honesty-contract tests for the 5 uncovered tabs to reach 9/9 — is **not achievable tests-only**, because **none** of the 5 renders the honesty instrumentation the contract asserts *at idle*. Four (Clerk/Treasury/Audit/Pilot) render no `WorkbenchSourceBadge` at all; the fifth (Dossier) renders badges only **after a tool invocation** (`correlationId`-gated, hardcoded `source='live'`) — never an idle `unavailable` badge. So the revised **tests-only** target is **4/9 → 4/9** (no tab is addable tests-only); **all five** uncovered tabs require a separate, explicitly-authorized instrumentation lane.

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

Reading each component (`git grep WorkbenchSourceBadge origin/main -- frontend/apps/os-shell/src/pages/workbench/**`):

| Tab | Renders `WorkbenchSourceBadge`? | Renders an **idle `unavailable`** badge (what the Dais contract asserts)? | Has honesty-contract test? |
|-----|-------------------------------|--------------------------------|----------------------------|
| Summary | ✅ | ✅ | ✅ `PropertySummary.honesty.contract.test.tsx` |
| Forge | ✅ | ✅ | ✅ `PropertyForge.honesty.contract.test.tsx` |
| Atlas | ✅ | ✅ | ✅ `PropertyAtlas.honesty.contract.test.tsx` |
| Dais | ✅ | ✅ | ✅ `PropertyDais.honesty.contract.test.tsx` |
| **Dossier** | ⚠️ conditional | ❌ — badges are **post-invocation only**, `correlationId`-gated + hardcoded `source='live'` (`PropertyDossier.tsx:755,793,800`); root `data-testid='property-dossier-tab'` | ❌ **none** |
| **Clerk** | ❌ 0 refs (`PropertyClerk.tsx`) | ❌ | ❌ |
| **Treasury** | ❌ 0 refs (`PropertyTreasury.tsx`) | ❌ | ❌ |
| **Audit** | ❌ 0 refs (`PropertyAudit.tsx`) | ❌ | ❌ |
| **Pilot** | ❌ 0 refs (`PropertyPilot.tsx`) | ❌ | ❌ |

- **Renders any source badge: 5/9** (Summary, Forge, Atlas, Dais, Dossier).
- **Renders an idle `unavailable` badge (the testable honesty invariant): 4/9** (Summary, Forge, Atlas, Dais).
- **Honesty-contract test coverage: 4/9** (the same four).

Clerk/Treasury/Audit render **no** container `data-testid` and **no** badge; they rely on the shared `ParcelContextHeader` + `InvocationHistory` + the workbench-wide "evidence unavailable" blocker for honesty — but not per-element source badges. Pilot renders `property-pilot-tab` / `pilot-muse-scope` testids but likewise **no** source badge. **Dossier** renders badges (`PropertyDossier.tsx:755,793,800`) but each is inside a `correlationId && …` guard and hardcoded `source='live'` — so at idle (no invocation) it renders **no** badge, and it never renders `unavailable`.

## 3. The finding — an *instrumentation* gap, not a *test* gap

- **No tab among the 5 is tests-only viable** for a Dais-style *idle* honesty contract:
  - **Clerk / Treasury / Audit / Pilot** render **no** source badge at all — assertions 1–4 fail; making them pass needs badge/disclosure instrumentation added to the components.
  - **Dossier** renders badges, but only **post-invocation** (`correlationId`-gated, `source='live'`); at idle it renders **no** badge and never `unavailable` — so the idle assertions (1–2) fail too. Making them pass needs an **idle disclosure badge** added to the component.
- In every case, passing the contract requires a **runtime/component change** — outside a tests-only backfill.

Therefore the honesty-coverage gap (readiness audit **G3**) is really an **instrumentation gap**: the 5 tab components are not instrumented for an **idle** per-element source disclosure. This also **refines WO-WB-003**, which implied uniform per-element source-badge disclosure across surfaces — the *idle unavailable* badge holds for 4 of 9 tabs, not all 9 (Dossier's badges are post-invocation only). (It does **not** contradict WO-WB-004's "no mock" verdict: these tabs are still honest via the shared header + evidence blocker; they simply lack per-element idle badges.)

## 4. Revised scope

| | Original C1 | Revised C1 (this program) |
|---|---|---|
| Target | 4/9 → 9/9, tests-only | **4/9 → 4/9, tests-only (no net test tab addable)** |
| Deliverable | 5 tab tests | **0 tab tests** — the design finding itself is the deliverable |
| Out of scope | — | **all 5** (Clerk/Treasury/Audit/Pilot/Dossier) idle-badge instrumentation → separate WO |

- **WO-WB-C1-002** (Dossier test) **stops per its own rule** — *"Stop if the Dossier test cannot be made to pass without component changes."* It cannot: Dossier has no idle `unavailable` badge, so a Dais-style idle test fails without adding one. Recorded, not executed.
- **WO-WB-C1-003** rolls up C1 and emits a candidate packet for the follow-on **WORKBENCH-HONESTY-INSTRUMENTATION** program covering **all 5** tabs (Clerk/Treasury/Audit/Pilot need a full badge; Dossier needs an *idle* badge added to its existing post-invocation ones) — real frontend implementation requiring its own explicit authorization.

## 5. Why all five are *deferred*, not done here

Adding idle source-badge/disclosure UI to these tabs is **frontend implementation**, not a tests-only backfill. Per the C1 boundary (tests-only; copy-only component changes at most) and the stop rule *"a tab cannot be tested without changing runtime behavior"*, all five are correctly **out of this program** and belong to a separately-authorized lane. Dossier is the *smallest* of the five (it already has the badge component + a root testid; it needs only an idle-state badge), so it is the natural first target of that lane.

## 6. Validation

- `git diff --check` — clean.
- docs/audit scope check — only `docs/audit/workbench-readiness/**` touched.
- **no** runtime/frontend/backend/tool-registry changes.

**STOP_TYPE:** `WB_C1_DESIGN_SCOPE_CORRECTION_COMPLETE`
