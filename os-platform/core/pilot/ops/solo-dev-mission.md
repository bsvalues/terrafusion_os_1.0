# Solo Developer Mission & Constraints — Pilot Agents

Date: 2026-03-23

Purpose
- Enable a single engineer to safely develop, test, and iterate Pilot runtime and agent integrations while respecting TerraFusion governance.

Mission (one-sentence)
- Deliver a minimal, auditable Pilot runtime that enforces manifest-driven governance (tracePolicy, confirmation, RBAC), emits TerraTrace events, and provides a reproducible dev audit path for local proof.

Scope (what I will change)
- Files under `os-platform/core/pilot/**` and supporting test files in `os-platform/core/tests/**`.
- New dev-only adapters under `os-platform/core/pilot/trace/` (flagged TF_DEV_AUDIT).

Forbidden edits (absolute)
- Do NOT modify: `backend/**`, `frontend/**` (unless small test mocks), `os-platform/ai-systems/**`, `ARCHIVE/**`, or generated `.js` files that are built artifacts outside the pilot folder.

Constraints & Safety Rules
- Never hardcode ports — use env vars (e.g., `TF_API_PORT`, `PILOT_PORT`).
- No PII in trace summaries unless `tracePolicy` permits `payload_ref`; otherwise sanitize.
- All writes must emit `tool_invoked` and a terminal event (`tool_succeeded` or `tool_failed`) sharing the same `correlationId`.
- County isolation: invocations must check `params.county === context.countyId`.
- Preflight policy: enforce confirmation, reasonCode and supervisorApproval as required by manifest.

Success Criteria (definition of done for Phase 1)
- `ToolRunner` emits `tool_invoked` and terminal events with matching correlationId for a sample write_low and read_only tool.
- `TraceService` persists events to in-memory store and to dev audit adapter when `TF_DEV_AUDIT=1` is set.
- Unit tests covering trace contract (correlation pairing, summary_only vs payload_ref) pass locally (`node --test` / vitest where applicable).
- No changes outside allowed scope.

Dev runbook (quick commands)
```pwsh
# enable dev audit persistence
setx TF_DEV_AUDIT 1
# run pilot runtime (dev)
pnpm run dev:pilot
# run core pilot tests
node --test os-platform/core/pilot/dev-pilot-runtime.test.mjs
```

Small rollback plan
- Revert the single commit or branch if tests fail or governance gates surface issues. Keep changes minimal and gated per PR.

Notes & Evidence
- Record test outputs and `dev-audit/events.log.jsonl` contents as evidence for PR reviewers.

Owner
- Solo dev (you) — keep PRs small, include a short evidence note in the PR body.
