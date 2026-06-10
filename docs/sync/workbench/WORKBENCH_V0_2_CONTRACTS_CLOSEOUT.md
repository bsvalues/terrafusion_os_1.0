# TerraFusion Sync Workbench — v0.2 Contracts Closeout

**Sealed**: 2026-06-08  
**Commits**: `baabfb5be` (Slice H) · `c04205c9b` (Slice I)  
**Branch**: `fix/projector-delete-insert-atomicity`  
**Classification**: Planning checkpoint — contracts complete, implementation not started

---

> **v0.2 scope is contractually defined.**  
> Slice H and Slice I are write-adjacent, not write-capable.  
> No drain, commit, or release gate is wired.

---

## What v0.2 is

Two write-adjacent panels that let the operator understand what *would* happen and
what *has been refused* — without triggering any write to truth or canonical data.

| Slice | Surface | What it does | What it does NOT do |
|-------|---------|-------------|---------------------|
| H | Dry-run preview | Projects what a drain *would* produce — row counts, delta categories, quarantine rate, denominator verdict | Execute the drain. No truth writes. No canonical writes. |
| I | Quarantine review | Browse quarantined records by reason; save operator dispositions (ACCEPT / REJECT / NEEDS_RESEARCH) | Release records to canonical. No quarantine row is modified. |

Both slices are **read-only at the data layer**. Each has exactly one narrow permitted write:

| Slice | Permitted write | Purpose |
|-------|----------------|---------|
| H | One row in `sync_bridge.dry_run_log` (`is_preview=true`) | Audit trace that a preview ran |
| I | Rows in `sync_bridge.quarantine_review_decision` (append-only) | Operator annotation — advisory only |

Neither of those writes affects county data.

---

## The doctrine boundary

```
ACCEPT_AS_IS  ≠  promote to canonical
REJECT        ≠  delete from quarantine
Dry-run PASS  ≠  drain approved
```

The operator holds two things at the end of v0.2:

- A **projection** (Slice H): "If I drain lane X now, I expect N truth rows, M quarantine rows, verdict PASS/WARN/BLOCKED."
- A **disposition log** (Slice I): "I have reviewed the existing quarantine backlog. Here is what each record is."

Neither of those is the ignition key. The ignition key is the explicit approval gate — a
future slice, not planned in v0.2.

---

## What is explicitly NOT in v0.2

- Drain execution (parcel, owner, land, improvement, sales, geometry, revenue)
- Quarantine release / promotion to canonical
- Approve-for-drain button or interaction
- Mapping editor or override
- Dictionary update from review panel
- Evidence packet generation
- F2 repair (tf_parcel identity inflation)
- Multi-county selector
- Historical drain comparison
- Receipt-level or Treasurer accounting surfaces

---

## Schema changes required before v0.2 can go live

Two new tables need EF migrations:

| Table | Slice | Purpose |
|-------|-------|---------|
| `sync_bridge.dry_run_log` | H | One preview-run audit row per preview call |
| `sync_bridge.quarantine_review_decision` | I | Operator dispositions (append-only) |

Neither migration touches existing truth or canonical tables.

---

## v0.2 safe implementation sequence

```
1. EF migration — sync_bridge.dry_run_log
2. Backend: POST /api/sync/dry-run/preview endpoint (Slice H)
3. Verify: re-run doctor after preview → truth/canonical row counts unchanged
4. Workbench UI: dry-run preview panel (Slice H)
5. EF migration — sync_bridge.quarantine_review_decision
6. Backend: GET /api/sync/quarantine/review + POST disposition (Slice I)
7. Verify: dispose a record → quarantine table row count unchanged
8. Workbench UI: quarantine browse + annotation panel (Slice I)
```

Steps 1–4 (Slice H) and steps 5–8 (Slice I) are independent and can be sequenced in
either order. Migrations always precede their endpoint.

---

## State inventory

```
docs/sync/workbench/
  TERRAFUSION_SYNC_WORKBENCH_MVP.md           Original MVP spec
  SLICE_A_DOCTOR_PANEL.md                     ✅ built
  SLICE_B_DOMAIN_COVERAGE.md                  ✅ built
  SLICE_C_PACK_FIT.md                         ✅ built
  SLICE_D_LANE_SEAL.md                        ✅ built
  SLICE_E_IDENTITY_SPINE.md                   ✅ built
  SLICE_F_EVIDENCE_BROWSER.md                 ✅ built
  SLICE_G_READBACK_SET.md                     ✅ built
  TERRAFUSION_SYNC_WORKBENCH_PREVIEW_V0_1_CLOSEOUT.md  ✅ sealed
  SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md         ✅ contracted · ⏳ not built
  SLICE_I_QUARANTINE_REVIEW_CONTRACT.md       ✅ contracted · ⏳ not built
  WORKBENCH_V0_2_CONTRACTS_CLOSEOUT.md        ← this file
```

---

**Last Updated**: 2026-06-08  
**Next action**: Implement Slice H or Slice I — contract first, code second, evidence third.
