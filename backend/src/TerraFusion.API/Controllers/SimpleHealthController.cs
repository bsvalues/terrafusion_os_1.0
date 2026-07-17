using System.Reflection;
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

        var informationalVersion = typeof(SimpleHealthController)
            .Assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion;
        var gitSha = ResolveGitSha(
            Environment.GetEnvironmentVariable("TF_GIT_SHA"),
            informationalVersion);

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

    internal static string ResolveGitSha(string? envSha, string? informationalVersion)
    {
        var normalizedEnvSha = envSha?.Trim();
        if (!string.IsNullOrWhiteSpace(normalizedEnvSha)
            && !string.Equals(normalizedEnvSha, "unknown", StringComparison.OrdinalIgnoreCase))
        {
            return normalizedEnvSha;
        }

        if (!string.IsNullOrWhiteSpace(informationalVersion))
        {
            var plusIndex = informationalVersion.IndexOf('+', StringComparison.Ordinal);
            if (plusIndex >= 0 && plusIndex < informationalVersion.Length - 1)
            {
                var stampedSha = informationalVersion[(plusIndex + 1)..].Trim();
                if (!string.IsNullOrWhiteSpace(stampedSha)
                    && !string.Equals(stampedSha, "unknown", StringComparison.OrdinalIgnoreCase))
                {
                    return stampedSha;
                }
            }
        }

        return "unknown";
    }
}
