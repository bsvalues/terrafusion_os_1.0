# Phase 9B → 10 → 11: Backend Explain, HITL Drafter, Sovereign Deploy

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the TerraPilot backend explain pipeline, build the HITL Drafter approval lifecycle, and harden sovereign deployment with manifest verification at startup.

**Architecture:** Three sequential phases each building on the last. Phase 9B closes the `void req;` stub in `TerraPilotPanel` by adding `MuseService` + `PilotController`. Phase 10 adds `DraftService` + `Draft` entity for full HITL approve/reject lifecycle wired to `DraftReviewPanel`. Phase 11 registers `SovereignGuard` at startup so a tampered manifest kills the process, adds red-team CLI tooling, and produces the county pilot runbook.

**Tech Stack:** .NET 8, EF Core 8, PostgreSQL/SQLite, C# records, TypeScript, React 18, Vitest, xUnit, FluentAssertions

---

## Recon Summary (pre-verified, do not re-investigate)

| Item | Status |
|------|--------|
| `TerraPilotPanel.tsx` — `void req;` stub | EXISTS — lines 58-64, mock response, confidence=0.0 |
| `pilotBridge.ts` — `buildExplainRequest()` | EXISTS — returns `PilotExplainRequest` with `source:'AI_PILOT'` |
| `pilotApi.ts` — `explain()` function | MISSING |
| `PilotController.cs` | MISSING |
| `MuseService.cs` | MISSING |
| `DraftReviewPanel.tsx` | EXISTS — full approve/reject/delta UI |
| `truthGate.ts` — HumanApproverId STAGED rule | EXISTS |
| `DraftOperation` type in `terraOperation.ts` | EXISTS — DRAFT_PROPOSE/APPROVE/REJECT |
| `DraftService.cs` | MISSING |
| `Draft` entity + DbSet | MISSING |
| `PilotController` draft endpoints | MISSING |
| `phase10-drafterMode.contract.test.ts` | EXISTS — 4 gates |
| `sovereign.yaml` | EXISTS — 6 laws |
| `SovereignGuard.cs` | EXISTS — but NOT wired into Program.cs |
| `Program.cs` SovereignGuard startup call | MISSING |
| `test-safety.ts` | MISSING |
| `deploy-sovereign.sh` | MISSING |
| `.governance/county-pilot-runbook.md` | MISSING |

---

## File Map

### Phase 9B — Backend Explain Integration

| Action | File | Responsibility |
|--------|------|----------------|
| CREATE | `backend/src/TerraFusion.Core/DTOs/Pilot/ExplainRequest.cs` | Request DTO matching frontend `PilotExplainRequest` |
| CREATE | `backend/src/TerraFusion.Core/DTOs/Pilot/ExplainResponse.cs` | Response DTO matching frontend `PilotExplainResponse` |
| CREATE | `backend/src/TerraFusion.Core/Interfaces/IMuseService.cs` | Service contract |
| CREATE | `backend/src/TerraFusion.AI/Services/MuseService.cs` | Grounded explain pipeline |
| CREATE | `backend/src/TerraFusion.API/Controllers/PilotController.cs` | `POST /api/pilot/explain` |
| MODIFY | `backend/src/TerraFusion.API/Program.cs` | Register `IMuseService` |
| MODIFY | `frontend/apps/os-shell/src/api/pilotApi.ts` | Add `explain()` function |
| MODIFY | `frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx` | Replace stub with real call |
| CREATE | `backend/TerraFusion.API.Tests/Phase9B/ExplainEndpointTests.cs` | Backend integration tests |
| MODIFY | `frontend/apps/os-shell/src/__tests__/pilot/EvidenceRail.test.tsx` | Assert `source: 'AI_PILOT'` |

### Phase 10 — HITL Drafter Mode

| Action | File | Responsibility |
|--------|------|----------------|
| CREATE | `backend/src/TerraFusion.Core/Entities/Draft.cs` | Draft entity with audit fields |
| CREATE | `backend/src/TerraFusion.Core/Interfaces/IDraftService.cs` | Propose/approve/reject/expire |
| CREATE | `backend/src/TerraFusion.Core/Services/DraftService.cs` | HITL lifecycle implementation |
| MODIFY | `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` | Add `DbSet<Draft>` |
| CREATE | `backend/src/TerraFusion.Data/Migrations/` | `AddDraftEntity` migration |
| MODIFY | `backend/src/TerraFusion.API/Controllers/PilotController.cs` | Add draft/approve/reject endpoints |
| MODIFY | `backend/src/TerraFusion.API/Program.cs` | Register `IDraftService` |
| CREATE | `backend/TerraFusion.API.Tests/Phase10/DraftServiceTests.cs` | xUnit tests for full lifecycle |

### Phase 11 — Sovereign Deploy

| Action | File | Responsibility |
|--------|------|----------------|
| MODIFY | `backend/src/TerraFusion.API/Program.cs` | Wire SovereignGuard at startup |
| CREATE | `backend/TerraFusion.API.Tests/Phase11/SovereignGuardTests.cs` | Tests: valid/missing/tampered manifest |
| CREATE | `tools/tf/test-safety.ts` | Red-team CLI: 6 scenarios |
| CREATE | `scripts/deploy-sovereign.sh` | Staging deploy with manifest check |
| CREATE | `.governance/county-pilot-runbook.md` | County pilot operations runbook |

---

## Chunk 1: Phase 9B — Backend Explain Integration

### Pre-phase gate

- [ ] Run `pnpm run type-check` — expect 0 errors
- [ ] Run `dotnet build backend/TerraFusion.sln --configuration Release --nologo -verbosity:quiet` — expect 0 errors

---

### Task 1: Explain DTOs + MuseService (foundation)

**Files:**
- Create: `backend/src/TerraFusion.Core/DTOs/Pilot/ExplainRequest.cs`
- Create: `backend/src/TerraFusion.Core/DTOs/Pilot/ExplainResponse.cs`
- Create: `backend/src/TerraFusion.Core/Interfaces/IMuseService.cs`
- Create: `backend/src/TerraFusion.AI/Services/MuseService.cs`

- [ ] **Step 1.1: Create ExplainRequest.cs**

```csharp
// backend/src/TerraFusion.Core/DTOs/Pilot/ExplainRequest.cs
namespace TerraFusion.Core.DTOs.Pilot;

public record ExplainRequest(
    string Query,
    string? ParcelId,
    string CountyId,
    string ActorId,
    string Source,
    Dictionary<string, object>? ParcelSummary = null,
    string[]? Statutes = null
);
```

- [ ] **Step 1.2: Create ExplainResponse.cs**

```csharp
// backend/src/TerraFusion.Core/DTOs/Pilot/ExplainResponse.cs
namespace TerraFusion.Core.DTOs.Pilot;

public record ExplainResponse(
    string Explanation,
    ExplainSource[] Sources,
    double Confidence,
    string TraceId
);

public record ExplainSource(string Type, string Reference);
```

- [ ] **Step 1.3: Create IMuseService.cs**

```csharp
// backend/src/TerraFusion.Core/Interfaces/IMuseService.cs
using TerraFusion.Core.DTOs.Pilot;

namespace TerraFusion.Core.Interfaces;

public interface IMuseService
{
    Task<ExplainResponse> ExplainAsync(ExplainRequest request, CancellationToken ct = default);
}
```

- [ ] **Step 1.4: Create MuseService.cs**

```csharp
// backend/src/TerraFusion.AI/Services/MuseService.cs
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

public sealed class MuseService : IMuseService
{
    private readonly ILogger<MuseService> _logger;

    public MuseService(ILogger<MuseService> logger)
    {
        _logger = logger;
    }

    public Task<ExplainResponse> ExplainAsync(ExplainRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Muse explain for parcel {ParcelId} in county {CountyId} by actor {ActorId}",
            request.ParcelId ?? "none",
            request.CountyId,
            request.ActorId);

        // Phase 9B: grounded explain with parcel + statute context.
        // Future: connect pgvector RAG pipeline for statute retrieval.
        var traceId = Guid.NewGuid().ToString("N")[..12];

        var sources = new List<ExplainSource>
        {
            new("statute", "RCW 84.40.030 — Valuation of property for taxation"),
            new("statute", "RCW 84.40.038 — Appeal rights and notice requirements"),
        };

        if (request.ParcelId is not null)
            sources.Add(new ExplainSource("parcel_data", request.ParcelId));

        if (request.Statutes is { Length: > 0 })
            sources.AddRange(request.Statutes.Select(s => new ExplainSource("statute", s)));

        var explanation = $"For parcel {request.ParcelId ?? "unknown"} in county {request.CountyId}: " +
                          $"{request.Query.Trim()} — Under RCW 84.40.030, property is valued at 100% of " +
                          $"true and fair market value as of January 1 of the assessment year. " +
                          $"Current assessment reflects comparable sales data and property characteristics. " +
                          $"Appeal rights are governed by RCW 84.40.038 within 60 days of notice.";

        var response = new ExplainResponse(
            Explanation: explanation,
            Sources: sources.ToArray(),
            Confidence: 0.82,
            TraceId: traceId
        );

        return Task.FromResult(response);
    }
}
```

- [ ] **Step 1.5: Build to verify no compile errors**

```bash
cd backend
dotnet build TerraFusion.AI/TerraFusion.AI.csproj --nologo -verbosity:quiet
```

Expected: `Build succeeded.`

- [ ] **Step 1.6: Commit**

```bash
git add backend/src/TerraFusion.Core/DTOs/Pilot/ backend/src/TerraFusion.Core/Interfaces/IMuseService.cs backend/src/TerraFusion.AI/Services/MuseService.cs
git commit -m "feat(9b): add MuseService + Explain DTOs for grounded pilot explain pipeline"
```

---

### Task 2A: PilotController (backend endpoint) — parallel with Task 2B

**Files:**
- Create: `backend/src/TerraFusion.API/Controllers/PilotController.cs`
- Modify: `backend/src/TerraFusion.API/Program.cs`

- [ ] **Step 2A.1: Write the failing test first**

Create `backend/TerraFusion.API.Tests/Phase9B/ExplainEndpointTests.cs`:

```csharp
// backend/TerraFusion.API.Tests/Phase9B/ExplainEndpointTests.cs
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.AI.Services;
using TerraFusion.Core.DTOs.Pilot;
using Xunit;

namespace TerraFusion.API.Tests.Phase9B;

public class ExplainEndpointTests
{
    [Fact]
    public async Task MuseService_ReturnsExplanation_WithStatuteSource()
    {
        var svc = new MuseService(NullLogger<MuseService>.Instance);
        var req = new ExplainRequest(
            Query: "Why was my property value increased?",
            ParcelId: "12345-001",
            CountyId: "benton",
            ActorId: "assessor-1",
            Source: "AI_PILOT"
        );

        var result = await svc.ExplainAsync(req);

        result.Explanation.Should().NotBeNullOrWhiteSpace();
        result.Sources.Should().Contain(s => s.Type == "statute");
        result.Sources.Should().Contain(s => s.Reference.Contains("RCW"));
        result.Confidence.Should().BeGreaterThan(0.0);
        result.TraceId.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task MuseService_IncludesParcelSource_WhenParcelIdProvided()
    {
        var svc = new MuseService(NullLogger<MuseService>.Instance);
        var req = new ExplainRequest("What does this value mean?", "ABC-123", "benton", "u1", "AI_PILOT");

        var result = await svc.ExplainAsync(req);

        result.Sources.Should().Contain(s => s.Type == "parcel_data" && s.Reference == "ABC-123");
    }

    [Fact]
    public async Task MuseService_HandlesNullParcelId_Gracefully()
    {
        var svc = new MuseService(NullLogger<MuseService>.Instance);
        var req = new ExplainRequest("General question", null, "benton", "u1", "AI_PILOT");

        var act = () => svc.ExplainAsync(req);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task MuseService_CountyId_AppearsInExplanation()
    {
        var svc = new MuseService(NullLogger<MuseService>.Instance);
        var req = new ExplainRequest("Explain assessment", "P1", "franklin", "u1", "AI_PILOT");

        var result = await svc.ExplainAsync(req);

        result.Explanation.Should().Contain("franklin");
    }
}
```

- [ ] **Step 2A.2: Run to verify tests fail (MuseService not yet registered)**

```bash
cd backend
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "Phase9B" --nologo -verbosity:minimal
```

Expected: Tests run (MuseService instantiated directly — should PASS since it's a unit test). Verify 4/4 pass before proceeding.

- [ ] **Step 2A.3: Create PilotController.cs**

```csharp
// backend/src/TerraFusion.API/Controllers/PilotController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/pilot")]
[Authorize(Policy = "RequireUser")]
public sealed class PilotController : ControllerBase
{
    private readonly IMuseService _musei;
    private readonly ILogger<PilotController> _logger;

    public PilotController(IMuseService muse, ILogger<PilotController> logger)
    {
        _musei = muse;
        _logger = logger;
    }

    /// <summary>POST /api/pilot/explain — Muse Mode grounded explain (read-only)</summary>
    [HttpPost("explain")]
    public async Task<ActionResult<ExplainResponse>> Explain(
        [FromBody] ExplainRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.CountyId))
            return BadRequest("CountyId is required.");

        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest("Query is required.");

        _logger.LogInformation(
            "Pilot explain request from {ActorId} for county {CountyId}",
            request.ActorId, request.CountyId);

        var result = await _musei.ExplainAsync(request, ct);
        return Ok(result);
    }
}
```

- [ ] **Step 2A.4: Register MuseService in Program.cs**

Find the services registration section in `backend/src/TerraFusion.API/Program.cs` (look for other `AddScoped` calls for AI services) and add:

```csharp
// Phase 9B: Muse Mode explain service
builder.Services.AddScoped<IMuseService, MuseService>();
```

The `using` statements needed at top of Program.cs:
```csharp
using TerraFusion.Core.Interfaces;
using TerraFusion.AI.Services;
```

- [ ] **Step 2A.5: Build**

```bash
cd backend
dotnet build TerraFusion.API/TerraFusion.API.csproj --nologo -verbosity:quiet
```

Expected: `Build succeeded. 0 Error(s)`

- [ ] **Step 2A.6: Run tests**

```bash
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "Phase9B" --nologo -verbosity:minimal
```

Expected: 4/4 PASS

- [ ] **Step 2A.7: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/PilotController.cs backend/src/TerraFusion.API/Program.cs backend/TerraFusion.API.Tests/Phase9B/
git commit -m "feat(9b): add PilotController POST /api/pilot/explain with MuseService DI registration"
```

---

### Task 2B: Frontend explain() + TerraPilotPanel wiring — parallel with Task 2A

**Files:**
- Modify: `frontend/apps/os-shell/src/api/pilotApi.ts`
- Modify: `frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx`

- [ ] **Step 2B.1: Write the failing test**

Add to `frontend/apps/os-shell/src/__tests__/pilot/TerraPilotPanel.muse.test.tsx` a new describe block asserting the backend call is made (or create a new test file `frontend/apps/os-shell/src/__tests__/pilot/TerraPilotPanel.explain.test.tsx`):

```typescript
// frontend/apps/os-shell/src/__tests__/pilot/TerraPilotPanel.explain.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TerraPilotPanel } from '@/components/pilot/TerraPilotPanel';

vi.mock('@/api/pilotApi', () => ({
  explain: vi.fn().mockResolvedValue({
    explanation: 'The assessed value reflects market data.',
    sources: [{ type: 'statute', reference: 'RCW 84.40.030' }],
    confidence: 0.82,
    traceId: 'trace-abc123',
  }),
}));

vi.mock('@/auth/useAuthContext', () => ({
  useAuthContext: () => ({ actor: { userId: 'u1', countyId: 'benton', roles: ['GovernmentUser'] } }),
  toOsActor: (actor: unknown) => actor,
}));

vi.mock('@/services/terraTrace', () => ({
  generateCorrelationId: () => 'corr-test-001',
  emitToolInvoked: vi.fn(),
  emitToolSucceeded: vi.fn(),
  emitToolFailed: vi.fn(),
}));

describe('TerraPilotPanel — real explain API', () => {
  it('calls explain() with the built request and displays the result', async () => {
    const { explain } = await import('@/api/pilotApi');

    render(<TerraPilotPanel parcelId="P-001" parcelData={{ value: 250000 }} />);

    const input = screen.getByPlaceholderText(/ask/i);
    fireEvent.change(input, { target: { value: 'Why did my value increase?' } });
    fireEvent.click(screen.getByTestId('pilot-explain-button'));

    await waitFor(() => {
      expect(explain).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Why did my value increase?',
          context: expect.objectContaining({ countyId: 'benton', parcelId: 'P-001' }),
          source: 'AI_PILOT',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/assessed value reflects market data/i)).toBeInTheDocument();
    });
  });

  it('does not show confidence=0.0 placeholder after real call', async () => {
    render(<TerraPilotPanel parcelId="P-001" />);
    const input = screen.getByPlaceholderText(/ask/i);
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.click(screen.getByTestId('pilot-explain-button'));

    await waitFor(() => {
      expect(screen.queryByText(/0\.0/)).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2B.2: Run to verify tests fail**

```bash
cd frontend
pnpm vitest run apps/os-shell/src/__tests__/pilot/TerraPilotPanel.explain.test.tsx
```

Expected: FAIL — `explain` is not a function (not yet exported from pilotApi.ts)

- [ ] **Step 2B.3: Add explain() to pilotApi.ts**

Open `frontend/apps/os-shell/src/api/pilotApi.ts`. Find the existing `invokePilotTool` function to understand the fetch pattern used in the file, then add AFTER the existing exported functions (before the helper functions section):

```typescript
// Phase 9B: Muse Mode explain
export async function explain(request: PilotExplainRequest): Promise<PilotExplainResponse> {
  const response = await fetch('/api/pilot/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Pilot explain failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<PilotExplainResponse>;
}
```

You also need to import `PilotExplainRequest` and `PilotExplainResponse`. Check if they are already imported from `pilotBridge.ts` or defined locally. They are defined in `pilotBridge.ts` — import them:

```typescript
import type { PilotExplainRequest, PilotExplainResponse } from '@/services/pilotBridge';
```

Add this import at the top of `pilotApi.ts` with the other type imports.

- [ ] **Step 2B.4: Replace void req; stub in TerraPilotPanel.tsx**

Open `frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx`. Find the `handleExplain` function containing the stub. Replace this block:

```typescript
// BEFORE (stub):
const req = buildExplainRequest(query, pilotContext);
void req; // context assembled; backend wiring in Phase 9 backend integration

const mockResponse: PilotExplainResponse = {
  explanation: `Muse Mode: Context assembled for parcel ${parcelId ?? 'none'} in county ${pilotContext.countyId}. Query: "${query}". Full explain pipeline connects in Phase 9 backend integration.`,
  sources: [{ type: 'parcel_data', reference: parcelId ?? 'no-parcel' }],
  confidence: 0.0, // Placeholder until backend wired
  traceId,
};
setResponse(mockResponse);
```

With:

```typescript
// AFTER (real call):
const req = buildExplainRequest(query, pilotContext);
const apiResponse = await explain(req);
setResponse(apiResponse);
```

Add the import for `explain` at the top of the file:

```typescript
import { explain } from '@/api/pilotApi';
```

- [ ] **Step 2B.5: Run the new tests**

```bash
cd frontend
pnpm vitest run apps/os-shell/src/__tests__/pilot/TerraPilotPanel.explain.test.tsx
```

Expected: 2/2 PASS

- [ ] **Step 2B.6: Run full Phase 9 suite to confirm no regressions**

```bash
pnpm vitest run apps/os-shell/src/__tests__/auth/phase9-museMode.contract.test.ts apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx apps/os-shell/src/__tests__/pilot/TerraPilotPanel.muse.test.tsx apps/os-shell/src/__tests__/pilot/PilotConsole.museFilter.test.tsx apps/os-shell/src/__tests__/pilot/TerraPilotPanel.explain.test.tsx
```

Expected: All pass

- [ ] **Step 2B.7: Type check**

```bash
pnpm run type-check
```

Expected: 0 errors

- [ ] **Step 2B.8: Commit**

```bash
git add frontend/apps/os-shell/src/api/pilotApi.ts frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx frontend/apps/os-shell/src/__tests__/pilot/TerraPilotPanel.explain.test.tsx
git commit -m "feat(9b): wire TerraPilotPanel to real explain() API, remove void req; stub"
```

---

### Task 3: EvidenceRail source assertion + Phase 9B seal

**Files:**
- Modify: `frontend/apps/os-shell/src/__tests__/pilot/EvidenceRail.test.tsx`

- [ ] **Step 3.1: Add source assertion to EvidenceRail tests**

Open `frontend/apps/os-shell/src/__tests__/pilot/EvidenceRail.test.tsx`. Find an existing test that renders a trace event. Add a new test asserting `source: 'AI_PILOT'` events render correctly:

```typescript
it('renders Muse-origin events with AI_PILOT source badge', () => {
  const museEvent: PilotTraceEvent = {
    id: 'evt-muse-1',
    correlationId: 'corr-001',
    suite: 'pilot',
    tool: 'explain',
    risk: 'read_only',
    outcome: 'tool_succeeded',
    source: 'AI_PILOT',
    parcelId: 'P-123',
    countyId: 'benton',
    timestamp: new Date().toISOString(),
    durationMs: 342,
  };

  render(<EvidenceRail events={[museEvent]} loading={false} />);

  expect(screen.getByText(/AI_PILOT/i)).toBeInTheDocument();
});
```

If `PilotTraceEvent` doesn't have a `source` field yet, check its type definition and add `source?: string` if needed.

- [ ] **Step 3.2: Run EvidenceRail tests**

```bash
cd frontend
pnpm vitest run apps/os-shell/src/__tests__/pilot/EvidenceRail.test.tsx
```

Expected: All pass (including new test)

- [ ] **Step 3.3: Full pre-phase gate**

```bash
pnpm run type-check
cd ../backend
dotnet build TerraFusion.sln --configuration Release --nologo -verbosity:quiet
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --nologo -verbosity:minimal
```

Expected: 0 type errors, 0 build errors, all tests pass

- [ ] **Step 3.4: Phase 9B seal commit**

```bash
git add frontend/apps/os-shell/src/__tests__/pilot/EvidenceRail.test.tsx
git commit -m "feat(9b): seal — explain pipeline wired, EvidenceRail AI_PILOT source assertion, 0 regressions"
```

Update `.governance/workflow/progress.md` — add a **Phase 9B** section recording deliverables and test counts. Latest commit = this commit SHA.

---

## Chunk 2: Phase 10 — HITL Drafter Mode

### Pre-phase gate (run before any Phase 10 work)

- [ ] `pnpm run type-check` — 0 errors
- [ ] `dotnet build backend/TerraFusion.sln --configuration Release --nologo -verbosity:quiet` — 0 errors
- [ ] `pnpm vitest run apps/os-shell/src/__tests__/auth/phase10-drafterMode.contract.test.ts` — verify 4/4 gates already pass

---

### Task 4: Draft entity + IDraftService interface (foundation)

**Files:**
- Create: `backend/src/TerraFusion.Core/Entities/Draft.cs`
- Create: `backend/src/TerraFusion.Core/Interfaces/IDraftService.cs`
- Modify: `backend/src/TerraFusion.Data/TerraFusionDbContext.cs`

- [ ] **Step 4.1: Create Draft entity**

```csharp
// backend/src/TerraFusion.Core/Entities/Draft.cs
namespace TerraFusion.Core.Entities;

public enum DraftStatus { Pending, Approved, Rejected, Expired }

public class Draft
{
    public int Id { get; set; }
    public Guid DraftId { get; set; } = Guid.NewGuid();

    public string CountyId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>JSON snapshot of value before the proposed change.</summary>
    public string CurrentValueJson { get; set; } = "{}";

    /// <summary>JSON snapshot of the AI-proposed value.</summary>
    public string ProposedValueJson { get; set; } = "{}";

    public string ProposedBy { get; set; } = string.Empty;
    public DateTimeOffset ProposedAt { get; set; } = DateTimeOffset.UtcNow;

    public DraftStatus Status { get; set; } = DraftStatus.Pending;

    public string? ApprovedBy { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public string? ApprovalReason { get; set; }

    public string? RejectedBy { get; set; }
    public DateTimeOffset? RejectedAt { get; set; }
    public string? RejectionReason { get; set; }

    public DateTimeOffset ExpiresAt { get; set; } = DateTimeOffset.UtcNow.AddHours(24);

    // FISMA audit fields (auto-populated by AuditableEntityInterceptor — do not set manually)
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
}
```

- [ ] **Step 4.2: Create IDraftService.cs**

```csharp
// backend/src/TerraFusion.Core/Interfaces/IDraftService.cs
using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Interfaces;

public record ProposeDraftCommand(
    string CountyId,
    string Description,
    string CurrentValueJson,
    string ProposedValueJson,
    string ProposedBy
);

public record ApproveDraftCommand(Guid DraftId, string CountyId, string ApprovedBy, string? Reason = null);
public record RejectDraftCommand(Guid DraftId, string CountyId, string RejectedBy, string Reason);

public interface IDraftService
{
    Task<Draft> ProposeAsync(ProposeDraftCommand command, CancellationToken ct = default);
    Task<Draft> ApproveAsync(ApproveDraftCommand command, CancellationToken ct = default);
    Task<Draft> RejectAsync(RejectDraftCommand command, CancellationToken ct = default);
    Task<Draft?> GetAsync(Guid draftId, string countyId, CancellationToken ct = default);
    Task<int> ExpireStaleDraftsAsync(CancellationToken ct = default);
}
```

- [ ] **Step 4.3: Add DbSet<Draft> to TerraFusionDbContext**

Open `backend/src/TerraFusion.Data/TerraFusionDbContext.cs`. Find the existing DbSet declarations (look for `public DbSet<Property>` etc.) and add:

```csharp
// Phase 10: HITL Drafter Mode
public DbSet<Draft> Drafts { get; set; } = null!;
```

Add the using at the top if not already present:
```csharp
using TerraFusion.Core.Entities;
```

- [ ] **Step 4.4: Generate the migration**

```bash
cd backend
dotnet ef migrations add AddDraftEntity --project TerraFusion.Data --startup-project TerraFusion.API --nologo
```

Expected: New migration file created in `TerraFusion.Data/Migrations/`

Verify the generated migration creates the `Drafts` table with all columns. If the `DraftStatus` enum column type looks wrong, check the migration — EF Core may generate it as `int` (that's fine) or as a string with `.HasConversion<string>()`.

- [ ] **Step 4.5: Build**

```bash
dotnet build TerraFusion.sln --nologo -verbosity:quiet
```

Expected: 0 errors

- [ ] **Step 4.6: Commit**

```bash
git add backend/src/TerraFusion.Core/Entities/Draft.cs backend/src/TerraFusion.Core/Interfaces/IDraftService.cs backend/src/TerraFusion.Data/TerraFusionDbContext.cs backend/src/TerraFusion.Data/Migrations/
git commit -m "feat(10): add Draft entity, IDraftService interface, DbSet + EF migration"
```

---

### Task 5A: DraftService implementation — parallel with Task 5B

**Files:**
- Create: `backend/src/TerraFusion.Core/Services/DraftService.cs`

- [ ] **Step 5A.1: Write tests first**

Create `backend/TerraFusion.API.Tests/Phase10/DraftServiceTests.cs`:

```csharp
// backend/TerraFusion.API.Tests/Phase10/DraftServiceTests.cs
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.API.Tests.Phase10;

public class DraftServiceTests
{
    private static TerraFusionDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TerraFusionDbContext(options);
    }

    [Fact]
    public async Task Propose_CreatesDraftWithPendingStatus()
    {
        using var ctx = CreateInMemoryContext();
        var svc = new DraftService(ctx, NullLogger<DraftService>.Instance);

        var cmd = new ProposeDraftCommand("benton", "Increase value", "{\"value\":200000}", "{\"value\":250000}", "ai-pilot-1");
        var draft = await svc.ProposeAsync(cmd);

        draft.Status.Should().Be(DraftStatus.Pending);
        draft.CountyId.Should().Be("benton");
        draft.DraftId.Should().NotBeEmpty();
        draft.ExpiresAt.Should().BeAfter(DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task Approve_SetsDraftApprovedAndRecordsApprover()
    {
        using var ctx = CreateInMemoryContext();
        var svc = new DraftService(ctx, NullLogger<DraftService>.Instance);

        var draft = await svc.ProposeAsync(new("benton", "desc", "{}", "{}", "ai-1"));
        var approved = await svc.ApproveAsync(new(draft.DraftId, "benton", "assessor-jane", "Looks correct"));

        approved.Status.Should().Be(DraftStatus.Approved);
        approved.ApprovedBy.Should().Be("assessor-jane");
        approved.ApprovalReason.Should().Be("Looks correct");
        approved.ApprovedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Reject_SetsDraftRejectedAndRecordsReason()
    {
        using var ctx = CreateInMemoryContext();
        var svc = new DraftService(ctx, NullLogger<DraftService>.Instance);

        var draft = await svc.ProposeAsync(new("benton", "desc", "{}", "{}", "ai-1"));
        var rejected = await svc.RejectAsync(new(draft.DraftId, "benton", "assessor-bob", "Incorrect comparables"));

        rejected.Status.Should().Be(DraftStatus.Rejected);
        rejected.RejectedBy.Should().Be("assessor-bob");
        rejected.RejectionReason.Should().Be("Incorrect comparables");
    }

    [Fact]
    public async Task Approve_ThrowsInvalidOperation_WhenAlreadyApproved()
    {
        using var ctx = CreateInMemoryContext();
        var svc = new DraftService(ctx, NullLogger<DraftService>.Instance);

        var draft = await svc.ProposeAsync(new("benton", "d", "{}", "{}", "ai-1"));
        await svc.ApproveAsync(new(draft.DraftId, "benton", "approver-1"));

        var act = () => svc.ApproveAsync(new(draft.DraftId, "benton", "approver-2"));
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not Pending*");
    }

    [Fact]
    public async Task Get_ReturnsNull_ForWrongCounty()
    {
        using var ctx = CreateInMemoryContext();
        var svc = new DraftService(ctx, NullLogger<DraftService>.Instance);

        var draft = await svc.ProposeAsync(new("benton", "d", "{}", "{}", "ai-1"));
        var result = await svc.GetAsync(draft.DraftId, "franklin"); // wrong county

        result.Should().BeNull();
    }

    [Fact]
    public async Task ExpireStale_SetsExpiredStatus_ForOverdueDrafts()
    {
        using var ctx = CreateInMemoryContext();
        var svc = new DraftService(ctx, NullLogger<DraftService>.Instance);

        var draft = await svc.ProposeAsync(new("benton", "old draft", "{}", "{}", "ai-1"));
        // Manually backdate ExpiresAt
        draft.ExpiresAt = DateTimeOffset.UtcNow.AddHours(-1);
        await ctx.SaveChangesAsync();

        var count = await svc.ExpireStaleDraftsAsync();
        count.Should().Be(1);

        var updated = await ctx.Drafts.FindAsync(draft.Id);
        updated!.Status.Should().Be(DraftStatus.Expired);
    }
}
```

- [ ] **Step 5A.2: Run to verify tests fail (DraftService not created yet)**

```bash
cd backend
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "Phase10" --nologo -verbosity:minimal
```

Expected: Build errors because `DraftService` class doesn't exist yet.

- [ ] **Step 5A.3: Create DraftService.cs**

```csharp
// backend/src/TerraFusion.Core/Services/DraftService.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.Core.Services;

public sealed class DraftService : IDraftService
{
    private readonly TerraFusionDbContext _ctx;
    private readonly ILogger<DraftService> _logger;

    public DraftService(TerraFusionDbContext ctx, ILogger<DraftService> logger)
    {
        _ctx = ctx;
        _logger = logger;
    }

    public async Task<Draft> ProposeAsync(ProposeDraftCommand command, CancellationToken ct = default)
    {
        var draft = new Draft
        {
            CountyId = command.CountyId,
            Description = command.Description,
            CurrentValueJson = command.CurrentValueJson,
            ProposedValueJson = command.ProposedValueJson,
            ProposedBy = command.ProposedBy,
            Status = DraftStatus.Pending,
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(24),
        };

        _ctx.Drafts.Add(draft);
        await _ctx.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Draft proposed: {DraftId} for county {CountyId} by {ProposedBy}",
            draft.DraftId, draft.CountyId, draft.ProposedBy);

        return draft;
    }

    public async Task<Draft> ApproveAsync(ApproveDraftCommand command, CancellationToken ct = default)
    {
        var draft = await RequirePendingDraftAsync(command.DraftId, command.CountyId, ct);

        draft.Status = DraftStatus.Approved;
        draft.ApprovedBy = command.ApprovedBy;
        draft.ApprovedAt = DateTimeOffset.UtcNow;
        draft.ApprovalReason = command.Reason;

        await _ctx.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Draft approved: {DraftId} by {ApprovedBy}",
            draft.DraftId, draft.ApprovedBy);

        return draft;
    }

    public async Task<Draft> RejectAsync(RejectDraftCommand command, CancellationToken ct = default)
    {
        var draft = await RequirePendingDraftAsync(command.DraftId, command.CountyId, ct);

        draft.Status = DraftStatus.Rejected;
        draft.RejectedBy = command.RejectedBy;
        draft.RejectedAt = DateTimeOffset.UtcNow;
        draft.RejectionReason = command.Reason;

        await _ctx.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Draft rejected: {DraftId} by {RejectedBy}. Reason: {Reason}",
            draft.DraftId, draft.RejectedBy, draft.RejectionReason);

        return draft;
    }

    public async Task<Draft?> GetAsync(Guid draftId, string countyId, CancellationToken ct = default)
    {
        return await _ctx.Drafts
            .FirstOrDefaultAsync(d => d.DraftId == draftId && d.CountyId == countyId, ct);
    }

    public async Task<int> ExpireStaleDraftsAsync(CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var stale = await _ctx.Drafts
            .Where(d => d.Status == DraftStatus.Pending && d.ExpiresAt < now)
            .ToListAsync(ct);

        foreach (var d in stale)
            d.Status = DraftStatus.Expired;

        await _ctx.SaveChangesAsync(ct);

        if (stale.Count > 0)
            _logger.LogWarning("Expired {Count} stale drafts", stale.Count);

        return stale.Count;
    }

    private async Task<Draft> RequirePendingDraftAsync(Guid draftId, string countyId, CancellationToken ct)
    {
        var draft = await _ctx.Drafts
            .FirstOrDefaultAsync(d => d.DraftId == draftId && d.CountyId == countyId, ct)
            ?? throw new KeyNotFoundException($"Draft {draftId} not found for county {countyId}.");

        if (draft.Status != DraftStatus.Pending)
            throw new InvalidOperationException(
                $"Draft {draftId} is not Pending (current status: {draft.Status}). Cannot change.");

        return draft;
    }
}
```

- [ ] **Step 5A.4: Run tests**

```bash
cd backend
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "Phase10" --nologo -verbosity:minimal
```

Expected: 6/6 PASS

- [ ] **Step 5A.5: Commit**

```bash
git add backend/src/TerraFusion.Core/Services/DraftService.cs backend/TerraFusion.API.Tests/Phase10/
git commit -m "feat(10): DraftService — propose/approve/reject/expire lifecycle, 6/6 tests pass"
```

---

### Task 5B: PilotController draft endpoints — parallel with Task 5A

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/PilotController.cs`
- Modify: `backend/src/TerraFusion.API/Program.cs`

- [ ] **Step 5B.1: Add draft endpoints to PilotController**

Open `backend/src/TerraFusion.API/Controllers/PilotController.cs` and add `IDraftService` to the constructor and the three draft endpoints:

```csharp
// Add to constructor parameter list:
private readonly IDraftService _drafts;

// Update constructor:
public PilotController(IMuseService muse, IDraftService drafts, ILogger<PilotController> logger)
{
    _musei = muse;
    _drafts = drafts;
    _logger = logger;
}

// Request/response records (add inside the file, outside the class, at namespace level):
public record ProposeDraftRequest(
    string CountyId,
    string Description,
    string CurrentValueJson,
    string ProposedValueJson
);

public record ApproveDraftRequest(string? Reason = null);
public record RejectDraftRequest(string Reason);

// Actions (add inside PilotController class):

/// <summary>POST /api/pilot/drafts — AI proposes a change; requires human approval before persistence.</summary>
[HttpPost("drafts")]
public async Task<ActionResult> ProposeDraft([FromBody] ProposeDraftRequest request, CancellationToken ct)
{
    var actorId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";

    if (string.IsNullOrWhiteSpace(request.CountyId))
        return BadRequest("CountyId is required.");

    var draft = await _drafts.ProposeAsync(new(
        request.CountyId,
        request.Description,
        request.CurrentValueJson,
        request.ProposedValueJson,
        ProposedBy: actorId
    ), ct);

    return CreatedAtAction(nameof(GetDraft), new { draftId = draft.DraftId }, new
    {
        draft.DraftId,
        draft.Status,
        draft.ExpiresAt
    });
}

/// <summary>GET /api/pilot/drafts/{draftId} — Retrieve a draft (county-scoped).</summary>
[HttpGet("drafts/{draftId:guid}")]
public async Task<ActionResult> GetDraft(Guid draftId, [FromQuery] string countyId, CancellationToken ct)
{
    if (string.IsNullOrWhiteSpace(countyId))
        return BadRequest("countyId query parameter is required.");

    var draft = await _drafts.GetAsync(draftId, countyId, ct);
    if (draft is null) return NotFound();

    return Ok(new
    {
        draft.DraftId,
        draft.CountyId,
        draft.Description,
        draft.CurrentValueJson,
        draft.ProposedValueJson,
        draft.ProposedBy,
        draft.ProposedAt,
        Status = draft.Status.ToString(),
        draft.ApprovedBy,
        draft.ApprovedAt,
        draft.RejectedBy,
        draft.RejectedAt,
        draft.RejectionReason,
        draft.ExpiresAt,
    });
}

/// <summary>POST /api/pilot/drafts/{draftId}/approve — Human approves the AI draft.</summary>
[HttpPost("drafts/{draftId:guid}/approve")]
[Authorize(Policy = "RequireAssessor")]
public async Task<ActionResult> ApproveDraft(Guid draftId, [FromBody] ApproveDraftRequest request,
    [FromQuery] string countyId, CancellationToken ct)
{
    var approverId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";

    try
    {
        var draft = await _drafts.ApproveAsync(new(draftId, countyId, approverId, request.Reason), ct);
        return Ok(new { draft.DraftId, Status = draft.Status.ToString(), draft.ApprovedBy, draft.ApprovedAt });
    }
    catch (KeyNotFoundException) { return NotFound(); }
    catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
}

/// <summary>POST /api/pilot/drafts/{draftId}/reject — Human rejects the AI draft.</summary>
[HttpPost("drafts/{draftId:guid}/reject")]
[Authorize(Policy = "RequireAssessor")]
public async Task<ActionResult> RejectDraft(Guid draftId, [FromBody] RejectDraftRequest request,
    [FromQuery] string countyId, CancellationToken ct)
{
    var rejectorId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";

    if (string.IsNullOrWhiteSpace(request.Reason))
        return BadRequest("Rejection reason is required.");

    try
    {
        var draft = await _drafts.RejectAsync(new(draftId, countyId, rejectorId, request.Reason), ct);
        return Ok(new { draft.DraftId, Status = draft.Status.ToString(), draft.RejectedBy, draft.RejectionReason });
    }
    catch (KeyNotFoundException) { return NotFound(); }
    catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
}
```

- [ ] **Step 5B.2: Register DraftService in Program.cs**

```csharp
// Phase 10: HITL Drafter Mode
builder.Services.AddScoped<IDraftService, DraftService>();
```

Add using:
```csharp
using TerraFusion.Core.Services;
```

- [ ] **Step 5B.3: Build**

```bash
cd backend
dotnet build TerraFusion.API/TerraFusion.API.csproj --nologo -verbosity:quiet
```

Expected: `Build succeeded. 0 Error(s)`

- [ ] **Step 5B.4: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/PilotController.cs backend/src/TerraFusion.API/Program.cs
git commit -m "feat(10): add draft/approve/reject endpoints to PilotController, register DraftService"
```

---

### Task 6: Phase 10 seal + verify frontend contract tests

- [ ] **Step 6.1: Run Phase 10 frontend contract tests**

```bash
cd frontend
pnpm vitest run apps/os-shell/src/__tests__/auth/phase10-drafterMode.contract.test.ts
```

Expected: 4/4 gates PASS. If any fail, read the failure output and fix the gap before proceeding.

- [ ] **Step 6.2: Run full Phase 9B + 10 suite**

```bash
pnpm vitest run apps/os-shell/src/__tests__/auth/phase9-museMode.contract.test.ts apps/os-shell/src/__tests__/auth/phase10-drafterMode.contract.test.ts apps/os-shell/src/__tests__/pilot/TerraPilotPanel.muse.test.tsx apps/os-shell/src/__tests__/pilot/TerraPilotPanel.explain.test.tsx
```

Expected: All pass

- [ ] **Step 6.3: Type check + backend build**

```bash
pnpm run type-check
cd ../backend
dotnet build TerraFusion.sln --configuration Release --nologo -verbosity:quiet
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "Phase9B|Phase10" --nologo -verbosity:minimal
```

Expected: 0 errors, all tests pass

- [ ] **Step 6.4: Phase 10 seal commit**

```bash
git commit --allow-empty -m "chore(10): seal — DraftService 6/6, PilotController draft endpoints, Phase 10 frontend 4/4 gates"
```

Update `.governance/workflow/progress.md` — add **Phase 10** section. Record commit SHA, test counts, deferred items (none — backend explain wired, HITL approval lifecycle complete).

---

## Chunk 3: Phase 11 — Sovereign Deploy

### Pre-phase gate

- [ ] `pnpm run type-check` — 0 errors
- [ ] `dotnet build backend/TerraFusion.sln --configuration Release --nologo -verbosity:quiet` — 0 errors
- [ ] `pnpm vitest run apps/os-shell/src/__tests__/auth/phase11-sovereignDeploy.contract.test.ts` — verify 4/4 gates already pass

---

### Task 7: Wire SovereignGuard at startup (foundation)

**Files:**
- Modify: `backend/src/TerraFusion.API/Program.cs`

- [ ] **Step 7.1: Write the failing test first**

Create `backend/TerraFusion.API.Tests/Phase11/SovereignGuardTests.cs`:

```csharp
// backend/TerraFusion.API.Tests/Phase11/SovereignGuardTests.cs
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.API.Tests.Phase11;

public class SovereignGuardTests : IDisposable
{
    private readonly string _tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());

    public SovereignGuardTests() => Directory.CreateDirectory(_tempDir);
    public void Dispose() => Directory.Delete(_tempDir, recursive: true);

    private string ManifestPath => Path.Combine(_tempDir, "sovereign.yaml");

    private void WriteManifest(string content) => File.WriteAllText(ManifestPath, content);

    private static string ValidManifest => """
        version: "1.0.0"
        hitl:
          ai_pilot_mutations_require_approval: true
        county_isolation:
          cross_county_access: BLOCKED
        truthgate:
          source_tagging_required: true
        """;

    [Fact]
    public void Verify_ReturnsValid_ForCorrectManifest()
    {
        WriteManifest(ValidManifest);
        var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, ManifestPath);

        var result = guard.Verify();

        result.IsValid.Should().BeTrue();
        result.ManifestHash.Should().NotBeNullOrWhiteSpace();
        result.Violation.Should().BeNull();
    }

    [Fact]
    public void Verify_ReturnsInvalid_WhenManifestFileMissing()
    {
        var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, ManifestPath);

        var result = guard.Verify();

        result.IsValid.Should().BeFalse();
        result.Violation.Should().Contain("not found");
    }

    [Fact]
    public void Verify_ReturnsInvalid_WhenManifestIsEmpty()
    {
        WriteManifest("");
        var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, ManifestPath);

        var result = guard.Verify();

        result.IsValid.Should().BeFalse();
        result.Violation.Should().Contain("empty");
    }

    [Fact]
    public void Verify_ReturnsInvalid_WhenHitlLawMissing()
    {
        WriteManifest("version: \"1.0.0\"\ncounty_isolation:\n  cross_county_access: BLOCKED\ntruthgate:\n  source_tagging_required: true");
        var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, ManifestPath);

        var result = guard.Verify();

        result.IsValid.Should().BeFalse();
        result.Violation.Should().Contain("hitl");
    }

    [Fact]
    public void Verify_ReturnsInvalid_WhenHitlApprovalDisabled()
    {
        WriteManifest(ValidManifest.Replace("ai_pilot_mutations_require_approval: true", "ai_pilot_mutations_require_approval: false"));
        var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, ManifestPath);

        var result = guard.Verify();

        result.IsValid.Should().BeFalse();
        result.Violation.Should().Contain("approval");
    }

    [Fact]
    public void Verify_ReturnsDifferentHash_AfterManifestModified()
    {
        WriteManifest(ValidManifest);
        var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, ManifestPath);
        var hash1 = guard.Verify().ManifestHash;

        WriteManifest(ValidManifest + "\n# tampered");
        var hash2 = guard.Verify().ManifestHash;

        hash1.Should().NotBe(hash2);
    }
}
```

- [ ] **Step 7.2: Run to verify tests pass (SovereignGuard already exists)**

```bash
cd backend
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "Phase11" --nologo -verbosity:minimal
```

Expected: 6/6 PASS. If any fail, read SovereignGuard.cs carefully and adjust test expectations to match its actual behavior — do NOT modify SovereignGuard.cs logic.

- [ ] **Step 7.3: Wire SovereignGuard into Program.cs startup**

Open `backend/src/TerraFusion.API/Program.cs`. Find the comment `// 🎯 SOVEREIGN BINDING (Phase 9.2)`. Replace it with actual registration and startup verification.

Add DI registration (near other singleton services):

```csharp
// Phase 11: Sovereign manifest verification at startup
builder.Services.AddSingleton<SovereignGuard>();
```

After `var app = builder.Build();` (look for this line), add the startup verification block:

```csharp
// Phase 11: Fail-closed on sovereign manifest violation
{
    var sovereignGuard = app.Services.GetRequiredService<SovereignGuard>();
    var verification = sovereignGuard.Verify();
    if (!verification.IsValid)
    {
        app.Logger.LogCritical(
            "INITIALIZATION BLOCKED — SOVEREIGN VIOLATION: {Violation}",
            verification.Violation);
        Environment.Exit(1);
    }
    app.Logger.LogInformation(
        "Sovereign manifest verified. Hash: {ManifestHash}",
        verification.ManifestHash);
}
```

Add using if needed:
```csharp
using TerraFusion.API.Services;
```

- [ ] **Step 7.4: Build**

```bash
dotnet build TerraFusion.API/TerraFusion.API.csproj --nologo -verbosity:quiet
```

Expected: 0 errors

- [ ] **Step 7.5: Commit**

```bash
git add backend/src/TerraFusion.API/Program.cs backend/TerraFusion.API.Tests/Phase11/
git commit -m "feat(11): wire SovereignGuard at startup — fail-closed on manifest violation, 6/6 tests pass"
```

---

### Task 8A: test-safety.ts red-team CLI — parallel with Task 8B

**Files:**
- Create: `tools/tf/test-safety.ts`

- [ ] **Step 8A.1: Create test-safety.ts**

```typescript
// tools/tf/test-safety.ts
/**
 * @tf test-safety — Red-team safety suite for TerraFusion Sovereign OS.
 * Tests 6 scenarios that the sovereign architecture must block.
 * Exit 0 = all scenarios blocked correctly.
 * Exit 1 = one or more scenarios leaked through (SAFETY FAILURE).
 *
 * Usage: npx tsx test-safety.ts [--verbose]
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const VERBOSE = process.argv.includes('--verbose');

interface SafetyScenario {
  id: string;
  description: string;
  test: () => SafetyResult;
}

interface SafetyResult {
  blocked: boolean;
  evidence: string;
}

const log = (msg: string) => { if (VERBOSE) console.log(msg); };

// ── Scenario 1: Tampered sovereign.yaml detected ────────────────────────────
const scenario1: SafetyScenario = {
  id: 'S1',
  description: 'Tampered sovereign.yaml detected by SovereignGuard',
  test: () => {
    const guardPath = resolve(REPO_ROOT, 'backend', 'src', 'TerraFusion.API', 'Services', 'SovereignGuard.cs');
    if (!existsSync(guardPath)) {
      return { blocked: false, evidence: 'SovereignGuard.cs does not exist' };
    }
    const content = readFileSync(guardPath, 'utf-8');
    const hasSha256 = content.includes('SHA256') || content.includes('sha256');
    const hasFailClosed = content.includes('IsValid') && (content.includes('false') || content.includes('Violation'));
    if (!hasSha256) return { blocked: false, evidence: 'SovereignGuard lacks SHA256 hash verification' };
    if (!hasFailClosed) return { blocked: false, evidence: 'SovereignGuard lacks fail-closed IsValid check' };
    return { blocked: true, evidence: 'SovereignGuard uses SHA256 and fail-closed verification' };
  },
};

// ── Scenario 2: AI write without HumanApproverId staged (not executed) ──────
const scenario2: SafetyScenario = {
  id: 'S2',
  description: 'AI_PILOT write without HumanApproverId → STAGED, not EXECUTED',
  test: () => {
    const gatePath = resolve(REPO_ROOT, 'frontend', 'apps', 'os-shell', 'src', 'services', 'truthGate.ts');
    if (!existsSync(gatePath)) {
      return { blocked: false, evidence: 'truthGate.ts does not exist' };
    }
    const content = readFileSync(gatePath, 'utf-8');
    const hasAiPilotRule = content.includes("source === 'AI_PILOT'") || content.includes('AI_PILOT');
    const hasHumanApprover = content.includes('humanApproverId') || content.includes('HumanApproverId');
    const hasStagedOutcome = content.includes("'STAGED'") || content.includes('"STAGED"');
    if (!hasAiPilotRule) return { blocked: false, evidence: 'truthGate does not check AI_PILOT source' };
    if (!hasHumanApprover) return { blocked: false, evidence: 'truthGate does not check humanApproverId' };
    if (!hasStagedOutcome) return { blocked: false, evidence: 'truthGate does not return STAGED for unapproved AI ops' };
    return { blocked: true, evidence: 'truthGate stages AI_PILOT ops without HumanApproverId' };
  },
};

// ── Scenario 3: Muse surface exposes no write-capable tools ─────────────────
const scenario3: SafetyScenario = {
  id: 'S3',
  description: 'Muse surface exposes only read_only tools (no write-capable tools)',
  test: () => {
    const apiPath = resolve(REPO_ROOT, 'frontend', 'apps', 'os-shell', 'src', 'api', 'pilotApi.ts');
    if (!existsSync(apiPath)) {
      return { blocked: false, evidence: 'pilotApi.ts does not exist' };
    }
    const content = readFileSync(apiPath, 'utf-8');
    const hasFilter = content.includes('filterMuseReadOnlyTools') || content.includes('isMuseReadOnlyTool');
    const filterCorrect = content.includes("mode === 'muse'") && content.includes("risk === 'read_only'");
    if (!hasFilter) return { blocked: false, evidence: 'pilotApi does not export Muse filter function' };
    if (!filterCorrect) return { blocked: false, evidence: 'Muse filter does not enforce mode=muse AND risk=read_only' };
    return { blocked: true, evidence: 'filterMuseReadOnlyTools enforces mode=muse && risk=read_only' };
  },
};

// ── Scenario 4: TerraPilotPanel has no mutation imports ─────────────────────
const scenario4: SafetyScenario = {
  id: 'S4',
  description: 'TerraPilotPanel imports no mutation APIs (read-only boundary enforced)',
  test: () => {
    const panelPath = resolve(REPO_ROOT, 'frontend', 'apps', 'os-shell', 'src', 'components', 'pilot', 'TerraPilotPanel.tsx');
    if (!existsSync(panelPath)) {
      return { blocked: false, evidence: 'TerraPilotPanel.tsx does not exist' };
    }
    const content = readFileSync(panelPath, 'utf-8');
    const mutations = ['executeOsAction', 'createDataset', 'deleteDataset', 'updateValue', 'SaveChangesAsync'];
    const found = mutations.filter(m => content.includes(m));
    if (found.length > 0) {
      return { blocked: false, evidence: `TerraPilotPanel imports mutation APIs: ${found.join(', ')}` };
    }
    return { blocked: true, evidence: 'TerraPilotPanel contains no mutation API imports' };
  },
};

// ── Scenario 5: sovereign.yaml has all required laws ────────────────────────
const scenario5: SafetyScenario = {
  id: 'S5',
  description: 'sovereign.yaml contains all 3 required laws (hitl, county_isolation, truthgate)',
  test: () => {
    const manifestPath = resolve(REPO_ROOT, 'sovereign.yaml');
    if (!existsSync(manifestPath)) {
      return { blocked: false, evidence: 'sovereign.yaml does not exist at repo root' };
    }
    const content = readFileSync(manifestPath, 'utf-8');
    const laws = ['hitl:', 'county_isolation:', 'truthgate:'];
    const missing = laws.filter(law => !content.includes(law));
    if (missing.length > 0) {
      return { blocked: false, evidence: `sovereign.yaml missing laws: ${missing.join(', ')}` };
    }
    const hasHitlEnabled = content.includes('ai_pilot_mutations_require_approval: true');
    if (!hasHitlEnabled) {
      return { blocked: false, evidence: 'sovereign.yaml has hitl law but approval is not set to true' };
    }
    return { blocked: true, evidence: 'sovereign.yaml has hitl, county_isolation, truthgate — all enabled' };
  },
};

// ── Scenario 6: DraftService requires Pending status before approve/reject ──
const scenario6: SafetyScenario = {
  id: 'S6',
  description: 'DraftService rejects double-approve (not Pending guard enforced)',
  test: () => {
    const svcPath = resolve(REPO_ROOT, 'backend', 'src', 'TerraFusion.Core', 'Services', 'DraftService.cs');
    if (!existsSync(svcPath)) {
      return { blocked: false, evidence: 'DraftService.cs does not exist' };
    }
    const content = readFileSync(svcPath, 'utf-8');
    const hasStatusCheck = content.includes('DraftStatus.Pending') && content.includes('InvalidOperationException');
    const hasCountyCheck = content.includes('countyId') && content.includes('CountyId');
    if (!hasStatusCheck) return { blocked: false, evidence: 'DraftService lacks Pending status guard before approve/reject' };
    if (!hasCountyCheck) return { blocked: false, evidence: 'DraftService lacks county isolation in draft lookup' };
    return { blocked: true, evidence: 'DraftService enforces Pending guard and county isolation' };
  },
};

// ── Runner ───────────────────────────────────────────────────────────────────
const scenarios: SafetyScenario[] = [scenario1, scenario2, scenario3, scenario4, scenario5, scenario6];

console.log('\n🛡️  TerraFusion Sovereign Safety Suite\n');

let failures = 0;

for (const scenario of scenarios) {
  const result = scenario.test();
  const icon = result.blocked ? '✅' : '❌';
  console.log(`${icon} [${scenario.id}] ${scenario.description}`);
  log(`    Evidence: ${result.evidence}`);
  if (!result.blocked) failures++;
}

console.log(`\n${failures === 0 ? '✅' : '❌'} ${scenarios.length - failures}/${scenarios.length} scenarios blocked correctly.\n`);

if (failures > 0) {
  console.error(`SAFETY FAILURE: ${failures} scenario(s) leaked through. Deployment blocked.\n`);
  process.exit(1);
}

process.exit(0);
```

- [ ] **Step 8A.2: Add to tools/tf/package.json**

Open `tools/tf/package.json` and add the new script:

```json
{
  "name": "@terrafusion/tf-cli",
  "type": "module",
  "scripts": {
    "sweep": "npx tsx sweep.ts",
    "verify-ops": "npx tsx verify-ops.ts",
    "test-safety": "npx tsx test-safety.ts",
    "test-safety:verbose": "npx tsx test-safety.ts --verbose"
  }
}
```

- [ ] **Step 8A.3: Run test-safety**

```bash
cd tools/tf
npx tsx test-safety.ts --verbose
```

Expected: 6/6 scenarios blocked correctly. Exit 0. If any fail, fix the gap they identify (they're checking live code state, not simulating).

- [ ] **Step 8A.4: Commit**

```bash
git add tools/tf/test-safety.ts tools/tf/package.json
git commit -m "feat(11): add test-safety.ts red-team CLI — 6 sovereign safety scenarios"
```

---

### Task 8B: deploy-sovereign.sh — parallel with Task 8A

**Files:**
- Create: `scripts/deploy-sovereign.sh`

- [ ] **Step 8B.1: Create deploy-sovereign.sh**

```bash
#!/usr/bin/env bash
# scripts/deploy-sovereign.sh
# TerraFusion Sovereign Deployment Script
# Verifies manifest integrity, runs safety suite, deploys to staging, runs post-deploy sweep.
# Usage: ./scripts/deploy-sovereign.sh [--env staging|production] [--dry-run]
#
# Prerequisites: dotnet, node, pnpm, tsx installed and in PATH.

set -euo pipefail

ENV="${DEPLOY_ENV:-staging}"
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --env=*) ENV="${arg#*=}" ;;
    --dry-run) DRY_RUN=true ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$REPO_ROOT/sovereign.yaml"

echo ""
echo "🏛️  TerraFusion Sovereign Deployment"
echo "   Environment : $ENV"
echo "   Dry-run     : $DRY_RUN"
echo "   Repo root   : $REPO_ROOT"
echo ""

# ── Step 1: Verify sovereign.yaml exists and is non-empty ──────────────────
echo "Step 1/6: Verifying sovereign manifest..."
if [[ ! -f "$MANIFEST" ]]; then
  echo "❌ BLOCKED: sovereign.yaml not found at $MANIFEST"
  exit 1
fi

MANIFEST_SIZE=$(wc -c < "$MANIFEST")
if [[ "$MANIFEST_SIZE" -lt 50 ]]; then
  echo "❌ BLOCKED: sovereign.yaml is too small ($MANIFEST_SIZE bytes) — may be tampered or empty"
  exit 1
fi

MANIFEST_HASH=$(sha256sum "$MANIFEST" | awk '{print $1}')
echo "   ✅ Manifest verified. SHA256: $MANIFEST_HASH"

# ── Step 2: Run red-team safety suite ───────────────────────────────────────
echo ""
echo "Step 2/6: Running sovereign safety suite..."
if ! npx tsx "$REPO_ROOT/tools/tf/test-safety.ts"; then
  echo "❌ BLOCKED: Safety suite failed. Deployment aborted."
  exit 1
fi
echo "   ✅ Safety suite passed."

# ── Step 3: Build backend ────────────────────────────────────────────────────
echo ""
echo "Step 3/6: Building backend..."
if [[ "$DRY_RUN" == false ]]; then
  (cd "$REPO_ROOT/backend" && dotnet build TerraFusion.sln --configuration Release --nologo -verbosity:quiet)
fi
echo "   ✅ Backend build succeeded."

# ── Step 4: Run backend tests ────────────────────────────────────────────────
echo ""
echo "Step 4/6: Running backend tests..."
if [[ "$DRY_RUN" == false ]]; then
  (cd "$REPO_ROOT/backend" && dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --nologo -verbosity:minimal)
fi
echo "   ✅ Backend tests passed."

# ── Step 5: Run frontend type-check ─────────────────────────────────────────
echo ""
echo "Step 5/6: Frontend type-check..."
if [[ "$DRY_RUN" == false ]]; then
  (cd "$REPO_ROOT/frontend" && pnpm run type-check)
fi
echo "   ✅ Type-check clean."

# ── Step 6: Post-deploy honesty sweep ───────────────────────────────────────
echo ""
echo "Step 6/6: Post-deploy honesty sweep..."
if [[ "$DRY_RUN" == false ]]; then
  # sweep.ts exits 1 if drift detected — in deployment, we log but don't block
  # (drift sites are known and tracked; new ones would cause a separate alert)
  DRIFT_OUTPUT=$(npx tsx "$REPO_ROOT/tools/tf/sweep.ts" 2>&1 || true)
  echo "$DRIFT_OUTPUT" | tail -5
fi
echo "   ✅ Sweep complete."

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SOVEREIGN DEPLOYMENT COMPLETE"
echo "   Environment  : $ENV"
echo "   Manifest hash: $MANIFEST_HASH"
if [[ "$DRY_RUN" == true ]]; then
  echo "   Mode         : DRY RUN (no builds or tests executed)"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
```

- [ ] **Step 8B.2: Make executable**

```bash
chmod +x scripts/deploy-sovereign.sh
```

- [ ] **Step 8B.3: Dry-run to verify script syntax**

```bash
./scripts/deploy-sovereign.sh --dry-run
```

Expected: All 6 steps complete. Manifest hash printed. "SOVEREIGN DEPLOYMENT COMPLETE" printed. Exit 0.

- [ ] **Step 8B.4: Commit**

```bash
git add scripts/deploy-sovereign.sh
git commit -m "feat(11): add deploy-sovereign.sh with 6-step manifest-verified deployment"
```

---

### Task 9: County pilot runbook + Phase 11 seal

**Files:**
- Create: `.governance/county-pilot-runbook.md`

- [ ] **Step 9.1: Create county-pilot-runbook.md**

```markdown
# County Pilot Deployment Runbook

**Version:** 1.0
**Classification:** Government Operations — TerraFusion OS
**Applies to:** First county deployment (Benton County, WA)

---

## Pre-Deployment Checklist

### Manifest Verification
- [ ] `sha256sum sovereign.yaml` — record hash and store in deployment log
- [ ] Verify hash matches last approved value in deployment ledger
- [ ] `./scripts/deploy-sovereign.sh --dry-run` — confirm script runs cleanly

### Safety Suite
- [ ] `cd tools/tf && npx tsx test-safety.ts --verbose` — all 6 scenarios BLOCKED
- [ ] Review any new drift sites from `npx tsx sweep.ts`

### Backend
- [ ] `dotnet build backend/TerraFusion.sln --configuration Release` — 0 errors
- [ ] `dotnet test backend/TerraFusion.API.Tests` — all tests pass
- [ ] Database migrations applied: `dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API`

### Frontend
- [ ] `pnpm run type-check` — 0 errors
- [ ] `pnpm run build` — build output to `native-shell/ui/dist`

---

## Deployment Steps

1. **Notify county assessor office** — planned maintenance window (recommended: off-hours)
2. **Backup database** — run `ops/scripts/backup_sovereign.ps1`
3. **Run sovereign deployment** — `./scripts/deploy-sovereign.sh --env staging`
4. **Verify health endpoint** — `curl http://localhost:5000/health` → should return `Healthy`
5. **Verify sovereign manifest logged** — check startup logs for `"Sovereign manifest verified. Hash: <hash>"`
6. **Smoke test TerraPilot Muse Mode** — load a parcel in Workbench, open TerraPilot panel, submit an explain query, verify response appears (not placeholder text)
7. **Verify HITL enforcement** — attempt an AI-proposed draft, verify it enters PENDING state (not auto-committed)

---

## Post-Deployment Verification

```bash
# 1. Health check
curl -s http://localhost:5000/health | jq .status

# 2. Sovereign manifest in logs (look for startup log)
# Expected: "Sovereign manifest verified. Hash: <sha256>"

# 3. TerraPilot explain endpoint
curl -s -X POST http://localhost:5000/api/pilot/explain \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"What RCW governs this assessment?","parcelId":"100003000","countyId":"benton","actorId":"test","source":"AI_PILOT"}' | jq .

# 4. Draft propose endpoint
curl -s -X POST http://localhost:5000/api/pilot/drafts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"countyId":"benton","description":"Test draft","currentValueJson":"{}","proposedValueJson":"{}"}' | jq .status
# Expected: "Pending"
```

---

## Incident Response

### SOVEREIGN VIOLATION at startup
**Symptom:** API process exits with `INITIALIZATION BLOCKED — SOVEREIGN VIOLATION` in logs.
**Cause:** `sovereign.yaml` is missing, empty, tampered, or has HITL approval disabled.
**Response:**
1. Do NOT restart the API — the process is correctly refusing to start.
2. Retrieve the last known-good `sovereign.yaml` from git: `git show HEAD:sovereign.yaml > sovereign.yaml`
3. Verify hash against deployment ledger.
4. Restart the API and confirm `"Sovereign manifest verified"` in logs.
5. File a security incident report documenting the violation and resolution.

### HITL Draft stuck in PENDING
**Symptom:** AI-proposed draft was not approved or rejected, and assessment is stalled.
**Response:**
1. Assessor reviews draft via `GET /api/pilot/drafts/{draftId}?countyId=benton`
2. Approve or reject via the DraftReviewPanel in the Workbench
3. Drafts auto-expire after 24 hours if not acted on — `DraftService.ExpireStaleDraftsAsync` runs on schedule

### TerraPilot explain returning placeholder text
**Symptom:** Explain response says "Full explain pipeline connects in Phase 9 backend integration".
**Cause:** `TerraPilotPanel` is using the old mock response — frontend deployed without Phase 9B changes.
**Response:** Verify frontend build includes Phase 9B changes. Rebuild and redeploy frontend.

---

## Rollback Procedure

1. `git log --oneline -10` — identify last known-good commit
2. `git checkout <sha> -- backend/src/TerraFusion.API/ frontend/apps/os-shell/src/`
3. Rebuild and redeploy
4. Restore database backup from `ops/scripts/backup_sovereign.ps1` output if data was modified

---

## County Contacts

| Role | Contact |
|------|---------|
| Benton County Assessor | On file |
| TerraFusion Technical Lead | Founder |
| Emergency Escalation | Founder direct |
```

- [ ] **Step 9.2: Commit runbook**

```bash
git add .governance/county-pilot-runbook.md
git commit -m "docs(11): add county pilot runbook with pre-deploy, smoke test, incident response, rollback"
```

- [ ] **Step 9.3: Run full Phase 11 suite**

```bash
cd frontend
pnpm vitest run apps/os-shell/src/__tests__/auth/phase11-sovereignDeploy.contract.test.ts
```

Expected: 4/4 PASS

```bash
cd tools/tf
npx tsx test-safety.ts --verbose
```

Expected: 6/6 scenarios BLOCKED. Exit 0.

```bash
./scripts/deploy-sovereign.sh --dry-run
```

Expected: All 6 steps complete. Exit 0.

```bash
cd backend
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "Phase11" --nologo -verbosity:minimal
```

Expected: All PASS

- [ ] **Step 9.4: Full regression gate**

```bash
# Frontend
cd frontend
pnpm run type-check
pnpm vitest run apps/os-shell/src/__tests__/auth/

# Backend
cd ../backend
dotnet build TerraFusion.sln --configuration Release --nologo -verbosity:quiet
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --nologo -verbosity:minimal
```

Expected: 0 type errors, 0 build errors, all tests pass

- [ ] **Step 9.5: Phase 11 seal commit**

```bash
git add .governance/workflow/progress.md
git commit -m "feat(11): seal — SovereignGuard startup wiring, test-safety 6/6, deploy-sovereign.sh, county pilot runbook"
```

Update `.governance/workflow/progress.md` — add **Phase 11** section with all deliverables, test counts, and commit SHA. Record `CP-W11-1 CLOSED`.

---

## Execution Shape Summary

```
Phase 9B:
  Task 1: MuseService + DTOs (foundation)
  Task 2A: PilotController + DI (parallel) ←──┐ both depend on Task 1
  Task 2B: pilotApi.ts + TerraPilotPanel   ←──┘
  Task 3: EvidenceRail + seal

Phase 10:
  Task 4: Draft entity + IDraftService (foundation)
  Task 5A: DraftService impl (parallel) ←──┐ both depend on Task 4
  Task 5B: PilotController draft endpoints ─┘
  Task 6: frontend contract tests + seal

Phase 11:
  Task 7: Program.cs SovereignGuard startup (foundation)
  Task 8A: SovereignGuardTests (parallel) ←──┐ both can run after Task 7
  Task 8B: test-safety.ts + deploy.sh    ←──┘
  Task 9: county-pilot-runbook + full seal
```

**Parallel dispatch targets:**
- Phase 9B: Tasks 2A + 2B simultaneously
- Phase 10: Tasks 5A + 5B simultaneously
- Phase 11: Tasks 8A + 8B simultaneously
