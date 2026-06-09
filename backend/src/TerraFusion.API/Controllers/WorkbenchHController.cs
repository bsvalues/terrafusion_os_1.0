using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.API.Controllers;

/// <summary>
/// SYNC-WORKBENCH-H: evidence-packet export.
///
/// <para>Mirrors the Phase 4 / Phase 5 controller pattern: no
/// <c>[Authorize]</c>, no per-row CountyId filter, single-county-
/// per-deployment doctrine. All endpoints are read-only. The
/// service builds the ZIP / manifest in memory; nothing is written
/// to disk.</para>
///
/// <para>Endpoints:</para>
/// <list type="bullet">
///   <item><c>GET /api/sync/workbench/h/evidence/{commitId}.zip</c> —
///   stream the full evidence ZIP.</item>
///   <item><c>GET /api/sync/workbench/h/evidence/{commitId}/manifest</c> —
///   return only the <c>manifest.json</c> bytes for verification.</item>
/// </list>
///
/// <para>PR-2 (Prometheus T3): explicitly tagged <c>[AllowAnonymous]</c>.
/// Single-county-per-deployment doctrine; operator-driven via curl. The
/// global <c>FallbackPolicy.RequireAuthenticatedUser()</c> now requires
/// every controller to declare its auth posture; this controller's
/// "no [Authorize]" intent is now explicit instead of implicit.</para>
/// </summary>
[ApiController]
[Route("api/sync/workbench/h")]
[Authorize]
public sealed class WorkbenchHController : ControllerBase
{
    private const string ZipMediaType = "application/zip";
    private const string JsonMediaType = "application/json";

    private readonly IEvidencePacketService _service;
    private readonly ILogger<WorkbenchHController> _logger;

    public WorkbenchHController(
        IEvidencePacketService service,
        ILogger<WorkbenchHController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// <c>GET /api/sync/workbench/h/evidence/{commitId}.zip</c>
    /// </summary>
    [HttpGet("evidence/{commitId:guid}.zip")]
    public async Task<IActionResult> DownloadZip(
        [FromRoute] Guid commitId,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.BuildAsync(commitId, cancellationToken);

        return result.Outcome switch
        {
            EvidencePacketOutcome.Ok =>
                File(result.ZipContent!, ZipMediaType, result.FileName),
            EvidencePacketOutcome.NotFound =>
                NotFound(new { error = result.ErrorMessage }),
            EvidencePacketOutcome.ConfigurationError =>
                StatusCode(500, new { error = result.ErrorMessage }),
            _ =>
                StatusCode(500, new { error = result.ErrorMessage }),
        };
    }

    /// <summary>
    /// <c>GET /api/sync/workbench/h/evidence/{commitId}/manifest</c>
    /// </summary>
    [HttpGet("evidence/{commitId:guid}/manifest")]
    public async Task<IActionResult> GetManifest(
        [FromRoute] Guid commitId,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.BuildManifestAsync(commitId, cancellationToken);

        return result.Outcome switch
        {
            EvidencePacketOutcome.Ok =>
                File(result.ManifestJson!, JsonMediaType),
            EvidencePacketOutcome.NotFound =>
                NotFound(new { error = result.ErrorMessage }),
            EvidencePacketOutcome.ConfigurationError =>
                StatusCode(500, new { error = result.ErrorMessage }),
            _ =>
                StatusCode(500, new { error = result.ErrorMessage }),
        };
    }
}
