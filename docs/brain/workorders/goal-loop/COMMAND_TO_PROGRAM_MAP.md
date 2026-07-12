# Command-to-Program Map

**Authority:** WO-WOE-010
**Last Updated:** 2026-07-08
**Classification:** Operator Doctrine — current state snapshot

This file maps every `/goal` command or command alias to its program, current next WO, blockers,
allowed loop modes, and active stop walls. Update this file when a WO completes or a blocker
resolves.

---

## Quick Reference Table

| Command / alias | Program | Next WO | Blocked? | Allowed /loop modes |
|-----------------|---------|---------|----------|---------------------|
| `codex-operator-autonomy` | Codex Operator Autonomy | CLOSED at WO-OP-AUTO-012 | YES - governing autonomy baseline merged | `once`, `evidence` |
| `codex-operator-playbook` | Codex Operator Work Order Playbook | CLOSED at WO-CODEX-OP-009 | YES - governance capability merged | `once`, `evidence` |
| `goal-loop-master-playbook` | Master Goal/Loop Playbook Governance | CLOSED at WO-GOAL-LOOP-MASTER-PLAYBOOK-001 | YES - governing baseline merged | `once`, `evidence` |
| `program-status` | Master Active Program Playbook | Active program graph | NO | `once`, `evidence`, `discovery` |
| `program-next` | Portfolio Operator | Brain Operator / WO-BRAIN-007 | NO - continue selected evidence/docs chain | `program`, `evidence`, `discovery` |
| `program-stop` | Master Playbook | NONE | YES — operator stop command | `once` |
| `release-engineering` | Release Engineering | CLOSED at WO-REL-006 | YES - baseline closed after rollup | `once`, `evidence`, `discovery` |
| `benton-demo` | P1 | WO-DEPLOY-BENTON-003D | YES - live-surface smoke/evidence requires authority | `once`, `merge-watch`, `evidence` |
| `benton-data-quality` | P2 | WO-DATA-BENTON-DUPE-001B | YES — SW-02 data mutation wall | `evidence`, `discovery` |
| `backend-excellence` | P3 | CLOSED at WO-BACKEND-OE-013 | YES - program closed; owner/WOE selects any follow-up lane | `once`, `program`, `evidence`, `discovery` |
| `backend-start` | P3 | CLOSED at WO-BACKEND-OE-013 | YES - do not restart Backend OE chain | `program` |
| `backend-status` | P3 | CLOSED at WO-BACKEND-OE-013 | YES - status/evidence only | `evidence`, `discovery` |
| `backend-next` | P3 | Owner/WOE lane selection after closeout | YES - no automatic backend continuation | `once`, `evidence` |
| `backend-stop` | P3 | NONE | YES — operator stop command | `once` |
| `sync-workbook-tooling` | Sovereign Sync Workbook Tooling | WO-SYNC-132 | YES — owner selection gated | `once`, `evidence`, `discovery` |
| `sync-status` | Sovereign Sync Workbook Tooling | WO-SYNC-132 | YES — owner selection gated | `evidence`, `discovery` |
| `sync-next` | Sovereign Sync Workbook Tooling | WO-SYNC-132 | YES — owner selection gated | `once`, `evidence` |
| `sync-stop` | Sovereign Sync Workbook Tooling | NONE | YES — operator stop command | `once` |
| `property-workbench` | P4 | CLOSED at WO-WORKBENCH-011 | YES - do not restart closed Workbench evidence chain | `once`, `program`, `evidence`, `discovery` |
| `terrapilot-maturity` | P5 | WO-TERRAPILOT-P16 (blocked; owner authorization required) | YES — live promotion remains an owner/runtime decision | `once`, `program`, `evidence`, `discovery` |
| `terrapilot-status` | P5 | WO-TERRAPILOT-P16 (blocked; owner authorization required) | YES — parked at P15 | `evidence`, `discovery` |
| `terrapilot-stop` | P5 | NONE | YES — operator stop command | `once` |
| `devex-hooks-status` | DevEx Hook Tooling | CLOSED at WO-DEVEX-HOOKS-006 | YES - return to portfolio loop | `evidence`, `discovery` |
| `local-omen-status` | Local OMEN Runtime Repair | WO-LOCAL-093 | YES — runtime repair diagnosis gate | `evidence`, `discovery` |
| `core-import-status` | WO-CORE-1 Runtime Import Disposition | WO-CORE-1 | YES — owner-gated runtime import disposition | `evidence`, `discovery` |
| `workbench-status` | P4 | CLOSED at WO-WORKBENCH-011 | YES - status/evidence only; new phase requires owner/WOE selection | `evidence`, `discovery` |
| `work-order-engine` | P6 | WO-WOE-013 | YES - R2 Program Queue UI soft wall; WOE-012/014 complete | `once`, `evidence` |
| `brain-operator` | Brain Operator System | WO-BRAIN-007 | NO | `once`, `program`, `evidence`, `discovery` |
| `azure-county-runtime` | P8 | WO-AZURE-001 | YES - SW-01 deployment/county boundary | `once`, `evidence`, `discovery` |

---

## Detailed Map

### /goal benton-demo → P1

**File:** [programs/benton-demo-deployment.md](../programs/benton-demo-deployment.md)
**Success condition:** All preflight checklist items verified; operator holds deploy authorization decision.

| WO | Title | Status | Notes |
|----|-------|--------|-------|
| WO-DEPLOY-BENTON-002E | Migrations verified | CLOSED | 94 applied, 0 pending |
| WO-DEPLOY-BENTON-003A | Local demo rehearsal | CLOSED | PR merged |
| WO-CONFIG-BENTON-001 | Config gates aligned | CLOSED | PR #1112 auto-merge queued |
| WO-DEPLOY-BENTON-003B | Azure preflight | **NEXT** | **Blocked: PR #1112 must merge first** |
| WO-DEPLOY-BENTON-003C | App settings packet | QUEUED | After 003B |
| WO-DEPLOY-BENTON-003D | Smoke slot deploy | QUEUED | SW-01 wall — deploy auth required |
| WO-DEPLOY-BENTON-003E | Smoke validation | QUEUED | After 003D |
| WO-DEPLOY-BENTON-003F | Demo authorization packet | QUEUED | SW-09 owner decision required |

**Active stop walls in path:** SW-01 (003D), SW-09 (003F)

**Recommended first move:**
```
/goal benton-demo
/loop merge-watch
```
— monitors PR #1112; once merged, advances to 003B with `/loop once`.

---

### /goal benton-data-quality → P2

**File:** [programs/benton-data-quality.md](../programs/benton-data-quality.md)
**Success condition:** All data anomaly groups documented and classified; cleanup WOs authorized before execution.

| WO | Title | Status | Notes |
|----|-------|--------|-------|
| WO-DATA-BENTON-DUPE-001 | Duplicate row investigation | CLOSED | PR #1115 auto-merge queued; 30 anomalous rows documented |
| WO-DATA-BENTON-DUPE-001B | Delete 30 anomalous rows | **NEXT** | **SW-02 WALL — data mutation, explicit auth required** |
| WO-DATA-BENTON-ADDR-001 | Address data gap investigation | QUEUED | Read-only; after DUPE-001 |
| WO-DATA-BENTON-GEOM-001 | Geometry data gap investigation | QUEUED | Read-only |
| WO-DATA-BENTON-OWNER-001 | Owner data gap investigation | QUEUED | Read-only |
| WO-DATA-BENTON-EVIDENCE-ROLLUP | Full data quality evidence packet | QUEUED | After all above |

**Active stop walls:** SW-02 at WO-DATA-BENTON-DUPE-001B (explicit operator data-mutation auth required)

**Recommended first move:**
```
/goal benton-data-quality
/loop evidence
```
— collects remaining evidence on DUPE-001 without advancing to the mutation step.

---

### /goal backend-excellence → P3

**File:** [programs/backend-operational-excellence.md](../programs/backend-operational-excellence.md)
**Success condition:** Backend operational truth, warnings, runtime validation, release gates,
runbooks, diagnostics, rollback, and evidence rollup are explicit enough for WOE to choose the next lane.

| WO | Title | Status |
|----|-------|--------|
| WO-BACKEND-000 | Backend Operational Excellence Program Playbook | CLOSED |
| WO-BACKEND-OE-001 | Backend Operational Excellence Baseline | COMPLETE — evidence preserved in OE-002 packet |
| WO-BACKEND-OE-001-S | Baseline generated residue classification | COMPLETE |
| WO-BACKEND-OE-002 | Build Warning Register | CLOSED |
| WO-BACKEND-OE-PLAYBOOK-REFRESH | Full Backend OE Work Order Playbook | CLOSED |
| WO-BACKEND-OE-003 | Integration Test Environment Dependency Register | CLOSED |
| WO-BACKEND-OE-004 | Health and Readiness Semantics Proof | CLOSED |
| WO-BACKEND-OE-005 | Service Registry Runtime Validation | CLOSED |
| WO-BACKEND-OE-006 | Security/Auth/County-Isolation Proof Matrix | CLOSED |
| WO-BACKEND-OE-007 | Migration and Rollback Proof Register | CLOSED |
| WO-BACKEND-OE-008 | Dais Workflow E2E Proof Expansion Plan | CLOSED |
| WO-BACKEND-OE-009 | Backend Release Gate Definition | CLOSED |
| WO-BACKEND-OE-010 | Backend Operational Runbook | CLOSED |
| WO-BACKEND-OE-011 | Diagnostics and Observability Map | CLOSED |
| WO-BACKEND-OE-012 | Backend Operational Packet | CLOSED |
| WO-BACKEND-OE-013 | Evidence Rollup and Program Closeout | CLOSING IN PR #1239 |

Backend OE has no automatic next WO after OE-013. Owner/WOE must select any follow-up lane, especially
if the work requires production deployment, secrets, county data, PACS, live DB, schema migration
apply, TerraPilot P16, backend runtime mutation, CI wiring, or release-gate automation.

---

### /goal property-workbench → P4

**File:** [programs/property-workbench.md](../programs/property-workbench.md)
**Success condition:** All workbench tabs have live data, honest empty states, and validated tab contracts.

| WO | Title | Status |
|----|-------|--------|
| WO-WORKBENCH-001 through WO-WORKBENCH-010 | Workbench evidence baseline chain | CLOSED |
| WO-WORKBENCH-011 | Evidence Rollup | CLOSED |

Property Workbench is not a current executable restart target. Any future Workbench work requires a
new owner/WOE-selected phase and must not rerun the closed evidence baseline chain.

---

### /goal terrapilot-maturity → P5

**File:** [programs/terrapilot-tool-maturity.md](../programs/terrapilot-tool-maturity.md)
**Success condition:** TerraPilot maturity claims are governed by protocol, evidence, and machine-readable metadata before any live promotion is attempted.

| WO | Title | Status |
|----|-------|--------|
| WO-TERRAPILOT-P1 | Tool maturity matrix | DONE/PARTIAL |
| WO-TERRAPILOT-P2 | Promotion protocol | COMPLETE IN PR |
| WO-TERRAPILOT-P3 | Maturity metadata enforcement review | COMPLETE IN PR |
| WO-TERRAPILOT-P4 | Stub-to-live promotion candidate queue | COMPLETE IN PR |
| WO-TERRAPILOT-P5 | Handler / manifest / maturity parity evidence | COMPLETE IN PR |
| WO-TERRAPILOT-P6 | Tooling operator packet | COMPLETE IN PR |
| WO-TERRAPILOT-P7 | Evidence rollup | COMPLETE IN PR |
| WO-TERRAPILOT-P8 | Maturity metadata enforcement | COMPLETE IN PR |
| WO-TERRAPILOT-P9 | First promotion candidate decision | COMPLETE IN PR |
| WO-TERRAPILOT-P10 | Contract-covered candidate evidence packet | COMPLETE IN PR |
| WO-TERRAPILOT-P11 | Contract-covered metadata decision | COMPLETE IN PR |
| WO-TERRAPILOT-P12 | Contract-covered metadata change authorization packet | COMPLETE IN PR |
| WO-TERRAPILOT-P13 | Contract-covered metadata change | COMPLETE IN PR |
| WO-TERRAPILOT-P14 | Contract-covered metadata stop-gate rollup | COMPLETE IN PR |
| WO-TERRAPILOT-P15 | Future promotion authorization decision packet | COMPLETE IN PR |
| WO-TERRAPILOT-P16 | Live integration design packet | BLOCKED — owner authorization required |

WO-TERRAPILOT-P11 decided that `summarize_levy_rate_components` remains a valid candidate for a
future `contract-covered` metadata change, but it did not mutate maturity metadata. WO-TERRAPILOT-P12
recorded the exact owner-decision packet for whether to authorize that metadata change.
WO-TERRAPILOT-P13 applies only that authorized L2 / `contract-covered` metadata change while keeping
`liveIntegration: false`. WO-TERRAPILOT-P14 is the evidence-only stop-gate rollup. WO-TERRAPILOT-P15
records the future promotion authorization choices and the required proof before any live/backend
promotion path. Any runtime promotion, backend integration, `liveIntegration: true` claim, deployment,
secrets, county data, PACS, live DB access, or schema migration remains a stop wall before a separate
owner-authorized runtime promotion WO.

---

### /goal work-order-engine → P6

**File:** [programs/work-order-engine.md](../programs/work-order-engine.md)
**Success condition:** Brain can query the WO engine, score next WOs, and present a plan the operator can act on.

| WO | Title | Status |
|----|-------|--------|
| WO-WOE-001–008 | Registry, scoring, query, goal/loop | DONE/MERGED |
| WO-WOE-009 | Program Playbook Register | CLOSED — PR #1114 |
| WO-WOE-010 | Goal/Loop Program Playbook Binding | **EXECUTING** (this WO) |
| WO-WOE-011 | Operator dashboard / next-WO report | QUEUED |

No active stop walls at WO-WOE-011 (after 010 merges).

---

### /goal brain-operator → P7

**File:** [programs/brain-operator-system.md](../programs/brain-operator-system.md)
**Success condition:** Brain authority is documented and evidence-backed; suites have domain packs, not their own brains.

| WO | Title | Status |
|----|-------|--------|
| WO-BRAIN-001 | Brain authority and capability audit | COMPLETE - PR #1140 |
| WO-BRAIN-002 | Domain pack completeness audit | COMPLETE |
| WO-BRAIN-003 | Operator command vocabulary reconciliation | COMPLETE |
| WO-BRAIN-004 | Goal engine maturity review | COMPLETE |
| WO-BRAIN-005 | Loop engine maturity review | COMPLETE |
| WO-BRAIN-006 | Memory and provenance integration audit | COMPLETE |
| WO-BRAIN-007 | Agent role and stop-gate matrix | **CURRENT** |
| WO-BRAIN-008 through 009 | Continuation and integration evidence | QUEUED |

No active stop walls at WO-BRAIN-007.

---

### /goal azure-county-runtime → P8

**File:** [programs/azure-county-runtime.md](../programs/azure-county-runtime.md)
**Success condition:** Azure App Service requirements documented; slot strategy defined; rollback runbook exists. No county production boundary until authorized.

| WO | Title | Status |
|----|-------|--------|
| WO-AZURE-001 | Azure App Service preflight | **NEXT** |
| WO-AZURE-002 | App settings and secret inventory | QUEUED |
| WO-AZURE-003 | Deployment slot strategy | QUEUED |
| WO-AZURE-004 | Observability and log capture | QUEUED |
| WO-AZURE-005 | Rollback and restart runbook | QUEUED |
| WO-AZURE-006 | County-owned production boundary packet | QUEUED — **SW-01 + SW-09 wall** |

Active stop walls: SW-01 and SW-09 at WO-AZURE-006.

---

## Update Protocol

This file must be updated when:
- A WO changes status (QUEUED → NEXT → EXECUTING → CLOSED)
- A blocker resolves (PR merges, authorization granted)
- A new authority wall is encountered
- A new WO is added to a program

Update and include in the same PR as the evidence for the completing WO.
