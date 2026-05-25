using TerraFusion.Modules.CurrentUse.Domain;
using TerraFusion.Modules.CurrentUse.Domain.Notices;

namespace TerraFusion.Modules.CurrentUse.Dto;

public sealed record NoticePreviewRequestDto(
    Guid CountyId,
    Guid ParcelId,
    CurrentUseNoticeType NoticeType,
    ClassificationType ClassificationType,
    string OwnerName,
    string? PropertyAddress,
    string? LegalDescription,
    string? AssessorContactName,
    string? AssessorContactPhone,
    string? AssessorContactEmail,
    string? RemovalReason,
    DateOnly? ResponseDeadline,
    Guid? RollbackCalculationId,
    decimal? RollbackTotalDue,
    string GeneratedBy
);

public sealed record NoticePreviewResultDto(
    Guid NoticeId,
    Guid CountyId,
    Guid ParcelId,
    CurrentUseNoticeType NoticeType,
    CurrentUseNoticeStatus Status,
    string Title,
    string Body,
    string HumanReviewDisclaimer,
    DateTimeOffset GeneratedAt,
    string GeneratedBy
);
