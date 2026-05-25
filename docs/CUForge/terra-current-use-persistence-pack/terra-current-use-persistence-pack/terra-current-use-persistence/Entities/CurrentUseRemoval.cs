using TerraFusion.Modules.CurrentUse.Domain;

namespace TerraFusion.Modules.CurrentUse.Entities;

public sealed class CurrentUseRemoval
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public Guid ParcelId { get; set; }
    public Guid ClassificationId { get; set; }

    public RemovalType RemovalType { get; set; }
    public string Status { get; set; } = "DRAFT";
    public string RemovalReason { get; set; } = string.Empty;

    public DateOnly? IntentNoticeDate { get; set; }
    public DateOnly? OwnerResponseDueDate { get; set; }
    public DateOnly? OwnerResponseReceivedDate { get; set; }
    public DateOnly? FinalRemovalDate { get; set; }

    public Guid? RollbackCalculationId { get; set; }
    public bool AppealFiled { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAt { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}
