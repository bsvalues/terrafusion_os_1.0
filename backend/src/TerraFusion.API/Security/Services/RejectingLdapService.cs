using TerraFusion.API.Security.Interfaces;

namespace TerraFusion.API.Security.Services;

/// <summary>
/// Production LDAP stub that rejects all authentication until a real
/// LDAP / Active Directory provider is wired in.
/// Fail-closed: all operations return failure so the system is secure
/// by default in non-Development environments without a real provider.
/// </summary>
public sealed class RejectingLdapService : ILdapService
{
    private const string Reason =
        "No LDAP/AD provider is configured for this environment. " +
        "Configure a real LDAP service or set ASPNETCORE_ENVIRONMENT=Development.";

    public Task<LdapAuthResult> AuthenticateAsync(string username, string password)
        => Task.FromResult(LdapAuthResult.FailureResult(Reason));

    public Task<LdapUserInfo?> GetUserAsync(string username)
        => Task.FromResult<LdapUserInfo?>(null);

    public Task<bool> IsUserInGroupAsync(string username, string groupName)
        => Task.FromResult(false);

    public Task<List<string>> GetUserGroupsAsync(string username)
        => Task.FromResult(new List<string>());
}
