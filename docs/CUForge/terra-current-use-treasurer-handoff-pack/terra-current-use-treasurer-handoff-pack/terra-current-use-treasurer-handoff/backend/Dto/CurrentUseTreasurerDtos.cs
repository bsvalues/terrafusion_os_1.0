namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUsePaymentPacketStatus
{
    Draft,
    ReadyForTreasurer,
    SentToTreasurer,
    PaymentPending,
    Paid,
    Voided,
    RecalculationRequired
}

public enum CurrentUsePaymentLineType
{
    AdditionalTax,
    Interest,
    Penalty,
    RecordingFee,
    Other
}

public sealed record CurrentUsePaymentLineDto(
    CurrentUsePaymentLineType LineType,
    int? TaxYear,
    string Description,
    decimal Amount
);

public sealed record CurrentUsePaymentPacketDto(
    Guid PaymentPacketId,
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid? RemovalId,
    Guid RollbackCalculationId,
    string CalculationVersion,
    CurrentUsePaymentPacketStatus Status,
    IReadOnlyList<CurrentUsePaymentLineDto> Lines,
    decimal TotalDue,
    string PayeeName,
    string? TreasurerReferenceNumber,
    DateTimeOffset CreatedAt,
    string CreatedBy,
    DateTimeOffset? SentToTreasurerAt,
    string? SentToTreasurerBy,
    DateTimeOffset? PaidAt,
    string? ReceiptNumber
);

public sealed record CreateCurrentUsePaymentPacketDto(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid? RemovalId,
    Guid RollbackCalculationId,
    string CalculationVersion,
    decimal AdditionalTaxSubtotal,
    decimal InterestSubtotal,
    decimal PenaltyAmount,
    decimal TotalDue,
    string PayeeName,
    string CreatedBy
);

public sealed record SendCurrentUsePaymentPacketToTreasurerDto(
    string SentBy,
    string? TreasurerReferenceNumber,
    string? Note
);

public sealed record MarkCurrentUsePaymentPaidDto(
    string UpdatedBy,
    DateTimeOffset PaidAt,
    string ReceiptNumber,
    string? Note
);
