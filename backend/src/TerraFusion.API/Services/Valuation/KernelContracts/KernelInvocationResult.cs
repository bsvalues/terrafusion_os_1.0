namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>
/// Backend-owned envelope for a kernel invocation. Combines the kernel's data with
/// backend-measured provenance (timing, input hash, failure mode).
/// </summary>
public record KernelInvocationResult<TData>(
    bool Success,
    string KernelName,
    string? KernelVersion,
    string InputHash,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    int DurationMs,
    TData? Data,
    KernelAuditEvent? AuditEvent,
    IReadOnlyList<string> Warnings,
    KernelFailureMode? FailureMode,
    string? ErrorMessage,
    string? KernelBinarySha256 = null,
    int StdoutByteCount = 0,
    string? StdoutSha256 = null,
    int StderrByteCount = 0,
    string? StderrSha256 = null,
    string? RequestId = null);
