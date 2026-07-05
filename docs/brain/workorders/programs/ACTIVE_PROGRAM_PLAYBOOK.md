# TerraFusion Active Program Work Order Playbook

**Work Order:** WO-MASTER-PLAYBOOK-001
**Status:** Active program graph
**Authority:** TerraFusion Brain / Work Order Operator
**Last Updated:** 2026-07-04
**Base:** `origin/main` at `1f3dcc1628845450e3232e32a8e78dfe95483e47`

---

## Purpose

This file defines the active, parked, and next-ready TerraFusion Work Order programs so execution
proceeds by governed chains, not one-off prompts.

**Rule:** If a program has a defined chain and the next WO is same-risk, docs/evidence-only, and
within scope, Codex may continue automatically after merge. Codex stops only at true authority walls.

---

## Program 1 — Backend Operational Excellence

**Status:** ACTIVE
**Goal:** `GOAL-BACKEND-OPERATIONAL-EXCELLENCE`
**Loop:** `LOOP-BACKEND-OPERATIONAL-EXCELLENCE`
**Current head:** `origin/main` at `1f3dcc1628845450e3232e32a8e78dfe95483e47` or later

Completed:

- `WO-BACKEND-000` — Program opened.
- `WO-BACKEND-OE-001` — Baseline complete with caveats.
- `WO-BACKEND-OE-001-S` — Generated residue classified/cleaned.
- `WO-BACKEND-OE-002` — Zero-warning register merged.
- `WO-BACKEND-OE-PLAYBOOK-REFRESH` — Full Backend OE chain merged.

Current facts:

- Backend build is PASS, 0 warnings, 0 errors.
- Warning burn-down is not active work.
- Full solution test pass is blocked by integration environment dependencies, not warning debt.
- Dais persistence exists.
- Service Registry exists.
- Health/readiness endpoints exist but semantics are not release-proven.
- Security/auth/county/audit evidence exists but is not consolidated.

Next executable:

- `WO-BACKEND-OE-003` — Integration Test Environment Dependency Register.

Backend OE chain:

| WO | Purpose | Mode | Stop Type |
|----|---------|------|-----------|
| `WO-BACKEND-OE-003` | Classify Docker/Testcontainers SQL Server dependency blocking full solution test pass. | Docs/evidence only | `BACKEND_INTEGRATION_DEPENDENCY_REGISTER_READY_FOR_PR` |
| `WO-BACKEND-OE-004` | Define what `/healthz`, `/healthz/ready`, `/health/codex369`, `/api/transcendence/health`, and Levy `/health` prove. | Evidence + narrow endpoint contract proof | `BACKEND_HEALTH_READINESS_SEMANTICS_PROVEN` |
| `WO-BACKEND-OE-005` | Move ServiceRegistry from source-wired to runtime-understood. | Evidence + targeted validation | `BACKEND_SERVICE_REGISTRY_RUNTIME_VALIDATED` |
| `WO-BACKEND-OE-006` | Consolidate auth, authorization, county isolation, audit, and security proof into one release-grade matrix. | Evidence matrix first | `BACKEND_SECURITY_PROOF_MATRIX_READY` |
| `WO-BACKEND-OE-007` | Inventory backend migrations and classify rollback/readiness evidence. | Evidence/register first | `BACKEND_MIGRATION_ROLLBACK_REGISTER_READY` |
| `WO-BACKEND-OE-008` | Define next Dais proof gaps without rebuilding persistence. | Test-plan/evidence first | `BACKEND_DAIS_E2E_PROOF_PLAN_READY` |
| `WO-BACKEND-OE-009` | Define objective backend release-readiness criteria. | Governance/release checklist | `BACKEND_RELEASE_GATE_DEFINED` |
| `WO-BACKEND-OE-010` | Create backend validation, triage, rollback, and evidence runbook. | Runbook creation | `BACKEND_OPERATIONAL_RUNBOOK_READY` |
| `WO-BACKEND-OE-011` | Map backend diagnostics and operational signals. | Evidence/docs | `BACKEND_DIAGNOSTICS_OBSERVABILITY_MAPPED` |
| `WO-BACKEND-OE-012` | Assemble Backend OE operational packet. | Packet assembly | `BACKEND_OPERATIONAL_PACKET_READY` |
| `WO-BACKEND-OE-013` | Close Backend OE with proof, deferred items, and next-lane recommendation. | Evidence rollup | `BACKEND_OPERATIONAL_EXCELLENCE_PROGRAM_CLOSED` |

---

## Program 2 — Sovereign Sync Workbook Tooling

**Status:** ACTIVE / OWNER-SELECTION GATED
**Repo:** `bsvalues/terrafusion-os`

Completed:

- `WO-057` — `tools/sync` boundary selected.
- `WO-058` — Gate 14 enforcement created before implementation.
- `WO-130` — C1 Workbook Admission Validator merged.
- `WO-131` — C2 Column-Terminalization Checker merged.

Current tool stack:

1. `workbook-contract-check` — validates shape/schema.
2. `workbook-admission-check` — validates artifact class/admissibility.
3. `workbook-terminalization-check` — validates terminal completeness and Hard Guard #3 consistency.

Next executable after owner choice:

- `WO-SYNC-132` — C3 Lock-Readiness Checker.

Sync Workbook Tooling chain:

| WO | Purpose | Mode | Stop Type |
|----|---------|------|-----------|
| `WO-SYNC-132` | Determine whether an admitted and terminalized workbook is lock-eligible. | Built-fresh `tools/sync` implementation with synthetic fixtures | `SYNC_C3_LOCK_READINESS_CHECKER_MERGED` |
| `WO-SYNC-133` | Run contract -> admission -> terminalization -> lock-readiness and report lifecycle state. | Built-fresh `tools/sync` implementation | `SYNC_WORKBOOK_LIFECYCLE_CHECKER_MERGED` |
| `WO-SYNC-134` | Decide safe edit CLI behavior before mutation tooling exists. | Docs/design only | `SYNC_WORKBOOK_EDIT_CLI_DESIGN_DECISION_READY` |
| `WO-SYNC-135` | Create dry-run-first synthetic-only workbook edit CLI if `WO-SYNC-134` authorizes it. | Implementation only after explicit design approval | `SYNC_SYNTHETIC_WORKBOOK_EDIT_CLI_MERGED` |
| `WO-SYNC-136` | Design Gate-14-safe content scanning without self-tripping forbidden markers. | Docs/design only | `SYNC_EXTERNAL_ARTIFACT_SCAN_DESIGN_DECISION_READY` |
| `WO-SYNC-137` | Implement content scan only if `WO-SYNC-136` authorizes exact shape. | Implementation | `SYNC_EXTERNAL_ARTIFACT_CONTENT_SCAN_MERGED` |
| `WO-SYNC-138` | Generate JSON/markdown evidence bundle summarizing workbook validation state. | Built-fresh `tools/sync` implementation | `SYNC_WORKBOOK_EVIDENCE_BUNDLE_MERGED` |
| `WO-SYNC-139` | Create operator runbook for workbook tooling. | Docs only | `SYNC_WORKBOOK_OPERATOR_RUNBOOK_MERGED` |
| `WO-SYNC-140` | Define release gate for workbook tooling. | Docs + optional checker only if existing pattern supports it | `SYNC_WORKBOOK_TOOLING_RELEASE_GATE_DEFINED` |
| `WO-SYNC-141` | Summarize completed workbook tooling lane, evidence, limitations, and next Sync lane. | Docs/evidence rollup | `SYNC_WORKBOOK_TOOLING_ROLLUP_COMPLETE` |

---

## Program 3 — TerraPilot Tool Maturity

**Status:** PARKED
**Goal:** `GOAL-TERRAPILOT-TOOL-MATURITY`
**Loop:** `LOOP-TERRAPILOT-TOOL-MATURITY`

Current state:

- Parked at P15.
- P16 is not started.
- P16 remains blocked unless explicitly authorized as design-only.
- `summarize_levy_rate_components` remains contract-covered only.
- `liveIntegration: false`.
- `backendIntegrated: false`.
- Not live.
- Not promoted.
- No metadata mutation after P13.
- No runtime/backend/handler changes.

Next:

- No action unless owner explicitly authorizes P16 as design-only.

Stop type:

- `TERRAPILOT_P15_PARKED`

---

## Program 4 — DevEx Hook Tooling

**Status:** FOLLOW-UP / NOT ACTIVE

Problem:

- Local hooks repeatedly fail because Prettier and Vitest are unavailable in the local tooling context.

Not part of:

- Backend OE.
- TerraPilot.
- Sovereign Sync implementation.

Candidate:

- `WO-DEVEX-HOOKS-001` — Local Prettier/Vitest Hook Bootstrap Diagnosis.

Purpose:

- Diagnose local pre-commit/pre-push tooling requirements and define a reliable bootstrap path.

Scope:

- Inspect hook scripts.
- Inspect package/tooling expectations.
- Document prerequisites.
- Decide bootstrap command or policy.
- Do not weaken hooks.
- Do not mix into product/backend/sync lanes.

Status:

- Owner-gated.

---

## Program 5 — Local OMEN Runtime Repair

**Status:** BLOCKED AT RUNTIME REPAIR GATE
**Batch:** `LOCAL-OMEN-DOCKER-RUNTIME-REPAIR-GATE-001`

Current facts:

- Docker Desktop recovered.
- `williamos-postgres-proof` exists on `127.0.0.1:15432` but is unhealthy.
- App proof container is missing.
- Ports 3100/3101 are clear.
- TerraFusion Postgres is untouched.
- Manual proof is incomplete.

Next:

- `WO-LOCAL-093` — Docker Runtime Start Timeout Diagnosis Gate.

Rule:

- Diagnosis first.
- No app integration.
- No persistence.
- No LAN exposure.
- No service/schedule.
- No Docker destructive cleanup unless separately authorized.

---

## Program 6 — WO-CORE-1 Runtime Import Disposition

**Status:** OWNER-GATED

Purpose:

- Decide runtime-import disposition before any sovereign repo runtime import.

Rule:

- No `backend/`, `frontend/`, or `os-platform/` import into the sovereign repo without explicit Work
  Order, provenance, and validation gates.

Next:

- `WO-CORE-1` — Runtime Import Disposition.

Possible outcomes:

- No import.
- Promote specific contract only.
- Promote specific built-fresh scaffold.
- Mine archive for pattern only.
- Authorize narrowly scoped runtime import later.

Stop:

- Always owner decision required.

---

## Program 7 — Property Workbench

**Status:** FUTURE HIGH-VALUE PRODUCT LANE

Do not start until:

- Backend OE and/or WOE ranking says it is next.
- Owner explicitly selects it.

Likely chain:

| WO | Purpose |
|----|---------|
| `WO-WORKBENCH-001` | Workbench Reality Audit |
| `WO-WORKBENCH-002` | Routing and Deep-Link Gate Audit |
| `WO-WORKBENCH-003` | Tab Capability Classification |
| `WO-WORKBENCH-004` | Forge Surface Completion Plan |
| `WO-WORKBENCH-005` | Atlas Surface Completion Plan |
| `WO-WORKBENCH-006` | Dais Surface Completion Plan |
| `WO-WORKBENCH-007` | Dossier Surface Completion Plan |
| `WO-WORKBENCH-008` | Pilot Integration Boundary |
| `WO-WORKBENCH-009` | End-to-End Parcel Flow Proof |
| `WO-WORKBENCH-010` | Workbench Operational Packet |
| `WO-WORKBENCH-011` | Evidence Rollup |

Status:

- Defined as future lane only.
- Do not execute without owner selection.

---

## Global Continuation Rule

Codex may continue automatically from one WO to the next only when all are true:

1. Current WO is merged to `origin/main`.
2. Remote checks are green/acceptable.
3. Review threads are resolved.
4. Next WO is already defined in this master playbook.
5. Next WO is same or lower risk.
6. Next WO does not require backend/runtime implementation unless the program explicitly authorizes implementation.
7. Next WO does not require secrets, county data, PACS, live services, production resources, migrations, or deployment.
8. No local hook bypass is needed.
9. No scope expansion outside the authorized file set is required.

Codex must stop for owner decision when any are true:

1. Backend/runtime code change is required.
2. Gate modification is required.
3. CI/release wiring is required.
4. Docker/Testcontainers repair is required.
5. Migrations/schema changes are required.
6. Secrets, county data, PACS, county SQL, or live resources are implicated.
7. TerraPilot promotion/live integration is proposed.
8. Sovereign runtime import is proposed.
9. Property Workbench product behavior changes are proposed.
10. Local hook bypass is required.
11. Review requires files outside current WO authorized scope.
12. Worktree is dirty, unsafe, timed out, or locked.

---

## Command Concepts

The command map must expose these operator commands:

- `/program-status`
- `/program-next`
- `/program-stop`
- `/backend-start`
- `/backend-status`
- `/backend-next`
- `/backend-stop`
- `/sync-status`
- `/sync-next`
- `/sync-stop`
- `/terrapilot-status`
- `/terrapilot-stop`
- `/devex-hooks-status`
- `/local-omen-status`
- `/core-import-status`

