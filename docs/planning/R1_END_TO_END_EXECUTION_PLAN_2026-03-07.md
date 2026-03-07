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

## Codex / CX Detailed Lane Plan

Purpose: define the backend lane in a way that supports honest R1 closure without
letting backend work expand into "finish the whole platform."

### CX Lane Mission

Codex / CX owns the backend truth needed for R1:

- stable backend contracts for the active Forge, Dossier, Atlas, and Levy flows
- auth, county isolation, and correlation integrity on the active R1 surface
- truthful disablement or exclusion of backend paths that are not actually R1-ready
- proof enablement for the 5 governed tools used in the release evidence packet

CX does not own speculative suite completion unless the frozen R1 acceptance criteria
explicitly require it.

### CX Scope Classes

| Scope class | Definition | CX examples |
|---|---|---|
| `R1-required` | Must ship for an honest R1 "real end-to-end" claim | Forge backend truth, Dossier/Atlas contract closure, active-route auth and county isolation, 5-tool governed proof support |
| `R1-optional` | Useful if it reduces release risk, but not required to describe R1 honestly | backend contract docs polish, extra integration proofs, non-blocking ergonomics cleanup |
| `Post-R1` | Valuable platform work, but not part of strict R1 closure | full PILT implementation, full Dais backend, 24/24 real handlers, trace redaction workflow, full Dossier document management backend |

### CX Governing Rule

If a backend task does not directly support one of the following, it does not enter
strict R1 by default:

- Forge cutover to governed production valuation
- Dossier honesty for active workbench sections
- Atlas honesty for active workbench sections
- backend auth / county isolation / correlation hardening on active R1 routes
- governed proof for the 5 required tools
- final release evidence and branch-head signoff

### CX Work Packages

#### `CX-R1-00` Truth Lock and Route Matrix

Scope: `R1-required`

Objective:
- Build a backend route matrix for the active R1 surface and make it the reference
  set for all CX execution decisions.

Primary source files:
- [CostForgeController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/CostForgeController.cs)
- [DossierController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/DossierController.cs)
- [AtlasController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/AtlasController.cs)
- [LevyCalculationController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs)
- [PropertyValuationController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/PropertyValuationController.cs)
- [PiltController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/PiltController.cs)
- [Program.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Program.cs)

Required output per route:
- auth status
- county-isolation status
- correlation behavior
- backing data source
- frontend or governed-tool consumer
- scope classification: `R1-required`, `R1-optional`, or `Post-R1`

Exit criteria:
- No backend path is described as "real" unless controller behavior, data source,
  and active consumer all line up.
- The route matrix is sufficient to classify every active R1 backend touchpoint.

#### `CX-R1-01` Active Surface Risk Burn-Down

Scope: `R1-required`

Objective:
- Remove or explicitly carve out the highest-risk backend truth gaps on the active R1
  surface.

Required actions:
- Resolve [PropertyValuationController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/PropertyValuationController.cs):
  add auth plus county isolation, or explicitly remove it from the active R1 surface.
- Resolve [PiltController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/PiltController.cs):
  either make it truthful for R1 or classify it `Post-R1` with explicit unsupported
  or disabled semantics instead of fake live behavior.
- Resolve `QuantumMetricsBackgroundService` in
  [Program.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Program.cs):
  remove it, gate it off, or document why it remains.

Verification:
- active R1 backend routes are no longer anonymous without justification
- active R1 backend routes are no longer cross-county without justification
- theater-backed backend behavior is either removed or explicitly excluded from R1

Exit criteria:
- No active R1 backend surface remains fake, anonymous, or structurally ambiguous
  without a documented carve-out.

#### `CX-R1-02` Forge Backend Closure

Scope: `R1-required`

Objective:
- Make `/api/costforge/calculate` the backend truth that CC can safely cut over to for
  production valuation.

Required actions:
- Normalize the request and response semantics used by the governed Forge flow.
- Ensure correlation headers and failure semantics are stable enough for UI display.
- Prove that different parcels produce materially different outputs.
- Verify auth and county isolation on all backend routes participating in Forge flow.
- Make non-R1 CostForge surfaces truthful. If batch calculate or PACS sync remain
  stubs, they must return explicit unsupported semantics instead of appearing half-live.

Dependencies:
- CP freezes the governed `run_valuation_model` contract.
- CC switches production valuation UI only after payload and error semantics are stable.

Verification:
- two-parcel proof with materially different outputs
- backend contract proof aligned to governed handler expectations
- correlation ID present on success and error paths

Exit criteria:
- CC can remove client-side valuation logic without guessing what the backend means.

#### `CX-R1-03` Dossier Contract Closure

Scope: `R1-required`

Objective:
- Freeze the active Dossier backend contract around what the workbench actually uses.

Required actions:
- Confirm and stabilize active contracts for details, casefile, notes, and evidence
  snapshot in [DossierController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/DossierController.cs).
- Keep county filtering and correlation behavior consistent across active endpoints.
- If Dossier document management is not an R1 backend feature, return explicit disabled
  or unsupported semantics instead of leaving the UI in a mock gray zone.

Dependencies:
- CC removes mock-labeled assumptions only after these semantics are frozen.
- CP keeps dossier-governed tools aligned with the final contract.

Verification:
- active Dossier endpoints are source-verified and contract-documented
- UI no longer needs hidden mock assumptions for active sections

Exit criteria:
- Dossier is honest for active R1 use: real where implemented, explicit where deferred.

#### `CX-R1-04` Atlas Contract Closure

Scope: `R1-required`

Objective:
- Freeze the Atlas parcel and layer contract to the actual backend depth shipped in R1.

Required actions:
- Confirm the active parcel and layer response shape in
  [AtlasController.cs](/C:/Users/bsval/terrafusion_os_1.0/backend/src/TerraFusion.API/Controllers/AtlasController.cs).
- Keep county-safe filtering and correlation behavior stable.
- Avoid implying full GIS behavior if R1 only supports parcel and layer truth.

Dependencies:
- CC renders Atlas truthfully only against the frozen backend contract.
- CP decides whether any Atlas interaction belongs in governed-tool proof or remains
  a direct-service path for R1.

Verification:
- active Atlas UI consumes live response shape without mock translation
- unsupported GIS depth is documented as future scope, not implied capability

Exit criteria:
- Atlas can be described as "real within current R1 scope" without overstating GIS depth.

#### `CX-R1-05` Governed Proof Enablement

Scope: `R1-required`

Objective:
- Support CP's release proof for the 5 governed tools that define honest R1 completion.

Required tools:
1. `run_valuation_model`
2. `explain_value_change`
3. `search_trace_by_correlation`
4. `summarize_levy_rate_components`
5. `summarize_parcel_casefile`

Required actions:
- For each tool, confirm backend request and response truth.
- Capture expected correlation behavior and trace linkage.
- Close any backend ambiguity that would make the proof packet non-reproducible.

Verification:
- governed proof run has correlation IDs for all 5 tools
- backend payloads match governed contract expectations
- trace lookups are reproducible from the captured IDs

Exit criteria:
- Backend proof inputs are stable enough that the release evidence packet is about
  execution truth, not interpretation.

#### `CX-R1-06` Release Gate and Backend Signoff

Scope: `R1-required`

Objective:
- Produce a backend-specific signoff that R1 can be described truthfully.

Required actions:
- Re-run backend build and relevant tests after final hardening.
- Confirm active R1 endpoints have auth, county isolation, truthful contracts, and
  correlation propagation.
- Confirm any non-R1 endpoint still reachable from active UI is either real or explicitly
  disabled by contract.
- Publish backend evidence in a form the truth ledger can cite directly.

Verification:
- backend build passes
- no unresolved active-route auth or county hole remains
- no active UI route depends on fake backend semantics without disclosure

Exit criteria:
- CX can sign off "truthful for R1" without relying on implied future work.

#### `CX-R1-07` Lane Evidence Signoff Assembly

Scope: `R1-required`

Objective:
- Make the CX evidence lane verifiable by the final branch-head evidence gate.

Required actions:
- Build and maintain `docs/evidence/cx/signoff.md` with all required metadata fields.
- Ensure every linked artifact resolves as repo-relative or signoff-relative.
- Keep all linked evidence contained to `docs/evidence/cx/...` or `docs/evidence/final/...`.
- Ensure linked backend evidence files exist and reflect the final verified branch-head SHA
  and canon version used across all lanes.

Dependencies:
- CP publishes the final evidence verifier contract and manifest workflow.
- CC and CP converge on the same branch-head SHA and canon version.

Verification:
- CX signoff passes `r1:verify-evidence`
- all linked backend evidence is present and lane-contained

Exit criteria:
- CX evidence can be verified mechanically at branch head, not by manual interpretation.

### CX Dependencies and Handoffs

| Dependency | Owner | CX expectation |
|---|---|---|
| Governed contract freeze | CP | Tool payloads, risk metadata, and trace expectations are stable before backend signoff |
| Forge UI cutover | CC | CC does not remove client-side valuation behavior until CX publishes stable Forge semantics |
| Dossier UI honesty pass | CC | CC consumes explicit Dossier supported/unsupported semantics instead of carrying mock ambiguity |
| Atlas UI honesty pass | CC | CC renders Atlas to current backend truth, not inferred GIS scope |
| Final proof harness | CP + CC | CX provides backend evidence needed for correlation-driven proof |

### CX Explicitly Not Strict R1

The following stay out of strict R1 unless the frozen acceptance criteria are updated:

- full real PILT implementation
- full Dais backend creation
- 24/24 real handler closure
- `request_trace_redaction`
- full Dossier document-management backend
- broad "finish every suite" work

### CX Definition of Done

The backend lane is done for R1 only when all of the following are true:

- Forge backend is stable enough for CC to kill legacy production valuation behavior.
- Dossier and Atlas active contracts are real or explicitly disabled.
- No visible backend auth or county-isolation hole remains on the active R1 path.
- Proof exists for the 5 governed tools with correlation IDs and reproducible traces.
- Anything still fake is tagged `Post-R1`, not hidden inside R1 language.

## Claude / CC Detailed Lane Plan

Purpose: define the frontend and shell lane in a way that finishes the governed user
path, removes legacy production behavior, and keeps UI honesty aligned to actual backend
truth.

### CC Lane Mission

Claude / CC owns the user-visible R1 truth needed for release:

- governed execution UX for the active Forge flow
- honest Atlas and Dossier workbench behavior for active production sections
- removal of hidden fallback, mock, and legacy production behavior from active R1 UI
- visible evidence capture, error presentation, and correlation-aware proof support

CC does not own speculative suite expansion unless the frozen R1 acceptance criteria
explicitly require it.

### CC Scope Classes

| Scope class | Definition | CC examples |
|---|---|---|
| `R1-required` | Must ship for an honest R1 "real end-to-end" claim | Forge governed cutover, Dossier active-tab honesty, Atlas active-tab honesty, fake-path elimination on active production surfaces, governed proof UX |
| `R1-optional` | Useful if it reduces release risk, but not required to describe R1 honestly | minor UX polish, stronger empty states, extra frontend tests beyond release-critical coverage |
| `Post-R1` | Valuable UI work, but not part of strict R1 closure | full suite redesign, speculative GIS UX, full document-management UI, broad feature expansion across every suite |

### CC Governing Rule

If a frontend task does not directly support one of the following, it does not enter
strict R1 by default:

- Forge cutover to governed production valuation
- Dossier honesty for active workbench sections
- Atlas honesty for active workbench sections
- fake-path elimination on active R1 UI surfaces
- governed proof visibility, evidence capture, and correlation-aware UX
- final release evidence and branch-head signoff

### CC Work Packages

#### `CC-R1-00` Frontend Truth Lock and Surface Inventory

Scope: `R1-required`

Objective:
- Build the frontend inventory for active R1 production surfaces and classify each path
  as real, partial, explicitly disabled, or `Post-R1`.

Primary source files:
- [forgeService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/forgeService.ts)
- [atlasService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/atlasService.ts)
- [dossierService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/dossierService.ts)
- [PropertyPilot.tsx](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx)
- [PropertyAtlas.tsx](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx)
- [PropertyDossier.tsx](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx)
- [ExecutionConsole.tsx](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/components/pilot/ExecutionConsole.tsx)
- [EvidenceRail.tsx](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/components/pilot/EvidenceRail.tsx)
- [ContextRibbon.tsx](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/components/workbench/ContextRibbon.tsx)
- [PolicyGuardUI.tsx](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/components/workbench/PolicyGuardUI.tsx)
- [RiskConfirmationModal.tsx](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/components/pilot/RiskConfirmationModal.tsx)

Required output per surface:
- active user path
- real backend or governed dependency
- hidden fallback or mock dependency
- scope classification: `R1-required`, `R1-optional`, or `Post-R1`
- explicit disabled state if real implementation is not part of R1

Exit criteria:
- No active production surface is described as real unless the UI behavior, service
  dependency, and backing backend path all line up.
- The surface inventory is sufficient to drive targeted fake-path elimination.

#### `CC-R1-01` Forge Governed Cutover

Scope: `R1-required`

Objective:
- Make the governed Forge path the only production valuation path in the UI.

Required actions:
- Rewrite [forgeService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/forgeService.ts)
  so active production valuation flows use governed execution, not client-side math or
  `localStorage`.
- Ensure user action passes through risk confirmation, execution console lifecycle, and
  governed response rendering.
- Preserve stable UI-facing types where possible, but remove hidden production behavior
  behind those types.
- Replace Benton-only or silent fallback behavior with explicit error or unsupported UI.

Dependencies:
- CP freezes governed tool metadata and payload expectations.
- CX publishes stable Forge payload, error, auth, and correlation semantics.

Verification:
- targeted grep confirms removal of client-side production valuation logic
- manual or test proof shows visible lifecycle with correlation ID
- no silent fallback path remains for active Forge production actions

Exit criteria:
- The active Forge tab no longer depends on browser valuation logic for production use.

#### `CC-R1-02` Dossier Honesty Closure

Scope: `R1-required`

Objective:
- Make the Dossier tab honest for active R1 use.

Required actions:
- Keep parcel details, casefile, notes, and evidence snapshot on real services.
- Remove stale "backend not wired" assumptions from active sections.
- Replace or quarantine any mock-labeled document-management slice that is still visible
  in active production UI.
- Surface evidence snapshot and correlation information clearly where it supports proof.

Dependencies:
- CX freezes supported and unsupported Dossier semantics.
- CP keeps Dossier-governed tools aligned to the final contract.

Verification:
- active Dossier sections render from real data or explicit disabled states
- no active Dossier section implies backend support that does not exist

Exit criteria:
- Dossier is user-honest: real where implemented, explicitly disabled where deferred.

#### `CC-R1-03` Atlas Honesty Closure

Scope: `R1-required`

Objective:
- Make Atlas truthful to current backend depth without inventing non-R1 GIS behavior.

Required actions:
- Keep [atlasService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/atlasService.ts)
  on real endpoint usage for active paths.
- Render current parcel and layer truth from the live backend shape.
- Replace inferred or fabricated GIS depth with explicit "not available in R1" UX where
  necessary.

Dependencies:
- CX freezes current Atlas parcel and layer semantics.
- CP decides whether any Atlas flow belongs inside governed proof for R1.

Verification:
- Atlas active workbench surfaces consume live backend shape
- no map behavior implies capabilities the backend does not actually provide

Exit criteria:
- Atlas can be shipped as real within current R1 scope without overstating capability.

#### `CC-R1-04` Fake-Path Elimination on Active UI

Scope: `R1-required`

Objective:
- Prove that active R1 production UI surfaces no longer rely on hidden fake or legacy
  behavior.

Target surfaces:
- [forgeService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/forgeService.ts)
- [atlasService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/atlasService.ts)
- [dossierService.ts](/C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell/src/services/dossierService.ts)
- active workbench tabs for Forge, Atlas, and Dossier

Required actions:
- Remove targeted fake-path strings and silent fallbacks from active production surfaces.
- Where future scope remains, replace fake behavior with explicit unsupported UX.
- Ensure active proof surfaces do not collapse to mock data when backend calls fail.

Dependencies:
- CX explicitly disables or documents unsupported backend paths.
- CP adds smoke and contract checks that fail on fake-path regressions.

Verification:
- targeted grep returns zero for agreed fake-path rules on active R1 surfaces
- failure paths show explicit unsupported or error states, not fake fallback data

Exit criteria:
- Remaining future scope is explicit and disabled, not fabricated in the UI.

#### `CC-R1-05` Governed Proof UX and Evidence Capture

Scope: `R1-required`

Objective:
- Make the 5-tool governed proof visible, reproducible, and understandable from the UI.

Required actions:
- Ensure execution console, evidence rail, policy guard, and risk confirmation work
  together for the release-proof flows.
- Surface correlation IDs, request state, result state, and failure state cleanly.
- Keep proof UX focused on actual governed flows, not speculative tool coverage.

Required tools:
1. `run_valuation_model`
2. `explain_value_change`
3. `search_trace_by_correlation`
4. `summarize_levy_rate_components`
5. `summarize_parcel_casefile`

Verification:
- each release-proof flow has visible correlation-aware UX
- screenshots or run notes can be captured directly from the UI path

Exit criteria:
- The UI supports the release evidence packet without requiring off-book interpretation.

#### `CC-R1-06` Release Gate and Frontend Signoff

Scope: `R1-required`

Objective:
- Produce a frontend-specific signoff that the user-visible R1 path is truthful.

Required actions:
- Re-run relevant frontend tests or harnesses after final cutover.
- Confirm active R1 surfaces are real or explicitly disabled.
- Confirm no active release-proof path depends on hidden fake data.
- Publish frontend evidence in a form the truth ledger can cite directly.

Verification:
- active R1 UI flows render with real data or explicit unsupported semantics
- fake-path checks pass for targeted surfaces
- release-proof UI path is reproducible

Exit criteria:
- CC can sign off "truthful for R1" without relying on unstated backend assumptions.

#### `CC-R1-07` Lane Evidence Signoff Assembly

Scope: `R1-required`

Objective:
- Make the CC evidence lane verifiable by the final branch-head evidence gate.

Required actions:
- Build and maintain `docs/evidence/cc/signoff.md` with all required metadata fields.
- Ensure every linked artifact resolves as repo-relative or signoff-relative.
- Keep all linked evidence contained to `docs/evidence/cc/...` or `docs/evidence/final/...`.
- Ensure linked frontend and UI-proof artifacts exist and reflect the final verified
  branch-head SHA and canon version used across all lanes.

Dependencies:
- CP publishes the final evidence verifier contract and manifest workflow.
- CX and CP converge on the same branch-head SHA and canon version.

Verification:
- CC signoff passes `r1:verify-evidence`
- all linked frontend evidence is present and lane-contained

Exit criteria:
- CC evidence can be verified mechanically at branch head, not by manual interpretation.

### CC Dependencies and Handoffs

| Dependency | Owner | CC expectation |
|---|---|---|
| Governed contract freeze | CP | Tool metadata, payload shapes, and risk semantics are stable before final UI cutover |
| Forge backend semantics | CX | Forge responses, errors, auth behavior, and correlation semantics are stable before CC removes legacy valuation behavior |
| Dossier contract closure | CX | Dossier supported and unsupported semantics are explicit before CC removes mock ambiguity |
| Atlas contract closure | CX | Atlas backend depth is explicit before CC finalizes honesty-focused UI |
| Proof harness and acceptance run | CP | CC gets the governed flows and evidence expectations needed to present proof cleanly |

### CC Explicitly Not Strict R1

The following stay out of strict R1 unless the frozen acceptance criteria are updated:

- full suite redesign
- speculative GIS UX beyond current backend capability
- full Dossier document-management UI
- full PILT experience if backend remains non-R1
- broad "finish every suite" feature work
- new PACS-tab action wiring

### CC Definition of Done

The frontend lane is done for R1 only when all of the following are true:

- Forge uses governed execution for active production valuation flows.
- Dossier and Atlas active workbench sections are real or explicitly disabled.
- No visible active R1 UI path depends on hidden fallback or mock production behavior.
- The 5-tool governed proof is visible in the UI with usable correlation-aware evidence.
- Anything still fake is tagged `Post-R1`, not masked by polished UI language.

## Copilot / CP Detailed Lane Plan

Purpose: define the governance-runtime lane in a way that protects the constitutional
surface, freezes the right contracts, and drives evidence-based release proof without
turning R1 into 24-tool platform completion.

### CP Lane Mission

Copilot / CP owns the governed execution truth needed for R1:

- contract stability for the active governed tools
- tool metadata, handler alignment, and trace semantics for release-proof flows
- protection of the constitutional core surface and its gates
- governed smoke, acceptance evidence, and branch-head release proof

CP does not own speculative tool expansion unless the frozen R1 acceptance criteria
explicitly require it.

### CP Scope Classes

| Scope class | Definition | CP examples |
|---|---|---|
| `R1-required` | Must ship for an honest R1 "real end-to-end" claim | 5-tool contract freeze, active handler/runtime alignment, trace semantics, governed proof harness, gate integrity |
| `R1-optional` | Useful if it reduces release risk, but not required to describe R1 honestly | extra smoke coverage, additional fixtures for already-active tools, doc polish for trace/debug workflows |
| `Post-R1` | Valuable governance-runtime work, but not part of strict R1 closure | 24/24 real handler closure, broad new governed tools, irreversible redaction workflow, full post-R1 tool expansion |

### CP Governing Rule

If a governance-runtime task does not directly support one of the following, it does not
enter strict R1 by default:

- contract freeze for the 5 governed proof tools and currently active governed paths
- handler and trace correctness for release-critical flows
- gate integrity for `type-check`, `phase83`, `phase85`, and `phase86`
- governed smoke, acceptance proof, and evidence-packet generation
- final branch-head signoff tied to the constitutional surface

### CP Work Packages

#### `CP-R1-00` Governance Truth Lock and Tool Classification

Scope: `R1-required`

Objective:
- Classify governed tools and runtime surfaces so R1 proof work stays bounded to the
  actual release target.

Primary source files:
- [PilotController.ts](/C:/Users/bsval/terrafusion_os_1.0/os-platform/core/api/PilotController.ts)
- [handlers.real.ts](/C:/Users/bsval/terrafusion_os_1.0/os-platform/core/pilot/handlers.real.ts)
- [TraceStore.ts](/C:/Users/bsval/terrafusion_os_1.0/os-platform/core/trace/TraceStore.ts)
- [INVOKE_CONTRACT.md](/C:/Users/bsval/terrafusion_os_1.0/tools/registry/INVOKE_CONTRACT.md)
- [ROLE_VOCABULARY.md](/C:/Users/bsval/terrafusion_os_1.0/os-platform/core/types/ROLE_VOCABULARY.md)
- [terrapilot.tools.json](/C:/Users/bsval/terrafusion_os_1.0/tools/registry/terrapilot.tools.json)

Required output:
- tool classification: `R1-required`, `R1-optional`, or `Post-R1`
- governed proof set locked to the 5 release tools
- active handler list and stub list called out explicitly

Exit criteria:
- CP work is explicitly bounded to release-critical governed surfaces.
- No one can confuse "24 tools in the manifest" with "24 tools required for R1."

#### `CP-R1-01` Contract Freeze for Release-Critical Tools

Scope: `R1-required`

Objective:
- Freeze the governed request, response, risk, and trace expectations for the release
  proof tools and any active governed surfaces they depend on.

Required tools:
1. `run_valuation_model`
2. `explain_value_change`
3. `search_trace_by_correlation`
4. `summarize_levy_rate_components`
5. `summarize_parcel_casefile`

Required actions:
- Confirm request and response contract alignment between manifest, handler, backend,
  and UI consumer.
- Ensure tool metadata exposes risk and reason-code requirements clearly to the UI.
- Keep non-proof governed tools truthful, but do not expand them into strict R1 unless
  the acceptance criteria require it.

Dependencies:
- CX confirms backend semantics for proof tools.
- CC consumes the stable risk and payload semantics in proof UX.

Verification:
- contract tests pass for release-critical tools
- metadata remains consistent with UI requirements

Exit criteria:
- Release-proof governed contracts are stable enough to support smoke and acceptance work.

#### `CP-R1-02` Handler and Trace Runtime Alignment

Scope: `R1-required`

Objective:
- Ensure the governed runtime behaves predictably for the active release-critical flows.

Required actions:
- Keep `handlers.real.ts`, runtime wiring, and trace persistence aligned for active flows.
- Confirm trace search, trace export, and correlation semantics work for proof usage.
- Keep stub handlers clearly classified as non-R1 where they remain incomplete.

Dependencies:
- CX maintains backend truth behind active real handlers.
- CC exposes correlation-aware flows in the UI.

Verification:
- `phase83`, `phase85`, and `phase86` stay green
- active handler behavior matches contract and trace expectations

Exit criteria:
- Runtime truth for release-critical governed flows is stable and test-backed.

#### `CP-R1-03` Governed Smoke and Proof Harness

Scope: `R1-required`

Objective:
- Produce reproducible governed proof for the 5 release-critical tools.

Required actions:
- Harden smoke paths to capture correlation IDs, request shape, response shape, and
  trace evidence.
- Keep proof artifacts tied to the governed path, not direct backend shortcuts.
- Ensure failure cases remain intelligible enough to debug from the trace chain.

Dependencies:
- CX provides stable backend semantics for proof tools.
- CC ensures governed proof flows remain visible and operable from the UI.

Verification:
- smoke output exists for all 5 proof tools
- correlation IDs and trace lookups are preserved in the evidence packet

Exit criteria:
- The governed proof run is reproducible and board-safe.

#### `CP-R1-04` Acceptance and Evidence Packet Orchestration

Scope: `R1-required`

Objective:
- Turn contract truth and governed smoke into a single release-proof packet.

Required actions:
- Execute AC-1 through AC-11 and record pass or fail with evidence.
- Keep evidence organized by governed flow, correlation ID, and acceptance criterion.
- Ensure truth-ledger updates happen after proof, not before.

Dependencies:
- CC provides UI-visible proof artifacts where required.
- CX provides backend evidence for payload and route truth.

Verification:
- acceptance checklist is complete
- evidence packet is traceable to concrete governed runs

Exit criteria:
- Release status is backed by a single evidence packet rather than scattered claims.

#### `CP-R1-05` Gate Integrity and Branch-Head Signoff

Scope: `R1-required`

Objective:
- Protect the constitutional gates through the release candidate and branch-head signoff.

Required actions:
- Re-run `type-check`, `phase83`, `phase85`, and `phase86` on the release candidate.
- Confirm governed-spine expectations still match the final runtime state.
- Prevent branch-head release language from overstating incomplete post-R1 surfaces.

Verification:
- required gates are green at branch head
- release signoff language matches the evidence packet and truth ledger

Exit criteria:
- CP can sign off that the governed spine is truthful for R1 release.

#### `CP-R1-06` Evidence Verifier Hardening

Scope: `R1-required`

Objective:
- Make evidence verification deterministic, plain-Node compatible, and lane-safe.

Implementation targets:
- `tools/r1/verify-evidence.mjs`

Required actions:
- Keep the verifier runnable with plain Node `.mjs` runtime; no TS runtime assumptions.
- Validate required metadata fields in each lane signoff.
- Enforce same verified branch-head SHA across `cc`, `cx`, and `cp`.
- Enforce same canon version across `cc`, `cx`, and `cp`.
- Support signoff-relative and repo-relative links while rejecting external URLs.
- Enforce evidence containment to `docs/evidence/<lane>/...` and `docs/evidence/final/...`.
- Ensure linked evidence files exist.
- Optionally validate `docs/evidence/final/manifest.json` and SHA256 hashes when present.

Dependencies:
- CC and CX maintain lane signoffs using the required metadata model.

Verification:
- `node tools/r1/verify-evidence.mjs` passes on the final branch head
- negative cases fail deterministically with crisp messages

Exit criteria:
- Evidence verification is hard, deterministic, and does not rely on TS runtime magic.

#### `CP-R1-07` Final Manifest and Gate Wiring

Scope: `R1-required`

Objective:
- Make branch-head evidence verification tamper-evident and part of the final release gate.

Implementation targets:
- `tools/r1/generate-final-manifest.mjs`
- root `package.json` scripts:
  - `r1:verify-evidence`
  - `r1:finalize-manifest`

Required actions:
- Generate `docs/evidence/final/manifest.json` with SHA256 hashes for evidence artifacts.
- Exclude `manifest.json` from hashing itself.
- Wire manifest generation and evidence verification into the Final Verification Gate.
- Add the same commands to CI or release automation for branch-head verification.
- Keep the manifest optional for validation but first-class for finalization.

Dependencies:
- CC, CX, and CP produce final signoff and evidence artifacts before branch-head verification.

Verification:
- `pnpm -w run r1:finalize-manifest <BRANCH_HEAD_SHA> <CANON_VERSION>`
- `pnpm -w run r1:verify-evidence`

Exit criteria:
- Final evidence inventory is mechanically generated and tamper-evident at branch head.

### CP Dependencies and Handoffs

| Dependency | Owner | CP expectation |
|---|---|---|
| Backend contract truth | CX | Active proof-tool semantics are stable before CP freezes contracts |
| Frontend proof UX | CC | UI can exercise governed proof flows without bypassing the runtime |
| Truth ledger discipline | All agents | Status language updates only after evidence exists |
| Release candidate branch state | All agents | Final signoff uses branch-head gates, not stale intermediate runs |

### CP Explicitly Not Strict R1

The following stay out of strict R1 unless the frozen acceptance criteria are updated:

- 24/24 real handler closure
- broad new governed tools beyond the active proof set
- irreversible redaction workflow completion
- speculative manifest expansion
- broad runtime work that does not improve release-critical proof or gate integrity

### CP Definition of Done

The governance-runtime lane is done for R1 only when all of the following are true:

- The 5 release-critical governed tools have frozen, aligned contracts.
- Handler and trace behavior for active release flows is test-backed and reproducible.
- AC-1 through AC-11 are evidenced through governed proof, not narrative.
- Required gates are green at branch head.
- Anything beyond the release-proof set is tagged `Post-R1`, not smuggled into R1 by manifest size.

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

## Phase 6A - Evidence Verifier and Final Manifest Gate

Goal: make the release evidence gate deterministic, lane-contained, and tamper-evident.

### Minimum Success Criteria

- Runs with plain Node; no TypeScript runtime assumptions.
- Validates required signoff metadata fields.
- Enforces the same verified branch-head SHA across CC, CX, and CP.
- Enforces the same canon version across CC, CX, and CP.
- Resolves links in each `signoff.md` as repo-relative or signoff-relative.
- Verifies linked files exist.
- Restricts evidence links to `docs/evidence/<lane>/...` or `docs/evidence/final/...`.
- Optionally validates `docs/evidence/final/manifest.json` and SHA256 hashes when present.

### Parallel Agent Assignment

| Track | Owner | Scope | Deliverable | Can run in parallel with |
|---|---|---|---|---|
| `CP-EVID-01` | CP | verifier runtime | `tools/r1/verify-evidence.mjs` in plain `.mjs` Node form | `CC-EVID-01`, `CX-EVID-01` |
| `CP-EVID-02` | CP | manifest generator | `tools/r1/generate-final-manifest.mjs` with SHA256 inventory generation | `CC-EVID-01`, `CX-EVID-01` |
| `CP-EVID-03` | CP | gate wiring | root `package.json` scripts and Final Verification Gate / CI insertion | `CC-EVID-01`, `CX-EVID-01` |
| `CC-EVID-01` | CC | lane signoff | `docs/evidence/cc/signoff.md` with valid metadata and lane-contained links | `CP-EVID-01`, `CP-EVID-02`, `CX-EVID-01` |
| `CX-EVID-01` | CX | lane signoff | `docs/evidence/cx/signoff.md` with valid metadata and lane-contained links | `CP-EVID-01`, `CP-EVID-02`, `CC-EVID-01` |
| `CP-EVID-04` | CP | lane signoff | `docs/evidence/cp/signoff.md` with valid metadata and lane-contained links | `CC-EVID-01`, `CX-EVID-01` |
| `ALL-EVID-01` | CC + CX + CP | branch-head converge | same verified branch-head SHA and canon version across all signoffs | after lane signoffs exist |
| `ALL-EVID-02` | CC + CX + CP | final branch-head verify | manifest generation plus evidence verification on the release candidate | after `ALL-EVID-01` |

### Final Verification Gate Additions

- Generate final manifest at the verified branch head:
  - `pnpm -w run r1:finalize-manifest <BRANCH_HEAD_SHA> <CANON_VERSION>`
- Verify evidence gate:
  - `pnpm -w run r1:verify-evidence`

### Regression Defense

- No TS-runtime reliance in the verifier or generator.
- No link-authoring ambiguity: repo-relative and signoff-relative are both supported.
- Same-SHA enforcement is hard.
- Same-canon enforcement is hard.
- Optional manifest validation becomes tamper-evident inventory when present.

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
