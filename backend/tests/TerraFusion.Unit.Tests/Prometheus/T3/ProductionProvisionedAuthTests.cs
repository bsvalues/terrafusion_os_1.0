using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.API.Controllers;
using TerraFusion.API.Security;
using TerraFusion.API.Security.Services;
using TerraFusion.API.Services;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Services;
using County = TerraFusion.Core.Entities.County;
using GovernmentUser = TerraFusion.Core.Entities.GovernmentUser;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Xunit;

namespace TerraFusion.Unit.Tests.Prometheus.T3;

[Trait("Category", "Security")]
[Trait("Component", "ProductionProvisionedAuth")]
[Trait("Slice", "production-provisioned-auth-db-backed")]
public sealed class ProductionProvisionedAuthTests
{
    [Fact]
    public async System.Threading.Tasks.Task ProvisionedDatabaseLogin_UsesHashedPasswordAndPersistsUserSession()
    {
        using var db = CreateDb();
        var countyId = Guid.NewGuid();
        db.Counties.Add(new County
        {
            Id = countyId,
            Name = "Benton",
            State = "WA",
            FipsCode = "53005"
        });

        var user = new GovernmentUser
        {
            Id = Guid.NewGuid(),
            Email = "operator@terrafusionmarket.com",
            FirstName = "Pilot",
            LastName = "Operator",
            Role = "GovernmentUser,Administrator",
            PasswordHash = ProvisionedPasswordHasher.HashPassword("CorrectPassword123!"),
            Permissions = JsonSerializer.Serialize(new[] { "read:parcel", "ecosystem:view" }),
            CountyId = countyId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        db.GovernmentUsers.Add(user);
        await db.SaveChangesAsync();

        var security = CreateSecurity(db);
        var auth = CreateAuthService();
        var controller = new AuthController(
            auth,
            security,
            security,
            NullLogger<AuthController>.Instance);

        var result = await controller.Login(new LoginRequest
        {
            Email = "operator@terrafusionmarket.com",
            Password = "CorrectPassword123!"
        });

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = ok.Value.Should().BeOfType<LoginResponse>().Subject;
        response.RefreshToken.Should().NotBeNullOrWhiteSpace();
        response.Roles.Should().BeEquivalentTo("GovernmentUser", "Administrator");

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(response.Token);
        ClaimValue(jwt, ClaimTypes.NameIdentifier, "nameid", "sub").Should().Be(user.Id.ToString());
        ClaimValue(jwt, ClaimTypes.Email, "email").Should().Be("operator@terrafusionmarket.com");
        jwt.Claims.Where(c => c.Type == ClaimTypes.Role || c.Type == "role").Select(c => c.Value)
            .Should().BeEquivalentTo("GovernmentUser", "Administrator");
        jwt.Claims.Single(c => c.Type == "countyId").Value.Should().Be(countyId.ToString());
        jwt.Claims.Single(c => c.Type == "countyName").Value.Should().Be("Benton");
        jwt.Claims.Single(c => c.Type == "countyState").Value.Should().Be("WA");
        jwt.Claims.Single(c => c.Type == "countyFipsCode").Value.Should().Be("53005");
        jwt.Claims.Where(c => c.Type == "perm").Select(c => c.Value)
            .Should().BeEquivalentTo("read:parcel", "ecosystem:view");

        db.UserSessions.Should().ContainSingle(session =>
            session.UserId == user.Id
            && session.RefreshToken == response.RefreshToken
            && session.IsActive);
        db.GovernmentUsers.Single(x => x.Id == user.Id).LastLoginAt.Should().BeAfter(DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async System.Threading.Tasks.Task ProvisionedDatabaseLogin_DoesNotRequireDistributedCacheAvailability()
    {
        using var db = CreateDb();
        var user = new GovernmentUser
        {
            Id = Guid.NewGuid(),
            Email = "operator@terrafusionmarket.com",
            FirstName = "Pilot",
            LastName = "Operator",
            Role = "GovernmentUser",
            PasswordHash = ProvisionedPasswordHasher.HashPassword("CorrectPassword123!"),
            Permissions = JsonSerializer.Serialize(new[] { "read:parcel" }),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        db.GovernmentUsers.Add(user);
        await db.SaveChangesAsync();

        var security = CreateSecurity(db);
        var controller = new AuthController(
            CreateAuthService(new FailingDistributedCache()),
            security,
            security,
            NullLogger<AuthController>.Instance);

        var result = await controller.Login(new LoginRequest
        {
            Email = "operator@terrafusionmarket.com",
            Password = "CorrectPassword123!"
        });

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = ok.Value.Should().BeOfType<LoginResponse>().Subject;
        response.Token.Should().NotBeNullOrWhiteSpace();
        response.RefreshToken.Should().NotBeNullOrWhiteSpace();
        db.UserSessions.Should().ContainSingle(session =>
            session.UserId == user.Id
            && session.RefreshToken == response.RefreshToken
            && session.IsActive);
    }

    [Fact]
    public async System.Threading.Tasks.Task Login_UnknownProvisionedAccount_ReturnsAccountNotProvisioned()
    {
        using var db = CreateDb();
        var security = CreateSecurity(db);
        var controller = new AuthController(
            CreateAuthService(),
            security,
            security,
            NullLogger<AuthController>.Instance);

        var result = await controller.Login(new LoginRequest
        {
            Email = "unknown@terrafusionmarket.com",
            Password = "DoesNotMatter123!"
        });

        var unauthorized = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorized.Value.Should().BeEquivalentTo(new { message = "Account not provisioned" });
    }

    [Fact]
    public async System.Threading.Tasks.Task Login_BadPasswordForProvisionedAccount_ReturnsInvalidCredentials()
    {
        using var db = CreateDb();
        db.GovernmentUsers.Add(new GovernmentUser
        {
            Id = Guid.NewGuid(),
            Email = "operator@terrafusionmarket.com",
            FirstName = "Pilot",
            LastName = "Operator",
            Role = "GovernmentUser",
            PasswordHash = ProvisionedPasswordHasher.HashPassword("CorrectPassword123!"),
            Permissions = JsonSerializer.Serialize(new[] { "read:parcel" }),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        });
        await db.SaveChangesAsync();

        var security = CreateSecurity(db);
        var controller = new AuthController(
            CreateAuthService(),
            security,
            security,
            NullLogger<AuthController>.Instance);

        var result = await controller.Login(new LoginRequest
        {
            Email = "operator@terrafusionmarket.com",
            Password = "WrongPassword123!"
        });

        var unauthorized = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorized.Value.Should().BeEquivalentTo(new { message = "Invalid credentials" });
    }

    [Fact]
    public void AccessPolicy_HasNoPublicSignupOrEmailRequestCta()
    {
        var security = CreateSecurity(CreateDb());
        var controller = new AuthController(
            CreateAuthService(),
            security,
            security,
            NullLogger<AuthController>.Instance);

        var result = controller.GetAccessPolicy();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new
        {
            signupMode = "provisioned_access_only",
            publicSignupEnabled = false,
            message = "TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled."
        });
        JsonSerializer.Serialize(ok.Value).Should().NotContain("mailto");
    }

    [Fact]
    public async System.Threading.Tasks.Task Profile_EchoesProvisionedOperatorIdentityAndSessionValidity()
    {
        using var db = CreateDb();
        var countyId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        const string sessionToken = "live-session-token";

        db.Counties.Add(new County
        {
            Id = countyId,
            Name = "Benton",
            State = "WA",
            FipsCode = "53005"
        });
        db.GovernmentUsers.Add(new GovernmentUser
        {
            Id = userId,
            Email = "operator@terrafusionmarket.com",
            FirstName = "Pilot",
            LastName = "Operator",
            Role = "GovernmentUser,Administrator",
            PasswordHash = ProvisionedPasswordHasher.HashPassword("CorrectPassword123!"),
            Permissions = JsonSerializer.Serialize(new[] { "runtime:read", "county:read", "workbench:access" }),
            CountyId = countyId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        });
        db.UserSessions.Add(new TerraFusion.Core.Entities.UserSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SessionToken = sessionToken,
            RefreshToken = "refresh-token",
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            LastActivityAt = DateTime.UtcNow,
            IsActive = true
        });
        await db.SaveChangesAsync();

        var security = CreateSecurity(db);
        var controller = new AuthController(
            CreateAuthService(),
            security,
            security,
            NullLogger<AuthController>.Instance);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Email, "operator@terrafusionmarket.com"),
                    new Claim(ClaimTypes.Role, "GovernmentUser"),
                    new Claim(ClaimTypes.Role, "Administrator"),
                    new Claim("perm", "runtime:read"),
                    new Claim("perm", "county:read"),
                    new Claim("perm", "workbench:access"),
                    new Claim("countyId", countyId.ToString()),
                    new Claim("countyName", "Benton"),
                    new Claim("countyState", "WA"),
                    new Claim("countyFipsCode", "53005")
                }, "Bearer"))
            }
        };
        controller.ControllerContext.HttpContext.Request.Headers.Authorization = $"Bearer {sessionToken}";

        var result = await controller.GetProfile();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var json = JsonSerializer.Serialize(ok.Value);
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;

        root.GetProperty("UserId").GetString().Should().Be(userId.ToString());
        root.GetProperty("Email").GetString().Should().Be("operator@terrafusionmarket.com");
        root.GetProperty("Roles").EnumerateArray().Select(item => item.GetString())
            .Should().BeEquivalentTo("GovernmentUser", "Administrator");
        root.GetProperty("Permissions").EnumerateArray().Select(item => item.GetString())
            .Should().BeEquivalentTo("runtime:read", "county:read", "workbench:access");
        root.GetProperty("CountyId").GetString().Should().Be(countyId.ToString());
        root.GetProperty("CountyFipsCode").GetString().Should().Be("53005");
        root.GetProperty("State").GetString().Should().Be("WA");
        root.GetProperty("SessionValid").GetBoolean().Should().BeTrue();
    }

    private static DataDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase($"provisioned-auth-{Guid.NewGuid():N}")
            .Options;
        var config = new ConfigurationBuilder().Build();
        return new DataDbContext(options, config);
    }

    private static DatabaseProvisionedSecurityService CreateSecurity(DataDbContext db)
    {
        return new DatabaseProvisionedSecurityService(
            db,
            NullLogger<DatabaseProvisionedSecurityService>.Instance);
    }

    private static AuthenticationService CreateAuthService(IDistributedCache? cacheOverride = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "production-provisioned-auth-tests-secret-key-at-least-32-chars",
                ["JwtSettings:Issuer"] = "TerraFusion",
                ["JwtSettings:Audience"] = "TerraFusionAPI",
                ["JwtSettings:ExpirationMinutes"] = "60"
            })
            .Build();

        var cache = cacheOverride ?? new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
        var jwt = new JwtTokenService(config, NullLogger<JwtTokenService>.Instance);
        var adapter = new ApiJwtTokenServiceAdapter(jwt);

        return new AuthenticationService(
            adapter,
            cache,
            NullLogger<AuthenticationService>.Instance,
            config);
    }

    private sealed class FailingDistributedCache : IDistributedCache
    {
        public byte[]? Get(string key) => null;
        public System.Threading.Tasks.Task<byte[]?> GetAsync(string key, CancellationToken token = default)
            => System.Threading.Tasks.Task.FromResult<byte[]?>(null);

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
            => throw new InvalidOperationException("Cache unavailable.");

        public System.Threading.Tasks.Task SetAsync(
            string key,
            byte[] value,
            DistributedCacheEntryOptions options,
            CancellationToken token = default)
            => System.Threading.Tasks.Task.FromException(new InvalidOperationException("Cache unavailable."));

        public void Refresh(string key) { }
        public System.Threading.Tasks.Task RefreshAsync(string key, CancellationToken token = default)
            => System.Threading.Tasks.Task.CompletedTask;

        public void Remove(string key) { }
        public System.Threading.Tasks.Task RemoveAsync(string key, CancellationToken token = default)
            => System.Threading.Tasks.Task.CompletedTask;
    }

    private static string ClaimValue(JwtSecurityToken jwt, params string[] claimTypes)
    {
        return jwt.Claims.First(c => claimTypes.Contains(c.Type, StringComparer.Ordinal)).Value;
    }
}
