using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Treasurer;

public interface ICurrentUseTreasurerHandoffService
{
    Task<CurrentUsePaymentPacketDto> CreatePaymentPacketAsync(
        CreateCurrentUsePaymentPacketDto request,
        CancellationToken cancellationToken);

    Task<CurrentUsePaymentPacketDto?> GetPaymentPacketAsync(
        Guid paymentPacketId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CurrentUsePaymentPacketDto>> GetPaymentPacketsForParcelAsync(
        Guid parcelId,
        CancellationToken cancellationToken);

    Task<CurrentUsePaymentPacketDto> SendToTreasurerAsync(
        Guid paymentPacketId,
        SendCurrentUsePaymentPacketToTreasurerDto request,
        CancellationToken cancellationToken);

    Task<CurrentUsePaymentPacketDto> MarkPaidAsync(
        Guid paymentPacketId,
        MarkCurrentUsePaymentPaidDto request,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseTreasurerHandoffService : ICurrentUseTreasurerHandoffService
{
    private static readonly List<CurrentUsePaymentPacketDto> Packets = new();

    public Task<CurrentUsePaymentPacketDto> CreatePaymentPacketAsync(
        CreateCurrentUsePaymentPacketDto request,
        CancellationToken cancellationToken)
    {
        var lines = new List<CurrentUsePaymentLineDto>
        {
            new(CurrentUsePaymentLineType.AdditionalTax, null, "Current Use additional tax subtotal", request.AdditionalTaxSubtotal),
            new(CurrentUsePaymentLineType.Interest, null, "Current Use statutory interest subtotal", request.InterestSubtotal),
        };

        if (request.PenaltyAmount > 0)
        {
            lines.Add(new CurrentUsePaymentLineDto(
                CurrentUsePaymentLineType.Penalty,
                null,
                "Current Use 20% penalty",
                request.PenaltyAmount));
        }

        var packet = new CurrentUsePaymentPacketDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ParcelId,
            request.ClassificationId,
            request.RemovalId,
            request.RollbackCalculationId,
            request.CalculationVersion,
            CurrentUsePaymentPacketStatus.Draft,
            lines,
            request.TotalDue,
            request.PayeeName,
            null,
            DateTimeOffset.UtcNow,
            request.CreatedBy,
            null,
            null,
            null,
            null);

        Packets.Add(packet);
        return Task.FromResult(packet);
    }

    public Task<CurrentUsePaymentPacketDto?> GetPaymentPacketAsync(
        Guid paymentPacketId,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(Packets.FirstOrDefault(x => x.PaymentPacketId == paymentPacketId));
    }

    public Task<IReadOnlyList<CurrentUsePaymentPacketDto>> GetPaymentPacketsForParcelAsync(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUsePaymentPacketDto> result = Packets
            .Where(x => x.ParcelId == parcelId)
            .OrderByDescending(x => x.CreatedAt)
            .ToArray();

        return Task.FromResult(result);
    }

    public Task<CurrentUsePaymentPacketDto> SendToTreasurerAsync(
        Guid paymentPacketId,
        SendCurrentUsePaymentPacketToTreasurerDto request,
        CancellationToken cancellationToken)
    {
        var existing = Packets.FirstOrDefault(x => x.PaymentPacketId == paymentPacketId)
            ?? throw new InvalidOperationException($"Payment packet not found: {paymentPacketId}");

        var updated = existing with
        {
            Status = CurrentUsePaymentPacketStatus.SentToTreasurer,
            TreasurerReferenceNumber = request.TreasurerReferenceNumber,
            SentToTreasurerAt = DateTimeOffset.UtcNow,
            SentToTreasurerBy = request.SentBy
        };

        Packets.Remove(existing);
        Packets.Add(updated);

        return Task.FromResult(updated);
    }

    public Task<CurrentUsePaymentPacketDto> MarkPaidAsync(
        Guid paymentPacketId,
        MarkCurrentUsePaymentPaidDto request,
        CancellationToken cancellationToken)
    {
        var existing = Packets.FirstOrDefault(x => x.PaymentPacketId == paymentPacketId)
            ?? throw new InvalidOperationException($"Payment packet not found: {paymentPacketId}");

        var updated = existing with
        {
            Status = CurrentUsePaymentPacketStatus.Paid,
            PaidAt = request.PaidAt,
            ReceiptNumber = request.ReceiptNumber
        };

        Packets.Remove(existing);
        Packets.Add(updated);

        return Task.FromResult(updated);
    }
}
