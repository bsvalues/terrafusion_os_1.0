# Track A — Rust Kernel Integration (Cost + Valuation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the two production Rust kernels (`terraforge-kernel-cost`, `terraforge-kernel-valuation`) into the .NET backend as subprocess JSON workers, replacing the stubbed fallback path in `ValuationService.CalculateCostApproachAsync` with deterministic kernel-backed compute.

**Architecture:** Thin Forge-owned adapter layer. `RustKernelProcessHost` wraps subprocess I/O (stdin JSON in → stdout JSON out, stderr captured, timeout enforced). `CostKernelClient` and `ValuationKernelClient` are typed wrappers speaking each kernel's contract. `KernelValuationService` composes both kernels into an end-to-end compute path. The existing data-driven `ValuationService` is untouched; kernel path is additive.

**Tech Stack:** .NET 8, Rust 1.92 (`cargo check` verified clean), stdin/stdout JSON via `System.Diagnostics.Process`, xUnit tests with golden JSON fixtures.

---

## Decision and Context

### Decision

**Execute Track A now.** Wire cost and valuation Rust kernels into backend as subprocess JSON co-processors. Do not touch Tauri packaging, do not consolidate repos, do not rebuild kernels, do not pull shared crates.

### Local Proof (Verified 2026-04-22)

- `cargo --version` → `cargo 1.92.0` on PATH at `C:\Users\bsval\.cargo\bin\cargo.exe`.
- `dotnet --version` → `8.0.420`.
- `cd packages/terrabuild/kernels && cargo check --workspace` → both `terraforge-kernel-cost v1.0.0` and `terraforge-kernel-valuation v1.0.0` compile with zero errors (`Finished dev profile in 37.50s`).
- Kernel source lives at:
  - `packages/terrabuild/kernels/terraforge.kernel.cost/src/main.rs`
  - `packages/terrabuild/kernels/terraforge.kernel.valuation/src/main.rs`
- Kernel workspace manifest: `packages/terrabuild/kernels/Cargo.toml` (release profile already has `lto=true, codegen-units=1, strip=true`).

### Canonical-Source Note (Informational Only)

A modular GitHub split exists at `bsvalues/terrafusion-os-core`, `bsvalues/TerraBuild`, `bsvalues/terrafusion-shared` (Oct 2025) that may contain canonical versions of these kernels. **This does not block Track A.** The local copies compile and have a correct stdin/stdout JSON contract. If a future pass determines the GitHub canonical diverges, that is a Track C concern, not this slice.

### Scope Exclusions — Do Not Do

- Do not rebuild kernels (they compile; leave them).
- Do not integrate Tauri packaging.
- Do not consolidate GitHub modular split.
- Do not pull `terrafusion-shared` unless an integration blocker proves it's required.
- Do not move valuation logic into Dais.
- Do not touch `CountyStudyService.PreviewScenarioImpactAsync` — the `0.87m` / `0.98m` / `0.62` multipliers there are **ratio-study scenario projection math**, not cost/valuation. That requires a separate ratio-study kernel (future Track A-2).
- Do not modify the existing `ValuationService.CalculateCostApproachAsync` data-driven path. The kernel path is **additive**, not a replacement for canonical DB-driven compute.

### Executable Path Resolution

Kernels compile to:
- Debug: `packages/terrabuild/kernels/target/debug/terraforge-kernel-cost.exe` and `terraforge-kernel-valuation.exe`
- Release: `packages/terrabuild/kernels/target/release/terraforge-kernel-cost.exe` and `terraforge-kernel-valuation.exe`

Backend resolves via `appsettings.json`:

```json
{
  "RustKernels": {
    "CostKernelPath": "../packages/terrabuild/kernels/target/release/terraforge-kernel-cost.exe",
    "ValuationKernelPath": "../packages/terrabuild/kernels/target/release/terraforge-kernel-valuation.exe",
    "TimeoutMs": 5000,
    "ContractPackVersion": "1.0.0",
    "ModuleApiVersion": "1.0.0"
  }
}
```

Resolution strategy: path relative to `AppContext.BaseDirectory`, falls back to debug if release missing, throws `KernelExecutableNotFoundException` if neither. Env var `TERRAFUSION_KERNEL_DIR` overrides.

### Kernel Contract Summary (Locked from source)

**Envelope (both kernels):**
```json
{
  "contractPackVersion": "1.0.0",
  "moduleApiVersion": "1.0.0",
  "requestId": "<uuid>",
  "action": "calculate_cost" | "valuate",
  "payload": { /* kernel-specific */ }
}
```

**Cost kernel payload (action=`calculate_cost`):**
```json
{
  "subject": {
    "parcelId": "string",
    "attributes": { "sqft": 1850.0, "quality": "GOOD", "condition": "AVERAGE" }
  },
  "tables": {
    "baseRate": 145.50,
    "modifiers": { "GOOD": 1.15, "AVERAGE": 1.0, "DepreciationRate": 0.10 }
  }
}
```

**Cost kernel response:**
```json
{
  "success": true,
  "data": { "replacementCost": 309558.75, "depreciation": 30955.88, "rcnld": 278602.87 },
  "auditEvent": {
    "eventId": "<uuid>",
    "timestamp": "2026-04-22T...",
    "actor": "system",
    "action": "calculate_cost",
    "resourceId": "<parcelId>",
    "module": "terraforge.kernel.cost",
    "hash": "git:<12-char SHA>"
  }
}
```

**Valuation kernel payload (action=`valuate`):**
```json
{
  "subject": { "parcelId": "string", "attributes": {} },
  "costBreakdown": { "replacementCost": 309558.75, "depreciation": 30955.88, "rcnld": 278602.87 },
  "model": {
    "landValue": 65000.0,
    "adjustmentFactors": { "neighborhood": 1.05, "location": 0.98 }
  }
}
```

**Valuation kernel response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 351708.06,
    "components": { "land": 65000.0, "building": 286708.06 }
  },
  "auditEvent": { /* same shape as cost */ }
}
```

**Error envelope (both kernels, when success=false):**
```json
{ "success": false, "error": "Invalid JSON: ...", "data": null, "auditEvent": null }
```

### Backend API Contract — Every Kernel Call Produces

```csharp
public record KernelInvocationResult<T>(
    bool Success,
    string KernelName,          // "terraforge.kernel.cost"
    string? KernelVersion,      // "git:<sha>" from response auditEvent.hash
    string InputHash,           // sha256 of the serialized request payload
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    int DurationMs,
    T? Data,                    // typed result when Success
    KernelAuditEvent? AuditEvent,
    IReadOnlyList<string> Warnings,
    KernelFailureMode? FailureMode,  // null when Success
    string? ErrorMessage);

public enum KernelFailureMode
{
    ExecutableNotFound,
    Timeout,
    NonZeroExit,
    InvalidJsonResponse,
    KernelReportedError   // success=false from kernel itself
}
```

### Architecture Flow

```
[Controller]
   ↓
[ValuationController.ComputeCostViaKernel()]
   ↓
[KernelValuationService.ComputeCostWithKernelAsync()]   ← Forge-owned service
   ↓
[CostKernelClient.CalculateCostAsync()]                 ← typed wrapper
   ↓
[RustKernelProcessHost.InvokeAsync<TReq, TResp>()]      ← subprocess I/O
   ↓
[Rust subprocess: terraforge-kernel-cost.exe]
   ↓
[Domain mapping: CostKernelResponse → CostApproachResult + KernelInvocationResult envelope]
   ↓
[Response DTO with result + provenance]
```

### File Structure

```
backend/src/TerraFusion.API/Services/Valuation/
  RustKernelProcessHost.cs              ← generic subprocess invoker
  CostKernelClient.cs                    ← typed cost wrapper
  ValuationKernelClient.cs               ← typed valuation wrapper
  KernelValuationService.cs              ← compose both, map to domain
  KernelContracts/
    KernelInvocation.cs                  ← envelope (shared for both kernels)
    KernelResponse.cs                    ← envelope (shared)
    KernelAuditEvent.cs                  ← audit struct
    CostKernelPayload.cs                 ← CostSubject, CostAttributes, CostTables
    CostKernelResult.cs                  ← replacementCost/depreciation/rcnld
    ValuationKernelPayload.cs            ← ValuationSubject, CostBreakdown, Model
    ValuationKernelResult.cs             ← totalValue/components
    KernelInvocationResult.cs            ← the backend-owned envelope with provenance
    KernelFailureMode.cs                 ← enum
  KernelMapping/
    PropertyToCostPayloadMapper.cs       ← Property + Cama → CostKernelPayload
    CostResultToDomainMapper.cs          ← CostKernelResult → CostApproachResult

backend/src/TerraFusion.API/Controllers/
  ValuationController.cs                 ← MODIFY: add kernel-compute endpoint

backend/src/TerraFusion.API/Configuration/
  RustKernelsOptions.cs                  ← IOptions<> bound from "RustKernels" config section

backend/TerraFusion.API.Tests/Services/Valuation/
  RustKernelProcessHostTests.cs
  CostKernelClientTests.cs
  ValuationKernelClientTests.cs
  KernelValuationServiceIntegrationTests.cs
  BoundaryGuardTests.cs                  ← Dais services do not reference kernel clients
  Fixtures/Kernels/
    cost-request-basic.json
    cost-response-basic.json
    cost-response-error.json
    valuation-request-basic.json
    valuation-response-basic.json
    valuation-response-error.json
```

### Rollback Plan

Kernel path is **additive**. The existing `ValuationService.CalculateCostApproachAsync` is untouched. If anything regresses:

1. Set `appsettings.json` → `RustKernels.Enabled = false` (new flag, default true in prod, false in test).
2. New endpoint `POST /api/valuation/kernel-cost-approach` becomes 503 Service Unavailable when disabled.
3. No consumer relies on kernel path yet (this slice adds it; it does not replace anything).
4. Worst case: `git revert` on this branch merges.

---

## Task Plan

### Task 1: Baseline proof — build + test pass on branch starting point

**Why first:** If the .NET build is broken on this branch, every subsequent TDD failure is ambiguous. Prove clean before adding code.

**Files:** None (verification only).

- [ ] **Step 1: Run baseline dotnet build**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet build TerraFusion.sln 2>&1 | tail -20
```

Expected: `Build succeeded` or a known pre-existing failure count documented below.

- [ ] **Step 2: Run baseline dotnet test (fast subset)**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --no-build --filter "FullyQualifiedName~Valuation" 2>&1 | tail -10
```

Expected: Either all pass or pre-existing baseline failure count recorded.

- [ ] **Step 3: Verify Rust kernels still check**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\packages\terrabuild\kernels && cargo check --workspace 2>&1 | tail -5
```

Expected: `Finished dev profile`.

- [ ] **Step 4: Record baseline**

No commit — this task is diagnostic. Record findings in next task's commit message.

---

### Task 2: Create kernel contract DTOs (envelopes + payloads, no behavior)

**Why:** Contracts before behavior. These are records with no logic — can be test-driven via JSON round-trip serialization tests.

**Files:**
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelInvocation.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelResponse.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelAuditEvent.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/CostKernelPayload.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/CostKernelResult.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/ValuationKernelPayload.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/ValuationKernelResult.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelInvocationResult.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelFailureMode.cs`
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/cost-request-basic.json`
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/cost-response-basic.json`
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/valuation-request-basic.json`
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/valuation-response-basic.json`
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/KernelContractRoundTripTests.cs`

- [ ] **Step 1: Write the failing contract test**

Create `backend/TerraFusion.API.Tests/Services/Valuation/KernelContractRoundTripTests.cs`:

```csharp
using System.IO;
using System.Text.Json;
using TerraFusion.API.Services.Valuation.KernelContracts;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class KernelContractRoundTripTests
{
    private static readonly string FixturesDir = Path.Combine(
        Path.GetDirectoryName(typeof(KernelContractRoundTripTests).Assembly.Location)!,
        "Services", "Valuation", "Fixtures", "Kernels");

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    [Fact]
    public void CostRequest_DeserializesFromGoldenFixture()
    {
        var json = File.ReadAllText(Path.Combine(FixturesDir, "cost-request-basic.json"));
        var inv = JsonSerializer.Deserialize<KernelInvocation<CostKernelPayload>>(json, JsonOpts);

        Assert.NotNull(inv);
        Assert.Equal("1.0.0", inv!.ContractPackVersion);
        Assert.Equal("calculate_cost", inv.Action);
        Assert.Equal(1850.0, inv.Payload!.Subject.Attributes.Sqft);
        Assert.Equal("GOOD", inv.Payload.Subject.Attributes.Quality);
        Assert.Equal(145.50, inv.Payload.Tables.BaseRate);
        Assert.Equal(1.15, inv.Payload.Tables.Modifiers["GOOD"]);
    }

    [Fact]
    public void CostResponse_DeserializesFromGoldenFixture()
    {
        var json = File.ReadAllText(Path.Combine(FixturesDir, "cost-response-basic.json"));
        var resp = JsonSerializer.Deserialize<KernelResponse<CostKernelResult>>(json, JsonOpts);

        Assert.NotNull(resp);
        Assert.True(resp!.Success);
        Assert.Equal(309558.75, resp.Data!.ReplacementCost);
        Assert.Equal(30955.88, resp.Data.Depreciation);
        Assert.Equal(278602.87, resp.Data.Rcnld);
        Assert.NotNull(resp.AuditEvent);
        Assert.Equal("terraforge.kernel.cost", resp.AuditEvent!.Module);
        Assert.StartsWith("git:", resp.AuditEvent.Hash);
    }

    [Fact]
    public void ValuationRequest_DeserializesFromGoldenFixture()
    {
        var json = File.ReadAllText(Path.Combine(FixturesDir, "valuation-request-basic.json"));
        var inv = JsonSerializer.Deserialize<KernelInvocation<ValuationKernelPayload>>(json, JsonOpts);

        Assert.NotNull(inv);
        Assert.Equal("valuate", inv!.Action);
        Assert.Equal(278602.87, inv.Payload!.CostBreakdown.Rcnld);
        Assert.Equal(65000.0, inv.Payload.Model.LandValue);
        Assert.Equal(1.05, inv.Payload.Model.AdjustmentFactors!.Neighborhood);
    }

    [Fact]
    public void ValuationResponse_DeserializesFromGoldenFixture()
    {
        var json = File.ReadAllText(Path.Combine(FixturesDir, "valuation-response-basic.json"));
        var resp = JsonSerializer.Deserialize<KernelResponse<ValuationKernelResult>>(json, JsonOpts);

        Assert.NotNull(resp);
        Assert.True(resp!.Success);
        Assert.Equal(351708.06, resp.Data!.TotalValue);
        Assert.Equal(65000.0, resp.Data.Components.Land);
    }

    [Fact]
    public void CostRequest_RoundTripsSerialization()
    {
        var original = new KernelInvocation<CostKernelPayload>(
            ContractPackVersion: "1.0.0",
            ModuleApiVersion: "1.0.0",
            RequestId: "test-123",
            Action: "calculate_cost",
            Payload: new CostKernelPayload(
                Subject: new CostSubject("PARCEL-001", new CostAttributes(1850.0, "GOOD", "AVERAGE")),
                Tables: new CostTables(145.50, new Dictionary<string, double> { ["GOOD"] = 1.15 })));

        var json = JsonSerializer.Serialize(original, JsonOpts);
        var round = JsonSerializer.Deserialize<KernelInvocation<CostKernelPayload>>(json, JsonOpts)!;

        Assert.Equal(original.RequestId, round.RequestId);
        Assert.Equal(original.Payload!.Subject.Attributes.Sqft, round.Payload!.Subject.Attributes.Sqft);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~KernelContractRoundTrip" 2>&1 | tail -10
```

Expected: FAIL — types don't exist yet.

- [ ] **Step 3: Write the DTOs**

Create `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelInvocation.cs`:

```csharp
namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>
/// Envelope for a single kernel invocation. Shared by all kernels (cost, valuation, future).
/// Serialized to stdin of the kernel subprocess.
/// </summary>
public record KernelInvocation<TPayload>(
    string ContractPackVersion,
    string ModuleApiVersion,
    string RequestId,
    string Action,
    TPayload? Payload);
```

Create `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelResponse.cs`:

```csharp
namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>
/// Envelope for a kernel's stdout response. Fields match the Rust kernel's Response&lt;T&gt; struct.
/// </summary>
public record KernelResponse<TData>(
    bool Success,
    string? Error,
    TData? Data,
    KernelAuditEvent? AuditEvent);
```

Create `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelAuditEvent.cs`:

```csharp
namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>
/// FISMA calculation-provenance audit event emitted by every kernel invocation.
/// Hash field is "git:&lt;12-char SHA&gt;" — reproducible by checking out that commit and rebuilding.
/// </summary>
public record KernelAuditEvent(
    string EventId,
    string Timestamp,
    string Actor,
    string Action,
    string ResourceId,
    string Module,
    string Hash);
```

Create `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/CostKernelPayload.cs`:

```csharp
namespace TerraFusion.API.Services.Valuation.KernelContracts;

public record CostKernelPayload(CostSubject Subject, CostTables Tables);

public record CostSubject(string ParcelId, CostAttributes Attributes);

public record CostAttributes(double Sqft, string? Quality, string? Condition);

public record CostTables(double BaseRate, IReadOnlyDictionary<string, double> Modifiers);
```

Create `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/CostKernelResult.cs`:

```csharp
namespace TerraFusion.API.Services.Valuation.KernelContracts;

public record CostKernelResult(double ReplacementCost, double Depreciation, double Rcnld);
```

Create `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/ValuationKernelPayload.cs`:

```csharp
using System.Text.Json;

namespace TerraFusion.API.Services.Valuation.KernelContracts;

public record ValuationKernelPayload(
    ValuationSubject Subject,
    ValuationCostBreakdown CostBreakdown,
    ValuationModel Model);

public record ValuationSubject(string ParcelId, JsonElement Attributes);

public record ValuationCostBreakdown(double ReplacementCost, double Depreciation, double Rcnld);

public record ValuationModel(double LandValue, AdjustmentFactors? AdjustmentFactors);

public record AdjustmentFactors(double? Neighborhood, double? Location);
```

Create `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/ValuationKernelResult.cs`:

```csharp
namespace TerraFusion.API.Services.Valuation.KernelContracts;

public record ValuationKernelResult(double TotalValue, ValuationComponents Components);

public record ValuationComponents(double Land, double Building);
```

Create `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelFailureMode.cs`:

```csharp
namespace TerraFusion.API.Services.Valuation.KernelContracts;

public enum KernelFailureMode
{
    ExecutableNotFound,
    Timeout,
    NonZeroExit,
    InvalidJsonResponse,
    KernelReportedError
}
```

Create `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelInvocationResult.cs`:

```csharp
namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>
/// Backend-owned envelope for a kernel invocation. Combines the kernel's data with
/// backend-measured provenance (timing, input hash, failure mode).
/// </summary>
public record KernelInvocationResult<TData>(
    bool Success,
    string KernelName,
    string? KernelVersion,
    string InputHash,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    int DurationMs,
    TData? Data,
    KernelAuditEvent? AuditEvent,
    IReadOnlyList<string> Warnings,
    KernelFailureMode? FailureMode,
    string? ErrorMessage);
```

- [ ] **Step 4: Write the JSON fixtures**

Create `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/cost-request-basic.json`:

```json
{
  "contractPackVersion": "1.0.0",
  "moduleApiVersion": "1.0.0",
  "requestId": "test-req-001",
  "action": "calculate_cost",
  "payload": {
    "subject": {
      "parcelId": "PARCEL-0001",
      "attributes": { "sqft": 1850.0, "quality": "GOOD", "condition": "AVERAGE" }
    },
    "tables": {
      "baseRate": 145.50,
      "modifiers": { "GOOD": 1.15, "AVERAGE": 1.0, "DepreciationRate": 0.10 }
    }
  }
}
```

Create `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/cost-response-basic.json`:

```json
{
  "success": true,
  "data": { "replacementCost": 309558.75, "depreciation": 30955.88, "rcnld": 278602.87 },
  "auditEvent": {
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-04-22T10:00:00Z",
    "actor": "system",
    "action": "calculate_cost",
    "resourceId": "PARCEL-0001",
    "module": "terraforge.kernel.cost",
    "hash": "git:abc123def456"
  }
}
```

Create `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/cost-response-error.json`:

```json
{ "success": false, "error": "Invalid Payload: missing field `sqft`" }
```

Create `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/valuation-request-basic.json`:

```json
{
  "contractPackVersion": "1.0.0",
  "moduleApiVersion": "1.0.0",
  "requestId": "test-req-002",
  "action": "valuate",
  "payload": {
    "subject": { "parcelId": "PARCEL-0001", "attributes": {} },
    "costBreakdown": { "replacementCost": 309558.75, "depreciation": 30955.88, "rcnld": 278602.87 },
    "model": {
      "landValue": 65000.0,
      "adjustmentFactors": { "neighborhood": 1.05, "location": 0.98 }
    }
  }
}
```

Create `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/valuation-response-basic.json`:

```json
{
  "success": true,
  "data": {
    "totalValue": 351708.06,
    "components": { "land": 65000.0, "building": 286708.06 }
  },
  "auditEvent": {
    "eventId": "660e8400-e29b-41d4-a716-446655440001",
    "timestamp": "2026-04-22T10:00:01Z",
    "actor": "system",
    "action": "valuate",
    "resourceId": "PARCEL-0001",
    "module": "terraforge.kernel.valuation",
    "hash": "git:abc123def456"
  }
}
```

Create `backend/TerraFusion.API.Tests/Services/Valuation/Fixtures/Kernels/valuation-response-error.json`:

```json
{ "success": false, "error": "Unknown action: whatever" }
```

**Important:** In the test project csproj, ensure fixtures are copied to output. Add to `TerraFusion.API.Tests.csproj`:

```xml
<ItemGroup>
  <None Update="Services\Valuation\Fixtures\Kernels\*.json">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
  </None>
</ItemGroup>
```

- [ ] **Step 5: Run tests to verify they pass**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~KernelContractRoundTrip" 2>&1 | tail -10
```

Expected: 5/5 tests pass.

- [ ] **Step 6: Commit**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && git add backend/src/TerraFusion.API/Services/Valuation/KernelContracts backend/TerraFusion.API.Tests/Services/Valuation docs/superpowers/specs/2026-04-22-track-a-rust-kernel-integration.md && git commit -m "feat(kernels): add DTO contracts + golden JSON fixtures for cost/valuation kernels"
```

---

### Task 3: Create RustKernelProcessHost — generic subprocess invoker

**Why:** One place to encapsulate subprocess I/O, timeout, stderr capture, exit-code handling, input hashing, and timing. Both kernel clients will delegate here.

**Files:**
- Create: `backend/src/TerraFusion.API/Configuration/RustKernelsOptions.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/RustKernelProcessHost.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/IRustKernelProcessHost.cs`
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/RustKernelProcessHostTests.cs`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/TerraFusion.API/Configuration/RustKernelsOptions.cs`:

```csharp
namespace TerraFusion.API.Configuration;

public class RustKernelsOptions
{
    public const string SectionName = "RustKernels";

    public string CostKernelPath { get; set; } = "";
    public string ValuationKernelPath { get; set; } = "";
    public int TimeoutMs { get; set; } = 5000;
    public string ContractPackVersion { get; set; } = "1.0.0";
    public string ModuleApiVersion { get; set; } = "1.0.0";
    public bool Enabled { get; set; } = true;
}
```

Create `backend/src/TerraFusion.API/Services/Valuation/IRustKernelProcessHost.cs`:

```csharp
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public interface IRustKernelProcessHost
{
    Task<KernelInvocationResult<TResp>> InvokeAsync<TReq, TResp>(
        string executablePath,
        string kernelName,
        KernelInvocation<TReq> invocation,
        CancellationToken ct = default);
}
```

Create `backend/TerraFusion.API.Tests/Services/Valuation/RustKernelProcessHostTests.cs`:

```csharp
using System.IO;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class RustKernelProcessHostTests
{
    private static RustKernelProcessHost CreateSut(int timeoutMs = 5000) =>
        new(
            Options.Create(new RustKernelsOptions { TimeoutMs = timeoutMs }),
            NullLogger<RustKernelProcessHost>.Instance);

    private static KernelInvocation<CostKernelPayload> SampleCostInvocation() =>
        new(
            ContractPackVersion: "1.0.0",
            ModuleApiVersion: "1.0.0",
            RequestId: "test-001",
            Action: "calculate_cost",
            Payload: new CostKernelPayload(
                new CostSubject("PARCEL-001", new CostAttributes(1850.0, "GOOD", "AVERAGE")),
                new CostTables(145.50, new Dictionary<string, double> { ["GOOD"] = 1.15 })));

    [Fact]
    public async Task MissingExecutable_ReturnsExecutableNotFoundFailure()
    {
        var host = CreateSut();
        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            executablePath: "this-does-not-exist.exe",
            kernelName: "terraforge.kernel.cost",
            invocation: SampleCostInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.ExecutableNotFound, result.FailureMode);
        Assert.Null(result.Data);
        Assert.Equal("terraforge.kernel.cost", result.KernelName);
        Assert.NotNull(result.ErrorMessage);
    }

    [Fact]
    public async Task InputHash_IsStableForSameRequest()
    {
        var host = CreateSut();
        var inv = SampleCostInvocation();
        var r1 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            "does-not-exist.exe", "cost", inv);
        var r2 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            "does-not-exist.exe", "cost", inv);

        // Both fail on missing exe, but hash should match — hash is computed before invocation.
        Assert.Equal(r1.InputHash, r2.InputHash);
        Assert.NotEmpty(r1.InputHash);
    }

    [Fact]
    public async Task InputHash_ChangesWhenPayloadChanges()
    {
        var host = CreateSut();
        var inv1 = SampleCostInvocation();
        var inv2 = inv1 with
        {
            Payload = inv1.Payload! with
            {
                Subject = inv1.Payload.Subject with
                {
                    Attributes = inv1.Payload.Subject.Attributes with { Sqft = 9999.0 }
                }
            }
        };

        var r1 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>("nope.exe", "cost", inv1);
        var r2 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>("nope.exe", "cost", inv2);

        Assert.NotEqual(r1.InputHash, r2.InputHash);
    }

    [Fact]
    public async Task DurationMs_IsNonNegative()
    {
        var host = CreateSut();
        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            "does-not-exist.exe", "cost", SampleCostInvocation());

        Assert.True(result.DurationMs >= 0);
        Assert.True(result.CompletedAt >= result.StartedAt);
    }

    [Fact]
    public async Task RealKernel_ReturnsSuccessForValidCostInput()
    {
        // Locate kernel binary: try release first, then debug.
        var kernelPath = TryFindKernelBinary("terraforge-kernel-cost");
        if (kernelPath == null)
        {
            // No compiled kernel — skip. Recorded as a message, not a failure.
            // To enable: `cd packages/terrabuild/kernels && cargo build`.
            return;
        }

        var host = CreateSut();
        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            kernelPath, "terraforge.kernel.cost", SampleCostInvocation());

        Assert.True(result.Success, $"Expected success, got: {result.ErrorMessage}");
        Assert.NotNull(result.Data);
        // sqft=1850 * baseRate=145.50 * modQ=1.15 * modC=1.0 = 309558.75
        Assert.Equal(309558.75, result.Data!.ReplacementCost, 2);
        Assert.Equal(30955.875, result.Data.Depreciation, 2);
        Assert.NotNull(result.AuditEvent);
        Assert.StartsWith("git:", result.AuditEvent!.Hash);
    }

    [Fact]
    public async Task RealKernel_DeterministicSameInputProducesSameResult()
    {
        var kernelPath = TryFindKernelBinary("terraforge-kernel-cost");
        if (kernelPath == null) return;

        var host = CreateSut();
        var inv = SampleCostInvocation();
        var r1 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(kernelPath, "cost", inv);
        var r2 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(kernelPath, "cost", inv);

        Assert.True(r1.Success && r2.Success);
        Assert.Equal(r1.Data!.ReplacementCost, r2.Data!.ReplacementCost);
        Assert.Equal(r1.Data.Depreciation, r2.Data.Depreciation);
        Assert.Equal(r1.Data.Rcnld, r2.Data.Rcnld);
        // Same input hash
        Assert.Equal(r1.InputHash, r2.InputHash);
        // Same kernel binary hash (from audit event)
        Assert.Equal(r1.AuditEvent!.Hash, r2.AuditEvent!.Hash);
        // Different audit event IDs (uuid per call) — this confirms kernel ran twice
        Assert.NotEqual(r1.AuditEvent.EventId, r2.AuditEvent.EventId);
    }

    private static string? TryFindKernelBinary(string name)
    {
        var repoRoot = FindRepoRoot();
        if (repoRoot == null) return null;
        var releasePath = Path.Combine(repoRoot, "packages", "terrabuild", "kernels", "target", "release", $"{name}.exe");
        var debugPath = Path.Combine(repoRoot, "packages", "terrabuild", "kernels", "target", "debug", $"{name}.exe");
        if (File.Exists(releasePath)) return releasePath;
        if (File.Exists(debugPath)) return debugPath;
        return null;
    }

    private static string? FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir.FullName, ".git")) ||
                File.Exists(Path.Combine(dir.FullName, "terrafusion.app.json")))
                return dir.FullName;
            dir = dir.Parent;
        }
        return null;
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~RustKernelProcessHost" 2>&1 | tail -10
```

Expected: FAIL — `RustKernelProcessHost` does not exist.

- [ ] **Step 3: Implement RustKernelProcessHost**

Create `backend/src/TerraFusion.API/Services/Valuation/RustKernelProcessHost.cs`:

```csharp
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

/// <summary>
/// Invokes a Rust kernel binary as a short-lived subprocess. Stdin: JSON request. Stdout: JSON response.
/// Captures stderr. Enforces timeout. Maps all failure modes to typed <see cref="KernelFailureMode"/>.
/// </summary>
public class RustKernelProcessHost : IRustKernelProcessHost
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IOptions<RustKernelsOptions> _options;
    private readonly ILogger<RustKernelProcessHost> _logger;

    public RustKernelProcessHost(IOptions<RustKernelsOptions> options, ILogger<RustKernelProcessHost> logger)
    {
        _options = options;
        _logger = logger;
    }

    public async Task<KernelInvocationResult<TResp>> InvokeAsync<TReq, TResp>(
        string executablePath,
        string kernelName,
        KernelInvocation<TReq> invocation,
        CancellationToken ct = default)
    {
        var startedAt = DateTimeOffset.UtcNow;
        var sw = Stopwatch.StartNew();

        var requestJson = JsonSerializer.Serialize(invocation, JsonOpts);
        var inputHash = ComputeSha256(requestJson);

        if (!File.Exists(executablePath))
        {
            sw.Stop();
            return Fail(KernelFailureMode.ExecutableNotFound,
                $"Kernel executable not found: {executablePath}",
                startedAt, sw, kernelName, inputHash);
        }

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = executablePath,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = new Process { StartInfo = psi };
            if (!process.Start())
            {
                sw.Stop();
                return Fail(KernelFailureMode.ExecutableNotFound,
                    "Process.Start returned false",
                    startedAt, sw, kernelName, inputHash);
            }

            // Write stdin and close it so the kernel sees EOF and proceeds.
            await process.StandardInput.WriteAsync(requestJson);
            process.StandardInput.Close();

            // Read stdout and stderr concurrently while enforcing timeout.
            var stdoutTask = process.StandardOutput.ReadToEndAsync();
            var stderrTask = process.StandardError.ReadToEndAsync();

            var timeoutMs = _options.Value.TimeoutMs;
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(timeoutMs);

            var exitTask = process.WaitForExitAsync(timeoutCts.Token);

            try
            {
                await exitTask;
            }
            catch (OperationCanceledException)
            {
                try { process.Kill(entireProcessTree: true); } catch { /* best effort */ }
                sw.Stop();
                return Fail(KernelFailureMode.Timeout,
                    $"Kernel exceeded timeout of {timeoutMs}ms",
                    startedAt, sw, kernelName, inputHash);
            }

            var stdout = await stdoutTask;
            var stderr = await stderrTask;
            sw.Stop();

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("Kernel {KernelName} exited with code {ExitCode}. stderr: {Stderr}",
                    kernelName, process.ExitCode, stderr);
                return Fail(KernelFailureMode.NonZeroExit,
                    $"Exit code {process.ExitCode}. stderr: {stderr}",
                    startedAt, sw, kernelName, inputHash);
            }

            KernelResponse<TResp>? parsed;
            try
            {
                parsed = JsonSerializer.Deserialize<KernelResponse<TResp>>(stdout, JsonOpts);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Kernel {KernelName} returned non-JSON stdout: {Stdout}", kernelName, stdout);
                return Fail(KernelFailureMode.InvalidJsonResponse,
                    $"JSON parse failed: {ex.Message}. stdout: {stdout}",
                    startedAt, sw, kernelName, inputHash);
            }

            if (parsed == null)
            {
                return Fail(KernelFailureMode.InvalidJsonResponse,
                    "Null response after deserialization",
                    startedAt, sw, kernelName, inputHash);
            }

            if (!parsed.Success)
            {
                return Fail(KernelFailureMode.KernelReportedError,
                    parsed.Error ?? "Kernel reported failure with no error message",
                    startedAt, sw, kernelName, inputHash);
            }

            var warnings = string.IsNullOrWhiteSpace(stderr)
                ? Array.Empty<string>()
                : new[] { stderr };

            return new KernelInvocationResult<TResp>(
                Success: true,
                KernelName: kernelName,
                KernelVersion: parsed.AuditEvent?.Hash,
                InputHash: inputHash,
                StartedAt: startedAt,
                CompletedAt: startedAt.AddMilliseconds(sw.ElapsedMilliseconds),
                DurationMs: (int)sw.ElapsedMilliseconds,
                Data: parsed.Data,
                AuditEvent: parsed.AuditEvent,
                Warnings: warnings,
                FailureMode: null,
                ErrorMessage: null);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Unexpected error invoking kernel {KernelName}", kernelName);
            return Fail(KernelFailureMode.NonZeroExit,
                $"Unexpected: {ex.Message}",
                startedAt, sw, kernelName, inputHash);
        }
    }

    private static KernelInvocationResult<TResp> Fail<TResp>(
        KernelFailureMode mode, string msg,
        DateTimeOffset startedAt, Stopwatch sw, string kernelName, string inputHash)
    {
        return new KernelInvocationResult<TResp>(
            Success: false,
            KernelName: kernelName,
            KernelVersion: null,
            InputHash: inputHash,
            StartedAt: startedAt,
            CompletedAt: startedAt.AddMilliseconds(sw.ElapsedMilliseconds),
            DurationMs: (int)sw.ElapsedMilliseconds,
            Data: default,
            AuditEvent: null,
            Warnings: Array.Empty<string>(),
            FailureMode: mode,
            ErrorMessage: msg);
    }

    private static string ComputeSha256(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
        var sb = new StringBuilder(64);
        foreach (var b in hash) sb.Append(b.ToString("x2"));
        return sb.ToString();
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~RustKernelProcessHost" 2>&1 | tail -15
```

Expected: All `MissingExecutable`, `InputHash_*`, `DurationMs` tests pass. The two `RealKernel_*` tests pass IF you first run `cd packages\terrabuild\kernels && cargo build --release`, otherwise they return early (skipped).

- [ ] **Step 5: Build the kernels in release mode so the real-kernel tests actually run**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\packages\terrabuild\kernels && cargo build --release 2>&1 | tail -5
```

Expected: `Finished release profile`.

- [ ] **Step 6: Re-run host tests — now real-kernel tests should execute**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~RustKernelProcessHost" 2>&1 | tail -15
```

Expected: 6/6 pass. `RealKernel_ReturnsSuccessForValidCostInput` confirms 309558.75 exact match.

- [ ] **Step 7: Commit**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && git add backend/src/TerraFusion.API/Configuration backend/src/TerraFusion.API/Services/Valuation/RustKernelProcessHost.cs backend/src/TerraFusion.API/Services/Valuation/IRustKernelProcessHost.cs backend/TerraFusion.API.Tests/Services/Valuation/RustKernelProcessHostTests.cs && git commit -m "feat(kernels): add RustKernelProcessHost — subprocess invoker with timeout, input hashing, typed failure modes"
```

---

### Task 4: Create CostKernelClient and ValuationKernelClient

**Why:** Typed wrappers that know their kernel's action name and payload type. They delegate to the host and return the result.

**Files:**
- Create: `backend/src/TerraFusion.API/Services/Valuation/CostKernelClient.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/ICostKernelClient.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/ValuationKernelClient.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/IValuationKernelClient.cs`
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/CostKernelClientTests.cs`
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/ValuationKernelClientTests.cs`

- [ ] **Step 1: Write the failing tests**

Create `backend/TerraFusion.API.Tests/Services/Valuation/CostKernelClientTests.cs`:

```csharp
using System.Collections.Generic;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class CostKernelClientTests
{
    [Fact]
    public async Task CalculateCostAsync_PassesActionAndPayloadToHost()
    {
        var host = new Mock<IRustKernelProcessHost>();
        host
            .Setup(h => h.InvokeAsync<CostKernelPayload, CostKernelResult>(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<KernelInvocation<CostKernelPayload>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelInvocationResult<CostKernelResult>(
                Success: true,
                KernelName: "terraforge.kernel.cost",
                KernelVersion: "git:abc123",
                InputHash: "hash",
                StartedAt: DateTimeOffset.UtcNow,
                CompletedAt: DateTimeOffset.UtcNow,
                DurationMs: 42,
                Data: new CostKernelResult(100.0, 10.0, 90.0),
                AuditEvent: null,
                Warnings: Array.Empty<string>(),
                FailureMode: null,
                ErrorMessage: null));

        var opts = Options.Create(new RustKernelsOptions
        {
            CostKernelPath = "/fake/path/cost.exe",
            ContractPackVersion = "1.0.0",
            ModuleApiVersion = "1.0.0",
        });

        var sut = new CostKernelClient(host.Object, opts, NullLogger<CostKernelClient>.Instance);

        var payload = new CostKernelPayload(
            new CostSubject("P1", new CostAttributes(1000.0, "GOOD", "AVERAGE")),
            new CostTables(100.0, new Dictionary<string, double> { ["GOOD"] = 1.0 }));

        var result = await sut.CalculateCostAsync(payload);

        Assert.True(result.Success);
        host.Verify(h => h.InvokeAsync<CostKernelPayload, CostKernelResult>(
            "/fake/path/cost.exe",
            "terraforge.kernel.cost",
            It.Is<KernelInvocation<CostKernelPayload>>(i =>
                i.Action == "calculate_cost" &&
                i.ContractPackVersion == "1.0.0" &&
                i.ModuleApiVersion == "1.0.0" &&
                i.Payload == payload &&
                !string.IsNullOrEmpty(i.RequestId)),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CalculateCostAsync_GeneratesUniqueRequestIdPerCall()
    {
        var captured = new List<string>();
        var host = new Mock<IRustKernelProcessHost>();
        host
            .Setup(h => h.InvokeAsync<CostKernelPayload, CostKernelResult>(
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<KernelInvocation<CostKernelPayload>>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, string, KernelInvocation<CostKernelPayload>, CancellationToken>(
                (_, _, inv, _) => captured.Add(inv.RequestId))
            .ReturnsAsync(new KernelInvocationResult<CostKernelResult>(
                true, "cost", null, "h", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 1,
                new CostKernelResult(1, 1, 1), null, Array.Empty<string>(), null, null));

        var opts = Options.Create(new RustKernelsOptions { CostKernelPath = "x" });
        var sut = new CostKernelClient(host.Object, opts, NullLogger<CostKernelClient>.Instance);

        var payload = new CostKernelPayload(
            new CostSubject("P", new CostAttributes(1, null, null)),
            new CostTables(1, new Dictionary<string, double>()));

        await sut.CalculateCostAsync(payload);
        await sut.CalculateCostAsync(payload);

        Assert.Equal(2, captured.Count);
        Assert.NotEqual(captured[0], captured[1]);
    }
}
```

Create `backend/TerraFusion.API.Tests/Services/Valuation/ValuationKernelClientTests.cs`:

```csharp
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class ValuationKernelClientTests
{
    [Fact]
    public async Task ValuateAsync_PassesValuateActionToHost()
    {
        var host = new Mock<IRustKernelProcessHost>();
        host
            .Setup(h => h.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<KernelInvocation<ValuationKernelPayload>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelInvocationResult<ValuationKernelResult>(
                true, "terraforge.kernel.valuation", "git:abc", "hash",
                DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 10,
                new ValuationKernelResult(100.0, new ValuationComponents(30.0, 70.0)),
                null, Array.Empty<string>(), null, null));

        var opts = Options.Create(new RustKernelsOptions
        {
            ValuationKernelPath = "/fake/valuation.exe",
        });

        var sut = new ValuationKernelClient(host.Object, opts, NullLogger<ValuationKernelClient>.Instance);

        var payload = new ValuationKernelPayload(
            new ValuationSubject("P1", JsonDocument.Parse("{}").RootElement),
            new ValuationCostBreakdown(100, 10, 90),
            new ValuationModel(30, null));

        var result = await sut.ValuateAsync(payload);

        Assert.True(result.Success);
        host.Verify(h => h.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
            "/fake/valuation.exe",
            "terraforge.kernel.valuation",
            It.Is<KernelInvocation<ValuationKernelPayload>>(i => i.Action == "valuate"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~KernelClient" 2>&1 | tail -10
```

Expected: FAIL — clients don't exist.

- [ ] **Step 3: Implement the clients**

Create `backend/src/TerraFusion.API/Services/Valuation/ICostKernelClient.cs`:

```csharp
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public interface ICostKernelClient
{
    Task<KernelInvocationResult<CostKernelResult>> CalculateCostAsync(
        CostKernelPayload payload,
        CancellationToken ct = default);
}
```

Create `backend/src/TerraFusion.API/Services/Valuation/CostKernelClient.cs`:

```csharp
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public class CostKernelClient : ICostKernelClient
{
    private const string KernelName = "terraforge.kernel.cost";
    private const string Action = "calculate_cost";

    private readonly IRustKernelProcessHost _host;
    private readonly IOptions<RustKernelsOptions> _options;
    private readonly ILogger<CostKernelClient> _logger;

    public CostKernelClient(
        IRustKernelProcessHost host,
        IOptions<RustKernelsOptions> options,
        ILogger<CostKernelClient> logger)
    {
        _host = host;
        _options = options;
        _logger = logger;
    }

    public async Task<KernelInvocationResult<CostKernelResult>> CalculateCostAsync(
        CostKernelPayload payload,
        CancellationToken ct = default)
    {
        var opts = _options.Value;
        var invocation = new KernelInvocation<CostKernelPayload>(
            ContractPackVersion: opts.ContractPackVersion,
            ModuleApiVersion: opts.ModuleApiVersion,
            RequestId: Guid.NewGuid().ToString(),
            Action: Action,
            Payload: payload);

        _logger.LogDebug("Invoking {KernelName} for parcel {ParcelId}",
            KernelName, payload.Subject.ParcelId);

        return await _host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            opts.CostKernelPath, KernelName, invocation, ct);
    }
}
```

Create `backend/src/TerraFusion.API/Services/Valuation/IValuationKernelClient.cs`:

```csharp
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public interface IValuationKernelClient
{
    Task<KernelInvocationResult<ValuationKernelResult>> ValuateAsync(
        ValuationKernelPayload payload,
        CancellationToken ct = default);
}
```

Create `backend/src/TerraFusion.API/Services/Valuation/ValuationKernelClient.cs`:

```csharp
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public class ValuationKernelClient : IValuationKernelClient
{
    private const string KernelName = "terraforge.kernel.valuation";
    private const string Action = "valuate";

    private readonly IRustKernelProcessHost _host;
    private readonly IOptions<RustKernelsOptions> _options;
    private readonly ILogger<ValuationKernelClient> _logger;

    public ValuationKernelClient(
        IRustKernelProcessHost host,
        IOptions<RustKernelsOptions> options,
        ILogger<ValuationKernelClient> logger)
    {
        _host = host;
        _options = options;
        _logger = logger;
    }

    public async Task<KernelInvocationResult<ValuationKernelResult>> ValuateAsync(
        ValuationKernelPayload payload,
        CancellationToken ct = default)
    {
        var opts = _options.Value;
        var invocation = new KernelInvocation<ValuationKernelPayload>(
            ContractPackVersion: opts.ContractPackVersion,
            ModuleApiVersion: opts.ModuleApiVersion,
            RequestId: Guid.NewGuid().ToString(),
            Action: Action,
            Payload: payload);

        _logger.LogDebug("Invoking {KernelName} for parcel {ParcelId}",
            KernelName, payload.Subject.ParcelId);

        return await _host.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
            opts.ValuationKernelPath, KernelName, invocation, ct);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~KernelClient" 2>&1 | tail -10
```

Expected: 3/3 pass.

- [ ] **Step 5: Commit**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && git add backend/src/TerraFusion.API/Services/Valuation/*.cs backend/TerraFusion.API.Tests/Services/Valuation/*KernelClientTests.cs && git commit -m "feat(kernels): add CostKernelClient and ValuationKernelClient — typed wrappers"
```

---

### Task 5: KernelValuationService + endpoint + DI wiring

**Why:** Compose the two clients into an end-to-end "compute cost then valuate" flow, expose as a new endpoint, wire into DI.

**Files:**
- Create: `backend/src/TerraFusion.API/Services/Valuation/IKernelValuationService.cs`
- Create: `backend/src/TerraFusion.API/Services/Valuation/KernelValuationService.cs`
- Create: `backend/src/TerraFusion.Core/DTOs/Kernel/KernelCostApproachRequest.cs`
- Create: `backend/src/TerraFusion.Core/DTOs/Kernel/KernelCostApproachResponse.cs`
- Modify: `backend/src/TerraFusion.API/Controllers/ValuationController.cs` — add one new endpoint
- Modify: `backend/src/TerraFusion.API/Program.cs` — register options + services
- Modify: `backend/src/TerraFusion.API/appsettings.json` — add RustKernels section
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/KernelValuationServiceTests.cs`
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/BoundaryGuardTests.cs`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/TerraFusion.Core/DTOs/Kernel/KernelCostApproachRequest.cs`:

```csharp
namespace TerraFusion.Core.DTOs.Kernel;

/// <summary>
/// Request to compute cost + valuation via Rust kernels for a parcel not yet
/// represented in canonical ValuationRecord / CamaCharacteristics.
/// </summary>
public record KernelCostApproachRequest(
    string ParcelId,
    double Sqft,
    string? Quality,
    string? Condition,
    double BaseRate,
    IReadOnlyDictionary<string, double> Modifiers,
    double LandValue,
    double? NeighborhoodFactor,
    double? LocationFactor);
```

Create `backend/src/TerraFusion.Core/DTOs/Kernel/KernelCostApproachResponse.cs`:

```csharp
namespace TerraFusion.Core.DTOs.Kernel;

public record KernelCostApproachResponse(
    string ParcelId,
    double ReplacementCost,
    double Depreciation,
    double Rcnld,
    double LandValue,
    double BuildingValue,
    double TotalValue,
    KernelProvenance Provenance);

public record KernelProvenance(
    string CostKernelHash,
    string ValuationKernelHash,
    string CostInputHash,
    string ValuationInputHash,
    int CostDurationMs,
    int ValuationDurationMs,
    string CostAuditEventId,
    string ValuationAuditEventId);
```

Create `backend/TerraFusion.API.Tests/Services/Valuation/KernelValuationServiceTests.cs`:

```csharp
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using TerraFusion.Core.DTOs.Kernel;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class KernelValuationServiceTests
{
    private static KernelInvocationResult<CostKernelResult> MakeCostOk(double rcnld = 90.0) =>
        new(true, "terraforge.kernel.cost", "git:cost-sha", "hash-c",
            DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 5,
            new CostKernelResult(100.0, 10.0, rcnld),
            new KernelAuditEvent("ce-1", "t", "system", "calculate_cost", "P1", "terraforge.kernel.cost", "git:cost-sha"),
            Array.Empty<string>(), null, null);

    private static KernelInvocationResult<ValuationKernelResult> MakeValOk(double total = 150.0) =>
        new(true, "terraforge.kernel.valuation", "git:val-sha", "hash-v",
            DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 5,
            new ValuationKernelResult(total, new ValuationComponents(50.0, total - 50.0)),
            new KernelAuditEvent("ve-1", "t", "system", "valuate", "P1", "terraforge.kernel.valuation", "git:val-sha"),
            Array.Empty<string>(), null, null);

    [Fact]
    public async Task ComputeCostWithKernelAsync_ChainsCostThenValuation()
    {
        var cost = new Mock<ICostKernelClient>();
        var valn = new Mock<IValuationKernelClient>();
        cost.Setup(c => c.CalculateCostAsync(It.IsAny<CostKernelPayload>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeCostOk(rcnld: 90.0));
        valn.Setup(v => v.ValuateAsync(It.IsAny<ValuationKernelPayload>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MakeValOk(total: 150.0));

        var sut = new KernelValuationService(cost.Object, valn.Object, NullLogger<KernelValuationService>.Instance);

        var req = new KernelCostApproachRequest(
            ParcelId: "P1", Sqft: 1850.0, Quality: "GOOD", Condition: "AVERAGE",
            BaseRate: 145.50,
            Modifiers: new Dictionary<string, double> { ["GOOD"] = 1.15 },
            LandValue: 65000.0,
            NeighborhoodFactor: 1.05, LocationFactor: 0.98);

        var result = await sut.ComputeCostWithKernelAsync(req);

        Assert.Equal("P1", result.ParcelId);
        Assert.Equal(90.0, result.Rcnld);
        Assert.Equal(150.0, result.TotalValue);
        Assert.Equal("git:cost-sha", result.Provenance.CostKernelHash);
        Assert.Equal("git:val-sha", result.Provenance.ValuationKernelHash);

        // Verify the valuation kernel receives the cost kernel's rcnld as input — wire check.
        valn.Verify(v => v.ValuateAsync(
            It.Is<ValuationKernelPayload>(p => p.CostBreakdown.Rcnld == 90.0),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ComputeCostWithKernelAsync_ThrowsWhenCostKernelFails()
    {
        var cost = new Mock<ICostKernelClient>();
        var valn = new Mock<IValuationKernelClient>();
        cost.Setup(c => c.CalculateCostAsync(It.IsAny<CostKernelPayload>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KernelInvocationResult<CostKernelResult>(
                false, "terraforge.kernel.cost", null, "h",
                DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 1,
                null, null, Array.Empty<string>(),
                KernelFailureMode.KernelReportedError, "boom"));

        var sut = new KernelValuationService(cost.Object, valn.Object, NullLogger<KernelValuationService>.Instance);

        var req = new KernelCostApproachRequest(
            "P1", 1000, null, null, 100, new Dictionary<string, double>(), 0, null, null);

        var ex = await Assert.ThrowsAsync<KernelValuationException>(
            () => sut.ComputeCostWithKernelAsync(req));
        Assert.Contains("boom", ex.Message);
        Assert.Equal(KernelFailureMode.KernelReportedError, ex.FailureMode);

        // Valuation kernel must not be called when cost fails.
        valn.Verify(v => v.ValuateAsync(It.IsAny<ValuationKernelPayload>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
```

Create `backend/TerraFusion.API.Tests/Services/Valuation/BoundaryGuardTests.cs`:

```csharp
using System.Linq;
using System.Reflection;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

/// <summary>
/// Guards that Forge-owned kernel clients are not referenced from Dais services.
/// Forge owns valuation math. Dais does not absorb it. Enforced via reflection.
/// </summary>
public class BoundaryGuardTests
{
    [Fact]
    public void DaisServices_DoNotReferenceKernelClients()
    {
        // Load TerraFusion.API assembly
        var apiAssembly = typeof(TerraFusion.API.Services.Valuation.CostKernelClient).Assembly;

        // Find all types in a Dais namespace (if any exist in this assembly)
        var daisTypes = apiAssembly.GetTypes()
            .Where(t => t.Namespace != null && t.Namespace.Contains(".Dais", System.StringComparison.OrdinalIgnoreCase))
            .ToList();

        // Find all methods on Dais types that reference a Kernel client
        foreach (var type in daisTypes)
        {
            var fields = type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            foreach (var f in fields)
            {
                var name = f.FieldType.FullName ?? "";
                Assert.False(
                    name.Contains("CostKernelClient") ||
                    name.Contains("ValuationKernelClient") ||
                    name.Contains("RustKernelProcessHost"),
                    $"Dais type {type.FullName} references kernel infrastructure via field {f.Name} ({name}) — Forge boundary violation");
            }
        }
    }

    [Fact]
    public void ControllerDoesNotInvokeKernelDirectly()
    {
        // The controller must delegate to IKernelValuationService, not to ICostKernelClient or IRustKernelProcessHost.
        var controllerType = typeof(TerraFusion.API.Controllers.ValuationController);
        var ctor = controllerType.GetConstructors().First();
        var paramTypes = ctor.GetParameters().Select(p => p.ParameterType.FullName ?? "").ToList();

        Assert.DoesNotContain(paramTypes, t => t.Contains("ICostKernelClient"));
        Assert.DoesNotContain(paramTypes, t => t.Contains("IValuationKernelClient"));
        Assert.DoesNotContain(paramTypes, t => t.Contains("IRustKernelProcessHost"));
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~KernelValuationService|FullyQualifiedName~BoundaryGuard" 2>&1 | tail -15
```

Expected: FAIL — service doesn't exist, controller endpoint not added.

- [ ] **Step 3: Implement the service**

Create `backend/src/TerraFusion.API/Services/Valuation/IKernelValuationService.cs`:

```csharp
using TerraFusion.Core.DTOs.Kernel;

namespace TerraFusion.API.Services.Valuation;

public interface IKernelValuationService
{
    Task<KernelCostApproachResponse> ComputeCostWithKernelAsync(
        KernelCostApproachRequest request,
        CancellationToken ct = default);
}
```

Create `backend/src/TerraFusion.API/Services/Valuation/KernelValuationService.cs`:

```csharp
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Services.Valuation.KernelContracts;
using TerraFusion.Core.DTOs.Kernel;

namespace TerraFusion.API.Services.Valuation;

public class KernelValuationException : Exception
{
    public KernelFailureMode? FailureMode { get; }
    public KernelValuationException(string message, KernelFailureMode? mode, Exception? inner = null)
        : base(message, inner) => FailureMode = mode;
}

public class KernelValuationService : IKernelValuationService
{
    private readonly ICostKernelClient _costClient;
    private readonly IValuationKernelClient _valuationClient;
    private readonly ILogger<KernelValuationService> _logger;

    private static readonly JsonElement EmptyAttributes = JsonDocument.Parse("{}").RootElement;

    public KernelValuationService(
        ICostKernelClient costClient,
        IValuationKernelClient valuationClient,
        ILogger<KernelValuationService> logger)
    {
        _costClient = costClient;
        _valuationClient = valuationClient;
        _logger = logger;
    }

    public async Task<KernelCostApproachResponse> ComputeCostWithKernelAsync(
        KernelCostApproachRequest request,
        CancellationToken ct = default)
    {
        // 1. Cost kernel
        var costPayload = new CostKernelPayload(
            Subject: new CostSubject(request.ParcelId,
                new CostAttributes(request.Sqft, request.Quality, request.Condition)),
            Tables: new CostTables(request.BaseRate, request.Modifiers));

        var costResult = await _costClient.CalculateCostAsync(costPayload, ct);

        if (!costResult.Success || costResult.Data == null)
        {
            throw new KernelValuationException(
                $"Cost kernel failed for {request.ParcelId}: {costResult.ErrorMessage}",
                costResult.FailureMode);
        }

        // 2. Valuation kernel — takes cost breakdown as input
        var valPayload = new ValuationKernelPayload(
            Subject: new ValuationSubject(request.ParcelId, EmptyAttributes),
            CostBreakdown: new ValuationCostBreakdown(
                costResult.Data.ReplacementCost,
                costResult.Data.Depreciation,
                costResult.Data.Rcnld),
            Model: new ValuationModel(
                request.LandValue,
                (request.NeighborhoodFactor.HasValue || request.LocationFactor.HasValue)
                    ? new AdjustmentFactors(request.NeighborhoodFactor, request.LocationFactor)
                    : null));

        var valResult = await _valuationClient.ValuateAsync(valPayload, ct);

        if (!valResult.Success || valResult.Data == null)
        {
            throw new KernelValuationException(
                $"Valuation kernel failed for {request.ParcelId}: {valResult.ErrorMessage}",
                valResult.FailureMode);
        }

        // 3. Compose domain response
        return new KernelCostApproachResponse(
            ParcelId: request.ParcelId,
            ReplacementCost: costResult.Data.ReplacementCost,
            Depreciation: costResult.Data.Depreciation,
            Rcnld: costResult.Data.Rcnld,
            LandValue: valResult.Data.Components.Land,
            BuildingValue: valResult.Data.Components.Building,
            TotalValue: valResult.Data.TotalValue,
            Provenance: new KernelProvenance(
                CostKernelHash: costResult.AuditEvent?.Hash ?? "unknown",
                ValuationKernelHash: valResult.AuditEvent?.Hash ?? "unknown",
                CostInputHash: costResult.InputHash,
                ValuationInputHash: valResult.InputHash,
                CostDurationMs: costResult.DurationMs,
                ValuationDurationMs: valResult.DurationMs,
                CostAuditEventId: costResult.AuditEvent?.EventId ?? "",
                ValuationAuditEventId: valResult.AuditEvent?.EventId ?? ""));
    }
}
```

- [ ] **Step 4: Add the controller endpoint**

Modify `backend/src/TerraFusion.API/Controllers/ValuationController.cs` — read the current file first to find where to add. Add ONE new action method that delegates to `IKernelValuationService`. **Do not touch any existing method.**

Minimal addition (place near end of class, before closing brace; confirm ctor already injects `IKernelValuationService` — Task 6 wires DI; if not yet wired, add private field + ctor param):

```csharp
// Inside ValuationController class — add to ctor signature:
private readonly IKernelValuationService _kernelValuation;
// Update ctor to accept + assign IKernelValuationService

/// <summary>
/// Kernel-backed cost + valuation compute path. Additive to CalculateCostApproach;
/// does not replace canonical DB-driven path.
/// </summary>
[HttpPost("kernel-cost-approach")]
public async Task<ActionResult<KernelCostApproachResponse>> KernelCostApproach(
    [FromBody] KernelCostApproachRequest request,
    CancellationToken ct)
{
    try
    {
        var result = await _kernelValuation.ComputeCostWithKernelAsync(request, ct);
        return Ok(result);
    }
    catch (KernelValuationException ex)
    {
        return StatusCode(502, new
        {
            error = ex.Message,
            failureMode = ex.FailureMode?.ToString(),
            kernel = true,
        });
    }
}
```

Add using directives at top of ValuationController.cs:

```csharp
using TerraFusion.API.Services.Valuation;
using TerraFusion.Core.DTOs.Kernel;
```

- [ ] **Step 5: Wire DI in Program.cs**

Modify `backend/src/TerraFusion.API/Program.cs` — add these registrations near existing `builder.Services.AddScoped` blocks for valuation:

```csharp
// RustKernels — options + clients + composite service
builder.Services.Configure<TerraFusion.API.Configuration.RustKernelsOptions>(
    builder.Configuration.GetSection(TerraFusion.API.Configuration.RustKernelsOptions.SectionName));
builder.Services.AddSingleton<TerraFusion.API.Services.Valuation.IRustKernelProcessHost,
                              TerraFusion.API.Services.Valuation.RustKernelProcessHost>();
builder.Services.AddScoped<TerraFusion.API.Services.Valuation.ICostKernelClient,
                           TerraFusion.API.Services.Valuation.CostKernelClient>();
builder.Services.AddScoped<TerraFusion.API.Services.Valuation.IValuationKernelClient,
                           TerraFusion.API.Services.Valuation.ValuationKernelClient>();
builder.Services.AddScoped<TerraFusion.API.Services.Valuation.IKernelValuationService,
                           TerraFusion.API.Services.Valuation.KernelValuationService>();
```

- [ ] **Step 6: Add appsettings section**

Modify `backend/src/TerraFusion.API/appsettings.json` — add top-level `"RustKernels"` section (merge with existing JSON, do not replace entire file):

```json
{
  "RustKernels": {
    "CostKernelPath": "../../packages/terrabuild/kernels/target/release/terraforge-kernel-cost.exe",
    "ValuationKernelPath": "../../packages/terrabuild/kernels/target/release/terraforge-kernel-valuation.exe",
    "TimeoutMs": 5000,
    "ContractPackVersion": "1.0.0",
    "ModuleApiVersion": "1.0.0",
    "Enabled": true
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet build TerraFusion.sln 2>&1 | tail -5 && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~KernelValuation|FullyQualifiedName~BoundaryGuard" 2>&1 | tail -15
```

Expected: Build succeeds. 4/4 tests pass (2 service + 2 boundary guard).

- [ ] **Step 8: Commit**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && git add backend/src/TerraFusion.Core/DTOs/Kernel backend/src/TerraFusion.API/Services/Valuation/IKernelValuationService.cs backend/src/TerraFusion.API/Services/Valuation/KernelValuationService.cs backend/src/TerraFusion.API/Controllers/ValuationController.cs backend/src/TerraFusion.API/Program.cs backend/src/TerraFusion.API/appsettings.json backend/TerraFusion.API.Tests/Services/Valuation/KernelValuationServiceTests.cs backend/TerraFusion.API.Tests/Services/Valuation/BoundaryGuardTests.cs && git commit -m "feat(kernels): KernelValuationService + POST /api/valuation/kernel-cost-approach endpoint + DI wiring"
```

---

### Task 6: End-to-end integration test with real kernel binary

**Why:** Prove the whole chain works against the compiled Rust binary with the production `appsettings.json` path. Repeatedly runs the same input to prove determinism.

**Files:**
- Create: `backend/TerraFusion.API.Tests/Services/Valuation/KernelValuationServiceIntegrationTests.cs`

- [ ] **Step 1: Write the integration test**

```csharp
using System.IO;
using System.Collections.Generic;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.Core.DTOs.Kernel;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class KernelValuationServiceIntegrationTests
{
    private static readonly string? CostKernelPath = TryFindKernel("terraforge-kernel-cost");
    private static readonly string? ValuationKernelPath = TryFindKernel("terraforge-kernel-valuation");

    private static bool KernelsAvailable =>
        CostKernelPath != null && ValuationKernelPath != null;

    private static KernelValuationService CreateSut()
    {
        var opts = Options.Create(new RustKernelsOptions
        {
            CostKernelPath = CostKernelPath!,
            ValuationKernelPath = ValuationKernelPath!,
            TimeoutMs = 10000,
            ContractPackVersion = "1.0.0",
            ModuleApiVersion = "1.0.0",
        });
        var host = new RustKernelProcessHost(opts, NullLogger<RustKernelProcessHost>.Instance);
        var cost = new CostKernelClient(host, opts, NullLogger<CostKernelClient>.Instance);
        var valn = new ValuationKernelClient(host, opts, NullLogger<ValuationKernelClient>.Instance);
        return new KernelValuationService(cost, valn, NullLogger<KernelValuationService>.Instance);
    }

    [Fact]
    public async Task RealKernels_ComputeExpectedValue()
    {
        if (!KernelsAvailable) return; // skip if kernels not built

        var sut = CreateSut();
        var req = new KernelCostApproachRequest(
            ParcelId: "INT-001",
            Sqft: 1850.0, Quality: "GOOD", Condition: "AVERAGE",
            BaseRate: 145.50,
            Modifiers: new Dictionary<string, double>
            {
                ["GOOD"] = 1.15,
                ["AVERAGE"] = 1.0,
                ["DepreciationRate"] = 0.10,
            },
            LandValue: 65000.0,
            NeighborhoodFactor: 1.05,
            LocationFactor: 0.98);

        var result = await sut.ComputeCostWithKernelAsync(req);

        // Cost: 1850 * 145.50 * 1.15 * 1.0 = 309558.75
        Assert.Equal(309558.75, result.ReplacementCost, 2);
        // Depreciation: 0.10 * 309558.75 = 30955.875
        Assert.Equal(30955.875, result.Depreciation, 2);
        // Rcnld: 309558.75 - 30955.875 = 278602.875
        Assert.Equal(278602.875, result.Rcnld, 2);
        // Valuation: building = 278602.875 * 1.05 * 0.98 = 286679.56 (approx)
        // total = 65000 + 286679.56 = 351679.56 (approx)
        Assert.InRange(result.TotalValue, 351000, 352500);
        Assert.Equal(65000.0, result.LandValue, 2);
        // Provenance populated
        Assert.StartsWith("git:", result.Provenance.CostKernelHash);
        Assert.StartsWith("git:", result.Provenance.ValuationKernelHash);
        Assert.NotEmpty(result.Provenance.CostAuditEventId);
        Assert.True(result.Provenance.CostDurationMs >= 0);
    }

    [Fact]
    public async Task RealKernels_SameInputProducesSameOutput()
    {
        if (!KernelsAvailable) return;

        var sut = CreateSut();
        var req = new KernelCostApproachRequest(
            "INT-DET", 1850.0, "GOOD", "AVERAGE", 145.50,
            new Dictionary<string, double> { ["GOOD"] = 1.15, ["AVERAGE"] = 1.0 },
            65000.0, 1.05, 0.98);

        var r1 = await sut.ComputeCostWithKernelAsync(req);
        var r2 = await sut.ComputeCostWithKernelAsync(req);

        Assert.Equal(r1.ReplacementCost, r2.ReplacementCost);
        Assert.Equal(r1.Depreciation, r2.Depreciation);
        Assert.Equal(r1.Rcnld, r2.Rcnld);
        Assert.Equal(r1.TotalValue, r2.TotalValue);
        Assert.Equal(r1.LandValue, r2.LandValue);
        Assert.Equal(r1.BuildingValue, r2.BuildingValue);
        // Same input → same input hash
        Assert.Equal(r1.Provenance.CostInputHash, r2.Provenance.CostInputHash);
        Assert.Equal(r1.Provenance.ValuationInputHash, r2.Provenance.ValuationInputHash);
        // Different audit event IDs prove kernel actually ran twice
        Assert.NotEqual(r1.Provenance.CostAuditEventId, r2.Provenance.CostAuditEventId);
    }

    private static string? TryFindKernel(string name)
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var release = Path.Combine(dir.FullName, "packages", "terrabuild", "kernels", "target", "release", $"{name}.exe");
            if (File.Exists(release)) return release;
            var debug = Path.Combine(dir.FullName, "packages", "terrabuild", "kernels", "target", "debug", $"{name}.exe");
            if (File.Exists(debug)) return debug;
            dir = dir.Parent;
        }
        return null;
    }
}
```

- [ ] **Step 2: Ensure release build of kernels exists**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\packages\terrabuild\kernels && cargo build --release 2>&1 | tail -3
```

Expected: `Finished release profile`.

- [ ] **Step 3: Run integration test**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.API.Tests\TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~KernelValuationServiceIntegration" 2>&1 | tail -15
```

Expected: 2/2 pass. Both the exact-value test and the determinism test.

- [ ] **Step 4: Commit**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && git add backend/TerraFusion.API.Tests/Services/Valuation/KernelValuationServiceIntegrationTests.cs && git commit -m "test(kernels): integration test — real kernels produce expected value deterministically"
```

---

### Task 7: Proof gates — full build, full test, ripgrep sanity

**Why:** The user explicitly called out these gates. Not merging without them green.

**Files:** None (verification).

- [ ] **Step 1: Build the whole backend**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet build TerraFusion.sln 2>&1 | tail -10
```

Expected: `Build succeeded`. Warnings acceptable but count should not exceed baseline from Task 1.

- [ ] **Step 2: Run full test suite**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\backend && dotnet test TerraFusion.sln 2>&1 | tail -15
```

Expected: Zero new failures vs baseline from Task 1.

- [ ] **Step 3: Frontend type-check (required by user's proof gates)**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels\frontend && pnpm run type-check 2>&1 | tail -10
```

Expected: No new TypeScript errors. This slice did not touch the frontend, so no regressions expected.

- [ ] **Step 4: Sanity grep — prove the kernel plumbing is what's referenced**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && rg -n "CostKernelClient|ValuationKernelClient|RustKernelProcessHost|KernelValuationService" backend/src backend/TerraFusion.API.Tests 2>&1 | head -30
```

Expected: Multiple hits across the kernel contract/service/test files — confirms the new layer exists and is wired.

- [ ] **Step 5: Sanity grep — the 0.87m multiplier is intentionally unchanged**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && rg -n "codBefore \* 0\.87m|prdBefore \* 0\.98m|excBefore \* 0\.62" backend/src 2>&1
```

Expected: 3 hits, all in `CountyStudyService.cs`. These are ratio-study scenario projection multipliers, explicitly out of scope for Track A — documented in the Scope Exclusions section of this doc.

- [ ] **Step 6: No commit needed — diagnostic pass**

Record pass/fail of each gate for the PR description.

---

### Task 8: Final consolidation commit

**Why:** User specified an exact final commit message. Keep it.

**Files:** The doc itself (`2026-04-22-track-a-rust-kernel-integration.md`) should now be committed as part of the feature branch if not already.

- [ ] **Step 1: Check outstanding changes**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && git status 2>&1
```

- [ ] **Step 2: If any doc or config drift remains, stage and commit**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && git add -A && git commit -m "feat: wire Rust cost and valuation kernels into Forge backend with deterministic JSON contracts and provenance. The math engine ate the fake multiplier and asked for court exhibits."
```

If no outstanding changes (all committed in Tasks 2-6), skip this step.

- [ ] **Step 3: Final log check**

```
cd C:\Users\bsval\.config\superpowers\worktrees\terrafusion_os_1.0\track-a-rust-kernels && git log --oneline chore/terra-levy-parity-sync..HEAD 2>&1
```

Expected: 5-6 commits on the branch, each feat or test, clear and independent.

---

## Save State for Next Session

- **Track A status:** executed in worktree at `C:/Users/bsval/.config/superpowers/worktrees/terrafusion_os_1.0/track-a-rust-kernels`, branch `feature/track-a-rust-kernel-integration`.
- **Canonical sources on GitHub not pulled** — `bsvalues/terrafusion-os-core`, `bsvalues/TerraBuild`, `bsvalues/terrafusion-shared` remain untouched. Decision deferred to Track B/C.
- **The `0.87m` / `0.98m` / `0.62` multipliers in `CountyStudyService.PreviewScenarioImpactAsync` are still placeholder math.** They require a ratio-study-projection kernel (future Track A-2). Separate scope, separate session.
- **Tauri integration not done.** Workspace on E: is broken-as-declared (missing `shared/rust-services/` + `infrastructure/rust-tools/`). `src-tauri.zip` is a single orchestrator app not a workspace. Defer until product decides native desktop distribution strategy.
- **After Track A merge:**
  - Track B if native/Tauri matters soon — requires extraction + shared crate recovery
  - Track C if consolidation pain > shipping pain — requires vendoring the Oct-2025 GitHub split
- **Blockers watched during Track A:**
  - Executable path resolution ✓ handled via `AppContext.BaseDirectory` walk
  - Timeout/error mapping ✓ typed `KernelFailureMode` enum
  - Audit events in response payload ✓ `KernelProvenance` carries hash + event IDs
- **Immediate follow-up item if consumer wants to use this:** wire the kernel endpoint into the county-studio frontend (`frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts` could gain a `kernelCostApproach` method). Separate slice.
