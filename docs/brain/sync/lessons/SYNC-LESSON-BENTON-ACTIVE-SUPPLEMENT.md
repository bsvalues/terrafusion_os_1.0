---
type: sync_lesson
county: Benton WA
domain: multi-lane
lane: parcel / land / improvement / assessment-value / sales / owner / revenue
status: proven
symptom: >
  Drain returns wrong row counts or joins to prior-year data because sup_num is assumed to be 0
  when the active supplement is higher (typically 1 or 2 in Benton's current year).
root_cause: >
  Harris PACS uses a supplement-number system per tax year. The "current" supplement is MAX(sup_num)
  WHERE year=@yr AND status='A' (or similar active flag per table). Assuming sup_num=0 picks the
  original assessment, not the current corrected one. Benton active supplement for 2025 is non-zero
  across multiple lanes.
proof: >
  Observed during improvement drain reconciliation: the drain was pulling 89,247 rows at sup_num=0
  but the active supplement was sup_num=1 for many parcels, yielding different improvement counts.
  Land and improvement sealed with active-supplement aware queries.
fix: >
  Always join with MAX(sup_num) or use the active-supplement selection logic per PACS doctrine:
    SELECT prop_id, MAX(sup_num) AS active_sup
    FROM dbo.prop_supp_assoc
    WHERE prop_val_yr = @yr AND sup_status_cd = 'A'
    GROUP BY prop_id
  Never hard-code sup_num=0 in Sync landing queries.
commit: "seal commits on fix/projector-delete-insert-atomicity (various)"
prevention_rule: >
  Any Sync landing query on a PACS table that has a sup_num column MUST join through active
  supplement selection. Add a check to the pack validator: if a PACS source query has
  WHERE sup_num=0 without a commented exemption, flag WARN.
automation_target: >
  harris-pacs-pack-validator.sql: add check that active-supplement tables do not use hard-coded
  sup_num=0. Also: tf-sync-doctor awareness of active supplement version per lane.
related_files:
  - docs/sync/workbench/SYNC_RUNTIME_PRODUCTION_PROOF.md
  - tools/sync/harris-pacs-pack-validator.sql
---

## Active Supplement Doctrine

Harris PACS has a supplement-per-year structure. Each tax year can have multiple supplements (0, 1, 2, ...). The active supplement is the one with the highest number and an active status code.

**Never assume sup_num = 0.** Supplement 0 is the original bill; corrections produce sup_num = 1, 2, etc.

### Benton 2025 Pattern

| lane | active sup_num | notes |
|---|---|---|
| improvement | varies by parcel | Max sup_num per prop_id for 2025 |
| land | varies by parcel | Same pattern |
| assessment-value | varies by parcel | property_val uses sup_num |
| owner | varies by parcel | account via prop_supp_assoc |

### Query Pattern

```sql
-- Always join through active supplement
WITH active_sup AS (
    SELECT prop_id, MAX(sup_num) AS sup_num
    FROM dbo.prop_supp_assoc
    WHERE prop_val_yr = 2025 AND sup_status_cd = 'A'
    GROUP BY prop_id
)
SELECT t.*
FROM dbo.imprv t
JOIN active_sup s ON s.prop_id = t.prop_id AND s.sup_num = t.sup_num
WHERE t.prop_val_yr = 2025
```
