using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

public interface ICostKernelClient
{
    Task<KernelInvocationResult<CostKernelResult>> CalculateCostAsync(
        CostKernelPayload payload,
        CancellationToken ct = default);
}
