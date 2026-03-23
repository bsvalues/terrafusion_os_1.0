# Pilot Capability Map (derived from tools/registry/terrapilot.tools.json)

Source: `tools/registry/terrapilot.tools.json` (version 2.0.0)

Summary counts:
- Total tools enumerated: (see manifest)
- Risk buckets observed: `read_only`, `write_low`, `write_high`, `irreversible`
- Modes: `pilot`, `muse`

Representative tools by risk:

- read_only
  - `route_to_parcel` — Navigate to Property Workbench
  - `check_cert_status` — Query certification status
  - `explain_value_change` — Explain value delta (model)
  - `query_parcel_layers` — GIS parcel layers
  - `check_exemption_eligibility` — Senior/disabled exemption check

- write_low
  - `assign_task` — Assign a workflow task (requires confirmation + reason)
  - `draft_notice` — Generate draft notice (muse)
  - `process_exemption_renewal` — Renewal processing (payload_ref trace)
  - `add_dossier_note` — Add internal case note (payload_ref)

- write_high
  - `run_valuation_model` — Execute valuation model and persist results (requires confirmation + reason)
  - `assemble_boe_packet` — Build BOE packet from dossier
  - `schedule_boe_hearing` — Schedule BOE hearing (requires confirmation)

- irreversible
  - `request_trace_redaction` — Request PII redaction (supervisor approval required)

Trace & PII policies (high level):
- `tracePolicy` values used: `summary_only`, `payload_ref`.
- `piiHandling` values: `none`, `sanitize`, `payload_ref`.
- High-risk tools use `payload_ref` or `summary_only` depending on whether full payloads are stored in `dossier` or `secure-blob`.

Governance controls observed in manifest fields:
- `requiresConfirmation`, `reasonCodeRequired`, `reasonCodes` (mandatory for writes)
- `requiresSupervisorApproval` and `supervisorRoles` for irreversible actions
- `writeLane` indicates the owning service (e.g., `forge`, `dais`, `dossier`)
- `officeScope` restricts tools to `assessor` or `os` (admin)

Immediate integration notes / next dev tasks:
1. Enforce tool-level confirmation UI (frontend) for any tool with `requiresConfirmation: true` and collect `reasonCode` before invoking `/pilot/invoke`.
2. Policy layer: implement server-side validation that rejects invocations when `executionContext.countyId` doesn't match `params.county` (manifest requires county match in schemas).
3. Trace integration: ensure `tracePolicy` mapping exists to TerraTrace writers (summary vs payload_ref).
4. RBAC: map `officeScope` and `supervisorRoles` into existing RBAC claims check in `dev-pilot-runtime.mjs` and backend adapters.

Files to touch in Phase 1–3:
- `os-platform/core/pilot/dev-pilot-runtime.mjs` — enforce policy hooks on validate/invoke endpoints
- `os-platform/core/pilot/ToolRunner.ts` — add pre-invoke policy checks and audit hooks
- `os-platform/core/pilot/trace/TraceService.js` — map `tracePolicy` to TerraTrace event shapes
- Frontend: integrate confirm dialog + reason code capture in `pilotApi` UI callers

Saved: `os-platform/core/pilot/capability-map.md` — next I'll update the todo list to mark this task completed.
