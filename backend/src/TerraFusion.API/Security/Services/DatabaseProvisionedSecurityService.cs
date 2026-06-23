using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Services;
using AuditLog = TerraFusion.Core.Entities.AuditLog;
using County = TerraFusion.Core.Entities.County;
using GovernmentUser = TerraFusion.Core.Entities.GovernmentUser;
using PasswordHistory = TerraFusion.Core.Entities.PasswordHistory;
using UserSession = TerraFusion.Core.Entities.UserSession;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Security.Services;

public sealed record ProvisionedUserAuthContext(
    Guid UserId,
    string Email,
    string[] Roles,
    string[] Permissions,
    Guid? CountyId,
    string? CountyName,
    string? CountyState,
    string? CountyFipsCode);

public interface IProvisionedUserContextProvider
{
    System.Threading.Tasks.Task<ProvisionedUserAuthContext?> GetProvisionedUserContextAsync(string email);
    System.Threading.Tasks.Task<bool> IsUserSessionValidAsync(Guid userId, string? sessionToken);
    System.Threading.Tasks.Task RecordUserSessionAsync(
        Guid userId,
        string sessionToken,
        string refreshToken,
        DateTime expiresAtUtc,
        string? ipAddress,
        string? userAgent);
}

public static class ProvisionedPasswordHasher
{
    private static readonly PasswordHasher<GovernmentUser> Hasher = new();

    public static string HashPassword(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        return Hasher.HashPassword(
            new GovernmentUser
            {
                Email = "provisioning@terrafusion.local",
                FirstName = "Provisioning",
                LastName = "Operator",
                Role = "GovernmentUser",
                CreatedAt = DateTime.UtcNow
            },
            password);
    }

    public static bool VerifyPassword(GovernmentUser user, string password)
    {
        if (string.IsNullOrWhiteSpace(user.PasswordHash) || string.IsNullOrEmpty(password))
        {
            return false;
        }

        var result = Hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }

    public static bool NeedsRehash(GovernmentUser user, string password)
    {
        if (string.IsNullOrWhiteSpace(user.PasswordHash) || string.IsNullOrEmpty(password))
        {
            return false;
        }

        return Hasher.VerifyHashedPassword(user, user.PasswordHash, password)
            == PasswordVerificationResult.SuccessRehashNeeded;
    }
}

public sealed class DatabaseProvisionedSecurityService : ISecurityService, IProvisionedUserContextProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly DataDbContext _db;
    private readonly ILogger<DatabaseProvisionedSecurityService> _logger;

    public DatabaseProvisionedSecurityService(
        DataDbContext db,
        ILogger<DatabaseProvisionedSecurityService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task<bool> IsValidGovernmentUserAsync(string email)
    {
        var normalized = NormalizeEmail(email);
        if (normalized is null)
        {
            return false;
        }

        return await _db.GovernmentUsers
            .AsNoTracking()
            .AnyAsync(user =>
                user.IsActive
                && user.PasswordHash != null
                && user.Email.ToLower() == normalized);
    }

    public async System.Threading.Tasks.Task LogSecurityEventAsync(string eventType, string description, string? details = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Type = $"SECURITY:{eventType}",
            Data = details,
            Timestamp = DateTime.UtcNow,
            Severity = eventType.Contains("FAILED", StringComparison.OrdinalIgnoreCase)
                || eventType.Contains("INVALID", StringComparison.OrdinalIgnoreCase)
                ? "Warning"
                : "Info",
            Source = "DatabaseProvisionedSecurityService"
        });

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist security audit event {EventType}", eventType);
        }
    }

    public async System.Threading.Tasks.Task<bool> ValidateUserCredentialsAsync(string email, string password)
    {
        var user = await FindActiveUserAsync(email);
        if (user is null || string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return false;
        }

        var valid = ProvisionedPasswordHasher.VerifyPassword(user, password);
        if (!valid)
        {
            await RecordFailedLoginAttemptAsync(email);
            return false;
        }

        if (ProvisionedPasswordHasher.NeedsRehash(user, password))
        {
            user.PasswordHash = ProvisionedPasswordHasher.HashPassword(password);
        }

        user.LastLoginAt = DateTime.UtcNow;
        await ResetFailedLoginAttemptsAsync(email);
        await _db.SaveChangesAsync();
        return true;
    }

    public async System.Threading.Tasks.Task<IEnumerable<string>> GetUserRolesAsync(string email)
    {
        var user = await FindActiveUserAsync(email);
        return user is null ? Array.Empty<string>() : ParseList(user.Role);
    }

    public System.Threading.Tasks.Task<bool> IsAccountLockedAsync(string email)
    {
        return System.Threading.Tasks.Task.FromResult(false);
    }

    public System.Threading.Tasks.Task RecordFailedLoginAttemptAsync(string email)
    {
        _logger.LogWarning("Failed provisioned login attempt for email hash {EmailHash}", NormalizeEmail(email)?.GetHashCode());
        return System.Threading.Tasks.Task.CompletedTask;
    }

    public System.Threading.Tasks.Task ResetFailedLoginAttemptsAsync(string email)
    {
        return System.Threading.Tasks.Task.CompletedTask;
    }

    public System.Threading.Tasks.Task<int> GetFailedLoginAttemptsAsync(string email)
    {
        return System.Threading.Tasks.Task.FromResult(0);
    }

    public System.Threading.Tasks.Task LockAccountAsync(string email, TimeSpan duration, string reason)
    {
        _logger.LogWarning("Provisioned account lock requested for email hash {EmailHash}: {Reason}", NormalizeEmail(email)?.GetHashCode(), reason);
        return System.Threading.Tasks.Task.CompletedTask;
    }

    public System.Threading.Tasks.Task UnlockAccountAsync(string email)
    {
        return System.Threading.Tasks.Task.CompletedTask;
    }

    public System.Threading.Tasks.Task<bool> IsIpAddressAllowedAsync(string ipAddress)
    {
        return System.Threading.Tasks.Task.FromResult(true);
    }

    public async System.Threading.Tasks.Task<bool> HasPermissionAsync(string userId, string permission)
    {
        var user = await FindUserByIdAsync(userId);
        return user is not null
            && ResolvePermissions(user).Contains(permission, StringComparer.OrdinalIgnoreCase);
    }

    public async System.Threading.Tasks.Task<bool> HasModuleAccessAsync(string userId, string moduleId)
    {
        var user = await FindUserByIdAsync(userId);
        if (user is null)
        {
            return false;
        }

        var expected = $"access:{moduleId}";
        return ResolvePermissions(user).Contains(expected, StringComparer.OrdinalIgnoreCase);
    }

    public async System.Threading.Tasks.Task<ProvisionedUserAuthContext?> GetProvisionedUserContextAsync(string email)
    {
        var user = await FindActiveUserAsync(email);
        if (user is null || string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return null;
        }

        County? county = null;
        if (user.CountyId.HasValue)
        {
            county = await _db.Counties
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == user.CountyId.Value);
        }

        return new ProvisionedUserAuthContext(
            user.Id,
            user.Email,
            ParseList(user.Role),
            ResolvePermissions(user),
            user.CountyId,
            county?.Name,
            county?.State,
            county?.FipsCode);
    }

    public async System.Threading.Tasks.Task RecordUserSessionAsync(
        Guid userId,
        string sessionToken,
        string refreshToken,
        DateTime expiresAtUtc,
        string? ipAddress,
        string? userAgent)
    {
        _db.UserSessions.Add(new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SessionToken = sessionToken,
            RefreshToken = refreshToken,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            ExpiresAt = expiresAtUtc,
            IsActive = true
        });

        await _db.SaveChangesAsync();
    }

    public System.Threading.Tasks.Task<bool> IsUserSessionValidAsync(Guid userId, string? sessionToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return System.Threading.Tasks.Task.FromResult(false);
        }

        return _db.UserSessions
            .AsNoTracking()
            .AnyAsync(session =>
                session.UserId == userId
                && session.SessionToken == sessionToken
                && session.IsActive
                && session.ExpiresAt > DateTime.UtcNow);
    }

    private System.Threading.Tasks.Task<GovernmentUser?> FindActiveUserAsync(string email)
    {
        var normalized = NormalizeEmail(email);
        if (normalized is null)
        {
            return System.Threading.Tasks.Task.FromResult<GovernmentUser?>(null);
        }

        return _db.GovernmentUsers
            .FirstOrDefaultAsync(user => user.IsActive && user.Email.ToLower() == normalized);
    }

    private System.Threading.Tasks.Task<GovernmentUser?> FindUserByIdAsync(string userId)
    {
        return Guid.TryParse(userId, out var parsed)
            ? _db.GovernmentUsers.FirstOrDefaultAsync(user => user.IsActive && user.Id == parsed)
            : System.Threading.Tasks.Task.FromResult<GovernmentUser?>(null);
    }

    private static string? NormalizeEmail(string email)
    {
        return string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
    }

    private static string[] ParseList(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return Array.Empty<string>();
        }

        if (raw.TrimStart().StartsWith("[", StringComparison.Ordinal))
        {
            try
            {
                return JsonSerializer.Deserialize<string[]>(raw, JsonOptions) ?? Array.Empty<string>();
            }
            catch (JsonException)
            {
                // Fall through to delimiter parsing.
            }
        }

        return raw
            .Split(new[] { ',', ';', '|' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string[] ResolvePermissions(GovernmentUser user)
    {
        return ParseList(user.Permissions);
    }
}
