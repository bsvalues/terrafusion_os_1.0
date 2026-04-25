using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace TerraFusion.Consciousness.Authentication;

/// <summary>
/// Minimal auth shim for the consciousness microservice.
/// The current preview/runtime does not depend on an external identity provider,
/// but the authorized controllers still need a stable authenticated principal.
/// </summary>
public sealed class ConsciousnessAuthenticationHandler
    : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "ConsciousnessPreview";

    public ConsciousnessAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Request.Headers["X-TF-User-Id"].FirstOrDefault() ?? "consciousness-preview"),
            new Claim(ClaimTypes.Name, Request.Headers["X-TF-User-Name"].FirstOrDefault() ?? "Consciousness Preview"),
            new Claim(ClaimTypes.Role, Request.Headers["X-TF-Role"].FirstOrDefault() ?? "operator"),
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
