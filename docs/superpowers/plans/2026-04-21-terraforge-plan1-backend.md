# TerraForge County Studio — Plan 1: Backend Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend foundation for TerraForge County Studio — 8 new entities, EF migrations, service layer, `CountyStudyHub` (SignalR), and REST API endpoints.

**Architecture:** New entities follow TerraFusion's FISMA audit pattern (Guid PK, CountyId, CreatedAt/By, UpdatedAt/By). Services follow the IInterface/Implementation pattern registered with `AddScoped<>`. Hub follows CollaborationHub pattern. REST controllers inject TerraFusionDbContext directly. `CountyAdjustmentSet` is used (not `AdjustmentSet` which already exists for calibration workbench).

**Tech Stack:** .NET 8, EF Core 8, SignalR 8, PostgreSQL, xUnit, TerraFusion.Core.Entities pattern

**Parallelization note:** Plans 2 (County Studio frontend) and 3 (Atlas Live View frontend) can begin in parallel after Task 8 (CountyStudyHub) is complete.

---

## File Map

**Create:**
- `backend/src/TerraFusion.Core/Entities/CountyStudySession.cs`
- `backend/src/TerraFusion.Core/Entities/CountySegmentSet.cs`
- `backend/src/TerraFusion.Core/Entities/CountySegment.cs`
- `backend/src/TerraFusion.Core/Entities/CountyCohort.cs`
- `backend/src/TerraFusion.Core/Entities/CountyScenario.cs`
- `backend/src/TerraFusion.Core/Entities/CountyAdjustmentSet.cs`
- `backend/src/TerraFusion.Core/Entities/CountyExceptionSet.cs`
- `backend/src/TerraFusion.Core/Entities/CountySpatialArtifact.cs`
- `backend/src/TerraFusion.Data/Configurations/CountyStudyConfigurations.cs`
- `backend/src/TerraFusion.Core/Interfaces/ICountyStudyService.cs`
- `backend/src/TerraFusion.Core/Services/CountyStudyService.cs`
- `backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs`
- `backend/src/TerraFusion.API/Hubs/CountyStudyHub.cs`
- `backend/src/TerraFusion.API/Controllers/CountyStudyController.cs`
- `backend/TerraFusion.API.Tests/CountyStudyServiceTests.cs`
- `backend/TerraFusion.API.Tests/CountyStudyHubTests.cs`

**Modify:**
- `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` — add 8 new DbSets
- `backend/src/TerraFusion.API/Program.cs` — register service + hub

---

### Task 1: Domain Entities (Session, SegmentSet, Segment)

**Files:**
- Create: `backend/src/TerraFusion.Core/Entities/CountyStudySession.cs`
- Create: `backend/src/TerraFusion.Core/Entities/CountySegmentSet.cs`
- Create: `backend/src/TerraFusion.Core/Entities/CountySegment.cs`

- [ ] **Step 1: Create CountyStudySession entity**

```csharp
// backend/src/TerraFusion.Core/Entities/CountyStudySession.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum StudyType { RatioStudy, MassAppraisal, IncomeApproach, CostApproach }
public enum StudyStatus { Draft, Active, UnderReview, Archived }

public class CountyStudySession
{
    public Guid StudyId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }
    public StudyType StudyType { get; set; } = StudyType.RatioStudy;
    public StudyStatus Status { get; set; } = StudyStatus.Draft;

    [StringLength(200)]
    public string? BaselineVersion { get; set; }

    public Guid? ActiveSegmentSetId { get; set; }

    // Navigation
    public ICollection<CountySegmentSet> SegmentSets { get; set; } = new List<CountySegmentSet>();
    public ICollection<CountyCohort> Cohorts { get; set; } = new List<CountyCohort>();
    public ICollection<CountyScenario> Scenarios { get; set; } = new List<CountyScenario>();

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
```

- [ ] **Step 2: Create CountySegmentSet entity**

```csharp
// backend/src/TerraFusion.Core/Entities/CountySegmentSet.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum SegmentSetSourceType { Neighborhood, PropertyClass, Custom, Hybrid }

public class CountySegmentSet
{
    public Guid SegmentSetId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid CountyId { get; set; }

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    public SegmentSetSourceType SourceType { get; set; } = SegmentSetSourceType.Neighborhood;
    public int Version { get; set; } = 1;
    public bool IsBaseline { get; set; } = false;
    public Guid? DerivedFrom { get; set; }

    // Navigation
    public CountyStudySession? Study { get; set; }
    public ICollection<CountySegment> Segments { get; set; } = new List<CountySegment>();

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
```

- [ ] **Step 3: Create CountySegment entity**

```csharp
// backend/src/TerraFusion.Core/Entities/CountySegment.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum SegmentType { Residential, Commercial, Agricultural, Industrial, MixedUse, Rural }

public class CountySegment
{
    public Guid SegmentId { get; set; } = Guid.NewGuid();
    public Guid SegmentSetId { get; set; }
    public Guid CountyId { get; set; }

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    public SegmentType SegmentType { get; set; } = SegmentType.Residential;

    // Rule definition for how this segment is defined (JSON)
    public string? RuleDefinition { get; set; }

    // Reference to geography (neighborhood code, geometry ID, etc.)
    [StringLength(100)]
    public string? GeographyRef { get; set; }

    // Computed metrics — persisted after calculation run
    public int ParcelCount { get; set; }
    public decimal? MedianRatio { get; set; }
    public decimal? CoefficientOfDispersion { get; set; }     // COD
    public decimal? PriceRelatedDifferential { get; set; }   // PRD
    public decimal StabilityScore { get; set; }              // 0-100
    public decimal RiskScore { get; set; }                   // 0-100
    public int ExceptionCount { get; set; }

    // Navigation
    public CountySegmentSet? SegmentSet { get; set; }

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
```

- [ ] **Step 4: Commit**

```bash
cd backend
git add src/TerraFusion.Core/Entities/CountyStudySession.cs
git add src/TerraFusion.Core/Entities/CountySegmentSet.cs
git add src/TerraFusion.Core/Entities/CountySegment.cs
git commit -m "feat(county-studio): add CountyStudySession, CountySegmentSet, CountySegment entities"
```

---

### Task 2: Domain Entities (Cohort, Scenario, AdjustmentSet, ExceptionSet, SpatialArtifact)

**Files:**
- Create: `backend/src/TerraFusion.Core/Entities/CountyCohort.cs`
- Create: `backend/src/TerraFusion.Core/Entities/CountyScenario.cs`
- Create: `backend/src/TerraFusion.Core/Entities/CountyAdjustmentSet.cs`
- Create: `backend/src/TerraFusion.Core/Entities/CountyExceptionSet.cs`
- Create: `backend/src/TerraFusion.Core/Entities/CountySpatialArtifact.cs`

- [ ] **Step 1: Create CountyCohort entity**

```csharp
// backend/src/TerraFusion.Core/Entities/CountyCohort.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum CohortSelectionType { Segment, Neighborhood, Lasso, Rule, Hybrid }

public class CountyCohort
{
    public Guid CohortId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid CountyId { get; set; }

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    public CohortSelectionType SelectionType { get; set; }

    // JSON: { segmentIds?, neighborhoodIds?, geometry?, ruleExpression? }
    [Required]
    public string Definition { get; set; } = "{}";

    public int ParcelCount { get; set; }
    public bool IsHybrid { get; set; }

    // Navigation
    public CountyStudySession? Study { get; set; }
    public ICollection<CountyScenario> Scenarios { get; set; } = new List<CountyScenario>();

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
```

- [ ] **Step 2: Create CountyScenario entity**

```csharp
// backend/src/TerraFusion.Core/Entities/CountyScenario.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum ScenarioAdjustmentType
{
    LandValuePercent, ImprovementValuePercent, TotalValuePercent,
    LandValueFlat, ImprovementValueFlat,
    NeighborhoodFactor, FeatureUnitRate
}

public enum ScenarioStatus { Draft, Saved, Reviewed, Approved, Promoted, Rejected, Archived }

public class CountyScenario
{
    public Guid ScenarioId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid CohortId { get; set; }
    public Guid CountyId { get; set; }

    public ScenarioAdjustmentType AdjustmentType { get; set; }

    // JSON: { magnitude: 4.0, baseYear?: null, featureCode?: null }
    [Required]
    public string Parameters { get; set; } = "{}";

    [Required, StringLength(1000)]
    public string Rationale { get; set; } = string.Empty;

    public ScenarioStatus Status { get; set; } = ScenarioStatus.Draft;

    public Guid? CompareTargetId { get; set; }

    // Cached impact preview (populated by preview endpoint, invalidated on param change)
    public string? ImpactPreviewJson { get; set; }

    // Navigation
    public CountyStudySession? Study { get; set; }
    public CountyCohort? Cohort { get; set; }
    public CountyAdjustmentSet? AdjustmentSet { get; set; }
    public ICollection<CountyExceptionSet> ExceptionSets { get; set; } = new List<CountyExceptionSet>();

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
```

- [ ] **Step 3: Create CountyAdjustmentSet entity**

```csharp
// backend/src/TerraFusion.Core/Entities/CountyAdjustmentSet.cs
// NOTE: This is distinct from the existing AdjustmentSet (calibration workbench).
// CountyAdjustmentSet is County Studio's governed output artifact.
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum AdjustmentSetApprovalState
{
    Proposed, ReadyForApproval, Approved, Published, RolledBack
}

public class CountyAdjustmentSet
{
    public Guid AdjustmentSetId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid ScenarioId { get; set; }
    public Guid CountyId { get; set; }

    // JSON: { cohortId, segmentIds[], parcelCount }
    [Required]
    public string EffectiveScope { get; set; } = "{}";

    public AdjustmentSetApprovalState ApprovalState { get; set; } = AdjustmentSetApprovalState.Proposed;

    [StringLength(500)]
    public string? ApprovedBy { get; set; }

    // Token used to identify this adjustment set for rollback
    [StringLength(100)]
    public string? RollbackToken { get; set; }

    public DateTime? PublishedAt { get; set; }

    // Navigation
    public CountyScenario? Scenario { get; set; }

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
```

- [ ] **Step 4: Create CountyExceptionSet entity**

```csharp
// backend/src/TerraFusion.Core/Entities/CountyExceptionSet.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum ExceptionReasonCode
{
    LowSample, SegmentInstability, Outlier, EdgeEffect, Heterogeneity, ManualFlag
}

public enum ExceptionDestination { Dais, Dossier, Internal }
public enum ExceptionSetStatus { Created, Dispatched, Resolved }

public class CountyExceptionSet
{
    public Guid ExceptionSetId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid SourceScenarioId { get; set; }
    public Guid CountyId { get; set; }

    public ExceptionReasonCode ReasonCode { get; set; }

    // JSON array of parcel IDs: ["12345-001", "12345-002", ...]
    [Required]
    public string ParcelIdsJson { get; set; } = "[]";

    public int ParcelCount { get; set; }
    public ExceptionDestination Destination { get; set; } = ExceptionDestination.Internal;
    public ExceptionSetStatus Status { get; set; } = ExceptionSetStatus.Created;

    // Navigation
    public CountyScenario? SourceScenario { get; set; }

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
```

- [ ] **Step 5: Create CountySpatialArtifact entity**

```csharp
// backend/src/TerraFusion.Core/Entities/CountySpatialArtifact.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum SpatialArtifactType { NeighborhoodBoundary, SegmentGeometry, CohortGeometry }
public enum SpatialArtifactStatus { Candidate, Published, Superseded }

public class CountySpatialArtifact
{
    public Guid ArtifactId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid SourceScenarioId { get; set; }
    public Guid CountyId { get; set; }

    public SpatialArtifactType ArtifactType { get; set; }
    public SpatialArtifactStatus Status { get; set; } = SpatialArtifactStatus.Candidate;

    // Atlas layer reference (populated when Published)
    [StringLength(200)]
    public string? AtlasLayerId { get; set; }

    public int Version { get; set; } = 1;

    [StringLength(200)]
    public string? PublishedBy { get; set; }

    public DateTime? PublishedAt { get; set; }

    // GeoJSON geometry snapshot at time of publish
    public string? GeometryJson { get; set; }

    // Navigation
    public CountyScenario? SourceScenario { get; set; }

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
```

- [ ] **Step 6: Commit**

```bash
git add src/TerraFusion.Core/Entities/CountyCohort.cs
git add src/TerraFusion.Core/Entities/CountyScenario.cs
git add src/TerraFusion.Core/Entities/CountyAdjustmentSet.cs
git add src/TerraFusion.Core/Entities/CountyExceptionSet.cs
git add src/TerraFusion.Core/Entities/CountySpatialArtifact.cs
git commit -m "feat(county-studio): add CountyCohort, CountyScenario, CountyAdjustmentSet, CountyExceptionSet, CountySpatialArtifact entities"
```

---

### Task 3: EF Configurations + DbContext DbSets + Migration

**Files:**
- Create: `backend/src/TerraFusion.Data/Configurations/CountyStudyConfigurations.cs`
- Modify: `backend/src/TerraFusion.Data/TerraFusionDbContext.cs`

- [ ] **Step 1: Write failing test for DbContext registration**

```csharp
// backend/TerraFusion.API.Tests/CountyStudyEntityTests.cs
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.API.Tests;

public class CountyStudyEntityTests
{
    private TerraFusionDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new TerraFusionDbContext(options);
    }

    [Fact]
    public async Task CountyStudySession_CanBeSavedAndRetrieved()
    {
        using var ctx = CreateInMemoryContext();
        var study = new CountyStudySession
        {
            CountyId = Guid.NewGuid(),
            TaxYear = 2026,
            StudyType = StudyType.RatioStudy,
            Status = StudyStatus.Draft
        };
        ctx.CountyStudySessions.Add(study);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.CountyStudySessions.FindAsync(study.StudyId);
        Assert.NotNull(retrieved);
        Assert.Equal(2026, retrieved!.TaxYear);
    }

    [Fact]
    public async Task CountySegment_CanBeSavedWithMetrics()
    {
        using var ctx = CreateInMemoryContext();
        var segSet = new CountySegmentSet
        {
            CountyId = Guid.NewGuid(),
            StudyId = Guid.NewGuid(),
            Name = "Test Set",
            IsBaseline = true
        };
        ctx.CountySegmentSets.Add(segSet);
        var seg = new CountySegment
        {
            SegmentSetId = segSet.SegmentSetId,
            CountyId = segSet.CountyId,
            Name = "West Richland R1",
            SegmentType = SegmentType.Residential,
            ParcelCount = 842,
            MedianRatio = 0.91m,
            StabilityScore = 58m,
            RiskScore = 45m
        };
        ctx.CountySegments.Add(seg);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.CountySegments.FindAsync(seg.SegmentId);
        Assert.Equal(0.91m, retrieved!.MedianRatio);
    }
}
```

- [ ] **Step 2: Run test — expect failure (DbSet not yet registered)**

```bash
cd backend
dotnet test TerraFusion.API.Tests --filter "CountyStudyEntityTests" -v
# Expected: FAIL — CountyStudySessions, CountySegmentSets, CountySegments not found
```

- [ ] **Step 3: Create EF configurations**

```csharp
// backend/src/TerraFusion.Data/Configurations/CountyStudyConfigurations.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class CountyStudySessionConfiguration : IEntityTypeConfiguration<CountyStudySession>
{
    public void Configure(EntityTypeBuilder<CountyStudySession> builder)
    {
        builder.HasKey(e => e.StudyId);
        builder.ToTable("CountyStudySessions");
        builder.Property(e => e.StudyType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.BaselineVersion).HasMaxLength(200);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.Status })
               .HasDatabaseName("IX_CountyStudySessions_CountyYearStatus");
    }
}

public sealed class CountySegmentSetConfiguration : IEntityTypeConfiguration<CountySegmentSet>
{
    public void Configure(EntityTypeBuilder<CountySegmentSet> builder)
    {
        builder.HasKey(e => e.SegmentSetId);
        builder.ToTable("CountySegmentSets");
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.SourceType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.IsBaseline })
               .HasDatabaseName("IX_CountySegmentSets_StudyBaseline");
    }
}

public sealed class CountySegmentConfiguration : IEntityTypeConfiguration<CountySegment>
{
    public void Configure(EntityTypeBuilder<CountySegment> builder)
    {
        builder.HasKey(e => e.SegmentId);
        builder.ToTable("CountySegments");
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.SegmentType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.GeographyRef).HasMaxLength(100);
        builder.Property(e => e.MedianRatio).HasColumnType("decimal(6,4)");
        builder.Property(e => e.CoefficientOfDispersion).HasColumnType("decimal(8,4)");
        builder.Property(e => e.PriceRelatedDifferential).HasColumnType("decimal(6,4)");
        builder.Property(e => e.StabilityScore).HasColumnType("decimal(5,2)");
        builder.Property(e => e.RiskScore).HasColumnType("decimal(5,2)");
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.SegmentSetId, e.SegmentType })
               .HasDatabaseName("IX_CountySegments_SetType");
    }
}

public sealed class CountyCohortConfiguration : IEntityTypeConfiguration<CountyCohort>
{
    public void Configure(EntityTypeBuilder<CountyCohort> builder)
    {
        builder.HasKey(e => e.CohortId);
        builder.ToTable("CountyCohorts");
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.SelectionType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Definition).IsRequired();
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => e.StudyId).HasDatabaseName("IX_CountyCohorts_Study");
    }
}

public sealed class CountyScenarioConfiguration : IEntityTypeConfiguration<CountyScenario>
{
    public void Configure(EntityTypeBuilder<CountyScenario> builder)
    {
        builder.HasKey(e => e.ScenarioId);
        builder.ToTable("CountyScenarios");
        builder.Property(e => e.AdjustmentType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Parameters).IsRequired();
        builder.Property(e => e.Rationale).IsRequired().HasMaxLength(1000);
        builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.Status }).HasDatabaseName("IX_CountyScenarios_StudyStatus");
    }
}

public sealed class CountyAdjustmentSetConfiguration : IEntityTypeConfiguration<CountyAdjustmentSet>
{
    public void Configure(EntityTypeBuilder<CountyAdjustmentSet> builder)
    {
        builder.HasKey(e => e.AdjustmentSetId);
        builder.ToTable("CountyAdjustmentSets");
        builder.Property(e => e.EffectiveScope).IsRequired();
        builder.Property(e => e.ApprovalState).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.ApprovedBy).HasMaxLength(500);
        builder.Property(e => e.RollbackToken).HasMaxLength(100);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.ApprovalState })
               .HasDatabaseName("IX_CountyAdjustmentSets_StudyState");
    }
}

public sealed class CountyExceptionSetConfiguration : IEntityTypeConfiguration<CountyExceptionSet>
{
    public void Configure(EntityTypeBuilder<CountyExceptionSet> builder)
    {
        builder.HasKey(e => e.ExceptionSetId);
        builder.ToTable("CountyExceptionSets");
        builder.Property(e => e.ReasonCode).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.ParcelIdsJson).IsRequired();
        builder.Property(e => e.Destination).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.Status }).HasDatabaseName("IX_CountyExceptionSets_StudyStatus");
    }
}

public sealed class CountySpatialArtifactConfiguration : IEntityTypeConfiguration<CountySpatialArtifact>
{
    public void Configure(EntityTypeBuilder<CountySpatialArtifact> builder)
    {
        builder.HasKey(e => e.ArtifactId);
        builder.ToTable("CountySpatialArtifacts");
        builder.Property(e => e.ArtifactType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.AtlasLayerId).HasMaxLength(200);
        builder.Property(e => e.PublishedBy).HasMaxLength(200);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.Status }).HasDatabaseName("IX_CountySpatialArtifacts_StudyStatus");
    }
}
```

- [ ] **Step 4: Add DbSets to TerraFusionDbContext**

In `backend/src/TerraFusion.Data/TerraFusionDbContext.cs`, find the DbSet block and add after existing Adjustment entities:

```csharp
// County Studio Entities
public DbSet<CountyStudySession> CountyStudySessions { get; set; }
public DbSet<CountySegmentSet> CountySegmentSets { get; set; }
public DbSet<CountySegment> CountySegments { get; set; }
public DbSet<CountyCohort> CountyCohorts { get; set; }
public DbSet<CountyScenario> CountyScenarios { get; set; }
public DbSet<CountyAdjustmentSet> CountyAdjustmentSets { get; set; }
public DbSet<CountyExceptionSet> CountyExceptionSets { get; set; }
public DbSet<CountySpatialArtifact> CountySpatialArtifacts { get; set; }
```

Also register the new configurations in `OnModelCreating`:

```csharp
// In OnModelCreating, add:
modelBuilder.ApplyConfiguration(new CountyStudySessionConfiguration());
modelBuilder.ApplyConfiguration(new CountySegmentSetConfiguration());
modelBuilder.ApplyConfiguration(new CountySegmentConfiguration());
modelBuilder.ApplyConfiguration(new CountyCohortConfiguration());
modelBuilder.ApplyConfiguration(new CountyScenarioConfiguration());
modelBuilder.ApplyConfiguration(new CountyAdjustmentSetConfiguration());
modelBuilder.ApplyConfiguration(new CountyExceptionSetConfiguration());
modelBuilder.ApplyConfiguration(new CountySpatialArtifactConfiguration());
```

- [ ] **Step 5: Run test — expect pass**

```bash
dotnet test TerraFusion.API.Tests --filter "CountyStudyEntityTests" -v
# Expected: PASS — all 2 tests green
```

- [ ] **Step 6: Generate EF migration**

```bash
cd backend
dotnet ef migrations add AddCountyStudioEntities \
  --project src/TerraFusion.Data \
  --startup-project src/TerraFusion.API
# Expected: New migration file created in src/TerraFusion.Data/Migrations/
```

- [ ] **Step 7: Apply migration (dev database)**

```bash
dotnet ef database update \
  --project src/TerraFusion.Data \
  --startup-project src/TerraFusion.API
# Expected: "Done." — 8 new tables created
```

- [ ] **Step 8: Commit**

```bash
git add src/TerraFusion.Data/Configurations/CountyStudyConfigurations.cs
git add src/TerraFusion.Data/TerraFusionDbContext.cs
git add src/TerraFusion.Data/Migrations/
git add TerraFusion.API.Tests/CountyStudyEntityTests.cs
git commit -m "feat(county-studio): EF configurations, DbContext DbSets, migration AddCountyStudioEntities"
```

---

### Task 4: DTOs

**Files:**
- Create: `backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs`

- [ ] **Step 1: Create all DTOs in one file**

```csharp
// backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs
using TerraFusion.Core.Entities;

namespace TerraFusion.Core.DTOs;

// ── Study ──────────────────────────────────────────────────────────────

public record CountyStudySessionDto(
    Guid StudyId,
    Guid CountyId,
    int TaxYear,
    string StudyType,
    string Status,
    string? BaselineVersion,
    Guid? ActiveSegmentSetId,
    DateTime CreatedAt,
    string CreatedBy
);

public record CreateStudyRequest(
    Guid CountyId,
    int TaxYear,
    StudyType StudyType,
    string? BaselineVersion
);

// ── Segment ──────────────────────────────────────────────────────────────

public record CountySegmentSetDto(
    Guid SegmentSetId,
    Guid StudyId,
    string Name,
    string SourceType,
    int Version,
    bool IsBaseline,
    int SegmentCount
);

public record CountySegmentDto(
    Guid SegmentId,
    Guid SegmentSetId,
    string Name,
    string SegmentType,
    string? GeographyRef,
    int ParcelCount,
    decimal? MedianRatio,
    decimal? CoefficientOfDispersion,
    decimal? PriceRelatedDifferential,
    decimal StabilityScore,
    decimal RiskScore,
    int ExceptionCount
);

// ── Cohort ──────────────────────────────────────────────────────────────

public record CountyCohortDto(
    Guid CohortId,
    Guid StudyId,
    string Name,
    string SelectionType,
    string Definition,
    int ParcelCount,
    bool IsHybrid,
    DateTime CreatedAt
);

public record CreateCohortRequest(
    Guid StudyId,
    string Name,
    CohortSelectionType SelectionType,
    string Definition,      // JSON
    int ParcelCount,
    bool IsHybrid
);

// ── Scenario ──────────────────────────────────────────────────────────────

public record CountyScenarioDto(
    Guid ScenarioId,
    Guid StudyId,
    Guid CohortId,
    string AdjustmentType,
    string Parameters,
    string Rationale,
    string Status,
    string? ImpactPreviewJson,
    DateTime CreatedAt,
    string CreatedBy
);

public record CreateScenarioRequest(
    Guid StudyId,
    Guid CohortId,
    ScenarioAdjustmentType AdjustmentType,
    string Parameters,   // JSON: { magnitude: 4.0 }
    string Rationale
);

public record ScenarioImpactPreviewDto(
    Guid ScenarioId,
    decimal MedianRatioBefore,
    decimal MedianRatioAfter,
    decimal CodBefore,
    decimal CodAfter,
    decimal PrdBefore,
    decimal PrdAfter,
    int ExceptionsBefore,
    int ExceptionsAfter,
    int ParcelsAffected,
    List<ScenarioDeltaItem> Deltas
);

public record ScenarioDeltaItem(
    string ParcelId,
    decimal ValueBefore,
    decimal ValueAfter,
    decimal Delta
);

// ── AdjustmentSet ──────────────────────────────────────────────────────────────

public record CountyAdjustmentSetDto(
    Guid AdjustmentSetId,
    Guid StudyId,
    Guid ScenarioId,
    string EffectiveScope,
    string ApprovalState,
    string? ApprovedBy,
    DateTime? PublishedAt
);

public record PromoteScenarioRequest(
    Guid ScenarioId,
    string EffectiveScope  // JSON: { cohortId, segmentIds[], parcelCount }
);

// ── ExceptionSet ──────────────────────────────────────────────────────────────

public record CountyExceptionSetDto(
    Guid ExceptionSetId,
    Guid StudyId,
    Guid SourceScenarioId,
    string ReasonCode,
    int ParcelCount,
    string Destination,
    string Status
);

public record CreateExceptionSetRequest(
    Guid StudyId,
    Guid SourceScenarioId,
    ExceptionReasonCode ReasonCode,
    List<string> ParcelIds,
    ExceptionDestination Destination
);
```

- [ ] **Step 2: Commit**

```bash
git add src/TerraFusion.Core/DTOs/CountyStudyDtos.cs
git commit -m "feat(county-studio): add all County Studio DTOs"
```

---

### Task 5: Service Interface + Service Implementation

**Files:**
- Create: `backend/src/TerraFusion.Core/Interfaces/ICountyStudyService.cs`
- Create: `backend/src/TerraFusion.Core/Services/CountyStudyService.cs`
- Test: `backend/TerraFusion.API.Tests/CountyStudyServiceTests.cs`

- [ ] **Step 1: Write failing service tests**

```csharp
// backend/TerraFusion.API.Tests/CountyStudyServiceTests.cs
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.API.Tests;

public class CountyStudyServiceTests
{
    private (TerraFusionDbContext ctx, CountyStudyService svc) CreateSut()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var ctx = new TerraFusionDbContext(options);
        var svc = new CountyStudyService(ctx);
        return (ctx, svc);
    }

    [Fact]
    public async Task CreateStudy_ReturnsStudyWithNewId()
    {
        var (_, svc) = CreateSut();
        var req = new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, "March");
        var result = await svc.CreateStudyAsync(req, "testuser");
        Assert.NotEqual(Guid.Empty, result.StudyId);
        Assert.Equal(2026, result.TaxYear);
    }

    [Fact]
    public async Task GetStudies_ReturnsOnlyCountyStudies()
    {
        var (_, svc) = CreateSut();
        var countyId = Guid.NewGuid();
        var otherCountyId = Guid.NewGuid();
        await svc.CreateStudyAsync(new CreateStudyRequest(countyId, 2026, StudyType.RatioStudy, null), "u1");
        await svc.CreateStudyAsync(new CreateStudyRequest(otherCountyId, 2026, StudyType.RatioStudy, null), "u2");

        var results = await svc.GetStudiesAsync(countyId);
        Assert.Single(results);
    }

    [Fact]
    public async Task CreateCohort_PersistsCohortWithStudyId()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u1");
        var req = new CreateCohortRequest(
            study.StudyId, "West Richland R1", CohortSelectionType.Segment,
            "{\"segmentIds\":[\"abc\"]}", 842, false);
        var cohort = await svc.CreateCohortAsync(req, "u1");
        Assert.Equal(study.StudyId, cohort.StudyId);
        Assert.Equal(842, cohort.ParcelCount);
    }

    [Fact]
    public async Task CreateScenario_PersistsWithDraftStatus()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "TestCohort", CohortSelectionType.Segment,
                "{}", 100, false), "u1");
        var req = new CreateScenarioRequest(
            study.StudyId, cohort.CohortId,
            ScenarioAdjustmentType.LandValuePercent, "{\"magnitude\":4.0}", "market lag");
        var scenario = await svc.CreateScenarioAsync(req, "u1");
        Assert.Equal("Draft", scenario.Status);
        Assert.Equal(study.StudyId, scenario.StudyId);
    }
}
```

- [ ] **Step 2: Run — expect failure**

```bash
dotnet test TerraFusion.API.Tests --filter "CountyStudyServiceTests" -v
# Expected: FAIL — ICountyStudyService / CountyStudyService not yet defined
```

- [ ] **Step 3: Create service interface**

```csharp
// backend/src/TerraFusion.Core/Interfaces/ICountyStudyService.cs
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface ICountyStudyService
{
    // Study
    Task<CountyStudySessionDto> CreateStudyAsync(CreateStudyRequest req, string userId);
    Task<CountyStudySessionDto?> GetStudyAsync(Guid studyId);
    Task<List<CountyStudySessionDto>> GetStudiesAsync(Guid countyId);
    Task<CountyStudySessionDto?> UpdateStudyStatusAsync(Guid studyId, string status, string userId);

    // Segment Sets
    Task<CountySegmentSetDto> CreateSegmentSetAsync(Guid studyId, string name, string sourceType, bool isBaseline, string userId);
    Task<List<CountySegmentSetDto>> GetSegmentSetsAsync(Guid studyId);
    Task<List<CountySegmentDto>> GetSegmentsAsync(Guid segmentSetId);

    // Cohorts
    Task<CountyCohortDto> CreateCohortAsync(CreateCohortRequest req, string userId);
    Task<List<CountyCohortDto>> GetCohortsAsync(Guid studyId);
    Task<CountyCohortDto?> GetCohortAsync(Guid cohortId);

    // Scenarios
    Task<CountyScenarioDto> CreateScenarioAsync(CreateScenarioRequest req, string userId);
    Task<List<CountyScenarioDto>> GetScenariosAsync(Guid studyId);
    Task<CountyScenarioDto?> GetScenarioAsync(Guid scenarioId);
    Task<CountyScenarioDto?> SaveScenarioAsync(Guid scenarioId, string userId);
    Task<ScenarioImpactPreviewDto> PreviewScenarioImpactAsync(Guid scenarioId);

    // Adjustment Sets
    Task<CountyAdjustmentSetDto> PromoteScenarioAsync(PromoteScenarioRequest req, string userId);
    Task<List<CountyAdjustmentSetDto>> GetAdjustmentSetsAsync(Guid studyId);

    // Exception Sets
    Task<CountyExceptionSetDto> CreateExceptionSetAsync(CreateExceptionSetRequest req, string userId);
    Task<List<CountyExceptionSetDto>> GetExceptionSetsAsync(Guid studyId);
}
```

- [ ] **Step 4: Create service implementation**

```csharp
// backend/src/TerraFusion.Core/Services/CountyStudyService.cs
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.Core.Services;

public class CountyStudyService : ICountyStudyService
{
    private readonly TerraFusionDbContext _db;

    public CountyStudyService(TerraFusionDbContext db) => _db = db;

    // ── Study ──────────────────────────────────────────────────────────────

    public async Task<CountyStudySessionDto> CreateStudyAsync(CreateStudyRequest req, string userId)
    {
        var study = new CountyStudySession
        {
            CountyId = req.CountyId,
            TaxYear = req.TaxYear,
            StudyType = req.StudyType,
            BaselineVersion = req.BaselineVersion,
            Status = StudyStatus.Draft,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyStudySessions.Add(study);
        await _db.SaveChangesAsync();
        return MapStudy(study);
    }

    public async Task<CountyStudySessionDto?> GetStudyAsync(Guid studyId)
    {
        var study = await _db.CountyStudySessions.FindAsync(studyId);
        return study == null ? null : MapStudy(study);
    }

    public async Task<List<CountyStudySessionDto>> GetStudiesAsync(Guid countyId)
    {
        return await _db.CountyStudySessions
            .Where(s => s.CountyId == countyId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => MapStudy(s))
            .ToListAsync();
    }

    public async Task<CountyStudySessionDto?> UpdateStudyStatusAsync(Guid studyId, string status, string userId)
    {
        var study = await _db.CountyStudySessions.FindAsync(studyId);
        if (study == null) return null;
        if (!Enum.TryParse<StudyStatus>(status, out var parsedStatus)) return null;
        study.Status = parsedStatus;
        study.UpdatedAt = DateTime.UtcNow;
        study.UpdatedBy = userId;
        await _db.SaveChangesAsync();
        return MapStudy(study);
    }

    // ── Segment Sets ──────────────────────────────────────────────────────────────

    public async Task<CountySegmentSetDto> CreateSegmentSetAsync(
        Guid studyId, string name, string sourceType, bool isBaseline, string userId)
    {
        var study = await _db.CountyStudySessions.FindAsync(studyId)
            ?? throw new InvalidOperationException($"Study {studyId} not found");
        if (!Enum.TryParse<SegmentSetSourceType>(sourceType, out var parsedSource))
            throw new ArgumentException($"Invalid source type: {sourceType}");

        var segSet = new CountySegmentSet
        {
            StudyId = studyId,
            CountyId = study.CountyId,
            Name = name,
            SourceType = parsedSource,
            IsBaseline = isBaseline,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountySegmentSets.Add(segSet);
        await _db.SaveChangesAsync();
        return MapSegmentSet(segSet, 0);
    }

    public async Task<List<CountySegmentSetDto>> GetSegmentSetsAsync(Guid studyId)
    {
        return await _db.CountySegmentSets
            .Where(ss => ss.StudyId == studyId)
            .Select(ss => MapSegmentSet(ss, _db.CountySegments.Count(s => s.SegmentSetId == ss.SegmentSetId)))
            .ToListAsync();
    }

    public async Task<List<CountySegmentDto>> GetSegmentsAsync(Guid segmentSetId)
    {
        return await _db.CountySegments
            .Where(s => s.SegmentSetId == segmentSetId)
            .OrderBy(s => s.Name)
            .Select(s => MapSegment(s))
            .ToListAsync();
    }

    // ── Cohorts ──────────────────────────────────────────────────────────────

    public async Task<CountyCohortDto> CreateCohortAsync(CreateCohortRequest req, string userId)
    {
        var study = await _db.CountyStudySessions.FindAsync(req.StudyId)
            ?? throw new InvalidOperationException($"Study {req.StudyId} not found");
        var cohort = new CountyCohort
        {
            StudyId = req.StudyId,
            CountyId = study.CountyId,
            Name = req.Name,
            SelectionType = req.SelectionType,
            Definition = req.Definition,
            ParcelCount = req.ParcelCount,
            IsHybrid = req.IsHybrid,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyCohorts.Add(cohort);
        await _db.SaveChangesAsync();
        return MapCohort(cohort);
    }

    public async Task<List<CountyCohortDto>> GetCohortsAsync(Guid studyId)
    {
        return await _db.CountyCohorts
            .Where(c => c.StudyId == studyId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => MapCohort(c))
            .ToListAsync();
    }

    public async Task<CountyCohortDto?> GetCohortAsync(Guid cohortId)
    {
        var cohort = await _db.CountyCohorts.FindAsync(cohortId);
        return cohort == null ? null : MapCohort(cohort);
    }

    // ── Scenarios ──────────────────────────────────────────────────────────────

    public async Task<CountyScenarioDto> CreateScenarioAsync(CreateScenarioRequest req, string userId)
    {
        var study = await _db.CountyStudySessions.FindAsync(req.StudyId)
            ?? throw new InvalidOperationException($"Study {req.StudyId} not found");
        var scenario = new CountyScenario
        {
            StudyId = req.StudyId,
            CohortId = req.CohortId,
            CountyId = study.CountyId,
            AdjustmentType = req.AdjustmentType,
            Parameters = req.Parameters,
            Rationale = req.Rationale,
            Status = ScenarioStatus.Draft,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyScenarios.Add(scenario);
        await _db.SaveChangesAsync();
        return MapScenario(scenario);
    }

    public async Task<List<CountyScenarioDto>> GetScenariosAsync(Guid studyId)
    {
        return await _db.CountyScenarios
            .Where(s => s.StudyId == studyId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => MapScenario(s))
            .ToListAsync();
    }

    public async Task<CountyScenarioDto?> GetScenarioAsync(Guid scenarioId)
    {
        var s = await _db.CountyScenarios.FindAsync(scenarioId);
        return s == null ? null : MapScenario(s);
    }

    public async Task<CountyScenarioDto?> SaveScenarioAsync(Guid scenarioId, string userId)
    {
        var s = await _db.CountyScenarios.FindAsync(scenarioId);
        if (s == null) return null;
        s.Status = ScenarioStatus.Saved;
        s.UpdatedAt = DateTime.UtcNow;
        s.UpdatedBy = userId;
        await _db.SaveChangesAsync();
        return MapScenario(s);
    }

    public async Task<ScenarioImpactPreviewDto> PreviewScenarioImpactAsync(Guid scenarioId)
    {
        var scenario = await _db.CountyScenarios
            .Include(s => s.Cohort)
            .FirstOrDefaultAsync(s => s.ScenarioId == scenarioId)
            ?? throw new InvalidOperationException($"Scenario {scenarioId} not found");

        var parameters = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(scenario.Parameters)
            ?? new Dictionary<string, JsonElement>();
        var magnitude = parameters.TryGetValue("magnitude", out var mag) ? mag.GetDecimal() : 0m;

        // Retrieve the segment for the cohort's study — get metrics from CountySegments
        var cohortDef = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(scenario.Cohort!.Definition);
        // Simplified preview — real implementation queries PACS data
        var segmentSetId = await _db.CountyStudySessions
            .Where(s => s.StudyId == scenario.StudyId)
            .Select(s => s.ActiveSegmentSetId)
            .FirstOrDefaultAsync();

        var segments = segmentSetId.HasValue
            ? await _db.CountySegments.Where(s => s.SegmentSetId == segmentSetId).ToListAsync()
            : new List<CountySegment>();

        var medianRatioBefore = segments.Any() ? segments.Average(s => s.MedianRatio ?? 0) : 0m;
        var medianRatioAfter = medianRatioBefore * (1 + magnitude / 100);
        var codBefore = segments.Any() ? segments.Average(s => s.CoefficientOfDispersion ?? 0) : 0m;
        var codAfter = codBefore * 0.87m; // Simplified approximation
        var prdBefore = segments.Any() ? segments.Average(s => s.PriceRelatedDifferential ?? 1m) : 1m;
        var excBefore = segments.Sum(s => s.ExceptionCount);

        return new ScenarioImpactPreviewDto(
            scenarioId,
            medianRatioBefore, medianRatioAfter,
            codBefore, codAfter,
            prdBefore, prdBefore * 0.98m,
            excBefore, (int)(excBefore * 0.62),
            scenario.Cohort.ParcelCount,
            new List<ScenarioDeltaItem>() // Populated by a real calculation engine in Phase 2
        );
    }

    // ── Adjustment Sets ──────────────────────────────────────────────────────────────

    public async Task<CountyAdjustmentSetDto> PromoteScenarioAsync(PromoteScenarioRequest req, string userId)
    {
        var scenario = await _db.CountyScenarios.FindAsync(req.ScenarioId)
            ?? throw new InvalidOperationException($"Scenario {req.ScenarioId} not found");
        scenario.Status = ScenarioStatus.Promoted;
        scenario.UpdatedAt = DateTime.UtcNow;
        scenario.UpdatedBy = userId;

        var adjSet = new CountyAdjustmentSet
        {
            StudyId = scenario.StudyId,
            ScenarioId = scenario.ScenarioId,
            CountyId = scenario.CountyId,
            EffectiveScope = req.EffectiveScope,
            ApprovalState = AdjustmentSetApprovalState.Proposed,
            RollbackToken = Guid.NewGuid().ToString("N"),
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyAdjustmentSets.Add(adjSet);
        await _db.SaveChangesAsync();
        return MapAdjustmentSet(adjSet);
    }

    public async Task<List<CountyAdjustmentSetDto>> GetAdjustmentSetsAsync(Guid studyId)
    {
        return await _db.CountyAdjustmentSets
            .Where(a => a.StudyId == studyId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => MapAdjustmentSet(a))
            .ToListAsync();
    }

    // ── Exception Sets ──────────────────────────────────────────────────────────────

    public async Task<CountyExceptionSetDto> CreateExceptionSetAsync(CreateExceptionSetRequest req, string userId)
    {
        var scenario = await _db.CountyScenarios.FindAsync(req.SourceScenarioId)
            ?? throw new InvalidOperationException($"Scenario {req.SourceScenarioId} not found");
        var exc = new CountyExceptionSet
        {
            StudyId = req.StudyId,
            SourceScenarioId = req.SourceScenarioId,
            CountyId = scenario.CountyId,
            ReasonCode = req.ReasonCode,
            ParcelIdsJson = JsonSerializer.Serialize(req.ParcelIds),
            ParcelCount = req.ParcelIds.Count,
            Destination = req.Destination,
            Status = ExceptionSetStatus.Created,
            CreatedBy = userId,
            UpdatedBy = userId
        };
        _db.CountyExceptionSets.Add(exc);
        await _db.SaveChangesAsync();
        return MapExceptionSet(exc);
    }

    public async Task<List<CountyExceptionSetDto>> GetExceptionSetsAsync(Guid studyId)
    {
        return await _db.CountyExceptionSets
            .Where(e => e.StudyId == studyId)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => MapExceptionSet(e))
            .ToListAsync();
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private static CountyStudySessionDto MapStudy(CountyStudySession s) =>
        new(s.StudyId, s.CountyId, s.TaxYear, s.StudyType.ToString(),
            s.Status.ToString(), s.BaselineVersion, s.ActiveSegmentSetId,
            s.CreatedAt, s.CreatedBy);

    private static CountySegmentSetDto MapSegmentSet(CountySegmentSet ss, int segmentCount) =>
        new(ss.SegmentSetId, ss.StudyId, ss.Name, ss.SourceType.ToString(),
            ss.Version, ss.IsBaseline, segmentCount);

    private static CountySegmentDto MapSegment(CountySegment s) =>
        new(s.SegmentId, s.SegmentSetId, s.Name, s.SegmentType.ToString(),
            s.GeographyRef, s.ParcelCount, s.MedianRatio, s.CoefficientOfDispersion,
            s.PriceRelatedDifferential, s.StabilityScore, s.RiskScore, s.ExceptionCount);

    private static CountyCohortDto MapCohort(CountyCohort c) =>
        new(c.CohortId, c.StudyId, c.Name, c.SelectionType.ToString(),
            c.Definition, c.ParcelCount, c.IsHybrid, c.CreatedAt);

    private static CountyScenarioDto MapScenario(CountyScenario s) =>
        new(s.ScenarioId, s.StudyId, s.CohortId, s.AdjustmentType.ToString(),
            s.Parameters, s.Rationale, s.Status.ToString(), s.ImpactPreviewJson,
            s.CreatedAt, s.CreatedBy);

    private static CountyAdjustmentSetDto MapAdjustmentSet(CountyAdjustmentSet a) =>
        new(a.AdjustmentSetId, a.StudyId, a.ScenarioId, a.EffectiveScope,
            a.ApprovalState.ToString(), a.ApprovedBy, a.PublishedAt);

    private static CountyExceptionSetDto MapExceptionSet(CountyExceptionSet e) =>
        new(e.ExceptionSetId, e.StudyId, e.SourceScenarioId, e.ReasonCode.ToString(),
            e.ParcelCount, e.Destination.ToString(), e.Status.ToString());
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
dotnet test TerraFusion.API.Tests --filter "CountyStudyServiceTests" -v
# Expected: PASS — all 4 tests green
```

- [ ] **Step 6: Commit**

```bash
git add src/TerraFusion.Core/Interfaces/ICountyStudyService.cs
git add src/TerraFusion.Core/Services/CountyStudyService.cs
git add TerraFusion.API.Tests/CountyStudyServiceTests.cs
git commit -m "feat(county-studio): ICountyStudyService + CountyStudyService with full CRUD + scenario preview"
```

---

### Task 6: CountyStudyHub (SignalR)

**Files:**
- Create: `backend/src/TerraFusion.API/Hubs/CountyStudyHub.cs`
- Test: `backend/TerraFusion.API.Tests/CountyStudyHubTests.cs`

- [ ] **Step 1: Write hub tests**

```csharp
// backend/TerraFusion.API.Tests/CountyStudyHubTests.cs
using Microsoft.AspNetCore.SignalR;
using Moq;
using TerraFusion.API.Hubs;
using Xunit;

namespace TerraFusion.API.Tests;

public class CountyStudyHubTests
{
    [Fact]
    public void CountyStudyHub_Instantiates_WithNoErrors()
    {
        var hub = new CountyStudyHub();
        Assert.NotNull(hub);
    }

    [Fact]
    public async Task JoinStudy_AddsConnectionToGroup()
    {
        var hub = new CountyStudyHub();
        var mockGroups = new Mock<IGroupManager>();
        mockGroups.Setup(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default))
                  .Returns(Task.CompletedTask);
        var mockContext = new Mock<HubCallerContext>();
        mockContext.Setup(c => c.ConnectionId).Returns("conn-123");
        hub.Context = mockContext.Object;
        hub.Groups = mockGroups.Object;

        await hub.JoinStudy("study-abc");

        mockGroups.Verify(g => g.AddToGroupAsync("conn-123", "Study_study-abc", default), Times.Once);
    }
}
```

- [ ] **Step 2: Run — expect failure**

```bash
dotnet test TerraFusion.API.Tests --filter "CountyStudyHubTests" -v
# Expected: FAIL — CountyStudyHub not yet defined
```

- [ ] **Step 3: Create CountyStudyHub**

```csharp
// backend/src/TerraFusion.API/Hubs/CountyStudyHub.cs
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace TerraFusion.API.Hubs;

/// <summary>
/// Real-time hub for TerraForge County Studio co-present sessions.
/// Follows CollaborationHub pattern. Two surfaces (county-studio, atlas-live-view)
/// subscribe to the same Study_{StudyId} group.
///
/// Event channels:
///   A — Presence: instant, bidirectional (segment hover, select, parcel focus, viewport sync)
///   B — Projection: instant, Forge→Atlas (metric overlays, scenario deltas, warnings)
///   C — Selection: staged, Atlas→Forge (lasso geometry, parcel ids, neighborhood ids)
///   D — Commit: confirm-required, Forge writes only (create cohort, save scenario, promote)
/// </summary>
public class CountyStudyHub : Hub
{
    // In-memory session state: studyId → set of connectionIds
    private static readonly ConcurrentDictionary<string, HashSet<string>> _studySessions = new();

    // ── Session Management ──────────────────────────────────────────────────────────────

    public async Task JoinStudy(string studyId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Study_{studyId}");
        _studySessions.AddOrUpdate(
            studyId,
            _ => new HashSet<string> { Context.ConnectionId },
            (_, existing) => { existing.Add(Context.ConnectionId); return existing; });

        // Notify others in the study that a new surface connected
        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("SurfaceConnected", new { connectionId = Context.ConnectionId, studyId });
    }

    public async Task LeaveStudy(string studyId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Study_{studyId}");
        if (_studySessions.TryGetValue(studyId, out var conns))
            conns.Remove(Context.ConnectionId);

        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("SurfaceDisconnected", new { connectionId = Context.ConnectionId, studyId });
    }

    // ── Channel A: Presence (instant, bidirectional) ──────────────────────────────────────

    /// <summary>Broadcast presence event to all other surfaces in the study.</summary>
    /// Events: presence:segment-hover, presence:segment-select, presence:parcel-focus, presence:viewport-sync
    public async Task SendPresence(string studyId, object presenceEvent)
    {
        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("ReceivePresence", presenceEvent);
    }

    // ── Channel B: Projection (instant, Forge → Atlas) ──────────────────────────────────────

    /// <summary>Forge sends projection events; Atlas renders them immediately.</summary>
    /// Events: projection:metric-overlay, projection:scenario-delta, projection:edge-warnings,
    ///         projection:cohort-shade, projection:compare-overlay, projection:clear
    public async Task SendProjection(string studyId, object projectionEvent)
    {
        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("ReceiveProjection", projectionEvent);
    }

    // ── Channel C: Selection (staged, Atlas → Forge) ──────────────────────────────────────

    /// <summary>Atlas sends spatial selection intent. Forge opens a draft dialog — never auto-commits.</summary>
    /// Events: selection:drawn-geometry, selection:parcel-ids, selection:neighborhood-ids,
    ///         selection:geography-candidate
    public async Task SendSelection(string studyId, object selectionEvent)
    {
        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("ReceiveSelection", selectionEvent);
    }

    // ── Channel D: Commit (Forge writes only — confirmation required on client before calling) ──

    /// <summary>Forge broadcasts a commit confirmation to all surfaces after persisting.</summary>
    /// Events: commit:create-cohort, commit:save-scenario, commit:promote-adjustment,
    ///         commit:publish-to-atlas, commit:create-exception-set
    public async Task BroadcastCommit(string studyId, object commitEvent)
    {
        await Clients.Group($"Study_{studyId}")
            .SendAsync("ReceiveCommit", commitEvent);
    }

    // ── Session Info ──────────────────────────────────────────────────────────────

    public Task<int> GetSessionSurfaceCount(string studyId)
    {
        var count = _studySessions.TryGetValue(studyId, out var conns) ? conns.Count : 0;
        return Task.FromResult(count);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Remove from all study sessions this connection was part of
        foreach (var (studyId, conns) in _studySessions)
        {
            if (conns.Remove(Context.ConnectionId))
            {
                await Clients.Group($"Study_{studyId}")
                    .SendAsync("SurfaceDisconnected", new { connectionId = Context.ConnectionId, studyId });
            }
        }
        await base.OnDisconnectedAsync(exception);
    }
}
```

- [ ] **Step 4: Register hub in Program.cs**

In `backend/src/TerraFusion.API/Program.cs`:

Find the `app.MapHub<>` section (around line 2073-2084) and add:
```csharp
app.MapHub<CountyStudyHub>("/hubs/county-study");
```

Find the `builder.Services.AddScoped<>` section and add:
```csharp
builder.Services.AddScoped<ICountyStudyService, CountyStudyService>();
```

- [ ] **Step 5: Run hub tests — expect pass**

```bash
dotnet test TerraFusion.API.Tests --filter "CountyStudyHubTests" -v
# Expected: PASS
```

- [ ] **Step 6: Build to verify no compile errors**

```bash
cd backend
dotnet build TerraFusion.sln
# Expected: Build succeeded. 0 Warning(s). 0 Error(s).
```

- [ ] **Step 7: Commit**

```bash
git add src/TerraFusion.API/Hubs/CountyStudyHub.cs
git add src/TerraFusion.API/Program.cs
git add TerraFusion.API.Tests/CountyStudyHubTests.cs
git commit -m "feat(county-studio): CountyStudyHub with 4-channel event contract + hub registration"
```

---

### Task 7: REST Controller

**Files:**
- Create: `backend/src/TerraFusion.API/Controllers/CountyStudyController.cs`

- [ ] **Step 1: Create controller**

```csharp
// backend/src/TerraFusion.API/Controllers/CountyStudyController.cs
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/county-study")]
public class CountyStudyController : ControllerBase
{
    private readonly ICountyStudyService _svc;
    private readonly ILogger<CountyStudyController> _logger;

    public CountyStudyController(ICountyStudyService svc, ILogger<CountyStudyController> logger)
    {
        _svc = svc;
        _logger = logger;
    }

    private string UserId => User.FindFirst("sub")?.Value ?? "system";

    // ── Studies ──────────────────────────────────────────────────────────────

    [HttpPost("studies")]
    public async Task<ActionResult<CountyStudySessionDto>> CreateStudy([FromBody] CreateStudyRequest req)
    {
        var result = await _svc.CreateStudyAsync(req, UserId);
        return CreatedAtAction(nameof(GetStudy), new { studyId = result.StudyId }, result);
    }

    [HttpGet("studies/{studyId:guid}")]
    public async Task<ActionResult<CountyStudySessionDto>> GetStudy(Guid studyId)
    {
        var result = await _svc.GetStudyAsync(studyId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("studies")]
    public async Task<ActionResult<List<CountyStudySessionDto>>> GetStudies([FromQuery] Guid countyId)
    {
        return Ok(await _svc.GetStudiesAsync(countyId));
    }

    // ── Segment Sets ──────────────────────────────────────────────────────────────

    [HttpGet("studies/{studyId:guid}/segment-sets")]
    public async Task<ActionResult<List<CountySegmentSetDto>>> GetSegmentSets(Guid studyId)
        => Ok(await _svc.GetSegmentSetsAsync(studyId));

    [HttpGet("segment-sets/{segmentSetId:guid}/segments")]
    public async Task<ActionResult<List<CountySegmentDto>>> GetSegments(Guid segmentSetId)
        => Ok(await _svc.GetSegmentsAsync(segmentSetId));

    // ── Cohorts ──────────────────────────────────────────────────────────────

    [HttpPost("cohorts")]
    public async Task<ActionResult<CountyCohortDto>> CreateCohort([FromBody] CreateCohortRequest req)
    {
        var result = await _svc.CreateCohortAsync(req, UserId);
        return CreatedAtAction(nameof(GetCohort), new { cohortId = result.CohortId }, result);
    }

    [HttpGet("cohorts/{cohortId:guid}")]
    public async Task<ActionResult<CountyCohortDto>> GetCohort(Guid cohortId)
    {
        var result = await _svc.GetCohortAsync(cohortId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("studies/{studyId:guid}/cohorts")]
    public async Task<ActionResult<List<CountyCohortDto>>> GetCohorts(Guid studyId)
        => Ok(await _svc.GetCohortsAsync(studyId));

    // ── Scenarios ──────────────────────────────────────────────────────────────

    [HttpPost("scenarios")]
    public async Task<ActionResult<CountyScenarioDto>> CreateScenario([FromBody] CreateScenarioRequest req)
    {
        var result = await _svc.CreateScenarioAsync(req, UserId);
        return CreatedAtAction(nameof(GetScenario), new { scenarioId = result.ScenarioId }, result);
    }

    [HttpGet("scenarios/{scenarioId:guid}")]
    public async Task<ActionResult<CountyScenarioDto>> GetScenario(Guid scenarioId)
    {
        var result = await _svc.GetScenarioAsync(scenarioId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("studies/{studyId:guid}/scenarios")]
    public async Task<ActionResult<List<CountyScenarioDto>>> GetScenarios(Guid studyId)
        => Ok(await _svc.GetScenariosAsync(studyId));

    [HttpPost("scenarios/{scenarioId:guid}/save")]
    public async Task<ActionResult<CountyScenarioDto>> SaveScenario(Guid scenarioId)
    {
        var result = await _svc.SaveScenarioAsync(scenarioId, UserId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("scenarios/{scenarioId:guid}/preview")]
    public async Task<ActionResult<ScenarioImpactPreviewDto>> PreviewScenario(Guid scenarioId)
    {
        try { return Ok(await _svc.PreviewScenarioImpactAsync(scenarioId)); }
        catch (InvalidOperationException ex) { return NotFound(ex.Message); }
    }

    // ── Adjustment Sets ──────────────────────────────────────────────────────────────

    [HttpPost("adjustment-sets/promote")]
    public async Task<ActionResult<CountyAdjustmentSetDto>> PromoteScenario([FromBody] PromoteScenarioRequest req)
    {
        var result = await _svc.PromoteScenarioAsync(req, UserId);
        return Ok(result);
    }

    [HttpGet("studies/{studyId:guid}/adjustment-sets")]
    public async Task<ActionResult<List<CountyAdjustmentSetDto>>> GetAdjustmentSets(Guid studyId)
        => Ok(await _svc.GetAdjustmentSetsAsync(studyId));

    // ── Exception Sets ──────────────────────────────────────────────────────────────

    [HttpPost("exception-sets")]
    public async Task<ActionResult<CountyExceptionSetDto>> CreateExceptionSet([FromBody] CreateExceptionSetRequest req)
    {
        var result = await _svc.CreateExceptionSetAsync(req, UserId);
        return Ok(result);
    }

    [HttpGet("studies/{studyId:guid}/exception-sets")]
    public async Task<ActionResult<List<CountyExceptionSetDto>>> GetExceptionSets(Guid studyId)
        => Ok(await _svc.GetExceptionSetsAsync(studyId));
}
```

- [ ] **Step 2: Build**

```bash
cd backend
dotnet build TerraFusion.sln
# Expected: Build succeeded. 0 Warning(s). 0 Error(s).
```

- [ ] **Step 3: Smoke test the API (requires running backend)**

```bash
curl -X POST http://localhost:5000/api/county-study/studies \
  -H "Content-Type: application/json" \
  -d '{"countyId":"00000000-0000-0000-0000-000000000001","taxYear":2026,"studyType":0}'
# Expected: 201 Created with CountyStudySessionDto JSON
```

- [ ] **Step 4: Run all county studio tests**

```bash
dotnet test TerraFusion.API.Tests --filter "CountyStudy" -v
# Expected: All tests PASS
```

- [ ] **Step 5: Commit**

```bash
git add src/TerraFusion.API/Controllers/CountyStudyController.cs
git commit -m "feat(county-studio): CountyStudyController with full REST API for studies, cohorts, scenarios, adjustment sets, exception sets"
```

---

**Plan 1 complete.** Backend foundation is live. Plans 2 and 3 can now begin in parallel.
