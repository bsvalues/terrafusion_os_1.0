# TerraFusion OS — County Pilot Runbook

**Classification:** Government Operating System — County Pilot Deployment
**Version:** 1.0
**Compliance:** FISMA-HIGH, NIST 800-53, WCAG 2.1 AA
**Sovereign Anchor:** `sovereign.yaml` (repo root — immutable constitution)

---

## Overview

This runbook governs the end-to-end process for onboarding a county into TerraFusion OS production. It covers pre-flight verification, sovereign guard validation, staged deployment, HITL handshake confirmation, post-deploy honesty sweep, and rollback procedures.

**Every step is mandatory.** No step may be skipped without written county approval logged in the audit chain.

---

## Pre-Flight Checklist

Complete every item before initiating deployment. Record completion timestamp and operator identity for each.

### 1. Sovereign Manifest Verification

```bash
# Verify sovereign.yaml hash has not been tampered
cd /path/to/terrafusion_os_1.0
sha256sum sovereign.yaml
# Compare output against sealed hash from last governance review
```

Expected: Hash matches governance-sealed value. Any mismatch → **STOP. Do not deploy.**

### 2. Backend Build Gate

```bash
dotnet build backend/TerraFusion.sln --configuration Release --nologo -verbosity:quiet
```

Expected: **0 errors, 0 warnings** (warnings treated as errors in Release mode).

### 3. Frontend Type-Check Gate

```bash
cd frontend/apps/os-shell
pnpm run type-check
```

Expected: **0 TypeScript errors.**

### 4. Full Test Suite Gate

```bash
# Frontend unit tests
cd frontend/apps/os-shell
pnpm run test:unit

# Backend integration tests
cd backend
dotnet test TerraFusion.sln --configuration Release --filter "Category!=RequiresDocker"
```

Expected: All tests pass. No new failures compared to sealed baseline.

### 5. SovereignGuard Startup Check

```bash
cd backend
dotnet run --project src/TerraFusion.API/TerraFusion.API.csproj -- --validate-sovereign-only
```

Expected: `SovereignGuard: Constitution validated. All laws verified. System is sovereign.`
Any `SovereignViolationException` → **STOP. Investigate before proceeding.**

### 6. County Configuration Review

Verify `appsettings.<CountyName>.json` contains:

- [ ] `CountyId` — matches FIPS county code
- [ ] `ConnectionStrings.DefaultConnection` — points to county-isolated database
- [ ] `JwtSettings.SecretKey` — rotated for this county deployment
- [ ] `HarrisPACS.*` credentials — county-specific, confirmed with county IT
- [ ] `AiSettings.RequireHumanApproval` — **must be `true`**

---

## Staged Deployment Procedure

### Stage 1: Database Initialization

```bash
# Run migrations against county database
cd backend
dotnet ef database update \
  --project src/TerraFusion.Data/TerraFusion.Data.csproj \
  --startup-project src/TerraFusion.API/TerraFusion.API.csproj \
  -- --county <COUNTY_NAME>

# Seed base data
./scripts/seed-benton-database.sh --county=<COUNTY_NAME> --environment=staging
```

Verify: County schema initialized, no migration errors, seed data present.

### Stage 2: Backend Services

```bash
# Deploy via sovereign-checked script
./scripts/deploy-sovereign.sh --county <COUNTY_NAME> --environment staging
```

The `deploy-sovereign.sh` script:
1. Validates `sovereign.yaml` hash
2. Invokes `SovereignGuard` startup validation
3. Starts API kernel on county-isolated port
4. Registers with Consul service discovery
5. Emits deployment trace event to TerraTrace

Expected: All services healthy. `/health` endpoint returns 200 for all registered checks.

### Stage 3: Frontend Deployment

```bash
cd frontend
npm run build
# Verify build output
ls -la ../native-shell/ui/dist/
```

Deploy `native-shell/ui/dist/` to county workstation(s) via county IT provisioning.

### Stage 4: Connectivity Verification

```bash
# API health
curl -f https://<county-api-host>:<port>/health

# Pilot endpoint (read-only check)
curl -X POST https://<county-api-host>:<port>/api/pilot/explain \
  -H "Authorization: Bearer <test-token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"Test explain","parcelId":"TEST-001","countyId":"<COUNTY_ID>","actorId":"pilot-test","source":"Runbook"}'
```

Expected: Explain endpoint returns grounded response. No 5xx errors.

---

## HITL Handshake Confirmation

Before any assessor uses AI-proposed changes, verify the HITL gate is operational.

### End-to-End HITL Test

1. **Authenticate** as a test appraiser in the county system
2. **Open** any parcel in Property Workbench → TerraPilot tab
3. **Submit** an explain query — verify Muse Mode returns a response with no mutation
4. **Switch** to Draft Mode — submit an AI-proposed adjustment
5. **Verify** draft appears in `DraftReviewPanel` with status `PENDING_APPROVAL`
6. **Approve** the draft as a supervisor — verify `HumanApproverId` is captured in the trace
7. **Check** audit log — verify chain: `DRAFT_CREATED` → `HUMAN_APPROVED` → `COMMITTED`
8. **Reject** a second draft — verify chain: `DRAFT_CREATED` → `HUMAN_REJECTED`, zero persistence mutation

```sql
-- Audit verification query (run against county database)
SELECT operation_type, actor_id, human_approver_id, trace_id, created_at
FROM audit_logs
WHERE county_id = '<COUNTY_ID>'
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC;
```

Expected: Complete chain present, `human_approver_id` populated on all COMMITTED records, null on REJECTED with `rejection_reason` present.

---

## Post-Deploy Honesty Sweep

Run immediately after deployment and again at 24h.

### Automated Sweep

```bash
# Run drift detection
npx ts-node tools/tf/sweep.ts --county <COUNTY_ID> --environment staging

# Run shadow write detector
npx ts-node tools/tf/verify-ops.ts --county <COUNTY_ID> --environment staging
```

Expected: Both tools exit 0. Any non-zero exit → investigate before county goes live.

### Manual Spot Checks

1. Confirm no `audit_logs` records have `updated_at != created_at` (audit fields are immutable)
2. Confirm no property records modified without a corresponding `COMMITTED` trace event
3. Confirm TerraTrace has intent/result pairs for all operations in the sweep window — no orphaned intents

---

## Red-Team Safety Validation

Run the full red-team suite against staging before production cutover:

```bash
npx ts-node tools/tf/test-safety.ts --county <COUNTY_ID> --environment staging
```

The suite validates:

| Scenario | Expected Result |
|----------|----------------|
| AI write without `HumanApproverId` | `TruthGate: BLOCKED — HumanApproverId required` |
| Tampered `sovereign.yaml` | `SovereignViolationException` at startup |
| Cross-county parcel access | 403 Forbidden |
| Direct persistence bypass attempt | Contract violation detected |
| Shadow write simulation | `verify-ops` exits non-zero |
| PII in trace events | Sanitization confirmed |
| Stale draft (>24h) | Auto-discarded with `DISCARDED` trace |

All scenarios must pass before production promotion.

---

## Production Cutover

After all staging gates pass:

1. **Notify** county IT lead and assessor office supervisor — get written go-ahead
2. **Re-run** sovereign guard validation against production config
3. **Execute** `deploy-sovereign.sh --environment production`
4. **Run** honesty sweep within 15 minutes of production start
5. **Confirm** first real parcel explain works end-to-end (Muse Mode only for day 1)
6. **Enable** HITL Draft Mode after 48h of Muse-only observation period

---

## Rollback Procedure

If any gate fails post-deploy:

```bash
# Stop services
./scripts/deploy-sovereign.sh --county <COUNTY_NAME> --rollback

# Restore database to pre-deploy snapshot
pg_restore --county-id=<COUNTY_ID> --snapshot=<PRE_DEPLOY_SNAPSHOT>

# Notify county IT immediately
```

Rollback decision authority: **Assessor office supervisor** (not developer, not AI).
All rollback actions are traced in TerraTrace with `source: EMERGENCY_ROLLBACK`.

---

## County Contact Matrix

| Role | Responsibility | Action Authority |
|------|---------------|-----------------|
| Assessor Office Supervisor | HITL approval authority, production cutover go-ahead | Approve/reject AI drafts, authorize deployment |
| County IT Lead | Infrastructure access, database credentials | Deploy infra, manage certs |
| TerraFusion Dev | Code deployment, troubleshooting | Execute scripts, not data decisions |
| County Auditor | Audit log review (90-day cycle) | Read-only audit access |

---

## Audit and Compliance Notes

- All deployment events are immutably logged in TerraTrace
- `sovereign.yaml` hash is recorded in each deployment trace
- HITL approval chain is legally replayable from TerraTrace events
- Audit logs must be retained for minimum 7 years per RCW 40.14 (Washington State)
- FISMA-HIGH controls apply to all data at rest and in transit

---

**Last Updated:** 2026-03-19
**Authority:** TerraFusion OS Governance
**Next Review:** 90 days post-county-pilot-launch
