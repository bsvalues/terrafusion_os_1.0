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

## Program Commands

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

**Current state:** WO-BRAIN-001 is next (QUEUED).

**Allowed loop modes:** `once`, `program`, `evidence`, `discovery`

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
