using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.API.Controllers;

/// <summary>
/// WORKBENCH-V0.3 SLICE-J: OS Shell Doctor Panel endpoints.
///
/// <para>
/// Surfaces two operations:
/// <list type="bullet">
///   <item><see cref="Run"/> — spawns tf-sync-doctor.mjs and returns raw stdout.</item>
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
/// </para>
///
/// <para>v0.3 bridge implementation — C# port deferred to v0.4+.</para>
/// </summary>
[ApiController]
[Route("api/sync/workbench/doctor")]
[AllowAnonymous]
public sealed class WorkbenchDoctorController : ControllerBase
{
    private readonly IDoctorRunnerService _service;

    public WorkbenchDoctorController(IDoctorRunnerService service)
    {
        _service = service;
    }

    /// <summary>
    /// Spawns <c>tf-sync-doctor.mjs</c> and returns the raw output.
    /// Returns HTTP 409 if a run is already in progress.
    /// </summary>
    /// <response code="200">Run completed. Check <c>exitCode</c>: 0=PASS/WARN · 1=FAIL · 2=error.</response>
    /// <response code="409">A run is already in progress.</response>
    [HttpPost("run")]
    [ProducesResponseType(200)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Run(CancellationToken ct)
    {
        DoctorRunResult result;
        try
        {
            result = await _service.RunAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error = $"Failed to start doctor process: {ex.Message}",
                exitCode = 2,
            });
        }

        if (result.RunningNow)
        {
            return Conflict(new
            {
                error = "Doctor is already running — please wait.",
            });
        }

        return Ok(new
        {
            exitCode = result.ExitCode,
            stdout = result.Stdout,
            stderr = result.Stderr,
            durationMs = result.DurationMs,
            timestamp = result.Timestamp.ToString("O"),
            runningNow = false,
        });
    }

    /// <summary>
    /// Returns whether a doctor run is currently in progress.
    /// Safe to poll; does not start a run.
    /// </summary>
    [HttpGet("status")]
    [ProducesResponseType(200)]
    public IActionResult Status()
    {
        return Ok(new { running = _service.IsRunning });
    }
}
