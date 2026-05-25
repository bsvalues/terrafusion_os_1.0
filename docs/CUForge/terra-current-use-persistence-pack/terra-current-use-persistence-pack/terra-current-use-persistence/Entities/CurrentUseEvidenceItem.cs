namespace TerraFusion.Modules.CurrentUse.Entities;

public sealed class CurrentUseEvidenceItem
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public Guid ParcelId { get; set; }
    public Guid? ClassificationId { get; set; }
    public Guid? ReviewId { get; set; }

    public string EvidenceType { get; set; } = string.Empty;
    public string Status { get; set; } = "MISSING";

    // This is a Dossier reference. Do not store document blobs in Forge.
    public Guid? DocumentId { get; set; }

    public DateTimeOffset? ReceivedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAt { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}
