# Command-to-Program Map

**Authority:** WO-WOE-010  
**Last Updated:** 2026-07-03
**Classification:** Operator Doctrine — current state snapshot

This file maps every `/goal` command to its program, current next WO, blockers, allowed loop modes,
and active stop walls. Update this file when a WO completes or a blocker resolves.

---

## Quick Reference Table

| `/goal` command | Program | Next WO | Blocked? | Allowed /loop modes |
|-----------------|---------|---------|----------|---------------------|
| `benton-demo` | P1 | WO-DEPLOY-BENTON-003B | YES — PR #1112 not merged | `once`, `merge-watch`, `evidence` |
| `benton-data-quality` | P2 | WO-DATA-BENTON-DUPE-001B | YES — SW-02 data mutation wall | `evidence`, `discovery` |
| `backend-excellence` | P3 | WO-BACKEND-001 | NO | `once`, `program`, `evidence`, `discovery` |
| `property-workbench` | P4 | WO-WORKBENCH-001 | NO | `once`, `program`, `evidence`, `discovery` |
| `terrapilot-maturity` | P5 | WO-TERRAPILOT-P16 (blocked; owner authorization required) | YES — live promotion remains an owner/runtime decision | `once`, `program`, `evidence`, `discovery` |
| `work-order-engine` | P6 | WO-WOE-010 → WO-WOE-011 | NO (010 executing) | `once`, `program`, `evidence` |
| `brain-operator` | P7 | WO-BRAIN-001 | NO | `once`, `program`, `evidence`, `discovery` |
| `azure-county-runtime` | P8 | WO-AZURE-001 | NO | `once`, `evidence`, `discovery` |

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
**Success condition:** Runtime truth passes all gates; operational runbook exists; release hygiene enforced.

| WO | Title | Status |
|----|-------|--------|
| WO-BACKEND-001 | Runtime truth audit | **NEXT** |
| WO-BACKEND-002 | Health check contract | QUEUED |
| WO-BACKEND-003 | Logging and observability | QUEUED |
| WO-BACKEND-004 | Release hygiene | QUEUED |
| WO-BACKEND-005 | Error handling sweep | QUEUED |
| WO-BACKEND-006 | Performance baseline | QUEUED |
| WO-BACKEND-007 | Integration test coverage | QUEUED |
| WO-BACKEND-008 | Operational runbook | QUEUED |

No active stop walls at WO-BACKEND-001.

---

### /goal property-workbench → P4

**File:** [programs/property-workbench.md](../programs/property-workbench.md)  
**Success condition:** All workbench tabs have live data, honest empty states, and validated tab contracts.

| WO | Title | Status |
|----|-------|--------|
| WO-WORKBENCH-001 | Parcel dossier data contract | **NEXT** |
| (WOs 002–010) | Tab integration, empty states, owners, geom, etc. | QUEUED |

No active stop walls at WO-WORKBENCH-001.

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
| WO-BRAIN-001 | Brain authority and capability audit | **NEXT** |
| WO-BRAIN-002 through 009 | Domain packs, command vocab, goal/loop integration | QUEUED |

No active stop walls at WO-BRAIN-001.

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
