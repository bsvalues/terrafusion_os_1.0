namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>
/// Envelope for a single kernel invocation. Shared by all kernels (cost, valuation, future).
/// Serialized to stdin of the kernel subprocess.
/// </summary>
public record KernelInvocation<TPayload>(
    string ContractPackVersion,
    string ModuleApiVersion,
    string RequestId,
    string Action,
    TPayload? Payload);
