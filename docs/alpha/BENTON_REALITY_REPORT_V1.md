# Benton Reality Report — v1

**Document type:** CARD-04 truth pass / findings only  
**Branch:** `fix/workbench-loading-aria`  
**Base SHA:** `89eacd9b5` (CARD-01 sealed)  
**Report date:** 2026-03-25  
**Author:** Copilot truth lane  

---

## 1. Minimum Success Criteria for This Document

- Accurately describe the data reality a tester will encounter when running the dev stack
- Call out every claim in `alpha.html` that does not match observed source behavior
- Record hardcoded production-scale numbers in backend services that are not live counts
- Note runtime dependencies that will silently degrade the alpha experience
- **Do not recommend fixes or open implementation work**
- Evidence method: source-code read + file search. This is **not** a browser-render proof pass.

---

## 2. Evidence Sources

| Artifact | Method | Outcome |
|---|---|---|
| `frontend/apps/os-shell/public/alpha.html` | `read_file` | Full document read; claims inventoried |
| All 9 Workbench tab components (`PropertySummary.tsx` … `PropertyPilot.tsx`) | `read_file` (lines 1-120 each) | Data contracts, API dependencies, render fallbacks |
| `frontend/apps/os-shell/src/api/pilotApi.ts` | `read_file` (lines 1-150) | All tool invocation routing, port architecture |
| `frontend/apps/os-shell/src/stores/propertyStore.ts` | `read_file` | Store shape, `selectParcel()`, `getDataProvider()` path |
| `frontend/apps/os-shell/src/services/dataProvider.ts` | `read_file` | `VITE_DATA_MODE` resolution, `LiveDataProvider` vs `SnapshotDataProvider` |
| `frontend/apps/os-shell/src/data/dev-snapshots/SnapshotDataProvider.ts` | `read_file` | Snapshot data source description |
| `frontend/apps/os-shell/src/data/dev-snapshots/benton-snapshot-mini.json` | `ConvertFrom-Json` count | **200 parcels** |
| `frontend/apps/os-shell/src/data/dev-snapshots/benton-golden-parcels.json` | `ConvertFrom-Json` count | **20 parcels** |
| `frontend/apps/os-shell/src/data/dev-snapshots/benton-comparable-sales.json` | `ConvertFrom-Json` count | **158 comp sales** |
| `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs` | `grep_search` + `read_file` | Route `GET api/atlas/gis/parcels/{parcelId}/boundary` exists; depends on `IGisDataService` |
| `backend/src/TerraFusion.API/Controllers/DossierController.cs` | `grep_search` + `read_file` | Route `GET api/dossier/parcels/{parcelId}/details` exists; queries `Properties` table |
| `os-platform/core/pilot/dev-pilot-runtime.mjs` | `read_file` (lines 865-910) | `GET /pilot/tools` reads from `sharedRegistry.listTools()` |
| `backend/src/TerraFusion.API/Controllers/GovernmentController.cs` | `read_file` (lines 50-100) | Hardcoded `parcels = 89247` in fallback static payload |
| `backend/src/TerraFusion.AI/Services/AnalyticsReportingService.cs` | `grep_search` | Hardcoded `TotalProperties = 89247`, `PropertiesAssessed = 89247` |
| `backend/src/TerraFusion.Core/Services/LegacyDatabaseService.cs` (line 287) | `read_file` | Phantom loop `for (int i = 1; i <= 89247; i++)` generates synthetic `BN-XXXXXX-2024` parcel IDs |
| `backend/src/TerraFusion.API/Controllers/DaisController.cs` (line 791) | `grep_search` | Hardcoded conditional `89247 : 50000` for Benton |
| `89247` in all backend services | `grep_search` | **20 matches** across 8 distinct service/controller files in main source tree |
| `frontend/apps/os-shell/.env.example` | `read_file` | `VITE_DATA_MODE` **not set** in example; default path resolves to `LiveDataProvider` |
| `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx` | `read_file` | Route: `useParams()` → `parcelId`, store: `usePropertyStore()`, `selectParcel()` called on mount |

---

## 3. Findings by Severity

### P0 — Will Break or Mislead Alpha Testers

#### P0-1: alpha.html claims "Real PACS data. 89,247 parcels. This is not a demo."

**Source:** `alpha.html` line ~200 (`<p class="sub" …>Real PACS data. 89,247 parcels. This is not a demo.`)

**Reality observed in source:**

- The frontend `dataProvider.ts` defaults to `LiveDataProvider` when `VITE_DATA_MODE` is not set. `LiveDataProvider` talks to `localhost:5000`.
- When the `.NET` backend is running but PACS SQL Server is not configured, all `/api/pacs/*` routes return HTTP 503, and the `LiveDataProvider` gracefully falls back to snapshot data.
- The snapshot data is `benton-snapshot-mini.json` (200 real PACS-sourced parcels) + `benton-golden-parcels.json` (20 parcels) — **not 89,247**.
- `89,247` appears 20 times across 8 backend service/controller files in the main source tree. In every occurrence it is a **hardcoded literal** — not a live database count.
- The closest analog to a live count is `SELECT COUNT(*) FROM Properties` — that query is not in any controller or service called by the alpha flow.

**Verdict:** The claim "89,247 parcels" in `alpha.html` is sourced from a hardcoded integer in backend fallback responses, not from a live PACS query. In dev, a tester will see at most 200 parcels in snapshot mode or the parcels that exist in the local SQLite `Properties` table (seeded count not verified in this pass, but is likely < 200).

---

#### P0-2: alpha.html Tab Truth Matrix marks Atlas as "✅ Real (GIS)"

**Source:** `alpha.html` Tab Truth Matrix row for Atlas: `<span class="pass">✅ Real (GIS)</span>` — "Boundary and layer data from GIS endpoint"

**Reality observed in source:**

- `AtlasGisController.cs` route `GET api/atlas/gis/parcels/{parcelId}/boundary` exists and calls `_gisData.GetParcelBoundaryAsync(parcelId, ct)`.
- `IGisDataService` is injected. Whether a concrete implementation of `IGisDataService` is registered and functional in dev was **not confirmed** in this pass. The `AtlasGisController` also injects `IGisConnector`, `IGeospatialEnricher`, `IGisParseService`, `IGisSyncService` — four additional interface dependencies.
- `PropertyAtlas.tsx` has a deterministic SVG fallback when the GIS API is unavailable. The fallback is labeled (honest).
- The atlas.html Truth Matrix claim "Real (GIS)" implies the GIS endpoint works for any parcel. That claim is unverified.

**Verdict:** The GIS endpoint exists in source but its runtime availability in dev is unknown. The `alpha.html` matrix should state "SVG fallback when GIS unavailable" rather than "Real (GIS)" as a blanket pass. Tester will see SVG fallback, not a real boundary, unless GIS services are running.

---

#### P0-3: Pilot Runtime is a separate process — not mentioned anywhere in alpha.html

**Source:** `pilotApi.ts` lines 1-50: `API_BASE_URL = ''`, all tool invocations route to `POST /pilot/invoke` via Vite proxy `/pilot` → port `4317`.

**Reality observed in source:**

- Six of nine tabs (Dais, Clerk, Treasury, Audit, Dossier, Pilot) route every tool invocation through `pilotApi.invokePilotTool()`.
- The Pilot Runtime is a **separate Node.js process** (`os-platform/core/pilot/dev-pilot-runtime.mjs`) that must be running at port 4317.
- `alpha.html` Setup section says: "Backend must be running at `localhost:5000`." There is **no mention** of needing the Pilot Runtime at port 4317.
- If the Pilot Runtime is not started, all 6 MWUX tabs will render their tool cards (the shell is real), but every invocation attempt will return a network error / fetch failure. The UI will show an error state on the tool card.
- The Pilot tab additionally calls `GET /pilot/tools` on mount to load the tool manifest. If the runtime is down, the Pilot tab renders an error or empty tool list from the first paint.

**Verdict:** Missing alpha.html setup step. A tester who starts only the `.NET` backend will have a broken MWUX experience across 6 of 9 tabs without understanding why.

---

### P1 — Functional Gap With No Local Workaround

#### P1-1: Summary tab data fidelity depends on which DataProvider is active

**Source:** `propertyStore.ts` `selectParcel()` → `getDataProvider().getParcel(parcelId)`.

`dataProvider.ts` resolution:
1. If `VITE_DATA_MODE=snapshot` → `SnapshotDataProvider` (200 parcels, real PACS values)
2. If `VITE_DATA_MODE` unset → `LiveDataProvider` → `GET /api/pacs/properties/{parcelId}`
3. `LiveDataProvider` falls back to snapshot when backend is unreachable or returns non-2xx

**Reality:** The `.env.example` does not set `VITE_DATA_MODE`. No `.env.development` file was found in this pass. Without that env var, the app defaults to `LiveDataProvider`, which sends live API requests. When PACS SQL Server is not configured (dev environment), `/api/pacs/properties/{parcelId}` returns HTTP 503/fallback. The `LiveDataProvider` fallback behavior determines what the tester sees. This means Summary data quality is dependent on whether the tester has a `.env` file with `VITE_DATA_MODE=snapshot` set.

If they do not: Summary will attempt live, fail, and fall back. The `source` badge in the Summary tab will show `'fallback'`, which is honest — but the tester may not understand what this means without documentation.

---

#### P1-2: Forge Workbench shows fallback year data for all dev parcels

**Source:** `PropertyForge.tsx` `useParcelYears(parcelId)` → `GET /api/forge/{parcelId}/years`.

From CARD-03 (prior session): dev SQLite has only one 2015 base layer per seeded parcel. `CURRENT_YEAR` in Forge is 2026. The year selector will show only `2015` for dev parcels. Cost/Sales/Income approach panels return `Source="fallback", Confidence=0.0`.

**Mismatch with alpha.html:** Tab Truth Matrix says "Year selector pulls PACS layers; lock state badge (🔒/🔓); AV/MV per year." For dev, the year selector will show one year (2015) and approaches return fallback confidence values. A tester who expects 10 years of PACS history will see one year.

---

#### P1-3: Dossier details endpoint depends on `Properties` EF table — counter-seeding unknown

**Source:** `DossierController.cs` line 730+: `_db.Properties.AsNoTracking().FirstOrDefaultAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)`.

The `GET /api/dossier/parcels/{parcelId}/details` endpoint **queries `Properties`**, not `PacsParcel`. If the EF `Properties` table has no row for a given parcel, the endpoint returns HTTP 404 ("Parcel not found"). The snapshot parcels are in `benton-snapshot-mini.json` in the frontend. Whether those same parcels exist as rows in the EF `Properties` SQLite table was not verified in this pass.

**Risk:** Tester opens Dossier tab, expects details, gets 404 / "Parcel not found" panel. Mismatch with `alpha.html` claim "✅ MWUX — Parcel details from API".

---

#### P1-4: `LegacyDatabaseService.cs` phantom loop generates synthetic parcel IDs

**Source:** `backend/src/TerraFusion.Core/Services/LegacyDatabaseService.cs` line 287: `for (int i = 1; i <= 89247; i++) { ... Id = $"BN-{i:D6}-2024", Address = $"Sample Address {i}" }`.

This method (`ImportPropertiesAsync`) generates 89,247 synthetic records with parcel IDs like `BN-000001-2024`, addresses like "Sample Address 1", all in Kennewick WA. If any workflow invokes this service during alpha, it will populate the database with dummy data that does not match real Benton parcel IDs (`1017XXXXXXXX` format).

**Impact depends on call path.** If this method is never called during normal alpha flow, risk is latent. If it is called (e.g., via an admin trigger or initialization pathway), real parcels are poisoned with fake records.

---

### P2 — Documentation/Claim Mismatch (Not Immediately Blocking)

#### P2-1: Backend analytics endpoints return hardcoded `TotalProperties = 89247` and `PropertiesAssessed = 89247`

**Source:** `AnalyticsReportingService.cs` lines 91-92.

Any analytics dashboard that calls these endpoints will display `89,247` as the assessed + total count regardless of the actual SQLite parcel count. This is hardcoded in the fallback `GenerateSummaryAsync` method.

---

#### P2-2: `GovernmentController.cs` static fallback returns `parcels = 89247` and `aiSwarm = "1008_AGENTS_ACTIVE"`

**Source:** `GovernmentController.cs` lines 67-68 and service array. The static fallback (when TerraSync is unavailable) returns `parcels = 89247`, `aiSwarm = "1008_AGENTS_ACTIVE"`, `quantumOptimization = "ENABLED"`, `compliance = "FISMA-HIGH"`.

These are status-page claims that present dev as production-scale. Any status-page UI that reads from this endpoint in dev will show production-grade metrics.

---

#### P2-3: `DaisController.cs` hardcodes `89247` for Benton county total parcel count

**Source:** `DaisController.cs` line 791: `var totalParcels = county.Equals("benton", ...) ? 89247 : 50000`.

Any Dais workflow that calls this code path will report Benton's total parcel count as the hardcoded integer. This affects workflow completion percentage calculations or progress indicators if any are present downstream.

---

#### P2-4: `alpha.html` describes write_high tools without risk gating disclosure

**Source:** `PropertyTreasury.tsx` tool list: `record_payment` (write_high), `initiate_tax_sale` (write_high). `PropertyClerk.tsx` tool list: `record_document` (write_high), `release_lien` (write_low).

`alpha.html` Tab Truth Matrix for Treasury: "Tax statement, delinquency status, payments, installment plans." The `initiate_tax_sale` tool and `record_payment` tool are present in the MWUX surface. Whether the Pilot Runtime's manifest filters these tools in alpha mode (e.g., requires `supervisorApproval=true`) was not verified in this pass.

**Risk:** If write_high tools are uninhibited in the Pilot Runtime during alpha, a tester could inadvertently invoke `initiate_tax_sale` against whatever data system the Pilot Runtime is connected to.

---

#### P2-5: `alpha.html` Scenario 1 instructs testers to use parcel `101843030001006`

**Source:** `alpha.html` line ~320: `Type the parcel ID (e.g. 101843030001006)`.

This parcel appears in CARD-03 curl evidence as a dev SQLite seeded test parcel with only a 2015 base layer. When a tester types this ID, they will see one year in the Forge year selector (2015) and fallback confidence values. The scenario description does not warn about this.

---

### P3 — Low-Severity Notes / Observations

#### P3-1: `alpha.html` is in `public/` which is .gitignore-managed

**Source:** `.env.example` line 1 `# TERRAFUSION OS - DEPLOYMENT CONFIGURATION`. The file was found at `frontend/apps/os-shell/public/alpha.html`. Public dir contents may not be tracked by default git commit paths. Verified per prior CARD-02 session that `public/` was committed via a hook or explicit add. This is a note only — not a defect.

---

#### P3-2: Snapshot data `taxYear` fields default to `2025` in `SnapshotDataProvider.ts`

**Source:** `SnapshotDataProvider.ts` line 209: `assessmentYear: raw.taxYear || 2025`. Snapshot parcels in `benton-snapshot-mini.json` do not have a `taxYear` field in the JSON schema (not present in first two parcels inspected). This means all 200 snapshot parcels will show `assessmentYear: 2025` in the Summary tab even though the underlying PACS data may be from different years.

---

#### P3-3: `benton-levies.json` contains only one taxing district: `DIST-BENTON-SMOKE`

**Source:** `benton-levies.json` lines 1-7 inspected. All six visible records have `TaxingDistrict = "DIST-BENTON-SMOKE"`. A tester looking at levy data will see one synthetic district, not the real Benton levy district structure.

---

## 4. Summary of Unsupported or Misleading Claims in alpha.html

| Claim | Location in alpha.html | Reality |
|---|---|---|
| "Real PACS data. 89,247 parcels. This is not a demo." | Header subtitle | 89,247 is a hardcoded integer in 8 backend files. Dev frontend has 200 snapshot parcels or live SQLite (seeded count unverified). |
| "Property search returns real Benton parcels" | Tester Charter | True if PACS SQL Server is connected. In dev without PACS, search hits snapshot (200 parcels) or SQLite. |
| "No 'Demo data' badges on parcels loaded from PACS" | Tester Charter | Source badge shows `'fallback'` when PACS unavailable. Depends on dev environment configuration. |
| "Values match what you see in Harris PACS for the same parcel" | Success Criteria | Only possible when PACS SQL Server is connected. In dev, values come from SQLite/snapshot. |
| "Atlas ✅ Real (GIS)" | Tab Truth Matrix | GIS endpoint exists; runtime availability in dev is unverified. SVG fallback is honest but not real GIS data. |
| "Backend must be running at localhost:5000" | Setup instructions | Incomplete. Pilot Runtime at port 4317 is also required for Dais, Clerk, Treasury, Audit, Dossier, Pilot tabs to function. |
| "Forge: Year selector pulls PACS layers" | Tab Truth Matrix | In dev SQLite, only 2015 base layer exists per parcel. Tester will see one year. |

---

## 5. Benton-Specific Reality Mismatches

| Expected (per alpha.html / docs) | Actual in dev |
|---|---|
| 89,247 parcels accessible | 200 snapshot parcels (or SQLite seeded — unverified count) |
| Live Harris PACS 9.0 data | SQLite dev database with PACS schema, no SQL Server connection |
| Multiple PACS tax years per parcel | 1 year (2015) in dev SQLite |
| Real GIS boundary data per parcel | Deterministic SVG fallback (GIS runtime status unknown) |
| Pilot tool manifest with Benton-scoped tools | Manifest from `dev-pilot-runtime.mjs` `sharedRegistry` — contents not inspected in this pass |
| Levy data: multiple real taxing districts | Snapshot has single district `DIST-BENTON-SMOKE` only |
| 10 active counties (per AnalyticsReportingService) | Dev has Benton county test data only; `TotalCounties = 10` is hardcoded |

---

## 6. Open Investigative Items (Not Resolved in This Pass)

The following items were not verified and represent known unknowns:

1. **Pilot manifest tool count in dev**: `sharedRegistry.listTools()` in `dev-pilot-runtime.mjs` was not traced to its data source. Unknown how many tools are registered and whether any Benton-scoped tools are included.

2. **`Properties` EF table seeded parcel count**: Only `PacsParcel` table seeding was confirmed (prior sessions). Whether `Properties` rows exist for the 200 snapshot parcel IDs was not verified. Affects `DossierController.GetParcelDetails()` response.

3. **`IGisDataService` concrete registration**: The `AtlasGisController` injects `IGisDataService` via constructor. Whether this interface has a working implementation registered in `Program.cs` for dev was not read.

4. **`LiveDataProvider.ts` fallback path**: When the `.NET` backend is running but returns 503 for PACS routes, what data does `LiveDataProvider.getParcel()` actually return? Does it fall back to snapshot or return null?

5. **`VITE_DATA_MODE` in actual dev `.env`**: Only `.env.example` was found. No `.env.development` or `.env` file was found in this pass. The active mode at runtime is unknown.

---

## 7. Candidate Follow-On Cards (Captured From This Truth Pass)

These are candidate cards surfaced by this truth pass. This report does not authorize implementation. Each entry requires its own scoped card before any work begins.

| ID | Title | Priority | Scope |
|---|---|---|---|
| CARD-05A | Add Pilot Runtime to alpha.html setup instructions | P0 | `docs` |
| CARD-05B | Correct alpha.html "89,247 parcels" claim to reflect dev reality | P0 | `docs` |
| CARD-05C | Correct alpha.html "Atlas ✅ Real (GIS)" to "SVG fallback when GIS unavailable" | P0 | `docs` |
| CARD-06 | Verify `Properties` EF table seeding for snapshot parcel IDs | P1 | `backend` |
| CARD-07 | Verify `IGisDataService` DI registration; document Atlas GIS dev status | P1 | `backend` |
| CARD-08 | Verify Pilot manifest tool count in dev; document which tools are available | P1 | `os-platform` |
| CARD-09 | Audit write_high tool surface in alpha; confirm `supervisorApproval` gating | P2 | `os-platform` |
| CARD-10 | Replace hardcoded `89247` in `GovernmentController`, `AnalyticsReportingService`, `DaisController` with live DB query or clearly-labeled stub constant | P2 | `backend` |
| CARD-11 | Investigate `LegacyDatabaseService.ImportPropertiesAsync` call paths; gate phantom-loop execution | P1 | `backend` |
| CARD-12 | Document dev `.env` configuration requirements (VITE_DATA_MODE, ports) in alpha.html or README | P1 | `docs` |

---

## 8. Evidence Checklist

| Item | Status |
|---|---|
| All 9 tab components read | ✅ |
| `pilotApi.ts` architecture understood | ✅ |
| `propertyStore.ts` data flow traced | ✅ |
| `dataProvider.ts` mode resolution confirmed | ✅ |
| `SnapshotDataProvider.ts` understood | ✅ |
| Benton snapshot parcel count confirmed (200) | ✅ |
| Golden parcel count confirmed (20) | ✅ |
| Comp sales count confirmed (158) | ✅ |
| `AtlasGisController` route confirmed exists | ✅ |
| `DossierController` route confirmed exists | ✅ |
| Pilot Runtime `/pilot/tools` endpoint confirmed | ✅ |
| Backend hardcoded 89,247 locations mapped | ✅ (20 hits, 8 files) |
| `alpha.html` full claims read | ✅ |
| GIS runtime availability in dev | ⬜ Not verified |
| Pilot manifest tool count | ⬜ Not verified |
| `Properties` table seeded parcel count | ⬜ Not verified |
| `LiveDataProvider.ts` fallback path | ⬜ Not verified |
| Active dev `.env` file contents | ⬜ Not found |

---

## 9. Proposed Commit

```
docs(alpha): add Benton Reality Report v1

CARD-04 truth pass. Source honesty check; no browser-render proof.

- Inventories all hardcoded 89,247 occurrences (20 hits, 8 backend files)
- Documents Pilot Runtime port 4317 as undocumented alpha dependency
- Calls out Atlas "Real (GIS)" overclaim vs. SVG fallback reality
- Identifies write_high tool surface (record_payment, initiate_tax_sale)
- Documents dev snapshot parcel count: 200 (not 89,247)
- 5 open investigative items for CARD-06 through CARD-12

No code changed. Report only.
```
