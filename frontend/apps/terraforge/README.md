# TerraForge — Suite-Forge (County-Wide Valuation Suite)

**Layer tag:** Suite-Forge
**Port:** served via Vite dev proxy → TerraFusion.API port 5000
**Status:** Current shell is a placeholder — see ARCHITECTURE CORRECTION below

---

## What TerraForge Is

TerraForge is the **county-wide valuation suite** for Benton County WA. It is a first-class suite workspace for appraisers working across all parcels — ratio studies, comps pools, sale qualification, OLS regression, cost schedules, and levy lookup.

It is **not** a parcel-scoped surface. It is **not** a tabbed detail view. It operates on the full county dataset.

---

## What TerraForge Is Not

| This is NOT TerraForge | This IS the correct owner |
|---|---|
| A tabbed parcel detail view | Property Workbench (Phase 3, locked) |
| A single-property cost card | Workbench Cost tab (Phase 3, locked) |
| A per-parcel reconciliation surface | Workbench Reconciliation tab (Phase 3, locked) |

**The Workbench is a consumer** of TerraForge endpoints. It calls suite APIs for one parcel and displays the result. TerraForge itself operates county-wide.

---

## ARCHITECTURE CORRECTION — 2026-04-05

The current `src/App.tsx` and page structure is a **tabbed-page placeholder skeleton**. It was built as a scaffold but it misrepresents the intended suite architecture. It looks like a Workbench surface, not a suite workspace.

**This skeleton must be replaced — not polished, not extended, replaced.**

The TerraForge Assembly review will define the correct suite shell structure before further suite expansion continues.

---

## Sealed slices (do not reopen)

| Slice | What it does | Status |
|---|---|---|
| Phase 2.1 TerraLevy | Levy rate lookup + bill calculator | ✅ Sealed `3f8536895` |

---

## Frozen (do not open without owner approval)

Phase 2.2, 2.3, 2.4 are frozen pending TerraForge Assembly review and owner task card approval.

---

## Backend endpoints

All TerraForge endpoints live in `TerraFusion.API`:
- `GET /api/levy/rates` — levy rates by year
- `GET /api/levy/tax-areas` — tax area lookup
- `GET /api/levy/calculate` — itemized levy bill (WA decimal arithmetic)
- `GET /api/terraforge/ratio-study` — IAAO ratio study (county-wide)
- `GET /api/terraforge/comps` — comps pool browser (county-wide)
- `POST /api/terraforge/regression/run` — OLS regression (county-wide)
- `GET /api/forge/{parcelId}/...` — parcel-scoped (consumed by Workbench, Phase 3)
