using TerraFusion.Abstractions.DTOs.Kernel;

namespace TerraFusion.API.Services.Valuation;

public interface IKernelValuationService
{
    Task<KernelCostApproachResponse> ComputeCostWithKernelAsync(
        KernelCostApproachRequest request,
        CancellationToken ct = default);
}
