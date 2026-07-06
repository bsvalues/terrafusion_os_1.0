# WO-WB-G2-005 — Window Aliasing Evidence Rollup + Next Lane Decision

**Goal:** GOAL-TF-WB-G2-WINDOW-ALIASING-001 — Workbench Window Adapter Aliasing Decision
**WO:** WO-WB-G2-005 — Evidence Rollup + Next Lane Decision
**Category:** Documentation (closure)
**Status:** COMPLETE — G2 resolved to a cited decision + future-implementation playbook (no code changed)

---

## 1. WOs completed

| WO | Deliverable |
|----|-------------|
| G2-001 | `WO-WB-G2-001-route-vs-window-truth-audit.md` — route path = 9/9 real; window aliases clerk/treasury/audit → Dossier/Dais/Dossier |
| G2-002 | `WO-WB-G2-002-window-aliasing-impact-matrix.md` — misleading-surface, low blast radius, trivially fixable |
| G2-003 | `WO-WB-G2-003-window-aliasing-decision-packet.md` — **DECISION: Option D** (mount the real components) |
| G2-004 | `WO-WB-G2-004-window-aliasing-implementation-playbook.md` — future lane spec (not executed) |
| G2-005 | this rollup |

## 2. Decision

- **DECISION:** **D** — re-point the window `TAB_COMPONENTS` (`PropertyWorkbenchWindow.tsx:73-83`) for
  `clerk`/`treasury`/`audit` at the real `PropertyClerk`/`PropertyTreasury`/`PropertyAudit` components.
- **IMPLEMENTATION_REQUIRED:** yes — small, frontend-only (3 imports + 3 map lines + a window-mapping test). **Not**
  executed in this decision-only goal.
- **Root cause:** the alias is **stale/vestigial** — it predates the real Clerk/Treasury/Audit components (built during
  the Workbench readiness + honesty programs) and was never re-pointed. It is not a compatibility constraint: the real
  components mount under the window's `WorkbenchTabCtx` via `useWorkbenchTab`'s dual-source read.

## 3. Evidence (first-hand, cited)

- Route children render real components: `Router.tsx:217-226` (clerk/treasury/audit → PropertyClerk/Treasury/Audit).
- Window aliases + omits real imports: `PropertyWorkbenchWindow.tsx:73-83` (map) and `:50-67` (imports — Clerk/Treasury/
  Audit absent; grep = 0).
- Window-compatibility: `context/workbenchTabContext.tsx:77-84` (dual-source), `PropertyWorkbenchWindow.tsx:919`
  (`WorkbenchTabCtx.Provider`).
- Alias not pinned by tests: `PropertyWorkbenchWindow.segmentContext.test.tsx` uses a local `TAB_COMPONENTS` copy and does
  not assert the production alias.

## 4. Validation

Docs-only across all five WOs: `git diff --check` clean; scope limited to `docs/audit/workbench-readiness/**`; required
branch-protection contexts green; review threads resolved; no `--admin` / no break-glass. **No frontend/route/window/
backend/registry code touched** in this goal.

## 5. Risks remaining

- The mislabel persists in the desktop-window host **until Option D is implemented** in a future lane. Blast radius is
  limited to window-hosted Clerk/Treasury/Audit; the route path is unaffected and honest.
- Live traffic split (route vs window) was not measured (out of docs-only scope) — it affects *urgency*, not the
  *decision*.

## 6. Should Workbench stay parked? Should Codex Backend OE remain priority?

- **Yes — Workbench stays parked** pending Codex Backend OE, per the standing operator decision. This G2 loop was the
  authorized *decision-only* exception (read-only + docs), and it is now closed.
- **Yes — Codex Backend OE remains the priority.** G1 (0/117 tool backend integration) is unchanged and remains the
  Codex/backend/TerraPilot lane. This goal did not touch it.
- **Option D is Backend-OE-independent**, so when the owner wants a quick honest win it can be scheduled as a small
  standalone frontend PR (per WO-WB-G2-004) without waiting for Codex — but only under explicit authorization, since
  Workbench is otherwise paused.

## 7. Recommended next lane

1. **Default (posture-consistent):** keep Workbench paused; let Codex close Backend OE.
2. **If a quick honest win is wanted:** authorize the WO-WB-G2-004 implementation lane (single-file window map re-point +
   test) — low risk, no Codex dependency.
3. **Do not** start route/window-aliasing implementation without this decision packet (now satisfied) + explicit
   authorization.

## 8. Non-goals (explicitly NOT done)

No backend integration; no tool-registry promotion; no route/window aliasing **implementation** (decision + playbook
only); no component changes; no PACS/county data; no deployment. **G1 0/117 tool backend integration remains separate.**
