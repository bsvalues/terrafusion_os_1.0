using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.API.Security.Services;
using TerraFusion.Core.Entities;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Xunit;

namespace TerraFusion.Unit.Tests.Prometheus.T3;

[Trait("Category", "Security")]
[Trait("Component", "ProvisionedCredentialReadOnlyVerifier")]
public sealed class ProvisionedCredentialReadOnlyVerifierTests
{
    [Theory]
    [InlineData("CorrectPassword123!", true)]
    [InlineData("WrongPassword123!", false)]
    public async System.Threading.Tasks.Task Verification_IsReadOnly_ForValidAndInvalidCredentials(
        string suppliedPassword,
        bool expected)
    {
        await using var db = CreateDb();
        var lastLoginAt = new DateTime(2026, 8, 1, 12, 30, 0, DateTimeKind.Utc);
        var passwordHash = ProvisionedPasswordHasher.HashPassword("CorrectPassword123!");
        var user = new GovernmentUser
        {
            Id = Guid.NewGuid(),
            Email = "operator@terrafusionmarket.com",
            FirstName = "Protected",
            LastName = "Operator",
            Role = "GovernmentUser,Administrator",
            PasswordHash = passwordHash,
            Permissions = "[\"runtime:read\"]",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            LastLoginAt = lastLoginAt,
            IsActive = true
        };
        db.GovernmentUsers.Add(user);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        var sessionCount = await db.UserSessions.CountAsync();
        var auditCount = await db.AuditLogs.CountAsync();
        var passwordHistoryCount = await db.PasswordHistories.CountAsync();
        db.ChangeTracker.Clear();

        var verified = await ProvisionedPasswordHasher.VerifyPasswordReadOnlyAsync(
            db,
            "  OPERATOR@TERRAFUSIONMARKET.COM  ",
            suppliedPassword);

        verified.Should().Be(expected);
        db.ChangeTracker.Entries().Should().BeEmpty("verification must use no-tracking reads");
        (await db.UserSessions.CountAsync()).Should().Be(sessionCount);
        (await db.AuditLogs.CountAsync()).Should().Be(auditCount);
        (await db.PasswordHistories.CountAsync()).Should().Be(passwordHistoryCount);

        var persisted = await db.GovernmentUsers.AsNoTracking().SingleAsync();
        persisted.PasswordHash.Should().Be(passwordHash);
        persisted.LastLoginAt.Should().Be(lastLoginAt);
        persisted.Email.Should().Be("operator@terrafusionmarket.com");
        persisted.IsActive.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task Verification_RejectsInactiveOrMissingUsers_WithoutTracking()
    {
        await using var db = CreateDb();
        db.GovernmentUsers.Add(new GovernmentUser
        {
            Id = Guid.NewGuid(),
            Email = "inactive@terrafusionmarket.com",
            FirstName = "Inactive",
            LastName = "Operator",
            Role = "GovernmentUser",
            PasswordHash = ProvisionedPasswordHasher.HashPassword("CorrectPassword123!"),
            CreatedAt = DateTime.UtcNow,
            IsActive = false
        });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        (await ProvisionedPasswordHasher.VerifyPasswordReadOnlyAsync(
            db,
            "inactive@terrafusionmarket.com",
            "CorrectPassword123!")).Should().BeFalse();
        (await ProvisionedPasswordHasher.VerifyPasswordReadOnlyAsync(
            db,
            "missing@terrafusionmarket.com",
            "CorrectPassword123!")).Should().BeFalse();

        db.ChangeTracker.Entries().Should().BeEmpty();
    }

    private static DataDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase($"readonly-credential-verifier-{Guid.NewGuid():N}")
            .Options;
        return new DataDbContext(options, new ConfigurationBuilder().Build());
    }
}
