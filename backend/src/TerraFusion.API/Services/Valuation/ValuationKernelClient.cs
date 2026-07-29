using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public class ValuationKernelClient : IValuationKernelClient
{
    private const string KernelName = "terraforge.kernel.valuation";
    private const string Action = "valuate";

    private readonly IRustKernelProcessHost _host;
    private readonly IOptions<RustKernelsOptions> _options;
    private readonly ILogger<ValuationKernelClient> _logger;

    public ValuationKernelClient(
        IRustKernelProcessHost host,
        IOptions<RustKernelsOptions> options,
        ILogger<ValuationKernelClient> logger)
    {
        _host = host;
        _options = options;
        _logger = logger;
    }

    public async Task<KernelInvocationResult<ValuationKernelResult>> ValuateAsync(
        ValuationKernelPayload payload,
        CancellationToken ct = default)
    {
        var opts = _options.Value;
        var invocation = new KernelInvocation<ValuationKernelPayload>(
            ContractPackVersion: opts.ContractPackVersion,
            ModuleApiVersion: opts.ModuleApiVersion,
            RequestId: Guid.NewGuid().ToString(),
            Action: Action,
            Payload: payload);

        _logger.LogDebug("Invoking {KernelName} for parcel {ParcelId}",
            KernelName, payload.Subject.ParcelId);

        return await _host.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
            ResolveRepositoryRelativePath(opts.ValuationKernelPath), KernelName, invocation, ct);
    }

    private static string ResolveRepositoryRelativePath(string path)
    {
        if (Path.IsPathFullyQualified(path))
        {
            return Path.GetFullPath(path);
        }

        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory != null)
        {
            var gitPath = Path.Combine(directory.FullName, ".git");
            if (Directory.Exists(gitPath) ||
                File.Exists(gitPath) ||
                File.Exists(Path.Combine(directory.FullName, "terrafusion.app.json")))
            {
                return Path.GetFullPath(Path.Combine(directory.FullName, path));
            }

            directory = directory.Parent;
        }

        return Path.GetFullPath(path);
    }
}
