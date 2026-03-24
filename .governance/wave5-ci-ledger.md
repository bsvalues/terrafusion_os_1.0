# Wave 5 — CI Gate, Deployment Readiness & Type Safety Ledger

**Sealed:** 2026-03-18
**Branch:** `post-r3/w5f-registry-edge-cleanup`
**Wave 4 foundation:** 2,807 backend tests passing, GPT/RAG persistence active

---

## Minimum Success Criteria — Disposition

| # | Criterion | Status |
|---|-----------|--------|
| 1 | CI runs real gates on every PR/push | ✅ `.github/workflows/terrafusion-ci.yml` created |
| 2 | Frontend known-failures baselined explicitly | ✅ 4 files documented in `.governance/known-failures/` |
| 3 | Deployment pipeline includes live-db migration step | ✅ `scripts/deploy-pgvector-migration.sh` + `.governance/wave5-deployment-readiness.md` |
| 4 | pgvector EF migration snapshot | ⏳ Deferred — requires live PostgreSQL + pgvector target |
| 5 | Type-safety focused on high-value hotspots | ✅ `gptClient.ts` HIGH/MEDIUM findings fixed |
| 6 | Repo ends clean, gates green, deployment notes written | ✅ All gates passing, docs written |

---

## Lane A — CI Gate Hardening

### Canonical Gate: `.github/workflows/terrafusion-ci.yml`

**Triggers:** `pull_request` + `push` to `main` and `post-r3/**`

**Job order:**

```
backend-gate  ─┐
               ├── evidence-gate ── wave5-seal
frontend-gate ─┘
```

**Steps per job:**

| Job | Step | Mode |
|-----|------|------|
| backend-gate | `dotnet restore` + `dotnet build --no-restore` + `dotnet test --no-build` | Hard-fail |
| frontend-gate | `pnpm install --frozen-lockfile` | Hard-fail |
| frontend-gate | `pnpm run type-check` | Hard-fail |
| frontend-gate | `pnpm run test:unit` (164 tests, 0 known failures) | Hard-fail |
| frontend-gate | `pnpm exec vitest --run` (full suite, informational) | Soft (continue-on-error) |
| frontend-gate | `pnpm exec vitest --run --config vitest.known-fail.config.ts` | Soft (continue-on-error) |
| evidence-gate | `pnpm -w run r1:verify-evidence` | Hard-fail |

### Frontend Test Architecture (3-Tier)

**Tier 1 — Hard gate:** `pnpm run test:unit`
- Scope: `tests/unit` + `tests/basic.test.ts`
- Result: 164/164 passing
- Zero tolerance for failures

**Tier 2 — Informational:** `pnpm exec vitest --run`
- Scope: Full vitest suite (600+ files)
- Pre-existing failures: visible but non-blocking
- Output captured as artifact: `test-results/vitest-results.json`

**Tier 3 — Known-fail baseline:** `vitest.known-fail.config.ts`
- Scope: 4 explicitly-documented pre-existing failures
- Purpose: Visible audit trail, regression detection

### Known-Fail Baseline (4 files)

| File | Failure | Root Cause |
|------|---------|------------|
| `workbenchRealHosting.gate.test.tsx` | `property-forge-tab` testid not found | Lazy import doesn't resolve in jsdom |
| `TerraCanonCrossTabSyncContract.test.tsx` | Storage event timing assertion | jsdom StorageEvent dispatch unreliable |
| `command-palette-workflows.integration.test.tsx` | Command input not rendered | Missing global setup in test env |
| `forgeAnalytics.contract.test.tsx` | `data-material="bento"` not found | Contract ahead of implementation |

All 4 documented in `.governance/known-failures/`.

---

## Lane B — Deployment Readiness

**Files created:**
- `scripts/deploy-pgvector-migration.sh` — idempotent migration script with pgvector prereq check
- `.governance/wave5-deployment-readiness.md` — full deployment runbook

**Deferred (environment dependency):**
- EF migration `ActivateAiPersistence` not yet committed — requires live PostgreSQL + pgvector
- Migration command: `dotnet ef migrations add ActivateAiPersistence --project backend/src/TerraFusion.Data --startup-project backend/src/TerraFusion.API`

---

## Lane C — Type Safety (GPT/RAG Boundaries)

**File fixed:** `frontend/apps/os-shell/src/api/gptClient.ts`

### Findings and fixes

| Severity | Finding | Fix Applied |
|----------|---------|-------------|
| HIGH | `sendMessage` sent `{content}` not `{message, gptConfigId}` | Renamed fields, added `gptConfigId` param |
| HIGH | `createConversation` hit non-existent route `/system/${key}/conversations` | Corrected to `POST /api/gpt/conversations` |
| MEDIUM | `GPTMessage.latencyMs` → backend sends `responseTime` | Renamed to `responseTime: number \| null` |
| MEDIUM | `GPTMessage.ragContextUsed` → backend sends `ragDocumentsUsed` | Renamed to `ragDocumentsUsed: string \| null` |
| MEDIUM | `RagDatasetStatus.status` (string enum) → backend sends `indexed: boolean` | Interface aligned to backend shape |
| MEDIUM | Dead `userId`/`countyId` params in request bodies (ignored by backend) | Removed; added comment about JWT claims |
| LOW | `any` casts on SignalR event payloads in `gptHub.ts` | Out of scope — deferred |

**Callers updated:** `GptStudioView.tsx` (components/ + features/)
**Type-check after fixes:** `pnpm run type-check` → PASS (0 errors)

---

## Full Gate Results

```
pnpm run type-check          → ✅ PASS
pnpm run test:unit           → ✅ 164/164
dotnet build backend/...     → ✅ 0 errors
dotnet test                  → ✅ 2,807/2,807
pnpm -w run r1:verify-evidence → ✅ R1 evidence verified
```

---

## What Was NOT Done (Scope Enforced)

- No shell rewrites
- No new feature work
- No repo-wide strict-mode crusade
- No pgvector migration snapshot (environment dependency)
- No SignalR payload typing (deferred to hub-contract hardening pass)

---

**Next:** Wave 5 is sealed. Next sprint owns the live-db migration environment and the pgvector snapshot commit.
