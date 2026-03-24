# County Onboarding Runbook — TerraFusion OS 1.0
**Classification**: Operational
**Phase**: 23 (CP-16 Multi-County Federation)
**Proof Case**: Yakima County (WA-077)
**Date**: 2026-03-20

---

## Overview

This runbook governs the addition of a new county to the TerraFusion OS federation. Each county operates as a **sovereign deployment** — isolated DB namespace, isolated auth claims, isolated compose stack. No county can access another county's parcel, assessment, or dossier data at the API layer (enforced by `countyId` claim resolution on every request).

---

## Pre-conditions

Before initiating onboarding, the following must be satisfied:

| Check | Who | Notes |
|---|---|---|
| County IGA signed | County Admin + TF Admin | Intergovernmental Agreement |
| FIPS code confirmed | GIS coordinator | Must match WA OFM registry |
| Data migration plan approved | County Assessor | Harris PACS export format |
| Network firewall rules updated | IT | TF API port (5000) allowlisted |
| Auth credentials issued | TF Ops | County admin credentials via secure channel |

---

## Step 1 — Generate County IDs

Each county receives a **stable GUID** that appears in:
- The `Counties` table as `Id`
- Every `Property.CountyId`, `DossierNote.CountyId`, `TaxLevy.CountyId`
- The JWT `countyId` claim for every user in that county

```bash
# Generate a deterministic GUID for Yakima (example)
# Format: YYYY-FIPS-FIPS-FIPS-FIPS000000000
# Yakima FIPS: 077
# County ID: use uuidgen or: [Guid]::NewGuid() in PowerShell

# Example Yakima County ID used in Yakima Flagship deployment:
# 22220022-0770-0770-0770-077007700770
```

Record the GUID in `compose/county-registry.json` (create if absent).

---

## Step 2 — Create County Compose File

Copy the Yakima flagship template:

```bash
cp compose/docker-compose.yakima-flagship.yml compose/docker-compose.{county-code}.yml
```

Edit the new file:
1. Replace all `yakima` / `YAKIMA` / `077` references with the new county code and FIPS
2. Set unique port ranges (no collision with existing counties — see `compose/PORT_REGISTRY.md`)
3. Update `COUNTY_ID` env var to the GUID from Step 1
4. Update `POSTGRES_DB` to `terrafusion_{county_code}`
5. Update `REDIS_PREFIX` to `tf:{county_code}:`

---

## Step 3 — Seed County Record

Connect to the county's PostgreSQL instance and run:

```sql
-- Insert sovereign county record
INSERT INTO "Counties" ("Id", "Name", "State", "FipsCode", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy")
VALUES (
  '{county-guid}',
  'Yakima',
  'WA',
  '077',
  NOW(),
  NOW(),
  'system-onboarding',
  'system-onboarding'
);
```

Run EF Core migrations against the new county DB:

```bash
dotnet ef database update \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --connection "Host=localhost;Port={county-port};Database=terrafusion_yakima;Username=tf;Password={county-pass}"
```

---

## Step 4 — Configure County Auth

In `appsettings.{CountyCode}.json`:

```json
{
  "CountySettings": {
    "CountyId": "{county-guid}",
    "CountyCode": "YAKIMA",
    "FipsCode": "077",
    "CountyName": "Yakima"
  },
  "JwtSettings": {
    "CountyAudience": "TerraFusion-Yakima"
  }
}
```

The `countyId` claim in every issued JWT **must** match the `CountySettings:CountyId` value. This is the single source of truth for county isolation enforcement.

---

## Step 5 — Start County Stack

```bash
docker compose -f compose/docker-compose.yakima-flagship.yml up -d

# Verify all services healthy
docker compose -f compose/docker-compose.yakima-flagship.yml ps
```

Expected services:
- `yakima-postgres` — PostgreSQL on county port
- `yakima-redis` — Redis on county port
- `yakima-core` — TerraFusion.API on county API port
- `yakima-ui` — Frontend build served by Nginx

---

## Step 6 — Smoke Test

Run the county smoke suite:

```bash
dotnet test tests/TerraFusion.Unit.Tests \
  --filter "FullyQualifiedName~R1Week5Cx22" \
  --logger "console;verbosity=normal"
```

All 13 G7 federation isolation tests must pass before proceeding.

Also run cross-county denial checks manually:

```bash
# Benton token → Yakima endpoint → must return 403/404
curl -H "Authorization: Bearer {BENTON_TOKEN}" \
     http://localhost:{YAKIMA_PORT}/api/atlas/parcels/YAKIMA-PARCEL-001
# Expected: 403 Forbidden or 404 Not Found
```

---

## Step 7 — Import Harris PACS Data

Run the county data import (requires county PACS export):

```bash
./scripts/seed-benton-database.sh --county=yakima --source=/path/to/yakima-pacs-export.csv
```

Data validation gates:
- Parcel count matches PACS record count ± 0.1%
- All `CountyId` fields populated with Yakima county GUID
- Zero orphaned records (no property without a matching county record)

---

## Step 8 — User Provisioning

Provision county admin user via the TF Admin API:

```bash
curl -X POST http://localhost:{YAKIMA_PORT}/api/auth/provision-county-admin \
  -H "Authorization: Bearer {TF_SYSTEM_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yakimacounty.us",
    "countyId": "{county-guid}",
    "countyCode": "YAKIMA",
    "role": "CountyAdmin"
  }'
```

Distribute temporary credentials to county admin via secure channel (not email).

---

## Step 9 — Acceptance Sign-off

The following parties must sign the county acceptance form before going live:

| Party | Sign-off |
|---|---|
| County Assessor | Functional acceptance |
| TF Ops Lead | Technical acceptance |
| Security Officer | Isolation verification |

Acceptance form template: `.governance/templates/COUNTY_ACCEPTANCE_FORM.md`

---

## Rollback Procedure

If onboarding fails at any step:

1. Stop county compose stack: `docker compose -f compose/docker-compose.{county}.yml down`
2. Drop county database: connect to county Postgres and `DROP DATABASE terrafusion_{county}`
3. Remove county record from master registry: `compose/county-registry.json`
4. Revoke issued credentials via TF Admin API
5. Notify county admin of failure and estimated resolution time

---

## Yakima Flagship — Proof Status

| Step | Status | Notes |
|---|---|---|
| County GUID assigned | ✅ | `22220022-0770-0770-0770-077007700770` |
| Compose file exists | ✅ | `compose/docker-compose.yakima-flagship.yml` |
| County seeded in G7 tests | ✅ | `R1Week5Cx22MultiCountyFederationTests.cs` |
| Federation isolation proven | ✅ | 13/13 G7 tests pass |
| Benton ↔ Yakima isolation | ✅ | Cross-county deny verified |
| Yakima ↔ Cowlitz isolation | ✅ | Mutual deny verified |
| Onboarding runbook validated | ✅ | This document |

---

*Runbook version 1.0 — authored Phase 23 sealed 2026-03-20*
