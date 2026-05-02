using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.DTOs.Workbench;
using TerraFusion.Core.Interfaces.Workbench;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice OPS-1-A: Workbench Sync Readiness backend facade per the
/// OPS-1 policy at
/// <c>docs/workbench/sync-readiness-console-policy.md</c>.
///
/// <para>Read-only operator control surface that reads the four
/// SyncAtlas captured-artifact families and returns a sanitized
/// <see cref="SyncReadinessDto"/>. The frontend consumes the DTO
/// — it does NOT read the artifact filesystem directly.</para>
///
/// <para>Hard guards (per OPS-1):</para>
/// <list type="bullet">
/// <item>HG3 read-only — no writes to PACS, TerraFusion DB, the
/// workbook, or canonical landing.</item>
/// <item>No PII — DTO carries only sanitized counts / status / IDs.</item>
/// <item>No secrets — service does not read secret env vars.</item>
/// <item>County-scoped — both query parameters required.</item>
/// </list>
///
/// <para>The companion POST /refresh endpoint that invokes SyncAtlas
/// to capture fresh artifacts lands separately at slice OPS-1-A-2
/// (Process subprocess invocation has cross-platform path /
/// secret-passing concerns warranting its own slice).</para>
/// </summary>
[ApiController]
[Route("api/workbench/sync-readiness")]
public sealed class WorkbenchSyncReadinessController : ControllerBase
{
    private readonly IWorkbenchSyncReadinessService _service;

    public WorkbenchSyncReadinessController(IWorkbenchSyncReadinessService service)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }

    /// <summary>
    /// GET /api/workbench/sync-readiness
    ///   ?countyId=&lt;guid&gt;
    ///   &amp;sourceConnectionId=&lt;guid&gt;
    ///   [&amp;workbookId=&lt;guid&gt;]
    ///
    /// Returns the most-recent captured-artifact-derived readiness
    /// state for the given county / source connection scope.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(SyncReadinessDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetReadiness(
        [FromQuery] Guid countyId,
        [FromQuery] Guid sourceConnectionId,
        [FromQuery] Guid? workbookId,
        CancellationToken ct)
    {
        if (countyId == Guid.Empty)
        {
            return BadRequest(new { error = "countyId is required." });
        }
        if (sourceConnectionId == Guid.Empty)
        {
            return BadRequest(new { error = "sourceConnectionId is required." });
        }

        var dto = await _service.BuildAsync(countyId, sourceConnectionId, workbookId, ct)
            .ConfigureAwait(false);
        return Ok(dto);
    }
}
