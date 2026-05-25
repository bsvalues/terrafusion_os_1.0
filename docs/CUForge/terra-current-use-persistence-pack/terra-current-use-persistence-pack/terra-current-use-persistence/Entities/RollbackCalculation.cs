namespace TerraFusion.Modules.CurrentUse.Entities;

public sealed class RollbackCalculation
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public Guid ParcelId { get; set; }
    public Guid ClassificationId { get; set; }
    public Guid? RemovalId { get; set; }

    public string CalculationVersion { get; set; } = string.Empty;

    public string InputSnapshotJson { get; set; } = string.Empty;
    public string ResultSnapshotJson { get; set; } = string.Empty;

    public decimal AdditionalTaxSubtotal { get; set; }
    public decimal InterestSubtotal { get; set; }
    public decimal PenaltyAmount { get; set; }
    public decimal TotalDue { get; set; }

    public bool PenaltyApplied { get; set; }
    public string? PenaltySuppressionReason { get; set; }

    public bool StatutoryExceptionApplied { get; set; }
    public string? StatutoryExceptionReason { get; set; }

    public bool Locked { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}
