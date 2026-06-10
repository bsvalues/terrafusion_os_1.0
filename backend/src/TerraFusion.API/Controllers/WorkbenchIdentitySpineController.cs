using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.API.Controllers;

/// <summary>
/// WORKBENCH-V0.3 SLICE-L: OS Shell Identity Spine Panel endpoints.
///
/// <para>
/// Surfaces two operations:
/// <list type="bullet">
///   <item><see cref="Run"/> — spawns identity-runner.mjs and returns raw pipe-delimited stdout.</item>
///   <item><see cref="Status"/> — returns whether a run is currently in progress.</item>
/// </list>
/// </para>
///
/// <para>
/// Auth: <see cref="AllowAnonymousAttribute"/> — single-county deployment, same as other
/// workbench controllers.
/// </para>
///
/// <para>
/// 409 guard: concurrent runs are rejected immediately without queuing.
/// FAIL result is a hard gate — the frontend shows a red blocking banner with no dismiss.
/// tf_parcel_owner_link FAIL is downgraded to WARN by the frontend (known deferred lane).
/// </para>
///
/// <para>v0.3 bridge implementation — C# port deferred to v0.4+.</para>
/// </summary>
[ApiController]
[Route("api/sync/workbench/identity-spine")]
[AllowAnonymous]
public sealed class WorkbenchIdentitySpineController : ControllerBase
{
    private readonly IIdentityRunnerService _service;

    public WorkbenchIdentitySpineController(IIdentityRunnerService service)
    {
        _service = service;
    }

    /// <summary>
    /// Spawns <c>identity-runner.mjs</c> and returns the raw pipe-delimited output.
    /// Returns HTTP 409 if a run is already in progress.
    /// </summary>
    /// <response code="200">Run completed. Parse stdout for PASS/WARN/FAIL verdict.</response>
    /// <response code="409">A run is already in progress.</response>
    [HttpPost("run")]
    [ProducesResponseType(200)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Run(CancellationToken ct)
    {
        IdentityRunResult result;
        try
        {
            result = await _service.RunAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error    = $"Failed to start identity runner process: {ex.Message}",
                exitCode = 2,
            });
        }

        if (result.RunningNow)
        {
            return Conflict(new
            {
                error = "Identity runner already running — please wait.",
            });
        }

        return Ok(new
        {
            exitCode   = result.ExitCode,
            stdout     = result.Stdout,
            stderr     = result.Stderr,
            durationMs = result.DurationMs,
            timestamp  = result.Timestamp.ToString("O"),
            runningNow = false,
        });
    }

    /// <summary>
    /// Returns whether an identity drift run is currently in progress.
    /// Safe to poll; does not start a run.
    /// </summary>
    [HttpGet("status")]
    [ProducesResponseType(200)]
    public IActionResult Status()
    {
        return Ok(new { running = _service.IsRunning });
    }
}
