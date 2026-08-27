# Cross-Program Dependency Graph

**Version:** 1.3
**Date:** 2026-08-27
**Authority:** WO-WOE-014, current-state refresh by WO-WAL-000
**Classification:** Operator Doctrine - makes the Wall Ledger operational
**Builds on:** [AUTONOMOUS_CONTINUATION_GATE.md](AUTONOMOUS_CONTINUATION_GATE.md) (WOE-012),
[WORK_ORDER_PROGRAM_QUEUE.md](WORK_ORDER_PROGRAM_QUEUE.md), and
[STOP_WALL_REGISTER.md](STOP_WALL_REGISTER.md).

---

## 0. Purpose

The Wall Ledger records what is parked. This graph records which protected boundary blocks each
remaining lane and whether any registered Work Order can execute without new authority. Historical
completion does not make a closed Work Order executable again.

---

## 1. Protected Boundary to Parked Lane

| Boundary | Parked lanes | Current effect |
|----------|--------------|----------------|
| **WAL-READONLY** external county-source boundary | WAL-001-008 | Public acquisition, upload and Sync may ingest into TerraFusion-controlled county-scoped storage; no external county-system DML or write-back is authorized |
| **WAL-ACCEPTANCE** exact release gate | WAL-008 | Production remains blocked until WAL-007 accepts the exact candidate with zero launch-blocking gaps |
| **SW-01** deployment / cloud / reachability | Benton 003D, Azure 004-006 | New live inspection, resource mutation, deployment, and reachability remain blocked; P8 MGMT-005 already deployed in PR #1157 |
| **SW-02 / SW-03 / SW-08** protected data, credentials, integration | New Benton remediation | Prior audit and bounded cleanup grants are consumed; new protected work needs a new packet |
| **SW-04** production / county go-live | Benton demo, Azure county boundary | No production or county activation is authorized |
| **SW-05** unresolved authority / sovereign boundary | Runtime import disposition, Sync selection gate | No sovereign import or unselected implementation program starts implicitly |
| **SW-09** runtime behavior | TerraPilot L3 integration and other TerraFusion runtime changes | Observable runtime mutation needs exact scope; read-only diagnosis and design are not themselves SW-09 |
| **SW-10** security / auth policy | Management deploy and live product surfaces | Security posture changes remain protected |

The `SW-*` rows continue to govern their named legacy lanes. For WAL only, Issue #1485 supplies the
new mission authority: it does not clear the `WAL-ACCEPTANCE` gate, authorize external county-system
write-back, or permit production before the exact WAL-007 candidate is accepted.

---

## 2. What Runs With No New Authority

At WO-PORTFOLIO-003 reconciliation, the previously listed safe lanes are complete:

- Work Order Engine closed at WO-WOE-013.
- Brain closed its evidence baseline at WO-BRAIN-009.
- Backend Operational Excellence closed at WO-BACKEND-OE-013.
- Azure's committed-evidence slice closed at WO-AZURE-003.

The Five-Suite Federated Repository Buildout is complete through `WO-SR-MISSION-COMPLETION`.
Protected suite ownership, sovereign runtime adoption, exact provenance, rollback, and duplicate
retirement are terminal. No automatic successor remains inside that mission; Forge WO-SR-007 is
legitimately pending outside it.

Washington Assessor Launch V1 is active under Issue #1485 and
`OWNER-WAL-V1-MISSION-AUTHORITY-20260827`. On protected merge of WO-WAL-000, WAL-001, WAL-002 and
WAL-003 become dependency-cleared for isolated execution; WAL-004 may overlap only through exact
reservation-safe bounded children. This is a new applicable objective and authority, not a successor
inside the completed Five-Suite mission.

---

## 3. Current Prerequisite Chains

```text
LIVE DEMO OR DEPLOYMENT
  requires SW-01 and, where applicable, SW-04 / SW-10
  then bounded live-smoke, observability, and rollback evidence

PROTECTED DATA REMEDIATION
  requires a new exact data packet
  plus SW-02 for mutation, SW-03 for credentials, or SW-08 for new integration

TERRAPILOT PROMOTION
  P16 design starts only after the recorded strategic direction gate is cleared
  L3 runtime or auth changes require a later exact SW-09 / SW-10 packet
  L4 promotion requires evidence-backed maturity and operator-visible capability authority

SOVEREIGN SYNC IMPLEMENTATION
  the earlier unselected implementation program remains closed behind its recorded selection gate
  WAL read-only Sync is a separately authorized, county-scoped child under Issue #1485
  Gate 14, no-external-DML, credential, and protected-data prohibitions remain binding

CROSS-PROJECT HISTORICAL AUDIT
  WO-LOCAL-093 through WO-LOCAL-097 are WilliamOS/TerraGroq audit history, not TerraFusion capability
  no successor executes in TerraFusion; transfer requires the other project's own canon and authority

RUNTIME IMPORT
  starts at WO-CORE-1 only after the sovereign import disposition is authorized

WASHINGTON ASSESSOR LAUNCH V1
  WO-WAL-000 activates Issue #1485 on protected main
  then WO-WAL-001 public baseline, 002 upload and 003 read-only Sync run in isolated lanes
  bounded non-colliding WO-WAL-004 identity/isolation/trust children may overlap
  stable 001-004 contracts clear WO-WAL-005 Counties HUB and WO-WAL-006 TerraForge
  WO-WAL-007 accepts one exact release candidate across all 39 county contexts
  only that accepted candidate may enter WO-WAL-008 production and external assessor acceptance
  WO-WAL-009 consumes the mission with no automatic successor

FIVE-SUITE FEDERATED REPOSITORIES
  complete through WO-SR-MISSION-COMPLETION
  all five suite repositories own their ratified capability
  sovereign consumers use governed exact-artifact boundaries with observed rollback
  duplicate mutable ownership is retired while legitimate OS integration custody is preserved
  no automatic successor remains inside the completed mission
  Forge WO-SR-007 remains pending outside this mission
```

---

## 4. Program Dependency Map

| Program | Completed | Next recorded node | Dependency | State |
|---------|-----------|--------------------|------------|-------|
| washington-assessor-launch-v1 | 000 complete on protected merge | 001, 002, 003 plus bounded reservation-safe 004 | protected activation merge, exact child reservations, external read-only boundary; 007 gates production | ACTIVE |
| five-suite-federated-repository-buildout | Complete through `WO-SR-MISSION-COMPLETION` | no automatic successor | New work requires another applicable objective and authority; Forge WO-SR-007 remains outside this mission | CLOSED |
| p8-management-dashboard | 001-006 | no automatic successor | authenticated verification needs SW-03; county release needs SW-04/SW-10 | BASELINE COMPLETE |
| benton-demo | 002, 003A-C, CONFIG-001 | 003D live smoke | SW-01 + SW-04 | PARKED |
| benton-data-quality | audits, rollup, prior bounded remediation | new protected remediation packet | SW-02 / SW-03 / SW-08 | PARKED |
| backend-excellence | 001-013 | no automatic successor | new bounded program authority | CLOSED |
| property-workbench | 001-011 | no automatic restart | new product-phase authority | CLOSED |
| terrapilot-maturity | P1-P15 baseline | P16 design-only | strategic design authorization; L3/L4 later require separate runtime/promotion authority | PARKED |
| sovereign-sync-workbook-tooling | 057, 058, 130, 131 | SYNC-132 | recorded program-selection gate | PARKED |
| work-order-engine | 001-014 including 013 report | no successor | new registry/runtime program authority | CLOSED |
| brain-operator | 001-009 | no successor | new implementation program authority | CLOSED |
| azure-county-runtime | 001-003 | AZURE-004/005 live evidence | SW-01 / SW-03 / SW-04 | DEPENDENCY BLOCKED |
| cross-project-historical-audit | LOCAL-093 through LOCAL-097 preserved as audit history | no TerraFusion successor; LOCAL-098 withdrawn | separate WilliamOS/TerraGroq repository, canon, WO, and authority | OUT_OF_SCOPE_CROSS_PROJECT |
| runtime-import-disposition | none | CORE-1 | SW-05 / sovereign boundary | PARKED |

---

## 5. Operator Reading

1. Washington Assessor Launch V1 is the current active mission. Complete WO-WAL-000 through
   protected main, then dispatch exact reservation-safe children without treating any child as the
   mission boundary.
2. Five-Suite routing remains terminal at `WO-SR-MISSION-COMPLETION`; WAL is a separately authorized
   product-launch objective, not a reopened Five-Suite successor.
3. Forge WO-SR-007 remains pending outside the completed Five-Suite mission and is not changed by WAL.
4. External county sources remain read-only, and WAL production remains gated on exact WAL-007
   acceptance plus observed production controls and external assessor evidence.
5. Live, data, runtime mutation, TerraPilot direction/promotion, and import paths retain their exact
   recorded walls. Do not classify read-only diagnosis or design as runtime expansion.

---

## 6. Change Log

| Date | Change | WO |
|------|--------|----|
| 2026-08-27 | Activated the finite Washington Assessor Launch V1 graph under Issue #1485 while preserving external read-only and exact-production gates | WO-WAL-000 |
| 2026-08-27 | Closed Five-Suite routing after terminal protected runtime, rollback, ownership, and duplicate-retirement reconciliation | WO-SR-MISSION-COMPLETION |
| 2026-07-19 | Created, bootstrapped, checked, and protected all five suite repositories; admitted Forge extraction | WO-SR-003 / WO-SR-004 |
| 2026-07-01 | Cross-program dependency graph; authorization-to-unblocks map; prerequisite chains | WO-WOE-014 |
| 2026-07-16 | Removed completed-node executable claims and recorded all-lanes-parked state | WO-PORTFOLIO-003 |
| 2026-07-18 | Decomposed runtime diagnosis/import/promotion and removed stale MGMT-005 deployment wall | WO-PORTFOLIO-012 |
| 2026-07-18 | Verified historical Docker volume, recovered engine against preserved state, and isolated proof-container reconstitution | WO-LOCAL-095 |
| 2026-07-18 | Failed closed before proof-container creation because both required local images are absent | WO-LOCAL-096 |
| 2026-07-19 | Acquired immutable images and recovered Postgres on preserved persistence; stopped before OMEN startup after transient credential output | WO-LOCAL-097 |
| 2026-07-19 | Reclassified LOCAL-093 through LOCAL-097 as cross-project audit history and withdrew LOCAL-098 from TerraFusion routing | WO-PORTFOLIO-013 |
| 2026-07-19 | Restored the ratified five-suite program; isolated the repo-create credential from in-repo contract and policy work | WO-SR-002 |

---

**WO-WOE-014: COMPLETE.** WO-PORTFOLIO-003 refreshes current status only; it does not reopen the
closed Work Order Engine or create a replacement queue.
