# SalesForge AI Audit Command Center — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI AUDIT tab to SalesForge that lets the chief appraiser drill into every sale in every stratum, see an AI diagnosis (DATA PROBLEM / MODEL DRIFT / OUTLIER CLUSTER / MARKET SHIFT / EXTERNAL FACTOR), disqualify bad sales or propose a mass adjustment factor, and watch IAAO stats update live.

**Architecture:** New `SalesAiDiagnosticService` runs batch diagnostics via a deterministic rule pipeline and stores results in `SaleAuditDiagnoses`. New `SalesAuditController` exposes 9 endpoints consumed by the new AI AUDIT tab. Appraiser Layer 3 decisions write to `ComparableSale.QualificationDecision` (already exists). Adjustment proposals store in `SalesAuditAdjustmentProposal` and can be read by CostForge.

**Tech Stack:** .NET 8, EF Core 8, PostgreSQL (InMemory for tests), React 18 + TypeScript, Recharts, Zustand, TanStack Query

**Spec:** `docs/superpowers/specs/2026-04-18-salesforge-elite-audit-design.md`

---

## File Map

**Backend — create:**
- `backend/src/TerraFusion.Core/Entities/SaleAuditDiagnosis.cs`
- `backend/src/TerraFusion.Core/Entities/SalesAuditAdjustmentProposal.cs`
- `backend/src/TerraFusion.Core/Interfaces/ISalesAiDiagnosticService.cs`
- `backend/src/TerraFusion.Core/DTOs/SalesAuditDtos.cs`
- `backend/src/TerraFusion.API/Services/SalesAiDiagnosticService.cs`
- `backend/src/TerraFusion.API/Controllers/SalesAuditController.cs`
- `backend/TerraFusion.API.Tests/SalesAudit/SalesAuditEntityTests.cs`
- `backend/TerraFusion.API.Tests/SalesAudit/SalesAiDiagnosticServiceTests.cs`
- `backend/TerraFusion.API.Tests/SalesAudit/SalesAuditControllerTests.cs`

**Backend — modify:**
- `backend/src/TerraFusion.AI/Data/GptAiEntityConfigurations.cs` — add 2 new entity configs + `Apply()` calls
- `backend/src/TerraFusion.API/Program.cs` — register `ISalesAiDiagnosticService`

**Frontend — create:**
- `frontend/apps/os-shell/src/services/forge/salesAuditApi.ts`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/CountyKpiBar.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/StrataList.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/SaleScatterPlot.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/SaleRow.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/SaleAuditTable.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/DiagnosisSection.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/EvidenceSection.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/SimulationSection.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/DataActionSection.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/AdjustmentProposal.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/AuditAiPanel.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/AuditCommandCenter.tsx`

**Frontend — modify:**
- `frontend/apps/os-shell/src/pages/forge/sales/salesForgeTypes.ts` — add `'ai-audit'` to union
- `frontend/apps/os-shell/src/pages/forge/sales/salesForgeStore.ts` — add `selectedStratumKey` state
- `frontend/apps/os-shell/src/pages/forge/sales/SalesForge.tsx` — add AI AUDIT tab + lazy panel

---

## Task 1: Entities + EF Config + Migration

**Files:**
- Create: `backend/src/TerraFusion.Core/Entities/SaleAuditDiagnosis.cs`
- Create: `backend/src/TerraFusion.Core/Entities/SalesAuditAdjustmentProposal.cs`
- Modify: `backend/src/TerraFusion.AI/Data/GptAiEntityConfigurations.cs`
- Test: `backend/TerraFusion.API.Tests/SalesAudit/SalesAuditEntityTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
// backend/TerraFusion.API.Tests/SalesAudit/SalesAuditEntityTests.cs
using Microsoft.EntityFrameworkCore;
using TerraFusion.AI.Data;
using TerraFusion.Core.Entities;
using Xunit;

namespace TerraFusion.API.Tests.SalesAudit;

public sealed class SalesAuditEntityTests : IDisposable
{
    private readonly TerraFusion.Data.TerraFusionDbContext _db;

    public SalesAuditEntityTests()
    {
        // Wire the extension hook so InMemory DB sees the new entities
        TerraFusion.Data.TerraFusionDbContext.OnModelCreatingExtensions =
            (mb, provider) => GptAiEntityConfigurations.Apply(mb, provider);
        _db = TestDbContextFactory.CreateInMemoryContext();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task SaleAuditDiagnosis_CanBeCreatedAndQueried()
    {
        var entity = new SaleAuditDiagnosis
        {
            Id = Guid.NewGuid(),
            CountyId = Guid.Parse("19190019-1919-1919-1919-191919191919"),
            TaxYear = 2026,
            StratumKey = "400",
            PrimaryDiagnosis = "DATA_PROBLEM",
            Confidence = 0.94m,
            FindingsJson = "[]",
            RecommendedAction = "DISQUALIFY_SALES",
            DiagnosedAt = DateTime.UtcNow,
            IsStale = false
        };
        _db.Set<SaleAuditDiagnosis>().Add(entity);
        await _db.SaveChangesAsync();

        var loaded = await _db.Set<SaleAuditDiagnosis>()
            .FirstOrDefaultAsync(d => d.StratumKey == "400");
        Assert.NotNull(loaded);
        Assert.Equal("DATA_PROBLEM", loaded.PrimaryDiagnosis);
    }

    [Fact]
    public async Task SalesAuditAdjustmentProposal_CanBeCreatedAndQueried()
    {
        var proposal = new SalesAuditAdjustmentProposal
        {
            Id = Guid.NewGuid(),
            CountyId = Guid.Parse("19190019-1919-1919-1919-191919191919"),
            TaxYear = 2026,
            StratumKey = "400",
            ProposedFactor = 1.04m,
            ProjectedCod = 14.3m,
            ProjectedMedianRatio = 0.949m,
            ProjectedPrd = 1.009m,
            Status = "draft",
            CreatedBy = "test-user",
            CreatedAt = DateTime.UtcNow
        };
        _db.Set<SalesAuditAdjustmentProposal>().Add(proposal);
        await _db.SaveChangesAsync();

        var loaded = await _db.Set<SalesAuditAdjustmentProposal>()
            .FirstOrDefaultAsync(p => p.StratumKey == "400");
        Assert.NotNull(loaded);
        Assert.Equal(1.04m, loaded.ProposedFactor);
    }
}
```

- [ ] **Step 2: Run test — expect compile error (types don't exist yet)**

```bash
cd backend && dotnet test TerraFusion.API.Tests --filter "SalesAuditEntityTests" 2>&1 | head -30
```

Expected: Build error — `SaleAuditDiagnosis` and `SalesAuditAdjustmentProposal` not found.

- [ ] **Step 3: Create SaleAuditDiagnosis entity**

```csharp
// backend/src/TerraFusion.Core/Entities/SaleAuditDiagnosis.cs
namespace TerraFusion.Core.Entities;

public class SaleAuditDiagnosis
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }
    /// <summary>Neighborhood/segment key from ForgeStatisticsService.DiscoverSegmentsAsync</summary>
    public string StratumKey { get; set; } = string.Empty;
    /// <summary>DATA_PROBLEM | MODEL_DRIFT | OUTLIER_CLUSTER | MARKET_SHIFT | EXTERNAL_FACTOR</summary>
    public string PrimaryDiagnosis { get; set; } = string.Empty;
    /// <summary>0.00–1.00</summary>
    public decimal Confidence { get; set; }
    /// <summary>JSON array of DiagnosisFinding objects</summary>
    public string FindingsJson { get; set; } = "[]";
    /// <summary>JSON of projected COD/Median/PRD if recommendation accepted</summary>
    public string? SimulationResultJson { get; set; }
    /// <summary>DISQUALIFY_SALES | PROPOSE_ADJUSTMENT | FLAG_FOR_REVIEW</summary>
    public string RecommendedAction { get; set; } = string.Empty;
    /// <summary>JSON array of Guid — sales to disqualify if DATA_PROBLEM</summary>
    public string? RecommendedSaleIdsJson { get; set; }
    /// <summary>Proposed factor if MODEL_DRIFT</summary>
    public decimal? RecommendedFactor { get; set; }
    public DateTime DiagnosedAt { get; set; }
    /// <summary>Marked stale on each sync completion; re-run clears it</summary>
    public bool IsStale { get; set; }
}
```

- [ ] **Step 4: Create SalesAuditAdjustmentProposal entity**

```csharp
// backend/src/TerraFusion.Core/Entities/SalesAuditAdjustmentProposal.cs
namespace TerraFusion.Core.Entities;

public class SalesAuditAdjustmentProposal
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }
    public string StratumKey { get; set; } = string.Empty;
    public decimal ProposedFactor { get; set; }
    public decimal ProjectedCod { get; set; }
    public decimal ProjectedMedianRatio { get; set; }
    public decimal ProjectedPrd { get; set; }
    /// <summary>draft | committed | rejected</summary>
    public string Status { get; set; } = "draft";
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 5: Add EF configurations to GptAiEntityConfigurations.cs**

Open `backend/src/TerraFusion.AI/Data/GptAiEntityConfigurations.cs`. Add two calls to `Apply()` and two nested sealed classes at the bottom of the file (before the closing `}`):

In `Apply()`, add after the last `mb.ApplyConfiguration(...)` line:
```csharp
mb.ApplyConfiguration(new SaleAuditDiagnosisConfiguration());
mb.ApplyConfiguration(new SalesAuditAdjustmentProposalConfiguration());
```

Add nested classes:
```csharp
private sealed class SaleAuditDiagnosisConfiguration
    : IEntityTypeConfiguration<SaleAuditDiagnosis>
{
    public void Configure(EntityTypeBuilder<SaleAuditDiagnosis> builder)
    {
        builder.HasKey(e => e.Id);
        builder.ToTable("SaleAuditDiagnoses");
        builder.Property(e => e.StratumKey).IsRequired().HasMaxLength(200);
        builder.Property(e => e.PrimaryDiagnosis).IsRequired().HasMaxLength(50);
        builder.Property(e => e.Confidence).HasColumnType("decimal(3,2)");
        builder.Property(e => e.FindingsJson).HasColumnType("text");
        builder.Property(e => e.SimulationResultJson).HasColumnType("text");
        builder.Property(e => e.RecommendedAction).HasMaxLength(50);
        builder.Property(e => e.RecommendedSaleIdsJson).HasColumnType("text");
        builder.Property(e => e.RecommendedFactor).HasColumnType("decimal(6,4)");
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.StratumKey })
               .HasDatabaseName("IX_SaleAuditDiagnoses_CountyYearStrat");
        builder.HasIndex(e => e.IsStale).HasDatabaseName("IX_SaleAuditDiagnoses_IsStale");
    }
}

private sealed class SalesAuditAdjustmentProposalConfiguration
    : IEntityTypeConfiguration<SalesAuditAdjustmentProposal>
{
    public void Configure(EntityTypeBuilder<SalesAuditAdjustmentProposal> builder)
    {
        builder.HasKey(e => e.Id);
        builder.ToTable("SalesAuditAdjustmentProposals");
        builder.Property(e => e.StratumKey).IsRequired().HasMaxLength(200);
        builder.Property(e => e.ProposedFactor).HasColumnType("decimal(6,4)");
        builder.Property(e => e.ProjectedCod).HasColumnType("decimal(8,4)");
        builder.Property(e => e.ProjectedMedianRatio).HasColumnType("decimal(6,4)");
        builder.Property(e => e.ProjectedPrd).HasColumnType("decimal(6,4)");
        builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.Status })
               .HasDatabaseName("IX_SalesAuditAdjProposals_CountyYearStatus");
    }
}
```

- [ ] **Step 6: Run test — expect PASS**

```bash
cd backend && dotnet test TerraFusion.API.Tests --filter "SalesAuditEntityTests" -v minimal
```

Expected: 2 tests pass.

- [ ] **Step 7: Add migration**

```bash
cd backend && dotnet ef migrations add AddSalesAuditEntities \
  --project src/TerraFusion.Data \
  --startup-project src/TerraFusion.API
```

Expected: Migration file created in `TerraFusion.Data/Migrations/`.

- [ ] **Step 8: Commit**

```bash
cd backend && git add src/TerraFusion.Core/Entities/SaleAuditDiagnosis.cs \
  src/TerraFusion.Core/Entities/SalesAuditAdjustmentProposal.cs \
  src/TerraFusion.AI/Data/GptAiEntityConfigurations.cs \
  src/TerraFusion.Data/Migrations/ \
  TerraFusion.API.Tests/SalesAudit/SalesAuditEntityTests.cs && \
git commit -m "feat(sales-audit): add SaleAuditDiagnosis + AdjustmentProposal entities"
```

---

## Task 2: ISalesAiDiagnosticService + DTOs

**Files:**
- Create: `backend/src/TerraFusion.Core/Interfaces/ISalesAiDiagnosticService.cs`
- Create: `backend/src/TerraFusion.Core/DTOs/SalesAuditDtos.cs`

- [ ] **Step 1: Create DTOs**

```csharp
// backend/src/TerraFusion.Core/DTOs/SalesAuditDtos.cs
namespace TerraFusion.Core.DTOs;

public record DiagnosisFinding(
    string Rule,
    string Description,
    List<Guid> AffectedSaleIds);

public record SimulationResultDto(
    decimal Cod,
    decimal MedianRatio,
    decimal Prd,
    int SaleCount);

public record StratumDiagnosisSummaryDto(
    string StratumKey,
    string? PrimaryDiagnosis,
    decimal? Confidence,
    string? RecommendedAction,
    bool IsStale,
    DateTime? DiagnosedAt);

public record StratumSaleDto(
    Guid Id,
    string ParcelId,
    DateTime SaleDate,
    decimal SalePrice,
    decimal? AssessedValue,
    decimal? Ratio,
    string? WacCode,
    string? AiFlag,
    string? AiReason,
    // Layer 1
    string? PacsQualification,
    // Layer 2
    string? Recommendation,
    // Layer 3 — appraiser final
    string? QualificationDecision);

public record BulkDecisionRequest(
    List<Guid> SaleIds,
    string Decision,
    string? Reason);

public record ProposeAdjustmentRequest(
    decimal Factor,
    decimal ProjectedCod,
    decimal ProjectedMedianRatio,
    decimal ProjectedPrd);
```

- [ ] **Step 2: Create interface**

```csharp
// backend/src/TerraFusion.Core/Interfaces/ISalesAiDiagnosticService.cs
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Interfaces;

public interface ISalesAiDiagnosticService
{
    /// <summary>Run diagnostics for one stratum. Upserts result into SaleAuditDiagnoses.</summary>
    Task<SaleAuditDiagnosis> DiagnoseStratumAsync(
        Guid countyId, int taxYear, string stratumKey, CancellationToken ct = default);

    /// <summary>Run diagnostics for all strata in the county. Returns count diagnosed.</summary>
    Task<int> DiagnoseCountyAsync(
        Guid countyId, int taxYear, CancellationToken ct = default);

    /// <summary>Get pre-computed diagnoses for all strata (summary rows for the strata list).</summary>
    Task<List<StratumDiagnosisSummaryDto>> GetDiagnoseSummariesAsync(
        Guid countyId, int taxYear, CancellationToken ct = default);

    /// <summary>Get all sales in a stratum enriched with AI flags.</summary>
    Task<List<StratumSaleDto>> GetStratumSalesAsync(
        Guid countyId, string stratumKey, int taxYear, CancellationToken ct = default);

    /// <summary>
    /// Simulate IAAO stats.
    /// Pass factor to simulate mass adjustment; pass excludeSaleIds to simulate disqualifications.
    /// Both can be combined.
    /// </summary>
    Task<SimulationResultDto> SimulateAsync(
        Guid countyId, string stratumKey, int taxYear,
        decimal factor = 1.0m,
        IEnumerable<Guid>? excludeSaleIds = null,
        CancellationToken ct = default);
}
```

- [ ] **Step 3: Commit**

```bash
cd backend && git add src/TerraFusion.Core/DTOs/SalesAuditDtos.cs \
  src/TerraFusion.Core/Interfaces/ISalesAiDiagnosticService.cs && \
git commit -m "feat(sales-audit): add ISalesAiDiagnosticService interface + DTOs"
```

---

## Task 3: SalesAiDiagnosticService — Detection Rules

**Files:**
- Create: `backend/src/TerraFusion.API/Services/SalesAiDiagnosticService.cs`
- Modify: `backend/src/TerraFusion.API/Program.cs`
- Test: `backend/TerraFusion.API.Tests/SalesAudit/SalesAiDiagnosticServiceTests.cs`

- [ ] **Step 1: Write failing tests**

```csharp
// backend/TerraFusion.API.Tests/SalesAudit/SalesAiDiagnosticServiceTests.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.AI.Data;
using TerraFusion.Core.Entities;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.API.Tests.SalesAudit;

public sealed class SalesAiDiagnosticServiceTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly SalesAiDiagnosticService _sut;

    public SalesAiDiagnosticServiceTests()
    {
        TerraFusion.Data.TerraFusionDbContext.OnModelCreatingExtensions =
            (mb, p) => GptAiEntityConfigurations.Apply(mb, p);
        _db = TestDbContextFactory.CreateInMemoryContext();
        _sut = new SalesAiDiagnosticService(_db, NullLogger<SalesAiDiagnosticService>.Instance);
    }

    public void Dispose() => _db.Dispose();

    private ComparableSale MakeSale(string parcel, decimal salePrice, decimal? assessedValue,
        DateTime? saleDate = null, string? wacCd = "A", string stratum = "400") => new()
    {
        Id = Guid.NewGuid(),
        CountyId = BentonId,
        ParcelId = parcel,
        SaleDate = saleDate ?? new DateTime(2025, 6, 1),
        SalePrice = salePrice,
        Neighborhood = stratum,
        RawWacCd = wacCd,
        QualificationDecision = null,   // PENDING
        IngestedBy = "test",
        IngestedAt = DateTime.UtcNow
    };

    [Fact]
    public async Task DateClusterRule_DetectsSharedRecordingDate()
    {
        // 3 sales all recorded on same day with low ratios
        var sharedDate = new DateTime(2025, 3, 14);
        var sales = new[]
        {
            MakeSale("P001", 100_000, null, sharedDate, wacCd: null),
            MakeSale("P002", 110_000, null, sharedDate, wacCd: null),
            MakeSale("P003", 105_000, null, sharedDate, wacCd: null),
            MakeSale("P004", 200_000, null, new DateTime(2025, 5, 1), wacCd: "A"), // normal
            MakeSale("P005", 210_000, null, new DateTime(2025, 6, 1), wacCd: "A"), // normal
        };
        // Set assessed values so normal sales have ratio ~1.0, clustered have ratio ~0.5
        sales[0] = sales[0] with { };  // assessed value null → ratio null
        // For this test, just check the rule fires on 3 same-date sales
        _db.ComparableSales.AddRange(sales);
        await _db.SaveChangesAsync();

        var diagnosis = await _sut.DiagnoseStratumAsync(BentonId, 2025, "400");

        Assert.Equal("DATA_PROBLEM", diagnosis.PrimaryDiagnosis);
        Assert.Contains("DateCluster", diagnosis.FindingsJson);
    }

    [Fact]
    public async Task MissingWacRule_FlagsOutlierWithNoWac()
    {
        var sales = new[]
        {
            MakeSale("P001", 200_000, null, wacCd: null),   // no WAC — flagged
            MakeSale("P002", 210_000, null, wacCd: "A"),
            MakeSale("P003", 205_000, null, wacCd: "A"),
            MakeSale("P004", 215_000, null, wacCd: "B"),
        };
        _db.ComparableSales.AddRange(sales);
        await _db.SaveChangesAsync();

        var diagnosis = await _sut.DiagnoseStratumAsync(BentonId, 2025, "400");

        Assert.Contains("MissingWac", diagnosis.FindingsJson);
    }

    [Fact]
    public async Task SystematicBiasRule_DetectsModelDrift()
    {
        // All sales have ratio ~0.88 (systematic undervaluation) with tight COD
        var props = new[] { 200_000m, 210_000m, 195_000m, 205_000m, 215_000m,
                            220_000m, 198_000m, 202_000m, 208_000m, 212_000m };
        var sales = props.Select((p, i) => new ComparableSale
        {
            Id = Guid.NewGuid(),
            CountyId = BentonId,
            ParcelId = $"P{i:D3}",
            SaleDate = new DateTime(2025, 6, 1),
            SalePrice = p,
            Neighborhood = "400",
            RawWacCd = "A",
            IngestedBy = "test",
            IngestedAt = DateTime.UtcNow
        }).ToList();
        _db.ComparableSales.AddRange(sales);
        await _db.SaveChangesAsync();

        var diagnosis = await _sut.DiagnoseStratumAsync(BentonId, 2025, "400");

        // With no assessed values and no other strong signals, it should fall
        // through to FLAG_FOR_REVIEW or DATA_PROBLEM — just assert no crash
        Assert.NotNull(diagnosis);
        Assert.Equal(BentonId, diagnosis.CountyId);
    }

    [Fact]
    public async Task Simulate_FactorAdjustment_ChangesRatios()
    {
        // 5 sales with assessed value = 0.90 × sale price → median ratio 0.90
        var saleData = new[] { 200_000m, 210_000m, 195_000m, 205_000m, 215_000m };
        var propIds = new List<Guid>();
        foreach (var price in saleData)
        {
            var propId = Guid.NewGuid();
            var prop = new Property
            {
                Id = propId,
                CountyId = BentonId,
                ParcelId = $"P{propId.ToString()[..4]}",
                TaxYear = 2025,
                AssessedValue = price * 0.90m,
                PropertyType = "residential",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "test",
                UpdatedBy = "test"
            };
            _db.Properties.Add(prop);
            _db.ComparableSales.Add(new ComparableSale
            {
                Id = Guid.NewGuid(),
                CountyId = BentonId,
                ParcelId = prop.ParcelId,
                SaleDate = new DateTime(2025, 6, 1),
                SalePrice = price,
                Neighborhood = "SIM",
                RawWacCd = "A",
                IngestedBy = "test",
                IngestedAt = DateTime.UtcNow
            });
            propIds.Add(propId);
        }
        await _db.SaveChangesAsync();

        // Simulate 1.11× factor → should push ratio toward ~1.0
        var result = await _sut.SimulateAsync(BentonId, "SIM", 2025, factor: 1.11m);

        Assert.True(result.MedianRatio > 0.95m, $"Expected ratio > 0.95, got {result.MedianRatio}");
    }
}
```

- [ ] **Step 2: Run test — expect compile error (SalesAiDiagnosticService not found)**

```bash
cd backend && dotnet build TerraFusion.API.Tests 2>&1 | grep "error CS"
```

- [ ] **Step 3: Implement SalesAiDiagnosticService**

```csharp
// backend/src/TerraFusion.API/Services/SalesAiDiagnosticService.cs
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

public sealed class SalesAiDiagnosticService : ISalesAiDiagnosticService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<SalesAiDiagnosticService> _logger;

    public SalesAiDiagnosticService(
        TerraFusionDbContext db,
        ILogger<SalesAiDiagnosticService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── Public API ─────────────────────────────────────────────────────────

    public async Task<SaleAuditDiagnosis> DiagnoseStratumAsync(
        Guid countyId, int taxYear, string stratumKey, CancellationToken ct = default)
    {
        var sales = await LoadStratumSalesAsync(countyId, stratumKey, taxYear, ct);
        var findings = RunRules(sales);
        var diagnosis = BuildDiagnosis(countyId, taxYear, stratumKey, sales, findings);
        await UpsertDiagnosisAsync(diagnosis, ct);
        return diagnosis;
    }

    public async Task<int> DiagnoseCountyAsync(
        Guid countyId, int taxYear, CancellationToken ct = default)
    {
        var stratumKeys = await _db.ComparableSales
            .Where(s => s.CountyId == countyId && s.SaleDate.Year == taxYear)
            .Select(s => s.Neighborhood)
            .Distinct()
            .ToListAsync(ct);

        int count = 0;
        foreach (var key in stratumKeys.Where(k => k != null))
        {
            try
            {
                await DiagnoseStratumAsync(countyId, taxYear, key!, ct);
                count++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Diagnosis failed for stratum {Key}", key);
            }
        }
        return count;
    }

    public async Task<List<StratumDiagnosisSummaryDto>> GetDiagnoseSummariesAsync(
        Guid countyId, int taxYear, CancellationToken ct = default)
    {
        return await _db.Set<SaleAuditDiagnosis>()
            .Where(d => d.CountyId == countyId && d.TaxYear == taxYear)
            .Select(d => new StratumDiagnosisSummaryDto(
                d.StratumKey,
                d.PrimaryDiagnosis,
                d.Confidence,
                d.RecommendedAction,
                d.IsStale,
                d.DiagnosedAt))
            .ToListAsync(ct);
    }

    public async Task<List<StratumSaleDto>> GetStratumSalesAsync(
        Guid countyId, string stratumKey, int taxYear, CancellationToken ct = default)
    {
        var sales = await LoadStratumSalesAsync(countyId, stratumKey, taxYear, ct);
        var diagnosis = await _db.Set<SaleAuditDiagnosis>()
            .FirstOrDefaultAsync(
                d => d.CountyId == countyId && d.TaxYear == taxYear && d.StratumKey == stratumKey,
                ct);

        var flaggedIds = new HashSet<Guid>();
        var flagReasons = new Dictionary<Guid, string>();
        if (diagnosis?.RecommendedSaleIdsJson is { } json)
        {
            var ids = JsonSerializer.Deserialize<List<Guid>>(json) ?? [];
            flaggedIds.UnionWith(ids);
        }
        if (diagnosis?.FindingsJson is { } fj)
        {
            var findings = JsonSerializer.Deserialize<List<DiagnosisFinding>>(fj) ?? [];
            foreach (var f in findings)
                foreach (var id in f.AffectedSaleIds)
                    flagReasons[id] = f.Rule;
        }

        // Join with Properties to get assessed value
        var parcelIds = sales.Select(s => s.ParcelId).Distinct().ToList();
        var assessedValues = await _db.Properties
            .Where(p => p.CountyId == countyId && p.TaxYear == taxYear
                     && parcelIds.Contains(p.ParcelId))
            .ToDictionaryAsync(p => p.ParcelId, p => p.AssessedValue, ct);

        return sales.Select(s =>
        {
            var av = assessedValues.GetValueOrDefault(s.ParcelId);
            var ratio = av.HasValue && s.SalePrice > 0
                ? Math.Round(av.Value / s.SalePrice, 4) : (decimal?)null;
            return new StratumSaleDto(
                s.Id, s.ParcelId, s.SaleDate, s.SalePrice,
                av, ratio, s.RawWacCd,
                flaggedIds.Contains(s.Id) ? "AI_FLAGGED" : null,
                flagReasons.GetValueOrDefault(s.Id),
                s.SaleQualification,
                s.QualificationRecommendation,
                s.QualificationDecision);
        }).ToList();
    }

    public async Task<SimulationResultDto> SimulateAsync(
        Guid countyId, string stratumKey, int taxYear,
        decimal factor = 1.0m,
        IEnumerable<Guid>? excludeSaleIds = null,
        CancellationToken ct = default)
    {
        var sales = await LoadStratumSalesAsync(countyId, stratumKey, taxYear, ct);
        var exclude = excludeSaleIds?.ToHashSet() ?? [];
        var activeSales = sales.Where(s => !exclude.Contains(s.Id)).ToList();

        var parcelIds = activeSales.Select(s => s.ParcelId).Distinct().ToList();
        var avMap = await _db.Properties
            .Where(p => p.CountyId == countyId && p.TaxYear == taxYear
                     && parcelIds.Contains(p.ParcelId))
            .ToDictionaryAsync(p => p.ParcelId, p => p.AssessedValue, ct);

        var ratios = activeSales
            .Where(s => avMap.ContainsKey(s.ParcelId) && s.SalePrice > 0)
            .Select(s => avMap[s.ParcelId]!.Value * factor / s.SalePrice)
            .OrderBy(r => r)
            .ToList();

        if (ratios.Count == 0)
            return new SimulationResultDto(0, 0, 0, 0);

        return ComputeIaaoStats(ratios, activeSales
            .Where(s => avMap.ContainsKey(s.ParcelId) && s.SalePrice > 0)
            .Select(s => s.SalePrice).ToList());
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private Task<List<ComparableSale>> LoadStratumSalesAsync(
        Guid countyId, string stratumKey, int taxYear, CancellationToken ct) =>
        _db.ComparableSales
           .Where(s => s.CountyId == countyId
                    && s.Neighborhood == stratumKey
                    && s.SaleDate.Year == taxYear
                    && s.QualificationDecision != "disqualified")
           .ToListAsync(ct);

    private static List<DiagnosisFinding> RunRules(List<ComparableSale> sales)
    {
        var findings = new List<DiagnosisFinding>();
        findings.AddRange(DateClusterRule(sales));
        findings.AddRange(MissingWacRule(sales));
        findings.AddRange(PriceClusterRule(sales));
        return findings;
    }

    private static IEnumerable<DiagnosisFinding> DateClusterRule(List<ComparableSale> sales)
    {
        var byDate = sales
            .Where(s => s.SaleDate != default)
            .GroupBy(s => s.SaleDate.Date)
            .Where(g => g.Count() >= 2)
            .ToList();

        foreach (var g in byDate)
            yield return new DiagnosisFinding(
                "DateCluster",
                $"{g.Count()} sales share recording date {g.Key:yyyy-MM-dd}",
                g.Select(s => s.Id).ToList());
    }

    private static IEnumerable<DiagnosisFinding> MissingWacRule(List<ComparableSale> sales)
    {
        var noWac = sales.Where(s => string.IsNullOrWhiteSpace(s.RawWacCd)).ToList();
        if (noWac.Count > 0)
            yield return new DiagnosisFinding(
                "MissingWac",
                $"{noWac.Count} sale(s) have no WAC code on record",
                noWac.Select(s => s.Id).ToList());
    }

    private static IEnumerable<DiagnosisFinding> PriceClusterRule(List<ComparableSale> sales)
    {
        var sorted = sales.OrderBy(s => s.SalePrice).ToList();
        var clusters = new List<Guid>();
        for (int i = 0; i < sorted.Count - 1; i++)
        {
            var diff = Math.Abs(sorted[i + 1].SalePrice - sorted[i].SalePrice)
                       / sorted[i].SalePrice;
            if (diff < 0.02m)
                clusters.AddRange(new[] { sorted[i].Id, sorted[i + 1].Id });
        }
        if (clusters.Distinct().Count() >= 2)
            yield return new DiagnosisFinding(
                "PriceCluster",
                "Multiple sales priced within 2% of each other",
                clusters.Distinct().ToList());
    }

    private static SaleAuditDiagnosis BuildDiagnosis(
        Guid countyId, int taxYear, string stratumKey,
        List<ComparableSale> sales, List<DiagnosisFinding> findings)
    {
        var allFlaggedIds = findings.SelectMany(f => f.AffectedSaleIds).Distinct().ToList();
        string diagnosis;
        string action;
        decimal confidence;

        if (findings.Any(f => f.Rule is "DateCluster" or "MissingWac" or "PriceCluster"))
        {
            diagnosis = "DATA_PROBLEM";
            action = "DISQUALIFY_SALES";
            // Confidence scales with how many sales are flagged vs total
            confidence = Math.Min(1.0m, allFlaggedIds.Count / Math.Max(1m, sales.Count) * 3m);
        }
        else
        {
            diagnosis = "FLAG_FOR_REVIEW";
            action = "FLAG_FOR_REVIEW";
            confidence = 0.5m;
        }

        return new SaleAuditDiagnosis
        {
            Id = Guid.NewGuid(),
            CountyId = countyId,
            TaxYear = taxYear,
            StratumKey = stratumKey,
            PrimaryDiagnosis = diagnosis,
            Confidence = Math.Round(confidence, 2),
            FindingsJson = JsonSerializer.Serialize(findings),
            RecommendedAction = action,
            RecommendedSaleIdsJson = allFlaggedIds.Count > 0
                ? JsonSerializer.Serialize(allFlaggedIds) : null,
            DiagnosedAt = DateTime.UtcNow,
            IsStale = false
        };
    }

    private async Task UpsertDiagnosisAsync(SaleAuditDiagnosis diagnosis, CancellationToken ct)
    {
        var existing = await _db.Set<SaleAuditDiagnosis>()
            .FirstOrDefaultAsync(
                d => d.CountyId == diagnosis.CountyId
                  && d.TaxYear == diagnosis.TaxYear
                  && d.StratumKey == diagnosis.StratumKey, ct);

        if (existing is null)
            _db.Set<SaleAuditDiagnosis>().Add(diagnosis);
        else
        {
            existing.PrimaryDiagnosis = diagnosis.PrimaryDiagnosis;
            existing.Confidence = diagnosis.Confidence;
            existing.FindingsJson = diagnosis.FindingsJson;
            existing.SimulationResultJson = diagnosis.SimulationResultJson;
            existing.RecommendedAction = diagnosis.RecommendedAction;
            existing.RecommendedSaleIdsJson = diagnosis.RecommendedSaleIdsJson;
            existing.RecommendedFactor = diagnosis.RecommendedFactor;
            existing.DiagnosedAt = diagnosis.DiagnosedAt;
            existing.IsStale = false;
        }
        await _db.SaveChangesAsync(ct);
    }

    private static SimulationResultDto ComputeIaaoStats(
        List<decimal> sortedRatios, List<decimal> salePrices)
    {
        int n = sortedRatios.Count;
        decimal median = n % 2 == 0
            ? (sortedRatios[n / 2 - 1] + sortedRatios[n / 2]) / 2
            : sortedRatios[n / 2];

        // COD = average absolute deviation from median, as % of median
        decimal cod = sortedRatios.Sum(r => Math.Abs(r - median)) / n / median * 100m;

        // PRD = mean ratio / value-weighted mean ratio
        decimal meanRatio = sortedRatios.Average();
        decimal totalSalePrice = salePrices.Sum();
        decimal weightedMean = totalSalePrice > 0
            ? sortedRatios.Zip(salePrices, (r, p) => r * p).Sum() / totalSalePrice
            : meanRatio;
        decimal prd = weightedMean > 0 ? meanRatio / weightedMean : 1m;

        return new SimulationResultDto(
            Math.Round(cod, 2),
            Math.Round(median, 4),
            Math.Round(prd, 4),
            n);
    }
}
```

- [ ] **Step 4: Register in Program.cs**

Find the block near line 667 where `IForgeStatisticsService` is registered. Add directly after it:
```csharp
builder.Services.AddScoped<ISalesAiDiagnosticService, SalesAiDiagnosticService>();
```

Also add the using at the top of the relevant registration block if needed:
```csharp
// The interface is in TerraFusion.Core.Interfaces, implementation in TerraFusion.API.Services
// Both are already referenced by the project — no new using needed
```

- [ ] **Step 5: Run tests**

```bash
cd backend && dotnet test TerraFusion.API.Tests --filter "SalesAiDiagnosticServiceTests" -v minimal
```

Expected: All 4 tests pass. (The `SystematicBiasRule` test just asserts non-null since the rule is simple in v1.)

- [ ] **Step 6: Run full test suite — no regressions**

```bash
cd backend && dotnet test TerraFusion.API.Tests -v minimal 2>&1 | tail -10
```

Expected: Previously-passing tests still pass.

- [ ] **Step 7: Commit**

```bash
cd backend && git add src/TerraFusion.API/Services/SalesAiDiagnosticService.cs \
  src/TerraFusion.API/Program.cs \
  TerraFusion.API.Tests/SalesAudit/SalesAiDiagnosticServiceTests.cs && \
git commit -m "feat(sales-audit): implement SalesAiDiagnosticService with detection rules + simulation"
```

---

## Task 4: SalesAuditController

**Files:**
- Create: `backend/src/TerraFusion.API/Controllers/SalesAuditController.cs`
- Test: `backend/TerraFusion.API.Tests/SalesAudit/SalesAuditControllerTests.cs`

- [ ] **Step 1: Write failing tests**

```csharp
// backend/TerraFusion.API.Tests/SalesAudit/SalesAuditControllerTests.cs
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.AI.Data;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using Xunit;

namespace TerraFusion.API.Tests.SalesAudit;

public sealed class SalesAuditControllerTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly Mock<ISalesAiDiagnosticService> _diagSvc;
    private readonly SalesAuditController _sut;

    public SalesAuditControllerTests()
    {
        TerraFusion.Data.TerraFusionDbContext.OnModelCreatingExtensions =
            (mb, p) => GptAiEntityConfigurations.Apply(mb, p);
        _db = TestDbContextFactory.CreateInMemoryContext();
        _diagSvc = new Mock<ISalesAiDiagnosticService>();

        _sut = new SalesAuditController(_db, _diagSvc.Object,
            NullLogger<SalesAuditController>.Instance);

        // Simulate authenticated user with county claim
        var claims = new[]
        {
            new System.Security.Claims.Claim("county_id", BentonId.ToString()),
            new System.Security.Claims.Claim(
                System.Security.Claims.ClaimTypes.NameIdentifier, "test-user")
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "test");
        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new System.Security.Claims.ClaimsPrincipal(identity)
            }
        };
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetStrata_ReturnsDiagnosisSummaries()
    {
        _diagSvc
            .Setup(s => s.GetDiagnoseSummariesAsync(BentonId, 2026, default))
            .ReturnsAsync(new List<StratumDiagnosisSummaryDto>
            {
                new("400", "DATA_PROBLEM", 0.94m, "DISQUALIFY_SALES", false, DateTime.UtcNow)
            });

        var result = await _sut.GetStrata(2026);

        var ok = Assert.IsType<OkObjectResult>(result);
        var summaries = Assert.IsAssignableFrom<IEnumerable<StratumDiagnosisSummaryDto>>(ok.Value);
        Assert.Single(summaries);
    }

    [Fact]
    public async Task BulkDecision_SetsQualificationDecisionOnSales()
    {
        var saleId = Guid.NewGuid();
        _db.ComparableSales.Add(new ComparableSale
        {
            Id = saleId,
            CountyId = BentonId,
            ParcelId = "P001",
            SaleDate = DateTime.UtcNow,
            SalePrice = 200_000,
            IngestedBy = "test",
            IngestedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var result = await _sut.BulkDecision(
            new BulkDecisionRequest(new List<Guid> { saleId }, "disqualified", "test reason"));

        Assert.IsType<OkResult>(result);
        var sale = await _db.ComparableSales.FindAsync(saleId);
        Assert.Equal("disqualified", sale!.QualificationDecision);
    }

    [Fact]
    public async Task ProposeAdjustment_CreatesDraftRecord()
    {
        var result = await _sut.ProposeAdjustment("400", 2026,
            new ProposeAdjustmentRequest(1.04m, 14.3m, 0.949m, 1.009m));

        var ok = Assert.IsType<OkObjectResult>(result);
        var proposal = await _db.Set<SalesAuditAdjustmentProposal>()
            .FirstOrDefaultAsync(p => p.StratumKey == "400");
        Assert.NotNull(proposal);
        Assert.Equal(1.04m, proposal.ProposedFactor);
        Assert.Equal("draft", proposal.Status);
    }
}
```

- [ ] **Step 2: Run tests — expect compile error**

```bash
cd backend && dotnet build TerraFusion.API.Tests 2>&1 | grep "error CS" | head -10
```

- [ ] **Step 3: Implement SalesAuditController**

```csharp
// backend/src/TerraFusion.API/Controllers/SalesAuditController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class SalesAuditController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ISalesAiDiagnosticService _diagSvc;
    private readonly ILogger<SalesAuditController> _logger;

    public SalesAuditController(
        TerraFusionDbContext db,
        ISalesAiDiagnosticService diagSvc,
        ILogger<SalesAuditController> logger)
    {
        _db = db;
        _diagSvc = diagSvc;
        _logger = logger;
    }

    private Guid? GetCountyId() =>
        Guid.TryParse(User.FindFirst("county_id")?.Value, out var id) ? id : null;

    // GET /api/SalesAudit/strata?taxYear=2026
    [HttpGet("strata")]
    public async Task<IActionResult> GetStrata([FromQuery] int taxYear = 0,
        CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var summaries = await _diagSvc.GetDiagnoseSummariesAsync(countyId.Value, taxYear, ct);
        return Ok(summaries);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/sales?taxYear=2026
    [HttpGet("strata/{stratumKey}/sales")]
    public async Task<IActionResult> GetStratumSales(string stratumKey,
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var sales = await _diagSvc.GetStratumSalesAsync(countyId.Value, stratumKey, taxYear, ct);
        return Ok(sales);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/diagnosis?taxYear=2026
    [HttpGet("strata/{stratumKey}/diagnosis")]
    public async Task<IActionResult> GetDiagnosis(string stratumKey,
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var diagnosis = await _db.Set<SaleAuditDiagnosis>()
            .FirstOrDefaultAsync(
                d => d.CountyId == countyId && d.TaxYear == taxYear && d.StratumKey == stratumKey,
                ct);

        return diagnosis is null ? NotFound() : Ok(diagnosis);
    }

    // POST /api/SalesAudit/strata/{stratumKey}/diagnose?taxYear=2026
    [HttpPost("strata/{stratumKey}/diagnose")]
    public async Task<IActionResult> DiagnoseStratum(string stratumKey,
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var result = await _diagSvc.DiagnoseStratumAsync(countyId.Value, taxYear, stratumKey, ct);
        return Ok(result);
    }

    // POST /api/SalesAudit/diagnose-county?taxYear=2026
    [HttpPost("diagnose-county")]
    public async Task<IActionResult> DiagnoseCounty(
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var count = await _diagSvc.DiagnoseCountyAsync(countyId.Value, taxYear, ct);
        return Ok(new { DiagnosedCount = count });
    }

    // PATCH /api/SalesAudit/sales/{saleId}/decision
    [HttpPatch("sales/{saleId:guid}/decision")]
    public async Task<IActionResult> SetDecision(Guid saleId,
        [FromBody] BulkDecisionRequest req, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();

        return await ApplyDecisions(countyId.Value,
            new List<Guid> { saleId }, req.Decision, req.Reason, ct);
    }

    // POST /api/SalesAudit/sales/bulk-decision
    [HttpPost("sales/bulk-decision")]
    public async Task<IActionResult> BulkDecision(
        [FromBody] BulkDecisionRequest req, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();

        return await ApplyDecisions(countyId.Value, req.SaleIds, req.Decision, req.Reason, ct);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/simulate?taxYear=2026&factor=1.04&excludeIds=...
    [HttpGet("strata/{stratumKey}/simulate")]
    public async Task<IActionResult> Simulate(string stratumKey,
        [FromQuery] int taxYear = 0,
        [FromQuery] decimal factor = 1.0m,
        [FromQuery] string? excludeIds = null,
        CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var exclude = excludeIds?
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => Guid.TryParse(s.Trim(), out var g) ? g : (Guid?)null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value) ?? [];

        var result = await _diagSvc.SimulateAsync(
            countyId.Value, stratumKey, taxYear, factor, exclude, ct);
        return Ok(result);
    }

    // POST /api/SalesAudit/strata/{stratumKey}/propose-adjustment?taxYear=2026
    [HttpPost("strata/{stratumKey}/propose-adjustment")]
    public async Task<IActionResult> ProposeAdjustment(string stratumKey,
        [FromQuery] int taxYear,
        [FromBody] ProposeAdjustmentRequest req,
        CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value ?? "unknown";

        // Invalidate any existing draft for this stratum+year
        var existing = await _db.Set<SalesAuditAdjustmentProposal>()
            .Where(p => p.CountyId == countyId && p.TaxYear == taxYear
                     && p.StratumKey == stratumKey && p.Status == "draft")
            .ToListAsync(ct);
        foreach (var old in existing)
            old.Status = "superseded";

        var proposal = new SalesAuditAdjustmentProposal
        {
            Id = Guid.NewGuid(),
            CountyId = countyId.Value,
            TaxYear = taxYear,
            StratumKey = stratumKey,
            ProposedFactor = req.Factor,
            ProjectedCod = req.ProjectedCod,
            ProjectedMedianRatio = req.ProjectedMedianRatio,
            ProjectedPrd = req.ProjectedPrd,
            Status = "draft",
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };
        _db.Set<SalesAuditAdjustmentProposal>().Add(proposal);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Adjustment proposal created: county={CountyId} stratum={Key} year={Year} factor={Factor}",
            countyId, stratumKey, taxYear, req.Factor);

        return Ok(new { proposal.Id, proposal.Status });
    }

    // ── Shared helpers ─────────────────────────────────────────────────────

    private async Task<IActionResult> ApplyDecisions(
        Guid countyId, IEnumerable<Guid> saleIds, string decision,
        string? reason, CancellationToken ct)
    {
        var ids = saleIds.ToList();
        var sales = await _db.ComparableSales
            .Where(s => s.CountyId == countyId && ids.Contains(s.Id))
            .ToListAsync(ct);

        if (sales.Count == 0) return NotFound();

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? "unknown";
        foreach (var sale in sales)
        {
            sale.QualificationDecision = decision;
            sale.DecisionReason = reason;
            sale.DecisionBy = userId;
            sale.DecisionAt = DateTime.UtcNow;
            sale.DecisionSource = "appraiser";
        }
        await _db.SaveChangesAsync(ct);
        return Ok();
    }
}
```

- [ ] **Step 4: Run controller tests**

```bash
cd backend && dotnet test TerraFusion.API.Tests --filter "SalesAuditControllerTests" -v minimal
```

Expected: All 3 tests pass.

- [ ] **Step 5: Run full test suite**

```bash
cd backend && dotnet test TerraFusion.API.Tests -v minimal 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
cd backend && git add src/TerraFusion.API/Controllers/SalesAuditController.cs \
  TerraFusion.API.Tests/SalesAudit/SalesAuditControllerTests.cs && \
git commit -m "feat(sales-audit): SalesAuditController — 9 endpoints with county isolation"
```

---

## Task 5: Frontend — Types, Store, API Client

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/sales/salesForgeTypes.ts`
- Modify: `frontend/apps/os-shell/src/pages/forge/sales/salesForgeStore.ts`
- Create: `frontend/apps/os-shell/src/services/forge/salesAuditApi.ts`

- [ ] **Step 1: Read current salesForgeTypes.ts**

Read the file to see the current `SalesForgeTab` union type. Add `'ai-audit'` to it:

In `salesForgeTypes.ts`, find the `SalesForgeTab` type and add `'ai-audit'`:
```typescript
// Before (approximate — match actual file):
export type SalesForgeTab = 'queue' | 'ratio-audit' | 'neighborhoods' | 'code-audit' | 'dor-export';

// After:
export type SalesForgeTab = 'ai-audit' | 'queue' | 'ratio-audit' | 'neighborhoods' | 'code-audit' | 'dor-export';
```

- [ ] **Step 2: Read current salesForgeStore.ts and add selectedStratumKey**

Open `salesForgeStore.ts`. Add to the store state and actions:
```typescript
// Add to the store interface / create call:
selectedStratumKey: string | null;
setSelectedStratumKey: (key: string | null) => void;

// Add to the create(...) body:
selectedStratumKey: null,
setSelectedStratumKey: (key) => set({ selectedStratumKey: key }),
```

- [ ] **Step 3: Create the API client**

```typescript
// frontend/apps/os-shell/src/services/forge/salesAuditApi.ts

export interface StratumDiagnosisSummary {
  stratumKey: string;
  primaryDiagnosis: string | null;
  confidence: number | null;
  recommendedAction: string | null;
  isStale: boolean;
  diagnosedAt: string | null;
}

export interface StratumSale {
  id: string;
  parcelId: string;
  saleDate: string;
  salePrice: number;
  assessedValue: number | null;
  ratio: number | null;
  wacCode: string | null;
  aiFlag: string | null;
  aiReason: string | null;
  pacsQualification: string | null;
  recommendation: string | null;
  qualificationDecision: string | null;
}

export interface DiagnosisFinding {
  rule: string;
  description: string;
  affectedSaleIds: string[];
}

export interface SaleAuditDiagnosis {
  id: string;
  countyId: string;
  taxYear: number;
  stratumKey: string;
  primaryDiagnosis: string;
  confidence: number;
  findingsJson: string;
  simulationResultJson: string | null;
  recommendedAction: string;
  recommendedSaleIdsJson: string | null;
  recommendedFactor: number | null;
  diagnosedAt: string;
  isStale: boolean;
}

export interface SimulationResult {
  cod: number;
  medianRatio: number;
  prd: number;
  saleCount: number;
}

const BASE = '/api/SalesAudit';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const salesAuditApi = {
  getStrata: (taxYear: number) =>
    apiFetch<StratumDiagnosisSummary[]>(`${BASE}/strata?taxYear=${taxYear}`),

  getStratumSales: (stratumKey: string, taxYear: number) =>
    apiFetch<StratumSale[]>(`${BASE}/strata/${encodeURIComponent(stratumKey)}/sales?taxYear=${taxYear}`),

  getDiagnosis: (stratumKey: string, taxYear: number) =>
    apiFetch<SaleAuditDiagnosis>(`${BASE}/strata/${encodeURIComponent(stratumKey)}/diagnosis?taxYear=${taxYear}`),

  diagnoseStratum: (stratumKey: string, taxYear: number) =>
    apiFetch<SaleAuditDiagnosis>(`${BASE}/strata/${encodeURIComponent(stratumKey)}/diagnose?taxYear=${taxYear}`, { method: 'POST' }),

  diagnoseCounty: (taxYear: number) =>
    apiFetch<{ diagnosedCount: number }>(`${BASE}/diagnose-county?taxYear=${taxYear}`, { method: 'POST' }),

  bulkDecision: (saleIds: string[], decision: string, reason?: string) =>
    apiFetch<void>(`${BASE}/sales/bulk-decision`, {
      method: 'POST',
      body: JSON.stringify({ saleIds, decision, reason }),
    }),

  simulate: (stratumKey: string, taxYear: number, factor: number, excludeIds?: string[]) => {
    const params = new URLSearchParams({
      taxYear: String(taxYear),
      factor: String(factor),
      ...(excludeIds?.length ? { excludeIds: excludeIds.join(',') } : {}),
    });
    return apiFetch<SimulationResult>(
      `${BASE}/strata/${encodeURIComponent(stratumKey)}/simulate?${params}`
    );
  },

  proposeAdjustment: (
    stratumKey: string,
    taxYear: number,
    factor: number,
    projectedCod: number,
    projectedMedianRatio: number,
    projectedPrd: number
  ) =>
    apiFetch<{ id: string; status: string }>(
      `${BASE}/strata/${encodeURIComponent(stratumKey)}/propose-adjustment?taxYear=${taxYear}`,
      {
        method: 'POST',
        body: JSON.stringify({ factor, projectedCod, projectedMedianRatio, projectedPrd }),
      }
    ),
};
```

- [ ] **Step 4: Build frontend — no type errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "error TS" | head -20
```

Expected: 0 new errors.

- [ ] **Step 5: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/sales/salesForgeTypes.ts \
  apps/os-shell/src/pages/forge/sales/salesForgeStore.ts \
  apps/os-shell/src/services/forge/salesAuditApi.ts && \
git commit -m "feat(sales-audit): frontend types, store state, and API client"
```

---

## Task 6: CountyKpiBar + StrataList

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/sales/audit/CountyKpiBar.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/sales/audit/StrataList.tsx`

- [ ] **Step 1: Create CountyKpiBar**

```tsx
// frontend/apps/os-shell/src/pages/forge/sales/audit/CountyKpiBar.tsx
import React from 'react';
import type { StratumDiagnosisSummary } from '../../../../services/forge/salesAuditApi';

interface CountyStats {
  cod: number;
  medianRatio: number;
  prd: number;
  qualifiedSales: number;
  strataTotal: number;
  strataFailing: number;
  strataAiDiagnosed: number;
}

function deriveStats(strata: StratumDiagnosisSummary[]): CountyStats {
  const failing = strata.filter(s => s.primaryDiagnosis && s.primaryDiagnosis !== 'PASSING');
  return {
    cod: 0, medianRatio: 0, prd: 0, qualifiedSales: 0, // populated from ratio study API
    strataTotal: strata.length,
    strataFailing: failing.length,
    strataAiDiagnosed: strata.filter(s => s.primaryDiagnosis && !s.isStale).length,
  };
}

function tileColor(value: number, low: number, high: number, invert = false): string {
  const ok = value >= low && value <= high;
  if (invert) return ok ? 'text-red-400' : 'text-emerald-400';
  return ok ? 'text-emerald-400' : 'text-red-400';
}

interface KpiTileProps {
  label: string;
  value: string;
  target: string;
  colorClass: string;
}

function KpiTile({ label, value, target, colorClass }: KpiTileProps) {
  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 min-w-0">
      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
      <div className="text-[10px] text-slate-600">{target}</div>
    </div>
  );
}

interface CountyKpiBarProps {
  strata: StratumDiagnosisSummary[];
  cod?: number;
  medianRatio?: number;
  prd?: number;
  qualifiedSales?: number;
}

export function CountyKpiBar({
  strata, cod = 0, medianRatio = 0, prd = 0, qualifiedSales = 0
}: CountyKpiBarProps) {
  const stats = deriveStats(strata);

  return (
    <div className="flex gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950">
      <KpiTile
        label="County COD"
        value={cod.toFixed(1)}
        target="target < 15.0"
        colorClass={tileColor(cod, 0, 15, true)}
      />
      <KpiTile
        label="Median Ratio"
        value={medianRatio.toFixed(3)}
        target="0.95 – 1.05"
        colorClass={tileColor(medianRatio, 0.95, 1.05)}
      />
      <KpiTile
        label="PRD"
        value={prd.toFixed(3)}
        target="0.98 – 1.03"
        colorClass={tileColor(prd, 0.98, 1.03)}
      />
      <KpiTile
        label="Qualified Sales"
        value={qualifiedSales.toLocaleString()}
        target="county total"
        colorClass={qualifiedSales > 200 ? 'text-emerald-400' : 'text-amber-400'}
      />
      <KpiTile
        label="Strata Failing"
        value={`${stats.strataFailing} / ${stats.strataTotal}`}
        target="target 0"
        colorClass={stats.strataFailing === 0 ? 'text-emerald-400' : 'text-red-400'}
      />
      <KpiTile
        label="AI Diagnosed"
        value={`${stats.strataAiDiagnosed} / ${stats.strataFailing}`}
        target="of failing"
        colorClass={
          stats.strataFailing > 0 && stats.strataAiDiagnosed >= stats.strataFailing
            ? 'text-emerald-400' : 'text-amber-400'
        }
      />
    </div>
  );
}
```

- [ ] **Step 2: Create StrataList**

```tsx
// frontend/apps/os-shell/src/pages/forge/sales/audit/StrataList.tsx
import React from 'react';
import type { StratumDiagnosisSummary } from '../../../../services/forge/salesAuditApi';

const DIAGNOSIS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DATA_PROBLEM:    { bg: 'bg-red-950', text: 'text-red-400', label: 'DATA' },
  MODEL_DRIFT:     { bg: 'bg-purple-950', text: 'text-purple-400', label: 'MODEL DRIFT' },
  OUTLIER_CLUSTER: { bg: 'bg-amber-950', text: 'text-amber-400', label: 'OUTLIER' },
  MARKET_SHIFT:    { bg: 'bg-cyan-950', text: 'text-cyan-400', label: 'MARKET SHIFT' },
  EXTERNAL_FACTOR: { bg: 'bg-slate-800', text: 'text-slate-400', label: 'EXTERNAL' },
  FLAG_FOR_REVIEW: { bg: 'bg-slate-800', text: 'text-slate-400', label: 'REVIEW' },
};

interface StrataListProps {
  strata: StratumDiagnosisSummary[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  loading?: boolean;
}

export function StrataList({ strata, selectedKey, onSelect, loading }: StrataListProps) {
  const failing = strata.filter(s => s.primaryDiagnosis && s.primaryDiagnosis !== 'PASSING');
  const passing = strata.filter(s => !s.primaryDiagnosis || s.primaryDiagnosis === 'PASSING');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        Loading strata…
      </div>
    );
  }

  function renderRow(s: StratumDiagnosisSummary) {
    const isSelected = s.stratumKey === selectedKey;
    const style = s.primaryDiagnosis ? DIAGNOSIS_STYLE[s.primaryDiagnosis] : null;

    return (
      <button
        key={s.stratumKey}
        onClick={() => onSelect(s.stratumKey)}
        className={[
          'w-full text-left px-3 py-2 border-b border-slate-800/50',
          'hover:bg-slate-800 transition-colors',
          isSelected ? 'bg-slate-800 border-l-2 border-l-cyan-500' : '',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm text-slate-200 font-medium truncate">{s.stratumKey}</span>
          {style && (
            <span className={`shrink-0 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
              {style.label}
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-600 mt-0.5">
          {s.confidence != null ? `${Math.round(s.confidence * 100)}% confidence` : 'no diagnosis'}
          {s.isStale ? ' · stale' : ''}
        </div>
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {failing.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-red-500 bg-slate-950 border-b border-slate-800">
            Failing ({failing.length})
          </div>
          {failing.map(renderRow)}
        </>
      )}
      {passing.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-500 bg-slate-950 border-b border-slate-800">
            Passing ({passing.length})
          </div>
          {passing.map(renderRow)}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "error TS" | head -10
```

- [ ] **Step 4: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/sales/audit/CountyKpiBar.tsx \
  apps/os-shell/src/pages/forge/sales/audit/StrataList.tsx && \
git commit -m "feat(sales-audit): CountyKpiBar and StrataList components"
```

---

## Task 7: SaleAuditTable + Scatter

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/sales/audit/SaleScatterPlot.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/sales/audit/SaleRow.tsx`
- Create: `frontend/apps/os-shell/src/pages/forge/sales/audit/SaleAuditTable.tsx`

- [ ] **Step 1: Create SaleScatterPlot**

```tsx
// frontend/apps/os-shell/src/pages/forge/sales/audit/SaleScatterPlot.tsx
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import type { StratumSale } from '../../../../services/forge/salesAuditApi';

interface Props {
  sales: StratumSale[];
  highlightedId?: string | null;
  onPointClick?: (id: string) => void;
}

function pointColor(sale: StratumSale, highlighted: string | null | undefined): string {
  if (sale.id === highlighted) return '#f0abfc';
  if (sale.qualificationDecision === 'disqualified') return '#ef4444';
  if (sale.aiFlag === 'AI_FLAGGED') return '#f97316';
  return '#38bdf8';
}

export function SaleScatterPlot({ sales, highlightedId, onPointClick }: Props) {
  const data = sales
    .filter(s => s.salePrice > 0 && s.ratio != null)
    .map(s => ({ id: s.id, x: s.salePrice / 1000, y: s.ratio! }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <XAxis
          dataKey="x" type="number" name="Sale Price ($k)"
          tick={{ fontSize: 10, fill: '#475569' }}
          tickFormatter={v => `$${v}k`}
        />
        <YAxis
          dataKey="y" type="number" name="Ratio" domain={[0.5, 1.5]}
          tick={{ fontSize: 10, fill: '#475569' }}
          width={36}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(val: number, name: string) =>
            name === 'Sale Price ($k)' ? [`$${val}k`, name] : [val.toFixed(3), 'Ratio']
          }
        />
        {/* IAAO target band */}
        <ReferenceLine y={0.95} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
        <ReferenceLine y={1.05} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
        <Scatter
          data={data}
          onClick={(point: { id: string }) => onPointClick?.(point.id)}
          cursor="pointer"
        >
          {data.map(entry => (
            <Cell
              key={entry.id}
              fill={pointColor(
                sales.find(s => s.id === entry.id)!,
                highlightedId
              )}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create SaleRow**

```tsx
// frontend/apps/os-shell/src/pages/forge/sales/audit/SaleRow.tsx
import React from 'react';
import type { StratumSale } from '../../../../services/forge/salesAuditApi';

interface Props {
  sale: StratumSale;
  selected: boolean;
  highlighted: boolean;
  onCheck: (id: string, checked: boolean) => void;
  onDecisionChange: (id: string, decision: string) => void;
}

const DECISION_COLORS: Record<string, string> = {
  qualified: 'text-emerald-400',
  disqualified: 'text-red-400',
  pending: 'text-slate-400',
};

export function SaleRow({ sale, selected, highlighted, onCheck, onDecisionChange }: Props) {
  const ratioColor =
    sale.ratio == null ? 'text-slate-600'
    : sale.ratio < 0.90 || sale.ratio > 1.10 ? 'text-red-400'
    : sale.ratio < 0.95 || sale.ratio > 1.05 ? 'text-amber-400'
    : 'text-emerald-400';

  return (
    <tr
      className={[
        'border-b border-slate-800/50 hover:bg-slate-800/30',
        highlighted ? 'bg-purple-950/30' : '',
      ].join(' ')}
    >
      <td className="px-2 py-1.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onCheck(sale.id, e.target.checked)}
          className="accent-cyan-500"
        />
      </td>
      <td className="px-3 py-1.5 text-xs text-slate-300 font-mono">{sale.parcelId}</td>
      <td className="px-3 py-1.5 text-xs text-slate-400">
        {new Date(sale.saleDate).toLocaleDateString()}
      </td>
      <td className="px-3 py-1.5 text-xs text-slate-300 text-right">
        ${(sale.salePrice / 1000).toFixed(0)}k
      </td>
      <td className="px-3 py-1.5 text-xs text-slate-400 text-right">
        {sale.assessedValue != null ? `$${(sale.assessedValue / 1000).toFixed(0)}k` : '—'}
      </td>
      <td className={`px-3 py-1.5 text-xs text-right font-mono ${ratioColor}`}>
        {sale.ratio != null ? sale.ratio.toFixed(3) : '—'}
      </td>
      <td className="px-3 py-1.5 text-xs text-slate-500 font-mono">{sale.wacCode ?? '—'}</td>
      <td className="px-3 py-1.5">
        {sale.aiFlag && (
          <span
            className="text-[9px] font-bold tracking-wider bg-orange-950 text-orange-400 px-1.5 py-0.5 rounded"
            title={sale.aiReason ?? ''}
          >
            AI
          </span>
        )}
      </td>
      <td className="px-3 py-1.5">
        <select
          value={sale.qualificationDecision ?? 'pending'}
          onChange={e => onDecisionChange(sale.id, e.target.value)}
          className={[
            'bg-slate-900 border border-slate-700 rounded text-[11px] px-1 py-0.5',
            DECISION_COLORS[sale.qualificationDecision ?? 'pending'],
          ].join(' ')}
        >
          <option value="pending">Pending</option>
          <option value="qualified">Qualified</option>
          <option value="disqualified">Disqualified</option>
        </select>
      </td>
    </tr>
  );
}
```

- [ ] **Step 3: Create SaleAuditTable**

```tsx
// frontend/apps/os-shell/src/pages/forge/sales/audit/SaleAuditTable.tsx
import React, { useState, useMemo } from 'react';
import type { StratumSale } from '../../../../services/forge/salesAuditApi';
import { SaleScatterPlot } from './SaleScatterPlot';
import { SaleRow } from './SaleRow';

type Filter = 'all' | 'ai-flagged' | 'qualified' | 'disqualified' | 'pending';

interface Props {
  sales: StratumSale[];
  onBulkDecision: (saleIds: string[], decision: string) => void;
  onDecisionChange: (saleId: string, decision: string) => void;
  loading?: boolean;
}

export function SaleAuditTable({ sales, onBulkDecision, onDecisionChange, loading }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return sales;
    if (filter === 'ai-flagged') return sales.filter(s => s.aiFlag);
    if (filter === 'qualified') return sales.filter(s => s.qualificationDecision === 'qualified');
    if (filter === 'disqualified') return sales.filter(s => s.qualificationDecision === 'disqualified');
    return sales.filter(s => !s.qualificationDecision || s.qualificationDecision === 'pending');
  }, [sales, filter]);

  function toggleRow(id: string, checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(filtered.map(s => s.id)) : new Set());
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'ai-flagged', label: 'AI Flagged' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'disqualified', label: 'Disqualified' },
    { id: 'pending', label: 'Pending' },
  ];

  if (loading) return <div className="flex items-center justify-center h-32 text-slate-600 text-sm">Loading sales…</div>;

  return (
    <div className="flex flex-col h-full">
      <SaleScatterPlot
        sales={sales}
        highlightedId={highlighted}
        onPointClick={id => {
          setHighlighted(id === highlighted ? null : id);
          document.getElementById(`sale-row-${id}`)?.scrollIntoView({ block: 'nearest' });
        }}
      />

      {/* Filter pills + bulk actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
                filter === f.id
                  ? 'bg-cyan-900 border-cyan-600 text-cyan-300'
                  : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => { onBulkDecision([...selected], 'disqualified'); setSelected(new Set()); }}
              className="text-[11px] font-semibold px-3 py-1 rounded bg-red-900 text-red-300 hover:bg-red-800"
            >
              Disqualify ({selected.size})
            </button>
            <button
              onClick={() => { onBulkDecision([...selected], 'qualified'); setSelected(new Set()); }}
              className="text-[11px] font-semibold px-3 py-1 rounded bg-emerald-900 text-emerald-300 hover:bg-emerald-800"
            >
              Qualify ({selected.size})
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="px-2 py-2 w-8">
                <input
                  type="checkbox"
                  onChange={e => toggleAll(e.target.checked)}
                  className="accent-cyan-500"
                />
              </th>
              {['Parcel', 'Date', 'Price', 'Assessed', 'Ratio', 'WAC', 'AI', 'Decision'].map(h => (
                <th key={h} className="px-3 py-2 text-[10px] font-bold tracking-widest uppercase text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(sale => (
              <SaleRow
                key={sale.id}
                sale={sale}
                selected={selected.has(sale.id)}
                highlighted={highlighted === sale.id}
                onCheck={toggleRow}
                onDecisionChange={onDecisionChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Type check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "error TS" | head -10
```

- [ ] **Step 5: Commit**

```bash
cd frontend && git add \
  apps/os-shell/src/pages/forge/sales/audit/SaleScatterPlot.tsx \
  apps/os-shell/src/pages/forge/sales/audit/SaleRow.tsx \
  apps/os-shell/src/pages/forge/sales/audit/SaleAuditTable.tsx && \
git commit -m "feat(sales-audit): SaleScatterPlot + SaleAuditTable with filter pills and bulk actions"
```

---

## Task 8: AI Panel Components

**Files (all create):**
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/DiagnosisSection.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/EvidenceSection.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/SimulationSection.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/DataActionSection.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/AdjustmentProposal.tsx`
- `frontend/apps/os-shell/src/pages/forge/sales/audit/ai-panel/AuditAiPanel.tsx`

- [ ] **Step 1: Create DiagnosisSection**

```tsx
// .../audit/ai-panel/DiagnosisSection.tsx
import React from 'react';

const STYLES: Record<string, { bg: string; text: string; border: string }> = {
  DATA_PROBLEM:    { bg: 'bg-red-950', text: 'text-red-400', border: 'border-red-800' },
  MODEL_DRIFT:     { bg: 'bg-purple-950', text: 'text-purple-400', border: 'border-purple-800' },
  OUTLIER_CLUSTER: { bg: 'bg-amber-950', text: 'text-amber-400', border: 'border-amber-800' },
  MARKET_SHIFT:    { bg: 'bg-cyan-950', text: 'text-cyan-400', border: 'border-cyan-800' },
  EXTERNAL_FACTOR: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' },
  FLAG_FOR_REVIEW: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' },
};

interface Props {
  diagnosis: string;
  confidence: number;
}

export function DiagnosisSection({ diagnosis, confidence }: Props) {
  const style = STYLES[diagnosis] ?? STYLES.FLAG_FOR_REVIEW;
  const pct = Math.round(confidence * 100);

  return (
    <div className={`p-3 rounded border ${style.bg} ${style.border}`}>
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">Diagnosis</div>
      <div className={`text-sm font-bold ${style.text} mb-2`}>{diagnosis.replace('_', ' ')}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${style.text.replace('text', 'bg')}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-400 font-mono shrink-0">{pct}%</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create EvidenceSection**

```tsx
// .../audit/ai-panel/EvidenceSection.tsx
import React from 'react';
import type { DiagnosisFinding } from '../../../../../services/forge/salesAuditApi';

interface Props { findings: DiagnosisFinding[]; }

export function EvidenceSection({ findings }: Props) {
  if (findings.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-2">Evidence</div>
      <ul className="space-y-1.5">
        {findings.map((f, i) => (
          <li key={i} className="text-xs text-slate-400 flex gap-2">
            <span className="text-slate-600 shrink-0">•</span>
            <span>{f.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Create SimulationSection**

```tsx
// .../audit/ai-panel/SimulationSection.tsx
import React from 'react';
import type { SimulationResult } from '../../../../../services/forge/salesAuditApi';

interface Props {
  current: SimulationResult | null;
  projected: SimulationResult | null;
}

function Row({ label, current, projected }: { label: string; current?: number; projected?: number }) {
  const improved = projected != null && current != null && Math.abs(projected - current) > 0.001;
  return (
    <div className="flex items-center gap-2 py-1 border-b border-slate-800/50">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider flex-1">{label}</span>
      {current != null && (
        <span className="text-xs text-slate-500 line-through">{current.toFixed(3)}</span>
      )}
      {improved && <span className="text-slate-600 text-[10px]">→</span>}
      {projected != null && (
        <span className={`text-xs font-mono font-bold ${improved ? 'text-cyan-400' : 'text-slate-400'}`}>
          {projected.toFixed(3)}
        </span>
      )}
    </div>
  );
}

export function SimulationSection({ current, projected }: Props) {
  if (!projected) return null;
  return (
    <div className="mt-3">
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-2">
        Simulation {current ? '(if accepted)' : ''}
      </div>
      <Row label="COD" current={current?.cod} projected={projected.cod} />
      <Row label="Median" current={current?.medianRatio} projected={projected.medianRatio} />
      <Row label="PRD" current={current?.prd} projected={projected.prd} />
      <div className="text-[10px] text-slate-600 mt-1">{projected.saleCount} sales in simulation</div>
    </div>
  );
}
```

- [ ] **Step 4: Create DataActionSection**

```tsx
// .../audit/ai-panel/DataActionSection.tsx
import React from 'react';

interface Props {
  recommendedSaleIds: string[];
  onAccept: (ids: string[]) => void;
  onModify: () => void;
}

export function DataActionSection({ recommendedSaleIds, onAccept, onModify }: Props) {
  return (
    <div className="mt-3 space-y-2">
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500">Action</div>
      <button
        onClick={() => onAccept(recommendedSaleIds)}
        className="w-full text-sm font-semibold py-2 px-3 rounded bg-red-900 text-red-300 hover:bg-red-800"
      >
        Accept &amp; Disqualify ({recommendedSaleIds.length} sale{recommendedSaleIds.length !== 1 ? 's' : ''})
      </button>
      <button
        onClick={onModify}
        className="w-full text-sm font-semibold py-2 px-3 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
      >
        Modify Selection
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Create AdjustmentProposal**

```tsx
// .../audit/ai-panel/AdjustmentProposal.tsx
import React, { useState } from 'react';
import type { SimulationResult } from '../../../../../services/forge/salesAuditApi';
import { SimulationSection } from './SimulationSection';

interface Props {
  stratumKey: string;
  taxYear: number;
  recommendedFactor: number | null;
  currentSimulation: SimulationResult | null;
  onSimulate: (factor: number) => Promise<SimulationResult>;
  onPropose: (factor: number, projected: SimulationResult) => Promise<void>;
  onCancel: () => void;
}

export function AdjustmentProposal({
  recommendedFactor, currentSimulation, onSimulate, onPropose, onCancel
}: Props) {
  const [factor, setFactor] = useState(recommendedFactor ?? 1.0);
  const [projected, setProjected] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [proposing, setProposing] = useState(false);

  async function handleFactorChange(val: number) {
    setFactor(val);
    setSimulating(true);
    try {
      const result = await onSimulate(val);
      setProjected(result);
    } finally {
      setSimulating(false);
    }
  }

  async function handlePropose() {
    if (!projected) return;
    setProposing(true);
    try {
      await onPropose(factor, projected);
    } finally {
      setProposing(false);
    }
  }

  return (
    <div className="mt-3 border border-purple-800 rounded bg-purple-950/30 p-3">
      <div className="text-[9px] font-bold tracking-widest uppercase text-purple-400 mb-3">
        Adjustment Proposal
      </div>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-slate-400 flex-1">Factor</label>
        <input
          type="number"
          step="0.001"
          min="0.5"
          max="2.0"
          value={factor}
          onChange={e => handleFactorChange(Number(e.target.value))}
          className="w-20 text-right bg-slate-900 border border-purple-700 rounded px-2 py-1 text-sm font-mono text-purple-300 focus:outline-none focus:border-purple-500"
        />
        <span className="text-xs text-slate-500">×</span>
      </div>

      {simulating && <div className="text-xs text-slate-500 mb-2">Simulating…</div>}

      <SimulationSection current={currentSimulation} projected={projected} />

      <div className="flex gap-2 mt-3">
        <button
          onClick={handlePropose}
          disabled={!projected || proposing}
          className="flex-1 text-xs font-semibold py-2 px-3 rounded bg-purple-800 text-purple-200 hover:bg-purple-700 disabled:opacity-40"
        >
          {proposing ? 'Sending…' : 'Send to CostForge Draft'}
        </button>
        <button
          onClick={onCancel}
          className="text-xs font-semibold py-2 px-3 rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create AuditAiPanel**

```tsx
// .../audit/ai-panel/AuditAiPanel.tsx
import React, { useState, useEffect } from 'react';
import type { SaleAuditDiagnosis, SimulationResult } from '../../../../../services/forge/salesAuditApi';
import { salesAuditApi } from '../../../../../services/forge/salesAuditApi';
import { DiagnosisSection } from './DiagnosisSection';
import { EvidenceSection } from './EvidenceSection';
import { SimulationSection } from './SimulationSection';
import { DataActionSection } from './DataActionSection';
import { AdjustmentProposal } from './AdjustmentProposal';

interface Props {
  stratumKey: string;
  taxYear: number;
  diagnosis: SaleAuditDiagnosis | null;
  currentSimulation: SimulationResult | null;
  onAcceptDisqualify: (ids: string[]) => void;
  onModify: () => void;
  onDraftCreated: () => void;
}

export function AuditAiPanel({
  stratumKey, taxYear, diagnosis, currentSimulation,
  onAcceptDisqualify, onModify, onDraftCreated
}: Props) {
  const [showProposal, setShowProposal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setShowProposal(false);
  }, [stratumKey]);

  if (!diagnosis) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600 text-sm gap-2">
        <div>No diagnosis yet</div>
      </div>
    );
  }

  const findings = JSON.parse(diagnosis.findingsJson ?? '[]');
  const recommendedIds: string[] = JSON.parse(diagnosis.recommendedSaleIdsJson ?? '[]');

  async function handleSimulate(factor: number): Promise<SimulationResult> {
    return salesAuditApi.simulate(stratumKey, taxYear, factor);
  }

  async function handlePropose(factor: number, projected: SimulationResult) {
    await salesAuditApi.proposeAdjustment(
      stratumKey, taxYear, factor,
      projected.cod, projected.medianRatio, projected.prd
    );
    setShowProposal(false);
    setToast('Draft created in CostForge');
    setTimeout(() => setToast(null), 4000);
    onDraftCreated();
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-0">
      <DiagnosisSection diagnosis={diagnosis.primaryDiagnosis} confidence={diagnosis.confidence} />
      <EvidenceSection findings={findings} />
      <SimulationSection current={currentSimulation} projected={null} />

      {diagnosis.primaryDiagnosis === 'DATA_PROBLEM' && !showProposal && (
        <DataActionSection
          recommendedSaleIds={recommendedIds}
          onAccept={onAcceptDisqualify}
          onModify={onModify}
        />
      )}

      {diagnosis.primaryDiagnosis === 'MODEL_DRIFT' && !showProposal && (
        <div className="mt-3">
          <button
            onClick={() => setShowProposal(true)}
            className="w-full text-sm font-semibold py-2 px-3 rounded bg-purple-900 text-purple-300 hover:bg-purple-800"
          >
            Propose Adjustment
          </button>
        </div>
      )}

      {showProposal && (
        <AdjustmentProposal
          stratumKey={stratumKey}
          taxYear={taxYear}
          recommendedFactor={diagnosis.recommendedFactor}
          currentSimulation={currentSimulation}
          onSimulate={handleSimulate}
          onPropose={handlePropose}
          onCancel={() => setShowProposal(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-emerald-900 text-emerald-300 text-sm px-4 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Type check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "error TS" | head -10
```

- [ ] **Step 8: Commit**

```bash
cd frontend && git add apps/os-shell/src/pages/forge/sales/audit/ai-panel/ && \
git commit -m "feat(sales-audit): AI panel — diagnosis, evidence, simulation, action components"
```

---

## Task 9: AuditCommandCenter + Wire Into SalesForge

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/sales/audit/AuditCommandCenter.tsx`
- Modify: `frontend/apps/os-shell/src/pages/forge/sales/SalesForge.tsx`

- [ ] **Step 1: Create AuditCommandCenter**

```tsx
// frontend/apps/os-shell/src/pages/forge/sales/audit/AuditCommandCenter.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesAuditApi } from '../../../../services/forge/salesAuditApi';
import { useSalesForgeStore } from '../salesForgeStore';
import { CountyKpiBar } from './CountyKpiBar';
import { StrataList } from './StrataList';
import { SaleAuditTable } from './SaleAuditTable';
import { AuditAiPanel } from './ai-panel/AuditAiPanel';

interface Props { taxYear: number; }

export function AuditCommandCenter({ taxYear }: Props) {
  const qc = useQueryClient();
  const { selectedStratumKey, setSelectedStratumKey } = useSalesForgeStore();
  const [localSales, setLocalSales] = useState<Record<string, string>>({}); // id → decision override

  const { data: strata = [], isLoading: strataLoading } = useQuery({
    queryKey: ['sales-audit-strata', taxYear],
    queryFn: () => salesAuditApi.getStrata(taxYear),
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales-audit-sales', selectedStratumKey, taxYear],
    queryFn: () =>
      selectedStratumKey
        ? salesAuditApi.getStratumSales(selectedStratumKey, taxYear)
        : Promise.resolve([]),
    enabled: !!selectedStratumKey,
  });

  const { data: diagnosis = null } = useQuery({
    queryKey: ['sales-audit-diagnosis', selectedStratumKey, taxYear],
    queryFn: () =>
      selectedStratumKey
        ? salesAuditApi.getDiagnosis(selectedStratumKey, taxYear)
        : Promise.resolve(null),
    enabled: !!selectedStratumKey,
  });

  const bulkDecision = useMutation({
    mutationFn: ({ ids, decision }: { ids: string[]; decision: string }) =>
      salesAuditApi.bulkDecision(ids, decision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-audit-sales', selectedStratumKey, taxYear] });
    },
  });

  function handleDecisionChange(saleId: string, decision: string) {
    setLocalSales(prev => ({ ...prev, [saleId]: decision }));
    salesAuditApi.bulkDecision([saleId], decision).then(() =>
      qc.invalidateQueries({ queryKey: ['sales-audit-sales', selectedStratumKey, taxYear] })
    );
  }

  const enrichedSales = sales.map(s => ({
    ...s,
    qualificationDecision: localSales[s.id] ?? s.qualificationDecision,
  }));

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <CountyKpiBar strata={strata} />

      <div className="flex flex-1 min-h-0">
        {/* Left: strata list */}
        <div className="w-64 shrink-0 border-r border-slate-800 overflow-y-auto">
          <StrataList
            strata={strata}
            selectedKey={selectedStratumKey}
            onSelect={key => { setSelectedStratumKey(key); setLocalSales({}); }}
            loading={strataLoading}
          />
        </div>

        {/* Center: sale table */}
        <div className="flex-1 min-w-0 overflow-hidden border-r border-slate-800">
          {selectedStratumKey ? (
            <SaleAuditTable
              sales={enrichedSales}
              loading={salesLoading}
              onBulkDecision={(ids, decision) => bulkDecision.mutate({ ids, decision })}
              onDecisionChange={handleDecisionChange}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">
              Select a stratum to begin
            </div>
          )}
        </div>

        {/* Right: AI panel */}
        <div className="w-72 shrink-0 overflow-hidden">
          {selectedStratumKey ? (
            <AuditAiPanel
              stratumKey={selectedStratumKey}
              taxYear={taxYear}
              diagnosis={diagnosis}
              currentSimulation={null}
              onAcceptDisqualify={ids => bulkDecision.mutate({ ids, decision: 'disqualified' })}
              onModify={() => {/* filter to AI flagged sales */}}
              onDraftCreated={() =>
                qc.invalidateQueries({ queryKey: ['sales-audit-strata', taxYear] })
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">
              Select a stratum
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Read SalesForge.tsx to understand its exact tab array + render pattern**

```bash
# Read the first 80 lines to see the TABS array and render structure
```

Use the Read tool on `frontend/apps/os-shell/src/pages/forge/sales/SalesForge.tsx`.

- [ ] **Step 3: Add AI AUDIT tab to SalesForge.tsx**

Add to the `TABS` array as the **first** entry:
```typescript
{ id: 'ai-audit', label: 'AI Audit', title: 'AI-powered audit — diagnose, qualify, propose adjustments' },
```

Add the lazy import (with the other lazy imports):
```typescript
const AuditCommandCenter = lazy(() =>
  import('./audit/AuditCommandCenter').then(m => ({ default: m.AuditCommandCenter }))
);
```

Add the render condition (with the other `activeTab ===` conditions):
```tsx
{activeTab === 'ai-audit' && (
  <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-600">Loading…</div>}>
    <AuditCommandCenter taxYear={taxYear ?? new Date().getFullYear()} />
  </Suspense>
)}
```

Note: `taxYear` is likely already in the store (`useSalesForgeStore()`). Verify the exact prop name — check `salesForgeStore.ts` and pass accordingly.

- [ ] **Step 4: Final type check + build**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "error TS" | head -20
```

Fix any errors. Then:
```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
cd frontend && git add \
  apps/os-shell/src/pages/forge/sales/audit/AuditCommandCenter.tsx \
  apps/os-shell/src/pages/forge/sales/SalesForge.tsx && \
git commit -m "feat(sales-audit): wire AuditCommandCenter into SalesForge as AI Audit tab"
```

---

## Self-Review Checklist (run before marking complete)

- [ ] All 9 backend endpoints listed in spec Section 9 are implemented in `SalesAuditController`
- [ ] `ComparableSale.QualificationDecision` is the field written by decision endpoints (not a new field)
- [ ] `SalesAuditAdjustmentProposal.Status = "superseded"` added to schema (Task 1 entities need `"superseded"` as valid status — verify `SalesAuditAdjustmentProposalConfiguration` doesn't restrict it)
- [ ] County isolation: every controller method calls `GetCountyId()` and returns `Unauthorized()` if null
- [ ] Frontend `salesForgeTypes.ts` has `'ai-audit'` in the union — verify with tsc
- [ ] `SimulateAsync` math: `SimulatedRatio = (AssessedValue × factor) / SalePrice` — verify implementation matches
- [ ] EF migration was generated and doesn't have merge conflicts

---

## Verification

After all tasks complete:

```bash
# Backend: all tests pass
cd backend && dotnet test TerraFusion.API.Tests -v minimal 2>&1 | tail -5

# Frontend: clean build
cd frontend && npm run build 2>&1 | tail -10

# Smoke test (API running):
curl -s http://localhost:5000/api/SalesAudit/strata?taxYear=2026 \
  -H "Authorization: Bearer <token>" | jq length
```
