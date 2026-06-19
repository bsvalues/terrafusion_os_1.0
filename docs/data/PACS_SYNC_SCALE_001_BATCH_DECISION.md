# WO-DATA-004B-SCALE-001 — Next PACS Controlled Batch Size Decision

**Work Order:** WO-DATA-004B-SCALE-001
**Date:** 2026-06-19
**Status:** PLANNING MEMO — No drain has run. No DB mutation. No PACS contact.
**Prerequisite:** PR #1047 (evidence) + PR #1048 (schema) merged to main. ✅

---

## 1. Current Controlled Slice State

All five non-geometry lanes proven at TopN=100 against `pacs_oltp_verify` (SA auth,
port 21433) writing to `terrafusion_dev_clean` (PG16, port 5432).

| Lane | Endpoint | TopN | Landed | Promoted | Canonicalized | Quarantine | Gates |
|---|---|---|---|---|---|---|---|
| parcel | `/drain/parcel` | 100 | 100 | 100 | 100 | 0 | 17 PASS / 0 FAIL |
| owner-wsdor | `/drain/owner-wsdor` | 100 | 199 | 199 | 283 | 0 | 49 PASS / 0 FAIL |
| improvement | `/drain/improvement` | 100 | 1,004 | 104 | 416 | 588 | 52 PASS / 1 FAIL |
| land | `/drain/land` | 100 | 137 | 137 | 137 | 0 | 34 PASS / 0 FAIL |
| sales | `/drain/sales` | 100 | 100 | 61 | 61 | 0 | 30 PASS / 1 WARN |
| geometry | `/drain/geometry` | N/A | 0 | 0 | 0 | — | BLOCKED (excluded) |

**Source vintage:** 774,728 qualifying rows, max owner_tax_yr = 2026.
**Pipeline version on main:** PR #1047 + PR #1048 merged — evidence canonical, schema repaired.

---

## 2. Known Carry-Forward Issues

All of the following must remain visible and explicitly acknowledged in every SCALE-001
run report. None are silently resolved between work orders.

### 2.1 Improvement — 588 Unresolved Attributes

- **Location:** `legacy_tf_unproven.unresolved_imprv_attr`
- **Root cause:** 588 PACS imprv_attr rows landed but their attribute codes were not
  recognized by the landing-layer dictionary at drain time.
- **Resolution path:** Future `attr-drain-1` release pass after dictionary seeding.
- **Scale impact:** The 250 improvement TopN is partly in response to this. A larger
  improvement batch will produce additional quarantine rows proportionally. This is
  expected and acceptable, not a stop condition — unless the quarantine rate increases
  significantly beyond the TopN=100 ratio (~5.65 attr rows quarantined per parcel).

### 2.2 Improvement — 3 Duplicate PACS 6-Key Tuples

- **Gate:** `imprv-attr-key-uniqueness` FAIL
- **Root cause:** 3 duplicate tuples in PACS source data (real PACS data quality issue,
  not a pipeline defect).
- **Acceptance threshold:** Count must stay at 3. If count changes at a higher TopN
  (more or fewer), investigate before accepting.
- **Scale impact:** Marginal. 3 duplicates in 100 imprv rows is a low rate. At 250
  the count may grow proportionally. Any increase beyond reasonable linear scaling
  is a stop condition.

### 2.3 Sales — WARN noSuppPointer=4

- **Gate:** `truth-pacs-supp-aware-join` WARN
- **Root cause:** 4 of 61 promoted sales have no supplement pointer in `prop_supp_assoc`.
  Data quality observation from real PACS data.
- **Scale impact:** Expected to appear at higher TopN. WARN is not a stop condition.
  Report the count in each run; investigate only if rate increases dramatically.

### 2.4 Sales — +60 Parcel Stubs

- **Location:** `canonical_tf.tf_parcel` grew from 100 → 160 after sales drain.
- **Root cause:** Sales drain created 61 canonical parcel stubs for sale-referenced
  properties not already in `tf_parcel` from the initial parcel slice.
- **Scale impact:** At higher TopN, the sales drain will continue to create parcel
  stubs for properties outside the parcel batch. This is by design — the sales drain
  uses source_xref to avoid duplicates. Count stub rows created per sales run and
  include in all reports.

### 2.5 Geometry — Excluded

Two hard blockers from WO-DATA-004B-FIX8 carry forward:

1. **No TopN support:** geometry lane unconditionally imports all 80,175 ArcGIS
   features — violates bounded slice contract.
2. **County ID mismatch:** Benton County DB Guid `4ec6e187-f053-4397-b87c-95d0ef9e99aa`
   does not match ArcGIS config key `19190019-1919-1919-1919-191919191919`.

**Geometry remains excluded from SCALE-001.** Requires `WO-DATA-004C-GEOM-001` (add
TopN support) and `WO-DATA-004C-GEOM-002` (fix county config) before any geometry drain.

---

## 3. Recommended Next Batch Size by Lane

Lane-by-lane scaling, not all-at-once. Each lane's recommended TopN reflects its
observed behavior at TopN=100 and known risk factors.

| Lane | Recommended TopN | Rationale |
|---|---|---|
| parcel | **500** | Clean at 100 (17/17 PASS, 0 quarantine). 5x scale is low risk. |
| owner-wsdor | **500** | Clean at 100 (49/49 PASS, 0 quarantine). 5x scale is low risk. |
| improvement | **250** | Had quarantine at 100. Scale conservatively first; observe quarantine rate. 2.5x before committing to 500. |
| land | **500** | Clean at 100 (34/34 PASS, 0 quarantine). 5x scale is low risk. |
| sales | **250** | Had WARN + parcel stubs at 100. WAC/ratio chain now canonical on main. 2.5x first; verify no new truncation or gate failures. |
| geometry | **Excluded** | See §2.5 — two independent blockers. |

**Operator recommendation (recorded):** Scale lane-by-lane. Start with parcel/owner at
500, then improvement at 250, then land/sales after reviewing counts. Do not scale all
lanes simultaneously.

---

## 4. Scale Strategy — Lane-by-Lane, Not All-at-Once

**Recommended approach:** Sequential lane runs, each at its recommended TopN, with a
full gate report before proceeding to the next lane.

Sequence:
1. parcel at 500 → review gates
2. owner-wsdor at 500 → review gates
3. improvement at 250 → review quarantine count + dup-key count
4. land at 500 → review gates
5. sales at 250 → review parcel stubs + WARN count

**Why not all-at-once:**
- Improvement quarantine behavior is not yet characterized at higher batch sizes.
- Sales stub count at higher TopN is unknown.
- Lane-by-lane makes it easier to isolate a failure or unexpected finding to a specific
  lane without having to untangle which lane caused it.

---

## 5. Stop Conditions for the Next Run

Stop immediately (do not proceed to next lane) if any of the following occur:

| Condition | Threshold | Action |
|---|---|---|
| Any FAIL gate that was PASS at TopN=100 | Any new FAIL | Stop, report, do not continue |
| Improvement dup-key count changes from 3 | Any delta | Stop, investigate PACS source |
| Improvement quarantine rate > 2× TopN=100 rate | > ~11.3 per parcel | Stop, review attr dictionary |
| Any 500-series API error | Any 500 | Stop, do not rerun |
| DB row counts in non-target tables change unexpectedly | Any unexpected mutation | Stop |
| Schema error (type mismatch, truncation, constraint violation) | Any | Stop |
| `TF_SKIP_DEV_SEEDERS=true` not confirmed before drain | If absent | Do not start drain |

**Not stop conditions (expected, document and continue):**
- WARN `truth-pacs-supp-aware-join` noSuppPointer (sales) — report count
- New parcel stubs from sales drain — report count
- Improvement quarantine growing proportionally (within 2× rate)

---

## 6. Required Preflight Checks

Before running any SCALE-001 drain:

```text
1. API source: fresh origin/main Release build in a dedicated worktree (NOT shared checkout)
2. TF_SKIP_DEV_SEEDERS=true confirmed in environment before drain call
3. pacs_oltp_verify reachable: SQL Server port 21433, SA auth TfVerify2026!Secure
4. terrafusion_dev_clean reachable: PG16 port 5432
5. No geometry endpoint called under any circumstance
6. No drain with TopN > lane recommendation without new operator approval
7. No full-corpus flag or missing TopN — confirm endpoint accepts and honors TopN param
8. Confirm pre-drain row counts on canonical tables before each lane
9. Document post-drain row counts and gate summary immediately after each lane
10. Stop on first unexpected 500 — do not retry automatically
```

---

## 7. Geometry Status

**Geometry remains excluded.** Decision is not re-evaluated in SCALE-001.

The next geometry-related work orders are:
- `WO-DATA-004C-GEOM-001` — add TopN/pagination support to geometry lane
- `WO-DATA-004C-GEOM-002` — fix Benton County Guid in ArcGIS config

Neither of these is part of SCALE-001. Geometry requires separate operator approval
after both blockers are resolved.

---

## 8. Known Issues vs. Scale Approval

| Issue | Blocks SCALE-001? | Decision |
|---|---|---|
| 588 imprv_attr quarantine | No — quarantine is working as designed | Carry forward; monitor rate |
| 3 PACS dup-key tuples | No — known PACS source issue, count monitored | Carry forward; stop if count changes |
| sales noSuppPointer=4 WARN | No | Carry forward; report count |
| sales +60 parcel stubs | No | Carry forward; report count per run |
| geometry excluded | No — geometry is separate work order | Excluded from SCALE-001 |

**No known issue blocks SCALE-001.** All four carry-forward issues are documented,
understood, and have defined monitoring criteria.

---

## 9. SCALE-001 Is a Decision Memo, Not a Drain Authorization

This document records the batch size decisions for the next controlled PACS drain.

**A separate operator approval is required before each drain run.** This memo defines:
- What TopN to use per lane when approval is given
- What the stop conditions are
- What preflight checks are required

It does not authorize the drain to start. The operator approves each lane explicitly.

---

## Final Report

| Field | Value |
|---|---|
| RESULT | COMPLETE — decision memo written |
| FILES_CHANGED | 1 new file: `docs/data/PACS_SYNC_SCALE_001_BATCH_DECISION.md` |
| RECOMMENDED_BATCH_PLAN | parcel=500, owner-wsdor=500, improvement=250, land=500, sales=250, geometry=excluded |
| GEOMETRY_STATUS | EXCLUDED — requires WO-DATA-004C-GEOM-001 + WO-DATA-004C-GEOM-002 |
| KNOWN_ISSUES | 588 imprv_attr quarantine; 3 PACS dup-key tuples; sales WARN noSuppPointer=4; sales +60 parcel stubs |
| SCALE_APPROVAL_STATUS | NOT APPROVED — this memo defines the plan; operator approves each drain separately |
| PR_OR_LOCAL_ARTIFACT | Branch `docs/wo-data-004b-scale-001-decision`, this file |
| NEXT_WORK_ORDER | Operator approves parcel lane at TopN=500 to begin actual SCALE-001 drain |
