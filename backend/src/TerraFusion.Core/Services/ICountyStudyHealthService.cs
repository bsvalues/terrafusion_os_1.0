// backend/src/TerraFusion.Core/Services/ICountyStudyHealthService.cs
//
// Task C — County Studio "is my county healthy?" single-screen answer.
// Returns a deterministic, parcel-weighted summary of IAAO metrics across
// the study's active segment set plus the 5 worst segments ranked by the
// canonical composite-risk formula.

using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

public interface ICountyStudyHealthService
{
    /// <summary>
    /// Builds the health summary for a study. Throws InvalidOperationException
    /// with "active segment set" in the message when the study has no
    /// ActiveSegmentSetId (controller maps that to 409).
    /// </summary>
    Task<CountyHealthSummaryDto> GetHealthSummaryAsync(Guid studyId, CancellationToken ct = default);
}
