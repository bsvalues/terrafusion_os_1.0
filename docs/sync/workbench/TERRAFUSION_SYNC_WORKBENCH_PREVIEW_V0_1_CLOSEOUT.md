# TerraFusion Sync Workbench — Preview v0.1 Closeout

**Sealed**: 2026-06-08  
**Final commit**: `dd831221e` (Slice G — Readback Set Panel)  
**Branch**: `fix/projector-delete-insert-atomicity`  
**Classification**: Read-only preflight, proof, evidence, and readback cockpit

---

> **Workbench Preview v0.1 is complete** as a read-only preflight, proof,
> evidence, and readback cockpit. All seven slices (A–G) are sealed.
> Write-capable workflow is future work — see §v0.2 scope below.

---

## What v0.1 includes

Seven read-only panels. All non-mutating. Doctor-triggered panels are
non-blocking. Evidence Browser and Readback Set render on page load.

| Slice | Panel | Trigger | Purpose |
|-------|-------|---------|---------|
| A | Doctor Panel | Run button | 4 step cards + overall verdict banner |
| B | Domain Coverage | After doctor | Grouped SEALED / LANDED_ONLY / DEFERRED / EMPTY |
| C | Source Pack Fit | After step #0 | 66 checks across 4 categories (Harris PACS pack) |
| D | Lane Seal | After step #2 | 22 gates across 9 lanes — PASS / WARN / FAIL per gate |
| E | Identity Spine | After step #1 | 11 tables, dangling count alarm, F1-family clean check |
| F | Evidence Browser | Page load | 25 proof artifacts, 7 groups, open in new tab |
| G | Readback Set | Page load | 6 acceptance parcels, surface counts, financials, forbidden claims |

### What the cockpit answers

| Question | Panel |
|----------|-------|
| Can I start? (substrate healthy?) | A — Doctor |
| Does the source shape fit? | C — Source Pack Fit |
| Is identity safe? (no dangling rows?) | E — Identity Spine |
| Are the seals true? | D — Lane Seal |
| What domains are covered / deferred? | B — Domain Coverage |
| Where is the evidence? | F — Evidence Browser |
| Which parcels prove readback? | G — Readback Set |

### How to run

```bash
node tools/sync/workbench/server.mjs
```

Open: `http://127.0.0.1:7700`

No npm install. No build step. Built-in Node modules only (`node:http`,
`node:fs/promises`, `node:child_process`, `node:url`, `node:path`).

Use `127.0.0.1`, not `localhost` — Windows PostgreSQL has intermittent IPv6
address resolution issues on some configurations.

### Expected Benton steady-state

```
Overall verdict:   ⚠ WARN  (substrate clean, safe to work)

Source Pack Fit:   PASS — Harris PACS shape confirmed
Identity Spine:    PASS on 10 sealed tables
                   WARN on tf_parcel_owner_link (known deferred — not a sealed lane)
Lane Seal:         PASS on all 9 lanes (or WARN-CHANGED after a drain)
Domain Coverage:   SEALED lanes green; known deferrals expected (F2, history, revenue accounting)
Evidence Browser:  25 documents always visible
Readback Set:      6 parcels always visible; all PASS at data-seal + cross-lane join layer (post-F1)
                   County Studio UI pixel layer NOT exercised — remains a human step
```

---

## What v0.1 does not include

These are explicitly out of scope. Do not add them until the operator requests.

**Write / mutation actions**
- Drain buttons (parcel, improvement, land, sales, geometry, revenue)
- Commit approved changes
- Quarantine review / release
- Backfill triggers

**Mapping and configuration**
- Mapping editor
- Source pack editor
- Doctrine rule editor
- Dictionary loader controls

**Workflow surfaces**
- Packet generation workflow
- Evidence packet builder
- Release sign-off workflow

**Multi-county and history**
- Multi-county selector
- Historical drain comparison
- Readback defect F2 (tf_parcel identity inflation — 3.2M distinct ParcelNumbers)
- Revenue accounting reconciliation

---

## Architectural constraints (remain in force)

These apply to all future slices:

- No `innerHTML` — all DOM mutations use `createElement` / `textContent`
- Assets live in `panel/`, not `public/`
- Use `127.0.0.1`, not `localhost`
- Commit with explicit-path staging only — never `git add .` or `git add -A`
- DB: `host=127.0.0.1 port=5432 dbname=terrafusion user=postgres`
- `/api/doc` restricted to `docs/sync/` — path traversal double-guarded
- 409 guard on all runner endpoints — prevents concurrent runs

---

## Workbench v0.2 scope (future — not yet started)

v0.2 is the first write-adjacent milestone. It adds workflow surfaces that let
the operator preview and approve actions — but no drain is fired without an
explicit two-step confirmation.

**Target slices for v0.2:**

| Slice | Surface | What it does |
|-------|---------|-------------|
| H | Dry-run preview | Show what a drain *would* do — row counts, expected deltas — without touching the DB |
| I | Quarantine review | Browse quarantined rows by reason; operator marks accept / reject; no auto-release |

**Still excluded from v0.2:**

- Commit approved (no drain trigger without separate explicit gate)
- Mapping editor
- Packet export / generation workflow
- Multi-county selector
- F2 repair
- Receipt-level or Treasurer-grade accounting surfaces

**Before starting v0.2:** plan the dry-run preview API contract and the
quarantine review data model. Both require read access to the quarantine tables
that Slice I will expose — read-only first, then a separate sign-off to
release.

---

## File inventory (v0.1)

```
tools/sync/workbench/
  server.mjs                          HTTP server — 4 API endpoints + static file serve
  panel/
    index.html                        Shell — 8 sections (A–G + raw output)
    app.js                            Client — parse, render, catalog
    styles.css                        Dark-theme styles (pv-*, dc-*, sc-*, is-*, rb-*, ep-*)

tools/sync/
  tf-sync-doctor.mjs                  Doctor runner (pre-existing)
  pack-validator-runner.mjs           Pack validator runner (Slice C)
  seal-runner.mjs                     Seal check runner (Slice D)
  identity-runner.mjs                 Identity drift runner (Slice E)

docs/sync/workbench/
  TERRAFUSION_SYNC_WORKBENCH_MVP.md   Original MVP spec
  SLICE_A_DOCTOR_PANEL.md
  SLICE_B_DOMAIN_COVERAGE.md
  SLICE_C_PACK_FIT.md
  SLICE_D_LANE_SEAL.md
  SLICE_E_IDENTITY_SPINE.md
  SLICE_F_EVIDENCE_BROWSER.md
  SLICE_G_READBACK_SET.md
  TERRAFUSION_SYNC_WORKBENCH_PREVIEW_V0_1_CLOSEOUT.md   ← this file
```
