using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Treasurer;

[ApiController]
[Route("api/treasurer/current-use")]
public sealed class CurrentUseTreasurerHandoffController : ControllerBase
{
    private readonly ICurrentUseTreasurerHandoffService _service;

    public CurrentUseTreasurerHandoffController(ICurrentUseTreasurerHandoffService service)
    {
        _service = service;
    }

    [HttpGet("parcels/{parcelId:guid}/payment-packets")]
    public async Task<ActionResult<IReadOnlyList<CurrentUsePaymentPacketDto>>> GetForParcel(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetPaymentPacketsForParcelAsync(parcelId, cancellationToken));
    }

    [HttpGet("payment-packets/{paymentPacketId:guid}")]
    public async Task<ActionResult<CurrentUsePaymentPacketDto>> Get(
        Guid paymentPacketId,
        CancellationToken cancellationToken)
    {
        var packet = await _service.GetPaymentPacketAsync(paymentPacketId, cancellationToken);
        return packet is null ? NotFound() : Ok(packet);
    }

    [HttpPost("payment-packets")]
    public async Task<ActionResult<CurrentUsePaymentPacketDto>> Create(
        [FromBody] CreateCurrentUsePaymentPacketDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.CreatePaymentPacketAsync(request, cancellationToken));
    }

    [HttpPost("payment-packets/{paymentPacketId:guid}/send")]
    public async Task<ActionResult<CurrentUsePaymentPacketDto>> Send(
        Guid paymentPacketId,
        [FromBody] SendCurrentUsePaymentPacketToTreasurerDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.SendToTreasurerAsync(paymentPacketId, request, cancellationToken));
    }

    [HttpPost("payment-packets/{paymentPacketId:guid}/mark-paid")]
    public async Task<ActionResult<CurrentUsePaymentPacketDto>> MarkPaid(
        Guid paymentPacketId,
        [FromBody] MarkCurrentUsePaymentPaidDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.MarkPaidAsync(paymentPacketId, request, cancellationToken));
    }
}
