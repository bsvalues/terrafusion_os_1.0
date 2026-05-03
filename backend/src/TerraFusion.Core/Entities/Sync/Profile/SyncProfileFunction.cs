using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// One row per source-system user-defined function discovered by the Atlas profiler.
/// FunctionType: 'scalar', 'inline-table', 'multi-statement-table'.
/// </summary>
public sealed class SyncProfileFunction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";

    public string SchemaName { get; set; } = "dbo";
    public string FunctionName { get; set; } = null!;
    public string FunctionType { get; set; } = "scalar";

    public string Definition { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
