using System.Collections.Concurrent;
using TerraFusion.Security.Interfaces;
using TerraFusion.Security.Models;

namespace TerraFusion.Security.Services;

/// <summary>
/// Minimal in-memory implementations to satisfy production services until real persistence is wired.
/// </summary>
public class InMemoryUserRepository : IUserRepository
{
    private readonly ConcurrentDictionary<string, LockoutInfo> _lockouts = new();
    private readonly ConcurrentDictionary<string, ApplicationUser> _users = new();
    private readonly ConcurrentDictionary<string, List<string>> _roles = new();
    private readonly ConcurrentDictionary<string, List<string>> _permissions = new();

    public Task<LockoutInfo?> GetLockoutInfoAsync(string username)
    {
        _lockouts.TryGetValue(username, out var info);
        return Task.FromResult(info);
    }

    public Task<LockoutInfo> IncrementFailedLoginAsync(string username)
    {
        var info = _lockouts.AddOrUpdate(username,
            _ => new LockoutInfo { FailedAttempts = 1, LockedUntil = null },
            (_, existing) =>
            {
                existing.FailedAttempts += 1;
                return existing;
            });
        return Task.FromResult(info);
    }

    public Task ClearFailedLoginAsync(string username)
    {
        _lockouts.AddOrUpdate(username, _ => new LockoutInfo(), (_, existing) =>
        {
            existing.FailedAttempts = 0;
            return existing;
        });
        return Task.CompletedTask;
    }

    public Task SetLockoutAsync(string username, DateTime lockedUntil)
    {
        _lockouts.AddOrUpdate(username,
            _ => new LockoutInfo { FailedAttempts = _lockouts.GetValueOrDefault(username)?.FailedAttempts ?? 0, LockedUntil = lockedUntil },
            (_, existing) =>
            {
                existing.LockedUntil = lockedUntil;
                return existing;
            });
        return Task.CompletedTask;
    }

    public Task ClearLockoutAsync(string username)
    {
        _lockouts.TryRemove(username, out _);
        return Task.CompletedTask;
    }

    public Task<List<string>> GetUserRolesAsync(string userId)
    {
        return Task.FromResult(_roles.GetValueOrDefault(userId) ?? new List<string>());
    }

    public Task<List<string>> GetUserPermissionsAsync(string userId)
    {
        return Task.FromResult(_permissions.GetValueOrDefault(userId) ?? new List<string>());
    }

    public Task CreateAsync(ApplicationUser user)
    {
        _users[user.Username] = user;
        if (user.Roles != null)
        {
            _roles[user.Id] = user.Roles.ToList();
        }
        return Task.CompletedTask;
    }
}

public class InMemoryTokenRepository : ITokenRepository
{
    private readonly ConcurrentDictionary<string, bool> _revoked = new();
    private readonly ConcurrentDictionary<string, List<string>> _userTokens = new();

    public Task<bool> IsRevokedAsync(string jti)
    {
        return Task.FromResult(_revoked.ContainsKey(jti));
    }

    public Task RevokeByUserAsync(string userId)
    {
        if (_userTokens.TryGetValue(userId, out var tokens))
        {
            foreach (var token in tokens)
            {
                _revoked[token] = true;
            }
        }
        return Task.CompletedTask;
    }
}

public class InMemoryPasswordHistoryRepository : IPasswordHistoryRepository
{
    private readonly ConcurrentDictionary<string, List<(string Hash, DateTime SavedAt)>> _history = new();

    public Task<IEnumerable<string>> GetRecentHashesAsync(string userId, int count)
    {
        var hashes = _history.GetValueOrDefault(userId)?.OrderByDescending(h => h.SavedAt).Take(count).Select(h => h.Hash)
                     ?? Enumerable.Empty<string>();
        return Task.FromResult(hashes);
    }

    public Task SaveAsync(string userId, string passwordHash, DateTime savedAt)
    {
        var list = _history.GetOrAdd(userId, _ => new List<(string Hash, DateTime SavedAt)>());
        list.Add((passwordHash, savedAt));
        return Task.CompletedTask;
    }
}

public class CommonPasswordService : ICommonPasswordService
{
    // Minimal built-in list; replace with comprehensive list or service as needed.
    private static readonly HashSet<string> Common = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "123456", "qwerty", "letmein", "welcome"
    };

    public bool IsCommon(string password) => Common.Contains(password);
}
