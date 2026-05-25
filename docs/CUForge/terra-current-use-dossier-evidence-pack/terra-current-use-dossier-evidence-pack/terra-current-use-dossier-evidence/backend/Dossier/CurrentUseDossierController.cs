using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Dossier;

[ApiController]
[Route("api/dossier/current-use")]
public sealed class CurrentUseDossierController : ControllerBase
{
    private readonly ICurrentUseDossierService _service;

    public CurrentUseDossierController(ICurrentUseDossierService service)
    {
        _service = service;
    }

    [HttpGet("parcels/{parcelId:guid}/evidence-packet")]
    public async Task<ActionResult<CurrentUseEvidencePacketDto>> GetEvidencePacket(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetEvidencePacketAsync(parcelId, cancellationToken));
    }

    [HttpPost("documents/link")]
    public async Task<ActionResult<CurrentUseDossierDocumentDto>> LinkDocument(
        [FromBody] LinkCurrentUseDocumentRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.LinkDocumentAsync(request, cancellationToken));
    }

    [HttpPatch("documents/{documentId:guid}/status")]
    public async Task<ActionResult<CurrentUseDossierDocumentDto>> UpdateDocumentStatus(
        Guid documentId,
        [FromBody] UpdateCurrentUseDocumentStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.UpdateDocumentStatusAsync(documentId, request, cancellationToken));
    }
}
