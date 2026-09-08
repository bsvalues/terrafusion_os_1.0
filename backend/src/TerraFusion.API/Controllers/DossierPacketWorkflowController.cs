using System.Security.Claims;
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
public sealed class DossierPacketWorkflowController(DossierPacketWorkflowService service) : ControllerBase
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
            await service.FinalizeAsync(new(county, year, parcel, id), actor, new(request.RequestId, request.ExpectedRevision), ct));

    [HttpPost("packets/{id:guid}/prepare")]
    [RequiresPermission("write:dossier")]
    public Task<IActionResult> Prepare(Guid id, [FromBody] DossierPacketFinalizeRequest request) =>
        Execute(request.County, request.TaxYear, request.ParcelId, true, async (county, year, parcel, actor, ct) =>
            await service.PrepareAsync(new(county, year, parcel, id), actor, new(request.RequestId, request.ExpectedRevision), ct));

    [HttpPost("packets/{id:guid}/narrative")]
    [RequiresPermission("write:dossier")]
    public Task<IActionResult> SaveNarrative(Guid id, [FromBody] DossierPacketNarrativeRequest request) =>
        Execute(request.County, request.TaxYear, request.ParcelId, true, async (county, year, parcel, actor, ct) =>
            await service.SaveNarrativeAsync(new(county, year, parcel, id), actor, new(request.RequestId, request.ExpectedRevision, request.Content), ct));

    [HttpPost("packets/{id:guid}/revise")]
    [RequiresPermission("write:dossier")]
    public Task<IActionResult> Revise(Guid id, [FromBody] DossierPacketReviseRequest request) =>
        Execute(request.County, request.TaxYear, request.ParcelId, true, async (county, year, parcel, actor, ct) =>
            await service.ReviseAsync(new(county, year, parcel, id), actor, new(request.RequestId, request.ExpectedRevision, request.Reason), ct));

    private async Task<IActionResult> Execute(string? county, int? taxYear, string? parcelId, bool write,
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
