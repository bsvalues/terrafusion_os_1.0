
namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseSubmissionStatus
{
    Draft,
    Validated,
    ReadyForSubmission,
    Submitted,
    Accepted,
    Rejected
}

public sealed record CurrentUseSubmissionRowDto(
    Guid ParcelId,
    string ClassificationType,
    string LifecycleState,
    decimal ClassifiedAcres,
    decimal? RollbackAmount
);

public sealed record CurrentUseSubmissionBatchDto(
    Guid SubmissionBatchId,
    Guid CountyId,
    string StateCode,
    string ReportingYear,
    CurrentUseSubmissionStatus Status,
    int RecordCount,
    IReadOnlyList<CurrentUseSubmissionRowDto> Rows,
    DateTimeOffset CreatedAt,
    string CreatedBy
);
