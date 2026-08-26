namespace TerraFusion.API.Services.Dais;

public interface IDaisAppealWorkflowProcessHost
{
    Task<DaisAppealWorkflowProcessResult> ValidateAsync(
        string modulePath,
        string expectedModuleSha256,
        string schemaPath,
        string expectedSchemaSha256,
        string appealWorkflowExchangeJson,
        CancellationToken cancellationToken = default);
}

public enum DaisAppealWorkflowOutcome
{
    Accepted,
    Rejected,
    Failed,
}

public enum DaisAppealWorkflowFailure
{
    None,
    InvalidModulePath,
    ModuleNotFound,
    UnsupportedModuleType,
    InvalidSchemaPath,
    SchemaNotFound,
    UnsupportedSchemaType,
    InvalidExpectedHash,
    SourceModuleHashMismatch,
    SourceSchemaHashMismatch,
    CopiedModuleHashMismatch,
    CopiedSchemaHashMismatch,
    InputTooLarge,
    InvalidExchange,
    ProcessStartFailed,
    NonZeroExit,
    Timeout,
    Cancelled,
    StandardOutputTooLarge,
    StandardErrorTooLarge,
    MissingOutput,
    InvalidOutput,
    IdentityMismatch,
    CleanupFailed,
    RuntimeIdentityMismatch,
}

public sealed record DaisAppealWorkflowViolation(string Class, string Message);

public sealed record DaisAppealWorkflowProcessResult(
    DaisAppealWorkflowOutcome Outcome,
    DaisAppealWorkflowFailure Failure,
    string? NormalizedExchangeJson,
    IReadOnlyList<DaisAppealWorkflowViolation>? Violations,
    string? RequestCountyId,
    string? ResultCountyId,
    string? SourceModuleSha256,
    string? CopiedModuleSha256,
    string? SourceSchemaSha256,
    string? CopiedSchemaSha256,
    string? ErrorMessage)
{
    public bool Success => Failure == DaisAppealWorkflowFailure.None;
}
