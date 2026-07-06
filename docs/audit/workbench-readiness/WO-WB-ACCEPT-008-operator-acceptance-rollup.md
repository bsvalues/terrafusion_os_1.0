# WO-WB-ACCEPT-008 — Operator Acceptance Evidence Rollup + Next Lane Decision

**Goal:** GOAL-TF-WB-OPERATOR-ACCEPTANCE-001 — Property Workbench Operator Acceptance Proof
**WO:** WO-WB-ACCEPT-008 — Evidence Rollup + Next Lane Decision
**Category:** Documentation (closure)
**Status:** COMPLETE — Workbench operator acceptance proven for frontend operability + honesty; backend/tool integration explicitly excluded

---

## 1. WOs completed

| WO | Deliverable | PR | Commit |
|----|-------------|-----|--------|
| ACCEPT-001 | Operator acceptance scope | #1230 | `a58c2484` |
| ACCEPT-002 | Operator journey matrix | #1230 | `a58c2484` |
| ACCEPT-003 | Route-host acceptance | (verified — no new test) | — |
| ACCEPT-004 | Window-host real-surface acceptance test | #1231 | `b1854b23` |
| ACCEPT-005 | Role / deep-link acceptance | (verified — no new test) | — |
| ACCEPT-006 | Honest blocked-state acceptance | (verified — no new test) | — |
| ACCEPT-007 | Operator acceptance runbook | (this PR) | — |
| ACCEPT-008 | this rollup | (this PR) | — |

## 2. What the Workbench is accepted for (proven)

- **9/9 real tab surfaces in the route host** — `workbenchRealHosting.gate.test.tsx` (Forge/Atlas/Dais + Dossier/Pilot +
  Clerk/Treasury/Audit) + Summary's own tests.
- **9/9 real components mapped + rendered in the window host** — `PropertyWorkbenchWindow.tabMapping.test.tsx` (mapping)
  **and** `PropertyWorkbenchWindow.realSurfaces.acceptance.test.tsx` (ACCEPT-004 — real Clerk/Treasury/Audit render
  end-to-end inside the actual window).
- **Deep-link / role-hidden safety** — role-hidden deep-launch still opens the real tab (no blank workbench).
- **Honest disclosure** — `live`/`unavailable` badges only; slice-aware provenance; no "AI-powered"; hard property-
  evidence blocker on auth failure (`PropertyWorkbench.productionSmoke.test.tsx`).

## 3. Tests added / verified

- **Added (1, the only genuine gap):** `PropertyWorkbenchWindow.realSurfaces.acceptance.test.tsx` — real Clerk/Treasury/
  Audit rendered inside the actual window host end-to-end.
- **Verified sufficient (no new test — anti-manufacturing):** route-host 9/9 (real-hosting gate + Summary tests),
  window mapping (tabMapping), role/deep-link (tabMapping role-hidden), blocked-state (productionSmoke + honesty
  contracts). ACCEPT-003/005/006 are documented "covered by existing tests" findings.

## 4. Validation

Both PRs green on required contexts; ACCEPT-004 passed **Frontend Gate + Vitest Full Suite** (the real components render
in the window with accurate mocks — invokeTool/getEnv shapes matched to source per review). All review threads verified +
resolved; `git diff --check` clean; scope = `__tests__/workbench/**` + `docs/audit/workbench-readiness/**`; no `--admin` /
break-glass / hook bypass.

## 5. Review corrections

- **copilot (#1231):** the acceptance-test `invokeTool`/`getEnv` mocks didn't match the real contracts; corrected to
  `{ success, correlationId, result: { output } }` and `{ DEV, PROD, MODE }` (verified in `pilotApi.ts` / `runtime/env.ts`).
  (The C-tabs don't invoke on mount, so the pass was unaffected — but accurate mocks avoid misleading shapes.)

## 6. What remains UNACCEPTED (out of scope, not claimed)

- **G1 — 0/117 governed tools backend-integrated.** The tool layer is contract/stub, disclosed as "in development." No
  live tool execution, TerraPilot live behavior, PACS-backed workflow, or county-production behavior is accepted or
  claimed.
- No backend/tool-registry/API/route/deploy work was done.

## 7. Next lane decision

Per the recommendation bias — **Codex Backend OE is still active** (#1226) — **PARK the Workbench**. The frontend
operator-acceptance surface is now complete (readiness → honesty → provenance → G2 → parity → acceptance). The remaining
Workbench value (real tool execution) is **G1**, which is the **Codex/backend/TerraPilot** lane, not Claude Code's.

**Recommended next goal:** park; any next Claude lane is ratified through the Brain/operator path (this program's queue
artifacts are inputs, not authority). Options if the owner wants more: A (park — default), B (escalate G1 to Codex), D
(role/deep-link product-decision packet). Do **not** start tool-integration readiness before Backend OE closes.

## 8. Non-goals (explicit)

No backend integration; no tool-registry promotion; no route/window architecture change; no Sync work; no deployment; no
Codex Backend OE overlap; G1 remains separate.
