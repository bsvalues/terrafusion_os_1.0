namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseImportType
{
    ClassificationInventory,
    RollbackWorksheet,
    EvidenceIndex,
    NoticeHistory,
    InspectionHistory,
    TreasurerPaymentHistory
}

public enum CurrentUseImportStatus
{
    Uploaded,
    Validating,
    ValidationFailed,
    ReadyToImport,
    Imported,
    ImportFailed,
    Canceled
}

public enum CurrentUseImportSeverity
{
    Info,
    Warning,
    Error
}

public sealed record CurrentUseImportValidationIssueDto(
    int RowNumber,
    string FieldName,
    CurrentUseImportSeverity Severity,
    string Message
);

public sealed record CurrentUseImportBatchDto(
    Guid ImportBatchId,
    Guid CountyId,
    CurrentUseImportType ImportType,
    CurrentUseImportStatus Status,
    string SourceFileName,
    int TotalRows,
    int ValidRows,
    int WarningRows,
    int ErrorRows,
    IReadOnlyList<CurrentUseImportValidationIssueDto> Issues,
    DateTimeOffset CreatedAt,
    string CreatedBy
);

public sealed record CreateCurrentUseImportBatchDto(
    Guid CountyId,
    CurrentUseImportType ImportType,
    string SourceFileName,
    string CreatedBy
);

public sealed record ValidateCurrentUseImportRowsDto(
    Guid ImportBatchId,
    IReadOnlyList<Dictionary<string, string?>> Rows,
    string ValidatedBy
);

public sealed record CommitCurrentUseImportBatchDto(
    string CommittedBy,
    bool DryRun,
    string? Note
);
