namespace TerraFusion.API.Security.Interfaces;

/// <summary>
/// LDAP / Active Directory integration interface.
/// Production: System.DirectoryServices.Protocols drop-in.
/// Development: In-memory stub with pre-seeded government accounts.
/// </summary>
public interface ILdapService
{
    Task<LdapAuthResult> AuthenticateAsync(string username, string password);
    Task<LdapUserInfo?> GetUserAsync(string username);
    Task<bool> IsUserInGroupAsync(string username, string groupName);
    Task<List<string>> GetUserGroupsAsync(string username);
}

public sealed class LdapAuthResult
{
    public bool Success { get; set; }
    public LdapUserInfo? User { get; set; }
    public List<string> Groups { get; set; } = new();
    public string? ErrorMessage { get; set; }

    public static LdapAuthResult SuccessResult(LdapUserInfo user, List<string> groups)
        => new() { Success = true, User = user, Groups = groups };

    public static LdapAuthResult FailureResult(string error)
        => new() { Success = false, ErrorMessage = error };
}

public sealed class LdapUserInfo
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public List<string> Groups { get; set; } = new();
}
