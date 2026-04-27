using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// One row per source-system stored procedure discovered by the Atlas profiler.
/// Definition body is preserved so an assessor can read the vendor's business logic
/// (PACS has 1000+ sprocs encoding "what does 'qualified sale' mean" — surface them).
/// </summary>
public sealed class SyncProfileProcedure
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";

    public string SchemaName { get; set; } = "dbo";
    public string ProcedureName { get; set; } = null!;

    public string Definition { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
