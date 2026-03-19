# TerraFusion OS — County Pilot Deployment Runbook

**Version:** 1.0
**Phase:** 11 — Sovereign Deploy
**Target:** Benton County, WA (Initial Pilot)
**Classification:** Government Operations

---

## Prerequisites

Before deploying TerraFusion OS to any county, confirm:

- [ ] `sovereign.yaml` is present at repo root and passes all safety checks
- [ ] FISMA-HIGH authorization obtained for target county
- [ ] County IT contact confirmed and on-call during deployment
- [ ] Harris PACS access credentials loaded in secure vault
- [ ] Database backup taken of target county environment

## Pre-Deployment Validation

Run all three sovereignty gates:

```bash
# Gate 1: Sovereign manifest validation
npx tsx tools/tf/test-safety.ts

# Gate 2: TerraTrace drift check (no unpaired intent/result)
npx tsx tools/tf/sweep.ts

# Gate 3: Shadow write detection (no unauthorized SaveChangesAsync)
npx tsx tools/tf/verify-ops.ts
```

**All three must exit 0** before proceeding. If any gate fails, fix the issue and re-run.

Or run all gates in sequence:

```bash
./scripts/deploy-sovereign.sh --dry-run --county benton_wa
```

## Deployment Steps

### 1. Deploy Backend Services

```bash
cd backend
docker-compose -f docker-compose.microservices.yml up -d
```

Services started:
- TerraFusion.API (Kernel) — port 5000
- TerraFusion.Gateway (Shell) — port 3002
- TerraFusion.Consciousness (AI Swarm) — port 3004

### 2. Verify Health Endpoints

```bash
curl http://localhost:5000/health
curl http://localhost:3002/health
curl http://localhost:3004/health
```

All must return `{"status":"Healthy"}`.

### 3. Verify SovereignGuard at Startup

Check API startup logs for:
```
Sovereign manifest validated. Hash: <sha256>
```

If instead you see `SOVEREIGN VIOLATION`, the application will exit. Fix `sovereign.yaml` before proceeding.

### 4. Deploy Frontend

```bash
cd frontend
npm run build
```

Output goes to `native-shell/ui/dist/`.

### 5. Seed County Data (First Deploy Only)

```bash
./scripts/seed-benton-database.sh
```

### 6. Smoke Test

```bash
# Test explain endpoint
curl -X POST http://localhost:5000/api/pilot/explain \
  -H "Content-Type: application/json" \
  -d '{"query":"Why was this parcel assessed at this value?","parcelId":"TEST001","countyId":"benton_wa","actorId":"assessor_test","source":"runbook"}'

# Test draft creation
curl -X POST http://localhost:5000/api/pilot/drafts \
  -H "Content-Type: application/json" \
  -d '{"countyId":"benton_wa","proposedBy":"ai_agent","actionSummary":"Test draft","actionPayloadJson":"{}"}'
```

## HITL Drafter Workflow

When the AI proposes an assessment action:

1. A `PilotDraft` is created with `Status: Pending`
2. The human assessor reviews the draft in the TerraPilot Workbench tab
3. The assessor approves (sets `HumanApproverId`) or rejects (with reason)
4. Only `Approved` drafts with a non-empty `HumanApproverId` (TruthGate) execute

**No write operation executes without `HumanApproverId` set.** This is enforced at:
- Service layer: `DraftService.ApproveDraftAsync` validates `HumanApproverId` is non-empty
- Frontend: `approveDraft()` in `pilotApi.ts` requires `humanApproverId` field
- Backend: `RequireAssessor` policy gates approve/reject endpoints

## Rollback

If an issue is detected post-deployment:

```bash
# Stop services
docker-compose -f backend/docker-compose.microservices.yml down

# Revert database if needed
npm run db:reset
```

## Contact

- **Technical Lead:** Benton County Assessor's Office
- **AI Swarm Monitoring:** `npm run monitor-agents`
- **Compliance:** FISMA-HIGH — all incidents must be logged within 1 hour
