# Workbench Slice C — Source Pack Fit Panel

**Status**: ✅ BUILT 2026-06-08  
**URL**: `http://127.0.0.1:7700` (same server as Slices A + B)  
**Extends**: `SLICE_B_DOMAIN_COVERAGE.md`  
**Design spec**: `TERRAFUSION_SYNC_WORKBENCH_MVP.md` §9

---

## Purpose

The Source Pack Fit panel answers:

> **Does the Harris PACS landing layer conform to the source pack spec?**

It renders the per-check output of `harris-pacs-pack-validator.sql` (66 checks)
grouped into four categories, so the operator can see exactly which tables, columns,
dictionaries, or data checks have problems — not just a PASS/WARN/FAIL count.

Read-only. No drains. No schema mutation.

---

## How it works

After the doctor run completes, if step #0 (Harris PACS Pack Validator) is present in the
output, the panel fires `POST /api/pack-validator/run` automatically (non-blocking — the
doctor step cards and domain coverage panel render first, then pack fit appears ~5–10s later).

`/api/pack-validator/run` spawns `tools/sync/pack-validator-runner.mjs`, which runs
`harris-pacs-pack-validator.sql` via psql and returns the raw pipe-delimited output.
The client parses and groups by category.

---

## Four categories

| Category | Checks | Contents |
|----------|--------|----------|
| Source Tables | 15 | 11 CRITICAL + 4 WARN landing tables |
| Column Structure | 38 | Key fields across all lane domains |
| Canonical Dictionaries | 5 | canonical_tf dict tables seeded by hosted service |
| Data Content | 8 | Row-count and ratio-population checks |

---

## Verdict per category

| Verdict | Meaning | Action |
|---------|---------|--------|
| ✓ PASS | All checks in category pass | No action needed |
| ⚠ WARN | One or more non-blocking checks failed | Review + document county override |
| ✗ FAIL | One or more critical checks failed | **DO NOT DRAIN** — fix before proceeding |
| ℹ INFO | Optional/conversion indicator — shown separately | Awareness only |

---

## Benton steady-state

All 66 checks pass (65 PASS + 1 INFO):

```
Source Tables          15/15 pass
Column Structure       37/38 pass · 1 info
  ℹ property.PropInactiveDt  — optional; absent in Benton (expected)
Canonical Dictionaries  5/5 pass
Data Content            8/8 pass
```

The 1 INFO check (`PropInactiveDt` absent) is expected for Benton. The column is
optional — used for `CONVERSION_LEGACY` universe classification. Its absence is
documented in the SYNC-DOCTRINE-4 seal.

---

## Visibility rules

| Condition | Pack validator panel |
|-----------|---------------------|
| Page first load | Hidden |
| Doctor running | Hidden |
| Doctor completes, step #0 absent | Hidden (pack validator FAIL gate = pack validator itself didn't run) |
| Doctor completes, step #0 present | Fires `/api/pack-validator/run`; renders ~5–10s later |
| Pack validator endpoint 409 (already running) | Silently stays hidden |

---

## Files changed

```
tools/sync/
  pack-validator-runner.mjs       NEW: thin psql runner for pack validator SQL

tools/sync/workbench/
  server.mjs                      MODIFIED: PACK_VALIDATOR path, pvRunning flag,
                                  runPackValidator(), POST /api/pack-validator/run

tools/sync/workbench/panel/
  app.js                          MODIFIED: PV_CATEGORIES, PV_CAT_ORDER, parsePV(),
                                  humanizeCheck(), worstPVVerdict(), renderPackValidator(),
                                  fetchAndRenderPackValidator(); updated click handler
  index.html                      MODIFIED: added <section id="pack-validator">
  styles.css                      MODIFIED: pv-group, pv-check-list, pv-check-row styles

docs/sync/workbench/
  SLICE_C_PACK_FIT.md             This file
```

---

## Non-goals (this slice)

- No drain buttons
- No schema or data mutation
- No "fix" actions for FAIL checks
- No county override tooling
- No historical check comparison

---

## Acceptance criteria

- [ ] After doctor run, Source Pack Fit panel appears ~5–10s after step cards render
- [ ] Four categories shown: Source Tables / Column Structure / Canonical Dictionaries / Data Content
- [ ] Benton shows 15+38+5+8 = 66 checks with all PASS (1 INFO in Column Structure)
- [ ] PropInactiveDt shown in INFO list with explanation
- [ ] FAIL checks (any category) show check name + measured vs expected + notes
- [ ] WARN checks show check name + notes
- [ ] PASS-only categories show just "N pass" — no check list
- [ ] Panel hidden on page load, during run, and if step #0 absent

---

## Next slice

**Slice D — Seal-Check Detail Panel**: expand step #2 (Seal-Check Runner) into
per-gate rows showing lane/check name/measured/expected — same pattern as Slice C.

See `TERRAFUSION_SYNC_WORKBENCH_MVP.md` for the full slice roadmap.
