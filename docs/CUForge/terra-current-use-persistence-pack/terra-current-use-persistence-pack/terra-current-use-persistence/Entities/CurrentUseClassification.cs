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
    public decimal? TotalParcelAcresSnapshot { get; set; }
    public decimal? HomesiteExcludedAcres { get; set; }

    public DateOnly? ApprovalDate { get; set; }
    public int? EffectiveTaxYear { get; set; }

    public string? CurrentUseApplicationNumber { get; set; }
    public string? AgreementNumber { get; set; }
    public string? ContiguousGroupId { get; set; }

    public bool Active { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAt { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}
