using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers;

[AllowAnonymous]
[ApiController]
[Route("health")]
public class SimpleHealthController : ControllerBase
{
    private readonly ILogger<SimpleHealthController> _logger;
    private readonly IHostApplicationLifetime _lifetime;

    public SimpleHealthController(
        ILogger<SimpleHealthController> logger,
        IHostApplicationLifetime lifetime)
    {
        _logger = logger;
        _lifetime = lifetime;
    }

    [HttpGet]
    public IActionResult Get()
    {
        _logger.LogInformation("Simple health check requested");

        // Prometheus PR-9 / HIGH #32: expose immutable artifact identity.
        // TF_GIT_SHA is stamped at docker build time via --build-arg GIT_SHA;
        // when running outside a container (or built without the arg) the
        // env var is unset and we return "unknown" so the response shape is
        // stable for clients.
        var gitSha = Environment.GetEnvironmentVariable("TF_GIT_SHA");
        if (string.IsNullOrWhiteSpace(gitSha))
        {
            gitSha = "unknown";
        }

        return Ok(new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            Version = "1.0.0",
            Service = "TerraFusion OS API - Basic Mode",
            GitSha = gitSha
        });
    }

    [HttpGet("ready")]
    public IActionResult Ready()
    {
        // Readiness truth (WO-BACKEND-004): report Ready only once the host has
        // fully started. While still initializing, return 503 NotReady so a load
        // balancer / orchestrator does not route traffic to an instance that is
        // not yet serving. Status and Message must never contradict each other —
        // the previous implementation returned Status="Ready" together with
        // Message="...is initializing", which was self-contradictory.
        if (_lifetime.ApplicationStarted.IsCancellationRequested)
        {
            return Ok(new
            {
                Status = "Ready",
                Timestamp = DateTime.UtcNow,
                Message = "TerraFusion OS is ready to serve requests"
            });
        }

        return StatusCode(StatusCodes.Status503ServiceUnavailable, new
        {
            Status = "NotReady",
            Timestamp = DateTime.UtcNow,
            Message = "TerraFusion OS is initializing"
        });
    }

    [HttpGet("live")]
    public IActionResult Live()
    {
        return Ok(new
        {
            Status = "Live",
            Timestamp = DateTime.UtcNow
        });
    }
}
