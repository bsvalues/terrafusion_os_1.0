using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Sync Bridge v1: lineage backbone. Maps a TerraFusion canonical
/// entity (<see cref="TfEntityType"/>, <see cref="TfEntityId"/>)
/// to its source-system identity captured as JSON in
/// <see cref="SourceKeyJson"/>.
///
/// <para>For PACS parcels, the JSON shape is:
/// <code>{ "prop_id": 12345, "prop_val_yr": 2026, "sup_num": 0 }</code>
/// — preserving the (prop_id, prop_val_yr, sup_num) triple as
/// lineage, not as identity.</para>
///
/// <para>Per the doctrine: every row in <c>canonical_tf.*</c> MUST
/// have a corresponding row in this table. Rows without lineage
/// are quarantined to <c>legacy_tf_unproven.*</c>.</para>
/// </summary>
public sealed class SourceXref
{
    public long XrefId { get; set; }

    public string TfEntityType { get; set; } = string.Empty;
    public Guid TfEntityId { get; set; }

    public string SourceSystem { get; set; } = string.Empty;
    public string? SourceDatabase { get; set; }
    public string? SourceTable { get; set; }

    /// <summary>Composite source key as JSON; jsonb in Postgres.</summary>
    public string SourceKeyJson { get; set; } = string.Empty;

    public string SourceQueryHash { get; set; } = string.Empty;
    public Guid LoadBatchId { get; set; }

    public DateTime FirstSeenAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;

    public decimal ConfidenceScore { get; set; } = 1.00m;
    public bool IsActive { get; set; } = true;
}
