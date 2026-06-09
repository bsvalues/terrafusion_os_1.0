# Workbench Slice B — Domain Coverage Panel

**Status**: ✅ BUILT 2026-06-08  
**URL**: `http://127.0.0.1:7700` (same server as Slice A)  
**Extends**: `SLICE_A_DOCTOR_PANEL.md`  
**Design spec**: `TERRAFUSION_SYNC_WORKBENCH_MVP.md` §9 (First Clickable MVP)

---

## Purpose

The Domain Coverage Panel answers one question:

> **What has been converted, what is deferred, and what can I safely claim?**

It renders the complete Benton County PACS domain inventory (19 domains) grouped by
conversion status, directly below the step cards after a doctor run.

Read-only. No backend calls beyond the existing doctor run. No new SQL.

---

## How it works

After the doctor run completes, the panel checks whether step #3 (Domain-Coverage Audit)
is present in the output. If yes, it renders the static Benton domain catalog grouped by
status. The catalog is baked into `panel/app.js` and mirrors `domain-coverage-audit.sql`.

No second database query is made. The static catalog is authoritative for Benton — it is
updated in code when a domain's status changes.

---

## Status groups

| Status | Symbol | Meaning | Operator action |
|--------|--------|---------|----------------|
| SEALED | ✓ | End-to-end converted; canonical lane proven and sealed | Safe to use as current-year substrate |
| LANDED_ONLY | ⚠ | Source data landed; full canonical lane not yet sealed | Do not overclaim. History lanes are future work |
| DISCOVERED_DEFERRED | ⚠ | Exists in PACS with real data; explicitly deferred | Not a gap — a documented decision. Seal holds its boundary |
| EMPTY_IN_SOURCE | — | Tabled in PACS schema; zero meaningful rows for Benton | No implementation required for Benton |

---

## Benton domain inventory (19 domains)

### SEALED — 12 domains

| # | Domain |
|---|--------|
| 1 | Parcel / Property Identity |
| 2 | Owner (current-year active-supplement) |
| 3 | Land (current-year segments) |
| 4 | Improvement / Structure (current-year) |
| 5 | Sales — DOR ratio-coded qualified |
| 6 | Geometry / GIS parcel boundary |
| 7 | Assessment Value (current-year 2025) |
| 8 | Owner-WSDOR (DOR audit roll) |
| 9 | Exemption |
| 10 | Jurisdiction / Tax Area–District Assignment |
| 11 | Revenue — Levy Tax Bills |
| 12 | Revenue — Special-Assessment Bills |

### LANDED_ONLY — 3 domains (future history mode)

| # | Domain |
|---|--------|
| 16 | Assessment-Value History (multi-year) |
| 17 | Land / Improvement History (multi-year) |
| 18 | Sales — Disqualified / Historical |

### DISCOVERED_DEFERRED — 3 domains (documented decisions)

| # | Domain |
|---|--------|
| 13 | Payment / Collection Ledger |
| 14 | Fund / Distribution Accounting |
| 15 | Delinquency |

### EMPTY_IN_SOURCE — 1 domain

| # | Domain |
|---|--------|
| 19 | Appeals / Corrections (ARB) |

---

## Visibility rules

| Condition | Domain Coverage panel |
|-----------|-----------------------|
| Page first load | Hidden |
| Doctor running | Hidden |
| Pack validator FAIL (step #3 absent) | Hidden — substrate not safe to evaluate |
| Doctor completed (step #3 present) | Shown — all groups rendered |

---

## Files changed

```
tools/sync/workbench/panel/
  app.js          Extended: DOMAIN_CATALOG + STATUS_META + renderDomainCoverage()
  index.html      Extended: added <section id="domain-coverage"> between steps and raw output
  styles.css      Extended: added domain coverage group styles

docs/sync/workbench/
  SLICE_B_DOMAIN_COVERAGE.md   This file
```

---

## Non-goals (this slice)

- No drain buttons
- No commit buttons
- No schema or data mutation
- No live database query for per-domain row counts
- No history lane UI
- No owner-link repair
- No F2 cleanup

---

## Acceptance criteria

- [ ] After a doctor run, domain coverage section appears below step cards
- [ ] Four groups rendered: SEALED / LANDED_ONLY / DISCOVERED_DEFERRED / EMPTY_IN_SOURCE
- [ ] SEALED group shows 12 domains
- [ ] LANDED_ONLY group shows 3 domains with "Do not overclaim" implication
- [ ] DISCOVERED_DEFERRED group shows 3 domains with "documented decision" implication
- [ ] EMPTY_IN_SOURCE group shows 1 domain (appeals/corrections ARB)
- [ ] Domain coverage section is hidden on page load and during a run
- [ ] If pack validator FAILs (step #3 absent), domain coverage remains hidden
- [ ] No write-capable actions on the page

---

## Updating the catalog

When a domain is promoted (e.g. `LANDED_ONLY` → `SEALED`), update two files:

1. `panel/app.js` — change `status` field in the relevant `DOMAIN_CATALOG` entry
2. `domain-coverage-audit.sql` — if the SQL status string also needs updating

---

## Next slice

**Slice C — Sync Session Opener**: a pre-drain checklist that gates write actions behind
the PASS/WARN/FAIL verdict. See `TERRAFUSION_SYNC_WORKBENCH_MVP.md` for the full slice roadmap.
