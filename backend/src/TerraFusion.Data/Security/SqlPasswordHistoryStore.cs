using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Security.PasswordHistory;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Data.Security;

/// <summary>
/// Phase 4 Sprint 1: SQL-backed password history store
/// Implements IPasswordHistoryStore using TerraFusionDbContext
/// NIST 800-63B AC-2(7) password reuse prevention
/// </summary>
public class SqlPasswordHistoryStore : IPasswordHistoryStore
{
    private readonly TerraFusionDbContext _context;

    public SqlPasswordHistoryStore(TerraFusionDbContext context)
    {
        _context = context;
    }

    public async Task AddPasswordHashAsync(Guid userId, string passwordHash)
    {
        var entry = new Core.Entities.PasswordHistory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };

        _context.PasswordHistories.Add(entry);
        await _context.SaveChangesAsync();
    }

    public async Task<List<string>> GetRecentPasswordHashesAsync(Guid userId, int count = 5)
    {
        return await _context.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .OrderByDescending(ph => ph.CreatedAt)
            .Take(count)
            .Select(ph => ph.PasswordHash)
            .ToListAsync();
    }

    public async Task<bool> IsHashInHistoryAsync(Guid userId, string passwordHash)
    {
        // Note: This checks for exact hash match (for deduplication)
        // Password verification against hashes is done at service layer
        return await _context.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .OrderByDescending(ph => ph.CreatedAt)
            .Take(5) // Only check last 5
            .AnyAsync(ph => ph.PasswordHash == passwordHash);
    }

    public async Task PruneOldHistoryAsync(int retentionDays = 90)
    {
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);
        
        var oldEntries = await _context.PasswordHistories
            .Where(ph => ph.CreatedAt < cutoff)
            .ToListAsync();
        
        _context.PasswordHistories.RemoveRange(oldEntries);
        await _context.SaveChangesAsync();
    }
}
