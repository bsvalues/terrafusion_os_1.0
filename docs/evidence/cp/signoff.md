# CP Lane R1 Release Evidence -- Signoff

- Lane: cp
- Lane branch name: claude/review-progress-ledger-a8iw5
- Lane branch HEAD SHA (pre-merge): 6ff009ae4005635e4afb87e61f3fe2ce88b70545
- Merge commit SHA (into r1/integration): 0111b25ddabd3c4ab5ec89aefd307d1c50d630cc
- Baseline r1/integration SHA used for lane work: 81577b071e5ac6aeaa1fb781e805ee9c3a4a7cd6
- Final branch-head SHA used for verification: 210071157d5e756f5920113472522ef4c3d50928
- Date (local): 2026-03-07
- Verified by: Claude Code (CP lane agent)
- Command canon version: r1-canon-2026-03-07

---

## Evidence Artifacts

- [Handler Registry](./handler-registry.md) -- 10 real handlers registered via `registerR1Handlers()`, 14 stub handlers deferred post-R1, contract alignment with R1_DAY0_CONTRACTS.md and INVOKE_CONTRACT.md
- [Trace Persistence](./trace-persistence.md) -- CP-7 decision: FileTraceStore (append-only JSONL) for R1, TraceService emit/query/getByCorrelationId delegation, county isolation, PilotController endpoints, 24 new tests
- [Governance Contracts](./governance-contracts.md) -- Frozen R1_DAY0_CONTRACTS.md, INVOKE_CONTRACT.md, ROLE_VOCABULARY.md, ToolRunner enforcement (Gates 4-6), PilotController governed invoke surface, RiskConfirmationModal integration
- [R1 Proof Tools](./r1-proof-tools.md) -- 5-tool proof set (run_valuation_model, explain_value_change, search_trace_by_correlation, summarize_levy_rate_components, summarize_parcel_casefile), AC-1 through AC-11 status, Phase 6 readiness

---

## Completed Items

- **CP-FORGE-01** (Contract Alignment): All real handlers in `handlers.real.ts` call backend endpoints matching the frozen Contract 2 shapes in R1_DAY0_CONTRACTS.md. CostForge, Levy Calculation, Dossier, and Atlas endpoint paths and request/response shapes are aligned.
- **CP-DOS-01** (Dossier Handler Validation): `summarize_parcel_casefile` (handler #8) and `add_dossier_note` (handler #9) call real Dossier backend endpoints. Casefile handler uses `payload_ref` PII handling. Note handler validates content length (2000 char limit) and requires non-empty content.
- **CP-ATL-01** (Atlas Architecture Decision): `query_parcel_layers` (handler #10) calls `GET /api/atlas/parcels/{parcelId}/layers`. Supports client-side layer filtering and configurable format output. Atlas endpoint shape matches R1_DAY0_CONTRACTS Contract 2 skeleton.
- **CP-HARD-01** (Contract Alignment Post-Hardening): After hardening, all error codes in ToolRunner match the INVOKE_CONTRACT ERROR_CODES table exactly (12 codes). RBAC enforcement uses ROLE_VOCABULARY claims mapping. Preflight policy gate integrated into enforcement pipeline.

---

## Gate Results

- **Type-check**: Clean (no TypeScript errors in `os-platform/core/pilot/` or `os-platform/core/trace/`)
- **Phase 83**: 32/32 passing -- core tool registry, handler registration, basic invocation
- **Phase 85**: 20/20 passing -- full enforcement pipeline (Gates 4-6, RBAC, trace emission)
- **Phase 86**: 7/7 passing -- write-gate governance (write_high + irreversible tools)

---

## Phase 6 Readiness

5 tools ready for governed proof:

1. `run_valuation_model` -- write_high, POST /api/costforge/calculate
2. `explain_value_change` -- read_only, GET /api/properties/{id}
3. `search_trace_by_correlation` -- read_only, TraceService.getByCorrelationId()
4. `summarize_levy_rate_components` -- read_only, POST /api/levy-calculation/calculate-rate
5. `summarize_parcel_casefile` -- read_only, GET /api/dossier/parcels/{parcelId}/casefile

Acceptance criteria AC-1 through AC-11 are structurally met:

- AC-1: All 5 proof tools have real handlers registered
- AC-2: Each handler calls a real backend endpoint (or in-process service)
- AC-3: County isolation enforced on every handler via assertCountyMatch()
- AC-4: Correlation ID propagated end-to-end (ToolRunner -> trace -> response)
- AC-5: Trace events emitted for invoke/complete/fail on all paths
- AC-6: Risk policy enforced for write_high tools (confirmation + reasonCode)
- AC-7: PII handling follows trace policy (sanitize or payload_ref per tool)
- AC-8: Error codes match INVOKE_CONTRACT (12 frozen codes)
- AC-9: Response shape matches frozen PilotInvokeResponse contract
- AC-10: Canned stubs overridden by real handlers (not removed)
- AC-11: RBAC enforced per ROLE_VOCABULARY claim mappings

Pending: live smoke test against running backend services.
