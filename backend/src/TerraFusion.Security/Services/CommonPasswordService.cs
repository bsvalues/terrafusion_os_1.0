using Microsoft.Extensions.Logging;
using TerraFusion.Security.Interfaces;

namespace TerraFusion.Security.Services;

/// <summary>
/// Stub implementation of ICommonPasswordService.
/// Checks passwords against a minimal built-in blocklist.
/// </summary>
public sealed class CommonPasswordService : ICommonPasswordService
{
    private static readonly HashSet<string> BlockedPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "123456", "12345678", "qwerty", "abc123",
        "monkey", "1234567", "letmein", "trustno1", "dragon",
        "baseball", "iloveyou", "master", "sunshine", "ashley",
        "bailey", "passw0rd", "shadow", "123123", "654321",
        "superman", "qazwsx", "michael", "football", "password1",
        "password123", "admin", "welcome", "login", "changeme"
    };

    private readonly ILogger<CommonPasswordService> _logger;

    public CommonPasswordService(ILogger<CommonPasswordService> logger)
    {
        _logger = logger;
    }

    public bool IsCommon(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            return true;

        var isCommon = BlockedPasswords.Contains(password);
        if (isCommon)
        {
            _logger.LogWarning("Password rejected: matches common password blocklist");
        }

        return isCommon;
    }
}
