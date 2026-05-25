namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseIssuedNoticeStatus
{
    DraftPreview,
    PendingApproval,
    ApprovedForIssuance,
    Issued,
    Voided,
    Superseded
}

public enum CurrentUseNoticeDeliveryMethod
{
    Mail,
    CertifiedMail,
    Email,
    HandDelivery,
    Portal,
    Other
}

public sealed record CurrentUseIssuedNoticeDto(
    Guid NoticeId,
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid? RemovalId,
    Guid? RollbackCalculationId,
    string NoticeType,
    CurrentUseIssuedNoticeStatus Status,
    string Title,
    string Body,
    string ApprovedBy,
    DateTimeOffset? ApprovedAt,
    string? IssuedBy,
    DateTimeOffset? IssuedAt,
    CurrentUseNoticeDeliveryMethod? DeliveryMethod,
    string? DeliveryReference,
    Guid? DossierDocumentId,
    DateTimeOffset CreatedAt,
    string CreatedBy
);

public sealed record CreatePendingCurrentUseNoticeDto(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid? RemovalId,
    Guid? RollbackCalculationId,
    string NoticeType,
    string Title,
    string Body,
    string CreatedBy
);

public sealed record ApproveCurrentUseNoticeDto(
    string ApprovedBy,
    string ApprovalNote
);

public sealed record IssueCurrentUseNoticeDto(
    string IssuedBy,
    CurrentUseNoticeDeliveryMethod DeliveryMethod,
    string? DeliveryReference,
    Guid? DossierDocumentId,
    string IssueNote
);

public sealed record VoidCurrentUseNoticeDto(
    string VoidedBy,
    string VoidReason
);
