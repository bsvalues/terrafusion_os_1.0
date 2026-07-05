# WO-WB-005 — Workbench Gap Register

**Program:** PROPERTY-WORKBENCH-READINESS (step 5) · **Owner:** Claude Code · **Mode:** read-only discovery, docs/audit only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `f4cc3939` · **Method:** consolidation of the verified findings in WO-WB-001→004 (each gap traces to a cited `file:line` + the WO that surfaced it). No new claims are introduced here.

This register is the single consolidated list of gaps between the Property Workbench's current state and "ready". It feeds WO-WB-006 (first completion-slice decision) and WO-WB-008 (rollup).

**Severity key:** **S1** = blocks readiness / systemic · **S2** = meaningful, scoped · **S3** = minor / cosmetic / doc.
**Disposition key:** *integration* (forward build) · *fix* (small correction) · *decide* (operator/lane decision) · *defer*.

---

## 1. Gap register

| ID | Gap | Category | Sev | Evidence (`file:line`) | Source WO | Disposition |
|----|-----|----------|-----|------------------------|-----------|-------------|
| **G1** | **Tool layer not integrated** — 0/117 governed tools are `liveIntegration:true` (116 `stub-contract` L1, 1 `contract-covered` L2, 0 `backend-integrated`); all require the "tool layer in development" disclosure | Integration | **S1** | `tools/registry/tool-maturity.json` — census over all 117 `tools[].state`/`liveIntegration` (e.g. `route_to_parcel` L1 stub-contract, `:17-35`) | WB-004 §3 | *integration* — the primary readiness workstream |
| **G2** | **Window-adapter tab-parity gap** — the desktop window renders only 6 distinct components and aliases `clerk→Dossier`, `treasury→Dais`, `audit→Dossier`; 3 tabs have no window implementation | UI | **S2** | `PropertyWorkbenchWindow.tsx:73-83,50-67` | WB-001 §2.1 / WB-002 §1 | *decide* then *fix* — confirm intent (desktop de-scope?) then implement or document |
| **G3** | **Honesty-contract coverage is 4/9** — Summary/Forge/Atlas/Dais have `*.honesty.contract` tests; Clerk/Treasury/Audit/Dossier/Pilot do not, despite being tool-output surfaces | Test coverage | **S2** | present: `__tests__/workbench/{PropertyAtlas,PropertyDais,PropertyForge,PropertySummary}.honesty.contract.test.tsx` + `Reconciliation.honesty.contract.test.ts`; **absent** for Clerk/Treasury/Audit/Dossier/Pilot | WB-002 §4 / WB-003 §3 | *fix* — add honesty contracts for the 5 uncovered tabs |
| **G4** | **Skipped launch-surface contract test** — Phase-16 launch contract skipped since 2026-04-25 (crashed the vitest worker via `SuiteModuleGrid`); re-author recommended in-file | Test coverage | **S2** | `__tests__/shell/launchSurfaceContractParcelWorkbench.contract.test.tsx:32` (`describe.skip`), note at `:25` | WB-001 §5 | *fix* — re-author with shallow mocks |
| **G5** | **DcfPanel income stub** — the one source-level UI stub; renders an empty state pending income-approach backend endpoints | UI | **S3** | `pages/workbench/income/DcfPanel.tsx:4-10` | WB-001 §4.2 | *integration* — lands with the income tool/backend |
| **G6** | **Stale tab-count header** — `PropertyWorkbench.tsx` header comment declares 6 "locked" tabs; the code ships 9 (Clerk/Treasury/Audit added as R3 extensions) | Doc/consistency | **S3** | `PropertyWorkbench.tsx:13-20` vs `:98-108` | WB-001 §2.2 | *fix* — update the comment |
| **G7** | **Mixed sync route convention** — operator sync routes split between hyphenated (`sync-readiness`, `sync-doctrine`) and a `sync/` slash sub-namespace (`sync/quarantine`, `sync/commits`+`/:commitId`, `sync/corpus`+`/:runId`) | Consistency | **S3** | `Router.tsx:241-273` | WB-002 §3 | *decide* — Sync-lane call (intentional vs drift) |
| **G8** | **Forge sub-tabs lack a path segment** — all **6** state-based sub-tabs (`overview`/`cost`/`sales`/`income`/`reconcile`/`sketch`) are query-param deep-linkable (`?tab=`) but have no route path each | UX/routing | **S3** | `PropertyForge.tsx:50-56` (`SUB_TABS`), `:77-84,110` (`readInitialSubTab`) | WB-002 §2 | *defer* — enhancement, not a defect |

## 2. Non-gaps (verified healthy — recorded so they are not re-litigated)

These were checked and are **not** gaps; listing them prevents future re-work:

- **No mock/fabricated data anywhere in a default build.** Domain data is live-by-default (gated `snapshot`/`fixtures` behind `VITE_ALLOW_NON_LIVE_MODE=1`); tool data is stub-but-disclosed; UI renders `unavailable`/preloaded-store, never fabrications (WB-004 §2,§4).
- **Route-path entry is complete and honest.** All 9 tabs routed + enabled; host-integrity contract forbids "Coming soon" placeholders (WB-002 §1, WB-001 §5).
- **Idle honesty is uniform.** `WorkbenchSourceBadge` + `unavailable`-at-idle enforced where honesty contracts exist; the shared "evidence unavailable" blocker protects the rest (WB-001 §4.1, WB-003 §3).

## 3. Open decisions (not gaps — operator/lane calls)

- **D1 — Sync operator surfaces in scope?** The 5 `workbench/sync…` operator surfaces are a distinct Sync-ops lane, not parcel tabs. Whether they belong in "Property Workbench readiness" is an operator call (WB-001 §7, WB-002 §3). *Default: out of primary scope.*
- **D2 — Window-adapter aliasing intent (G2).** Is the Clerk/Treasury/Audit aliasing a deliberate desktop-mode de-scope or an unfinished port? Determines whether G2 is *fix* or *document* (WB-003 §5).

## 4. Gap summary by category

| Category | Gaps | Notes |
|----------|------|-------|
| Integration | G1 (S1), G5 (S3) | the systemic readiness driver + one dependent UI stub |
| UI | G2 (S2) | window-adapter parity |
| Test coverage | G3 (S2), G4 (S2) | honesty coverage + the skipped launch test |
| Consistency / doc | G6 (S3), G7 (S3) | header + route naming |
| UX / routing | G8 (S3) | Forge sub-tab paths |

**One S1, three S2, four S3.** The single S1 (**G1 — 0/117 tools integrated**) dominates the readiness picture; the S2s are the highest-value non-integration fixes. This ranking is the basis for WO-WB-006's first-completion-slice decision.

**STOP_TYPE:** `WB_GAP_REGISTER_COMPLETE`
