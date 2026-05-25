namespace TerraFusion.Modules.CurrentUse.Events;

public sealed record CurrentUsePaymentPacketCreated(
    Guid CountyId,
    Guid ParcelId,
    Guid PaymentPacketId,
    Guid RollbackCalculationId,
    decimal TotalDue,
    string CreatedBy,
    DateTimeOffset CreatedAt
);

public sealed record CurrentUsePaymentPacketSentToTreasurer(
    Guid CountyId,
    Guid ParcelId,
    Guid PaymentPacketId,
    string? TreasurerReferenceNumber,
    string SentBy,
    DateTimeOffset SentAt
);

public sealed record CurrentUsePaymentMarkedPaid(
    Guid CountyId,
    Guid ParcelId,
    Guid PaymentPacketId,
    string ReceiptNumber,
    decimal TotalDue,
    string UpdatedBy,
    DateTimeOffset PaidAt
);
