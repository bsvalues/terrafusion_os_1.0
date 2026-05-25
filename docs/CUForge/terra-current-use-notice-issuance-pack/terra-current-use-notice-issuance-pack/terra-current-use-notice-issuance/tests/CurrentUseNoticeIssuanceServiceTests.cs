using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Notices;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseNoticeIssuanceServiceTests
{
    [Fact]
    public async Task Notice_Must_Be_Approved_Before_Issue()
    {
        var service = new CurrentUseNoticeIssuanceService();

        var pending = await service.CreatePendingAsync(
            new CreatePendingCurrentUseNoticeDto(
                Guid.NewGuid(),
                Guid.NewGuid(),
                null,
                null,
                null,
                "NOTICE_OF_INTENT_TO_REMOVE",
                "Intent to Remove",
                "Body",
                "unit.test"),
            CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.IssueAsync(
                pending.NoticeId,
                new IssueCurrentUseNoticeDto(
                    "unit.test",
                    CurrentUseNoticeDeliveryMethod.Mail,
                    "MAIL-1",
                    null,
                    "issue"),
                CancellationToken.None));
    }

    [Fact]
    public async Task Approved_Notice_Can_Be_Issued()
    {
        var service = new CurrentUseNoticeIssuanceService();

        var pending = await service.CreatePendingAsync(
            new CreatePendingCurrentUseNoticeDto(
                Guid.NewGuid(),
                Guid.NewGuid(),
                null,
                null,
                null,
                "NOTICE_OF_INTENT_TO_REMOVE",
                "Intent to Remove",
                "Body",
                "unit.test"),
            CancellationToken.None);

        var approved = await service.ApproveAsync(
            pending.NoticeId,
            new ApproveCurrentUseNoticeDto("supervisor", "approved"),
            CancellationToken.None);

        var issued = await service.IssueAsync(
            approved.NoticeId,
            new IssueCurrentUseNoticeDto(
                "unit.test",
                CurrentUseNoticeDeliveryMethod.CertifiedMail,
                "CERT-1",
                Guid.NewGuid(),
                "issued"),
            CancellationToken.None);

        Assert.Equal(CurrentUseIssuedNoticeStatus.Issued, issued.Status);
        Assert.Equal("CERT-1", issued.DeliveryReference);
    }

    [Fact]
    public async Task Issued_Notice_Cannot_Be_Silently_Voided()
    {
        var service = new CurrentUseNoticeIssuanceService();

        var pending = await service.CreatePendingAsync(
            new CreatePendingCurrentUseNoticeDto(
                Guid.NewGuid(),
                Guid.NewGuid(),
                null,
                null,
                null,
                "NOTICE_OF_INTENT_TO_REMOVE",
                "Intent to Remove",
                "Body",
                "unit.test"),
            CancellationToken.None);

        var approved = await service.ApproveAsync(
            pending.NoticeId,
            new ApproveCurrentUseNoticeDto("supervisor", "approved"),
            CancellationToken.None);

        var issued = await service.IssueAsync(
            approved.NoticeId,
            new IssueCurrentUseNoticeDto(
                "unit.test",
                CurrentUseNoticeDeliveryMethod.Mail,
                "MAIL-1",
                null,
                "issued"),
            CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.VoidAsync(
                issued.NoticeId,
                new VoidCurrentUseNoticeDto("unit.test", "void"),
                CancellationToken.None));
    }
}
