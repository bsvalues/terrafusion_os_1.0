# AI Swarm Scale — Bounded Charter (Phase 35-G)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement
> this charter. Steps use checkbox (`- [ ]`) syntax for tracking.

**Canonical path:** `docs/superpowers/plans/2026-03-19-aiswarm-scale-charter.md`
**Date:** 2026-03-19
**Charter author:** @tf-charter (synthesis from SW-A through SW-E recon, Phase 35-F)
**Precondition:** Phase 35-F recon complete. All 5 recon agents (SW-A..SW-E) returned verdicts.

**Critical constraint (CLAUDE.md):** DO NOT modify production AI swarm in
`backend/TerraFusion.Consciousness/` (service classes, hubs, interfaces) or
`os-platform/ai-systems/ai-systems/ai-swarm/`. This charter works exclusively on the
backend integration surface.

---

## Recon Summary

| Agent | Finding | Verdict |
|-------|---------|---------|
| SW-A — Agent hierarchy | 1,008 agents, 8 role divisions, 3-tier orchestration, JSON config, in-memory registry | ✅ PASS |
| SW-B — Coordination | 13 SignalR hubs, 67+ events, county-scoped groups, 4-layer Polly resilience, self-healing | ✅ PASS |
| SW-C — Permissions | Office registry allowlist, 3-layer permission model, Risk enum, county isolation at 3 levels | ✅ PASS |
| SW-D — Concurrency | Single lock bottleneck, no persistent task queue, no rate limiting in Consciousness, sequential L1-L5 | ⚠️ GAP |
| SW-E — TerraTrace | `POST /api/trace/events` does NOT exist; 281 frontend emitters fire into void; zero swarm trace events | 🚨 BLOCKER |

---

## Scope

### IN SCOPE (bounded, non-invasive — backend integration surface only)

1. **Trace ingestion endpoint** — `POST /api/trace/events` does not exist. Create it.
   All 281 frontend `terraTrace.ts` emitters currently silently fail. Zero-risk addition.

2. **TraceEventDto + TraceIngestionService** — Ring-buffer receiver matching `terraTrace.ts` JSON shape.
   Mirrors existing `AgentTelemetryService` pattern. No EF Core migration needed.

3. **Rate limiting on Consciousness microservice** — Add `AddRateLimiter`/`UseRateLimiter` to
   `TerraFusion.Consciousness/Program.cs` only. Mirrors existing API kernel pattern.

4. **Explicit DB connection pool config** — Add `Maximum Pool Size` to `appsettings.json` and
   `appsettings.Production.json`. Config-only change.

5. **Swarm observability bridge** — Add `_telemetry.Emit(...)` calls at HTTP action entry points
   in `SwarmController.cs` and `AISwarmController.cs` (API layer only, not Consciousness internals).

6. **Phase 35-G integration tests** — `TerraFusion.API.Tests/Phase35G/TraceIngestionContractTests.cs`.

### OUT OF SCOPE (production swarm — DO NOT TOUCH)

```
backend/src/TerraFusion.Consciousness/Services/       ← ALL service implementations
backend/src/TerraFusion.Consciousness/Hubs/           ← ALL SignalR hubs
backend/src/TerraFusion.Consciousness/Interfaces/     ← ALL consciousness interfaces
backend/src/TerraFusion.Consciousness/Extensions/
backend/src/TerraFusion.Consciousness/HealthChecks/
backend/src/TerraFusion.Consciousness/DTOs/
backend/src/TerraFusion.Consciousness/CoPilot/
backend/src/TerraFusion.Data/Migrations/              ← No schema changes
os-platform/ai-systems/ai-systems/ai-swarm/           ← Companion charter only
os-platform/ai-systems/suite/core/
os-platform/ai-systems/supreme-commander/
config/ai-agents/*.json                               ← Agent definitions
backend/src/TerraFusion.Core/Entities/                ← No new entities
```

The only file in `TerraFusion.Consciousness/` that may be touched: `Program.cs` (rate limiter only).

---

## File Map

### New files

| Path | Purpose |
|------|---------|
| `backend/src/TerraFusion.API/Contracts/Trace/TraceEventDto.cs` | Matches `terraTrace.ts` TraceEvent JSON; `CountyId` required |
| `backend/src/TerraFusion.API/Contracts/Trace/TraceIngestionResponse.cs` | `{ Accepted: bool; Seq: long }` |
| `backend/src/TerraFusion.API/Services/Telemetry/ITraceIngestionService.cs` | `Ingest(dto)` + `GetRecent(limit, afterCursor)` |
| `backend/src/TerraFusion.API/Services/Telemetry/TraceIngestionService.cs` | Ring-buffer implementation (1000-event default), same pattern as `AgentTelemetryService` |
| `backend/src/TerraFusion.API/Controllers/TraceController.cs` | `POST /api/trace/events`, `GET /api/trace/events` |
| `backend/TerraFusion.API.Tests/Phase35G/TraceIngestionContractTests.cs` | All 7 proof gates |

### Modified files

| Path | Change |
|------|--------|
| `backend/src/TerraFusion.API/Program.cs` | Add `AddSingleton<ITraceIngestionService, TraceIngestionService>()` |
| `backend/src/TerraFusion.Consciousness/Program.cs` | Add `AddRateLimiter` + `UseRateLimiter` (mirrors API kernel pattern) |
| `backend/src/TerraFusion.API/appsettings.json` | Add `Maximum Pool Size=50` to DefaultConnection; add `Tracing:TraceIngestionBufferCapacity: 1000` |
| `backend/src/TerraFusion.API/appsettings.Production.json` | Add `Maximum Pool Size=100` to DefaultConnection |
| `backend/src/TerraFusion.API/Controllers/SwarmController.cs` | Add `_telemetry.Emit(...)` at action method entry points (not inside loops/agent logic) |
| `backend/src/TerraFusion.API/Controllers/AISwarmController.cs` | Same pattern as SwarmController |

---

## Implementation Phases

### Phase 35-G-1: Trace Ingestion (Priority: BLOCKER)

**Problem:** `POST /api/trace/events` returns 404. 281 frontend emitters fire into void.

**Step G1-1: Create TraceEventDto.cs**

```csharp
namespace TerraFusion.API.Contracts.Trace;

/// <summary>
/// Matches the TraceEvent interface in frontend/apps/os-shell/src/services/terraTrace.ts.
/// CountyId is required — sovereign county isolation invariant (FISMA).
/// </summary>
public sealed record TraceEventDto
{
    public required string Id { get; init; }
    public required string Timestamp { get; init; }
    public required string Action { get; init; }
    public required string EntityType { get; init; }
    public required string EntityId { get; init; }
    public required string Actor { get; init; }

    /// <summary>Required. Sovereign county isolation — reject if null/empty.</summary>
    public required string CountyId { get; init; }

    public List<FieldDiffDto> Diffs { get; init; } = new();
    public Dictionary<string, System.Text.Json.JsonElement>? Meta { get; init; }
}

public sealed record FieldDiffDto(string Field,
    System.Text.Json.JsonElement? Before,
    System.Text.Json.JsonElement? After);

public sealed record TraceIngestionResponse(bool Accepted, long Seq);
```

**Step G1-2: Create ITraceIngestionService.cs**

```csharp
namespace TerraFusion.API.Services.Telemetry;

public interface ITraceIngestionService
{
    /// <summary>
    /// Ingests a trace event. Returns the sequence number (> 0) on success,
    /// or -1 if rejected (e.g., missing CountyId).
    /// </summary>
    long Ingest(TraceEventDto evt);

    TraceEventsPage GetRecent(int limit, string? afterCursor);
}

public sealed record TraceEventsPage(
    IReadOnlyList<TraceEventDto> Events,
    string? NextCursor,
    long TotalIngested);
```

**Step G1-3: Create TraceIngestionService.cs**

Mirror `AgentTelemetryService` ring-buffer pattern exactly:
- Capacity from `IConfiguration["Tracing:TraceIngestionBufferCapacity"]` (default 1000)
- `lock _gate` for thread safety (same pattern)
- Ring buffer: `TraceEventDto[] _buffer` + `int _head` + `long _seq`
- `Ingest`: validate `CountyId` non-empty, write to ring, increment `_seq`; return -1 if invalid
- `GetRecent`: return last N events from ring buffer, cursor = seq-based string

**Step G1-4: Create TraceController.cs**

```csharp
[ApiController]
[Route("api/trace")]
public sealed class TraceController : ControllerBase
{
    private readonly ITraceIngestionService _ingestion;
    private readonly ILogger<TraceController> _logger;

    public TraceController(ITraceIngestionService ingestion, ILogger<TraceController> logger)
    {
        _ingestion = ingestion;
        _logger = logger;
    }

    [HttpPost("events")]
    public ActionResult<TraceIngestionResponse> IngestEvent([FromBody] TraceEventDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CountyId))
            return BadRequest("CountyId is required");

        var seq = _ingestion.Ingest(dto);
        if (seq < 0)
            return BadRequest("Trace event rejected");

        return Ok(new TraceIngestionResponse(Accepted: true, Seq: seq));
    }

    [HttpGet("events")]
    public ActionResult<TraceEventsPage> GetEvents(
        [FromQuery] int limit = 100,
        [FromQuery] string? after = null,
        [FromQuery] string? countyId = null)
    {
        var page = _ingestion.GetRecent(Math.Min(limit, 500), after);

        // County filter when countyId provided (production FISMA gate)
        if (!string.IsNullOrWhiteSpace(countyId))
        {
            var filtered = page.Events
                .Where(e => e.CountyId == countyId)
                .ToList();
            return Ok(page with { Events = filtered });
        }

        return Ok(page);
    }
}
```

**Step G1-5: Register in Program.cs**

```csharp
builder.Services.AddSingleton<ITraceIngestionService, TraceIngestionService>();
```

---

### Phase 35-G-2: Concurrency Guards (Priority: HIGH)

**Problem:** Consciousness microservice has no rate limiting; DB pool defaults to 25.

**Step G2-1: Consciousness rate limiter**

In `backend/src/TerraFusion.Consciousness/Program.cs`, after `builder.Services.AddControllers()`:

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("consciousness-default", limiterOptions =>
    {
        limiterOptions.PermitLimit = builder.Configuration.GetValue("RateLimiting:ConsciousnessPermitLimit", 200);
        limiterOptions.Window = TimeSpan.FromSeconds(1);
        limiterOptions.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 50;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});
```

After `app.UseRouting()`:
```csharp
app.UseRateLimiter();
```

**Step G2-2: DB connection pool config**

`appsettings.json` DefaultConnection: append `Maximum Pool Size=50;`
`appsettings.Production.json` DefaultConnection: append `Maximum Pool Size=100;`
Add config key: `"Tracing": { "TraceIngestionBufferCapacity": 1000 }`

---

### Phase 35-G-3: Swarm Observability (Priority: MEDIUM)

**Problem:** Swarm coordination entry points emit zero observability events.

**Step G3-1: SwarmController.cs — entry-point emits only**

In each HTTP action method in `SwarmController.cs`, inject `IAgentTelemetryService` (already registered singleton) and emit one call at the entry point:

```csharp
_telemetry.Emit(
    level: "Info",
    agent: "swarm-controller",
    topic: "swarm.task.dispatch",
    message: $"action={nameof(ActionName)} county={request.CountyId ?? "unknown"}",
    correlationId: HttpContext.TraceIdentifier
);
```

**Do NOT emit** inside loops, inside forwarding to Consciousness, or inside agent coordination code.

**Step G3-2: AISwarmController.cs — same pattern**

Same single entry-point emit per action method. Same `correlationId: HttpContext.TraceIdentifier` wire.

---

## Proof Gates

- [ ] **Gate 1:** `dotnet test --filter "Phase35G"` → all tests pass, 0 failures
- [ ] **Gate 2:** `POST /api/trace/events` with valid body → 200 + `{ accepted: true, seq: N > 0 }`
- [ ] **Gate 3:** `POST /api/trace/events` with missing `countyId` → 400 (county isolation)
- [ ] **Gate 4:** `GET /api/trace/events?limit=3` after 5 events → 3 events + `nextCursor`; fetch with cursor → 2 more events, no overlap
- [ ] **Gate 5:** Static test: `Consciousness/Program.cs` contains `AddRateLimiter` + `UseRateLimiter`
- [ ] **Gate 6:** `grep "Maximum Pool Size" appsettings.json` → exits 0
- [ ] **Gate 7 (regression):** `dotnet test TerraFusion.API.Tests` → same pass count, 0 new failures

---

## Security Gates

- **SG-1:** `TraceIngestionService.Ingest()` rejects `CountyId` null/empty → returns -1, logs warning
- **SG-2:** No PII in log format strings in `TraceController.cs` or `TraceIngestionService.cs`
- **SG-3:** `POST /api/trace/events` covered by existing rate limiter in `TerraFusion.API/Program.cs`
- **SG-4:** `GET /api/trace/events?countyId=X` filters to county X only (production FISMA)
- **SG-5:** `_logger.LogInformation` uses structured params, not string interpolation; `CorrelationId` propagated from `HttpContext.TraceIdentifier`

---

## Excluded Paths (write authority explicitly denied)

Any diff touching these paths invalidates the charter:

```
backend/src/TerraFusion.Consciousness/Services/
backend/src/TerraFusion.Consciousness/Hubs/
backend/src/TerraFusion.Consciousness/Interfaces/
backend/src/TerraFusion.Consciousness/Extensions/
backend/src/TerraFusion.Consciousness/HealthChecks/
backend/src/TerraFusion.Consciousness/DTOs/
backend/src/TerraFusion.Consciousness/CoPilot/
backend/src/TerraFusion.Data/Migrations/
os-platform/ai-systems/ai-systems/ai-swarm/
os-platform/ai-systems/suite/core/
os-platform/ai-systems/supreme-commander/
config/ai-agents/*.json
backend/src/TerraFusion.Core/Entities/
```

Only `TerraFusion.Consciousness/Program.cs` may be touched (rate limiter only).

---

## Deferred Items

| Item | Reason |
|------|--------|
| Persistent EF Core `trace_events` table | Migration risk; ring-buffer is MVP sufficient |
| OTel ActivitySource ↔ TerraTrace correlation ID bridge | Phase 36 per existing `TracingConstants.cs` spec |
| Reader/writer lock in Consciousness scaling | Production service internal; separate concurrency charter |
| `_activeOperations` list cleanup in `AILayerMeshOrchestrator` | Production service internal |
| Sequential L1-L5 pipeline parallelism | Large refactor; separate charter |
| `BulletproofHttpClient.GetCircuitBreakerState()` hardcoded return | Resilience service; separate charter |
| AgentTelemetryService → TerraTrace spine integration | After 35-G-1 trace endpoint exists |

---

## Sequencing

- **35-G-1** (trace ingestion): no dependencies — start immediately
- **35-G-2** (concurrency guards): no dependencies — parallel with 35-G-1
- **35-G-3** (observability bridge): after 35-G-1 confirms `IAgentTelemetryService` is wired
- **Gate 7** (regression): after all three phases complete

---

*Charter Status: PENDING FOUNDER ACCEPTANCE*
*Phase 35-G implementation blocked until founder says go.*
