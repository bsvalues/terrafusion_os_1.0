namespace TerraFusion.Modules.CurrentUse.Entities;

public sealed class CurrentUseCanonicalRecord
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public Guid ParcelId { get; set; }
    public string RecordType { get; set; } = string.Empty;
    public string RecordStatus { get; set; } = string.Empty;
    public string SourceSystem { get; set; } = "TerraForge";
    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}
