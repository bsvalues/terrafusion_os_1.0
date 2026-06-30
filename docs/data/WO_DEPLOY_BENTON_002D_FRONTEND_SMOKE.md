# WO-DEPLOY-BENTON-002D — Frontend/API Local Integration Smoke

**Date:** 2026-06-30  
**WO:** WO-DEPLOY-BENTON-002D  
**Status:** PASS  
**Stop type:** Evidence captured, no mutations, no production promotion  

---

## Objective

Prove the full frontend → API → Azure demo DB chain locally:
- Vite dev server (port 3000) proxy routes `/api/*` to local API (port 5046)  
- Local API connects to `terrafusion_benton_demo` on Azure  
- Parcel read returns real Benton County data from `canonical_tf.tf_parcel`

---

## Environment

| Item | Value |
|------|-------|
| API port | 5046 |
| Frontend port | 3000 |
| Database | `terrafusion_benton_demo` on `pg-terrafusion-benton-demo.postgres.database.azure.com` (Azure PG16) |
| API env vars | `TF_SKIP_DEV_SEEDERS=true`, `ASPNETCORE_ENVIRONMENT=Development`, `ConnectionStrings__DefaultConnection` override pointing at Azure |
| Frontend env vars | `TF_API_PORT=5046`, `VITE_PORT=3000` |
| node_modules source | Main checkout `C:\Users\bsval\terrafusion_os_1.0\frontend\node_modules` (avoids re-install in worktree) |
| Vite version | v5.4.21 |

---

## Gate: API Running (from WO-002C carryover)

API confirmed up at port 5046 with `Now listening on: http://localhost:5046`.  
0 pending EF migrations. TF_SKIP_DEV_SEEDERS blocked GPT seeder and DX-01 Dossier seeder.

---

## Gate 1: Frontend Starts

Vite started from main checkout frontend directory:

```
VITE v5.4.21  ready in 834 ms
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.141:3000/
```

**Result: PASS**

---

## Gate 2: Vite Proxy → API → Azure DB

Dev token acquired anonymously from API:
```
GET http://localhost:5046/api/auth/dev-token  →  200 OK
```

Parcel query through Vite proxy (port 3000):
```
GET http://localhost:3000/api/counties/benton/parcels?pageSize=3
Authorization: Bearer <dev-token>
```

**Full response (abbreviated):**
```json
{
  "county": "Benton",
  "countyId": "19190019-1919-1919-1919-191919191919",
  "rowType": "parcels",
  "runtimeTable": "canonical_tf.tf_parcel",
  "semantics": {
    "countyScoped": true,
    "activeOnly": true,
    "duplicateParcelVersionsCollapsed": true,
    "currentParcelVersion": true,
    "source": "canonical_tf_runtime_query"
  },
  "total": 84388,
  "count": 50,
  "rows": [
    {
      "parcelId": "1410754f-e8e7-4678-a2cd-d7e2b4aa11cc",
      "parcelNumber": "101040000000000",
      "propertyType": "R",
      "parcelStatus": "ACTIVE",
      ...
    },
    ...
  ]
}
```

**Result: PASS**

---

## Evidence Summary

| Check | Result |
|-------|--------|
| Vite starts on port 3000 | PASS |
| Vite proxy routes `/api/*` to port 5046 | PASS |
| Dev token endpoint reachable | PASS |
| Parcel endpoint returns real data through proxy | PASS |
| `total` matches WO-002C direct-API count | PASS — 84,388 both ways |
| `runtimeTable` | `canonical_tf.tf_parcel` |
| `source` | `canonical_tf_runtime_query` |
| Schema mutations | NONE |
| Data mutations | NONE |
| Seeders ran | NONE (TF_SKIP_DEV_SEEDERS=true) |
| Migrations run | NONE (0 pending) |

---

## Consistency with WO-002C

WO-002C proved direct API path: `GET /api/counties/benton/parcels` → 84,388 parcels.  
WO-002D proves frontend proxy path: same endpoint, same count, same `runtimeTable`.  
Both paths terminate in Azure `canonical_tf.tf_parcel`.

---

## Non-mutations Confirmed

- No schema changes
- No data loads
- No PACS connection
- No production deployment
- No secret commits

---

## WO-DEPLOY-BENTON-002D: CLOSED

**Full chain: Browser → Vite → API → Azure → `canonical_tf.tf_parcel` — PROVEN**

**Next:** Operator discretion for WO-DEPLOY-BENTON-002E or demo readiness declaration.
