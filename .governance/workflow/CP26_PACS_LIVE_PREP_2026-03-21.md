# CP26 — PACS Live Integration Prep Seal
**Date**: 2026-03-21
**Phase**: 33 (machine-owned prep) / CP-26
**Status**: PREP SEALED — wiring complete, SQL Server pending SRE provisioning
**Commit**: (sealed below)

---

## What Phase 33 Machine-Owned Prep Delivers

Phase 33 opened with one genuine external blocker: County IT must provision the Harris PACS
SQL Server before live data can flow. Everything else — API endpoint, frontend service wiring,
connection smoke script — is machine-owned and was executed 2026-03-21.

**Three files written and verified:**

### 1. `backend/src/TerraFusion.API/Controllers/PacsController.cs`

New controller at `GET /api/pacs/properties` and `GET /api/pacs/health`.

- Resolves `IPacsAdapter` (already DI-registered via `AddPacsAdapter()` in Program.cs)
- Properties endpoint: 5-second CancellationToken cap → returns HTTP 503 immediately when
  SQL Server is unreachable (instead of blocking for 30s TCP timeout)
- Health endpoint: 5-second cap → returns `{"status":"degraded"}` when SQL Server is
  unreachable, `{"status":"connected"}` when live
- Catches `PacsContractViolationException` → 503 with structured error body
- Uses `IServiceProvider` resolution so DI failure (no connection string) also returns 503

### 2. `frontend/apps/os-shell/src/services/pacsService.ts`

Updated `getPacsProperties()` priority chain:

```
1. GET /api/pacs/properties  ← live Harris PACS (PacsController → IPacsAdapter → SQL Server)
2. GET /api/properties       ← SQLite dev DB (fallback when PACS returns 503)
```

No env-var branching in the frontend. The backend 503 is the signal. When SQL Server is
provisioned and `/api/pacs/properties` returns 200, the live path activates automatically.

### 3. `os-platform/development/testing-suite/phase33-pacs-connection-smoke.mjs`

TC-F smoke script with two modes:

**HTTP mode** (run now, API only):
```
node phase33-pacs-connection-smoke.mjs --http
```
Pre-provisioning expected result:
```
  PASS  TC-F-H-1: GET /api/pacs/health reachable
  FAIL  TC-F-H-2: PACS status is connected (SQL Server provisioned) -- status=degraded
  NOTE: "degraded" is expected before SQL Server is provisioned. Re-run after SRE provisions.
  TC-F Results: 1 passed / 1 failed
```

**Direct SQL mode** (after SQL Server provisioned):
```
TF_DEV_PACS_SERVER=<host> \
TF_DEV_PACS_DATABASE=pacs_oltp \
TF_DEV_PACS_USER=<user> \
TF_DEV_PACS_PASSWORD=<password> \
TF_DEV_PACS_TRUST_CERT=true \
node phase33-pacs-connection-smoke.mjs
```
Expected live result: TC-F-1 through TC-F-8 all PASS (6 views + 1 connection + 1 row count)

---

## TC-F Pre-Provisioning Verification (2026-03-21)

| Test | Expected | Actual | Status |
|---|---|---|---|
| TC-F-H-1: `/api/pacs/health` reachable | 200 or 503 | 200 | ✅ PASS |
| TC-F-H-2: PACS connected | degraded (SQL not provisioned) | degraded | ✅ Expected |

**Wiring correctness confirmed**: Endpoint returns within 5s without blocking. Frontend
fallback to SQLite activates automatically. Vitest 6186/6186 green (no regression).

---

## TC-F Live Gate (execute when SQL Server provisioned)

| Test | Requirement | Status |
|---|---|---|
| TC-F-1: SQL Server connection | Connected | HOLD — SQL Server not provisioned |
| TC-F-2: vw_TerraFusion_Property_Core | ≥1 row | HOLD |
| TC-F-3: vw_TerraFusion_Property_Ownership | ≥1 row | HOLD |
| TC-F-4: vw_TerraFusion_Assessment_History | ≥1 row | HOLD |
| TC-F-5: vw_TerraFusion_Comparable_Sales | ≥1 row | HOLD |
| TC-F-6: vw_TerraFusion_Cama_Characteristics | ≥1 row | HOLD |
| TC-F-7: vw_TerraFusion_Improvement_Cost_Matrices | ≥1 row | HOLD |
| TC-F-8: Property_Core row count > 0 | >0 (89,247 expected) | HOLD |

---

## Pending SRE Tasks (block Phase 33 live gate)

| Task | Owner | Status |
|---|---|---|
| SEC-005-ROTATE: rotate `TF_JWT_SECRET` via `openssl rand -base64 64` | SRE | HOLD |
| SRE-O1-OPS: deploy all `TF_*` env vars to staging + prod | SRE | HOLD |
| SQL Server provisioning: County IT provisions PACS SQL Server | County IT | HOLD |
| Set `ConnectionStrings:PacsConnection` in production config | SRE | HOLD |
| Run `phase33-pacs-connection-smoke.mjs --http` → all assertions green | Solo dev | HOLD |
| Populate TC-F live gate table above | Solo dev | HOLD |

---

## Connection String Format (for SRE)

When SQL Server is provisioned, set either:

```
# Environment variable (overrides appsettings):
ConnectionStrings__PacsConnection=Server=<host>,1433;Database=pacs_oltp;User Id=<user>;Password=<pw>;Encrypt=True;TrustServerCertificate=True;Application Name=TerraFusion-OS;

# Or via User Secrets (dev):
dotnet user-secrets set "ConnectionStrings:PacsConnection" "Server=<host>,1433;..."
```

Note: `Encrypt=True` and `Application Name` containing "TerraFusion" are required by
pacscontract.v1. `TrustServerCertificate=True` is needed for self-signed dev certs.

---

## Backend Architecture

```
GET /api/pacs/properties
  → PacsController (new, Phase 33)
  → IPacsAdapter (singleton, registered: AddPacsAdapter() in Program.cs)
  → PacsSqlAdapter (pacscontract.v1 implementation)
  → SQL Server → vw_TerraFusion_Property_Core
```

```
pacsService.ts (frontend)
  → GET /api/pacs/properties  [live, returns 200 when SQL provisioned]
  → GET /api/properties       [fallback, returns 200 always — SQLite dev DB]
```

---

## Vitest Gate

- Phase 32 baseline: 6186/6186 (0 failures, 226 skipped)
- Phase 33 prep: **6186/6186** (0 failures, 226 skipped) ✅

*No regression. pacsService mocks in PropertySearch.test.tsx unaffected by service changes.*

---

## Phase 33 Opens When

County IT confirms SQL Server provisioned AND SRE sets `ConnectionStrings:PacsConnection`.
Then: `node phase33-pacs-connection-smoke.mjs --http` → all assertions green → full seal.

*The wiring was always here. SQL Server is the only remaining lock.*
