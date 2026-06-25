using System;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Abstractions.DTOs.Workbench;

namespace TerraFusion.Abstractions.Interfaces.Workbench;

/// <summary>
/// Slice OPS-1-A: read-only assembly contract for the Sync Readiness
/// Console DTO. Implemented by
/// <c>WorkbenchSyncReadinessService</c> which reads SyncAtlas
/// captured-artifact files from the operator-state artifact
/// directory and the four committed Benton baselines as fallback.
///
/// <para>HG3 read-only: implementations MUST NOT write to PACS,
/// TerraFusion DB, the workbook, or canonical landing. Only filesystem
/// reads of the artifact directory are authorized at this seam.</para>
///
/// <para>No secrets: implementations MUST NOT read secret values from
/// the environment or any config; the read path is artifact-files-
/// only. The connection-probe surface (question 1) is owned by a
/// separate contract; this service produces UNKNOWN for that panel
/// when no probe result is available.</para>
///
/// <para>No PII: implementations MUST sanitize any artifact-derived
/// content before populating the DTO. The OPS-1 hard-guard set is
/// enforced here, not at the controller seam.</para>
/// </summary>
public interface IWorkbenchSyncReadinessService
{
    /// <summary>
    /// Build the Sync Readiness DTO for the given county / source
    /// connection scope. Returns a populated DTO with each panel
    /// reflecting the most-recent captured artifact (or UNKNOWN
    /// status if no artifact exists).
    /// </summary>
    /// <param name="countyId">Required scope.</param>
    /// <param name="sourceConnectionId">Required scope.</param>
    /// <param name="workbookId">
    /// Optional workbook scope. When omitted, panel 5 (coverage)
    /// reads the most-recent coverage artifact regardless of
    /// workbook; the panel's Detail field surfaces which workbook
    /// the latest run used.
    /// </param>
    /// <param name="ct">Cancellation token.</param>
    Task<SyncReadinessDto> BuildAsync(
        Guid countyId,
        Guid sourceConnectionId,
        Guid? workbookId,
        CancellationToken ct);
}
