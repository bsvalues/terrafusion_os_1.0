using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Sync Bridge v1: every load operation is registered here.
///
/// <para>Doctrine rule: every row in <c>raw_pacs.*</c>,
/// <c>truth_pacs.*</c>, <c>canonical_tf.*</c>, and <c>product.*</c>
/// references a <see cref="LoadBatchId"/>. Without it, the row is
/// not provenanced.</para>
///
/// <para><see cref="SourceFamily"/> values are a closed vocabulary
/// stored as varchar(64) for forward-compat. The canonical list lives
/// in <see cref="SourceFamilies"/>. Adding a value is intentionally a
/// code change.</para>
///
/// <para>v1 vocabulary: <c>PACS_OLTP</c>, <c>PACS_BACKUP</c>,
/// <c>CAMACLOUD</c>, <c>PACS_SPATIAL</c>, <c>PACS_LISTS</c>,
/// <c>PACS_DBPROJECT</c>, <c>PACS_SYNCSERVICE_DB</c>,
/// <c>WEB_INTERNET_BENTON</c>, <c>TAAPPSVR</c>, <c>PROVAL</c>,
/// <c>ASCEND</c>, <c>CIAPS</c>, <c>BENTON_DYNLOADER</c>,
/// <c>ARCGIS_REST</c> (Slice G1-B), <c>LEGACY_UNKNOWN</c>.</para>
/// </summary>
public sealed class LoadBatch
{
    public Guid LoadBatchId { get; set; } = Guid.NewGuid();

    public string SourceFamily { get; set; } = string.Empty;
    public string SourceSystem { get; set; } = string.Empty;
    public string SourceFileOrDatabase { get; set; } = string.Empty;
    public string? SourceQueryName { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string? RestoreSource { get; set; }

    public string Operator { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    /// <summary>'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL'.</summary>
    public string Status { get; set; } = "IN_PROGRESS";

    public string? ProofGateReportPath { get; set; }
    public long? RowsExtracted { get; set; }
    public long? RowsPromoted { get; set; }

    /// <summary>Sanitized error summary; no secrets.</summary>
    public string? ErrorSummary { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
