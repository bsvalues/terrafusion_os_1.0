# TerraForge Layer Contract Truth Gate

Date: 2026-04-28
Scope: TerraForge layer posture, Redis runtime truth, Rust kernel placement.

## Verdict

Redis has not been completely passed over, but it has not been proven as part of the active TerraForge product workflow.

Current truth:

- Redis is present in configuration, infrastructure scripts, package references, and optional API startup wiring.
- The API host can create a `StackExchange.Redis.IConnectionMultiplexer` from `ConnectionStrings:Redis`.
- `IRedisCacheService` resolves to `RedisCacheService` only when that connection succeeds; otherwise it resolves to `NoOpRedisCacheService`.
- `IDistributedCache` in the API authentication registration is currently memory-backed through `AddDistributedMemoryCache`.
- CostForge batch status currently persists through `ValuationPipeline`, not Redis.
- The Rust kernel batch path does not depend on Redis and should not.

Safe claim:

```text
Redis exists as optional platform/runtime cache plumbing. It is not yet a proven TerraForge batch workflow state lane.
```

Unsafe claim:

```text
Redis powers TerraForge batch progress, CostForge batch coordination, County Studio scenario state, or valuation audit.
```

## Layer Contract

```text
L1 OS Shell
  Owns global routing, launch, windowing, dock, command palette, status.
  Must not own valuation math or county study logic.

L2 Home Scene
  Owns county/user orientation before work begins.
  Must not become a fake suite dashboard.

L3 Suite Workspace
  Owns domain work surfaces such as County Studio.
  Cross-parcel appraisal operations can live here.

L4 Tier-0 Workbench
  Owns parcel-scoped work such as Property Workbench.
  Parcel-specific action routes here.

L5 Tools and Engines
  Owns specialized tools and execution engines.
  Includes CostForge, CompsForge, Atlas map surface, Rust kernels.

Runtime Coordination Below L5
  Redis may support short-lived status, cache, lockout, and idempotency.
  Redis is not a product, valuation source of truth, audit record, or approval state.

Governance Spine
  TerraTrace/audit records provenance and decisions.
  Audit must outlive Redis.
```

## Evidence

### API Redis startup

`backend/src/TerraFusion.API/Program.cs`

- Lines 1058-1078: optional Redis connection via `ConnectionStrings:Redis`.
- Lines 1460-1469: `IRedisCacheService` resolves to Redis-backed service when Redis is available, otherwise NoOp.
- Lines 1487-1488: lockout store is registered as `RedisLockoutStore`, but it depends on `IDistributedCache`.

### API distributed cache backing

`backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs`

- Line 85 registers `AddDistributedMemoryCache`.
- No API Program-level `AddStackExchangeRedisCache` was found in the active API host path.

Implication:

```text
IConnectionMultiplexer may be Redis-backed, but API IDistributedCache appears memory-backed unless another registration overrides it.
```

### Redis service surfaces

Redis-backed services exist:

- `backend/src/TerraFusion.Core/Services/RedisCacheService.cs`
- `backend/src/TerraFusion.Core/Services/Caching/AdvancedRedisCacheService.cs`
- `backend/src/TerraFusion.Core/Security/Lockout/RedisLockoutStore.cs`
- `backend/src/TerraFusion.API/Controllers/CacheController.cs`

Fallback exists:

- `backend/src/TerraFusion.Core/Services/NoOpRedisCacheService.cs`

### CostForge batch status

`backend/src/TerraFusion.API/Controllers/CostForgeController.cs`

- Lines 8078-8085: `POST /api/costforge/batch/apply`.
- Line 8081 states it creates a `ValuationPipeline` record to track progress.
- Lines 8200-8205: `GET /api/costforge/batch/status/{jobId}`.
- Lines 8210-8232 read status from `ValuationPipeline`.

Implication:

```text
CostForge batch progress is database-backed today, not Redis-backed.
```

### Rust kernel batch path

The Rust kernel proof commit `f37988d69` placed Rust kernels at L5/backend execution layer:

- stdin/stdout deterministic binaries
- .NET process host
- source `git:<sha>` provenance
- binary SHA256 artifact provenance
- no Redis dependency

This is correct. Redis must not participate in deterministic valuation math.

## Required Next Truth Gates

Run these before implementing Redis in any new TerraForge path:

```powershell
$files = git ls-files backend/src backend/tests packages scripts 'docker-compose*' '.env*' |
  Where-Object { $_ -notmatch '(^|/)(bin|obj|target|publish)/' }
Select-String -Path $files -Pattern 'Redis|redis|StackExchange.Redis|IConnectionMultiplexer|IDatabase|AddStackExchangeRedis|AddDistributedRedis|UseRedis|ConnectionMultiplexer|RedisCache|IDistributedCache'
```

```powershell
Select-String -Path backend/src/TerraFusion.API/Program.cs -Pattern 'ConnectionStrings.*Redis|ConnectionMultiplexer|AddStackExchangeRedisCache|AddDistributedMemoryCache|IRedisCacheService|IDistributedCache'
```

```powershell
Select-String -Path backend/src/TerraFusion.API/Controllers/CostForgeController.cs -Pattern 'batch-calculate|batch/apply|batch/status|ValuationPipeline|IRedisCacheService|IDistributedCache'
```

## Recommended Redis Role

Do not wire Redis everywhere.

First valid productization slice:

```text
TerraForge batch job ephemeral state
```

Allowed Redis responsibilities:

- short-lived batch progress cache
- idempotency key cache
- temporary coordination locks
- non-authoritative status acceleration
- request de-duplication

Forbidden Redis responsibilities:

- final valuation result source of truth
- legal/audit provenance store
- approval workflow state
- publish state
- deterministic math inputs or outputs without persisted audit copy

## Implementation Rule

If Redis is added to TerraForge batch job state:

- Redis outage must degrade to database-backed status, not corrupt math.
- Final valuation results must still persist outside Redis.
- Audit/provenance must remain in governed storage.
- Batch status keys must be namespaced, county-scoped, and TTL-bound.
- Tests must prove both Redis-configured and Redis-absent behavior.

## Current Action

No Redis implementation should be started until this layer contract is accepted and a focused batch-status card is opened.

