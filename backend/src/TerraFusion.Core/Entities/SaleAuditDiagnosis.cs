// backend/src/TerraFusion.Core/Entities/SaleAuditDiagnosis.cs
namespace TerraFusion.Core.Entities;

public class SaleAuditDiagnosis
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }
    /// <summary>Neighborhood/segment key from ForgeStatisticsService.DiscoverSegmentsAsync</summary>
    public string StratumKey { get; set; } = string.Empty;
    /// <summary>DATA_PROBLEM | MODEL_DRIFT | OUTLIER_CLUSTER | MARKET_SHIFT | EXTERNAL_FACTOR</summary>
    public string PrimaryDiagnosis { get; set; } = string.Empty;
    /// <summary>0.00–1.00</summary>
    public decimal Confidence { get; set; }
    /// <summary>JSON array of DiagnosisFinding objects</summary>
    public string FindingsJson { get; set; } = "[]";
    /// <summary>JSON of projected COD/Median/PRD if recommendation accepted</summary>
    public string? SimulationResultJson { get; set; }
    /// <summary>DISQUALIFY_SALES | PROPOSE_ADJUSTMENT | FLAG_FOR_REVIEW</summary>
    public string RecommendedAction { get; set; } = string.Empty;
    /// <summary>JSON array of Guid — sales to disqualify if DATA_PROBLEM</summary>
    public string? RecommendedSaleIdsJson { get; set; }
    /// <summary>Proposed factor if MODEL_DRIFT</summary>
    public decimal? RecommendedFactor { get; set; }
    public DateTime DiagnosedAt { get; set; }
    /// <summary>Marked stale on each sync completion; re-run clears it</summary>
    public bool IsStale { get; set; }
}
