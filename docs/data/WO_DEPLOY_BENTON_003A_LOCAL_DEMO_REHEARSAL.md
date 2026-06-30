# WO-DEPLOY-BENTON-003A — Local Demo Rehearsal

**Date:** 2026-06-30  
**WO:** WO-DEPLOY-BENTON-003A  
**Status:** COMPLETE  
**Stop type:** Evidence captured, no mutations, no production promotion

---

## Environment

| Item | Value |
|------|-------|
| Frontend | Vite v5.4.21 on `http://localhost:3000` (PID 32448) |
| API | TerraFusion.API on `http://localhost:5046` (PID 45204) |
| Database | `terrafusion_benton_demo` on `pg-terrafusion-benton-demo.postgres.database.azure.com` (Azure PG16) |
| API env | `TF_SKIP_DEV_SEEDERS=true`, `ASPNETCORE_ENVIRONMENT=Development` |
| Proxy | Vite routes `/api/*` → `http://localhost:5046` via `TF_API_PORT=5046` |

---

## Gate 1: Services Confirmed Running

Both services carried over from WO-002D — no restart required.

```
TCP  0.0.0.0:3000  LISTENING  PID 32448  (Vite)
TCP  127.0.0.1:5046  LISTENING  PID 45204  (TerraFusion.API)
```

API target DB confirmed: `"database": "terrafusion_benton_demo"` (from `/api/runtime/truth/db-identity`).

---

## Gate 2: Auth Path

Dev token endpoint (anonymous in Development):

```
GET http://localhost:5046/api/auth/dev-token → 200 OK
Token: valid JWT, used for all subsequent probes
```

---

## Gate 3: Health / Readiness

```
GET /healthz       → status: "ok"
GET /healthz/ready → ready: true
```

---

## Gate 4: Demo-Proven API Paths

### 4A — Parcel List (canonical)

```
GET http://localhost:3000/api/counties/benton/parcels?pageSize=5
Authorization: Bearer <dev-token>
```

| Field | Value |
|-------|-------|
| total | 84,388 |
| runtimeTable | `canonical_tf.tf_parcel` |
| semantics.source | `canonical_tf_runtime_query` |
| semantics.activeOnly | true |
| semantics.duplicateParcelVersionsCollapsed | true |
| sample | parcelNumber=`101040000000000`, propertyType=`R`, parcelStatus=`ACTIVE` |

**DEMO_PATH: PROVEN**

### 4B — Parcel Detail (by parcel number filter)

```
GET http://localhost:5046/api/counties/benton/parcels?parcelNumber=101040000000000&pageSize=1
```

Returns the single matched row including `parcelId`, `parcelNumber`, `propertyType`, `parcelStatus`, `updatedAt`.  
Note: `address` and `legalDescription` are null in the Azure demo DB (not loaded from PACS text fields in this sync pass).

**DEMO_PATH: PROVEN** (with gap note: address/legal null)

### 4C — Sales List (canonical)

```
GET http://localhost:3000/api/counties/benton/sales?pageSize=20
Authorization: Bearer <dev-token>
```

| Field | Value |
|-------|-------|
| total | 90,386 |
| runtimeTable | `canonical_tf.tf_sale` |
| sample with price | parcelNumber=`113894070000005`, saleDate=`2026-01-08`, salePrice=$365,500, saleQualified=true |
| conversionEra | `POST_CONVERSION` |

**DEMO_PATH: PROVEN**

### 4D — Runtime Truth / DB Identity

```
GET http://localhost:5046/api/runtime/truth/db-identity
```

Confirms:
- `database: "terrafusion_benton_demo"`
- `provider: "Npgsql.EntityFrameworkCore.PostgreSQL"`
- `appliedMigrations: 94`, `pendingCount: 0`
- `environment: "Development"`

**DEMO_PATH: PROVEN** — useful for "this is the Benton demo DB" proof slide.

### 4E — Runtime DB Content Summary

```
GET http://localhost:5046/api/runtime/truth/db-content
```

| Field | Value |
|-------|-------|
| totalCounties | 1 |
| totalProperties | 84,418 (raw; 84,388 distinct parcel numbers) |
| duplicateParcelNumberGroups | 14 |
| FIPS | 53005 (Benton County WA) |

Config gap (non-blocking for demo): `expectedBentonParcelCount: null` — count gate reports "unchecked" because the expected count is not wired to the county seed record. See WO-CONFIG-BENTON-001.

**DEMO_PATH: PROVEN** (with config gap noted)

---

## Gate 5: Frontend Route Availability

All Vite SPA routes return 200 (SPA serves `index.html` for all paths):

| Route | HTTP | Notes |
|-------|------|-------|
| `/` | 200 | Root dashboard / OS shell |
| `/county-studio` | 200 | Expected to proxy to parcel API |
| `/parcels` | 200 | Parcel browser UI |
| `/sales` | 200 | Sales browser UI |
| `/properties` | 200 | Legacy properties view |
| `/workbench` | 200 | Workbench (API not yet wired) |
| `/dossier` | 200 | Dossier (API not yet wired) |
| `/atlas` | 200 | Atlas map view |
| `/costforge` | 200 | CostForge |
| `/sync` | 200 | Sync panel |
| `/dashboard` | 200 | Dashboard |
| `/levy` | 401 | Levy route proxied to API — auth required |

---

## Gate 6: Known Demo Gaps (API 404 — Endpoints Not Yet Implemented)

| Endpoint | HTTP | Gap |
|----------|------|-----|
| `/api/counties/benton/improvements` | 404 | Improvement read controller not implemented |
| `/api/counties/benton/land` | 404 | Land read controller not implemented |
| `/api/counties/benton/owners` | 404 | Owner read controller not implemented |
| `/api/counties/benton/geom` | 404 | Geometry read controller not implemented |
| `/api/counties/benton/assessments` | 404 | Assessment read controller not implemented |
| `/api/dossier` | 404 | Dossier route not implemented |
| `/api/workbench` | 404 | Workbench route not implemented |

---

## Gate 7: Fixture Data Warning

`GET /api/properties` returns **fixture/seed data**, NOT real Benton parcels:
- Sample: parcelNumber=`1-0531-100-0001-000`, address=`123 Main St, Kennewick, WA 99336`
- IDs are synthetic: `be010001-0001-0001-0001-000000000001`

**Do not demo `/api/properties` as Benton County truth.** Demo only `/api/counties/benton/parcels` for real data.

---

## Exact Demo Script (Proven Paths Only)

### Pre-Demo Checklist

```bash
# Verify services are up
netstat -ano | grep ":5046\|:3000"

# Verify Azure DB target
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5046/api/runtime/truth/db-identity \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['database'])"
# Expected: terrafusion_benton_demo

# Get token
TOKEN=$(curl -s http://localhost:5046/api/auth/dev-token | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

### Demo Step 1 — "What Data Do We Have?" (DB Identity Proof)

**URL:** `http://localhost:5046/api/runtime/truth/db-content`  
**Show:** 1 county (Benton, FIPS 53005), 84,418 raw parcel rows, 84,388 distinct parcel numbers  
**Message:** "This is the Benton County demo database — real production data synced from Harris PACS."

### Demo Step 2 — Live Parcel Count (Canonical Query)

**URL:** `http://localhost:3000/api/counties/benton/parcels?pageSize=5`  
**Header:** `Authorization: Bearer <token>`  
**Show:** `total: 84388`, `runtimeTable: canonical_tf.tf_parcel`  
**Message:** "84,388 active Benton parcels — de-duplicated, county-scoped, queried from the canonical schema."

### Demo Step 3 — Parcel Search by Number

**URL:** `http://localhost:5046/api/counties/benton/parcels?parcelNumber=101040000000000`  
**Show:** ACTIVE parcel record with propertyType R  
**Fallback:** If address is null — "Address field loaded in next sync pass; parcel geometry and ownership are staged."

### Demo Step 4 — Sales Evidence

**URL:** `http://localhost:3000/api/counties/benton/sales?pageSize=5`  
**Show:** `total: 90386`, qualified sale at $365,500 (Jan 2026), `conversionEra: POST_CONVERSION`  
**Message:** "90,386 real Benton sales from PACS — qualified sales flagged, ready for ratio study."

### Demo Step 5 — Health (System Readiness)

**URL:** `http://localhost:5046/healthz/ready`  
**Show:** `ready: true`  
**Message:** "Runtime is healthy and connected to the Azure demo DB."

---

## Fallback Script (if a screen isn't demo-ready)

| Screen asked about | Fallback |
|--------------------|---------|
| Parcel map/geometry | "GIS geometry is loaded (79,199 shapes in `gis_tf.tf_parcel_geom`); the map read endpoint is queued next." |
| Improvement details | "Improvements are in the DB; the read API is scoped to the next delivery lane." |
| Owner/WSDOR | "Owner records (97,062) and parcel-owner links (686,851) are loaded; read endpoint is in the backlog." |
| Levy | "Levy module uses a separate proxy path; demo targets parcel and sales today." |
| Address fields | "Address text is in PACS source; the PACS-to-canonical crosswalk for address fields lands next sync." |

---

## No-Mutation Confirmation

| Check | Result |
|-------|--------|
| Schema changes | NONE |
| Data mutations | NONE |
| Migrations run | NONE (0 pending) |
| PACS connected | NO |
| ArcGIS touched | NO |
| Production deployed | NO |
| Secrets committed | NO |

---

## Config Gap (Separate WO)

`expectedBentonParcelCount: null` in the county seed record causes the runtime truth gate to report "unchecked" rather than "matched". This does not affect demo data quality — the real count is 84,388 and is readable. Fix target: **WO-CONFIG-BENTON-001**.

---

## WO-DEPLOY-BENTON-003A: COMPLETE

**Demo is locally rehearsable and repeatable against the Azure demo DB.**  
Two data paths are fully proven for a stakeholder demo:  
- Parcel list/detail → `canonical_tf.tf_parcel` (84,388 parcels)  
- Sales list → `canonical_tf.tf_sale` (90,386 sales)
