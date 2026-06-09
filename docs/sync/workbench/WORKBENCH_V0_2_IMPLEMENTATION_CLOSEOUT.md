# Workbench v0.2 Implementation Closeout

**Branch**: fix/projector-delete-insert-atomicity  
**Sealed**: 2026-06-09

---

## What v0.2 implemented

### Slice H — Dry-Run Preview

- EF migration: `sync_bridge.dry_run_log`
- Backend endpoint: `POST /api/sync/workbench/dry-run/preview`  
  Runs a bounded PACS read (TopN rows) and returns a preview diff without
  writing to any canonical or truth table.
- Workbench panel: dry-run launcher + result display in the local Sync
  Workbench cockpit (`tools/sync/workbench/server.mjs`).

Commit: `baabfb5be` (backend) · panel in cockpit series

### Slice I — Quarantine Review

- EF migration: `QuarantineRowRef varchar(256)` + index on
  `sync_bridge.quarantine_review_decision` (`20260609060000`).
- Backend endpoints (`WorkbenchQuarantineReviewController`):
  - `GET  /api/sync/workbench/quarantine/review` — browse quarantine rows
    joined with current (latest) operator disposition; lane=imprv_attr,
    limit default 50.
  - `POST /api/sync/workbench/quarantine/review/{ref}/decision` — append
    an operator disposition row. Closed vocabulary:
    `ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH`.
- Workbench panel: `SyncQuarantineReviewPage` in the OS shell at route
  `workbench/sync/quarantine/review`.
- 15 backend service tests green (`TerraFusion.API.Tests`).
- 10 frontend panel tests green.

Commits: `e7d95febf` (backend) · `a80de31b9` (frontend)

---

## Doctrine invariants — held throughout v0.2

```
No drain execution
No canonical mutation
No quarantine release
No approval flow
No bulk disposition
No F2 cleanup
No history lanes
```

Key UI doctrine present and tested:

```
ACCEPT_AS_IS = reviewed + acknowledged only. NOT promoted.
Review decisions are append-only and do not release quarantine records.
Source quarantine rows are never mutated.
```

---

## Surface note — two workbench surfaces exist

v0.2 has two distinct operator surfaces. This split is intentional for
this release. v0.3 should decide whether to consolidate or keep them
separate.

### Local Sync Workbench cockpit

```
Entry point : tools/sync/workbench/server.mjs
URL         : http://127.0.0.1:7700
Surfaces    : doctor / evidence / readback / dry-run preview (Slice H)
Audience    : development + local operator sessions
```

### OS Shell route

```
Route       : workbench/sync/quarantine/review
Component   : SyncQuarantineReviewPage
Surfaces    : quarantine review panel (Slice I)
Audience    : OS shell operator (same machine, authenticated shell context)
```

---

## What v0.2 did NOT implement

The following remain explicitly out of scope. None were started.

| Feature | Status |
|---|---|
| Drain execution from UI | Not implemented |
| Commit approval gate | Not implemented |
| Quarantine release | Not implemented |
| Mapping override UI | Not implemented |
| Bulk disposition | Not implemented |
| F2 cleanup (tf_parcel identity inflation) | Not implemented |
| History lanes | Not implemented |

---

## v0.3 decision point

Before starting v0.3, decide:

1. **Surface consolidation** — fold the quarantine review panel into the
   local cockpit, or bring the cockpit surfaces into the OS shell, or
   keep both.

2. **Approval gate** — if v0.3 targets commit approval, the gate belongs
   adjacent to the dry-run preview (Slice H cockpit surface), not the
   quarantine review panel.

3. **F2 scope** — `tf_parcel` identity inflation (3.2M distinct
   ParcelNumbers) is the only open readback defect. Assess whether it
   blocks any v0.3 surface before planning slices.
