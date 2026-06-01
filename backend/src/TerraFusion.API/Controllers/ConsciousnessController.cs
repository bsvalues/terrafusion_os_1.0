using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Governed consciousness API boundary.
/// The historical consciousness manager behind this namespace is still synthetic,
/// so these endpoints must not present fake-success payloads as production truth.
/// </summary>
[ApiController]
[Route("api/ai/consciousness")]
[Authorize]
public class ConsciousnessController : ControllerBase
{
    private readonly ILogger<ConsciousnessController> _logger;

    public ConsciousnessController(ILogger<ConsciousnessController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public ActionResult GetConsciousnessData() => GovernedUnavailable("Consciousness data");

    [HttpGet("enhanced")]
    public ActionResult GetEnhancedConsciousnessData() => GovernedUnavailable("Enhanced consciousness data");

    [HttpPost("mode")]
    public ActionResult SwitchConsciousnessMode() => GovernedUnavailable("Consciousness mode switching");

    [HttpGet("system-status")]
    public ActionResult GetSystemStatus() => GovernedUnavailable("Consciousness system status");

    [HttpGet("status")]
    public ActionResult GetLegacyStatusAlias() => GovernedUnavailable("Consciousness system status");

    [HttpPost("initialize")]
    public ActionResult InitializeConsciousness() => GovernedUnavailable("Consciousness initialization");

    [HttpGet("health")]
    [AllowAnonymous]
    public ActionResult GetConsciousnessHealth()
    {
        return Ok(new
        {
            status = "unavailable",
            governedContractAvailable = false,
            providerConnected = false,
            reason = "The active consciousness manager remains synthetic and is not an approved runtime dependency.",
            timestamp = DateTime.UtcNow
        });
    }

    private ObjectResult GovernedUnavailable(string capability)
    {
        const string detail =
            "The active consciousness manager still relies on synthetic assumptions and is not an approved governed runtime dependency.";

        _logger.LogWarning("{Capability} requested but the governed consciousness contract is unavailable.", capability);

        return StatusCode(StatusCodes.Status501NotImplemented, new ProblemDetails
        {
            Title = "Governed consciousness surface unavailable",
            Detail = $"{capability} is unavailable. {detail}",
            Status = StatusCodes.Status501NotImplemented
        });
    }
}
