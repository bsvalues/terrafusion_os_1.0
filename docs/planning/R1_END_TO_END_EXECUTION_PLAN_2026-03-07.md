# R1 End-to-End Completion Plan

Date: March 7, 2026
Baseline branch: `r1/integration`
Purpose: turn the current "governed spine is real, data cutover is partial" state into a fully evidenced end-to-end R1 release, then define the next sequence needed to get the suites fully real beyond R1.

## Ground Rules

- Source of truth for current status is [PROGRESS_TRUTH_LEDGER.md](/C:/Users/bsval/terrafusion_os_1.0/docs/PROGRESS_TRUTH_LEDGER.md).
- Frozen contracts remain authoritative:
  - [R1_DAY0_CONTRACTS.md](/C:/Users/bsval/terrafusion_os_1.0/docs/R1_DAY0_CONTRACTS.md)
  - [INVOKE_CONTRACT.md](/C:/Users/bsval/terrafusion_os_1.0/tools/registry/INVOKE_CONTRACT.md)
  - [ROLE_VOCABULARY.md](/C:/Users/bsval/terrafusion_os_1.0/os-platform/core/types/ROLE_VOCABULARY.md)
- No new PACS-tab action wiring is in scope for this plan. PACS stays as-is unless separately authorized.
- "Done" means code merged, gates passing, acceptance exercised through the governed path, and evidence captured with correlation IDs.
- "Partial" means code exists but a production path still falls back, remains mock-labeled, or lacks end-to-end proof.

## North Star

R1 is only complete when all of the following are true:

- At least 5 tools run from UI through `POST /pilot/invoke` to real backend logic and back to the UI with trace evidence.
- Forge no longer depends on client-side calculator logic or `localStorage` for production valuation flows.
- Atlas and Dossier workbench tabs use real backend data for their active production paths.
- Core governance gates remain green.
- Fake-path elimination is proven in targeted production surfaces.
- AC-1 through AC-11 are executed and recorded with evidence.

## Current Baseline

### Real now

- Governed invoke/trace surface in [PilotController.ts](/C:/Users/bsval/terrafusion_os_1.0/os-platform/core/api/PilotController.ts)
- Real handler registration in [handlers.real.ts](/C:/Users/bsval/terrafusion_os_1.0/os-platform/core/pilot/handlers.real.ts)
- File-backed trace durability in [TraceStore.ts](/C:/Users/bsval/terrafusion_os_1.0/os-platform/core/trace/TraceStore.ts)
- Atlas and Dossier backend controllers with county isolation
- Execution Console, Evidence Rail, Context Ribbon, Policy Guard, Risk Confirmation modal
- Freshly passing gates: `type-check`, `phase83`, `phase85`, `phase86`

### Partial now

- Forge service cutover
- Dossier frontend completion
- Atlas frontend completion
- Full R1 acceptance proof
- Backend hardening cleanup

### Not closed now

- `[Authorize]` on `PropertyValuationController`
- Removal or justification of `QuantumMetricsBackgroundService`
- Full fake-path elimination in targeted production paths
- Documented endpoint matrix under the exact file strategy the plan originally expected

## Phase 0 - Truth Lock

Owner: all agents

Exit criteria:

- [PROGRESS_TRUTH_LEDGER.md](/C:/Users/bsval/terrafusion_os_1.0/docs/PROGRESS_TRUTH_LEDGER.md) is the current truth source.
- This execution plan is the single forward plan for CC, CP, and CX.
- All new work references the current truth ledger before changing status language in PRs or docs.

## Phase 1 - Forge Full Cutover

Goal: remove the biggest remaining fake production path.

### CC Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CC-FORGE-01` | Rewrite [forgeService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/forgeService.ts) in place so production valuation flows use `runGovernedValuation()` and not browser math | Grep targeted sections for `localStorage`, cost-matrix constants, and client-side production valuation code |
| `CC-FORGE-02` | Wire the Forge workbench flow so user action goes through Execution Console plus Risk Confirmation modal plus governed response rendering | Manual run with visible lifecycle and correlation ID |
| `CC-FORGE-03` | Preserve UI-facing types but remove legacy production behavior behind them | Frontend tests updated, no regression in importing components |
| `CC-FORGE-04` | Remove Benton-only silent fallbacks in Forge UI | Force a non-Benton path and confirm explicit error state, not silent fallback |

### CP Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CP-FORGE-01` | Confirm `run_valuation_model` request and response contract remains aligned between handler and frontend | Contract test plus live smoke |
| `CP-FORGE-02` | Harden live smoke to capture correlation ID, response payload shape, and trace evidence for Forge flow | Smoke artifact committed or attached to PR |
| `CP-FORGE-03` | Ensure tool metadata for Forge flow exposes reason-code and risk requirements cleanly to UI | `phase83` and live UI check |

### CX Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CX-FORGE-01` | Normalize CostForge calculate output so two different parcels produce materially different results | Two-parcel proof with captured payloads |
| `CX-FORGE-02` | Verify auth and county isolation on all backend routes used by Forge flow | Integration tests or documented manual proof |
| `CX-FORGE-03` | Document the live Forge endpoint contract in the authoritative docs set | Updated contract doc reviewed against live endpoint |

Phase 1 exit:

- Forge tab uses governed execution for production valuation.
- No production valuation path depends on client-side calculator state.
- Correlation IDs and trace events are visible from the UI flow.

## Phase 2 - Dossier Completion

Goal: make Dossier honestly real for the active workbench flow.

### CC Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CC-DOS-01` | Keep parcel details and evidence snapshot on real services, remove stale "backend not wired" assumptions from the active tab | UI review against current backend data |
| `CC-DOS-02` | Replace or quarantine the mock-labeled document-management slice in [PropertyDossier.tsx](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx) | No active production section is labeled mock unless explicitly out of scope and disabled |
| `CC-DOS-03` | Surface evidence snapshot correlation/header data cleanly in the UI | Manual proof with header correlation ID |

### CP Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CP-DOS-01` | Validate governed tools that interact with Dossier still match live backend behavior | Handler contract tests |
| `CP-DOS-02` | Add smoke path for dossier note plus casefile plus evidence snapshot proof | Stored smoke output with correlation IDs |

### CX Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CX-DOS-01` | Close remaining gap between live dossier details/evidence endpoints and any UI expectations for active workbench sections | UI no longer needs mock placeholders for active sections |
| `CX-DOS-02` | If document-management endpoints do not exist for R1, return explicit disabled or unsupported contracts instead of leaving ambiguity | Contract documented and consumed cleanly by UI |

Phase 2 exit:

- Dossier active workbench surfaces are real or explicitly disabled by contract.
- No active Dossier production section is "pretending" to be real.

## Phase 3 - Atlas Completion

Goal: make Atlas honestly real for the currently shipped workbench flow.

### CC Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CC-ATL-01` | Ensure Atlas workbench path uses [atlasService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/atlasService.ts) real endpoints only | Remove old fallback assumptions from UI |
| `CC-ATL-02` | Render real parcel geometry and layer data from the current backend surface, even if R1 stays non-GIS-native | Manual proof from live parcel response |
| `CC-ATL-03` | Present unsupported GIS depth honestly instead of inventing map behavior | UI communicates current capability without fake layers |

### CP Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CP-ATL-01` | Decide whether any Atlas interaction belongs in governed tool path for R1 or remains direct-service UI | Recorded architecture note in PR or doc |

### CX Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CX-ATL-01` | Verify current Atlas response shape is sufficient for active UI | UI consumes without mock translation layer |
| `CX-ATL-02` | Extend Atlas only where the current shipped workbench truly needs it; do not build speculative GIS scope into R1 | Endpoint diff tied to active UI need |

Phase 3 exit:

- Atlas active workbench path is real-data backed.
- Any non-R1 GIS depth is marked as future scope, not silently faked.

## Phase 4 - Backend Hardening and Theater Cleanup

Goal: close the visible backend trust gaps.

### CX Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CX-HARD-01` | Add `[Authorize]` to [PropertyValuationController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/PropertyValuationController.cs) or explicitly document why it remains outside governed R1 path | Controller code plus auth test |
| `CX-HARD-02` | Audit write-capable R1 routes for auth plus county isolation | Audit checklist and test references |
| `CX-HARD-03` | Remove, disable, or explicitly justify `QuantumMetricsBackgroundService` in [Program.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Program.cs) | Program diff plus rationale |
| `CX-HARD-04` | Publish authoritative endpoint matrix for routes actually used in R1 | Updated docs set |

### CP Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CP-HARD-01` | Keep core contracts aligned with live backend after any hardening changes | Contract tests stay green |

Phase 4 exit:

- No obvious auth hole remains in current R1 backend surface.
- No visible background-service theater remains unaccounted for.

## Phase 5 - Fake-Path Elimination

Goal: prove the active R1 surfaces no longer rely on hidden mock or legacy production paths.

### Targeted grep surface

- [forgeService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/forgeService.ts)
- [atlasService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/atlasService.ts)
- [dossierService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/dossierService.ts)
- Active workbench tabs for Forge, Atlas, Dossier

### CC Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CC-FAKE-01` | Remove targeted fake-path strings and silent fallbacks from active production surfaces | Grep returns zero for targeted rules |
| `CC-FAKE-02` | Where future scope remains, replace fake behavior with explicit "not yet available" UX | Manual review |

### CP Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CP-FAKE-01` | Add or tighten smoke and contract checks to fail when targeted production paths regress to fake behavior | Test or smoke proof lands with PR |

### CX Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `CX-FAKE-01` | Replace backend stub behavior on any endpoint still used by active R1 UI, or explicitly mark it disabled | Endpoint contract reflects truth |

Phase 5 exit:

- Targeted fake-path grep is zero for active R1 production surfaces.
- Remaining future scope is explicit and disabled, not fabricated.

## Phase 6 - Governed Proof and Release Evidence

Goal: close the acceptance gap with evidence.

### Required R1 proven tools

Minimum set for release proof:

1. `run_valuation_model`
2. `explain_value_change`
3. `search_trace_by_correlation`
4. `summarize_levy_rate_components`
5. `summarize_parcel_casefile`

### All-Agent Tasks

| ID | Deliverable | Verification |
|---|---|---|
| `ALL-PROOF-01` | Run the 5-tool governed proof from UI or governed smoke harness and capture correlation IDs for each | Evidence packet |
| `ALL-PROOF-02` | Execute AC-1 through AC-11 and record pass or fail with evidence | Acceptance checklist |
| `ALL-PROOF-03` | Re-run `type-check`, `phase83`, `phase85`, `phase86` on the release candidate | Fresh gate log |
| `ALL-PROOF-04` | Update truth ledger after proofs, not before | Ledger revision reflects final state |

Phase 6 exit:

- R1 is described by evidence, not by aspiration.

## Full Manifest Closure Matrix

This section is the "everything" list for tool-level closure. A tool is not done until
the manifest entry, handler behavior, backend endpoint, UI surface, and evidence packet
all agree.

| Tool | Current Truth | CP Scope | CX Scope | CC Scope | Release Bucket |
|---|---|---|---|---|---|
| `route_to_parcel` | Real handler; navigation-only | Keep payload contract stable | None beyond route integrity | Keep parcel navigation UX stable | R1 proof |
| `run_valuation_model` | Real handler; backend live | Freeze request/response + proof harness | Normalize CostForge output, auth, county isolation | Make governed path the only production flow | R1 proof |
| `explain_value_change` | Real handler; property-backed | Keep contract + trace proof | Verify property/costforge reads are county-safe | Show result + evidence cleanly | R1 proof |
| `search_trace_by_correlation` | Real handler; trace-backed | Keep trace query contract stable | Maintain trace service durability/access | Surface query + copy UX cleanly | R1 proof |
| `summarize_levy_rate_components` | Real handler; levy-backed | Keep governed contract stable | Validate levy engine and county isolation | Show result and trace in UI | R1 proof |
| `explain_model_inputs` | Real handler; backend-backed | Keep contract stable | Verify model endpoint truthfulness | Surface model-input explanation cleanly | R1.1 |
| `compare_assessed_value_history` | Real handler; property-backed | Keep contract stable | Verify history query truthfulness | Add governed result presentation if needed | R1.1 |
| `summarize_parcel_casefile` | Real handler; dossier-backed | Keep contract + proof harness | Keep casefile endpoint stable | Show dossier summary/evidence cleanly | R1 proof |
| `add_dossier_note` | Real handler; write-low | Keep write governance semantics stable | Verify note write auth/county scope | Add clear write confirmation UX | R1.1 |
| `query_parcel_layers` | Real handler; atlas-backed | Keep contract stable | Verify atlas layer response truthfulness | Render current layer truth without fake GIS depth | R1.1 |
| `assign_task` | Stub | Define final contract + golden fixtures | Build Dais task endpoint/service | Add UI only after endpoint exists | Post-R1 |
| `check_cert_status` | Stub | Define final contract + fixtures | Build certification status backend | Add UI only after endpoint exists | Post-R1 |
| `assemble_boe_packet` | Stub | Define governed write-high contract | Build packet assembly backend + storage path | Add packet UX after endpoint truth exists | Post-R1 |
| `draft_notice` | Stub | Define template contract | Build notice-generation backend | Add document preview/send UX | Post-R1 |
| `draft_appeal_response` | Stub | Define contract | Build appeal-response backend | Add governed drafting UI | Post-R1 |
| `explain_model_results` | Stub | Define contract | Build model-result explanation service | Add result view only after backend truth exists | Post-R1 |
| `summarize_dossier` | Stub | Define contract | Build dossier summarization backend | Add UI after summary endpoint exists | Post-R1 |
| `synthesize_evidence` | Stub | Define contract | Build evidence aggregation pipeline | Add evidence synthesis UX | Post-R1 |
| `generate_commissioner_memo` | Stub | Define contract | Build memo generation backend | Add memo review/export UX | Post-R1 |
| `request_trace_redaction` | Stub; irreversible | Freeze irreversible contract + policy gates | Build redaction workflow/audit trail | Add guarded UX only after backend exists | Post-R1 |
| `explain_senior_exemption_impact` | Stub | Define contract | Build exemption calculation backend | Add result UI after backend truth exists | Post-R1 |
| `draft_value_change_notice` | Stub | Define contract | Build notice backend | Add governed drafting UI | Post-R1 |
| `draft_boe_appeal_response` | Stub | Define contract | Build appeal backend | Add governed drafting UI | Post-R1 |
| `summarize_sales_comps_rationale` | Stub | Define contract | Build sales-comps reasoning backend | Add result UI after backend truth exists | Post-R1 |

## Non-Tool Surface Closure Matrix

These are not fully captured by the tool manifest, but they still block an honest
"end to end" claim.

| Surface | Current Truth | Required Closure |
|---|---|---|
| Forge suite screens | Production path still dual-runs with client calculator logic | Governed path only for production valuation flows |
| Dossier document management | Active tab still contains mock-labeled slice | Real backend or explicit disabled contract |
| Atlas GIS depth | Current backend is parcel/layer truth, not full GIS | Honest UI that reflects current backend depth |
| PILT | Frontend calls live endpoints, backend is entirely hardcoded | Either real backend or explicit out-of-R1 disablement |
| PropertyValuationController | Missing auth and county proof | Add auth/county enforcement or remove from active R1 surface |
| Background-service theater | `QuantumMetricsBackgroundService` still registered | Remove or justify explicitly |

## Evidence Packet Checklist

Every major branch from CC, CP, or CX should ship with the same evidence shape so the
truth ledger can be updated mechanically instead of narratively.

1. Scope statement: what active production path changed.
2. Source proof: file references and exact endpoints/contracts touched.
3. Gate proof: `type-check`, `phase83`, `phase85`, `phase86` as applicable.
4. Runtime proof: correlation IDs, trace IDs, and payload samples.
5. Fake-path proof: targeted grep or code search result for removed fallback logic.
6. Remaining truth: explicit statement of what is still partial or deferred.

## Branch and Merge Strategy

- Documentation correction work: `claude/review-progress-ledger-a8iw5`
- Feature work continues on agent-owned branches:
  - `claude/r1-*`
  - `copilot/r1-*`
  - `codex/r1-*`
- Merge target remains `r1/integration` until the proof phase is complete.
- `main` is only eligible after release evidence is assembled.

## Board-Safe Definition of Done

R1 can be described as "real end to end" only when:

- The governed path is real in both code and UI.
- Forge no longer hides a second calculator path.
- Atlas and Dossier active workbench surfaces are real or explicitly disabled.
- Auth, county isolation, correlation, and trace proof are all exercised.
- Acceptance criteria and gate results are attached to the release decision.

## Beyond R1 - The "Everything" Backlog

This is not release-blocking for R1, but it is the honest next sequence if the goal is to get the suites fully real, not just R1-real.

### Forge

- Extract Benton CAMA cost matrices from quarantine sources
- Add income approach
- Add sales comparison
- Add reconciliation
- Replace simplified backend math with real valuation lineage

### Atlas

- Bring forward real GIS and ArcGIS integration
- Replace R1 parcel-geometry-only behavior with full map workflows

### Dais

- Replace PILT stubs with real calculator logic
- Bring permit workflows online
- Replace simplified levy logic with real statutory engine

### Dossier

- Complete document-management backend
- Add full evidence chain and packet generation

### Cross-Suite

- Extract real domain logic from the quarantine app inventory instead of building new mock-first slices
- Keep fake-path elimination and governed proof as permanent release gates
