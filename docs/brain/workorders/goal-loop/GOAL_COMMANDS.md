# /goal Command Definitions

**Authority:** WO-WOE-010
**Classification:** Operator Doctrine

---

## What /goal Does

`/goal` declares the desired outcome, selects the matching program from the
[Program Playbook Register](../PROGRAM_PLAYBOOK_REGISTER.md), and names the success condition. It
does not mutate the repository by itself.

A `/goal` stays active until:
- the program's terminal WO completes, OR
- an authority wall is reached, OR
- the operator explicitly changes the goal

---

## Command Grammar

```
/goal <program>
/goal <program> --target <outcome>
/goal <program> --target <outcome> --loop <mode>
```

Combining `--loop` is shorthand for running `/loop <mode>` immediately after goal selection.

---

## Goal Selectors And Read-Only Aliases

Entries named for a program are `/goal` selectors. Entries ending in `-status`, `-next`, or `-stop`
are compatibility aliases for read-only routing or loop control; they are not separate program goals.
Executable repository commands such as `corepack pnpm brain` and `corepack pnpm tf` are outside this
operator-directive grammar and retain their own help surfaces.

### /goal suite-repositories

```
Goal:     Build the five federated Tier-1 suite repositories under the sovereign OS base.
Program:  Five-Suite Federated Repository Buildout
File:     programs/five-suite-federated-repository-buildout.md
Success:  Shared contracts are frozen, repositories are bootstrapped, bounded extraction passes
          parity/provenance gates, and duplicate mutable ownership is retired at cutover.
```

**Current state:** Dais, Dossier, and GPT contract implementation/freeze is complete.
WO-SR-005D-E1 and WO-SR-005D-E2 completed the unwired Dossier adapter and standalone parity proof.
WO-SR-005E-A then found that the committed GPT/RAG result drops identity required by the frozen
grounded-context contract. `WO-SR-005E-A2` completed the source-identity projection design, and
`WO-SR-005E-E0` implemented the exact pure unwired boundary with 52 focused synthetic cases. E0's
bounded R3 authority is consumed. `WO-SR-005E-A3` completed R2 reconciliation and defined an exact
pure E1 adapter followed by hash-pinned standalone E2 parity. `WO-SR-005E-A4` registered the clean
  read-only `D:\terrafusion-gpt` checkout. The exact sequential R3 envelope completed
  `WO-SR-005E-E1` in sovereign PR #1367 and `WO-SR-005E-E2` in GPT PR #1, then was consumed.
  Portfolio reconciliation is current. Runtime/provider adoption, extraction, custody or persistence mutation,
protected data, publication/unrelated workflow changes, and cutover remain gated.

**Allowed loop modes:** `program`, `evidence`, `discovery`

**Blocked:** package publication, blind extraction, duplicate mutable ownership, source deletion or
cutover, secrets, county/PACS data, and production deployment.

### /goal codex-operator-autonomy

```
Goal:     Make Codex the active TerraFusion Work Order operator so the owner is no longer the
          courier between ChatGPT, Codex, PRs, checks, reviews, and merge readiness.
Program:  Codex Operator Autonomy
File:     programs/codex-operator-autonomy.md
Success:  Courier friction audit, authority matrix, goal/loop contracts, stop classifier, PR
          lifecycle, review autonomy, hook exception, merge model, next-WO rule, evidence output
          standard, Release Engineering application, and rollup exist.
```

**Current state:** `WO-OP-AUTO-000` through `WO-OP-AUTO-012` are active as docs/governance-only
operator autonomy work.

**Allowed loop modes:** `once`, `program`, `evidence`

**Blocked:** runtime/backend/tools-sync implementation, CI or workflow changes, deployment, branch
protection, county runtime, PACS, secrets, production resources, destructive operations outside exact
repair authority, and merge without the applicable merge authority model.

---

### /goal codex-operator-playbook

```
Goal:     Make Codex the primary TerraFusion Work Order operator so the owner is the authority wall,
          not the courier between agents, PRs, checks, reviews, and merge readiness.
Program:  Codex Operator Work Order Playbook
File:     operator/CODEX_OPERATOR_PLAYBOOK.md
Success:  Operator doctrine, goal/loop contract, lifecycle, continuation rules, PR/CI rules,
          owner-decision packet, merge model, register integration, and rollup evidence exist.
```

**Current state:** `WO-CODEX-OP-001` through `WO-CODEX-OP-009` are merged. The operator doctrine is
now the governing model for subsequent owner-selected lanes.

**Allowed loop modes:** `once`, `program`, `evidence`

**Blocked:** runtime/backend/tools-sync implementation, CI or workflow changes outside active
authority, branch protection, hook bypass without an applicable standing exception, merge without
applicable standing/bounded authority, production,
deployment, secrets, county/PACS/SQL/live resources, and destructive operations.

---

### /goal goal-loop-master-playbook

```
Goal:     Create and keep current the active TerraFusion /goal + /loop execution graph.
Program:  Master Goal/Loop Playbook Governance
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Active program chains, continuation rules, stop gates, and command routing are governed
          from one baseline playbook.
```

**Current state:** `WO-GOAL-LOOP-MASTER-PLAYBOOK-001` is merged. The Azure committed-evidence lane
closes its safe slice at WO-AZURE-003 and routes back to portfolio reconciliation.

**Allowed loop modes:** `once`, `evidence`

**Blocked:** runtime/backend/tools-sync implementation, hook repair, OE-003 execution inside this
packet, Sync execution, TerraPilot P16, migrations, secrets, county/PACS data, deployment.

---

### /goal program-status

```
Goal:     Inspect the master active-program graph and surface active, parked, and owner-gated lanes.
Program:  Master Active Program Playbook
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Operator sees the next executable WO and the stop gates that block parked lanes.
```

**Current state:** `WO-PORTFOLIO-011` prevented duplicate Sync implementation by verifying the
canonical sovereign repository. Query and wave-planner routing now return no executable node because
every incomplete candidate crosses a protected deployment, live-resource, data, runtime, promotion,
or new-product boundary.

**Related commands:** `/program-status`, `/program-next`, `/program-stop`

**Allowed loop modes:** `once`, `evidence`, `discovery`

---

### /goal release-engineering

```
Goal:     Convert closed operational baselines into releasable, recoverable, and repeatable
          release evidence contracts without crossing into deployment or county runtime authority.
Program:  Release Engineering
File:     docs/brain/workorders/programs/release-engineering.md
Success:  Release Engineering baseline has merged evidence links, validation summary, deferred risks,
          and next-lane recommendation.
```

**Current state:** Release Engineering is closed at `WO-REL-006`. DevEx Hook Bootstrap subsequently
closed at `WO-DEVEX-HOOKS-006`; current routing is the evidence-backed WO-PORTFOLIO-011 protected
portfolio boundary.

**Allowed loop modes:** `once`, `evidence`, `discovery`

---

### /goal benton-demo

```
Goal:     Make the Benton demo deploy-preflight-ready without authorizing production deployment.
Program:  P1 — Benton Demo / Deployment Readiness
File:     programs/benton-demo-deployment.md
Success:  All preflight checklist items verified; operator holds the deploy authorization decision.
```

**Current state:** WO-DEPLOY-BENTON-003B is next. Blocked until PR #1112 merges.

**Allowed loop modes:** `once`, `program`, `merge-watch`, `evidence`, `recovery`
**Blocked loop modes:** none (but WO-DEPLOY-BENTON-003D/003E require explicit deploy authorization)

---

### /goal benton-data-quality

```
Goal:     Explain and classify Benton data anomalies before cleanup or production claims.
Program:  P2 — Benton Data Quality
File:     programs/benton-data-quality.md
Success:  All open anomaly groups are documented with evidence; cleanup WOs are authorized before execution.
```

**Current state:** The audit set, sales audit, evidence rollup, credentialed verification, and bounded
duplicate cleanup are complete in PRs #1115, #1132, #1152, #1156, #1164, and #1166. The safe queue
is exhausted; any new remediation needs a new bounded WO and applicable protected authority.

**Allowed loop modes:** `evidence`, `discovery`
**Blocked loop modes:** `program` (no registered successor)

---

### /goal backend-excellence

```
Goal:     Turn the backend into an operationally governed platform with explicit build health,
          readiness proof, diagnostics, runtime validation, release criteria, evidence, and
          rollback discipline.
Program:  P3 — Backend Operational Excellence
File:     programs/backend-operational-excellence.md
Success:  Backend operational truth, warnings, runtime validation, release gates, runbooks,
          diagnostics, rollback, and evidence rollup are explicit enough for WOE to choose the
          next lane.
```

**Current state:** WO-BACKEND-000 and WO-BACKEND-OE-001 through OE-013 are merged; WO-BACKEND-014
completed the bounded provenance follow-up. The lane is closed and routes to portfolio evidence.

**Allowed loop modes:** `once`, `program`, `evidence`, `discovery`

**Command aliases:** `/backend-start`, `/backend-status`, `/backend-next`, `/backend-stop`

**Blocked:** production deployment, secrets, county data, PACS, live DB, schema migration apply,
TerraPilot P16, and any backend runtime mutation not explicitly authorized by the current WO.

---

### /goal sync-workbook-tooling

```
Goal:     Report Sovereign Sync workbook tooling status from its canonical repository.
Program:  Sovereign Sync Workbook Tooling
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Workbook lifecycle evidence and closeout are resolved without duplicate cross-repository work.
```

**Current state:** The canonical `bsvalues/terrafusion-os` repository completed WO-SYNC-132 through
WO-SYNC-155. This repository must not restart or duplicate that closed chain.

**Command aliases:** `/sync-status`, `/sync-next`, `/sync-stop`

**Allowed loop modes:** `evidence`, `discovery`, `once`; no implementation continuation remains.

**Blocked:** Gate 14 changes, forbidden content scan shape, county/live data, cross-lane
implementation, or any weakening of sync guards.

---

### /goal property-workbench

```
Goal:     Make the parcel workbench the canonical assessor experience for Benton County.
Program:  P4 — Property Workbench
File:     programs/property-workbench.md
Success:  All workbench tabs have live data, honest empty states, and validated tab contracts.
```

**Current state:** WO-WORKBENCH-001 through WO-WORKBENCH-011 are complete. No new Workbench phase is
authorized or queued.

**Allowed loop modes:** `once`, `program`, `evidence`, `discovery`

---

### /goal sync-status

```
Goal:     Inspect Sovereign Sync workbook tooling state from its canonical repository.
Program:  Sovereign Sync Workbook Tooling
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Operator sees WO-SYNC-132 through WO-SYNC-155 as complete and does not duplicate them.
```

**Current state:** The canonical sovereign repository closed the program at WO-SYNC-155. Status and
evidence inspection remain available; implementation continuation does not.

**Command aliases:** `/sync-status`, `/sync-next`, `/sync-stop`

**Allowed loop modes:** `evidence`, `discovery`, `once`

---

### /goal devex-hooks-status

```
Goal:     Inspect local Prettier/Vitest hook tooling debt without mixing it into product lanes.
Program:  DevEx Hook Tooling
File:     programs/devex-hook-tooling.md
Success:  Operator sees the clean-worktree bootstrap as verified and ordinary frozen validation
          installs governed by FROZEN_BOOTSTRAP_AUTO_PROCEED.
```

**Current state:** `WO-DEVEX-HOOKS-006 - Bootstrap Verification Packet` verified the frozen bootstrap,
unchanged manifests/lockfile, repo-local tool resolution, and deterministic hooks. Tracked dependency
mutation and worktree cleanup remain owner-gated; ordinary policy-compliant frozen validation
installs auto-proceed.

**Command alias:** `/devex-hooks-status`

---

### /goal local-omen-status

```
Goal:     Inspect the historical cross-project contamination record without authorizing continuation.
Program:  Cross-Project Historical Audit (WilliamOS/TerraGroq)
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Operator sees WO-LOCAL-093 through WO-LOCAL-097 superseded and WO-LOCAL-098 withdrawn.
```

**Current state:** OMEN and all `williamos-*` proof surfaces are foreign to TerraFusion. Their merged
documents remain historical audit material only. No TerraFusion goal, loop, WO, or authority permits
runtime continuation or transfer to WilliamOS/TerraGroq.

**Command alias:** `/local-omen-status`

---

### /goal core-import-status

```
Goal:     Inspect WO-CORE-1 runtime-import disposition before any sovereign repo import.
Program:  WO-CORE-1 Runtime Import Disposition
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Operator sees runtime import as owner-gated and not authorized by status checks.
```

**Current state:** Owner-gated.

**Command alias:** `/core-import-status`

---

### /goal workbench-status

```
Goal:     Inspect Property Workbench lane state without starting product behavior changes.
Program:  Property Workbench
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Operator sees Property Workbench as a future lane and does not execute it unless selected.
```

**Current state:** Future high-value product lane. Do not start until owner selection or WOE ranking
selects it.

**Command alias:** `/workbench-status`

---

### /goal terrapilot-maturity

```
Goal:     Prevent TerraPilot manifest/handler/stub drift and mature tools toward verified integration.
Program:  P5 — TerraPilot Tool Maturity
File:     programs/terrapilot-tool-maturity.md
Success:  TerraPilot maturity claims are explicit, evidence-backed, and stopped before live/backend promotion unless separately authorized.
```

**Current state:** WO-TERRAPILOT-P15 records the owner-decision boundary for any future live/backend
promotion path. P2 through P14 recorded maturity protocol, metadata enforcement, candidate evidence,
the P13 L2 metadata change, and the P14 stop gate before any live/backend-integrated claim.

**Allowed loop modes:** `once`, `program`, `evidence`, `discovery`

**Command aliases:** `/terrapilot-status`, `/terrapilot-stop`

---

### /goal work-order-engine

```
Goal:     Make TerraFusion compute next work from evidence, blockers, PR state, dependencies, and risk.
Program:  P6 — Work Order Engine
File:     programs/work-order-engine.md
Success:  Brain can query the WO engine, score next WOs, and present a plan the operator can act on.
```

**Current state:** WO-WOE-010 (this WO) is executing. Next after merge: WO-WOE-010 → WO-WOE-011.

**Allowed loop modes:** `once`, `program`, `evidence`, `discovery`

---

### /goal brain-operator

```
Goal:     Operationalize Brain/Cortex as the single governance memory and operator authority.
Program:  P7 — AI / Brain / Operator System
File:     programs/brain-operator-system.md
Success:  Brain authority is documented and evidence-backed; suites have domain packs, not their own brains.
```

**Current state:** BRAIN-001 through BRAIN-009 are complete. `WO-BRAIN-008` produced the canonical
`CONTINUATION_RULEBOOK.md`; `WO-BRAIN-009` closed the Brain Operator **evidence baseline** as **PARTIAL /
INTEGRATION GAP** (query + scoring are real but read a stale June-29 seed — see
`evidence/WO-BRAIN-009-BRAIN-WOE-INTEGRATION-EVIDENCE.md`). Next action: **portfolio reconciliation** — no
lane preselected.

**Allowed loop modes:** `once`, `program`, `evidence`, `discovery`

---

### /goal governed-multi-agent-operator

```
Goal:     GOAL-MAO-001 - Activate governed parallel execution under one Brain and bounded authority.
Program:  PROGRAM-MAO-001 - Governed Multi-Agent Operator Activation
File:     programs/governed-multi-agent-operator-activation.md
Loop:     LOOP-MAO-001
Success:  The MAO program advances through falsifiable pilot, reservation enforcement, planning,
          playbook, rollout, and evidence gates without crossing protected boundaries.
```

**Current state:** PROGRAM-MAO-001 is closed at `WO-MAO-007` as `PASS_WITH_GAPS`. PR #1288 closed
WO-MAO-006. The continuation envelope is completed and consumed when the closeout transition merges.
Use `/goal portfolio-operator` for the next live reconciliation; no lane is preselected here.

**Mode B:** The canonical
[Merge Authority Model](../operator/MERGE_AUTHORITY_MODEL.md#mode-b-preauthorized-operator-merge)
defines Mode B as operator merge under recorded, revocable authority. The active standing grant
covers routine delivery for every already-ratified program and dependency-cleared Work Order inside
its separate scope; it does not create that scope or protected-resource authority.
MAO-002 consumed its two-PR issue #1276 grant and released the paired operational variables after
post-merge assurance. The owner has ratified
`OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE`, which supplied bounded, revocable Mode B authority
for eligible MAO-005 through MAO-007 work without per-PR owner routing and is now consumed.

**Allowed loop modes:** `once`, `evidence`, `discovery`

**Blocked:** This selector grants no runtime, product, production, credential, county, or county-data
authority.

---

### /goal portfolio-operator

```
Goal:     Select and activate the highest-priority dependency-cleared canonical program.
Program:  Portfolio Operator
File:     programs/portfolio-operator.md
Success:  Program closeout advances directly into the next executable goal/loop without owner dispatch.
```

**Current state:** Portfolio synthesis at `5049ed24eda651ac4896b2ccfcbf5ceed3ac04b6` rejected the
obsolete LocalOps seed and admitted `WO-PORTFOLIO-005 - Evidence Publisher Capacity Repair`. The
bounded R3 slice is complete on protected merge; afterward the operator reconciles again without an
owner engineering-dispatch prompt.

**Allowed loop modes:** `program`, `evidence`, `discovery`

---

### /goal azure-county-runtime

```
Goal:     Define Azure and county runtime boundaries without creating competing control planes.
Program:  P8 — Azure / DevOps / County Runtime
File:     programs/azure-county-runtime.md
Success:  Azure App Service requirements documented; slot strategy defined; rollback runbook exists. No county-facing production boundary until authorized.
```

**Current state:** WO-AZURE-003 is complete on protected merge. WO-AZURE-004/005 remain blocked on
authorized live-smoke evidence, so the safe Azure lane returns to portfolio reconciliation. No slot
inspection, creation, configuration, swap, or deployment is authorized.

**Allowed loop modes:** `once`, `evidence`, `discovery`
**Blocked loop modes:** `program` until explicit deploy authorization (WO-AZURE-006 is an authority wall)

---

## /goal Invariants

1. A `/goal` command does not execute any WO. It sets intent and selects a program.
2. Every `/goal` must map to exactly one program file in the register.
3. If the selected program's next WO is at an authority wall, `/goal` must surface the wall — not route around it.
4. `/goal` output must include: selected program, next unblocked WO, known blockers, authority walls in path.
5. `/goal` does not grant authorization. It surfaces what is possible, not what is permitted.
