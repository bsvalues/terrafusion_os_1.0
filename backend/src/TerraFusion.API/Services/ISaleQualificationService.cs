namespace TerraFusion.API.Services;

/// <summary>
/// TerraFusion's sale qualification rule engine — Layer 2 of the 3-layer qualification model.
///
/// ARCHITECTURAL CONTRACT:
///   Layer 1 — Raw PACS codes: copied verbatim at sync time. Never judged here.
///   Layer 2 — TF Recommendation: this service computes from Layer 1 raw codes.
///             Run AFTER ingest, never during sync. Recomputable at any time.
///   Layer 3 — Assessor Decision: stored separately; always wins over recommendation.
///             ValuationService uses: QualificationDecision ?? QualificationRecommendation.
///
/// Raw PACS codes are facts. TerraFusion recommendation is a suggestion.
/// Assessor decision is law.
/// </summary>
public interface ISaleQualificationService
{
    /// <summary>
    /// Compute the recommendation string for a single sale from its raw PACS codes.
    /// Returns one of: "qualified" | "non-arms-length" | "foreclosure" | "estate"
    ///                 | "excluded: {code}" | "exempt: {code}"
    /// </summary>
    string Qualify(
        string? rawSaleQualifier,
        string? rawCountyRatioCd,
        string? rawExcludeCalcCd,
        string? rawWacCd);

    /// <summary>
    /// Compute and write Layer 2 recommendation fields for a collection of ComparableSale records.
    /// Sets QualificationRecommendation, RecommendationReason, RecommendationSource, RecommendationVersion.
    /// Call this AFTER sync/ingest — never during canonicalization.
    /// Caller is responsible for persisting changes (SaveChangesAsync).
    /// </summary>
    void ComputeRecommendations(IEnumerable<TerraFusion.Core.Entities.ComparableSale> sales);

    /// <summary>
    /// Fetch all ComparableSale records for the given county, recompute Layer 2 recommendations,
    /// persist, and return the count of records updated.
    /// Safe to call any time — does not touch Layer 3 assessor decisions.
    /// </summary>
    Task<int> ComputeRecommendationsAsync(Guid countyId, CancellationToken ct = default);
}
