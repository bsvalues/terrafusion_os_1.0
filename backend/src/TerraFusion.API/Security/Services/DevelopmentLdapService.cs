using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Security.Interfaces;

namespace TerraFusion.API.Security.Services;

/// <summary>
/// Development LDAP stub with pre-seeded government accounts.
/// Production: replace with System.DirectoryServices.Protocols implementation.
/// </summary>
public sealed class DevelopmentLdapService : ILdapService
{
    private readonly ILogger<DevelopmentLdapService> _logger;
    private readonly ConcurrentDictionary<string, DevUser> _users;

    public DevelopmentLdapService(ILogger<DevelopmentLdapService> logger)
    {
        _logger = logger;
        _users = new ConcurrentDictionary<string, DevUser>(StringComparer.OrdinalIgnoreCase);
        SeedUsers();
    }

    public Task<LdapAuthResult> AuthenticateAsync(string username, string password)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("LDAP auth failed: credentials required");
            return Task.FromResult(LdapAuthResult.FailureResult("Credentials are required"));
        }

        if (!_users.TryGetValue(username, out var user))
        {
            _logger.LogWarning("LDAP auth failed: user {Username} not found", username);
            return Task.FromResult(LdapAuthResult.FailureResult("Invalid credentials"));
        }

        if (user.PasswordHash != HashPassword(password))
        {
            _logger.LogWarning("LDAP auth failed: invalid password for {Username}", username);
            return Task.FromResult(LdapAuthResult.FailureResult("Invalid credentials"));
        }

        _logger.LogInformation("LDAP auth success: {Username}", username);
        return Task.FromResult(LdapAuthResult.SuccessResult(ToUserInfo(user), user.Groups.ToList()));
    }

    public Task<LdapUserInfo?> GetUserAsync(string username)
    {
        if (_users.TryGetValue(username, out var user))
            return Task.FromResult<LdapUserInfo?>(ToUserInfo(user));

        return Task.FromResult<LdapUserInfo?>(null);
    }

    public Task<bool> IsUserInGroupAsync(string username, string groupName)
    {
        if (!_users.TryGetValue(username, out var user))
            return Task.FromResult(false);

        var result = user.Groups.Contains(groupName, StringComparer.OrdinalIgnoreCase);
        return Task.FromResult(result);
    }

    public Task<List<string>> GetUserGroupsAsync(string username)
    {
        if (!_users.TryGetValue(username, out var user))
            return Task.FromResult(new List<string>());

        return Task.FromResult(user.Groups.ToList());
    }

    // ── Helpers ─────────────────────────────────────────────────────

    public static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static LdapUserInfo ToUserInfo(DevUser user) => new()
    {
        Username = user.Username,
        Email = user.Email,
        DisplayName = user.DisplayName,
        Department = user.Department,
        County = user.County,
        Groups = user.Groups.ToList()
    };

    private void SeedUsers()
    {
        AddUser("admin", "admin123", "System Administrator", "admin@terrafusion.gov",
            "IT Administration", "Benton", "TF-Admins", "TF-Users", "Domain Admins");

        AddUser("assessor", "assess123", "County Assessor", "assessor@terrafusion.gov",
            "Assessment", "Benton", "TF-Assessors", "TF-Users");

        AddUser("auditor", "audit123", "County Auditor", "auditor@terrafusion.gov",
            "Audit", "Benton", "TF-Auditors", "TF-Users");

        AddUser("viewer", "view123", "Read-Only Viewer", "viewer@terrafusion.gov",
            "Public Access", "Benton", "TF-Users");

        _logger.LogInformation("Development LDAP seeded with {Count} users", _users.Count);
    }

    private void AddUser(string username, string password, string displayName,
        string email, string department, string county, params string[] groups)
    {
        _users[username] = new DevUser
        {
            Username = username,
            PasswordHash = HashPassword(password),
            DisplayName = displayName,
            Email = email,
            Department = department,
            County = county,
            Groups = groups.ToList()
        };
    }

    private sealed class DevUser
    {
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public List<string> Groups { get; set; } = new();
    }
}
