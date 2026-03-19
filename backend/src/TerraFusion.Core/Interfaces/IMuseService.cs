using TerraFusion.Core.DTOs.Pilot;

namespace TerraFusion.Core.Interfaces;

public interface IMuseService
{
    Task<ExplainResponse> ExplainAsync(ExplainRequest request, CancellationToken ct = default);
}
