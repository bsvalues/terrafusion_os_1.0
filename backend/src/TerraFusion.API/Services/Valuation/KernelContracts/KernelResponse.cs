namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>
/// Envelope for a kernel's stdout response. Fields match the Rust kernel's Response&lt;T&gt; struct.
/// </summary>
public record KernelResponse<TData>(
    bool Success,
    string? Error,
    TData? Data,
    KernelAuditEvent? AuditEvent);
