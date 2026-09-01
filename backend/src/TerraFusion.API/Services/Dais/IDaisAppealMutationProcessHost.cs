namespace TerraFusion.API.Services.Dais;

public interface IDaisAppealMutationProcessHost
{
    Task<DaisAppealMutationProcessResult> DecideAsync(
        string modulePath,
        string expectedModuleSha256,
        string schemaPath,
        string expectedSchemaSha256,
        string requestJson,
        CancellationToken cancellationToken = default);
}

public enum DaisAppealMutationProcessFailure
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
    InvalidRequest,
    ProcessStartFailed,
    NonZeroExit,
    Timeout,
    Cancelled,
    StandardOutputTooLarge,
    StandardErrorTooLarge,
    MissingOutput,
    InvalidOutput,
    SchemaRejected,
    IdentityMismatch,
    CleanupFailed,
    RuntimeIdentityMismatch,
}

public sealed record DaisAppealMutationProcessResult(
    DaisAppealMutationProcessFailure Failure,
    string? ResultJson,
    string? SourceModuleSha256,
    string? CopiedModuleSha256,
    string? SourceSchemaSha256,
    string? CopiedSchemaSha256,
    string? ErrorMessage)
{
    public bool Success => Failure == DaisAppealMutationProcessFailure.None;
}
