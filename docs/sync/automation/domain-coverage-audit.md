# Automation #3: Domain Coverage Audit Generator

**Status**: ✅ BUILT 2026-06-08  
**Tool**: `tools/sync/domain-coverage-audit.sql`  
**First Benton Run**: 2026-06-08  
**Evidence**: `evidence/2026-06-08-domain-coverage-audit-benton.md`

---

## Purpose

Automatically answer: *"Which PACS domains exist with real data but are not represented by a sealed canonical lane?"*

This is the question that prevented Benton County from overclaiming during the conversion. Previously, this required manual knowledge of what was and wasn't landed. Automation #3 makes it reproducible — run it at any time to get a complete domain × status picture across all three pipeline layers.

---

## How It Works

The SQL queries live row counts from all three pipeline layers simultaneously:

1. **`legacy_pacs_raw`** — landing layer (raw PACS data as-landed)
2. **`truth_pacs`** — promoted truth (active-supplement, current-year)
3. **`canonical_tf` / `gis_tf`** — canonical layer (the sealed operational substrate)

For each of 19 PACS domain families, it emits:

| Column | Description |
|--------|-------------|
| `domain` | Domain name |
| `pacs_source_family` | PACS source table(s) or "NOT landed" |
| `landing_rows` | Row count in `legacy_pacs_raw` (0 if not landed) |
| `truth_rows` | Row count in `truth_pacs` (0 if no truth layer) |
| `canonical_rows` | Row count in canonical (0 if not sealed) |
| `status` | Classification (see below) |
| `notes` | Key facts, known anomalies, deferral rationale |

The second SQL statement summarizes domain counts by status.

---

## Domain Status Classifications

| Status | Meaning |
|--------|---------|
| `SEALED` | End-to-end conversion complete; canonical lane sealed with runtime-proven gates and evidence packet |
| `LANDED_ONLY` | Source data landed in `legacy_pacs_raw`; truth/canonical coverage is partial (current-year only, qualified subset) or absent; more work needed to fully seal |
| `DISCOVERED_DEFERRED` | Domain known to exist in PACS with real data; never landed; explicitly deferred with rationale. This is NOT a gap in the sealed substrate — it records conscious boundary decisions so future counties don't repeat discovery work |
| `EMPTY_IN_SOURCE` | Domain exists in PACS schema but has 0 meaningful rows for this county; no implementation required |
| `OUT_OF_SCOPE` | Domain exists but is architecturally outside TerraFusion Sync mission (Treasurer systems, etc.) |

---

## Domain Inventory (19 Families)

### SEALED (12 domains)

| # | Domain | Key Numbers |
|---|--------|-------------|
| 1 | parcel | 83,326 live spine |
| 2 | owner | 816,849 truth; 312,532 canonical |
| 3 | land | 87,767 both truth and canonical |
| 4 | improvement | 100,391 truth imprv; 99,694+945,629 canonical imprv+features |
| 5 | sales-qualified | 29,914 DOR-qualified; 29,608 canonical |
| 6 | geometry | 80,075 canonical WKT centroids; direct ArcGIS REST |
| 7 | assessment-value | 95,455 truth; 83,326 canonical (current-year 2025) |
| 8 | owner-wsdor | 774,696 truth; 686,820 canonical |
| 9 | exemption | 6,487 truth; 5,643 canonical |
| 10 | jurisdiction | 95,455 landed; 83,326 canonical (direct landing→canonical) |
| 11 | revenue-l-levy-bills | 1,104,507 landing; 990,665 canonical; $308.9M due |
| 12 | revenue-a-assessment-bills | 313,139 both landing and canonical; $8.8M due |

### LANDED_ONLY (3 domains)

| # | Domain | Status Note |
|---|--------|-------------|
| 16 | assessment-value-history | 501,691 rows in `property_val` span 1968–2026; only 2025 sealed |
| 17 | land-improvement-history | 525,164 land + 678,476 imprv rows multi-year; only current-year sealed |
| 18 | sales-disqualified-historical | 75,678 total; 29,914 DOR-qualified sealed; 45,764 disqualified deferred |

### DISCOVERED_DEFERRED (3 domains)

| # | Domain | Rationale |
|---|--------|-----------|
| 13 | payment-collection-ledger | Stage 3B proved bill-grain net-paid model is sufficient; `coll_transaction` not needed for assessment substrate |
| 14 | fund-distribution-accounting | Treasurer-grade; out of scope for assessor workbench |
| 15 | delinquency | Prior-year penalty/interest tracking; Treasurer-grade |

### EMPTY_IN_SOURCE (1 domain)

| # | Domain | Note |
|---|--------|------|
| 19 | appeals-corrections-arb | Benton ARB volume = 0; resurface for counties with active ARB workloads |

---

## How to Run

```bash
psql "host=localhost dbname=terrafusion_dev" -f tools/sync/domain-coverage-audit.sql
```

Or in psql:

```sql
\i tools/sync/domain-coverage-audit.sql
```

Two result sets are returned:
1. **Per-domain detail** (19 rows) — ordered by domain sequence
2. **Summary by status** — count and domain list per classification

---

## Relationship to Automation Triad

This completes the first automation triad:

| # | Tool | Question answered |
|---|------|------------------|
| 1 | `identity-drift-detector.sql` | Is identity still sane? (xref drift, key uniqueness) |
| 2 | `seal-check-runner.sql` | Are seals still true? (counts vs benchmarks, invariants) |
| 3 | `domain-coverage-audit.sql` | What domains are still uncovered? (per-domain classification) |

Run all three at the start of any session involving new drain work or before a county onboarding milestone.

---

## Known Open Items (Not Domains)

These are not domain coverage gaps — they are cleanup/repair tasks with their own tracking:

- **`tf_parcel_owner_link`** — 1.4M identity-drift rows (separate triage; not F1-class)
- **`tf_parcel`** — 3.1M total rows (83,326 live; remainder = F2 debris, non-blocking)

---

## Multi-County Usage

For multi-county deployments, scope each count query:

```sql
-- Add to each subselect in landing/truth/canon CTEs:
WHERE "CountyId" = :'county_id'
```

Domains that use `sync_bridge.source_xref` for the live spine should similarly be filtered by county.

---

## Automation Backlog

See `docs/sync/TERRAFUSION_SYNC_AUTOMATION_BACKLOG.md` for items 4–8.
