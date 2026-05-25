using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Treasurer;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseTreasurerHandoffServiceTests
{
    [Fact]
    public async Task Create_Payment_Packet_Produces_Total_Due()
    {
        var service = new CurrentUseTreasurerHandoffService();
        var parcelId = Guid.NewGuid();

        var packet = await service.CreatePaymentPacketAsync(
            new CreateCurrentUsePaymentPacketDto(
                Guid.NewGuid(),
                parcelId,
                null,
                null,
                Guid.NewGuid(),
                "CU_ROLLBACK_ENGINE_v2026_03_01",
                100m,
                10m,
                22m,
                132m,
                "Sample Owner",
                "unit.test"),
            CancellationToken.None);

        Assert.Equal(132m, packet.TotalDue);
        Assert.Equal(CurrentUsePaymentPacketStatus.Draft, packet.Status);
    }

    [Fact]
    public async Task Send_To_Treasurer_Updates_Status()
    {
        var service = new CurrentUseTreasurerHandoffService();
        var parcelId = Guid.NewGuid();

        var packet = await service.CreatePaymentPacketAsync(
            new CreateCurrentUsePaymentPacketDto(
                Guid.NewGuid(),
                parcelId,
                null,
                null,
                Guid.NewGuid(),
                "CU_ROLLBACK_ENGINE_v2026_03_01",
                100m,
                10m,
                0m,
                110m,
                "Sample Owner",
                "unit.test"),
            CancellationToken.None);

        var sent = await service.SendToTreasurerAsync(
            packet.PaymentPacketId,
            new SendCurrentUsePaymentPacketToTreasurerDto("unit.test", "TR-001", null),
            CancellationToken.None);

        Assert.Equal(CurrentUsePaymentPacketStatus.SentToTreasurer, sent.Status);
        Assert.Equal("TR-001", sent.TreasurerReferenceNumber);
    }

    [Fact]
    public async Task Mark_Paid_Adds_Receipt()
    {
        var service = new CurrentUseTreasurerHandoffService();
        var parcelId = Guid.NewGuid();

        var packet = await service.CreatePaymentPacketAsync(
            new CreateCurrentUsePaymentPacketDto(
                Guid.NewGuid(),
                parcelId,
                null,
                null,
                Guid.NewGuid(),
                "CU_ROLLBACK_ENGINE_v2026_03_01",
                100m,
                10m,
                0m,
                110m,
                "Sample Owner",
                "unit.test"),
            CancellationToken.None);

        var paid = await service.MarkPaidAsync(
            packet.PaymentPacketId,
            new MarkCurrentUsePaymentPaidDto("unit.test", DateTimeOffset.UtcNow, "RCPT-001", null),
            CancellationToken.None);

        Assert.Equal(CurrentUsePaymentPacketStatus.Paid, paid.Status);
        Assert.Equal("RCPT-001", paid.ReceiptNumber);
    }
}
