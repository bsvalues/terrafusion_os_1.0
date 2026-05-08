using System;

namespace TerraFusion.Core.Entities.Workbench;

/// <summary>
/// SYNC-COMPLETE-2: per-lane result row inside a
/// <see cref="FullCorpusRun"/>.
///
/// <para>Six rows per run, one per lane (parcel, owner-wsdor,
/// improvement, land, sales, geometry). Pre-created in
/// <c>"Pending"</c> state at <see cref="FullCorpusRun"/> insertion;
/// transitioned to <c>"Running"</c> as the worker enters the lane
/// and to <c>"Completed"</c> | <c>"Failed"</c> | <c>"Skipped"</c>
/// when the lane returns. Carries the lane's batch ids and
/// counts/gate JSON exactly as the existing
/// <c>DoctrineDrainController</c> endpoints emit them.</para>
///
/// <para>Unique on <c>(RunId, Lane)</c> so each lane has at most
/// one result row per run. Audit fields auto-populated.</para>
/// </summary>
public sealed class FullCorpusLaneResult
{
    public Guid LaneResultId { get; set; } = Guid.NewGuid();

    /// <summary>FK to <see cref="FullCorpusRun.RunId"/>.</summary>
    public Guid RunId { get; set; }

    /// <summary>parcel | owner-wsdor | improvement | land | sales | geometry.</summary>
    public string Lane { get; set; } = string.Empty;

    /// <summary>Pending | Running | Completed | Failed | Skipped.</summary>
    public string Status { get; set; } = "Pending";

    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }

    /// <summary>JSON array of Guid batch ids produced by the lane.</summary>
    public string? BatchIdsJson { get; set; }

    /// <summary>JSON object of count metrics (rowsLanded, rowsPromotedToTruth, etc).</summary>
    public string? CountsJson { get; set; }

    /// <summary>JSON of per-gate pass/fail aggregation for the lane's batches.</summary>
    public string? GateSummaryJson { get; set; }

    /// <summary>JSON quarantine before/after/delta object.</summary>
    public string? QuarantineDeltaJson { get; set; }

    /// <summary>Lane error summary on <c>Status="Failed"</c>.</summary>
    public string? ErrorMessage { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
