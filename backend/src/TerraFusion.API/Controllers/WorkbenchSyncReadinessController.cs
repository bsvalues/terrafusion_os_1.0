using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
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
    private readonly IPacsReachabilityProbeService _probe;
    private readonly IWorkbenchSyncReadinessRefreshRunner _refresh;
    private readonly IConfiguration _configuration;

    public WorkbenchSyncReadinessController(
        IWorkbenchSyncReadinessService service,
        IPacsReachabilityProbeService probe,
        IWorkbenchSyncReadinessRefreshRunner refresh,
        IConfiguration configuration)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _probe = probe ?? throw new ArgumentNullException(nameof(probe));
        _refresh = refresh ?? throw new ArgumentNullException(nameof(refresh));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
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

    /// <summary>
    /// POST /api/workbench/sync-readiness/refresh
    ///   ?countyId=&lt;guid&gt;
    ///   &amp;sourceConnectionId=&lt;guid&gt;
    ///   &amp;workbookId=&lt;guid&gt;
    ///
    /// Probes the PACS connection, runs the three SyncAtlas
    /// diagnostic invocations against an ephemeral session-scoped
    /// artifact directory, and returns a fresh readiness DTO whose
    /// reachability panel reflects the probe outcome and whose four
    /// artifact-derived panels reflect the just-captured artifacts.
    /// Per the BENTON-SYNC-6-C reconciliation, a failed sub-invocation
    /// surfaces in the per-panel status without altering the
    /// endpoint's primary 200 response.
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(SyncReadinessRefreshDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshReadiness(
        [FromQuery] Guid countyId,
        [FromQuery] Guid sourceConnectionId,
        [FromQuery] Guid workbookId,
        CancellationToken ct)
    {
        if (countyId == Guid.Empty)
            return BadRequest(new { error = "countyId is required." });
        if (sourceConnectionId == Guid.Empty)
            return BadRequest(new { error = "sourceConnectionId is required." });
        if (workbookId == Guid.Empty)
            return BadRequest(new { error = "workbookId is required." });

        // Connection probe (question 1).
        var probe = await _probe.ProbeAsync(countyId, sourceConnectionId, ct)
            .ConfigureAwait(false);

        // Ephemeral session artifact directory under the readiness
        // root (operator-state; never written to canonical baseline
        // dirs). The session id segment is a fresh GUID so concurrent
        // refreshes never overwrite each other.
        var artifactRoot = _configuration["Workbench:SyncReadiness:ArtifactRoot"]
            ?? Path.Combine("backend", "artifacts", "sync-atlas");
        var sessionDir = Path.Combine(
            artifactRoot,
            "ops-1-readiness",
            $"{DateTime.UtcNow:yyyyMMddTHHmmssZ}-{Guid.NewGuid():N}");

        // Refresh runner (questions 2-5).
        var refresh = await _refresh.RunAsync(
            countyId, sourceConnectionId, workbookId, sessionDir, ct)
            .ConfigureAwait(false);

        // Re-build the DTO from the just-captured artifacts. The
        // service's artifact root is the production layout; the
        // refresh wrote to the ephemeral layout, so we re-build
        // using a service instance pinned to the session dir.
        var sessionService = new TerraFusion.Sync.Workbench.Readiness
            .WorkbenchSyncReadinessService(_BuildSessionArtifactRoot(sessionDir));
        var dto = await sessionService
            .BuildAsync(countyId, sourceConnectionId, workbookId, ct)
            .ConfigureAwait(false);

        // Override the reachability panel with the probe outcome.
        dto.Reachability = new SyncReadinessPanelDto
        {
            Status = probe.Reachable
                ? SyncReadinessStatus.Yes
                : SyncReadinessStatus.No,
            Headline = probe.Reachable
                ? $"Connected to {probe.ServerLabel}/{probe.DatabaseLabel}"
                : $"Unreachable ({probe.ErrorCategory ?? "Unknown"})",
            Detail = $"Probed {probe.ProbedAtUtc:O}",
            CapturedAtUtc = probe.ProbedAtUtc,
            Source = "pacs-connection-probe",
        };

        return Ok(new SyncReadinessRefreshDto(
            Readiness: dto,
            SessionArtifactDir: refresh.SessionArtifactDir,
            StartedAtUtc: refresh.StartedAtUtc,
            CompletedAtUtc: refresh.CompletedAtUtc,
            Surfaces: refresh.Surfaces));
    }

    /// <summary>
    /// Build a synthetic artifact-root path that the read service can
    /// use to find the session-captured artifacts. The session dir
    /// flat-stores the three artifacts; we lay out the layout the
    /// read service expects by creating sentinel subdirectories that
    /// point at the session dir.
    /// </summary>
    private static string _BuildSessionArtifactRoot(string sessionDir)
    {
        // Layout the read service expects:
        //   <root>/benton-sync-3/<RUN_ID>/schema-catalog-health.stdout.txt
        //   <root>/benton-sync-5/<RUN_ID>/invariant-report.json
        //   <root>/benton-sync-6-c/<RUN_ID>/preflight-evidence.json
        //   <root>/benton-sync-7-c/<RUN_ID>/coverage-report.json
        //
        // The refresh runner currently flat-stores the three JSONs
        // directly under sessionDir. To bridge: create sentinel
        // subdirs whose RUN_ID is "session" and copy the artifacts
        // into them. This is operator-state, ephemeral, and lives
        // entirely under the session dir.
        var runId = "session";
        var bridge = Path.Combine(sessionDir, "_bridge");
        Directory.CreateDirectory(bridge);

        TryLink(sessionDir, "invariant-report.json",
            Path.Combine(bridge, "benton-sync-5", runId), "invariant-report.json");
        TryLink(sessionDir, "preflight-evidence.json",
            Path.Combine(bridge, "benton-sync-6-c", runId), "preflight-evidence.json");
        TryLink(sessionDir, "coverage-report.json",
            Path.Combine(bridge, "benton-sync-7-c", runId), "coverage-report.json");

        return bridge;
    }

    private static void TryLink(string srcDir, string srcFile, string destDir, string destFile)
    {
        try
        {
            var srcPath = Path.Combine(srcDir, srcFile);
            if (!System.IO.File.Exists(srcPath)) return;
            Directory.CreateDirectory(destDir);
            System.IO.File.Copy(srcPath, Path.Combine(destDir, destFile), overwrite: true);
        }
        catch
        {
            // Best-effort. Missing artifact surfaces as UNKNOWN panel.
        }
    }
}

/// <summary>
/// Slice OPS-1-A-2: refresh-endpoint response DTO. Carries the
/// fresh readiness state plus the session metadata so the frontend
/// can show the operator the run timestamps and the artifact
/// session id (useful for forensic follow-up).
/// </summary>
public sealed record SyncReadinessRefreshDto(
    SyncReadinessDto Readiness,
    string SessionArtifactDir,
    DateTime StartedAtUtc,
    DateTime CompletedAtUtc,
    System.Collections.Generic.IReadOnlyDictionary<string, WorkbenchSyncReadinessRefreshSurfaceResult> Surfaces);
