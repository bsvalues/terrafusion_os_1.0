using FluentAssertions;
using TerraFusion.CurrentUse.DTOs;
using TerraFusion.CurrentUse.Services;
using Xunit;

namespace TerraFusion.CurrentUse.Tests;

public class CaseStateServiceTests
{
    [Fact]
    public async Task UpsertAsync_PersistsHumanWorkflowStateOnly()
    {
        using var db = TestDbContextFactory.Create();
        var service = new CaseStateService(db);
        var caseId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
        var agingBasisDate = new DateOnly(2026, 5, 20);

        var saved = await service.UpsertAsync(caseId, new CaseStateUpsertRequest(
            CaseStage: "ROLLBACK_REVIEW",
            AssignedAppraiser: "Ag Appraiser",
            ChiefReviewStatus: "PendingReview",
            NoticeApprovalStatus: "Drafted",
            LocalCaseNotes: "Owner called; waiting on lease evidence.",
            AgingBasisDate: agingBasisDate
        ));

        saved.CaseId.Should().Be(caseId);
        saved.CaseStage.Should().Be("ROLLBACK_REVIEW");
        saved.AssignedAppraiser.Should().Be("Ag Appraiser");
        saved.ChiefReviewStatus.Should().Be("PendingReview");
        saved.NoticeApprovalStatus.Should().Be("Drafted");
        saved.LocalCaseNotes.Should().Be("Owner called; waiting on lease evidence.");
        saved.AgingBasisDate.Should().Be("2026-05-20");
        saved.LastTouchedAt.Should().NotBeNullOrWhiteSpace();

        var stored = await service.GetByCaseIdAsync(caseId);
        stored.Should().BeEquivalentTo(saved);
    }

    [Fact]
    public async Task UpsertAsync_UpdatesExistingCaseStateWithoutCreatingDuplicateRows()
    {
        using var db = TestDbContextFactory.Create();
        var service = new CaseStateService(db);
        var caseId = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002");

        await service.UpsertAsync(caseId, new CaseStateUpsertRequest(
            CaseStage: "MONITORING",
            AssignedAppraiser: "Ag Appraiser",
            ChiefReviewStatus: "NotRequired",
            NoticeApprovalStatus: "NotStarted",
            LocalCaseNotes: "Annual continuance review opened.",
            AgingBasisDate: new DateOnly(2026, 5, 1)
        ));

        var updated = await service.UpsertAsync(caseId, new CaseStateUpsertRequest(
            CaseStage: "CHIEF_REVIEW",
            AssignedAppraiser: "Senior Ag Appraiser",
            ChiefReviewStatus: "PendingReview",
            NoticeApprovalStatus: "PendingApproval",
            LocalCaseNotes: "Rollback worksheet ready for Chief review.",
            AgingBasisDate: new DateOnly(2026, 5, 25)
        ));

        updated.CaseStage.Should().Be("CHIEF_REVIEW");
        updated.AssignedAppraiser.Should().Be("Senior Ag Appraiser");
        updated.ChiefReviewStatus.Should().Be("PendingReview");
        updated.NoticeApprovalStatus.Should().Be("PendingApproval");
        updated.LocalCaseNotes.Should().Be("Rollback worksheet ready for Chief review.");
        updated.AgingBasisDate.Should().Be("2026-05-25");
        db.CaseStates.Count().Should().Be(1);
    }

    [Fact]
    public async Task ListAsync_ReturnsCaseStatesOrderedByLastTouchedDescending()
    {
        using var db = TestDbContextFactory.Create();
        var service = new CaseStateService(db);
        var firstCaseId = Guid.Parse("cccccccc-0000-0000-0000-000000000003");
        var secondCaseId = Guid.Parse("dddddddd-0000-0000-0000-000000000004");

        await service.UpsertAsync(firstCaseId, new CaseStateUpsertRequest(
            "MONITORING",
            "Ag Appraiser",
            "NotRequired",
            "NotStarted",
            "",
            new DateOnly(2026, 5, 1)
        ));

        await Task.Delay(10);

        await service.UpsertAsync(secondCaseId, new CaseStateUpsertRequest(
            "NOTICE_PENDING_APPROVAL",
            "Ag Appraiser",
            "PendingReview",
            "PendingApproval",
            "Notice ready for Chief review.",
            new DateOnly(2026, 5, 2)
        ));

        var states = await service.ListAsync();

        states.Select(state => state.CaseId).Should().ContainInOrder(secondCaseId, firstCaseId);
    }
}
