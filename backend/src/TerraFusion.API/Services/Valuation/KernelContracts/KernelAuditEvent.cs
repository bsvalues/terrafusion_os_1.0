namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>
/// Kernel-emitted source provenance. Hash is "git:&lt;sha&gt;".
/// Backend provenance pairs this with KernelBinarySha256 on KernelInvocationResult.
/// </summary>
public record KernelAuditEvent(
    string EventId,
    string Timestamp,
    string Actor,
    string Action,
    string ResourceId,
    string Module,
    string Hash);
