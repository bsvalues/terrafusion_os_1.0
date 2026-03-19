using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.AI.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests.Phase10;

public sealed class DraftServiceTests
{
    private static TerraFusionDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var configuration = new ConfigurationBuilder().Build();
        return new TerraFusionDbContext(options, configuration);
    }

    [Fact]
    public async SystemTask CreateDraftAsync_PersistsDraft_WithPendingStatus()
    {
        using var db = CreateInMemoryDb();
        var svc = new DraftService(db, NullLogger<DraftService>.Instance);

        var draft = await svc.CreateDraftAsync("benton_wa", "ai_agent_001", "Revalue parcel 123", "{}", CancellationToken.None);

        draft.Id.Should().NotBe(Guid.Empty);
        draft.Status.Should().Be(DraftStatus.Pending);
        draft.CountyId.Should().Be("benton_wa");
        draft.HumanApproverId.Should().BeNull("TruthGate must not be set until a human approves");
    }

    [Fact]
    public async SystemTask ApproveDraftAsync_SetsTruthGate_AndStatusApproved()
    {
        using var db = CreateInMemoryDb();
        var svc = new DraftService(db, NullLogger<DraftService>.Instance);

        var draft = await svc.CreateDraftAsync("benton_wa", "ai_agent_001", "Revalue parcel 123", "{}");
        var approved = await svc.ApproveDraftAsync(draft.Id, "benton_wa", "assessor_bob");

        approved.Status.Should().Be(DraftStatus.Approved);
        approved.HumanApproverId.Should().Be("assessor_bob", "TruthGate must record who approved");
    }

    [Fact]
    public async SystemTask RejectDraftAsync_SetsStatusRejected_WithReason()
    {
        using var db = CreateInMemoryDb();
        var svc = new DraftService(db, NullLogger<DraftService>.Instance);

        var draft = await svc.CreateDraftAsync("benton_wa", "ai_agent_001", "Revalue parcel 123", "{}");
        var rejected = await svc.RejectDraftAsync(draft.Id, "benton_wa", "assessor_bob", "Comparable sales insufficient");

        rejected.Status.Should().Be(DraftStatus.Rejected);
        rejected.RejectionReason.Should().Contain("Comparable sales");
    }

    [Fact]
    public async SystemTask GetDraftAsync_EnforcesCountyIsolation()
    {
        using var db = CreateInMemoryDb();
        var svc = new DraftService(db, NullLogger<DraftService>.Instance);

        var draft = await svc.CreateDraftAsync("benton_wa", "ai_agent_001", "Revalue parcel 123", "{}");

        // Attempt to retrieve draft using different county — must return null
        var result = await svc.GetDraftAsync(draft.Id, "king_wa");
        result.Should().BeNull("county isolation must prevent cross-county draft access");
    }

    [Fact]
    public async SystemTask ApproveDraftAsync_Throws_WhenAlreadyApproved()
    {
        using var db = CreateInMemoryDb();
        var svc = new DraftService(db, NullLogger<DraftService>.Instance);

        var draft = await svc.CreateDraftAsync("benton_wa", "ai_agent_001", "Revalue parcel 123", "{}");
        await svc.ApproveDraftAsync(draft.Id, "benton_wa", "assessor_bob");

        // Second approval must throw
        var act = () => svc.ApproveDraftAsync(draft.Id, "benton_wa", "assessor_alice");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already*");
    }
}
