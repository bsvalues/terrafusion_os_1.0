# WO-DATA-004B-FIX1 — PACS Attach/Restore Safety Checklist

**Date**: 2026-06-16 · Companion to `PACS_CURRENT_SOURCE_ATTACH_PLAN.md`. This checklist governs FIX2 execution. Every box must be true; any "no" = STOP.

---

## Absolute prohibitions (never, in any FIX2 step)

- [ ] Do **not** attach the original `tf_mssql_data` / `pacs_oltp.mdf`. Only an isolated COPY.
- [ ] Do **not** write to the `tf_mssql_data` volume — mount it `:ro` only.
- [ ] Do **not** delete, truncate, or drop any source file, volume, or DB.
- [ ] Do **not** restore the Dec-2015 `pacs_benton_122915` (historical) as a current source.
- [ ] Do **not** run any drain / import / promote / project / writeback.
- [ ] Do **not** change pipeline filters (`owner_tax_yr >= 2018` stays).
- [ ] Do **not** mutate TerraFusion DB (`terrafusion_dev_clean` or any other).
- [ ] Do **not** touch native PG17, Docker PG16 data dirs, or the quarantined shared checkout.
- [ ] Do **not** use a non-2019 SQL Server engine for the attach (avoids irreversible compat upgrade).

---

## Pre-flight (before any byte is copied)

- [ ] **≥ 600 GB free** secured on the chosen target (external disk, or freed D:/E:). Verified with `df -h`. *(Currently NONE — C:28 / D:233 / E:163 GB free → this gate is OPEN and blocks everything.)*
- [ ] Target path confirmed **outside** `tf_mssql_data` and not overwriting the original.
- [ ] No port conflict for `21433` (wo004 used 11433; intended config uses 1433).
- [ ] Operator approval recorded for **Gate 1 (space)** and **Gate 2 (copy)**.

## Copy phase

- [ ] Source mounted `:ro`; copy is one-directional source→target.
- [ ] `sha256sum` of `pacs_oltp.mdf` and `pacs_oltp_log.ldf` match between source and copy.
- [ ] On any mismatch/abort: delete the partial copy, never the source; retry.

## Attach phase

- [ ] Operator approval recorded for **Gate 3 (container start)** and **Gate 4 (attach)**.
- [ ] `tf-pacs-current-verify` container created fresh; data mount points at the **COPY**.
- [ ] Attach via `FOR ATTACH` against the copied mdf+ldf only.
- [ ] Recovery completes against the copy; original volume confirmed untouched (`:ro`, mtimes unchanged).

## Vintage phase

- [ ] Only the read-only `SELECT`s from `PACS_CURRENT_SOURCE_VINTAGE_QUERY_PLAN.md` are run.
- [ ] Raw output captured verbatim.
- [ ] Decision A/B/C recorded.

## Post / teardown

- [ ] No TerraFusion drain triggered (Decision A still needs **Gate 5** approval in a later WO).
- [ ] Isolated container may be stopped; the COPY is retained as evidence (do not delete without approval).
- [ ] Original `tf_mssql_data`, `pacs_baks`, host backups: unchanged.

---

## Stop points requiring explicit operator approval

| Gate | Before | Why |
|------|--------|-----|
| 1 | securing ≥600 GB space | currently impossible on existing drives; needs operator decision (external disk vs free-up) |
| 2 | copying the 533 GB MDF | large time + space commitment |
| 3 | starting the SQL container | spinning a new MSSQL engine |
| 4 | attaching the copied DB | recovery writes (to the copy) |
| 5 | first drain after vintage proof | only if Decision A; separate WO |

---

## Next work order

**WO-DATA-004B-FIX2 — PACS Current Source Attach/Restore Execution.** Blocked until Gate 1 (space) is resolved and approved.
