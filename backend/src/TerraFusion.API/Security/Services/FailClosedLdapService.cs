using Microsoft.Extensions.Logging;
using TerraFusion.API.Security.Interfaces;

namespace TerraFusion.API.Security.Services;

/// <summary>
/// PR-2 (Prometheus T3 #4): fail-closed <see cref="ILdapService"/> registered
/// in non-Development environments. Replaces the previous registration of
/// <see cref="DevelopmentLdapService"/> in production (which silently allowed
/// the hardcoded dev accounts to log in despite a comment claiming
/// "rejects all logins").
///
/// <para>Every method throws <see cref="NotImplementedException"/>. Any code
/// path that reaches LDAP in production must surface loudly until a real
/// AD / OAuth2-backed implementation is wired in.</para>
///
/// <para>This is intentionally stricter than the sibling
/// <see cref="RejectingLdapService"/> (which returns failure results). A
/// throw guarantees the caller's exception-handling path is exercised
/// instead of silently treating the absence of LDAP as a "user not found".</para>
/// </summary>
public sealed class FailClosedLdapService : ILdapService
{
    private const string NotConfigured =
        "Production LDAP not configured. Register a real ILdapService backed by AD or OAuth2.";

    private readonly ILogger<FailClosedLdapService> _logger;

    public FailClosedLdapService(ILogger<FailClosedLdapService> logger)
    {
        _logger = logger;
    }

    public Task<LdapAuthResult> AuthenticateAsync(string username, string password)
    {
        _logger.LogError("FailClosedLdapService.AuthenticateAsync invoked; refusing login.");
        throw new NotImplementedException(NotConfigured);
    }

    public Task<LdapUserInfo?> GetUserAsync(string username)
    {
        _logger.LogError("FailClosedLdapService.GetUserAsync invoked; refusing lookup.");
        throw new NotImplementedException(NotConfigured);
    }

    public Task<bool> IsUserInGroupAsync(string username, string groupName)
    {
        _logger.LogError("FailClosedLdapService.IsUserInGroupAsync invoked; refusing check.");
        throw new NotImplementedException(NotConfigured);
    }

    public Task<List<string>> GetUserGroupsAsync(string username)
    {
        _logger.LogError("FailClosedLdapService.GetUserGroupsAsync invoked; refusing lookup.");
        throw new NotImplementedException(NotConfigured);
    }
}
