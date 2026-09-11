using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public interface IForgeApproachKernelClient
{
    Task<ForgeApproachInvocation<ForgeCostResult>> CostAsync(ForgeCostPayload payload, ForgeApproachContext context, CancellationToken ct = default);
    Task<ForgeApproachInvocation<ForgeIncomeResult>> IncomeAsync(ForgeIncomePayload payload, ForgeApproachContext context, CancellationToken ct = default);
}

public sealed class ForgeApproachException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

/// <summary>Host transport/identity adapter only. The shared process host must verify the adopted artifact.</summary>
public sealed class ForgeApproachKernelClient(IRustKernelProcessHost host, IOptions<RustKernelsOptions> options) : IForgeApproachKernelClient
{
    public const string KernelName = "terraforge.kernel.valuation";

    public Task<ForgeApproachInvocation<ForgeCostResult>> CostAsync(ForgeCostPayload payload, ForgeApproachContext context, CancellationToken ct = default)
        => InvokeAsync<ForgeCostPayload, ForgeCostResult>("cost", payload.ParcelId, payload, context, ct);
    public Task<ForgeApproachInvocation<ForgeIncomeResult>> IncomeAsync(ForgeIncomePayload payload, ForgeApproachContext context, CancellationToken ct = default)
        => InvokeAsync<ForgeIncomePayload, ForgeIncomeResult>("income", payload.ParcelId, payload, context, ct);

    private async Task<ForgeApproachInvocation<T>> InvokeAsync<P, T>(string action, string parcelId, P payload,
        ForgeApproachContext context, CancellationToken ct) where T : class, IForgeApproachResult
    {
        ArgumentNullException.ThrowIfNull(context);
        if (context.CountyId == Guid.Empty || string.IsNullOrWhiteSpace(context.ParcelId)
            || string.IsNullOrWhiteSpace(context.RequestId) || context.ParcelId != parcelId)
            throw new ForgeApproachException("CANONICAL_CONTEXT_REQUIRED", "Authenticated county, parcel and trace context are required.");
        var config = options.Value;
        // Historical default is deliberately unusable for new exchanges. No old-kernel fallback.
        if (!config.Enabled || !Hex(config.CostIncomeKernelSourceCommit, 40)
            || config.CostIncomeKernelSourceCommit == RustKernelsOptions.ForgeValuationCanonicalSourceCommit
            || !Hex(config.CostIncomeKernelExecutableSha256, 64) || string.IsNullOrWhiteSpace(config.CostIncomeKernelPath))
            throw new ForgeApproachException("CANONICAL_RUNTIME_UNAVAILABLE", "The Cost/Income canonical artifact has not been adopted.");

        var response = await host.InvokeAsync<P, T>(ResolvePath(config.CostIncomeKernelPath), KernelName,
            new("1.0.0", "1.0.0", context.RequestId, action, payload), ct);
        if (!response.Success)
            throw new ForgeApproachException(response.FailureMode == KernelFailureMode.KernelReportedError
                ? "CANONICAL_INPUT_REJECTED" : "CANONICAL_RUNTIME_UNAVAILABLE",
                response.FailureMode == KernelFailureMode.KernelReportedError
                    ? "Canonical calculation rejected the supplied inputs."
                    : "Canonical calculation is unavailable. No value was produced.");

        var audit = response.AuditEvent;
        if (response.Data is null || response.Data.SchemaVersion != "1.0.0" || response.Data.ParcelId != context.ParcelId
            || response.KernelName != KernelName || response.RequestId != context.RequestId
            || response.KernelBinarySha256 != config.CostIncomeKernelExecutableSha256
            || !Hex(response.InputHash, 64) || !Hex(response.StdoutSha256, 64)
            || audit is null || audit.Hash != $"git:{config.CostIncomeKernelSourceCommit}"
            || audit.Module != KernelName || audit.Action != action || audit.ResourceId != context.ParcelId
            || string.IsNullOrWhiteSpace(audit.EventId))
            throw new ForgeApproachException("CANONICAL_PROVENANCE_MISMATCH", "Canonical response identity could not be verified.");

        return new(response.Data, new(context.CountyId, context.ParcelId, context.RequestId,
            config.CostIncomeKernelSourceCommit, response.KernelBinarySha256!, response.InputHash, response.StdoutSha256!, audit.EventId));
    }

    private static bool Hex(string? value, int length) => value?.Length == length && value.All(c => c is >= '0' and <= '9' or >= 'a' and <= 'f');

    private static string ResolvePath(string path)
    {
        if (Path.IsPathFullyQualified(path)) return Path.GetFullPath(path);
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
            if (Directory.Exists(Path.Combine(directory.FullName, ".git")) || File.Exists(Path.Combine(directory.FullName, ".git"))
                || File.Exists(Path.Combine(directory.FullName, "terrafusion.app.json")))
                return Path.GetFullPath(Path.Combine(directory.FullName, path));
        return Path.GetFullPath(path);
    }
}
