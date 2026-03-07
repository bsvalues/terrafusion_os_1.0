# R1 Release Closeout

**Date:** March 7, 2026
**Certified SHA:** `9f090b37d` (branch: `claude/review-progress-ledger-a8iw5`)
**Gate Suite:** 81/81 pass (phase83: 32/32, phase85: 20/20, phase86: 7/7, AC: 22/22)
**Evidence:** Three-lane signoff (CC/CX/CP) with SHA256 tamper-evident manifest

---

## What Is Real Now

### Governance Spine
- **PilotController** — `/pilot/invoke`, `/pilot/traces`, `/pilot/traces/export`, `/pilot/traces/stats`, `/pilot/trace/:correlationId`
- **ToolRunner** — write-lane enforcement, risk classification, PII guard, county isolation
- **TraceStore** — file-backed append-only JSONL (SQLite/Drizzle deferred to R2)
- **Correlation ID middleware** — all responses carry correlation headers

### Tool Manifest (24/24 Real Handlers)
All 24 manifest tools have real backend-calling handlers in `handlers.real.ts`:
- **Forge:** `run_valuation_model`, `explain_value_change`, `explain_model_inputs`, `compare_assessed_value_history`, `explain_model_results`, `summarize_sales_comps_rationale`
- **Atlas:** `query_parcel_layers`
- **Dossier:** `summarize_parcel_casefile`, `add_dossier_note`, `summarize_dossier`, `synthesize_evidence`
- **Dais:** `summarize_levy_rate_components`, `assign_task`, `check_cert_status`, `assemble_boe_packet`, `draft_notice`, `draft_appeal_response`, `draft_value_change_notice`, `draft_boe_appeal_response`, `explain_senior_exemption_impact`, `generate_commissioner_memo`, `request_trace_redaction`
- **OS:** `route_to_parcel`, `search_trace_by_correlation`

### Backend Controllers (All Secured)
| Controller | `[Authorize]` | County Isolation | Data Source |
|-----------|--------------|-----------------|-------------|
| CostForgeController | YES + `[RequiresPermission]` | YES | EF Core + ICostForgeAIService |
| AtlasController | YES + `[RequiresPermission]` | YES | EF Core Properties |
| DossierController | YES + `[RequiresPermission]` | YES | EF Core + real services |
| LevyCalculationController | YES (Roles) | YES | EF Core TaxLevies |
| DaisController | YES + `[RequiresPermission]` | YES | EF Core + county-scoped |
| PropertyValuationController | YES + `[RequiresPermission]` | YES | IPropertyValuationAIEnhancementService |
| PiltController | YES + `[RequiresPermission]` | YES (JWT claims) | County-scoped reference data |

### Frontend Governed Surfaces
- **ForgeExecutionPanel** — governed `run_valuation_model` through pilotApi (sole production path)
- **PropertyDossier** — Section 1 real (parcel details), Section 2 disabled ("coming in R2")
- **PropertyAtlas** — real `query_parcel_layers`, SVG labeled as schematic
- **ExecutionConsole, EvidenceRail, ContextRibbon, PolicyGuardUI, RiskConfirmationModal** — all real

### Evidence Packets
- CC lane: 5 artifacts (surface-inventory, forge-cutover, dossier-cutover, atlas-cutover, fake-path-elimination)
- CX lane: 3 artifacts (backend-hardening, endpoint-matrix, auth-audit)
- CP lane: 4 artifacts (handler-registry, trace-persistence, governance-contracts, r1-proof-tools)
- Final manifest: 14 artifacts with SHA256 tamper-evident hashes

---

## What Is Deferred

| Item | Reason | Target |
|------|--------|--------|
| Full CAMA cost matrices | Forge has simplified backend math, not real Marshall & Swift data | R2 Wave 1 (extract from terra-flow quarantine) |
| Income approach, sales comparison, reconciliation | Not yet extracted from quarantine | R2 Wave 1 |
| Real GIS / ArcGIS integration | Atlas is parcel-geometry-only, not full map workflows | R2 Wave 2 (extract from terrafusion-atlas quarantine) |
| PILT real calculator | Auth + county isolation added, data is reference-only | R2 Wave 3 (extract from terra-flow quarantine) |
| Permit, appeal, cert, notice, queue workflows | DaisController has scaffolding, needs real domain logic | R2 Wave 3 |
| Document management backend | Dossier details/notes/casefile real, doc mgmt disabled | R2 Wave 4 |
| Harris PACS sync | Intentional stub per CLAUDE.md county approval requirement | Requires county authorization |
| Trace persistence upgrade (JSONL → SQLite) | File-backed works for R1 scale | R2 |
| Deprecated client-side calculator in forgeService.ts | Retained for offline/preview, not production | Remove when R2 backend has full CAMA depth |

---

## R1 Acceptance Criteria (All Passed)

- **AC-1:** Governed invocation produces correlation ID
- **AC-2:** Trace capture persists to durable store
- **AC-3:** Write-lane enforcement blocks unauthorized writes
- **AC-4:** Risk classification gates high-risk operations
- **AC-5:** PII guard prevents sensitive data in traces
- **AC-6:** County isolation enforced on all data access
- **AC-7:** Evidence export produces verifiable artifacts
- **AC-8:** Forge governed path is sole production valuation flow
- **AC-9:** Atlas/Dossier surfaces are honest (real or explicitly disabled)
- **AC-10:** Backend controllers have auth + county enforcement
- **AC-11:** Gate suite passes (81/81)

---

## Next: R1.1 → R2

R1 proved the governed architecture. The next phase is **domain enrichment by extraction** from the quarantine app inventory — not more scaffold-building. See `docs/planning/R1_END_TO_END_EXECUTION_PLAN_2026-03-07.md` for the full Beyond R1 backlog.

---

*Classification: Release document*
*Verified by: Evidence verifier (`tools/r1/verify-evidence.mjs`)*
