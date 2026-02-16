using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using TerraFusion.Security.Interfaces;

namespace TerraFusion.Security.Services;

/// <summary>
/// In-memory stub implementation of IPasswordHistoryRepository.
/// Production deployments should replace with a persistent store.
/// </summary>
public sealed class InMemoryPasswordHistoryRepository : IPasswordHistoryRepository
{
    private readonly ConcurrentDictionary<string, List<(string Hash, DateTime SavedAt)>> _store = new();
    private readonly ILogger<InMemoryPasswordHistoryRepository> _logger;

    public InMemoryPasswordHistoryRepository(ILogger<InMemoryPasswordHistoryRepository> logger)
    {
        _logger = logger;
    }

    public Task<IEnumerable<string>> GetRecentHashesAsync(string userId, int count)
    {
        if (_store.TryGetValue(userId, out var entries))
        {
            var hashes = entries
                .OrderByDescending(e => e.SavedAt)
                .Take(count)
                .Select(e => e.Hash);
            return Task.FromResult(hashes);
        }

        return Task.FromResult(Enumerable.Empty<string>());
    }

    public Task SaveAsync(string userId, string passwordHash, DateTime savedAt)
    {
        var entries = _store.GetOrAdd(userId, _ => new List<(string, DateTime)>());
        lock (entries)
        {
            entries.Add((passwordHash, savedAt));
        }

        _logger.LogDebug("Saved password history entry for user {UserId}", userId);
        return Task.CompletedTask;
    }
}
