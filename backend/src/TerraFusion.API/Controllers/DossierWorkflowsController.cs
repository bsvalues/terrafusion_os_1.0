using System.Security.Claims;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.DTOs;
using TerraFusion.API.Security;
using TerraFusion.API.Services.Dossier;

namespace TerraFusion.API.Controllers;

[ApiController]
[Authorize]
[Route("api/dossier/workflows")]
[RequiresPermission("read:dossier")]
[RequiresPermission("read:dais")]
public sealed class DossierWorkflowsController(DossierWorkflowService service, ILogger<DossierWorkflowsController> logger, IHostEnvironment environment) : ControllerBase
{
    [HttpGet("context")]
    public Task<IActionResult> Context([FromQuery] string? county, [FromQuery] int? taxYear, [FromQuery] string? parcelId) =>
        Execute(county, false, (id, _, ct) => service.Context(id, taxYear, parcelId, CanReadValuations(), ct));

    [HttpPost("drafts")]
    [RequiresPermission("write:dossier")]
    [RequiresPermission("access:costforge")]
    public Task<IActionResult> CreateDraft([FromBody] AssessmentDraftRequest request) =>
        Execute(request.County, true, (id, actor, ct) => service.CreateDraft(id, actor, request, ExecutionContext(), ct), valuation: true, operationName: "assessment_draft.create");

    [HttpGet("drafts/{id:guid}")]
    [RequiresPermission("access:costforge")]
    public Task<IActionResult> GetDraft(Guid id, [FromQuery] string? county) =>
        Execute(county, false, async (countyId, _, ct) => new ContentResult
            { Content = await service.GetDraft(countyId, id, ct), ContentType = "application/json; charset=utf-8", StatusCode = 200 }, valuation: true);

    [HttpPost("exports/equalization")]
    [RequiresPermission("write:dossier")]
    [RequiresPermission("access:costforge")]
    public Task<IActionResult> Equalization([FromBody] EqualizationExportRequest request) =>
        Execute(request.County, true, (id, actor, ct) => service.Equalization(id, actor, request, ExecutionContext(), ct), valuation: true, operationName: "export_equalization_package");

    [HttpPost("exports/audit")]
    [RequiresPermission("write:dossier")]
    public Task<IActionResult> Audit([FromBody] AuditBundleRequest request) =>
        Execute(request.County, true, (id, actor, ct) => service.Audit(id, actor, request, ExecutionContext(), ct), operationName: "export_audit_bundle");

    [HttpGet("receipts/{id:guid}")]
    public Task<IActionResult> GetReceipt(Guid id, [FromQuery] string? county) =>
        Execute(county, false, (countyId, _, ct) => service.GetReceipt(countyId, id, CanReadValuations(), ct));

    [HttpGet("exports/{id:guid}")]
    public Task<IActionResult> GetExport(Guid id, [FromQuery] string? county) =>
        Execute(county, false, (countyId, _, ct) => service.GetExport(countyId, id, CanReadValuations(), ct));

    [HttpGet("exports/{id:guid}/content")]
    public Task<IActionResult> GetContent(Guid id, [FromQuery] string? county) =>
        Execute(county, false, async (countyId, _, ct) => new ContentResult
            { Content = await service.Content(countyId, id, CanReadValuations(), ct), ContentType = "application/json; charset=utf-8", StatusCode = 200 });

    [HttpGet("morning-brief")]
    public Task<IActionResult> MorningBrief([FromQuery] string? county, [FromQuery] int taxYear, [FromQuery] string role) =>
        Execute(county, false, (id, _, ct) => service.MorningBrief(id, taxYear, role, ct));

    [HttpGet("appeals/{appealId:guid}/packet")]
    public Task<IActionResult> AppealPacket(Guid appealId, [FromQuery] string? county, [FromQuery] int taxYear, [FromQuery] string? parcelId) =>
        Execute(county, false, (id, _, ct) => service.AppealPacket(id, appealId, taxYear, parcelId, ct));

    private static readonly Histogram<double> Duration = TerraFusion.Core.Observability.TelemetryConfiguration.Meter
        .CreateHistogram<double>("dossier.workflow.duration", "ms", "API action duration through transaction outcome; excludes response serialization.");
    private static readonly Counter<long> Errors = TerraFusion.Core.Observability.TelemetryConfiguration.Meter
        .CreateCounter<long>("dossier.workflow.errors", description: "Failed Dossier workflow API actions.");

    private async Task<IActionResult> Execute(string? county, bool write, Func<Guid, string, CancellationToken, Task<object>> operation,
        bool valuation = false, string? operationName = null)
    {
        if (operationName == null) return await ExecuteAuthorized(county, write, operation, valuation);
        var status = 500;
        var cid = HttpContext.Items["CorrelationId"] as string;
        var actor = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        Activity.Current?.SetTag("correlation.id", cid);
        Activity.Current?.SetTag("enduser.id", actor);
        Activity.Current?.SetTag("dossier.operation", operationName);
        try
        {
            var result = await ExecuteAuthorized(county, write, operation, valuation);
            status = result switch { ObjectResult response => response.StatusCode ?? 200, StatusCodeResult response => response.StatusCode,
                ForbidResult => 403, ChallengeResult => 401, _ => 200 };
            return result;
        }
        finally
        {
            // Commit-inclusive outcome measurement is emitted only after the operation actually returns/throws.
            var elapsedMs = Stopwatch.GetElapsedTime(_startedTimestamp).TotalMilliseconds;
            var outcome = status < 400 ? "success" : "failure";
            var category = status < 400 ? "none" : $"http.{status}";
            var tags = new TagList { { "operation", operationName }, { "outcome", outcome }, { "environment", environment.EnvironmentName } };
            Duration.Record(elapsedMs, tags);
            if (status >= 400) { tags.Add("error.category", category); Errors.Add(1, tags); }
            Activity.Current?.SetTag("dossier.outcome", outcome);
            logger.LogInformation("Dossier workflow {Operation} {Outcome}; CID {CorrelationId}; actor {ActorId}; county {CountyId}; elapsedMs {ElapsedMs}; environment {Environment}; error {ErrorCategory}",
                operationName, outcome, cid, actor, User.FindFirstValue("countyId"), elapsedMs, environment.EnvironmentName, category);
        }
    }

    private async Task<IActionResult> ExecuteAuthorized(string? county, bool write, Func<Guid, string, CancellationToken, Task<object>> operation, bool valuation)
    {
        if (User.Identity?.IsAuthenticated != true) return Unauthorized();
        var claims = User.FindAll("countyId").ToArray();
        var actor = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (claims.Length != 1 || !Canonical(claims[0].Value, out var countyId) || string.IsNullOrWhiteSpace(actor) || actor.Length > 200)
            return Forbid();
        // Explicit claims are required here as the legacy permission handler also supports plugin headers.
        if (!User.HasClaim("perm", "read:dossier") || !User.HasClaim("perm", "read:dais") || (write && !User.HasClaim("perm", "write:dossier")))
            return Forbid();
        if (valuation && !CanReadValuations()) return Forbid();
        if (!Canonical(county, out var requested)) return BadRequest(new { code = "INVALID_COUNTY", error = "county must be a canonical GUID." });
        if (requested != countyId) return Forbid();
        try
        {
            var result = await operation(countyId, actor, HttpContext.RequestAborted);
            return result is IActionResult response ? response : Ok(result);
        }
        catch (DossierWorkflowException ex) { return StatusCode(ex.StatusCode, new { code = ex.Code, error = ex.Message }); }
        catch (DbUpdateException ex)
        {
            logger.LogWarning(ex, "Dossier workflow storage refused a write in county {CountyId}", countyId);
            return StatusCode(503, new { code = "STORAGE_UNAVAILABLE", error = "No completed result was committed. Retry with the same requestId." });
        }
    }

    private static bool Canonical(string? value, out Guid id) => Guid.TryParseExact(value, "D", out id) && id != Guid.Empty && value == id.ToString("D");

    private readonly DateTime _startedAt = DateTime.UtcNow;
    private readonly long _startedTimestamp = Stopwatch.GetTimestamp();
    private WorkflowExecutionContext ExecutionContext()
    {
        if (HttpContext.Items["CorrelationId"] is not string cid || string.IsNullOrWhiteSpace(cid))
            throw new DossierWorkflowException(500, "CORRELATION_CONTEXT_REQUIRED", "The API correlation middleware context is required.");
        return new(cid, _startedAt, _startedTimestamp, environment.EnvironmentName);
    }

    // Same claim name/comparison as PluginPermissionHandler; never accept its plugin-header fallback.
    private bool CanReadValuations() => User.Claims.Any(c => c.Type == "perm" &&
        string.Equals(c.Value, "access:costforge", StringComparison.OrdinalIgnoreCase));
}
