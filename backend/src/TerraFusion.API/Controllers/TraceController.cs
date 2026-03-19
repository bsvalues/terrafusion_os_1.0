using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Contracts.Trace;
using TerraFusion.API.Services.Telemetry;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/trace")]
public sealed class TraceController : ControllerBase
{
    private readonly ITraceIngestionService _ingestion;
    private readonly ILogger<TraceController> _logger;

    public TraceController(ITraceIngestionService ingestion, ILogger<TraceController> logger)
    {
        _ingestion = ingestion;
        _logger = logger;
    }

    [HttpPost("events")]
    public ActionResult<TraceIngestionResponse> IngestEvent([FromBody] TraceEventDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CountyId))
            return BadRequest("CountyId is required");

        var seq = _ingestion.Ingest(dto);
        if (seq < 0)
            return BadRequest("Trace event rejected");

        _logger.LogInformation(
            "Trace event ingested: Action={Action} EntityType={EntityType} CorrelationId={CorrelationId}",
            dto.Action, dto.EntityType, HttpContext.TraceIdentifier);

        return Ok(new TraceIngestionResponse(Accepted: true, Seq: seq));
    }

    [HttpGet("events")]
    public ActionResult<TraceEventsPage> GetEvents(
        [FromQuery] int limit = 100,
        [FromQuery] string? after = null,
        [FromQuery] string? countyId = null)
    {
        var page = _ingestion.GetRecent(Math.Min(limit, 500), after);

        // County filter when countyId provided (production FISMA gate)
        if (!string.IsNullOrWhiteSpace(countyId))
        {
            var filtered = page.Events
                .Where(e => e.CountyId == countyId)
                .ToList();
            return Ok(page with { Events = filtered });
        }

        return Ok(page);
    }
}
