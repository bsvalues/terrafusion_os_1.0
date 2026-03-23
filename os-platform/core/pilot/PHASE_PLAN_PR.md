# Co‑Pilot Next Phases — Proposal

This file contains the detailed, ticketized plan for the next Co‑Pilot (TerraPilot) implementation phases and a PR-ready summary.

Summary (PR title): pilot(plan): next phases and initial engineering tasks

PR Description (short):
- Adds a detailed Phase plan for TerraPilot (Discovery → Alignment → Core Engine → Integrations/UX → Governance → Verification → Rollout).
- Proposes immediate engineering tasks: policy enforcement wiring (done), router hooks (done), audit/trace integration (next), UI confirm dialogs (next), telemetry dashboards (next).

Phases (detailed)

Phase 0 — Preflight (done)
- Completed: discovery scan, capability map, policy router prototype, unit tests for runtime.
- Evidence: `DISCOVERY.md`, `capability-map.md`, `src/router/*`, all pilot runtime tests pass.

Phase 1 — Core Engine (2–4 weeks)
- Goals: hardened validation + enforcement, tool allowlist enforcement, trace mapping, audit integration.
- Tasks (ticketized):
  - P1-1: Add TerraTrace mapping for `tracePolicy` values (implement in `trace/TraceService.js` and `traceExport.ts`).
  - P1-2: Integrate `IAuditLogger` hooks for tool_invoked/tool_succeeded/tool_failed events.
  - P1-3: Add unit & integration tests for county isolation + RBAC across validate/invoke endpoints.
  - P1-4: Add logging + observability for policy rejections (permission_denied, policy_blocked).
- Acceptance: CI type-check + runtime tests + trace events recorded for a full invocation lifecycle.

Phase 2 — Integration & UX (3–4 weeks)
- Goals: UI confirm dialogs, reasonCode capture, supervisor approval UI, end-to-end flows.
- Tasks:
  - P2-1: Pilot UI confirm dialog component with reasonCode dropdown and supervisor approval flow (frontend shell integration).
  - P2-2: Update `pilotApi` calls to include `confirmation`, `reasonCode`, and `supervisorApproval` in request body.
  - P2-3: E2E tests (playwright/vitest) exercising write_high flows and confirm+supervisor acceptance.
- Acceptance: UX tests pass; production-like flow exercises `run_valuation_model` and `assemble_boe_packet` with audit rows and trace events.

Phase 3 — Governance & Security (ongoing, gated)
- Goals: RBAC mapping, secrets rotation plan, PII redaction policy automation.
- Tasks:
  - P3-1: Gate high-risk tools behind supervisor roles; document policy matrix.
  - P3-2: Implement JWT rotation runbook verification in ops (`ops/sec-005-jwt-rotation-*.md`).
  - P3-3: Add Snyk checks and gov scanning for `tools/registry` and `os-platform/core/pilot`.
- Acceptance: Security signoff, SEAL CI gates green.

Phase 4 — Pilot Verification & Rollout (2–3 weeks)
- Goals: limited county pilot with telemetry and rollback runbook.
- Tasks:
  - P4-1: Launch pilot in a sandbox county; collect metrics (trace count, policy blocks, latency).
  - P4-2: Build dashboards (Grafana) and incident runbook for rollback.
- Acceptance: Metrics meet SLAs; product + security approval for broader rollout.

Immediate next engineering steps (this PR)
- Wire TerraTrace mappings and emit tool_invoked/succeeded/failed in `ToolRunner` and `dev-pilot-runtime.mjs`.
- Implement minimal audit adapter that forwards to `IAuditLogger` (backend) or local sqlite for dev.
- Create frontend confirm dialog stub and update `pilotApi` request contract.

Files added in workspace by this change
- `os-platform/core/pilot/PHASE_PLAN_PR.md` (this file)

Requested branch & PR
- Branch: `feature/pilot-phases-plan`
- Target: `main`
- Title: `pilot(plan): next phases and initial engineering tasks`
- Body: Use this file's content as the PR description.

---

If you approve, I'll create branch `feature/pilot-phases-plan`, commit this file and open a PR against `main`.