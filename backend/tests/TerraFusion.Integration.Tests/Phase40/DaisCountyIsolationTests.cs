// CARD-16 — Dais County Isolation Integration Tests
//
// Proves that every Dais entity type (Exemption, Appeal, CertificationStep,
// Notice, QueueItem) is county-scoped and that queries and mutations issued
// against county A cannot see, touch, or bleed into county B's data.
//
// Each test seeds two counties, populates both, then asserts only the
// target county's records are returned or affected.
//
// Companion to CountyIsolationTests.cs (Property entity coverage).

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
// Disambiguate: TerraFusion.Core.Entities.Task vs System.Threading.Tasks.Task
using Task = System.Threading.Tasks.Task;
// Disambiguate: TerraFusion.Core.Services also exposes TerraFusionDbContext
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.Integration.Tests.Phase40;

public class DaisCountyIsolationTests
{
    // ─── Helpers ─────────────────────────────────────────────────────

    private static TerraFusionDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false"
            })
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    private static (Guid bentonId, Guid kingId) SeedCounties(TerraFusionDbContext ctx)
    {
        var bentonId = Guid.NewGuid();
        var kingId   = Guid.NewGuid();

        ctx.Counties.AddRange(
            new County { Id = bentonId, Name = "Benton County", State = "WA", FipsCode = "53005", Population = 204390, Area = 1700 },
            new County { Id = kingId,   Name = "King County",   State = "WA", FipsCode = "53033", Population = 2269675, Area = 2307 }
        );
        ctx.SaveChanges();
        return (bentonId, kingId);
    }

    // ─── 1. Appeal — GetByParcel isolates to county ──────────────────

    [Fact]
    public async Task Appeal_GetByParcel_DoesNotLeakAcrossCounties()
    {
        await using var ctx = CreateContext("DaisIso_Appeal");
        var (bentonId, kingId) = SeedCounties(ctx);

        var svc = new AppealService(ctx, NullLogger<AppealService>.Instance);

        var bentonAppeal = await svc.CreateAsync(new Appeal
        {
            ParcelId = "1-0001-001",
            AppealGround = "MARKET_VALUE",
            Status = "filed",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 300_000m,
            RequestedValue = 260_000m,
            TaxYear = 2025,
            CountyId = bentonId
        });

        await svc.CreateAsync(new Appeal
        {
            ParcelId = "1-0001-001",   // same parcelId, different county
            AppealGround = "UNIFORMITY",
            Status = "filed",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 500_000m,
            RequestedValue = 450_000m,
            TaxYear = 2025,
            CountyId = kingId
        });

        var bentonResults = await svc.GetByParcelAsync("1-0001-001", bentonId);
        var kingResults   = await svc.GetByParcelAsync("1-0001-001", kingId);

        bentonResults.Should().HaveCount(1);
        bentonResults[0].AppealGround.Should().Be("MARKET_VALUE");
        bentonResults[0].CountyId.Should().Be(bentonId);

        kingResults.Should().HaveCount(1);
        kingResults[0].AppealGround.Should().Be("UNIFORMITY");
        kingResults[0].CountyId.Should().Be(kingId);
    }

    // ─── 2. Appeal — UpdateStatus rejects wrong county ───────────────

    [Fact]
    public async Task Appeal_UpdateStatus_WithWrongCounty_ThrowsKeyNotFoundException()
    {
        await using var ctx = CreateContext("DaisIso_AppealUpdate");
        var (bentonId, kingId) = SeedCounties(ctx);

        var svc = new AppealService(ctx, NullLogger<AppealService>.Instance);

        var appeal = await svc.CreateAsync(new Appeal
        {
            ParcelId = "PARCEL-X",
            AppealGround = "MARKET_VALUE",
            Status = "filed",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 100_000m,
            RequestedValue = 80_000m,
            TaxYear = 2025,
            CountyId = bentonId
        });

        // Attempt to update Benton's appeal from King's context — must be rejected
        var act = async () => await svc.UpdateStatusAsync(appeal.Id, "decided", kingId);

        await act.Should().ThrowAsync<KeyNotFoundException>(
            "service must not allow cross-county status mutations");
    }

    // ─── 3. Exemption — GetByParcel isolates to county ───────────────

    [Fact]
    public async Task Exemption_GetByParcel_DoesNotLeakAcrossCounties()
    {
        await using var ctx = CreateContext("DaisIso_Exemption");
        var (bentonId, kingId) = SeedCounties(ctx);

        var svc = new ExemptionService(ctx, NullLogger<ExemptionService>.Instance);

        await svc.CreateAsync(new Exemption
        {
            ParcelId = "EX-PARCEL-1",
            ProgramCode = "SENIOR_DISABLED",
            Status = "pending",
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 60_000m,
            CountyId = bentonId
        });

        await svc.CreateAsync(new Exemption
        {
            ParcelId = "EX-PARCEL-1",   // same parcelId, different county
            ProgramCode = "CURRENT_USE",
            Status = "approved",
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 40_000m,
            CountyId = kingId
        });

        var bentonResults = await svc.GetByParcelAsync("EX-PARCEL-1", bentonId);
        var kingResults   = await svc.GetByParcelAsync("EX-PARCEL-1", kingId);

        bentonResults.Should().HaveCount(1);
        bentonResults[0].ProgramCode.Should().Be("SENIOR_DISABLED");

        kingResults.Should().HaveCount(1);
        kingResults[0].ProgramCode.Should().Be("CURRENT_USE");
    }

    // ─── 4. CertificationStep — GetByTaxYear isolates to county ──────

    [Fact]
    public async Task CertificationStep_GetByTaxYear_DoesNotLeakAcrossCounties()
    {
        await using var ctx = CreateContext("DaisIso_CertStep");
        var (bentonId, kingId) = SeedCounties(ctx);

        var svc = new CertificationService(ctx, NullLogger<CertificationService>.Instance);

        await svc.CreateAsync(new CertificationStep
        {
            TaxYear = 2025,
            StepCode = "PRELIMINARY_ROLL",
            Status = "pending",
            CountyId = bentonId
        });

        await svc.CreateAsync(new CertificationStep
        {
            TaxYear = 2025,
            StepCode = "FINAL_VALUES",
            Status = "in_progress",
            CountyId = kingId
        });

        var bentonSteps = await svc.GetByTaxYearAsync(2025, bentonId);
        var kingSteps   = await svc.GetByTaxYearAsync(2025, kingId);

        bentonSteps.Should().HaveCount(1);
        bentonSteps[0].StepCode.Should().Be("PRELIMINARY_ROLL");
        bentonSteps[0].CountyId.Should().Be(bentonId);

        kingSteps.Should().HaveCount(1);
        kingSteps[0].StepCode.Should().Be("FINAL_VALUES");
        kingSteps[0].CountyId.Should().Be(kingId);
    }

    // ─── 5. Notice — GetByParcel isolates to county ──────────────────

    [Fact]
    public async Task Notice_GetByParcel_DoesNotLeakAcrossCounties()
    {
        await using var ctx = CreateContext("DaisIso_Notice");
        var (bentonId, kingId) = SeedCounties(ctx);

        var svc = new NoticeService(ctx, NullLogger<NoticeService>.Instance);

        await svc.CreateAsync(new Notice
        {
            ParcelId = "NOTE-PARCEL-1",
            TemplateId = "VALUE_CHANGE_NOTICE",
            DeliveryMethod = "mail",
            Status = "generated",
            CountyId = bentonId
        });

        await svc.CreateAsync(new Notice
        {
            ParcelId = "NOTE-PARCEL-1",   // same parcelId, different county
            TemplateId = "EXEMPTION_DENIED",
            DeliveryMethod = "email",
            Status = "generated",
            CountyId = kingId
        });

        var bentonResults = await svc.GetByParcelAsync("NOTE-PARCEL-1", bentonId);
        var kingResults   = await svc.GetByParcelAsync("NOTE-PARCEL-1", kingId);

        bentonResults.Should().HaveCount(1);
        bentonResults[0].TemplateId.Should().Be("VALUE_CHANGE_NOTICE");

        kingResults.Should().HaveCount(1);
        kingResults[0].TemplateId.Should().Be("EXEMPTION_DENIED");
    }

    // ─── 6. QueueItem — GetPending isolates to county ────────────────

    [Fact]
    public async Task QueueItem_GetPending_DoesNotLeakAcrossCounties()
    {
        await using var ctx = CreateContext("DaisIso_Queue");
        var (bentonId, kingId) = SeedCounties(ctx);

        var svc = new QueueService(ctx, NullLogger<QueueService>.Instance);

        await svc.CreateAsync(new QueueItem
        {
            ParcelId = "Q-PARCEL-1",
            TaskType = "FIELD_INSPECTION",
            Priority = "high",
            Status = "queued",
            CountyId = bentonId
        });

        await svc.CreateAsync(new QueueItem
        {
            ParcelId = "Q-PARCEL-2",
            TaskType = "DESK_REVIEW",
            Priority = "normal",
            Status = "queued",
            CountyId = kingId
        });

        var bentonQueue = await svc.GetPendingAsync(bentonId);
        var kingQueue   = await svc.GetPendingAsync(kingId);

        bentonQueue.Should().HaveCount(1);
        bentonQueue[0].TaskType.Should().Be("FIELD_INSPECTION");
        bentonQueue[0].CountyId.Should().Be(bentonId);

        kingQueue.Should().HaveCount(1);
        kingQueue[0].TaskType.Should().Be("DESK_REVIEW");
        kingQueue[0].CountyId.Should().Be(kingId);
    }
}
