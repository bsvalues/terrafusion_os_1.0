using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Npgsql;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Security.PasswordHistory;
using TerraFusion.Data;
using TerraFusion.Data.Security;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Tests.Unit.Security.PasswordHistory;

/// <summary>
/// Phase 4 Sprint 1: SQL password history store tests.
///
/// <para>CI-HYGIENE-4B (#741) — switched from in-memory SQLite to a
/// schema-aware provider. Rationale:
/// <list type="bullet">
///   <item><see cref="TerraFusionDbContext"/>'s entity model declares
///   tables across multiple PostgreSQL schemas (e.g.
///   <c>truth_pacs.imprv_current</c> AND
///   <c>legacy_pacs_raw.imprv_current</c>). PostgreSQL respects the
///   schema prefix; SQLite has no schema concept and flattens both to
///   the same physical table name, which crashes
///   <c>EnsureCreatedAsync</c> with
///   <c>SQLite Error 1: 'table "imprv_current" already exists'</c>.</item>
///   <item>The CI workflow (<c>.github/workflows/dotnet-test.yml</c>)
///   already provisions a Postgres service container; this fixture
///   consumes it via the standard
///   <c>ConnectionStrings__DefaultConnection</c> environment variable
///   that the workflow sets on the test step.</item>
///   <item>For local developers without that env var the fixture
///   transparently falls back to the EF Core InMemory provider, which
///   bypasses the SQLite schema-flattening problem because it does not
///   physically create tables.</item>
/// </list>
/// </para>
/// </summary>
public class SqlPasswordHistoryStoreTests : IAsyncLifetime
{
    /// <summary>
    /// CI-side database name. Each test run delete-recreates this DB
    /// for isolation between test methods. The xunit class-internal
    /// runner is sequential by default, so within this class no two
    /// test methods race on the database.
    /// </summary>
    private const string PostgresTestDatabaseName = "pwhistory_test";

    private TerraFusionDbContext _context = null!;
    private SqlPasswordHistoryStore _store = null!;

    // Seeded test users (deterministic GUIDs for reproducibility)
    private static readonly Guid TestUserId1 = new Guid("11111111-1111-1111-1111-111111111111");
    private static readonly Guid TestUserId2 = new Guid("22222222-2222-2222-2222-222222222222");

    public async Task InitializeAsync()
    {
        var optionsBuilder = new DbContextOptionsBuilder<TerraFusionDbContext>();
        ConfigureProviderForCurrentEnvironment(optionsBuilder);

        // Mock IConfiguration (required by TerraFusionDbContext constructor).
        var configMock = new Mock<IConfiguration>();

        _context = new TerraFusionDbContext(optionsBuilder.Options, configMock.Object);

        // Reset state for both providers. On Postgres, EnsureDeletedAsync
        // drops the per-test database; EnsureCreatedAsync recreates it.
        // On InMemory, both are effectively no-ops scoped to the unique
        // database name (per-instance Guid).
        await _context.Database.EnsureDeletedAsync();
        await _context.Database.EnsureCreatedAsync();

        // Seed test users (satisfies FK constraint).
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
        await _context.DisposeAsync();
    }

    /// <summary>
    /// CI-HYGIENE-4B (#741): selects the EF Core provider based on the
    /// <c>ConnectionStrings__DefaultConnection</c> environment variable
    /// that the CI workflow sets.
    /// <list type="bullet">
    ///   <item>Empty / unset / literal <c>"InMemory"</c> → EF Core
    ///   InMemory provider (used by local developer runs without
    ///   Postgres). Each test instance gets a fresh database name, so
    ///   tests are isolated.</item>
    ///   <item>Anything else → treated as a Postgres connection string;
    ///   the database name is overridden to a fixed
    ///   <see cref="PostgresTestDatabaseName"/> so we can clean-and-
    ///   recreate it deterministically per test instance.</item>
    /// </list>
    /// </summary>
    private static void ConfigureProviderForCurrentEnvironment(
        DbContextOptionsBuilder<TerraFusionDbContext> optionsBuilder)
    {
        var connStr = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (string.IsNullOrWhiteSpace(connStr)
            || string.Equals(connStr, "InMemory", StringComparison.OrdinalIgnoreCase))
        {
            // Local fallback: EF Core InMemory. Does not physically create
            // tables, so bypasses the SQLite schema-flattening collision
            // entirely. Behavior under unit-test load is equivalent for
            // these tests because they exercise C# logic, not SQL semantics.
            optionsBuilder.UseInMemoryDatabase($"pwhistory-{Guid.NewGuid():N}");
            return;
        }

        // CI / Postgres-enabled local: use the workflow's Postgres
        // service container, scoped to a per-test database name.
        var npgsqlBuilder = new NpgsqlConnectionStringBuilder(connStr)
        {
            Database = PostgresTestDatabaseName,
        };
        optionsBuilder.UseNpgsql(npgsqlBuilder.ConnectionString);
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
