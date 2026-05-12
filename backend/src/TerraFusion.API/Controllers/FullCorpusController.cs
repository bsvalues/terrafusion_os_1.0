using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.Corpus;

namespace TerraFusion.API.Controllers;

/// <summary>
/// SYNC-COMPLETE-2: durable full-corpus sync runner endpoints.
///
/// <para>Mirrors the workbench controller pattern: explicitly tagged
/// <c>[AllowAnonymous]</c> (PR-2 / Prometheus T3 — the global
/// <c>FallbackPolicy.RequireAuthenticatedUser()</c> requires every
/// controller to declare its auth posture). Single-county-per-deployment
/// doctrine; operator-driven via curl. All state mutations go through
/// the orchestrator service (status transitions are the orchestrator's
/// responsibility, not the controller's).</para>
///
/// <para>Endpoints:</para>
/// <list type="bullet">
///   <item><c>POST /start</c> — enqueue a new full-corpus run.
///   Returns 202 with run id; the hosted worker picks it up.</item>
///   <item><c>POST /{runId}/resume</c> — flip a Failed | Interrupted
///   run to Queued so the worker resumes from
///   <c>NextLaneOnResume</c>.</item>
///   <item><c>GET /{runId}</c> — run + 6 lane results.</item>
///   <item><c>GET /{runId}/reconciliation</c> — run + 6 reconciliation
///   rows (empty array if not yet computed).</item>
///   <item><c>GET /{runId}/evidence.zip</c> — corpus-scope evidence
///   ZIP (HMAC-signed manifest + run.csv + lane-results.csv +
///   reconciliation.csv + gate-summaries.json).</item>
/// </list>
/// </summary>
[ApiController]
[Route("api/sync/corpus")]
[AllowAnonymous]
public sealed class FullCorpusController : ControllerBase
{
    private const string ZipMediaType = "application/zip";

    private readonly IFullCorpusOrchestrator _orchestrator;
    private readonly ICorpusEvidencePacketService _evidence;
    private readonly ILogger<FullCorpusController> _logger;

    public FullCorpusController(
        IFullCorpusOrchestrator orchestrator,
        ICorpusEvidencePacketService evidence,
        ILogger<FullCorpusController> logger)
    {
        _orchestrator = orchestrator;
        _evidence = evidence;
        _logger = logger;
    }

    /// <summary>
    /// <c>POST /api/sync/corpus/start</c>
    ///
    /// <para>Enqueue a new full-corpus run. Returns 202 with the
    /// new run id; the hosted worker picks it up within the next
    /// poll interval (5 seconds).</para>
    /// </summary>
    [HttpPost("start")]
    public async Task<IActionResult> Start(
        [FromBody] StartCorpusRequest? request,
        CancellationToken cancellationToken = default)
    {
        var operatorName = string.IsNullOrWhiteSpace(request?.OperatorName)
            ? "full-corpus-runner"
            : request!.OperatorName!.Trim();
        var workingYear = (short)(request?.WorkingYear ?? 2026);

        var result = await _orchestrator.StartAsync(operatorName, workingYear, cancellationToken)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[Corpus] Started run id={RunId} operator={Op} year={Year}",
            result.RunId, operatorName, workingYear);

        return Accepted(new
        {
            runId = result.RunId,
            status = result.Status,
        });
    }

    /// <summary>
    /// <c>POST /api/sync/corpus/{runId}/resume</c>
    ///
    /// <para>Returns 202 on success; 404 when the run does not exist;
    /// 409 when the run is not in a resumable state.</para>
    /// </summary>
    [HttpPost("{runId:guid}/resume")]
    public async Task<IActionResult> Resume(
        [FromRoute] Guid runId,
        CancellationToken cancellationToken = default)
    {
        var result = await _orchestrator.ResumeAsync(runId, cancellationToken)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            CorpusOutcome.Ok => Accepted(new { runId = result.RunId, status = result.Status }),
            CorpusOutcome.NotFound => NotFound(new { error = result.ErrorMessage }),
            CorpusOutcome.Conflict => Conflict(new
            {
                error = result.ErrorMessage,
                status = result.Status,
            }),
            _ => StatusCode(500, new { error = result.ErrorMessage }),
        };
    }

    /// <summary>
    /// <c>GET /api/sync/corpus/{runId}</c>
    /// </summary>
    [HttpGet("{runId:guid}")]
    public async Task<IActionResult> GetStatus(
        [FromRoute] Guid runId,
        CancellationToken cancellationToken = default)
    {
        var result = await _orchestrator.GetStatusAsync(runId, cancellationToken)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            CorpusOutcome.Ok => Ok(new
            {
                run = result.Run,
                lanes = result.Lanes,
            }),
            CorpusOutcome.NotFound => NotFound(new { error = result.ErrorMessage }),
            _ => StatusCode(500, new { error = result.ErrorMessage }),
        };
    }

    /// <summary>
    /// <c>GET /api/sync/corpus/{runId}/reconciliation</c>
    /// </summary>
    [HttpGet("{runId:guid}/reconciliation")]
    public async Task<IActionResult> GetReconciliation(
        [FromRoute] Guid runId,
        CancellationToken cancellationToken = default)
    {
        var result = await _orchestrator.GetReconciliationAsync(runId, cancellationToken)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            CorpusOutcome.Ok => Ok(new
            {
                run = result.Run,
                reconciliations = result.Reconciliations,
            }),
            CorpusOutcome.NotFound => NotFound(new { error = result.ErrorMessage }),
            _ => StatusCode(500, new { error = result.ErrorMessage }),
        };
    }

    /// <summary>
    /// <c>GET /api/sync/corpus/{runId}/evidence.zip</c>
    /// </summary>
    [HttpGet("{runId:guid}/evidence.zip")]
    public async Task<IActionResult> GetEvidence(
        [FromRoute] Guid runId,
        CancellationToken cancellationToken = default)
    {
        var result = await _evidence.BuildAsync(runId, cancellationToken)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            CorpusEvidencePacketOutcome.Ok =>
                File(result.ZipContent!, ZipMediaType, result.FileName),
            CorpusEvidencePacketOutcome.NotFound =>
                NotFound(new { error = result.ErrorMessage }),
            CorpusEvidencePacketOutcome.ConfigurationError =>
                StatusCode(500, new { error = result.ErrorMessage }),
            _ => StatusCode(500, new { error = result.ErrorMessage }),
        };
    }

    public sealed record StartCorpusRequest(string? OperatorName, int? WorkingYear);
}
