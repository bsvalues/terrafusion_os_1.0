namespace TerraFusion.API.Services.Dossier;

public interface IDossierEvidenceRegistryReadProcessHost
{
    Task<DossierEvidenceRegistryReadProcessResult> ValidateAsync(
        string modulePath,
        string expectedModuleSha256,
        string schemaPath,
        string expectedSchemaSha256,
        string evidenceRegistryExchangeJson,
        CancellationToken cancellationToken = default);
}

public enum DossierEvidenceRegistryReadOutcome
{
    Accepted,
    Rejected,
    Failed,
}

public enum DossierEvidenceRegistryReadFailure
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

public sealed record DossierEvidenceRegistryReadViolation(string Class, string Message);

public sealed record DossierEvidenceRegistryReadProcessResult(
    DossierEvidenceRegistryReadOutcome Outcome,
    DossierEvidenceRegistryReadFailure Failure,
    string? NormalizedExchangeJson,
    IReadOnlyList<DossierEvidenceRegistryReadViolation>? Violations,
    string? RequestCountyId,
    string? ResultCountyId,
    string? SourceModuleSha256,
    string? CopiedModuleSha256,
    string? SourceSchemaSha256,
    string? CopiedSchemaSha256,
    string? ErrorMessage)
{
    public bool Success => Failure == DossierEvidenceRegistryReadFailure.None;
}
