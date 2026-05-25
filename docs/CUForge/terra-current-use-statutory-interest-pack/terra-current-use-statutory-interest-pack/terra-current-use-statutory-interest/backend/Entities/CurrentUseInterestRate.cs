namespace TerraFusion.Modules.CurrentUse.Entities;

public sealed class CurrentUseInterestRate
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }
    public decimal AnnualRate { get; set; }

    public DateOnly EffectiveStartDate { get; set; }
    public DateOnly? EffectiveEndDate { get; set; }

    public string Source { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}
