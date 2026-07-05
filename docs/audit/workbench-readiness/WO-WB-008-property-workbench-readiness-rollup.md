# WO-WB-008 — Property Workbench Readiness Rollup

**Program:** PROPERTY-WORKBENCH-READINESS (step 8 / closeout) · **Owner:** Claude Code · **Mode:** evidence rollup, docs-only
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `a096631a`

> **Write-surface authorization.** `docs/audit/**` sits outside the repo-root `AGENTS.md` "CORE GOVERNANCE SURFACE (ALLOWED SCOPE)", which states *"Anything outside this scope requires explicit authorization."* The operator explicitly authorized `docs/audit/workbench-readiness/` for this read-only program; no core-governance or code path was touched by any WO.

Program closeout. This read-only discovery program produced a truth baseline for the Property Workbench and a decision on the first completion slice — with **zero** runtime/frontend/backend/test/registry changes.

---

## 1. Completed Work Orders

| WO | Deliverable | PR | Merge commit |
|----|-------------|----|--------------|
| WO-WB-001 | Current-state audit | #1192 | `85c101a6` |
| WO-WB-002 | Route/tab reality matrix | #1193 | `1e10b59a` |
| WO-WB-003 | Suite surface classification | #1194 | `77269a65` |
| WO-WB-004 | Mock/live/stub provenance audit (census) | #1195 | `f4cc3939` |
| WO-WB-005 | Workbench gap register | #1196 | `8c02c220` |
| WO-WB-006 | First-completion-slice decision packet | #1197 | `e2e2f4d8` |
| WO-WB-007 | Operator playbook | #1198 | `a096631a` |
| WO-WB-008 | This rollup | (this WO) | — |

All eight deliverables live under `docs/audit/workbench-readiness/`.

## 2. What the program established (the truth baseline)

1. **The Property Workbench is a mature, honest-by-construction surface** — 9 routed suite tabs, deep Forge sub-surface, 53-test suite (honesty contracts, host-integrity, write-lane/trace gates), and a structural refusal to fabricate data (source badges, `unavailable`-at-idle, evidence-unavailable blocker). Not a skeleton.
2. **The readiness gap is integration, not UI.** The governed-tool layer is **0/117 backend-integrated** (116 `stub-contract` L1, 1 `contract-covered` L2; all `liveIntegration:false`, all `disclosureRequired`). Runtime data flows through three channels — domain-data (live-by-default, gated `snapshot`/`fixtures`), direct-`/api/*`, and governed tools (pre-integration, disclosed "in development"). **No mock surface exists in a default build.**
3. **A concrete gap set** — 8 gaps (WO-WB-005): **1 S1** (G1 tool integration), **3 S2** (G2 window-adapter aliasing, G3 honesty-contract coverage 4/9, G4 skipped launch test), **4 S3** (DcfPanel stub, stale tab header, mixed sync routes, Forge sub-tab paths). Plus verified non-gaps and two open operator decisions (sync-surface scope; window-aliasing intent).

## 3. The decision (WO-WB-006)

- **Recommended first completion slice: C1 — honesty-contract backfill** for the 5 uncovered tabs (Clerk/Treasury/Audit/Dossier/Pilot). High value, near-zero risk (tests only), unblocked, in-frontend-lane; hardens honesty coverage to all 9 tabs **before** the tool-integration wave lands.
- **Strategic priority (separate lane): G1 tool integration** — promote tools `stub-contract` → `backend-integrated`, starting from the single L2 (`summarize_levy_rate_components`). This is **backend work = Codex's Backend Operational Excellence lane**, not the frontend readiness lane.

## 4. What this program did NOT do (by design)

- **No implementation.** Every WO was read-only discovery + docs; nothing in the workbench, tests, registry, backend, or config was changed. Any completion slice needs a **separate, explicitly-authorized implementation WO**.
- **No backend scope.** Tool→backend integration (the S1) is out of this frontend program; flagged for Codex.
- **No Sync-lane decision.** The 5 `workbench/sync…` operator surfaces are recorded but treated as out-of-primary-scope pending an operator call (decision D1).

## 5. Method + quality note

- Every claim is anchored to `origin/main` and cited `file:line`; counts (the tool-maturity census) were **computed** from the registry files, not estimated.
- **Adversarial review materially improved accuracy.** The repo's CI review (codex + CodeRabbit + Copilot) caught several of the auditor's initial over-claims and extrapolations — the route-vs-window tab-parity gap, the C-tabs being store-preload hybrids, the gated non-live data modes, the third `/api/*` channel, contract-covered ≠ live, Forge = 6 sub-tabs, and exact sync route paths — each verified first-hand and corrected before merge. The merged audits reflect those corrections; this rollup supersedes any earlier-draft wording that conflicts with them.
- **Merge discipline:** every PR passed the full required-CI matrix and `required_conversation_resolution` legitimately (author-resolved after addressing); **no `--admin` break-glass** was used.

## 6. Remaining owner-gated items

- **G1 tool integration** — backend-coordinated program (Codex); the true readiness driver.
- **Decision D1** — are the sync operator surfaces in Property Workbench scope?
- **Decision D2** — is the window-adapter Clerk/Treasury/Audit aliasing a deliberate desktop de-scope or an unfinished port? (Determines whether G2 is *fix* or *document*.)
- **The frontend completion slices** — C1 (recommended) then C2/C3/C5, each a separate authorized WO.

## 7. Next recommended lane (operator's choice)

| Option | Meaning |
|--------|---------|
| **A** | Authorize **C1** (honesty-contract backfill) as the first frontend implementation WO (**recommended**) |
| B | Escalate **G1 tool integration** to Codex as the strategic priority |
| C | Resolve decisions **D1/D2** to unblock scope + G2 |
| D | Pause Property Workbench; pivot to another lane |

## 8. Program status

**PROPERTY-WORKBENCH-READINESS is complete and closed.** The workbench now has a cited, adversarially-reviewed truth baseline (state → routes → classification → provenance), a ranked gap register, a first-slice decision, and an operator playbook — all read-only, all merged, no code touched. The path to "ready" is documented and quantified: **integrate the tool layer (0/117 today) under an already-honest UI**, closing a small set of scoped gaps along the way.

**STOP_TYPE:** `WB_READINESS_ROLLUP_COMPLETE`
