# WO-WB-C1-003 — C1 Honesty-Contract Backfill Rollup

**Program:** WORKBENCH-HONESTY-CONTRACT-BACKFILL (revised C1) — closeout · **Owner:** Claude Code · **Mode:** docs-only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `7dc9825e`

> **Write-surface authorization.** `docs/audit/**` sits outside the repo-root `AGENTS.md` "CORE GOVERNANCE SURFACE (ALLOWED SCOPE)", which states *"Anything outside this scope requires explicit authorization."* The operator explicitly authorized `docs/audit/workbench-readiness/` for this program; no core-governance or component code is touched.

Closes the revised tests-only C1. **Net outcome: 0 test tabs added; honesty-contract coverage stays 4/9** — because no uncovered tab renders the idle `unavailable` source badge the honesty contract asserts. The value delivered is the **corrected truth** and a scoped hand-off to a frontend implementation lane.

---

## 1. Completed / recorded WOs

| WO | Outcome | PR | Commit |
|----|---------|----|--------|
| WO-WB-C1-001 | Design / scope correction — merged | #1200 | `7dc9825e` |
| WO-WB-C1-002 | Dossier honesty-contract test — **STOPPED per rule** (not executed) | — | — |
| WO-WB-C1-003 | This rollup + instrumentation packet | (this WO) | — |

**Why C1-002 stopped:** its explicit rule was *"Stop if the Dossier test cannot be made to pass without component changes."* It cannot — Dossier's only badges are post-invocation (`correlationId`-gated, `source='live'`, `PropertyDossier.tsx:755,793,800`); at idle it renders no badge and never `unavailable`, so a Dais-style idle honesty test fails without adding an idle badge. No test was written.

## 2. What the tests-only C1 established

- **Honesty-contract test coverage is 4/9** (Summary, Forge, Atlas, Dais) and **stays 4/9** after this program — nothing was tests-only-addable.
- The gap is an **instrumentation gap, not a test gap** (WO-WB-C1-001): the 5 uncovered tabs lack an **idle** per-element source badge:
  - Clerk / Treasury / Audit / Pilot render **no** `WorkbenchSourceBadge` at all;
  - Dossier renders badges **only post-invocation** (`source='live'`), never at idle / `unavailable`.
- This **refines** WO-WB-003 (uniform per-element source-badge disclosure holds for 4 of 9 tabs at idle, not all 9) and does **not** contradict WO-WB-004's no-mock verdict (the tabs are still honest via the shared `ParcelContextHeader` + `InvocationHistory` + the workbench-wide evidence blocker).

## 3. Files created (whole revised C1)

- `docs/audit/workbench-readiness/WO-WB-C1-001-honesty-contract-backfill-design.md`
- `docs/audit/workbench-readiness/WO-WB-C1-003-honesty-contract-backfill-rollup.md` (this doc)
- `docs/audit/workbench-readiness/WO-WB-INSTRUMENTATION-001-candidate-packet.md` (the hand-off)

**Zero** component/test/registry/backend changes across the entire revised C1. No `--admin` break-glass.

## 4. The correct next lane

Getting to 9/9 honesty coverage requires **frontend implementation** — adding idle source-badge/disclosure instrumentation to the 5 tabs, then their tests. That is captured as a candidate packet for a new, separately-authorized program:

> **`WORKBENCH-HONESTY-INSTRUMENTATION`** — see `WO-WB-INSTRUMENTATION-001-candidate-packet.md`.

Recommended ordering (smallest-risk first): **Dossier** (already has the badge component + a root testid — needs only an idle-state badge) → Pilot (has testids) → Clerk → Treasury → Audit.

## 5. Amendment to the readiness gap register (WO-WB-005)

Gap **G3** should be read as an **instrumentation** gap, not a test gap: *"5 tabs lack an idle per-element source badge (4 have no badge; Dossier's are post-invocation only); honesty-contract tests can only follow that instrumentation."* The tests-only path is exhausted; the remaining work is the instrumentation program.

## 6. Validation

- `git diff --check` — clean.
- docs/audit scope check — only `docs/audit/workbench-readiness/**` touched.
- **no** runtime/frontend/backend/tool-registry changes.

**STOP_TYPE:** `WB_C1_ROLLUP_COMPLETE`
