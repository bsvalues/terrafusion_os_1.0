using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Sync Bridge v1: every TF → PACS write-back is journaled here
/// BEFORE execution. v1 only inserts rows with status='INTENDED';
/// Phase 2+ will execute and update status to 'EXECUTED' or
/// 'FAILED'.
///
/// <para>Doctrine rule: NO write-back without an authority row.
/// <see cref="AuthorityId"/> is a required FK to
/// <c>FieldAuthority</c>.</para>
/// </summary>
public sealed class WritebackJournal
{
    public Guid JournalId { get; set; } = Guid.NewGuid();

    public Guid? LoadBatchId { get; set; }
    public string TfEntityType { get; set; } = string.Empty;
    public Guid TfEntityId { get; set; }

    /// <summary>'PACS' | 'CAMACLOUD'.</summary>
    public string TargetSystem { get; set; } = string.Empty;
    public string TargetTable { get; set; } = string.Empty;

    /// <summary>Composite target key as JSON; jsonb in Postgres.</summary>
    public string TargetKeyJson { get; set; } = string.Empty;

    public string FieldName { get; set; } = string.Empty;
    public string? NewValue { get; set; }

    public long AuthorityId { get; set; }

    /// <summary>'INTENDED' | 'EXECUTED' | 'FAILED' | 'WITHDRAWN'.</summary>
    public string Status { get; set; } = "INTENDED";

    public DateTime? ExecutedAt { get; set; }
    public string Operator { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
