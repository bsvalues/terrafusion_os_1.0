// CARD-16 — DaisCertificationService Unit Tests
//
// Unit tests for CertificationService — the certification step lifecycle
// service that tracks the annual tax roll certification pipeline.
//
// Tests scope: service logic and EF Core persistence via in-memory store.
// County isolation is proven here — wrong-county mutations must throw.
// Audit field population is verified on create and complete operations.

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
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R16;

[Trait("Category", "R16")]
[Trait("Category", "CARD-16")]
[Trait("Surface", "DaisCertificationBoundary")]
public sealed class DaisCertificationServiceTests
{
    // ─── Helpers ─────────────────────────────────────────────────────

    private static (DataDbContext ctx, ICertificationService svc, Guid countyId)
        BuildFixture()
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory"
            })
            .Build();

        var ctx = new DataDbContext(options, configuration);

        // Seed one county so FK navigation is resolvable
        var countyId = Guid.NewGuid();
        ctx.Counties.Add(new County
        {
            Id = countyId,
            Name = "Benton County",
            State = "WA",
            FipsCode = "53005",
            Population = 204390,
            Area = 1700
        });
        ctx.SaveChanges();

        var svc = new CertificationService(ctx, NullLogger<CertificationService>.Instance);
        return (ctx, svc, countyId);
    }

    // ─── 1. CreateAsync — assigns Id and stamps timestamps ───────────

    [Fact]
    public async Task CreateAsync_AssignsId_And_StampsTimestamps()
    {
        var (ctx, svc, countyId) = BuildFixture();
        await using (ctx)
        {
            var before = DateTime.UtcNow.AddMilliseconds(-100);

            var step = await svc.CreateAsync(new CertificationStep
            {
                TaxYear  = 2025,
                StepCode = "PRELIMINARY_ROLL",
                Status   = "pending",
                CountyId = countyId
            });

            step.Id.Should().NotBeEmpty("service must assign a new Guid");
            step.CreatedAt.Should().BeOnOrAfter(before, "CreatedAt must be stamped");
            step.UpdatedAt.Should().BeOnOrAfter(before, "UpdatedAt must be stamped");
            step.Status.Should().Be("pending");
        }
    }

    // ─── 2. GetByTaxYear — returns only county-scoped steps ──────────

    [Fact]
    public async Task GetByTaxYear_Returns_OnlyCountyScopedSteps()
    {
        var (ctx, svc, countyId) = BuildFixture();
        await using (ctx)
        {
            // Seed a second county so we can prove isolation
            var otherId = Guid.NewGuid();
            ctx.Counties.Add(new County
            {
                Id = otherId,
                Name = "King County",
                State = "WA",
                FipsCode = "53033",
                Population = 2269675,
                Area = 2307
            });
            await ctx.SaveChangesAsync();

            await svc.CreateAsync(new CertificationStep { TaxYear = 2025, StepCode = "STEP_A", Status = "pending", CountyId = countyId });
            await svc.CreateAsync(new CertificationStep { TaxYear = 2025, StepCode = "STEP_B", Status = "pending", CountyId = countyId });
            // Different county — must not appear in query for countyId
            await svc.CreateAsync(new CertificationStep { TaxYear = 2025, StepCode = "STEP_OTHER", Status = "pending", CountyId = otherId });

            var steps = await svc.GetByTaxYearAsync(2025, countyId);

            steps.Should().HaveCount(2, "only the two Benton County steps should be returned");
            steps.Should().OnlyContain(s => s.CountyId == countyId,
                "all returned steps must belong to the queried county");
            steps.Should().NotContain(s => s.StepCode == "STEP_OTHER",
                "other county's step must not leak into this county's results");
        }
    }

    // ─── 3. CompleteStepAsync — updates Status, CompletedBy, CompletedAt ─

    [Fact]
    public async Task CompleteStepAsync_Updates_Status_CompletedBy_CompletedAt()
    {
        var (ctx, svc, countyId) = BuildFixture();
        await using (ctx)
        {
            var step = await svc.CreateAsync(new CertificationStep
            {
                TaxYear  = 2025,
                StepCode = "FINAL_VALUES",
                Status   = "in_progress",
                CountyId = countyId
            });

            var beforeComplete = DateTime.UtcNow.AddMilliseconds(-100);

            var completed = await svc.CompleteStepAsync(
                step.Id, completedBy: "assessor@benton.wa.gov", countyId);

            completed.Status.Should().Be("completed");
            completed.CompletedBy.Should().Be("assessor@benton.wa.gov");
            completed.CompletedAt.Should().HaveValue();
            completed.CompletedAt!.Value.Should().BeOnOrAfter(beforeComplete,
                "CompletedAt must be stamped at or after completion was called");
            completed.UpdatedAt.Should().BeOnOrAfter(beforeComplete);
        }
    }

    // ─── 4. CompleteStepAsync — wrong county throws ───────────────────

    [Fact]
    public async Task CompleteStepAsync_WithWrongCounty_ThrowsKeyNotFoundException()
    {
        var (ctx, svc, countyId) = BuildFixture();
        await using (ctx)
        {
            var step = await svc.CreateAsync(new CertificationStep
            {
                TaxYear  = 2025,
                StepCode = "TAX_ROLL_CERTIFICATION",
                Status   = "pending",
                CountyId = countyId
            });

            var wrongCountyId = Guid.NewGuid();

            var act = async () =>
                await svc.CompleteStepAsync(step.Id, "imposter@king.wa.gov", wrongCountyId);

            await act.Should().ThrowAsync<KeyNotFoundException>(
                "completing a step from the wrong county must be rejected");
        }
    }

    // ─── 5. GetByTaxYear — no steps returns empty list ────────────────

    [Fact]
    public async Task GetByTaxYear_WithNoSteps_InitializesCanonicalSteps()
    {
        var (ctx, svc, countyId) = BuildFixture();
        await using (ctx)
        {
            var steps = await svc.GetByTaxYearAsync(2025, countyId);

            steps.Should().HaveCount(6, "fresh county should be initialized with canonical certification steps");
            steps.Select(s => s.StepCode).Should().ContainInOrder(
                "DATA_VALIDATION",
                "RATIO_STUDY",
                "SUPERVISORY_REVIEW",
                "ASSESSOR_SIGNOFF",
                "DOR_SUBMISSION",
                "DOR_ACCEPTANCE");
        }
    }
}
