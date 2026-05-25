namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseEvidencePacketStatus
{
    Draft,
    Incomplete,
    ReadyForReview,
    Reviewed,
    Accepted,
    Rejected,
    Archived
}

public enum CurrentUseDocumentLinkStatus
{
    Linked,
    PendingReview,
    Accepted,
    Rejected,
    Superseded,
    Removed
}

public sealed record CurrentUseDossierDocumentDto(
    Guid DocumentId,
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    string DocumentType,
    string FileName,
    string ContentType,
    long SizeBytes,
    string LinkStatus,
    DateTimeOffset UploadedAt,
    string UploadedBy,
    string? Notes
);

public sealed record CurrentUseEvidencePacketDto(
    Guid PacketId,
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    string PacketType,
    CurrentUseEvidencePacketStatus Status,
    IReadOnlyList<CurrentUseDossierDocumentDto> Documents,
    IReadOnlyList<string> MissingDocumentTypes,
    DateTimeOffset CreatedAt,
    string CreatedBy,
    DateTimeOffset UpdatedAt,
    string UpdatedBy
);

public sealed record LinkCurrentUseDocumentRequestDto(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid DocumentId,
    string DocumentType,
    string FileName,
    string ContentType,
    long SizeBytes,
    string UploadedBy,
    string? Notes
);

public sealed record UpdateCurrentUseDocumentStatusRequestDto(
    string LinkStatus,
    string UpdatedBy,
    string? Notes
);
