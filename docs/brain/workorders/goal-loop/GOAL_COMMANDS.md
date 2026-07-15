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

**Blocked:** runtime/backend/tools-sync implementation, CI or workflow changes, branch protection,
hook bypass without owner authorization, merge without PR-specific authorization, production,
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

**Current state:** `WO-GOAL-LOOP-MASTER-PLAYBOOK-001` is merged. The playbook governs continuation,
and the owner-selected active lane is Release Engineering at `WO-REL-006` closeout.

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

**Current state:** Release Engineering is closing at `WO-REL-006`; next lane requires owner
selection.

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

**Current state:** `WO-REL-006` closes the Release Engineering docs/governance baseline. After
closeout, no Release Engineering continuation is automatic; the next recommended lane is DevEx Hook
Tooling, owner-selection gated.

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

**Current state:** WO-DATA-BENTON-DUPE-001 investigation CLOSED (PR #1115). Next: WO-DATA-BENTON-DUPE-001B (DELETE 30 rows) — **STOP WALL: data mutation, requires explicit operator authorization.**

**Allowed loop modes:** `evidence`, `discovery`, `once` (for read-only WOs)
**Blocked loop modes:** `program` (until data-mutation authorization granted for DUPE-001B)

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

**Current state:** WO-BACKEND-000 is merged, WO-BACKEND-OE-001 established the baseline,
WO-BACKEND-OE-002 recorded the zero-warning register, and the refreshed playbook routes next to
WO-BACKEND-OE-003. This lane is hardening/proof/release discipline, not a foundation rebuild.

**Allowed loop modes:** `once`, `program`, `evidence`, `discovery`

**Command aliases:** `/backend-start`, `/backend-status`, `/backend-next`, `/backend-stop`

**Blocked:** production deployment, secrets, county data, PACS, live DB, schema migration apply,
TerraPilot P16, and any backend runtime mutation not explicitly authorized by the current WO.

---

### /goal sync-workbook-tooling

```
Goal:     Continue Sovereign Sync workbook tooling only after owner selection.
Program:  Sovereign Sync Workbook Tooling
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Workbook lifecycle checks are built-fresh, synthetic-safe, evidence-backed, and Gate-14 compliant.
```

**Current state:** `WO-SYNC-132` is next after owner selection. Do not start Sync implementation from
a status command or from Backend OE.

**Command aliases:** `/sync-status`, `/sync-next`, `/sync-stop`

**Allowed loop modes:** `evidence`, `discovery`, `once` before selection; `program` only after owner
selects Sync.

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

**Current state:** WO-WORKBENCH-001 is next (QUEUED).

**Allowed loop modes:** `once`, `program`, `evidence`, `discovery`

---

### /goal sync-status

```
Goal:     Inspect Sovereign Sync workbook tooling state before any owner-selected implementation WO.
Program:  Sovereign Sync Workbook Tooling
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Operator sees WO-SYNC-132 as the next owner-selection-gated workbook tooling WO.
```

**Current state:** `WO-SYNC-132` is next after owner choice. Do not start Sync implementation from this
status command.

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
Goal:     Inspect Local OMEN runtime repair state without authorizing runtime mutation.
Program:  Local OMEN Runtime Repair
File:     programs/ACTIVE_PROGRAM_PLAYBOOK.md
Success:  Operator sees WO-LOCAL-093 as a diagnosis-first runtime repair gate.
```

**Current state:** Blocked at runtime repair gate.

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

**Current state:** `WO-MAO-004` completed in PR #1286. `WO-MAO-005` is active and creates
evidence-informed subordinate agent playbooks; `WO-MAO-006` is next.

**Mode B:** The canonical
[Merge Authority Model](../operator/MERGE_AUTHORITY_MODEL.md#mode-b-preauthorized-operator-merge)
defines Mode B as preauthorized operator merge under recorded, revocable, exact-scope authority.
MAO-002 consumed its two-PR issue #1276 grant and released the paired operational variables after
post-merge assurance. The owner has ratified
`OWNER-PROGRAM-MAO-001-R3-CONTINUATION-ENVELOPE`, which now supplies bounded, revocable Mode B
authority for eligible MAO-005 through MAO-007 work without per-PR owner routing.

**Allowed loop modes:** `once`, `program`, `evidence`, `discovery`

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

**Current state:** DevEx Hook Bootstrap is closed. Brain Operator evidence baseline is complete at
WO-BRAIN-009; the next action is portfolio reconciliation — select the next dependency-cleared lane (no
lane preselected).

**Allowed loop modes:** `program`, `evidence`, `discovery`

---

### /goal azure-county-runtime

```
Goal:     Define Azure and county runtime boundaries without creating competing control planes.
Program:  P8 — Azure / DevOps / County Runtime
File:     programs/azure-county-runtime.md
Success:  Azure App Service requirements documented; slot strategy defined; rollback runbook exists. No county-facing production boundary until authorized.
```

**Current state:** WO-AZURE-001 is next. Parallel to WO-DEPLOY-BENTON-003B but depends on P1 preflight clearing.

**Allowed loop modes:** `once`, `evidence`, `discovery`
**Blocked loop modes:** `program` until explicit deploy authorization (WO-AZURE-006 is an authority wall)

---

## /goal Invariants

1. A `/goal` command does not execute any WO. It sets intent and selects a program.
2. Every `/goal` must map to exactly one program file in the register.
3. If the selected program's next WO is at an authority wall, `/goal` must surface the wall — not route around it.
4. `/goal` output must include: selected program, next unblocked WO, known blockers, authority walls in path.
5. `/goal` does not grant authorization. It surfaces what is possible, not what is permitted.
