using System.Security.Claims;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.DTOs;
using TerraFusion.API.Security;
using TerraFusion.API.Services.Dossier;

namespace TerraFusion.API.Controllers;

[ApiController]
[Authorize]
[RequiresPermission("read:dossier")]
[RequiresPermission("read:dais")]
[Route("api/dossier/packet-workflow")]
public sealed class DossierPacketWorkflowController(DossierPacketWorkflowService service,
    ILogger<DossierPacketWorkflowController> logger, IHostEnvironment environment) : ControllerBase
{
    [HttpGet("packets")]
    public Task<IActionResult> ListPackets([FromQuery] string? county, [FromQuery] int? taxYear, [FromQuery] string? parcelId) =>
        Execute(county, taxYear, parcelId, false, async (id, year, parcel, _, ct) => await service.ListPacketsAsync(id, year, parcel, ct));

    [HttpGet("packets/{id:guid}")]
    public Task<IActionResult> GetPacket(Guid id, [FromQuery] string? county, [FromQuery] int? taxYear, [FromQuery] string? parcelId) =>
        Execute(county, taxYear, parcelId, false, async (countyId, year, parcel, actor, ct) => await service.GetPacketAsync(new(countyId, year, parcel, id), actor, ct));

    [HttpPost("packets/{id:guid}/finalize")]
    [RequiresPermission("write:dossier")]
    public Task<IActionResult> Finalize(Guid id, [FromBody] DossierPacketFinalizeRequest request) =>
        Execute(request.County, request.TaxYear, request.ParcelId, true, async (county, year, parcel, actor, ct) =>
            await service.FinalizeAsync(new(county, year, parcel, id), actor, new(request.RequestId, request.ExpectedRevision), ct), "finalize", request.RequestId);

    [HttpPost("packets/{id:guid}/prepare")]
    [RequiresPermission("write:dossier")]
    public Task<IActionResult> Prepare(Guid id, [FromBody] DossierPacketFinalizeRequest request) =>
        Execute(request.County, request.TaxYear, request.ParcelId, true, async (county, year, parcel, actor, ct) =>
            await service.PrepareAsync(new(county, year, parcel, id), actor, new(request.RequestId, request.ExpectedRevision), ct), "prepare", request.RequestId);

    [HttpPost("packets/{id:guid}/narrative")]
    [RequiresPermission("write:dossier")]
    public Task<IActionResult> SaveNarrative(Guid id, [FromBody] DossierPacketNarrativeRequest request) =>
        Execute(request.County, request.TaxYear, request.ParcelId, true, async (county, year, parcel, actor, ct) =>
            await service.SaveNarrativeAsync(new(county, year, parcel, id), actor, new(request.RequestId, request.ExpectedRevision, request.Content), ct), "narrative", request.RequestId);

    [HttpPost("packets/{id:guid}/revise")]
    [RequiresPermission("write:dossier")]
    public Task<IActionResult> Revise(Guid id, [FromBody] DossierPacketReviseRequest request) =>
        Execute(request.County, request.TaxYear, request.ParcelId, true, async (county, year, parcel, actor, ct) =>
            await service.ReviseAsync(new(county, year, parcel, id), actor, new(request.RequestId, request.ExpectedRevision, request.Reason), ct), "revise", request.RequestId);

    private static readonly Histogram<double> Duration = TerraFusion.Core.Observability.TelemetryConfiguration.Meter
        .CreateHistogram<double>("dossier.packet.duration", "ms", "API action through transaction outcome; excludes response serialization.");
    private static readonly Counter<long> Errors = TerraFusion.Core.Observability.TelemetryConfiguration.Meter
        .CreateCounter<long>("dossier.packet.errors", description: "Failed packet workflow API actions.");

    private static string TelemetryIdentity(string? value) => string.IsNullOrEmpty(value) ? "unavailable" :
        System.Text.RegularExpressions.Regex.IsMatch(value, "^[A-Za-z0-9._-]{1,128}$") ? value :
        "sha256-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

    private async Task<IActionResult> Execute(string? county, int? taxYear, string? parcelId, bool write,
        Func<Guid, int, string, string, CancellationToken, Task<object>> action, string? operation = null, string? requestId = null)
    {
        if (operation == null) return await ExecuteAuthorized(county, taxYear, parcelId, write, action);
        var started = Stopwatch.GetTimestamp();
        var status = 500;
        var cid = TelemetryIdentity(requestId ?? HttpContext.Items["CorrelationId"] as string);
        var actor = TelemetryIdentity(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"));
        var environmentName = TelemetryIdentity(environment.EnvironmentName);
        // Reuse the HTTP Activity; when instrumentation is absent, logs still cover every action.
        using var ownedActivity = Activity.Current == null ? new Activity("dossier.packet.action").Start() : null;
        var activity = Activity.Current;
        activity?.SetTag("correlation.id", cid);
        activity?.SetTag("enduser.id", actor);
        activity?.SetTag("dossier.operation", operation);
        activity?.SetTag("dossier.canonical.outcome", null);
        activity?.SetTag("dossier.canonical.duration_ms", null);
        try
        {
            var result = await ExecuteAuthorized(county, taxYear, parcelId, write, action);
            status = result switch { ObjectResult response => response.StatusCode ?? 200, StatusCodeResult response => response.StatusCode,
                ForbidResult => 403, ChallengeResult => 401, _ => 200 };
            return result;
        }
        finally
        {
            var elapsed = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
            var outcome = status < 400 ? "success" : "failure";
            var category = status < 400 ? "none" : $"http.{status}";
            var tags = new TagList { { "operation", operation }, { "outcome", outcome }, { "environment", environmentName } };
            Duration.Record(elapsed, tags);
            if (status >= 400) { tags.Add("error.category", category); Errors.Add(1, tags); }
            activity?.SetTag("dossier.outcome", outcome);
            activity?.SetStatus(status < 400 ? ActivityStatusCode.Ok : ActivityStatusCode.Error);
            // Allowlisted identifiers and scalar outcomes only: no exception, reason, evidence, narrative or token.
            logger.LogInformation("Dossier packet {Operation} {Outcome}; CID {CorrelationId}; actor {ActorId}; elapsedMs {ElapsedMs}; environment {Environment}; error {ErrorCategory}; canonical {CanonicalOutcome}; canonicalElapsedMs {CanonicalElapsedMs}",
                operation, outcome, cid, actor, elapsed, environmentName, category,
                activity?.GetTagItem("dossier.canonical.outcome") ?? "not-invoked", activity?.GetTagItem("dossier.canonical.duration_ms"));
        }
    }

    private async Task<IActionResult> ExecuteAuthorized(string? county, int? taxYear, string? parcelId, bool write,
        Func<Guid, int, string, string, CancellationToken, Task<object>> action)
    {
        if (User.Identity?.IsAuthenticated != true) return Unauthorized();
        var claims = User.FindAll("countyId").ToArray();
        var actor = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (claims.Length != 1 || !Canonical(claims[0].Value, out var scope) || string.IsNullOrWhiteSpace(actor) || actor.Length > 200 ||
            !User.HasClaim("perm", "read:dossier") || !User.HasClaim("perm", "read:dais") || (write && !User.HasClaim("perm", "write:dossier"))) return Forbid();
        if (!Canonical(county, out var requested) || !taxYear.HasValue || taxYear is < 1900 or > 2200 ||
            string.IsNullOrWhiteSpace(parcelId) || parcelId.Length > 50 || parcelId != parcelId.Trim())
            return BadRequest(new { code = "INVALID_SCOPE", error = "Explicit canonical county, taxYear and parcelId required." });
        if (requested != scope) return Forbid();
        try { return Ok(await action(scope, taxYear.Value, parcelId, actor, HttpContext.RequestAborted)); }
        catch (DossierWorkflowException ex) { return StatusCode(ex.StatusCode, new { code = ex.Code, error = ex.Message }); }
        catch (DbUpdateException) { return StatusCode(503, new { code = "STORAGE_UNAVAILABLE", error = "Retry with the same requestId; no success is asserted." }); }
    }
    private static bool Canonical(string? value, out Guid id) => Guid.TryParseExact(value, "D", out id) && id != Guid.Empty && value == id.ToString("D");
}
