namespace TerraFusion.Modules.CurrentUse.Events;

public sealed record CurrentUseImportBatchCreated(
    Guid CountyId,
    Guid ImportBatchId,
    string ImportType,
    string SourceFileName,
    string CreatedBy,
    DateTimeOffset CreatedAt
);

public sealed record CurrentUseImportBatchValidated(
    Guid CountyId,
    Guid ImportBatchId,
    int TotalRows,
    int ValidRows,
    int ErrorRows,
    string ValidatedBy,
    DateTimeOffset ValidatedAt
);

public sealed record CurrentUseImportBatchCommitted(
    Guid CountyId,
    Guid ImportBatchId,
    bool DryRun,
    string CommittedBy,
    DateTimeOffset CommittedAt
);
