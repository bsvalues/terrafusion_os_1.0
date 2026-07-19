# Cross-Program Dependency Graph

**Version:** 1.2
**Date:** 2026-07-18
**Authority:** WO-WOE-014, current-state refresh by WO-PORTFOLIO-012
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
| **SW-01** deployment / cloud / reachability | Benton 003D, Azure 004-006 | New live inspection, resource mutation, deployment, and reachability remain blocked; P8 MGMT-005 already deployed in PR #1157 |
| **SW-02 / SW-03 / SW-08** protected data, credentials, integration | New Benton remediation | Prior audit and bounded cleanup grants are consumed; new protected work needs a new packet |
| **SW-04** production / county go-live | Benton demo, Azure county boundary | No production or county activation is authorized |
| **SW-05** unresolved authority / sovereign boundary | Runtime import disposition, Sync selection gate | No sovereign import or unselected implementation program starts implicitly |
| **SW-09** runtime behavior | Local OMEN repair after diagnosis, TerraPilot L3 integration | Observable runtime mutation needs exact scope; read-only diagnosis and design are not themselves SW-09 |
| **SW-10** security / auth policy | Management deploy and live product surfaces | Security posture changes remain protected |

---

## 2. What Runs With No New Authority

At WO-PORTFOLIO-003 reconciliation, the previously listed safe lanes are complete:

- Work Order Engine closed at WO-WOE-013.
- Brain closed its evidence baseline at WO-BRAIN-009.
- Backend Operational Excellence closed at WO-BACKEND-OE-013.
- Azure's committed-evidence slice closed at WO-AZURE-003.

No registered Work Order currently runs without new authority. The terminal classification is
`ALL_LANES_PARKED`, not an invitation to revive completed nodes or select an advisory registry seed.

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
  starts only after the recorded program-selection gate is cleared
  Gate 14 and live-data prohibitions remain binding

LOCAL OMEN RUNTIME REPAIR
  starts at WO-LOCAL-093 only under a bounded local diagnosis envelope
  read-only inspect/log/health proof is not SW-09; mutation after diagnosis requires exact authority

RUNTIME IMPORT
  starts at WO-CORE-1 only after the sovereign import disposition is authorized
```

---

## 4. Program Dependency Map

| Program | Completed | Next recorded node | Dependency | State |
|---------|-----------|--------------------|------------|-------|
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
| local-omen-runtime-repair | LOCAL-097 image acquisition/build and Postgres recovery complete | proposed LOCAL-098 credential rotation and safe app startup | credential mutation and secret-bearing source reconciliation / SW-03 / SW-09 | CREDENTIAL MUTATION BLOCKED |
| runtime-import-disposition | none | CORE-1 | SW-05 / sovereign boundary | PARKED |

---

## 5. Operator Reading

1. No dependency-cleared authorized node exists at WO-PORTFOLIO-003.
2. Do not rerun completed Work Orders to avoid an honest parked state.
3. Do not ask the owner to dispatch routine engineering when the graph is parked.
4. When a canonical node or applicable grant appears, rerun the Portfolio Operator algorithm and
   continue automatically if the node is dependency-cleared and inside authority.
5. Live, data, runtime mutation, TerraPilot direction/promotion, and import paths retain their exact
   recorded walls. Do not classify read-only diagnosis or design as runtime expansion.

---

## 6. Change Log

| Date | Change | WO |
|------|--------|----|
| 2026-07-01 | Cross-program dependency graph; authorization-to-unblocks map; prerequisite chains | WO-WOE-014 |
| 2026-07-16 | Removed completed-node executable claims and recorded all-lanes-parked state | WO-PORTFOLIO-003 |
| 2026-07-18 | Decomposed runtime diagnosis/import/promotion and removed stale MGMT-005 deployment wall | WO-PORTFOLIO-012 |
| 2026-07-18 | Verified historical Docker volume, recovered engine against preserved state, and isolated proof-container reconstitution | WO-LOCAL-095 |
| 2026-07-18 | Failed closed before proof-container creation because both required local images are absent | WO-LOCAL-096 |
| 2026-07-19 | Acquired immutable images and recovered Postgres on preserved persistence; stopped before OMEN startup after transient credential output | WO-LOCAL-097 |

---

**WO-WOE-014: COMPLETE.** WO-PORTFOLIO-003 refreshes current status only; it does not reopen the
closed Work Order Engine or create a replacement queue.
