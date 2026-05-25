namespace TerraFusion.Modules.CurrentUse.Events;

public sealed record CurrentUseNoticePendingApprovalCreated(
    Guid CountyId,
    Guid ParcelId,
    Guid NoticeId,
    string NoticeType,
    string CreatedBy,
    DateTimeOffset CreatedAt
);

public sealed record CurrentUseNoticeApprovedForIssuance(
    Guid CountyId,
    Guid ParcelId,
    Guid NoticeId,
    string ApprovedBy,
    DateTimeOffset ApprovedAt
);

public sealed record CurrentUseNoticeIssued(
    Guid CountyId,
    Guid ParcelId,
    Guid NoticeId,
    string DeliveryMethod,
    string? DeliveryReference,
    Guid? DossierDocumentId,
    string IssuedBy,
    DateTimeOffset IssuedAt
);

public sealed record CurrentUseNoticeVoided(
    Guid CountyId,
    Guid ParcelId,
    Guid NoticeId,
    string VoidedBy,
    string VoidReason,
    DateTimeOffset VoidedAt
);
