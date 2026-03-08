# R1 Master Execution Ledger
# ═══════════════════════════
# Date: March 7, 2026
# Branch: r1/integration
# Scope Authority: R1_END_TO_END_EXECUTION_PLAN_2026-03-07.md (Plan 1)
# Task Engine: R1_E2E_EXECUTION_PLAN.md (Plan 2)
# Truth Source: PROGRESS_TRUTH_LEDGER.md v3

## Governance

**Plan 1** (docs/planning/R1_END_TO_END_EXECUTION_PLAN_2026-03-07.md) is the
constitutional scope authority. It defines what "R1 done" means:

> At least 5 tools run from UI through `POST /pilot/invoke` to real backend logic
> and back to the UI with trace evidence. Forge no longer depends on client-side
> calculator. Atlas and Dossier active workbench tabs use real data. Core gates green.
> Fake-path elimination proven. AC-1 through AC-11 executed.

**Plan 2** (docs/R1_E2E_EXECUTION_PLAN.md) is the task engine. It provides ticket IDs,
dependencies, acceptance tests, and wave sequencing. But Plan 2 contains scope that
exceeds Plan 1's R1 boundary.

**This document merges them** by classifying every Plan 2 ticket against Plan 1's
scope boundary, then providing the correct execution sequence.

---

# Section A — R1 Closure Constitution

Taken directly from Plan 1. These are the immutable R1 exit conditions.

### R1 North Star
- **5 proven tools** through governed path with real data and trace evidence
- **Forge cutover** — no production valuation path depends on client-side calculator
- **Atlas honesty** — active workbench path uses real backend data
- **Dossier honesty** — active sections real or explicitly disabled by contract
- **Backend hardening** — no auth gaps on active R1 surface
- **Fake-path elimination** — targeted grep zero on active production surfaces
- **AC-1 through AC-11** — executed and recorded with evidence
- **Gates green** — type-check, phase83, phase85, phase86

### 5 Required Proof Tools
1. `run_valuation_model`
2. `explain_value_change`
3. `search_trace_by_correlation`
4. `summarize_levy_rate_components`
5. `summarize_parcel_casefile`

### Evidence Packet Shape (per PR)
1. Scope statement: what active production path changed
2. Source proof: file references and endpoints touched
3. Gate proof: type-check, phase83, phase85, phase86
4. Runtime proof: correlation IDs, trace IDs, payload samples
5. Fake-path proof: targeted grep result
6. Remaining truth: what is still partial or deferred

---

# Section B — Wave Execution Ledger

Every ticket from Plan 2, preserved with its wave/dependency structure,
now classified by scope.

## Scope Key

| Tag | Meaning |
|-----|---------|
| **R1-Required** | Must be done for R1 release per Plan 1's north star |
| **R1-Optional** | Valuable if time permits; not release-blocking |
| **Post-R1** | Explicitly outside R1 scope; do not start until R1 exits |

---

## Phase 0 — Security & Cleanup

| Ticket | Agent | Summary | Scope | Rationale |
|--------|-------|---------|-------|-----------|
| CX-W0-01 | CX | `[Authorize]` on PropertyValuationController | **R1-Required** | Plan 1 Phase 4: CX-HARD-01 |
| CX-W0-02 | CX | Remove QuantumMetricsBackgroundService | **R1-Required** | Plan 1 Phase 4: CX-HARD-03 |
| CX-W0-03 | CX | Add CostForge `/models/{modelId}` endpoint | **R1-Optional** | Handler #6 (`explain_model_inputs`) calls it, but this tool is not in the 5-proof set. Plan 1 puts it at R1.1 |
| CP-W0-04 | CP | Wire auth token into `useApi.ts` | **R1-Optional** | Real: `atlasService.ts`/`dossierService.ts` already inject bearer tokens directly. `useApi.ts` placeholder doesn't block R1 active surfaces |
| CC-W0-05 | CC | Fix hardcoded countyId/userId in PropertyWorkbenchWindow | **R1-Required** | Fake-path in active production surface |
| CC-W0-06 | CC | Fix hardcoded security ctx in QuantumModuleManager | **R1-Optional** | QuantumModuleManager is infrastructure, not active R1 production surface |

---

## Phase 1 — Forge Full Cutover

| Ticket | Agent | Summary | Scope | Rationale |
|--------|-------|---------|-------|-----------|
| CC-FORGE-01 | CC | Rewrite `forgeService.ts` — remove client-side calc/localStorage | **R1-Required** | Plan 1 Phase 1: THE BIG ONE |
| CC-FORGE-02 | CC | Wire Forge workbench → ExecutionConsole → governed response | **R1-Required** | Plan 1 Phase 1: end-to-end governed flow |
| CC-FORGE-03 | CC | Preserve types, remove legacy production behavior | **R1-Required** | Plan 1 Phase 1 |
| CC-FORGE-04 | CC | Remove Benton-only silent fallbacks | **R1-Required** | Plan 1 Phase 1 |
| CP-FORGE-01 | CP | Confirm `run_valuation_model` contract alignment | **R1-Required** | Tool #1 in 5-proof set |
| CP-FORGE-02 | CP | Capture correlation ID + trace evidence for Forge flow | **R1-Required** | Evidence packet for tool #1 |
| CP-FORGE-03 | CP | Ensure tool metadata exposes reason-code/risk to UI | **R1-Required** | Governance enforcement |
| CX-FORGE-01 | CX | Two-parcel CostForge proof (different results) | **R1-Required** | CX-8 acceptance test |
| CX-FORGE-02 | CX | Verify auth + county isolation on Forge routes | **R1-Required** | Plan 1 Phase 4 |
| CX-FORGE-03 | CX | Document live Forge endpoint contract | **R1-Required** | CX-HARD-04 |
| CX-W1-02 | CX | CostForge batch-calculate real impl | **Post-R1** | Not in 5-proof set; single-property is live |

---

## Phase 2 — Dossier Completion

| Ticket | Agent | Summary | Scope | Rationale |
|--------|-------|---------|-------|-----------|
| CC-DOS-01 | CC | Remove stale "not wired" from active Dossier tab | **R1-Required** | Plan 1 Phase 2 |
| CC-DOS-02 | CC | Replace/quarantine mock-labeled doc-management slice | **R1-Required** | Plan 1 Phase 2 |
| CC-DOS-03 | CC | Surface evidence snapshot correlation in UI | **R1-Required** | Plan 1 Phase 2 |
| CP-DOS-01 | CP | Validate Dossier governed tools match live backend | **R1-Required** | Tool #5 (`summarize_parcel_casefile`) is in 5-proof set |
| CP-DOS-02 | CP | Smoke path: dossier note + casefile + evidence proof | **R1-Required** | Evidence packet for tool #5 |
| CX-DOS-01 | CX | Close gap between dossier endpoints and active UI needs | **R1-Required** | Plan 1 Phase 2: CX-DOS-01 |
| CX-DOS-02 | CX | If doc-management not R1, return explicit disabled contract | **R1-Required** | Plan 1 Phase 2: CX-DOS-02 |
| CX-W3-02 | CX | Full document management backend (upload/list/delete) | **Post-R1** | Plan 1 explicitly says "real backend or explicit disabled contract" — disabled is acceptable for R1 |

---

## Phase 3 — Atlas Completion

| Ticket | Agent | Summary | Scope | Rationale |
|--------|-------|---------|-------|-----------|
| CC-ATL-01 | CC | Atlas workbench uses real endpoints only | **R1-Required** | Plan 1 Phase 3 |
| CC-ATL-02 | CC | Render real parcel/layer data, even if non-GIS-native | **R1-Required** | Plan 1 Phase 3 |
| CC-ATL-03 | CC | Present unsupported GIS depth honestly | **R1-Required** | Plan 1 Phase 3 |
| CP-ATL-01 | CP | Decide if any Atlas tool belongs in governed path for R1 | **R1-Required** | Plan 1 Phase 3: architecture decision |
| CX-ATL-01 | CX | Verify Atlas response shape sufficient for active UI | **R1-Required** | Plan 1 Phase 3 |
| CX-ATL-02 | CX | Extend Atlas only where active UI truly needs it | **R1-Required** | Plan 1 Phase 3 |

---

## Phase 4 — Backend Hardening & Theater Cleanup

| Ticket | Agent | Summary | Scope | Rationale |
|--------|-------|---------|-------|-----------|
| CX-HARD-01 | CX | `[Authorize]` on PropertyValuationController | **R1-Required** | = CX-W0-01 (same work, listed here for Plan 1 alignment) |
| CX-HARD-02 | CX | Audit write-capable R1 routes for auth + county | **R1-Required** | Plan 1 Phase 4 |
| CX-HARD-03 | CX | Remove/justify QuantumMetricsBackgroundService | **R1-Required** | = CX-W0-02 |
| CX-HARD-04 | CX | Publish authoritative endpoint matrix for R1 routes | **R1-Required** | Plan 1 Phase 4 |
| CP-HARD-01 | CP | Keep core contracts aligned after hardening changes | **R1-Required** | Plan 1 Phase 4 |

---

## Phase 5 — Fake-Path Elimination

| Ticket | Agent | Summary | Scope | Rationale |
|--------|-------|---------|-------|-----------|
| CC-FAKE-01 | CC | Remove fake-path strings from active production surfaces | **R1-Required** | Plan 1 Phase 5 |
| CC-FAKE-02 | CC | Replace future scope with explicit "not yet available" UX | **R1-Required** | Plan 1 Phase 5 |
| CP-FAKE-01 | CP | Add smoke/contract checks that fail on fake-path regression | **R1-Required** | Plan 1 Phase 5 |
| CX-FAKE-01 | CX | Replace backend stubs on active R1 endpoints or mark disabled | **R1-Required** | Plan 1 Phase 5 |
| CC-W5-01 | CC | Replace security-plugin stub with real Vite plugin | **R1-Optional** | Dev-only Vite plugin; prod headers come from gateway |
| CC-W5-03 | CC | Wire MetricsCollector storage backends | **Post-R1** | Infrastructure improvement, not active R1 surface |
| CC-W5-04 | CC | Global fake-path grep zero (all frontend files) | **R1-Optional** | Plan 1 scopes to "targeted production surfaces," not all files |

---

## Phase 6 — Governed Proof & Release Evidence

| Ticket | Agent | Summary | Scope | Rationale |
|--------|-------|---------|-------|-----------|
| ALL-PROOF-01 | All | Run 5-tool governed proof, capture correlation IDs | **R1-Required** | Plan 1 Phase 6 |
| ALL-PROOF-02 | All | Execute AC-1 through AC-11, record evidence | **R1-Required** | Plan 1 Phase 6 |
| ALL-PROOF-03 | All | Fresh gate run on release candidate | **R1-Required** | Plan 1 Phase 6 |
| ALL-PROOF-04 | All | Update truth ledger AFTER proofs, not before | **R1-Required** | Plan 1 Phase 6 |

---

## Phase 6A — Evidence Verifier & Final Manifest Gate

**Status: SHIPPED** (March 7, 2026 — Co-Founder + CP)

The evidence verification framework is now live and deterministic:

| Ticket | Agent | Summary | Scope | Status |
|--------|-------|---------|-------|--------|
| CP-R1-06 | CP | Evidence verifier: plain .mjs, signoff-relative links, lane containment | **R1-Required** | **DONE** |
| CP-R1-07 | CP | Final manifest generator + SHA256 tamper-evidence | **R1-Required** | **DONE** |

### Delivered Artifacts

| File | Purpose |
|------|---------|
| `tools/r1/verify-evidence.mjs` | Deterministic evidence verifier — validates metadata fields, SHA consistency, canon version, link containment, file existence, optional manifest |
| `tools/r1/generate-final-manifest.mjs` | Generates `docs/evidence/final/manifest.json` with SHA256 hashes for all evidence artifacts |
| `docs/evidence/cc/signoff.md` | CC lane signoff template (metadata skeleton) |
| `docs/evidence/cx/signoff.md` | CX lane signoff template (metadata skeleton) |
| `docs/evidence/cp/signoff.md` | CP lane signoff template (metadata skeleton) |
| `docs/evidence/final/.gitkeep` | Final evidence directory (holds manifest.json at release) |

### Canonical Scripts (root package.json)

```bash
pnpm -w run r1:verify-evidence              # Validate all lane signoffs
pnpm -w run r1:finalize-manifest <SHA> <VER> # Generate tamper-evident manifest
```

### Evidence Verifier Enforces

1. Required signoff metadata fields per lane
2. Same `Final branch-head SHA` across CC/CX/CP
3. Same `Command canon version` across CC/CX/CP
4. Links resolve (repo-relative OR signoff-relative `./...`)
5. All linked files exist on disk
6. Links stay contained to `docs/evidence/<lane>/...` or `docs/evidence/final/...`
7. Optional: validates `docs/evidence/final/manifest.json` with SHA256 integrity checks

### Final Verification Gate Addition

At branch-head verification, add:
```bash
# 1. Generate manifest (at verified branch-head)
pnpm -w run r1:finalize-manifest <BRANCH_HEAD_SHA> <CANON_VERSION>

# 2. Verify evidence gate
pnpm -w run r1:verify-evidence
```

---

## Explicitly Post-R1 (Plan 2 tickets downgraded)

These Plan 2 tickets are valuable but outside strict R1 scope per Plan 1:

| Ticket | Agent | Summary | Why Post-R1 |
|--------|-------|---------|-------------|
| CX-W1-02 | CX | CostForge batch-calculate | Single-property is live; batch is convenience |
| CX-W2-01 | CX | Full PiltController rewrite with real PILT calc | Plan 1: "real backend or explicit out-of-R1 disablement" — disable is acceptable |
| CC-W2-02 | CC | Update piltService.ts validation | Depends on CX-W2-01 |
| CX-W3-01 | CX | DaisController (7 endpoints) | Plan 1 puts all Dais stub tools at Post-R1 |
| CX-W3-02 | CX | Dossier document management backend | Plan 1 accepts "disabled contract" |
| CX-W4-05 | CX | CostForge sales comps endpoint | `summarize_sales_comps_rationale` not in 5-proof set |
| CP-W4-01 | CP | Wire 8 Dais tool handlers | All Dais stub tools are Post-R1 |
| CP-W4-02 | CP | Wire 2 remaining Forge handlers | `explain_model_results` and `summarize_sales_comps_rationale` not in 5-proof set |
| CP-W4-03 | CP | Wire 2 remaining Dossier handlers | `summarize_dossier` and `synthesize_evidence` not in 5-proof set |
| CP-W4-04 | CP | Wire 2 OS handlers (memo + redaction) | Both are Post-R1 per Plan 1 manifest |
| CP-W6-02 | CP | Bump manifest to 24/24 | Not required for R1 (10/24 is sufficient with 5-proof) |
| CC-W5-03 | CC | MetricsCollector storage backends | Infrastructure, not R1 surface |
| CX-W6-01 | CX | Full ENDPOINT_CONTRACTS.md | R1 only needs CX-HARD-04 (endpoint matrix for R1 routes), not all routes |

---

# Section C — Scope Classification Summary

## R1-Required Tickets by Agent

### CP (Copilot) — 9 R1-Required tickets

| ID | Phase | Deliverable |
|----|-------|-------------|
| CP-FORGE-01 | 1 | Confirm `run_valuation_model` contract alignment handler↔frontend |
| CP-FORGE-02 | 1 | Capture Forge proof: correlation ID + trace evidence artifact |
| CP-FORGE-03 | 1 | Ensure tool metadata exposes reason-code/risk to UI cleanly |
| CP-DOS-01 | 2 | Validate Dossier governed tools match live backend |
| CP-DOS-02 | 2 | Smoke path: dossier note + casefile + evidence snapshot proof |
| CP-ATL-01 | 3 | Architecture decision: Atlas governed tool inclusion for R1 |
| CP-HARD-01 | 4 | Keep core contracts aligned after backend hardening |
| CP-FAKE-01 | 5 | Add smoke/contract checks that fail on fake-path regression |
| + share | 6 | ALL-PROOF-01 through ALL-PROOF-04 |

### CC (Claude Code) — 13 R1-Required tickets

| ID | Phase | Deliverable |
|----|-------|-------------|
| CC-W0-05 | 0 | Fix hardcoded countyId/userId in PropertyWorkbenchWindow |
| CC-FORGE-01 | 1 | Rewrite forgeService.ts — remove client-side calc/localStorage |
| CC-FORGE-02 | 1 | Wire Forge → ExecutionConsole → governed response |
| CC-FORGE-03 | 1 | Preserve types, remove legacy production behavior |
| CC-FORGE-04 | 1 | Remove Benton-only silent fallbacks |
| CC-DOS-01 | 2 | Remove stale "not wired" from active Dossier tab |
| CC-DOS-02 | 2 | Replace/quarantine mock-labeled doc-management slice |
| CC-DOS-03 | 2 | Surface evidence snapshot correlation in UI |
| CC-ATL-01 | 3 | Atlas workbench uses real endpoints only |
| CC-ATL-02 | 3 | Render real parcel/layer data |
| CC-ATL-03 | 3 | Present unsupported GIS depth honestly |
| CC-FAKE-01 | 5 | Remove fake-path strings from active production |
| CC-FAKE-02 | 5 | Replace future scope → "not yet available" UX |

### CX (Codex) — 12 R1-Required tickets

| ID | Phase | Deliverable |
|----|-------|-------------|
| CX-W0-01 / CX-HARD-01 | 0/4 | `[Authorize]` on PropertyValuationController |
| CX-W0-02 / CX-HARD-03 | 0/4 | Remove/justify QuantumMetricsBackgroundService |
| CX-FORGE-01 | 1 | Two-parcel CostForge proof |
| CX-FORGE-02 | 1 | Verify auth + county isolation on Forge routes |
| CX-FORGE-03 | 1 | Document live Forge endpoint contract |
| CX-HARD-02 | 4 | Audit write-capable R1 routes for auth + county |
| CX-HARD-04 | 4 | Publish authoritative R1 endpoint matrix |
| CX-DOS-01 | 2 | Close dossier endpoint/UI gap |
| CX-DOS-02 | 2 | Return explicit disabled contract for non-R1 dossier features |
| CX-ATL-01 | 3 | Verify Atlas response shape for active UI |
| CX-ATL-02 | 3 | Extend Atlas only for active UI needs |
| CX-FAKE-01 | 5 | Replace backend stubs or mark disabled on active R1 endpoints |

---

## R1-Optional Tickets

| ID | Agent | Summary |
|----|-------|---------|
| CX-W0-03 | CX | CostForge `/models/{modelId}` endpoint (enables handler #6 but not in 5-proof) |
| CP-W0-04 | CP | Wire auth into `useApi.ts` (active services already inject auth directly) |
| CC-W0-06 | CC | Fix QuantumModuleManager hardcoded IDs |
| CC-W5-01 | CC | Replace security-plugin stub (dev-only) |
| CC-W5-04 | CC | Broad fake-path grep zero (beyond targeted surfaces) |

---

# Section D — Final Verification Gate

Single branch-head gate. All must pass for R1 release.

### Build Gates
```
pnpm run type-check                                           → pass
node --test os-platform/core/tests/phase83-tools.test.mjs     → all pass
node --test os-platform/core/tests/phase85-tools.test.mjs     → all pass
node --test os-platform/core/tests/phase86-toolrunner.test.mjs → all pass
dotnet build TerraFusion.sln                                   → success
dotnet test                                                    → all pass
```

### Fake-Path Grep (targeted R1 surfaces)
```
grep -rn "localStorage|COST_MATRIX|DEFAULT_RECONCILIATION|calculateCost|calculateIncome" \
  frontend/apps/os-shell/src/services/forgeService.ts                → 0
grep -rn "mock\|stub\|placeholder" \
  frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx → 0 in active sections
grep -rn "mock\|fallback" \
  frontend/apps/os-shell/src/services/atlasService.ts                → 0
grep -c "AllowAnonymous" \
  backend/src/TerraFusion.API/Controllers/PropertyValuationController.cs → 0
```

### 5-Tool Governed Proof
```
For each of: run_valuation_model, explain_value_change,
             search_trace_by_correlation, summarize_levy_rate_components,
             summarize_parcel_casefile

  POST /pilot/invoke { toolId, params, parcelId }
    → 200, ok: true, correlationId present
  GET /pilot/trace/{correlationId}
    → Paired events: tool_invoked + tool_succeeded
```

### Evidence Verifier Gate (Phase 6A — SHIPPED)
```bash
# Generate tamper-evident manifest at verified branch-head
pnpm -w run r1:finalize-manifest <BRANCH_HEAD_SHA> <CANON_VERSION>

# Verify all lane signoffs: metadata, SHA consistency, link containment, file existence
pnpm -w run r1:verify-evidence
```

### AC-1 through AC-11
Executed and recorded in evidence packet.

### Truth Ledger
Updated AFTER proofs, not before. Reflects final measured state.

---

# Section E — Copilot (CP) Detailed Execution Plan

This section is the detailed plan for **my agent** (Copilot). Each task includes
the exact files, the exact work, the verification method, and the dependency chain.

## CP Scope Boundary

Copilot owns `os-platform/core/**` (pilot, types, trace, tests, API surface).
Copilot's R1 job is:
1. Keep the governed invoke/trace spine stable and correct
2. Verify handler↔backend contract alignment for the 5-proof tools
3. Build the smoke/proof harness to capture evidence packets
4. Ensure governance gates (write-lane, risk, PII, reason-code) work end-to-end
5. Produce the final proof artifacts

Copilot does NOT build new backend endpoints (CX), new frontend UX (CC), or
wire new controllers. Copilot makes sure the governed path is honest.

---

### CP-FORGE-01: Confirm `run_valuation_model` contract alignment

**Phase:** 1 — Forge Full Cutover
**Scope:** R1-Required
**Depends:** CC-FORGE-01 (forgeService rewrite in progress or complete)

**What this is:**
The handler `run_valuation_model` in `handlers.real.ts` calls
`POST /api/costforge/calculate`. After CC rewrites `forgeService.ts`,
the frontend will route all production valuation through `pilotApi.invokeTool()`.
I need to verify that the request shape the UI sends matches what the handler
expects, which matches what CostForgeController accepts.

**Files:**
- `os-platform/core/pilot/handlers.real.ts` — handler implementation
- `tools/registry/terrapilot.tools.json` — `run_valuation_model` paramsSchema
- `tools/registry/INVOKE_CONTRACT.md` — frozen request/response shapes

**Work:**
1. Read the handler's `execute()` method and extract the exact params it destructures
2. Read the manifest `paramsSchema` for `run_valuation_model`
3. Read the `PilotInvokeRequest` shape from INVOKE_CONTRACT.md
4. Compare all three — handler params, manifest schema, contract shape
5. If any drift exists, fix the handler or update the manifest (NOT the frozen contract)
6. Write or update a contract test in `os-platform/core/tests/` that asserts:
   - Valid params → handler calls POST /api/costforge/calculate with correct body
   - Missing required params → handler rejects with `VALIDATION_ERROR`
   - Response shape matches `PilotInvokeResponse`

**Verification:**
```bash
node --test os-platform/core/tests/phase83-tools.test.mjs  # existing tests still pass
# + new contract test for run_valuation_model shape alignment
pnpm run type-check
```

---

### CP-FORGE-02: Capture Forge flow trace evidence

**Phase:** 1 — Forge Full Cutover
**Scope:** R1-Required
**Depends:** CP-FORGE-01, CC-FORGE-02 (UI wired to governed path)

**What this is:**
This is the proof artifact for tool #1 in the 5-proof set. I need to invoke
`run_valuation_model` through the governed path, capture the correlation ID,
query the trace store, and save the evidence.

**Files:**
- `os-platform/core/api/PilotController.ts` — invoke endpoint
- `os-platform/core/trace/TraceStore.ts` — where events land
- New: `os-platform/core/tests/proofs/forge-proof.ts` (or `.mjs`)

**Work:**
1. Create a proof script that:
   a. Calls `POST /pilot/invoke` with `{ toolId: "run_valuation_model", params: { parcelId: "<real-parcel>" } }`
   b. Asserts `ok: true` and `correlationId` present
   c. Calls `GET /pilot/trace/{correlationId}`
   d. Asserts paired events: `tool_invoked` and `tool_succeeded`
   e. Captures response payload, correlation ID, and trace chain as evidence artifact
2. The proof script should also exercise with a DIFFERENT parcel and assert
   materially different result values (aligns with CX-8 / CX-FORGE-01)

**Verification:**
```bash
node os-platform/core/tests/proofs/forge-proof.mjs
# Output: JSON evidence artifact with correlationId, payloads, trace events
```

**Evidence output shape:**
```jsonc
{
  "tool": "run_valuation_model",
  "parcel1": { "id": "...", "correlationId": "...", "result": {...}, "traceChain": [...] },
  "parcel2": { "id": "...", "correlationId": "...", "result": {...}, "traceChain": [...] },
  "valuesAreDifferent": true,
  "timestamp": "2026-03-...",
  "gateResults": { "typeCheck": "pass", "phase83": "32/32" }
}
```

---

### CP-FORGE-03: Ensure tool metadata exposes reason-code/risk to UI

**Phase:** 1 — Forge Full Cutover
**Scope:** R1-Required
**Depends:** nothing

**What this is:**
`run_valuation_model` has `risk: "write_high"` and `reasonCodeRequired: true` in the
manifest. The UI (CC's ExecutionConsole / RiskConfirmationModal) must receive this
metadata from `GET /pilot/tools` so it can enforce confirmation + reason-code.

**Files:**
- `tools/registry/terrapilot.tools.json` — manifest entries
- `os-platform/core/api/PilotController.ts` — `GET /pilot/tools` route
- `os-platform/core/pilot/ToolRegistry.ts` — manifest loading

**Work:**
1. Verify `GET /pilot/tools` response includes `risk`, `requiresConfirmation`,
   `reasonCodeRequired` for each tool
2. Verify `run_valuation_model` specifically has:
   - `risk: "write_high"`
   - `requiresConfirmation: true`
   - `reasonCodeRequired: true`
3. Write or update a test asserting the above
4. If any field is missing from the response shape, fix PilotController's
   serialization to include it

**Verification:**
```bash
# GET /pilot/tools response for run_valuation_model includes risk/confirm/reason fields
node --test os-platform/core/tests/phase83-tools.test.mjs
```

---

### CP-DOS-01: Validate Dossier governed tools match live backend

**Phase:** 2 — Dossier Completion
**Scope:** R1-Required
**Depends:** CX-DOS-01 (backend gap closed)

**What this is:**
`summarize_parcel_casefile` (handler #8) calls `GET /api/dossier/parcels/{parcelId}/casefile`.
`add_dossier_note` (handler #9) calls `POST /api/dossier/{parcelId}/notes`.
Both are real handlers. I need to verify the contract between handler and backend
is aligned after any CX hardening changes.

**Files:**
- `os-platform/core/pilot/handlers.real.ts` — handlers #8 and #9
- `tools/registry/terrapilot.tools.json` — paramsSchema for both tools

**Work:**
1. Read handler #8's request construction and compare against DossierController's
   casefile endpoint response shape
2. Read handler #9's request construction and compare against DossierController's
   notes POST endpoint expected body
3. If any drift between handler assumptions and controller reality, fix the handler
4. Add or update contract tests for both tools

**Verification:**
```bash
node --test os-platform/core/tests/phase83-tools.test.mjs
pnpm run type-check
```

---

### CP-DOS-02: Dossier smoke path proof

**Phase:** 2 — Dossier Completion
**Scope:** R1-Required
**Depends:** CP-DOS-01, CC-DOS-03 (UI displays evidence)

**What this is:**
Proof artifact for tool #5 in the 5-proof set. Same pattern as CP-FORGE-02.

**Files:**
- New: `os-platform/core/tests/proofs/dossier-proof.ts` (or `.mjs`)

**Work:**
1. Create a proof script that:
   a. Calls `POST /pilot/invoke` with `{ toolId: "summarize_parcel_casefile", params: { parcelId: "<real>" } }`
   b. Asserts `ok: true` and `correlationId` present
   c. Queries trace chain — asserts `tool_invoked` + `tool_succeeded`
   d. Optionally invokes `add_dossier_note` with `write_low` and captures governed write trace
   e. Captures evidence artifact

**Verification:**
```bash
node os-platform/core/tests/proofs/dossier-proof.mjs
# Output: evidence artifact with correlationId, casefile data, trace chain
```

---

### CP-ATL-01: Atlas governed tool architecture decision

**Phase:** 3 — Atlas Completion
**Scope:** R1-Required
**Depends:** nothing

**What this is:**
`query_parcel_layers` (handler #10) is a real handler calling
`GET /api/atlas/parcels/{parcelId}/layers`. Plan 1 asks: does any Atlas interaction
belong in the governed tool path for R1, or does it remain direct-service UI only?

**Files:**
- `os-platform/core/pilot/handlers.real.ts` — handler #10
- `tools/registry/terrapilot.tools.json` — `query_parcel_layers` entry

**Work:**
1. Assess: `query_parcel_layers` is `read_only` and already has a real handler.
   It CAN participate in governed proof but is not in the 5-proof minimum.
2. Decision: keep it as a real governed tool (it already is) but do NOT require
   it for R1 release proof. If time permits, include it as a 6th proof tool.
3. Record the decision in the PR description or a doc note.

**Verification:**
Architecture note committed or attached to PR.

---

### CP-HARD-01: Keep core contracts aligned after hardening

**Phase:** 4 — Backend Hardening
**Scope:** R1-Required
**Depends:** CX-HARD-01 through CX-HARD-04

**What this is:**
After CX hardens backends (adds auth, removes QuantumMetrics, publishes endpoint
matrix), I need to verify that the 10 existing real handlers still work — none
should break from auth changes or endpoint adjustments.

**Files:**
- `os-platform/core/pilot/handlers.real.ts`
- `os-platform/core/tests/phase83-tools.test.mjs`

**Work:**
1. Re-run all handler contract tests
2. If any handler now gets 401 because CX added auth, update the handler's
   fetch call to include auth headers (following the existing pattern)
3. If `QuantumMetrics` removal changed any endpoint or startup behavior,
   verify trace and pilot endpoints still respond

**Verification:**
```bash
node --test os-platform/core/tests/phase83-tools.test.mjs  # 32/32
node --test os-platform/core/tests/phase85-tools.test.mjs  # 20/20
node --test os-platform/core/tests/phase86-toolrunner.test.mjs  # 7/7
pnpm run type-check
```

---

### CP-FAKE-01: Smoke checks that fail on fake-path regression

**Phase:** 5 — Fake-Path Elimination
**Scope:** R1-Required
**Depends:** CC-FAKE-01 (fake paths removed from frontend)

**What this is:**
After CC removes fake paths, I need to add or tighten checks so they don't
regress. This means:
- Handler-level: invoking a tool should never return data with canned/stub markers
- Contract-level: responses should match real backend shapes, not hardcoded fixtures

**Files:**
- `os-platform/core/tests/` — test suite
- Possibly `os-platform/core/pilot/handlers.real.ts` — if any handler still
  has a canned fallback path

**Work:**
1. Grep `handlers.real.ts` for any remaining `canned`, `stub`, `mock`, `fallback`
   patterns in the 10 real handlers
2. If found, remove the fake fallback — real handlers should fail honestly, not
   silently fake
3. Add a test that asserts: for each of the 5 proof tools, invoke → response does
   NOT contain canned fixture markers
4. Add to the test suite so it runs in CI

**Verification:**
```bash
grep -n "canned\|stub\|mock\|fallback" os-platform/core/pilot/handlers.real.ts → 0 (in real handler functions)
node --test os-platform/core/tests/phase83-tools.test.mjs  # includes new anti-regression checks
```

---

### CP Contribution to Phase 6 Proofs

**Phase:** 6 — Governed Proof & Release Evidence
**Scope:** R1-Required

**What this is:**
Copilot coordinates the final proof assembly. The proof scripts from CP-FORGE-02
and CP-DOS-02 are run. Additionally, proofs for tools #2, #3, and #4 are needed:

- Tool #2: `explain_value_change` — same pattern as forge-proof
- Tool #3: `search_trace_by_correlation` — invoke with a known correlationId
- Tool #4: `summarize_levy_rate_components` — invoke with levy params

**Files:**
- `os-platform/core/tests/proofs/` — all proof scripts
- New: `os-platform/core/tests/proofs/five-tool-proof.ts` (orchestrator)

**Work:**
1. Create individual proof scripts for tools #2, #3, #4 following the same
   pattern as forge-proof and dossier-proof
2. Create an orchestrator that runs all 5, collects evidence, and outputs
   a single R1 evidence packet
3. Run the packet, review results
4. Attach to the release PR

**Evidence output:**
```jsonc
{
  "r1ProofDate": "2026-03-...",
  "tools": [
    { "toolId": "run_valuation_model", "correlationId": "...", "ok": true, "traceChain": [...] },
    { "toolId": "explain_value_change", "correlationId": "...", "ok": true, "traceChain": [...] },
    { "toolId": "search_trace_by_correlation", "correlationId": "...", "ok": true, "traceChain": [...] },
    { "toolId": "summarize_levy_rate_components", "correlationId": "...", "ok": true, "traceChain": [...] },
    { "toolId": "summarize_parcel_casefile", "correlationId": "...", "ok": true, "traceChain": [...] }
  ],
  "gates": { "typeCheck": "pass", "phase83": "32/32", "phase85": "20/20", "phase86": "7/7" },
  "fakePathGrep": { "forgeService": 0, "atlasService": 0, "dossierService": 0 }
}
```

---

## CP Execution Sequence (Critical Path)

```
Phase 0:  (nothing R1-Required for CP in Phase 0)
              ↓
Phase 1:  CP-FORGE-03 (tool metadata — no deps, start immediately)
          CP-FORGE-01 (contract alignment — needs CC-FORGE-01 in flight)
          CP-FORGE-02 (proof artifact — needs CP-FORGE-01 + CC-FORGE-02)
              ↓
Phase 2:  CP-DOS-01 (contract check — needs CX-DOS-01)
          CP-DOS-02 (proof artifact — needs CP-DOS-01 + CC-DOS-03)
              ↓
Phase 3:  CP-ATL-01 (architecture decision — no deps, can overlap Phase 2)
              ↓
Phase 4:  CP-HARD-01 (contract stability — needs CX-HARD-* done)
              ↓
Phase 5:  CP-FAKE-01 (regression checks — needs CC-FAKE-01)
              ↓
Phase 6:  ALL-PROOF-01..04 (final proof assembly)
```

**What I can start right now (zero dependencies):**
- CP-FORGE-03: Verify tool metadata exposure in `GET /pilot/tools`
- CP-ATL-01: Architecture decision on Atlas governed tool inclusion

---

*Classification: Internal execution plan*
*Scope authority: docs/planning/R1_END_TO_END_EXECUTION_PLAN_2026-03-07.md*
*Task engine: docs/R1_E2E_EXECUTION_PLAN.md*
*Truth source: docs/PROGRESS_TRUTH_LEDGER.md v3*
