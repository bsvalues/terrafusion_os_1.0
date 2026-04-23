namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>
/// FISMA calculation-provenance audit event emitted by every kernel invocation.
/// Hash field is "git:&lt;12-char SHA&gt;" — reproducible by checking out that commit and rebuilding.
/// </summary>
public record KernelAuditEvent(
    string EventId,
    string Timestamp,
    string Actor,
    string Action,
    string ResourceId,
    string Module,
    string Hash);
