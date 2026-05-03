using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface ICamaDataQualityService
{
    Task<DataQualityAssessmentDto> AssessAsync(
        Guid countyId, int taxYear, CancellationToken ct = default);
}
