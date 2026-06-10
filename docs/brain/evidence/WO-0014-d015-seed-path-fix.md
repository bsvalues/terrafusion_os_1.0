# WO-0014 — D-015 ServiceRegistry Seed Path Fix (evidence)

**Date:** 2026-06-10 · **Verdict: FIXED + LIVE-PROVEN** (unit-test run blocked by fleet WIP — documented below)

## Change
`backend/src/TerraFusion.API/Services/ServiceRegistry.cs` — new `FindPlatformJsonPath()`: when `EnsureSeededAsync` gets no explicit path, check the registry file's directory then up to four ancestors for `platform.json` (registry lives under `backend/`, canonical platform.json at repo root). Falls back to the sibling path so the existing "not found" warning still names the conventional location. Explicit-path overload and idempotency untouched.

## Live runtime proof (primary)
1. Stopped the dev `TerraFusion.API` (PID 34752) per D-001's documented remedy (it held DLL locks).
2. Build succeeded with the fix (`TerraFusion.API -> ...TerraFusion.API.dll` — 0 CS errors in API project).
3. Moved `backend/service-registry.json` aside; booted `dotnet run --project src/TerraFusion.API --no-build`.
4. Fresh `backend/service-registry.json` written at `2026-06-10T15:50:01Z` containing **all 9 platform.json services** — api:5046, frontend:3102, shell:3103, desktop:3104, levy:3202, trends:3203, consciousness:8080, postgres:5432, redis:6379 (status `stopped`) — **plus** self-registered `backend`:5000 `running` PID 2912. Pre-fix behavior (WO-0013 evidence): the same boot path produced a registry with ONLY `backend`.
5. Services count 1 → 10 satisfies the WO proof bar ("seeded Services count > 1"). Dev API left running (environment restored).
6. Env honesty note: the boot instance that seeded (PID 2912) exited after startup logging; a fresh `TerraFusion.API` instance (PID 35408, 08:53) came up immediately after (dev-os watcher churn — D-001 territory, environmental). The seeding proof is the registry FILE CONTENT (9 platform services), which the pre-fix code could not produce regardless of which instance wrote it.

## Regression test (written; run blocked by fleet WIP)
`EnsureSeededAsync_FindsPlatformJsonInAncestorDirectory_WhenNoExplicitPath` added to `backend/tests/TerraFusion.Unit.Tests/Stage3/ServiceRegistryTests.cs` (repo-root temp layout: platform.json at root, registry under backend/). **Cannot execute yet:** the Unit.Tests project fails to COMPILE on pre-existing fleet work-in-progress — uncommitted `PropertyValuationController` refactor (ctor `IPropertyValuationAIEnhancementService` → `IServiceProvider`) breaks committed `R1Week5CxR1ClosureTests.cs` (4× CS1503). Their lane (controller is in my forbidden patterns); the new test runs as soon as their slice lands. Existing 8 ServiceRegistry facts likewise can't re-run — they are untouched by this change except via the default-path branch they never exercised (all pass explicit paths).

## Residual (honest)
- **G2 (module-id alignment) still open:** registry now has `levy`/`trends` keys; `TerraLevyGen2.tsx` prose mentions `terra-levy` at `:5177` vs seeded `levy` at `:3202`. Whether shell `moduleId`s match platform.json keys needs a live shell check — noted in WO-0014 non-goals, candidate follow-up note for the dock/top-bar deep sweep gate.
- Unit.Tests compile break is FLEET drift, not recorded as my ledger row (their in-flight slice; would be noise to ledger an uncommitted WIP state).
