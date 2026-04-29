using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.Data;
using Xunit;
using DataContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.CountyStudio;

public class CountyStudyApprovalWorkflowTests
{
    private static DataContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<DataContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();

        return new DataContext(options, configuration);
    }

    private static CountyStudyService CreateService(DataContext db)
    {
        return new CountyStudyService(db, new StaticCountyResolver());
    }

    private static CountyAdjustmentSet SeedAdjustmentSet(
        DataContext db,
        AdjustmentSetApprovalState state)
    {
        var set = new CountyAdjustmentSet
        {
            AdjustmentSetId = Guid.NewGuid(),
            StudyId = Guid.NewGuid(),
            ScenarioId = Guid.NewGuid(),
            CountyId = Guid.NewGuid(),
            EffectiveScope = """{"cohortId":"cohort-1"}""",
            ApprovalState = state,
            CreatedBy = "test",
            UpdatedBy = "test",
        };
        db.CountyAdjustmentSets.Add(set);
        db.SaveChanges();
        return set;
    }

    [Fact]
    public async Task UpdateApprovalState_AllowsProposedToReadyToApprovedOnly()
    {
        await using var db = CreateContext($"county-approval-{Guid.NewGuid()}");
        var set = SeedAdjustmentSet(db, AdjustmentSetApprovalState.Proposed);
        var svc = CreateService(db);

        var ready = await svc.UpdateApprovalStateAsync(
            set.AdjustmentSetId,
            AdjustmentSetApprovalState.ReadyForApproval,
            "reviewer@county.gov");
        ready.ApprovalState.Should().Be(nameof(AdjustmentSetApprovalState.ReadyForApproval));
        ready.ApprovedBy.Should().BeNull();

        var approved = await svc.UpdateApprovalStateAsync(
            set.AdjustmentSetId,
            AdjustmentSetApprovalState.Approved,
            "assessor@county.gov");
        approved.ApprovalState.Should().Be(nameof(AdjustmentSetApprovalState.Approved));
        approved.ApprovedBy.Should().Be("assessor@county.gov");
        approved.PublishedAt.Should().BeNull("County Studio approval does not publish/apply adjustment sets");
    }

    [Fact]
    public async Task UpdateApprovalState_AllowsReadyForApprovalSendBackToProposed()
    {
        await using var db = CreateContext($"county-approval-sendback-{Guid.NewGuid()}");
        var set = SeedAdjustmentSet(db, AdjustmentSetApprovalState.ReadyForApproval);
        var svc = CreateService(db);

        var proposed = await svc.UpdateApprovalStateAsync(
            set.AdjustmentSetId,
            AdjustmentSetApprovalState.Proposed,
            "reviewer@county.gov");

        proposed.ApprovalState.Should().Be(nameof(AdjustmentSetApprovalState.Proposed));
        proposed.ApprovedBy.Should().BeNull();
    }

    [Fact]
    public async Task UpdateApprovalState_RejectsApprovedToPublished()
    {
        await using var db = CreateContext($"county-approval-publish-{Guid.NewGuid()}");
        var set = SeedAdjustmentSet(db, AdjustmentSetApprovalState.Approved);
        var svc = CreateService(db);

        Func<Task> act = () => svc.UpdateApprovalStateAsync(
            set.AdjustmentSetId,
            AdjustmentSetApprovalState.Published,
            "assessor@county.gov");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Approved*Published*");

        var unchanged = await db.CountyAdjustmentSets.AsNoTracking()
            .SingleAsync(x => x.AdjustmentSetId == set.AdjustmentSetId);
        unchanged.ApprovalState.Should().Be(AdjustmentSetApprovalState.Approved);
        unchanged.PublishedAt.Should().BeNull();
    }

    [Fact]
    public async Task UpdateApprovalState_RejectsLegacyPublishedRollback()
    {
        await using var db = CreateContext($"county-approval-rollback-{Guid.NewGuid()}");
        var set = SeedAdjustmentSet(db, AdjustmentSetApprovalState.Published);
        var svc = CreateService(db);

        Func<Task> act = () => svc.UpdateApprovalStateAsync(
            set.AdjustmentSetId,
            AdjustmentSetApprovalState.RolledBack,
            "assessor@county.gov",
            "audit reason");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Published*RolledBack*");

        var unchanged = await db.CountyAdjustmentSets.AsNoTracking()
            .SingleAsync(x => x.AdjustmentSetId == set.AdjustmentSetId);
        unchanged.ApprovalState.Should().Be(AdjustmentSetApprovalState.Published);
        unchanged.RollbackReason.Should().BeNull();
    }

    private sealed class StaticCountyResolver : ICountyResolver
    {
        public Task<Guid> ResolveAsync(string countyIdOrCode, CancellationToken ct = default)
            => Task.FromResult(Guid.TryParse(countyIdOrCode, out var id) ? id : Guid.NewGuid());

        public Task<Guid?> TryResolveAsync(string countyIdOrCode, CancellationToken ct = default)
            => Task.FromResult<Guid?>(Guid.TryParse(countyIdOrCode, out var id) ? id : Guid.NewGuid());
    }
}
