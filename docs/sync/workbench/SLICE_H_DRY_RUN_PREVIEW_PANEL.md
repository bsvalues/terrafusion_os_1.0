# Workbench Slice H Step 3 — Dry-Run Preview Panel

**Status**: SEALED  
**Sealed at**: Slice H Step 3 commit  
**Depends on**: Slice H Step 1 (sync_bridge.dry_run_log), Slice H Step 2 (backend endpoint)  
**Contract reference**: SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md  

---

## What this panel does

Adds a **Dry-Run Preview** section to the TerraFusion Sync Workbench (port 7700). The operator fills in an assessment year, optionally a TopN sample limit, and clicks **Preview Improvement Lane**. The workbench proxies the request to the .NET API at port 5000 and renders the projection result.

**Lane**: improvement (fixed in Step 3 — single-lane scope per v0.2 contract)  
**Mode**: read-only projection. No truth rows are inserted, updated, or deleted.  
**Permitted write**: exactly one `sync_bridge.dry_run_log` row with `IsPreview=true` per click.

---

## Hard boundaries

Per `SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md §8`:

| Boundary | Enforcement |
|----------|-------------|
| "DRY-RUN PREVIEW — NO DATA HAS MOVED" amber notice | First item rendered in result area |
| Button label | Fixed: "Preview Improvement Lane" — not "Run Drain" |
| No approve / commit / execute controls | No such button exists in this panel |
| No drain endpoint call | Calls `/api/dry-run-preview/run` proxy only |
| No quarantine release | Quarantine candidate count is read-only display |
| One audit row per click | Exactly one `sync_bridge.dry_run_log` row written |

---

## Files changed

| File | Change |
|------|--------|
| `tools/sync/workbench/server.mjs` | Added `POST /api/dry-run-preview/run` proxy endpoint (forwards to port 5000) |
| `tools/sync/workbench/panel/index.html` | Added `<section id="dry-run-preview">` between identity-spine and seal-check |
| `tools/sync/workbench/panel/app.js` | Added `renderDryRunPreviewPanel()`, `handleDryRunPreview()`, `renderDrpResult()`, `renderDrpError()` |
| `tools/sync/workbench/panel/styles.css` | Added `drp-*` CSS classes |
| `tools/sync/workbench/tests/panel-slice-h.test.mjs` | 16 static structural tests |

---

## Panel structure

```
Dry-Run Preview
  Preview · improvement — read-only projection. No data moves...

  ┌─────────────────────────────────────────────────────────┐
  │ Lane            improvement                             │
  │ Assessment Year [  2026  ]                              │
  │ TopN (optional) [        ]  (full corpus if blank)      │
  │                                                         │
  │ [ Preview Improvement Lane ]                            │
  └─────────────────────────────────────────────────────────┘

  ─── after click ───────────────────────────────────────────

  [ ⚠  DRY-RUN PREVIEW — NO DATA HAS MOVED ]

  ┌─────────────────────────────────────────────────────────┐
  │ previewRunId  xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     │
  │ duration      1234 ms                                   │
  │─────────────────────────────────────────────────────────│
  │ lane               improvement                          │
  │ operationalYear    2026                                 │
  │ topN               — (full corpus)                      │
  │ status             PREVIEW                              │
  │                                                         │
  │ ── Projected counts ──────────────────────────────────  │
  │ sourceCount             100,000  rows in landing table  │
  │ canonicalCount           99,694  rows in tf_improvement │
  │ estimatedInserts            697  source not yet in truth│
  │ estimatedUpdates         99,303  source already in truth│
  │ estimatedDeletes              0  truth not in source    │
  │ quarantineCandidateCount 27,684  in quarantine tables   │
  └─────────────────────────────────────────────────────────┘
```

---

## Request flow

```
Browser (port 7700)
  → POST /api/dry-run-preview/run
  → server.mjs proxy handler
  → POST http://127.0.0.1:5000/api/sync/workbench/dry-run-preview
     { lane: "improvement", dryRun: true, operationalYear, topN, requestedBy: "operator" }
  ← JSON result with all count fields + notice: "DRY-RUN PREVIEW — NO DATA HAS MOVED"
  → renderDrpResult() in app.js
```

---

## Tests

Run without API or workbench server running:

```bash
node tools/sync/workbench/tests/panel-slice-h.test.mjs
```

16 static structural tests:
- T1–T2: HTML structure
- T3–T6: server.mjs proxy correctness
- T7–T8: amber notice
- T9: button label contract
- T10–T11: no write-capable controls
- T12: endpoint call correctness
- T13: all required count fields present
- T14–T16: CSS classes

### Integration test checklist (requires API + workbench server running)

These require `node tools/sync/workbench/server.mjs` + API on port 5000:

- [ ] `GET http://127.0.0.1:7700/` returns 200 and HTML includes `id="dry-run-preview"`
- [ ] Clicking "Preview Improvement Lane" produces a 200 response with `previewRunId` UUID
- [ ] After clicking, `SELECT COUNT(*) FROM sync_bridge.dry_run_log WHERE "IsPreview"=true` increments by exactly 1
- [ ] Running the doctor check after a preview shows no change in truth/canonical row counts
- [ ] A 409 response is returned if two preview requests are sent concurrently

---

## Out-of-scope (deferred per v0.2 contract)

- Approve-for-drain button — future slice (Slice I or later)
- Multi-lane support — future slice
- Drain execution — future slice
- Quarantine review — Slice I
- History / diff with prior preview runs — future slice
- F2 parcel inflation diagnosis — separate workstream

---

_Sealed 2026-06-08 · Workbench v0.2 Slice H Step 3_
