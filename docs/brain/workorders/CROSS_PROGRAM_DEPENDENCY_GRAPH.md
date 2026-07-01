# Cross-Program Dependency Graph

**Version:** 1.0
**Date:** 2026-07-01
**Authority:** WO-WOE-014
**Classification:** Operator Doctrine — makes the Wall Ledger operational
**Builds on:** [AUTONOMOUS_CONTINUATION_GATE.md](AUTONOMOUS_CONTINUATION_GATE.md) (WOE-012),
[WORK_ORDER_PROGRAM_QUEUE.md](WORK_ORDER_PROGRAM_QUEUE.md), [STOP_WALL_REGISTER.md](STOP_WALL_REGISTER.md).

---

## 0. Purpose

The Wall Ledger lists *what* is parked. This graph answers the operational questions:
**which authorization unblocks which lane, what can still run with no authorization, and what the
prerequisite chains are for the heavier lanes.** One decision from the human can reopen several
lanes at once — this doc shows exactly which.

---

## 1. Authorization → Unblocks (the operational key)

Authorizing one wall reopens the lanes below it. Walls are shared across programs — this is why one
approval cascades.

| Authorize | Reopens (WOs / lanes) | Risk after auth |
|-----------|-----------------------|-----------------|
| **SW-01** deploy / cloud / reachability | MGMT-005 (frontend deploy) · property-workbench SPA reachability · terrapilot Node pilot-runtime deploy · azure-county-runtime WO-AZURE-001+ | provisioning/deploy |
| **SW-02** data mutation | benton-data-quality DUPE-001B (delete 30 rows) | irreversible-ish delete |
| **SW-03** credentialed DB read | benton-data-quality quarantine classification (owner-current 87,909 · imprv-attr 1.87M) · ADDR/legal null measurement | read-only, but secret-handling |
| **SW-09** runtime behavior code | backend-004 (health/readiness truth) · backend-005 (config contract, GIT_SHA) · terrapilot first-tool .NET port · WOE-013 (Program Queue UI) | scoped code + tests |
| **SW-10** auth/security policy | backend-006 (auth/security proof) · property-workbench tab auth/session · terrapilot backend-endpoint auth · MGMT-005 public-surface auth posture | auth posture change |

**Highest-leverage single approval:** **SW-01** — it reopens four lanes (P8 deploy, workbench
reachability, terrapilot runtime, Azure runtime). But note the cascade prerequisites in §3.

---

## 2. What Runs With NO Authorization (safe lanes remaining)

| Lane | Next WO | Risk | Notes |
|------|---------|------|-------|
| work-order-engine | WOE-014 (this) → then WOE-013 is R2 code | R1 → soft wall | 013 UI needs SW-09-class authorization |
| brain-operator | WO-BRAIN-001 (capability/authority audit) | R0 | read-only; not yet run this session |
| backend-excellence | 007 (release gate def), 008 (operational runbook) | R1 docs | **low value until 004-006 land** — they document a system whose health/config fixes are pending; best sequenced after SW-09 |

**Recommended safe order:** WOE-014 → brain-operator WO-BRAIN-001 → (then heavier lanes require an
authorization from §1). Backend 007/008 are deferred by dependency (§4), not by a wall.

---

## 3. Prerequisite Chains (what must precede what)

```
FULL DEMO (frontend + backend + pilot, live & honest)
  requires:
    SW-01 (deploy)  ── MGMT-005 frontend deploy ── depends on ── MGMT-003 (merged #1125) ✓
                    └─ terrapilot Node runtime deploy
    SW-10 (auth)    ── workbench tab data + terrapilot endpoints + MGMT-005 auth posture
    SW-09 (code)    ── backend-004 health/readiness truth  ← makes the deployed runtime honest first
  recommended sequence:
    backend-004 (SW-09) → MGMT-005 (SW-01+SW-10) → workbench-live → terrapilot-L3

TERRAPILOT FIRST-L3 (explain_model_results)
  requires:
    SW-01 (deploy Node runtime)  OR  SW-09 (.NET port of one handler)
    SW-10 (its backend endpoint /api/costforge/* is auth-gated)
    NOT SW-03 (pick a non-Muse read_only tool → no ANTHROPIC_API_KEY)

DATA CLEANUP / DEEP DATA QUALITY
    SW-02 → DUPE-001B (delete 30 rows)          [independent, small blast radius]
    SW-03 → quarantine classification + addr/legal null   [read-only but credentialed]

BACKEND OPERATIONAL EXCELLENCE
    SW-09 → 004 (health truth) → 005 (config/GIT_SHA)
    SW-10 → 006 (auth proof)
    then R1 docs: 007 (release gate) → 008 (runbook)   [depend on 004-006 for real content]
```

---

## 4. Program Dependency Map (nodes + edges)

| Program | Done | Next | Depends on | Blocks |
|---------|------|------|-----------|--------|
| p8-management-dashboard | 001-004 | MGMT-005 deploy | SW-01+SW-10; MGMT-003 ✓ | workbench reachability |
| benton-data-quality | 4 audits | DUPE-001B / quarantine | SW-02 / SW-03 | — (leaf) |
| backend-excellence | 001-003 | 004 health truth | SW-09 | 007/008 docs; improves demo runtime for all |
| property-workbench | 001-010 | SPA deploy / auth / pilot | SW-01 (via MGMT-005) + SW-10 + terrapilot runtime | full E2E parcel flow |
| terrapilot-maturity | P2-P6 | first-L3 tool | SW-01/09 + SW-10 | honest "TerraPilot working" claim |
| work-order-engine | 011/012/014 | 013 UI | SW-09 (R2 code) | queue UI/report surface |
| brain-operator | — | BRAIN-001 | none (R0) | — |
| azure-county-runtime | — | AZURE-001 | SW-01 | county runtime |

**Cross-edges (the important couplings):**
- `MGMT-005 → property-workbench`: the workbench SPA is served by the same deploy; approving P8
  deploy also makes the workbench reachable.
- `terrapilot runtime → property-workbench pilot tab`: deploying the Node pilot runtime lights up
  both the standalone Pilot surface and the workbench Pilot tab.
- `backend-004 (health truth) → everything deployed`: honest health/readiness improves the runtime
  all other lanes deploy onto; sequence it early when SW-09 is authorized.
- `SW-10 (auth) → workbench + terrapilot + backend-006`: one auth decision unblocks three lanes.

---

## 5. Operator Reading (how to use this)

1. **To keep running with zero authorization:** WOE-014 → brain-operator (§2).
2. **To reopen the most lanes with one decision:** authorize **SW-01** (4 lanes) — but sequence
   **backend-004 (SW-09)** first so the deployed runtime is honest before more surfaces land on it.
3. **For a live demo:** the chain is backend-004 → MGMT-005 (SW-01+SW-10) → workbench-live →
   terrapilot-L3 (§3).
4. **Cheapest standalone wins:** DUPE-001B (SW-02, tiny) and a non-Muse terrapilot L3 candidate are
   low-blast-radius if you want a quick concrete step.

---

## 6. Change Log

| Date | Change | WO |
|------|--------|----|
| 2026-07-01 | Cross-program dependency graph; authorization→unblocks map; prerequisite chains | WO-WOE-014 |

---

**WO-WOE-014: COMPLETE.** With WOE-011 (within-program), WOE-012 (cross-program advance), and this
(dependency map), the operator doctrine layer is complete for planning. Remaining WOE-013 (Program
Queue UI) is frontend code (R2) — a soft wall requiring authorization.
