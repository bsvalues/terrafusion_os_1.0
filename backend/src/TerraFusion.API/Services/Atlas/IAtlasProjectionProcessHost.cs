namespace TerraFusion.API.Services.Atlas;

public interface IAtlasProjectionProcessHost
{
    Task<AtlasProjectionProcessResult> ProjectAsync(
        string modulePath,
        string expectedModuleSha256,
        string spatialReadExchangeJson,
        CancellationToken cancellationToken = default);
}

public enum AtlasProjectionOutcome
{
    Polygon,
    Point,
    Unavailable,
    Failed,
}

public enum AtlasProjectionFailure
{
    None,
    InvalidModulePath,
    ModuleNotFound,
    UnsupportedModuleType,
    InvalidExpectedHash,
    SourceHashMismatch,
    CopiedModuleHashMismatch,
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
    InvalidGeometry,
    CleanupFailed,
    RuntimeIdentityMismatch,
}

public sealed record AtlasProjectionProcessResult(
    AtlasProjectionOutcome Outcome,
    AtlasProjectionFailure Failure,
    string? NormalizedFeatureJson,
    string? CountyId,
    string? ParcelId,
    string? EvidenceState,
    string? SourceModuleSha256,
    string? CopiedModuleSha256,
    string? ErrorMessage)
{
    public bool Success => Failure == AtlasProjectionFailure.None;
}
