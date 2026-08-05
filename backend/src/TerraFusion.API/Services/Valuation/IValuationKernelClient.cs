using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public interface IValuationKernelClient
{
    Task<KernelInvocationResult<ValuationKernelResult>> ValuateAsync(
        ValuationKernelPayload payload,
        CancellationToken ct = default);

    Task<KernelInvocationResult<ValuationKernelResult>> ValuateAsync(
        ValuationKernelPayload payload,
        KernelExecutionContext executionContext,
        CancellationToken ct = default);
}
