# Pilot Discovery (initial)

Scanned `os-platform/core/pilot` to create a capability map for Phase 1.

Summary:
- Dev runtime server: `dev-pilot-runtime.mjs` (implements `/pilot/*` endpoints: `/pilot/health`, `/pilot/tools`, `/pilot/tools/:id`, `/pilot/invoke`, `/pilot/validate`, `/pilot/trace` endpoints).
- Tool runtime and registration: `ToolRunner.ts`, `ToolRegistry.ts` (tool manifest `tools/registry/terrapilot.tools.json` referenced by runtime).
- Trace and telemetry: `trace/TraceService.js`, `traceExport.ts`, and `swarmTraceAdapter.ts` for swarm integration.
- Security & sanitization: `security/sanitizeForTrace.js` and ops docs under `ops/` (release, SRE, JWT rotation runbooks).
- Helpers and proofs: `benton-comps-proof.mjs`, `benton-sync-proof.mjs`, `r1-local-proof.mjs` — examples that acquire pilot token and exercise flows.

Key files (non-exhaustive):
- os-platform/core/pilot/dev-pilot-runtime.mjs
- os-platform/core/pilot/ToolRunner.ts
- os-platform/core/pilot/ToolRegistry.ts
- os-platform/core/pilot/trace/TraceService.js
- os-platform/core/pilot/traceExport.ts
- os-platform/core/pilot/tools/* (tool fixtures and tests)
- os-platform/core/pilot/ops/* (operational runbooks & evidence templates)

Initial findings / notes:
- The runtime contains a local dev server that falls back to canned stubs when `TF_API_BASE_URL` / `TF_API_PORT` aren't set — useful for isolated dev.
- Endpoints align with the frontend `pilotApi` contract (list, get, invoke, validate, trace).
- ToolRegistry and ToolRunner are central entry points to extend tool types and enforcement.
- Ops docs are already present for security (JWT rotation) and release gating; integrate these into governance steps.

Next actions (planned):
1. Produce a structured capability map (phase: `capability-map.md`) listing tools, modes, and risk levels.
2. Extract API contracts from `dev-pilot-runtime.mjs` to generate `pilotApi.ts` types for frontend integration.
3. Scaffold core router and policy hooks in `os-platform/core/pilot/src/router` (prototype).

Saved: initial discovery snapshot. For more detail, I can extract tool manifests and parse them into a JSON capability map next.
