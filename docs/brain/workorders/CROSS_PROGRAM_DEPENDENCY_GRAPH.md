# Cross-Program Dependency Graph

**Version:** 1.2
**Date:** 2026-07-18
**Authority:** WO-WOE-014, current-state refresh by WO-SR-003 / WO-SR-004
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
| **SW-09** runtime behavior | TerraPilot L3 integration and other TerraFusion runtime changes | Observable runtime mutation needs exact scope; read-only diagnosis and design are not themselves SW-09 |
| **SW-10** security / auth policy | Management deploy and live product surfaces | Security posture changes remain protected |

---

## 2. What Runs With No New Authority

At WO-PORTFOLIO-003 reconciliation, the previously listed safe lanes are complete:

- Work Order Engine closed at WO-WOE-013.
- Brain closed its evidence baseline at WO-BRAIN-009.
- Backend Operational Excellence closed at WO-BACKEND-OE-013.
- Azure's committed-evidence slice closed at WO-AZURE-003.

WO-SR-003 and WO-SR-004 completed repository creation, bootstrap, required-check verification, and
protected-main configuration for all five suite repositories. Forge is dependency-cleared for
bounded extraction because its domain contracts are frozen.

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

CROSS-PROJECT HISTORICAL AUDIT
  WO-LOCAL-093 through WO-LOCAL-097 are WilliamOS/TerraGroq audit history, not TerraFusion capability
  no successor executes in TerraFusion; transfer requires the other project's own canon and authority

RUNTIME IMPORT
  starts at WO-CORE-1 only after the sovereign import disposition is authorized

FIVE-SUITE FEDERATED REPOSITORIES
  WO-SR-002 contract and policy preparation is complete in the sovereign base
  WO-SR-003A through WO-SR-003E repository creation and bootstrap are complete
  WO-SR-004 bootstrap and protected-main verification is complete
  WO-SR-005A Forge valuation-kernel extraction is complete without ownership cutover
  WO-SR-005B-P Atlas preparation is complete with extraction blocked
  WO-SR-005B-C Atlas read-contract decomposition is complete
  WO-SR-005B-I Atlas read-contract implementation and freeze is complete
  WO-SR-005B-A Atlas adapter and standalone parity preparation is complete
  WO-SR-005B-E1 pure unwired sovereign adapter implementation is complete
  WO-SR-005B-E2 standalone synthetic parity is complete
  WO-SR-005B-E3 bounded extraction scope audit is complete with no safe direct-copy slice
  WO-SR-005B-F1 built-fresh standalone spatial projection foundation is complete
  WO-SR-005C-P Dais domain-contract and county-isolation preparation is complete
  WO-SR-005C-C Dais appeal-workflow contract decomposition is complete
  WO-SR-005C-I Dais appeal-workflow contract implementation/freeze is complete
  WO-SR-005D-P Dossier custody/evidence-integrity preparation is complete with cohort correction
  WO-SR-005D-C Dossier evidence-snapshot decomposition is complete with NO_GO
  WO-SR-005D-C2 Dossier evidence-registry read contract decomposition is complete
  WO-SR-005D-I Dossier evidence-registry read implementation/freeze is complete
  WO-SR-005E-P GPT governed-AI contract and grounding preparation is complete
  WO-SR-005E-C GPT grounded-context contract decomposition is complete
  WO-SR-005E-I GPT grounded-context implementation/freeze is complete on merge
  Sequential R3 contract-freeze envelope is consumed; portfolio reconciliation follows
  WO-SR-005B through WO-SR-005E extraction/runtime adoption remains gated by exact scope and parity proof
```

---

## 4. Program Dependency Map

| Program | Completed | Next recorded node | Dependency | State |
|---------|-----------|--------------------|------------|-------|
| five-suite-federated-repository-buildout | SR-001 through SR-005E-I contract-freeze cohort | Portfolio reconciliation | Exact later extraction scope, parity evidence, and authority; runtime/provider adoption blocked | CONTRACT COHORT COMPLETE |
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

1. The Dais, Dossier, and GPT contract-freeze cohort is complete; portfolio reconciliation is next.
2. Do not treat frozen contracts as authority for extraction, adapters, providers, or runtime adoption.
3. Do not rerun completed Work Orders or ask the owner to dispatch routine reconciliation.
4. Any later extraction cohort requires exact scope, parity evidence, and applicable authority; keep provider calls,
   custody mutation, runtime adoption, protected data, publication/workflow changes, and cutover blocked.
5. Live, data, runtime mutation, TerraPilot direction/promotion, and import paths retain their exact
   recorded walls. Do not classify read-only diagnosis or design as runtime expansion.

---

## 6. Change Log

| Date | Change | WO |
|------|--------|----|
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
