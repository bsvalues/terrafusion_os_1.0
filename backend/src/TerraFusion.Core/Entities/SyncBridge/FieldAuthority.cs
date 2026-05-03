using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Sync Bridge v1: write-governance rules. Every field on every
/// canonical_tf table needs an authority row declaring who owns
/// it, which directions sync is allowed in, and what happens on
/// conflict.
///
/// <para>Doctrine rule: NO write-back without an authority row.
/// Default for any field without an explicit rule:
/// <c>conflict_strategy = 'BLOCKED'</c>.</para>
///
/// <para>Conflict strategies (closed enum, stored as varchar for
/// forward-compat): <c>PACS_WINS</c>, <c>TF_WINS</c>,
/// <c>MANUAL_REVIEW</c>, <c>APPEND_ONLY</c>, <c>BLOCKED</c>.</para>
///
/// <para>System-of-record values: <c>PACS</c>, <c>TF</c>,
/// <c>GIS</c>, <c>CONTESTED</c>.</para>
/// </summary>
public sealed class FieldAuthority
{
    public long AuthorityId { get; set; }

    public string DomainName { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
    public string Phase { get; set; } = "phase_0";

    public string SystemOfRecord { get; set; } = string.Empty;
    public bool PacsToTfAllowed { get; set; }
    public bool TfToPacsAllowed { get; set; }

    public string ConflictStrategy { get; set; } = "BLOCKED";
    public bool ApprovalRequired { get; set; } = true;
    public bool RollbackRequired { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
