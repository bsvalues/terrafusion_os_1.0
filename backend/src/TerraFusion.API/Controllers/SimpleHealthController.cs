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

        // Prometheus PR-9 / HIGH #32 + WO-BACKEND-005: expose immutable artifact
        // identity. Resolved from the env var (docker --build-arg GIT_SHA) OR the
        // commit stamped into the assembly at build time (SourceRevisionId, set
        // from GITHUB_SHA in CI), so a non-docker (zip) deploy is no longer stuck
        // reporting "unknown". Falls back to "unknown" only when neither exists.
        var informationalVersion = Assembly
            .GetExecutingAssembly()
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

    /// <summary>
    /// Resolves the deployed commit for the /health <c>gitSha</c> field, in
    /// priority order (WO-BACKEND-005):
    /// <list type="number">
    ///   <item><description><c>TF_GIT_SHA</c> env var (docker --build-arg GIT_SHA).</description></item>
    ///   <item><description>the commit stamped into the assembly
    ///     InformationalVersion at build time — the SDK appends
    ///     "+&lt;sha&gt;" when <c>SourceRevisionId</c> is set (CI sets it from
    ///     GITHUB_SHA), so a zip/non-docker deploy still carries its commit.</description></item>
    ///   <item><description>the literal "unknown" when neither is available.</description></item>
    /// </list>
    /// Pure and static so it is deterministically unit-testable without an
    /// ambient assembly or environment.
    /// </summary>
    public static string ResolveGitSha(string? envSha, string? informationalVersion)
    {
        if (!string.IsNullOrWhiteSpace(envSha))
        {
            return envSha;
        }

        if (!string.IsNullOrWhiteSpace(informationalVersion))
        {
            var plusIndex = informationalVersion.IndexOf('+');
            if (plusIndex >= 0 && plusIndex < informationalVersion.Length - 1)
            {
                return informationalVersion[(plusIndex + 1)..];
            }
        }

        return "unknown";
    }
}
