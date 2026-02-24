using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Security.PasswordHistory;
using TerraFusion.Data;
using TerraFusion.Data.Security;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Tests.Unit.Security.PasswordHistory;

/// <summary>
/// Phase 4 Sprint 1: SQL password history store tests (TDD - tests first)
/// Tests password history persistence and retrieval using in-memory SQLite
/// </summary>
public class SqlPasswordHistoryStoreTests : IAsyncLifetime
{
    private TerraFusionDbContext _context = null!;
    private SqlPasswordHistoryStore _store = null!;
    
    // Seeded test users (deterministic GUIDs for reproducibility)
    private static readonly Guid TestUserId1 = new Guid("11111111-1111-1111-1111-111111111111");
    private static readonly Guid TestUserId2 = new Guid("22222222-2222-2222-2222-222222222222");

    public async Task InitializeAsync()
    {
        // Use in-memory SQLite for tests
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;

        // Mock IConfiguration (required by TerraFusionDbContext constructor)
        var configMock = new Mock<IConfiguration>();
        
        _context = new TerraFusionDbContext(options, configMock.Object);
        await _context.Database.OpenConnectionAsync();
        await _context.Database.EnsureCreatedAsync();

        // Seed test users (satisfies FK constraint)
        var testUser1 = new GovernmentUser
        {
            Id = TestUserId1,
            Email = "testuser1@phase4.terrafusion.local",
            FirstName = "Test",
            LastName = "User1",
            Role = "Administrator",
            Department = "Security",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };
        
        var testUser2 = new GovernmentUser
        {
            Id = TestUserId2,
            Email = "testuser2@phase4.terrafusion.local",
            FirstName = "Test",
            LastName = "User2",
            Role = "User",
            Department = "Security",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };
        
        _context.GovernmentUsers.Add(testUser1);
        _context.GovernmentUsers.Add(testUser2);
        await _context.SaveChangesAsync();

        _store = new SqlPasswordHistoryStore(_context);
    }

    public async Task DisposeAsync()
    {
        await _context.Database.CloseConnectionAsync();
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task AddPasswordHashAsync_StoresHash()
    {
        // Arrange
        var userId = TestUserId1;
        var passwordHash = "hashed_password_1";

        // Act
        await _store.AddPasswordHashAsync(userId, passwordHash);

        // Assert
        var history = await _context.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .ToListAsync();
        
        Assert.Single(history);
        Assert.Equal(passwordHash, history[0].PasswordHash);
    }

    [Fact]
    public async Task GetRecentPasswordHashesAsync_ReturnsEmpty_WhenNoHistory()
    {
        // Arrange
        var userId = TestUserId2;

        // Act
        var hashes = await _store.GetRecentPasswordHashesAsync(userId, 5);

        // Assert
        Assert.Empty(hashes);
    }

    [Fact]
    public async Task GetRecentPasswordHashesAsync_ReturnsLast5_WhenMoreExist()
    {
        // Arrange
        var userId = TestUserId1;
        
        // Add 7 password hashes with delays to ensure CreatedAt differs
        for (int i = 1; i <= 7; i++)
        {
            await _store.AddPasswordHashAsync(userId, $"hash_{i}");
            await Task.Delay(10); // Ensure CreatedAt differs
        }

        // Act
        var hashes = await _store.GetRecentPasswordHashesAsync(userId, 5);

        // Assert
        Assert.Equal(5, hashes.Count);
        Assert.Equal("hash_7", hashes[0]); // Most recent first
        Assert.Equal("hash_6", hashes[1]);
        Assert.Equal("hash_5", hashes[2]);
        Assert.Equal("hash_4", hashes[3]);
        Assert.Equal("hash_3", hashes[4]);
    }

    [Fact]
    public async Task GetRecentPasswordHashesAsync_ReturnsInReverseChronologicalOrder()
    {
        // Arrange
        var userId = TestUserId1;
        
        // Add 3 password hashes
        await _store.AddPasswordHashAsync(userId, "oldest");
        await Task.Delay(10);
        await _store.AddPasswordHashAsync(userId, "middle");
        await Task.Delay(10);
        await _store.AddPasswordHashAsync(userId, "newest");

        // Act
        var hashes = await _store.GetRecentPasswordHashesAsync(userId, 5);

        // Assert
        Assert.Equal(3, hashes.Count);
        Assert.Equal("newest", hashes[0]);
        Assert.Equal("middle", hashes[1]);
        Assert.Equal("oldest", hashes[2]);
    }

    [Fact]
    public async Task IsHashInHistoryAsync_ReturnsFalse_WhenHashNotFound()
    {
        // Arrange
        var userId = TestUserId1;
        await _store.AddPasswordHashAsync(userId, "existing_hash");

        // Act
        var exists = await _store.IsHashInHistoryAsync(userId, "different_hash");

        // Assert
        Assert.False(exists);
    }

    [Fact]
    public async Task IsHashInHistoryAsync_ReturnsTrue_WhenHashExists()
    {
        // Arrange
        var userId = TestUserId1;
        var existingHash = "existing_hash";
        
        await _store.AddPasswordHashAsync(userId, existingHash);

        // Act
        var exists = await _store.IsHashInHistoryAsync(userId, existingHash);

        // Assert
        Assert.True(exists);
    }

    [Fact]
    public async Task IsHashInHistoryAsync_OnlyChecksLast5()
    {
        // Arrange
        var userId = TestUserId1;
        
        // Add 6 hashes
        await _store.AddPasswordHashAsync(userId, "hash_1_oldest");
        await Task.Delay(10);
        await _store.AddPasswordHashAsync(userId, "hash_2");
        await Task.Delay(10);
        await _store.AddPasswordHashAsync(userId, "hash_3");
        await Task.Delay(10);
        await _store.AddPasswordHashAsync(userId, "hash_4");
        await Task.Delay(10);
        await _store.AddPasswordHashAsync(userId, "hash_5");
        await Task.Delay(10);
        await _store.AddPasswordHashAsync(userId, "hash_6_newest");

        // Act - hash_1 should NOT be found (beyond last 5)
        var oldestExists = await _store.IsHashInHistoryAsync(userId, "hash_1_oldest");
        var recentExists = await _store.IsHashInHistoryAsync(userId, "hash_6_newest");

        // Assert
        Assert.False(oldestExists); // Beyond last 5
        Assert.True(recentExists);  // Within last 5
    }

    [Fact]
    public async Task PruneOldHistoryAsync_DeletesOldEntries()
    {
        // Arrange
        var userId = TestUserId1;
        
        // Add old entry (91 days ago) by directly inserting with past CreatedAt
        var oldEntry = new Core.Entities.PasswordHistory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PasswordHash = "old_hash",
            CreatedAt = DateTime.UtcNow.AddDays(-91)
        };
        _context.PasswordHistories.Add(oldEntry);
        await _context.SaveChangesAsync();
        
        // Add recent entry (10 days ago)
        var recentEntry = new Core.Entities.PasswordHistory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PasswordHash = "recent_hash",
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        _context.PasswordHistories.Add(recentEntry);
        await _context.SaveChangesAsync();

        // Act
        await _store.PruneOldHistoryAsync(90);

        // Assert
        var remaining = await _context.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .ToListAsync();
        
        Assert.Single(remaining);
        Assert.Equal("recent_hash", remaining[0].PasswordHash);
    }

    [Fact]
    public async Task PruneOldHistoryAsync_DefaultsTo90Days()
    {
        // Arrange
        var userId = TestUserId1;
        
        // Add entry 100 days ago
        var oldEntry = new Core.Entities.PasswordHistory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PasswordHash = "very_old_hash",
            CreatedAt = DateTime.UtcNow.AddDays(-100)
        };
        _context.PasswordHistories.Add(oldEntry);
        await _context.SaveChangesAsync();

        // Act (no parameter = default 90 days)
        await _store.PruneOldHistoryAsync();

        // Assert
        var remaining = await _context.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .ToListAsync();
        
        Assert.Empty(remaining); // Entry older than 90 days should be deleted
    }
}
