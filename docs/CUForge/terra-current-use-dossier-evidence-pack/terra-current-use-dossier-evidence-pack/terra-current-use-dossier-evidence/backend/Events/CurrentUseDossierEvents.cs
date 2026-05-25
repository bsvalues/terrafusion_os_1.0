namespace TerraFusion.Modules.CurrentUse.Events;

public sealed record CurrentUseDocumentLinked(
    Guid CountyId,
    Guid ParcelId,
    Guid DocumentId,
    string DocumentType,
    string LinkedBy,
    DateTimeOffset LinkedAt
);

public sealed record CurrentUseEvidencePacketReviewed(
    Guid CountyId,
    Guid ParcelId,
    Guid PacketId,
    string ReviewedBy,
    DateTimeOffset ReviewedAt,
    string Status
);

public sealed record CurrentUseDocumentStatusChanged(
    Guid CountyId,
    Guid ParcelId,
    Guid DocumentId,
    string PreviousStatus,
    string NewStatus,
    string UpdatedBy,
    DateTimeOffset UpdatedAt
);
