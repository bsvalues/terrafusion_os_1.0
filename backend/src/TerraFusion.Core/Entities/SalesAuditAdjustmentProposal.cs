// backend/src/TerraFusion.Core/Entities/SalesAuditAdjustmentProposal.cs
namespace TerraFusion.Core.Entities;

public class SalesAuditAdjustmentProposal
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }
    public string StratumKey { get; set; } = string.Empty;
    public decimal ProposedFactor { get; set; }
    public decimal ProjectedCod { get; set; }
    public decimal ProjectedMedianRatio { get; set; }
    public decimal ProjectedPrd { get; set; }
    /// <summary>draft | committed | rejected | superseded</summary>
    public string Status { get; set; } = "draft";
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
