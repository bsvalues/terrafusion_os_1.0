# TerraFusion Program Playbook Register

**Version:** 1.0  
**Date:** 2026-06-30  
**Authority:** TerraFusion Brain / WO-WOE-009  
**Classification:** Operator Doctrine — canonical planning surface

---

## Purpose

This register is the canonical source of truth for all active TerraFusion work order programs. Every WO must sit inside a program. Every program has a goal, a sovereignty boundary, an ordered WO list, and explicit stop conditions.

**Rule:** The next WO chosen by the operator or the Brain must be a node inside this register, not a floating suggestion.

---

## Current Program Summary

| # | Program | Status | Next WO |
|---|---------|--------|---------|
| P1 | [Benton Demo / Deployment Readiness](programs/benton-demo-deployment.md) | ACTIVE | WO-DEPLOY-BENTON-003B |
| P2 | [Benton Data Quality](programs/benton-data-quality.md) | ACTIVE | WO-DATA-BENTON-DUPE-001 |
| P3 | [Backend Operational Excellence](programs/backend-operational-excellence.md) | QUEUED | WO-BACKEND-001 |
| P4 | [Property Workbench](programs/property-workbench.md) | QUEUED | WO-WORKBENCH-001 |
| P5 | [TerraPilot Tool Maturity](programs/terrapilot-tool-maturity.md) | ACTIVE | WO-TERRAPILOT-P2 |
| P6 | [Work Order Engine](programs/work-order-engine.md) | ACTIVE | WO-WOE-009 ← THIS WO |
| P7 | [AI / Brain / Operator System](programs/brain-operator-system.md) | QUEUED | WO-BRAIN-001 |
| P8 | [Azure / DevOps / County Runtime](programs/azure-county-runtime.md) | ACTIVE | WO-AZURE-001 |

---

## Known Blockers (as of 2026-06-30)

| Blocker | Blocking |
|---------|---------|
| PR #1112 auto-merge pending (WO-CONFIG-BENTON-001) | WO-DEPLOY-BENTON-003B |
| 14 duplicate parcel groups in `canonical_tf.tf_parcel` | WO-DATA-BENTON-DUPE-001 investigation |
| No Azure App Service environment provisioned | WO-DEPLOY-BENTON-003B, WO-AZURE-001 |
| Backend operational truth not established | WO-BACKEND-001+ |
| Production deployment NOT authorized | All P1 WOs after 003F |

---

## Operator Decision Walls

These actions require explicit operator authorization. The Brain and Claude do not initiate them:

| Wall | Scope |
|------|-------|
| Azure App Service deployment | P1 / P8 |
| Production / county-facing release | P1 |
| PACS connection | P2 / data mutation |
| Schema changes or EF migrations | All programs |
| Data drain or reload | P2 |
| New county enrollment | P8 |

---

## Execution Doctrine

1. Operator or Brain nominates a WO from this register.
2. Claude executes the WO as an operational packet (no self-initiation of walls).
3. Each WO produces required outputs: evidence doc, config change, ADR, or runbook — per the WO definition.
4. After WO completion, register status is updated and next recommended WO is surfaced.
5. WOs in different programs may run in parallel if they do not share a sovereignty boundary.

---

## Program Files

- [P1 — Benton Demo / Deployment Readiness](programs/benton-demo-deployment.md)
- [P2 — Benton Data Quality](programs/benton-data-quality.md)
- [P3 — Backend Operational Excellence](programs/backend-operational-excellence.md)
- [P4 — Property Workbench](programs/property-workbench.md)
- [P5 — TerraPilot Tool Maturity](programs/terrapilot-tool-maturity.md)
- [P6 — Work Order Engine](programs/work-order-engine.md)
- [P7 — AI / Brain / Operator System](programs/brain-operator-system.md)
- [P8 — Azure / DevOps / County Runtime](programs/azure-county-runtime.md)

---

## Change Log

| Date | Change | WO |
|------|--------|----|
| 2026-06-30 | Initial register created | WO-WOE-009 |
