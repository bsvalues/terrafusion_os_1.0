# Workbench v0.3 — OS Shell Runtime Proof
<!-- Workbench v0.3 backend endpoint verification. Canonical record. Do NOT modify post-seal. -->

**Date**: 2026-06-09  
**Branch**: `fix/projector-delete-insert-atomicity`  
**API**: `http://localhost:5000`  
**Operator**: TerraFusion Copilot  

---

## Bug Found and Fixed

**Slice L identity-spine/run**: `identity-runner.mjs` had `timeout: 90_000` (90 seconds). After populating `tf_assessment_bill_line` (313,139 rows), the second SQL statement (11 NOT IN subqueries in a CASE WHEN) required >90s cold, causing the endpoint to return `exitCode: 2` with `"Fatal: Command failed"`.

Fix: bumped timeout to `300_000` in `tools/sync/identity-runner.mjs:71` to match the doctor's proven timeout.

---

## Endpoint Verification Results

### GET Status Endpoints — all idle and responding

| endpoint | HTTP | response |
|---|---|---|
| GET /api/sync/workbench/doctor/status | 200 | `{"running":false}` |
| GET /api/sync/workbench/identity-spine/status | 200 | `{"running":false}` |
| GET /api/sync/workbench/source-pack/status | 200 | `{"running":false}` |

### GET /api/sync/workbench/quarantine/review — Slice I

Parameters: `?lane=imprv_attr&limit=5`

```json
{
  "lane": "imprv_attr",
  "totalSourceCount": 27684,
  "returnedCount": 5,
  "notice": "SOURCE ROWS ARE IMMUTABLE — READ-ONLY PROJECTION"
}
```

✓ Returns quarantine rows from `legacy_pacs_raw` landing layer.  
✓ Immutability notice present on every response.  
✓ Empty quarantine state handled: if 0 rows, returns `totalSourceCount: 0, returnedCount: 0`.  
✓ No ACCEPT_AS_IS or bulk release buttons (read endpoint only; decision endpoint requires explicit POST per row).  

Quarantine note: 27,684 `UNREVIEWED` rows present from `UNKNOWN_I_ATTR_VAL_CD` reason (historical batch). These are landing-layer only; canonical is not affected. Disposition is an operator decision, not auto-released.

### POST /api/sync/workbench/doctor/run — Slice J

```json
{
  "exitCode": 0,
  "durationMs": ~30000,
  "stdout": "... tf-sync doctor ... OVERALL: WARN ..."
}
```

✓ Returns raw doctor stdout.  
✓ OVERALL: WARN is surfaced as exitCode 0 (WARN is not an error).  
✓ FAIL would surface as exitCode 1 — the frontend contract gates on this.  
✓ 409 if a run is already in progress — no concurrent execution.  

### POST /api/sync/workbench/source-pack/run — Slice K

```json
{
  "exitCode": 0,
  "stdout": "column_structure|col_assessment_bill_line__AmountPaid|present|present|PASS|CRITICAL|..."
}
```

✓ Returns pack validator output (65 checks, 1 info, PASS).  
✓ CRITICAL/WARN/INFO severity tiers rendered in stdout.  

### POST /api/sync/workbench/identity-spine/run — Slice L (after fix)

```json
{
  "exitCode": 0,
  "durationMs": 4413,
  "stdout": "... canonical_tf.tf_parcel_owner_link|714553|714553|0|0|PASS\n... OVERALL: PASS — no identity drift\n"
}
```

✓ exitCode 0.  
✓ All 11 tables PASS.  
✓ `tf_parcel_owner_link` shows 0 dangling (F2 cleared).  
✓ `gis_tf.tf_parcel_geom` 970 null_ref — PASS (documented residual).  
✓ `OVERALL: PASS — no identity drift`.  

---

## Semantic Checks

### No FAIL gate has proceed-anyway

The backend contract returns `exitCode` on every run response. The frontend parser checks this — `exitCode !== 0` is a hard gate. No bypass or dismiss was observed in the controller code.

### Source rows are immutable

Quarantine review GET returns `"notice": "SOURCE ROWS ARE IMMUTABLE — READ-ONLY PROJECTION"` on every response. The decision POST endpoint writes append-only `QuarantineReviewDecision` records — it does NOT mutate source rows or canonical data.

### No unexpected data mutation

All POST endpoints are read-compute-return only (doctor, identity, source-pack). They do not write to any DB tables. Quarantine decision POST is the only write endpoint and creates append-only decision records per the reviewed quarantine source row.

---

## UI/Browser Pixel Verification

**NOT exercised.** No live browser session was available during this proof run. Backend endpoint correctness, response shapes, and semantic guards are proven. Frontend component rendering and UI pixel acceptance are not claimed.

Frontend workbench routes that should map to these endpoints:
- `workbench/sync/doctor` → Slice J (doctor panel)
- `workbench/sync/source-pack` → Slice K (source pack fit)
- `workbench/sync/identity-spine` → Slice L (identity spine)
- `workbench/sync/quarantine/review` → Slice I (quarantine review)

---

## Fix Record

| file | change | reason |
|---|---|---|
| `tools/sync/identity-runner.mjs:71` | `timeout: 90_000` → `timeout: 300_000` | 90s insufficient after Revenue-A populated 313K bill rows; second SQL statement requires >90s cold; doctor uses 300s and passes |
