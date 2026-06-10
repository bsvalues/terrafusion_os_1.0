# Automation #4: tf-sync doctor

**Status**: ✅ BUILT 2026-06-08  
**Tool**: `tools/sync/tf-sync-doctor.mjs`  
**First Benton Run**: 2026-06-08  
**Evidence**: `evidence/2026-06-08-tf-sync-doctor-benton.md`

---

## Purpose

One command that runs the full automation triad and emits a single operator verdict before any Sync session:

```
PASS   — substrate clean, all seals hold
WARN   — substrate clean, known deferred items present (safe to work)
FAIL   — identity break or seal failure (do NOT drain)
```

This is the Sync control panel answer to "is it safe to open this session?"

---

## Usage

```bash
node tools/sync/tf-sync-doctor.mjs
```

Or with env overrides (defaults match `appsettings.Development.local.json`):

```bash
PG_DB=mydb PG_HOST=prod-server node tools/sync/tf-sync-doctor.mjs
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PG_HOST` | `127.0.0.1` | PostgreSQL host (IPv4; avoids intermittent IPv6 drops after heavy queries) |
| `PG_PORT` | `5432` | PostgreSQL port |
| `PG_DB` | `terrafusion` | Database name |
| `PG_USER` | `postgres` | Database user |
| `PGPASSWORD` | `devpassword123` | Password |

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | PASS or WARN — safe to work |
| `1` | FAIL — do not drain until resolved |
| `2` | Error — psql not found or connection failed |

---

## What It Runs

| Step | Tool | Question |
|------|------|----------|
| #0 | `harris-pacs-pack-validator.sql` | Does the landing layer conform to the Harris PACS pack? |
| #1 | `identity-drift-detector.sql` | Is identity still sane? |
| #2 | `seal-check-runner.sql` | Are the seals still true? |
| #3 | `domain-coverage-audit.sql` | What domains are still uncovered? |

Step #0 is a gate: if the pack validator FAILs, the doctor stops immediately. Steps #1–#3 are meaningless if the landing layer is missing required tables or columns.

---

## Verdict Logic

### Tool #0 — Harris PACS Pack Validator

| Condition | Doctor verdict |
|-----------|----------------|
| All required tables and columns present | PASS |
| Optional fields missing (INFO) | PASS (info noted) |
| WARN-severity checks unsatisfied | WARN (county override needed) |
| Any FAIL check | **FAIL — stops doctor immediately** |

FAIL on Step #0 causes `process.exit(1)` before running #1–#3. Resolve missing tables/columns first.

### Tool #1 — Identity-Drift Detector

| Condition | Doctor verdict |
|-----------|----------------|
| No FAIL rows in any table | PASS |
| FAIL only in `tf_parcel_owner_link` (known deferred) | WARN |
| FAIL in any other table | **FAIL** |

Known-deferred table: `canonical_tf.tf_parcel_owner_link` — 1.4M identity-drift rows, separate triage, not F1-class.

### Tool #2 — Seal-Check Runner

| Condition | Doctor verdict |
|-----------|----------------|
| Overall `PASS`, no WARN rows | PASS |
| Overall `PASS`, some WARN-CHANGED rows | WARN (expected after re-drain or new year) |
| Any FAIL gate | **FAIL** |

### Tool #3 — Domain-Coverage Audit

| Condition | Doctor verdict |
|-----------|----------------|
| SEALED = 12, no unexpected downgrades | PASS + WARN (for LANDED_ONLY etc.) |
| SEALED < 12 | **FAIL** |

LANDED_ONLY (3), DISCOVERED_DEFERRED (3), EMPTY_IN_SOURCE (1) are all expected and always produce WARN — not FAIL.

---

## Expected Benton Output

```
══════════════════════════════════════════════════════════
  tf-sync doctor — TerraFusion Sync Health Check
══════════════════════════════════════════════════════════

  DB: terrafusion @ 127.0.0.1:5432

  #0  Harris PACS Pack Validator ...
      ✓  PASS — 65 checks pass  (1 info)

  #1  Identity-Drift Detector ...
      ⚠  WARN — known deferred drift present
          ⚠  canonical_tf.tf_parcel_owner_link: 1,397,252 dangling rows (deferred)

  #2  Seal-Check Runner ...
      ✓  PASS — 22/22 gates hold

  #3  Domain-Coverage Audit ...
      ✓  12 SEALED
      ⚠  3 LANDED_ONLY · 3 DISCOVERED_DEFERRED · 1 EMPTY_IN_SOURCE (all expected)

══════════════════════════════════════════════════════════
  ⚠  OVERALL: WARN — substrate clean, known deferred items present
     Safe to start a Sync session or run drains.
     Review WARN lines before opening owner-link or F2 work.
══════════════════════════════════════════════════════════
```

WARN is the correct steady-state for Benton. The deferred items (owner-link drift, history lanes, Treasurer domains) are not substrate failures — they are explicit boundary decisions.

---

## When to Run

- **At the start of every Sync session** — confirms the substrate is where you left it
- **After any drain** — confirms the drain didn't regress the seal
- **Before onboarding a new county** — confirms the Benton substrate is clean before copying the pattern

---

## How FAIL Looks

### Pack validator FAIL (Step #0 — new county, missing tables)

```
  #0  Harris PACS Pack Validator ...
      ✗  FAIL — 3 check(s) failed
              ✗  tbl_property_exemption
              ✗  tbl_tax_bill_line
              ✗  tbl_assessment_bill_line

══════════════════════════════════════════════════════════
  ✗  OVERALL: FAIL — landing layer does not conform to Harris PACS pack
     Resolve #0 failures before running identity/seal/coverage checks.
     Run: psql ... -f tools/sync/harris-pacs-pack-validator.sql -t -A
══════════════════════════════════════════════════════════
```

Doctor stops after Step #0. Steps #1–#3 are skipped. Exit code `1`.

### Identity drift FAIL (Step #1 — F1-class drift returned)

```
  #1  Identity-Drift Detector ...
      ✗  FAIL — unexpected identity drift
          ✗  canonical_tf.tf_land: 83,326 dangling rows
          ✗  canonical_tf.tf_improvement: 99,694 dangling rows

══════════════════════════════════════════════════════════
  ✗  OVERALL: FAIL — identity break or seal failure detected
     Do NOT drain until FAIL items are resolved.
     Run individual automation tools for detail.
══════════════════════════════════════════════════════════
```

Exit code `1`. Do not drain.

---

## Adding a Known-Deferred Table

Edit `KNOWN_DRIFT_DEFERRED` in `tf-sync-doctor.mjs`:

```javascript
const KNOWN_DRIFT_DEFERRED = new Set([
  'canonical_tf.tf_parcel_owner_link',  // existing
  'canonical_tf.my_new_table',          // add here with rationale
]);
```

This prevents a known deferred issue from blocking the doctor with a FAIL.

---

## Relation to Automation Backlog

See `docs/sync/TERRAFUSION_SYNC_AUTOMATION_BACKLOG.md` for items #5–#8.
