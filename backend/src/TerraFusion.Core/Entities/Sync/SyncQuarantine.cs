using System;

namespace TerraFusion.Core.Entities.Sync;

/// <summary>
/// Holds source records that failed validation during a SyncBatch. Quarantined rows do
/// not reach operational tables; they sit here with reason + payload for diagnosis or replay.
/// </summary>
public sealed class SyncQuarantine
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public string EntityType { get; set; } = null!;
    public string? SourceKey { get; set; }

    public string Reason { get; set; } = null!;
    public string PayloadHash { get; set; } = null!;
    public string PayloadJson { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
