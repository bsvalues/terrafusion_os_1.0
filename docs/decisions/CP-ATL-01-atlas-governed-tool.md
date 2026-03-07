# CP-ATL-01: Atlas Governed Tool Architecture Decision

**Date:** 2026-03-06
**Status:** DECIDED
**Ticket:** CP-ATL-01 (R1-Required)

## Context

`query_parcel_layers` (handler #10) is an existing real handler calling
`GET /api/atlas/parcels/{parcelId}/layers`. It is:
- risk: `read_only`
- suite: `atlas`
- Has full `paramsSchema` defined in manifest (parcelId, layers, format)
- Registered as a real handler in `registerR1Handlers()`

## Decision

**Keep `query_parcel_layers` as a governed tool** — it already participates in
the full governed invoke path (PilotController → ToolRunner → handler → trace).

**Do NOT include it in the 5-proof minimum for R1 release.** The canonical 5
proof tools are:
1. `run_valuation_model` (Forge, write_high)
2. `explain_value_change` (Forge, read_only)
3. `search_trace_by_correlation` (OS, read_only)
4. `summarize_levy_rate_components` (Dais, read_only)
5. `summarize_parcel_casefile` (Dossier, read_only)

If time permits, `query_parcel_layers` can be exercised as a 6th proof tool
to demonstrate Atlas coverage, but it is not required for R1 gate passage.

## Rationale

- The 5-proof set already covers 4 suites (forge, os, dais, dossier) and all
  risk levels (read_only, write_high)
- Atlas is read_only — adding it doesn't increase governance coverage
- The handler is tested via existing phase83/85 test suites
- Adding a mandatory 6th proof creates more surface area for flaky failures
  without meaningful additional assurance

## Evidence

- Handler implementation: `os-platform/core/pilot/handlers.real.ts` (handler #10)
- Manifest entry: `tools/registry/terrapilot.tools.json` → `query_parcel_layers`
- Test coverage: `os-platform/core/tests/phase83-tools.test.mjs`
