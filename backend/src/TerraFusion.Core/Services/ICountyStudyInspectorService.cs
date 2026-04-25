// backend/src/TerraFusion.Core/Services/ICountyStudyInspectorService.cs
//
// Task D — Inspector backend contract.
// Two endpoints' worth of logic:
//   1. GetSegmentDetailAsync — IAAO core metrics + Benton Method (PRB / VEI /
//      classification / equity score) + 5-year YoY series + compliance +
//      human-readable warnings. One round-trip for the Inspector's Metrics
//      and Trend tabs.
//   2. GetActionContextAsync — pre-scoped handoff bundle for the five
//      correction surfaces (SalesForge / CostForge / CompsForge / Dais /
//      Dossier). Parcel-list cap is enforced here so callers never wire an
//      unbounded list into a URL.
//
// Both methods throw InvalidOperationException when the segment is not found;
// the controller maps that to 404.

using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

public interface ICountyStudyInspectorService
{
    /// <summary>
    /// Returns the full Inspector detail bundle for a segment. Throws
    /// InvalidOperationException when the segment does not exist.
    /// </summary>
    Task<CountySegmentDetailDto> GetSegmentDetailAsync(Guid segmentId, CancellationToken ct = default);

    /// <summary>
    /// Returns pre-scoped handoff context for the five correction targets.
    /// Throws InvalidOperationException when the segment does not exist.
    /// </summary>
    Task<SegmentActionContextDto> GetActionContextAsync(Guid segmentId, CancellationToken ct = default);
}
