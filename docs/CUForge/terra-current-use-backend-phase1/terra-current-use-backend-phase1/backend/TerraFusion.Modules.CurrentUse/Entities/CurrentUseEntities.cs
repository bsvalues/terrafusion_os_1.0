using TerraFusion.Modules.CurrentUse.Domain;

namespace TerraFusion.Modules.CurrentUse.Entities;

public sealed class CurrentUseClassification
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public Guid ParcelId { get; set; }
    public ClassificationType ClassificationType { get; set; }
    public CurrentUseLifecycleState LifecycleState { get; set; }
    public decimal ClassifiedAcres { get; set; }
    public decimal? HomesiteExcludedAcres { get; set; }
    public DateOnly? ApprovalDate { get; set; }
    public int? EffectiveTaxYear { get; set; }
    public string? CurrentUseApplicationNumber { get; set; }
    public string? AgreementNumber { get; set; }
    public bool Active { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

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
    public bool StatutoryExceptionApplied { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public bool Locked { get; set; }
}

public sealed class CurrentUseTimelineEvent
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public Guid ParcelId { get; set; }
    public Guid? ClassificationId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public DateTimeOffset EventDate { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? PayloadJson { get; set; }
    public Guid? CorrectionOfEventId { get; set; }
}
