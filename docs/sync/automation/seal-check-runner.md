# TerraFusion Sync Automation #2 — Seal-Check Runner

_Built 2026-06-08. Implements Automation Backlog #2. Read-only. Encodes the
manual lane gates run by hand during the Benton County seal sessions as an
automated, repeatable check._

## What it is

A read-only SQL runner (`tools/sync/seal-check-runner.sql`) that checks the
canonical substrate against the **sealed benchmarks** established during Benton's
drain sessions. It answers: "are the canonical lanes still consistent with what was
proven at seal time?"

It encodes the gates that were run by hand for weeks — row counts, rollup
integrity, balance arithmetic, and parity invariants — as 22 automated checks
across 9 lane families.

## Prerequisite

Run **`identity-drift-detector.sql`** (Automation #1) first. That tool checks
canonical FK → live parcel spine resolution (the F1 class of failure). This
runner checks lane counts, rollup integrity, and amount totals — it deliberately
does **not** re-run the FK drift scan. The two tools are complementary, not
overlapping.

## How to run

```bash
docker exec -i terrafusion-postgres-dev psql -U postgres -d terrafusion -P pager=off \
  < tools/sync/seal-check-runner.sql
```

Or paste into any SQL client. The script produces two result sets:
1. **Per-check detail** — 24 rows, FAIL/WARN rows sorted first
2. **Overall verdict** — single row: `OVERALL: PASS` or `FAIL — N gate(s) failed`

## What it checks (24 gates)

### Parcel spine (1 check)
- Live parcel count — expected 83,326 for Benton (WARN-CHANGED if drifted)

### Assessment lane (2 checks)
- Canonical row count = live parcel count (1:1 invariant — FAIL if broken)
- No duplicate `(TfParcelId, AssessmentYear)` pairs (active-supplement dedup gate)

### Jurisdiction lane (1 check)
- `tf_parcel_tax_area` count = live parcel count (1:1 invariant)

### Exemption lane (1 check)
- Canonical row count ≥ sealed benchmark (5,643; not all parcels have exemptions)

### Land lane (1 check)
- Canonical row count ≥ sealed benchmark (87,767; multi-segment per parcel)

### Improvement lane (1 check)
- Canonical row count ≥ sealed benchmark (99,694; multi-improvement per parcel)

### Geometry lane (1 check)
- Canonical row count ≥ sealed benchmark (80,075)

### Revenue-L (levy bills) — 7 checks
- Bill-line count ≥ 990,665
- Rollup count ≥ 79,767
- `SUM(BillCount)` in rollup = bill-line count (rollup integrity)
- No duplicate `TfParcelId` in rollup table
- Amount due ≈ sealed $308,949,578.44 (WARN-CHANGED if drifted; new year drain expected)
- Amount paid ≈ sealed $3,602.19 (WARN-CHANGED; small — current year largely uncollected)
- Balance arithmetic identity: `due − paid = balance` (FAIL if broken)

### Revenue-A (special-assessment bills) — 7 checks
- Bill-line count ≥ 313,139
- Rollup count ≥ 79,078
- `SUM(BillCount)` in rollup = bill-line count (rollup integrity)
- No duplicate `TfParcelId` in rollup table
- Amount due ≈ sealed $8,841,075.97 (WARN-CHANGED if drifted)
- Amount paid ≈ sealed $429.35 (WARN-CHANGED)
- Balance arithmetic identity (FAIL if broken)

## Verdict taxonomy

| Verdict | Meaning | Action |
|---|---|---|
| `PASS` | Matches sealed benchmark or structural invariant holds | None |
| `WARN-CHANGED` | Amount or count deviated from sealed benchmark (non-zero) | Confirm expected (new drain / new year) |
| `WARN-REGRESSED` | Count dropped below sealed benchmark | Investigate — possible truncation or partial re-drain |
| `FAIL` | Structural invariant broken: parity mismatch, rollup gap, balance arithmetic error, or empty table | Stop — investigate before using the substrate |

**WARN does not block.** Only FAIL should halt downstream work.

## OVERALL VERDICT (statement 2)

The second statement is a tight set of **hard-fail-only** conditions. It fires FAIL
only for broken structural invariants: parity mismatches, rollup sum gaps, empty
lanes, balance arithmetic errors. WARN conditions (amount drift, count drift) are
surfaced in the per-check output but do not contribute to the overall FAIL count.

## Updating benchmarks

After a deliberate re-drain or new operational year, update the hardcoded benchmark
constants in the SQL header comments and the CASE expressions. The benchmarks are
intentionally visible in the file so the change is explicit and reviewable — not
hidden in a config.

## First run (Benton, 2026-06-08)

See `evidence/2026-06-08-seal-check-runner-benton-pass.md`.

## Relationship to other automations

| Tool | Checks |
|---|---|
| `identity-drift-detector.sql` (Automation #1) | FK → live parcel spine (all 11 tables) |
| `seal-check-runner.sql` (Automation #2) | Lane counts, rollup integrity, amount totals (9 lane families) |
| domain-coverage-audit (Automation #3, not yet built) | Which PACS domains are NOT in the seal registry? |

Together #1 and #2 replace the most expensive part of the manual seal process:
the hour spent re-running count queries, cross-checking totals, and verifying
rollup arithmetic after each drain.
