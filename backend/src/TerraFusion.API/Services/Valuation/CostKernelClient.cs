using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public class CostKernelClient : ICostKernelClient
{
    private const string KernelName = "terraforge.kernel.cost";
    private const string Action = "calculate_cost";

    private readonly IRustKernelProcessHost _host;
    private readonly IOptions<RustKernelsOptions> _options;
    private readonly ILogger<CostKernelClient> _logger;

    public CostKernelClient(
        IRustKernelProcessHost host,
        IOptions<RustKernelsOptions> options,
        ILogger<CostKernelClient> logger)
    {
        _host = host;
        _options = options;
        _logger = logger;
    }

    public async Task<KernelInvocationResult<CostKernelResult>> CalculateCostAsync(
        CostKernelPayload payload,
        CancellationToken ct = default)
    {
        var opts = _options.Value;
        var invocation = new KernelInvocation<CostKernelPayload>(
            ContractPackVersion: opts.ContractPackVersion,
            ModuleApiVersion: opts.ModuleApiVersion,
            RequestId: Guid.NewGuid().ToString(),
            Action: Action,
            Payload: payload);

        _logger.LogDebug("Invoking {KernelName} for parcel {ParcelId}",
            KernelName, payload.Subject.ParcelId);

        return await _host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            opts.CostKernelPath, KernelName, invocation, ct);
    }
}
