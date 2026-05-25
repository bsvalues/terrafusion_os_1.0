
namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseCommunicationType
{
    OwnerExplanationPacket,
    RollbackSummary,
    MissingEvidenceInstructions,
    WithdrawalInstructions,
    AppealRightsSummary,
    ReclassificationOptionSummary,
    CallCenterScript
}

public sealed record CurrentUseOwnerCommunicationDto(
    Guid CommunicationId,
    Guid CountyId,
    Guid ParcelId,
    CurrentUseCommunicationType CommunicationType,
    string Title,
    string Body,
    string PlainLanguageDisclaimer,
    string LanguageCode,
    DateTimeOffset GeneratedAt,
    string GeneratedBy
);

public sealed record CreateCurrentUseOwnerCommunicationDto(
    Guid CountyId,
    Guid ParcelId,
    CurrentUseCommunicationType CommunicationType,
    string OwnerName,
    string ClassificationType,
    decimal? EstimatedTotalDue,
    DateOnly? ResponseDeadline,
    string LanguageCode,
    string GeneratedBy
);
