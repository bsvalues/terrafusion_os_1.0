using Microsoft.Extensions.Caching.Distributed;
using Moq;
using TerraFusion.Core.Security.Lockout;
using Xunit;

namespace TerraFusion.Tests.Unit.Security.Lockout;

/// <summary>
/// Phase 4 Sprint 1: Redis lockout store tests (TDD - tests first)
/// Tests account lockout state management using IDistributedCache
/// </summary>
public class RedisLockoutStoreTests
{
    private readonly Mock<IDistributedCache> _cacheMock;
    private readonly RedisLockoutStore _store;

    public RedisLockoutStoreTests()
    {
        _cacheMock = new Mock<IDistributedCache>();
        _store = new RedisLockoutStore(_cacheMock.Object);
    }

    [Fact]
    public async Task GetFailedAttemptsAsync_ReturnsZero_WhenNoState()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), default))
            .ReturnsAsync((byte[]?)null);

        // Act
        var attempts = await _store.GetFailedAttemptsAsync(userId);

        // Assert
        Assert.Equal(0, attempts);
    }

    [Fact]
    public async Task IncrementFailedAttemptsAsync_IncrementsFromZero()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), default))
            .ReturnsAsync((byte[]?)null);

        // Act
        var attempts = await _store.IncrementFailedAttemptsAsync(userId);

        // Assert
        Assert.Equal(1, attempts);
        _cacheMock.Verify(c => c.SetAsync(
            It.Is<string>(k => k.Contains(userId.ToString())),
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            default), Times.Once);
    }

    [Fact]
    public async Task IncrementFailedAttemptsAsync_IncrementsExistingCount()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var existingState = System.Text.Json.JsonSerializer.Serialize(new
        {
            FailedAttempts = 2,
            LastAttemptAt = DateTime.UtcNow
        });
        var existingBytes = System.Text.Encoding.UTF8.GetBytes(existingState);
        
        _cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), default))
            .ReturnsAsync(existingBytes);

        // Act
        var attempts = await _store.IncrementFailedAttemptsAsync(userId);

        // Assert
        Assert.Equal(3, attempts);
    }

    [Fact]
    public async Task ResetFailedAttemptsAsync_RemovesKey()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        await _store.ResetFailedAttemptsAsync(userId);

        // Assert
        _cacheMock.Verify(c => c.RemoveAsync(
            It.Is<string>(k => k.Contains(userId.ToString())),
            default), Times.Once);
    }

    [Fact]
    public async Task IsLockedOutAsync_ReturnsFalse_WhenNotLocked()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), default))
            .ReturnsAsync((byte[]?)null);

        // Act
        var isLocked = await _store.IsLockedOutAsync(userId);

        // Assert
        Assert.False(isLocked);
    }

    [Fact]
    public async Task IsLockedOutAsync_ReturnsFalse_WhenLockoutExpired()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expiredState = System.Text.Json.JsonSerializer.Serialize(new
        {
            FailedAttempts = 5,
            LockedUntil = DateTime.UtcNow.AddMinutes(-10) // Expired 10 minutes ago
        });
        var expiredBytes = System.Text.Encoding.UTF8.GetBytes(expiredState);
        
        _cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), default))
            .ReturnsAsync(expiredBytes);

        // Act
        var isLocked = await _store.IsLockedOutAsync(userId);

        // Assert
        Assert.False(isLocked);
    }

    [Fact]
    public async Task IsLockedOutAsync_ReturnsTrue_WhenLockedAndNotExpired()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var activeState = System.Text.Json.JsonSerializer.Serialize(new
        {
            FailedAttempts = 5,
            LockedUntil = DateTime.UtcNow.AddMinutes(15) // Expires in 15 minutes
        });
        var activeBytes = System.Text.Encoding.UTF8.GetBytes(activeState);
        
        _cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), default))
            .ReturnsAsync(activeBytes);

        // Act
        var isLocked = await _store.IsLockedOutAsync(userId);

        // Assert
        Assert.True(isLocked);
    }

    [Fact]
    public async Task SetLockoutAsync_StoresExpiryTimestamp()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expiresAt = DateTime.UtcNow.AddMinutes(30);
        _cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), default))
            .ReturnsAsync((byte[]?)null);

        // Act
        await _store.SetLockoutAsync(userId, expiresAt);

        // Assert
        _cacheMock.Verify(c => c.SetAsync(
            It.Is<string>(k => k.Contains(userId.ToString())),
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            default), Times.Once);
    }

    [Fact]
    public async Task GetLockoutExpiryAsync_ReturnsNull_WhenNoState()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), default))
            .ReturnsAsync((byte[]?)null);

        // Act
        var expiry = await _store.GetLockoutExpiryAsync(userId);

        // Assert
        Assert.Null(expiry);
    }

    [Fact]
    public async Task GetLockoutExpiryAsync_ReturnsTimestamp_WhenLocked()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expectedExpiry = DateTime.UtcNow.AddMinutes(15);
        var state = System.Text.Json.JsonSerializer.Serialize(new
        {
            FailedAttempts = 5,
            LockedUntil = expectedExpiry
        });
        var stateBytes = System.Text.Encoding.UTF8.GetBytes(state);
        
        _cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), default))
            .ReturnsAsync(stateBytes);

        // Act
        var expiry = await _store.GetLockoutExpiryAsync(userId);

        // Assert
        Assert.NotNull(expiry);
        Assert.True(Math.Abs((expiry.Value - expectedExpiry).TotalSeconds) < 1);
    }
}
