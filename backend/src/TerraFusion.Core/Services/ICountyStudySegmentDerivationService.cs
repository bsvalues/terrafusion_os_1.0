// backend/src/TerraFusion.Core/Services/ICountyStudySegmentDerivationService.cs
namespace TerraFusion.Core.Services;

/// <summary>
/// Derives a CountySegmentSet (+ CountySegments) from canonical TerraFusion data for a given study.
///
/// Input:  studyId — resolves to (countyId, taxYear) pair.
/// Output: segmentSetId of the newly created baseline segment set.
///
/// Reads:  Properties, CamaCharacteristics, ComparableSales (canonical tables only).
/// Writes: CountySegmentSets, CountySegments.
///
/// Grouping key: (Neighborhood × BuildingType × QualityGrade).
/// Metrics: parcelCount, medianRatio, COD (when ≥ 5 ratios), stabilityScore, riskScore,
/// exceptionCount. PRD is computed when arithmetic+weighted means are both defined.
/// </summary>
public interface ICountyStudySegmentDerivationService
{
    Task<SegmentDerivationResult> DeriveAsync(
        Guid studyId,
        string userId,
        CancellationToken ct = default);
}

public sealed record SegmentDerivationResult(
    string ContractId,
    Guid SegmentSetId,
    int SegmentCount,
    int TotalParcels,
    int SegmentsWithRatios,
    int SegmentsWithIaaoExceptions);
