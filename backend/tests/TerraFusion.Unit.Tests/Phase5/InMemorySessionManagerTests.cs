using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Security.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase5;

[Trait("Phase", "5")]
[Trait("Component", "SessionManager")]
[Trait("Category", "Security")]
public sealed class InMemorySessionManagerTests
{
    private readonly InMemorySessionManager _sut;

    public InMemorySessionManagerTests()
    {
        _sut = new InMemorySessionManager(NullLogger<InMemorySessionManager>.Instance);
    }

    [Fact]
    public async Task CreateSessionAsync_ReturnsSessionWithRefreshToken()
    {
        var session = await _sut.CreateSessionAsync("user-1", "192.168.1.1", "TestBrowser");
        session.Should().NotBeNull();
        session.Id.Should().NotBeNullOrWhiteSpace();
        session.UserId.Should().Be("user-1");
        session.IpAddress.Should().Be("192.168.1.1");
        session.UserAgent.Should().Be("TestBrowser");
        session.RefreshToken.Should().NotBeNullOrWhiteSpace();
        session.IsActive.Should().BeTrue();
        session.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task IsSessionValidAsync_WithValidSession_ReturnsTrue()
    {
        var session = await _sut.CreateSessionAsync("user-2");
        var valid = await _sut.IsSessionValidAsync(session.Id);
        valid.Should().BeTrue();
    }

    [Fact]
    public async Task IsSessionValidAsync_WithNonexistentSession_ReturnsFalse()
    {
        var valid = await _sut.IsSessionValidAsync("nonexistent-id");
        valid.Should().BeFalse();
    }

    [Fact]
    public async Task InvalidateSessionAsync_MarksSessionInactive()
    {
        var session = await _sut.CreateSessionAsync("user-3");
        var result = await _sut.InvalidateSessionAsync(session.Id);
        var valid = await _sut.IsSessionValidAsync(session.Id);
        result.Should().BeTrue();
        valid.Should().BeFalse();
    }

    [Fact]
    public async Task InvalidateSessionAsync_WithNonexistentSession_ReturnsFalse()
    {
        var result = await _sut.InvalidateSessionAsync("nonexistent-id");
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ExtendSessionAsync_UpdatesExpiresAt()
    {
        var session = await _sut.CreateSessionAsync("user-4");
        await Task.Delay(10);
        var result = await _sut.ExtendSessionAsync(session.Id, TimeSpan.FromHours(1));
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExtendSessionAsync_WithInvalidSession_ReturnsFalse()
    {
        var result = await _sut.ExtendSessionAsync("nonexistent-id");
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetActiveSessionCountAsync_CountsOnlyActiveSessions()
    {
        await _sut.CreateSessionAsync("user-5");
        await _sut.CreateSessionAsync("user-5");
        var s3 = await _sut.CreateSessionAsync("user-5");
        await _sut.InvalidateSessionAsync(s3.Id);
        var count = await _sut.GetActiveSessionCountAsync("user-5");
        count.Should().Be(2);
    }

    [Fact]
    public async Task GetActiveSessionCountAsync_ForUnknownUser_ReturnsZero()
    {
        var count = await _sut.GetActiveSessionCountAsync("unknown-user");
        count.Should().Be(0);
    }

    [Fact]
    public async Task GetSessionByRefreshTokenAsync_ReturnsCorrectSession()
    {
        var session = await _sut.CreateSessionAsync("user-6");
        var found = await _sut.GetSessionByRefreshTokenAsync(session.RefreshToken);
        found.Should().NotBeNull();
        found!.Id.Should().Be(session.Id);
        found.UserId.Should().Be("user-6");
    }

    [Fact]
    public async Task GetSessionByRefreshTokenAsync_WithInvalidToken_ReturnsNull()
    {
        var found = await _sut.GetSessionByRefreshTokenAsync("invalid-token");
        found.Should().BeNull();
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_ReturnsNewToken()
    {
        var session = await _sut.CreateSessionAsync("user-7");
        var originalToken = session.RefreshToken;
        var newToken = await _sut.RotateRefreshTokenAsync(session.Id);
        newToken.Should().NotBeNullOrWhiteSpace();
        newToken.Should().NotBe(originalToken);
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_InvalidatesOldToken()
    {
        var session = await _sut.CreateSessionAsync("user-8");
        var originalToken = session.RefreshToken;
        await _sut.RotateRefreshTokenAsync(session.Id);
        var found = await _sut.GetSessionByRefreshTokenAsync(originalToken);
        found.Should().BeNull();
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_NewTokenIsUsable()
    {
        var session = await _sut.CreateSessionAsync("user-9");
        var newToken = await _sut.RotateRefreshTokenAsync(session.Id);
        var found = await _sut.GetSessionByRefreshTokenAsync(newToken);
        found.Should().NotBeNull();
        found!.Id.Should().Be(session.Id);
    }

    [Fact]
    public async Task InvalidateAllUserSessionsAsync_InvalidatesAll()
    {
        await _sut.CreateSessionAsync("user-10");
        await _sut.CreateSessionAsync("user-10");
        await _sut.CreateSessionAsync("user-10");
        await _sut.InvalidateAllUserSessionsAsync("user-10");
        var count = await _sut.GetActiveSessionCountAsync("user-10");
        count.Should().Be(0);
    }

    [Fact]
    public async Task InvalidateAllUserSessionsAsync_WithExcept_KeepsOne()
    {
        var s1 = await _sut.CreateSessionAsync("user-11");
        await _sut.CreateSessionAsync("user-11");
        await _sut.CreateSessionAsync("user-11");
        await _sut.InvalidateAllUserSessionsAsync("user-11", s1.Id);
        var count = await _sut.GetActiveSessionCountAsync("user-11");
        count.Should().Be(1);
        var valid = await _sut.IsSessionValidAsync(s1.Id);
        valid.Should().BeTrue();
    }

    [Fact]
    public async Task ConcurrentAccess_NoDataCorruption()
    {
        var tasks = Enumerable.Range(0, 50).Select(async i =>
        {
            var session = await _sut.CreateSessionAsync($"concurrent-user-{i % 5}");
            await _sut.IsSessionValidAsync(session.Id);
            await _sut.RotateRefreshTokenAsync(session.Id);
            return session;
        });
        var sessions = await Task.WhenAll(tasks);
        sessions.Should().HaveCount(50);
        sessions.All(s => s.Id != null).Should().BeTrue();
    }

    [Fact]
    public void GenerateRefreshToken_ProducesUniqueTokens()
    {
        var tokens = Enumerable.Range(0, 100)
            .Select(_ => InMemorySessionManager.GenerateRefreshToken())
            .ToList();
        tokens.Distinct().Count().Should().Be(100, "all tokens should be unique");
        tokens.All(t => t.Length > 50).Should().BeTrue("tokens should be sufficiently long");
    }
}
