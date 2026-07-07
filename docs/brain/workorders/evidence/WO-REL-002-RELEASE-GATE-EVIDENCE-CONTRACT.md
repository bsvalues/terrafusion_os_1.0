# WO-REL-002 - Release Gate Checklist / Evidence Contract

Date: 2026-07-07
Work order: WO-REL-002
Program: Release Engineering
Goal: GOAL-TF-RELEASE-ENGINEERING-001
Loop: LOOP-TF-RELEASE-ENGINEERING-001
Mode: docs/governance evidence contract

## Result

RESULT: PASS_WITH_GAP

Release Engineering now has a canonical evidence contract for converting the closed Backend
Operational Excellence baseline into a release-candidate decision. This contract maps Backend OE
release gates to existing workflow/check surfaces, defines required and advisory evidence, records
the release SHA model, and separates PASS, HOLD, and FAIL decisions.

This work order does not modify CI, deployment, runtime behavior, schema, migrations, GitHub Actions,
Azure Pipelines, secrets, PACS/CAMA, county SQL, county runtime, or production systems.

## Release Candidate Definition

A TerraFusion release candidate is a named source revision and evidence packet, not a deployment.

Minimum release-candidate fields:

| Field | Requirement |
|-------|-------------|
| Release candidate SHA | Exact Git SHA being certified. |
| Source branch | Branch or tag containing the release candidate SHA. |
| Evidence packet path | Canonical release evidence document for the candidate. |
| Required check results | Exact workflow/check names and final status. |
| Advisory check results | Non-blocking checks and their interpretation. |
| Backend OE evidence links | References to the Backend OE evidence files consumed by the candidate. |
| Known blocker dispositions | Explicit PASS/HOLD/FAIL disposition for integration, health/readiness, migration, rollback, security, Dais, diagnostics, and deployment gaps. |
| Rollback evidence | Existing rollback source/procedure evidence and missing execution proof. |
| Non-claims | Explicit boundaries that the release candidate does not prove. |

The current baseline SHA for this contract is:

`a244743014b4b7731a2694db10bc2e9656876e55`

That SHA is the Backend OE closeout baseline on `origin/main`. A future release candidate must record
its own exact SHA; it must not silently inherit this baseline if main has moved.

## Authoritative Backend OE Evidence

Backend OE is the evidence source for backend operational readiness inputs. Release Engineering
references these files instead of duplicating their findings.

| Evidence | Release contract use |
|----------|----------------------|
| `docs/brain/workorders/evidence/WO-BACKEND-OE-009-BACKEND-RELEASE-GATE-DEFINITION.md` | Backend release gate source of truth. |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-012-BACKEND-OPERATIONAL-PACKET.md` | Operator packet, sovereignty boundary, validation gate, rollback, ownership, and non-claim source. |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-011-DIAGNOSTICS-OBSERVABILITY-MAP.md` | Diagnostics and observability signal map, including missing production observability. |
| `docs/brain/workorders/runbooks/BACKEND_OPERATIONAL_RUNBOOK.md` | Operator procedure for validation, triage, rollback decisions, evidence capture, and escalation. |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-007-MIGRATION-ROLLBACK-PROOF-REGISTER.md` | Migration source inventory and rollback-source evidence; not rollback execution proof. |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-008-DAIS-WORKFLOW-E2E-PROOF-EXPANSION-PLAN.md` | Dais E2E proof gaps and future test slices. |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-006-SECURITY-AUTH-COUNTY-ISOLATION-PROOF-MATRIX.md` | Security, auth, county isolation, and audit proof matrix. |
| `docs/brain/workorders/evidence/WO-BACKEND-OE-013-EVIDENCE-ROLLUP-PROGRAM-CLOSEOUT.md` | Backend OE closeout, completed WOs, PRs, merge commits, proven state, partial state, deferred items, and safety posture. |

## Required Workflow And Check Evidence

Required checks are the minimum evidence for a release-candidate PASS decision. Advisory checks may
be used as supporting evidence, but they cannot replace required checks.

| Evidence area | Exact workflow/check source | Required status | Interpretation |
|---------------|-----------------------------|-----------------|----------------|
| Branch protection | `governed-spine` | Required | Core governance invariant for protected `main`. |
| Branch protection | `phase85-tools` | Required | Core tool-governance invariant for protected `main`. |
| Branch protection | `phase86-toolrunner` | Required | Core toolrunner invariant for protected `main`. |
| Branch protection | `🔒 TerraFusion Seal Gate` | Required | Constitutional seal gate for PR integrity. |
| Branch protection | `🧪 Tier-1 UI Harness Validation` | Required | Required UI harness gate for protected `main`. |
| Release branch validation | `.github/workflows/release-validation.yml` / `🔵 Backend Build` | Required for release candidate branch | Build evidence for release branch. |
| Release branch validation | `.github/workflows/release-validation.yml` / `🔵 Backend Tests` | Required unless formally held as environment-gated | Canonical backend test evidence; Docker/Testcontainers blockers must be dispositioned. |
| Migration apply | `.github/workflows/migration-apply-gate.yml` / `Migration Apply Check` | Required when migration-relevant files change | Fast-pass is acceptable when no migration-relevant changes exist. |
| Release lane guard | `.github/workflows/release-lane-guard.yml` / guard job | Required when workflow files change | Prevents rogue production workflow drift and unsafe auto-approve patterns. |
| Work-order query | `node docs/brain/workorders/tools/wo-query.mjs --json` | Required for work-order docs/governance PRs | Proves work-order registry/query surface remains parseable. |
| Diff hygiene | `git diff --check` | Required before PR/merge | Proves patch has no whitespace errors. |

## Advisory Workflow And Check Evidence

| Evidence area | Exact workflow/check source | Advisory status | Interpretation |
|---------------|-----------------------------|-----------------|----------------|
| Frontend build | `.github/workflows/release-validation.yml` / `🟢 Frontend Build` | Advisory unless candidate includes frontend release scope | Workflow currently uses continue-on-error for frontend install/build/test steps; failures require disposition if frontend is in scope. |
| OS Shell build | `.github/workflows/release-validation.yml` / `🖥️ OS Shell Build` | Advisory unless candidate includes OS shell release scope | Workflow currently uses continue-on-error for shell build/test steps; failures require disposition if shell is in scope. |
| Release summary | `.github/workflows/release-validation.yml` / `📋 Release Summary` | Advisory | Summarizes gate results; it is not itself a substitute for required gate results. |
| Azure PR validation | `docs/migration/azure-branch-policy-proposal.md` | Advisory unless Azure branch policy is the selected release surface | Existing docs propose Azure PR Validation as branch policy, not a second control plane. |
| Azure main build | `docs/migration/azure-branch-policy-proposal.md` and `docs/migration/build-truth-sheet.md` | Advisory unless explicitly selected | Main Build is not the first-pass required PR policy in existing Azure docs. |

## Backend OE Gate Mapping

| Backend OE gate | Release candidate evidence | Decision rule |
|-----------------|----------------------------|---------------|
| Build and warning posture | Current `Backend Build` result plus OE-002/OE-013 zero-warning baseline. | PASS only when current candidate build is green and warning count remains zero or every warning is explicitly dispositioned. |
| Unit lane | Current `Backend Tests` result plus OE-001/OE-006 evidence references. | PASS when current unit lane is green; HOLD if environment-only blocker is documented; FAIL if code/test failure is undispositioned. |
| Integration lane | OE-003 Docker/Testcontainers register plus any current Docker-capable lane result. | PASS when Docker-capable lane passes; HOLD when explicitly segmented/deferred for non-production release; FAIL if required and failing. |
| Health/readiness | OE-004 endpoint semantics plus any current endpoint validation evidence. | PASS only with identified authoritative readiness endpoint; HOLD if `/healthz/ready` caveat remains dispositioned; FAIL if readiness is overclaimed. |
| Service registry | OE-005 registry validation plus any current runtime proof. | PASS if writer/reader, seed, stale/orphan, and health semantics are proven or explicitly scoped; HOLD if source-wired only; FAIL on overclaim. |
| Security/auth/county/audit | OE-006 proof matrix and current release-critical endpoint policy review. | PASS when protected/public endpoint scope is reviewed; HOLD for documented gaps; FAIL for undispositioned exposure or cross-county risk. |
| Migration/rollback | OE-007 register, migration check result, and rollback evidence. | PASS for source-present/no-migration-change candidates; HOLD when apply/rollback execution proof is absent but no DB mutation is claimed; FAIL if migration safety is claimed without proof. |
| Dais E2E | OE-008 plan and any future implementation evidence. | PASS only for claims covered by evidence; HOLD for planned-but-not-implemented slices; FAIL if Dais release-grade E2E is overclaimed. |
| Runbook | Backend operational runbook. | PASS when current release packet references the runbook and escalation triggers. |
| Diagnostics | OE-011 diagnostics map. | PASS_WITH_GAP when missing observability is carried; FAIL if production observability is claimed without runtime/platform proof. |
| Operational packet | OE-012 packet. | PASS when release packet references OE-012 boundaries and non-claims. |
| Closeout | OE-013 closeout. | PASS when Backend OE remains closed and no closed-lane restart is implied. |

## Release Decision Model

### PASS

A release candidate may be marked PASS only when all of the following are true:

- the release candidate SHA is explicit,
- all required checks for the candidate scope are green or explicitly acceptable,
- Backend OE evidence links are attached,
- Docker/Testcontainers lane is passed or explicitly dispositioned for the release scope,
- health/readiness semantics are not overclaimed,
- service registry runtime gaps are not overclaimed,
- security/auth/county/audit gaps are dispositioned,
- migration/rollback evidence is accurately scoped,
- rollback procedure and missing rollback execution proof are recorded,
- no production, county, PACS/CAMA, secrets, schema, or deployment authority is implied,
- intentional non-claims are listed.

### HOLD

A release candidate must be marked HOLD when any of the following are true:

- required check evidence is pending, stale, or missing,
- Docker/Testcontainers integration lane is needed but not yet passed or formally dispositioned,
- migration/rollback execution proof is required for the candidate but absent,
- release branch SHA is unclear or has moved without updated evidence,
- advisory checks fail in a scope that the release candidate claims,
- Backend OE evidence gaps are acknowledged but need an owner release decision,
- County Runtime, PACS/CAMA, secrets, production deployment, or live service boundaries are implicated.

### FAIL

A release candidate must be marked FAIL when any of the following are true:

- a required check fails for a code or governance reason,
- build warning count is non-zero without explicit warning-register disposition,
- release evidence contradicts Backend OE evidence,
- rollback, migration, health/readiness, service registry, or Dais E2E claims exceed available proof,
- workflow, deployment, schema, runtime, county, PACS/CAMA, or secrets scope was changed without authority,
- release packet omits the candidate SHA or required evidence.

## Rollback Evidence Contract

Existing rollback evidence:

| Evidence | Current state |
|----------|---------------|
| Backend runbook rollback procedure | Exists; defines non-mutating decision procedure and stop gates. |
| OE-007 migration/rollback register | Source inventory exists; EF `Down` methods observed in inspected EF migration classes. |
| Rollback workflows | `.github/workflows/rollback-staging.yml` and `.github/workflows/rollback-production.yml` exist. |
| Operational packet rollback path | OE-012 states docs-only rollback and defers runtime rollback authority. |

Missing rollback evidence:

| Missing proof | Release interpretation |
|---------------|------------------------|
| Executed application rollback proof | Must remain absent unless a safe environment rollback drill is authorized and run. |
| Migration apply/rollback execution proof | Must not be claimed from source inventory alone. |
| SQL-only rollback proof | Levy and experiment SQL surfaces require manual rollback/disposition before migration-readiness claims. |
| Production rollback proof | Requires production/deployment/secrets authority; not authorized by this contract. |
| County-runtime rollback proof | Requires County Runtime owner decision; not authorized by this contract. |

Rollback workflows require deployment targets and secrets. Their existence is evidence of a possible
rollback mechanism, not proof that rollback has been executed or is safe for production/county use.

## Verified Evidence, Missing Evidence, And Non-Claims

### Verified Evidence

- Backend OE is closed as an operational baseline at `a244743014b4b7731a2694db10bc2e9656876e55`.
- Canonical backend build baseline is recorded as `0 Warning(s)` and `0 Error(s)`.
- Backend OE release gate, runbook, diagnostics map, operational packet, and evidence rollup exist.
- Docker/Testcontainers dependency is classified as an integration environment prerequisite, not warning debt.
- Migration source and rollback-source inventory exists.
- Dais E2E proof gaps are planned and not overclaimed.

### Missing Evidence

- Current release-candidate branch check packet for any future SHA.
- Executed migration apply/rollback proof.
- Executed application rollback proof.
- Docker-capable full integration lane pass or explicit release disposition.
- Production readiness proof.
- County Runtime/PACS/CAMA production proof.
- CI/release automation wiring for the OE-009 release gate.

### Intentional Non-Claims

This contract does not claim:

- production release readiness,
- deployment authority,
- rollback execution proof,
- migration execution proof,
- CI or workflow enforcement changes,
- Azure Pipelines or GitHub Actions changes,
- Docker/Testcontainers repair,
- full backend solution test pass without environment prerequisites,
- County Runtime readiness,
- PACS/CAMA readiness,
- secrets access,
- live service access,
- or schema/database mutation authority.

## County Runtime And Control-Plane Boundary

Release Engineering may define evidence contracts and gate semantics. It must not cross into County
Runtime without owner authorization. Any release candidate requiring county data, county SQL, PACS,
CAMA, secrets, production deployment, live service access, schema mutation, or county production
rollback becomes a HOLD and must be routed to the owner-selected County Runtime lane.

Existing migration/Azure documentation keeps Azure DevOps as a validation bridge and does not make it
a second control plane. GitHub remains the product truth unless a separate owner-authorized decision
changes that boundary.

## Recommended Next Work Order

Recommended next WO:

`WO-REL-003 - Release Candidate Evidence Packet Template`

Recommended scope:

- create a docs-only template for a future release candidate packet,
- require explicit release candidate SHA,
- require required/advisory workflow results,
- require Backend OE evidence links,
- require PASS/HOLD/FAIL decision,
- require rollback evidence and non-claims,
- do not modify CI, workflows, deployment, runtime code, schemas, secrets, PACS/CAMA, county runtime,
  or live resources.

## Validation

Planned validation for this work order:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- Scope inspection confirms only docs/governance files changed.
- Runtime/backend/tools-sync implementation files changed: none.
- CI/workflow files changed: none.
- Deployment files changed: none.
- County/PACS/CAMA/secrets/live resources touched: none.

STOP_TYPE: RELEASE_GATE_EVIDENCE_CONTRACT_READY_FOR_PR
