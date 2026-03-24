using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;
using ApiProgram = TerraFusion.API.Program;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// G3: DaisController — County Isolation Contract
// Proves [Authorize] + RequireCountyAccessAsync() form a closed gate.
// No sentinel GUID fallback path. Missing county claim → 403 (Forbid — authenticated but missing required claim).
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "CX21G3")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx21DaisCountyIsolationTests
    : IClassFixture<Cx21DaisIsolationFactory>
{
    private static readonly Guid BentonCountyId = Guid.Parse("21000000-0000-0000-0000-000000000001");

    private readonly Cx21DaisIsolationFactory _factory;

    public R1Week5Cx21DaisCountyIsolationTests(Cx21DaisIsolationFactory factory)
    {
        _factory = factory;
    }

    // ── G3-A: class-level [Authorize] blocks unauthenticated requests ─────────

    [Fact]
    public async Task Unauthenticated_GetPermitTypes_Returns401()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/dais/permit-types");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Unauthenticated_GetCertStatus_Returns401()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/dais/cert/status");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── G3-B: RequireCountyAccessAsync() blocks auth'd requests with no county claim ──

    [Fact]
    public async Task Authenticated_NoCountyClaim_GetCertStatus_Returns403()
    {
        using var client = CreateAuthenticatedClient(countyId: null);
        var response = await client.GetAsync("/api/dais/cert/status");

        // RequireCountyAccessAsync returns Forbid (403) when no claim resolves —
        // authenticated user is missing required county claim → authorization failure, not authentication failure
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Authenticated_NoCountyClaim_GetAppeals_Returns403()
    {
        using var client = CreateAuthenticatedClient(countyId: null);
        var response = await client.GetAsync("/api/dais/appeals");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── G3-C: authenticated with county claim reaches static endpoints ────────

    [Fact]
    public async Task Authenticated_WithCountyClaim_GetPermitTypes_Returns200()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId);
        var response = await client.GetAsync("/api/dais/permit-types");

        // Static endpoint — [Authorize] passes, no county check, catalog data returned
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Authenticated_WithCountyClaim_GetWorkflowStages_Returns200()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId);
        var response = await client.GetAsync("/api/dais/workflow-stages");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─────────────────────────────────────────────────────────────────────────
    private HttpClient CreateAuthenticatedClient(Guid? countyId, string role = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx21DaisIsolationFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx21-user");
        if (countyId.HasValue)
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId", countyId.Value.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", role);
        return client;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// G4: MarketplaceController — RBAC Closure Contract
// Proves [Authorize(Roles = "Admin,SystemAdmin")] is the only gate.
// Non-admin authenticated users → 403. No stubs bypass this.
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "CX21G4")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx21MarketplaceRbacTests
    : IClassFixture<Cx21MarketplaceRbacFactory>
{
    private readonly Cx21MarketplaceRbacFactory _factory;

    public R1Week5Cx21MarketplaceRbacTests(Cx21MarketplaceRbacFactory factory)
    {
        _factory = factory;
    }

    // ── G4-A: unauthenticated always 401 ─────────────────────────────────────

    [Fact]
    public async Task Unauthenticated_GetPlugins_Returns401()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/marketplace/plugins");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Unauthenticated_GetCategories_Returns401()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/marketplace/categories");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── G4-B: non-admin authenticated user → 403 ─────────────────────────────

    [Fact]
    public async Task Authenticated_AssessorRole_GetPlugins_Returns403()
    {
        using var client = CreateAuthenticatedClient(role: "Assessor");
        var response = await client.GetAsync("/api/marketplace/plugins");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Authenticated_ReadOnlyRole_GetPlugins_Returns403()
    {
        using var client = CreateAuthenticatedClient(role: "ReadOnly");
        var response = await client.GetAsync("/api/marketplace/plugins");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── G4-C: Admin/SystemAdmin role passes the gate ─────────────────────────

    [Fact]
    public async Task Authenticated_AdminRole_GetPlugins_Returns200()
    {
        using var client = CreateAuthenticatedClient(role: "Admin");
        var response = await client.GetAsync("/api/marketplace/plugins");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Authenticated_SystemAdminRole_GetPlugins_Returns200()
    {
        using var client = CreateAuthenticatedClient(role: "SystemAdmin");
        var response = await client.GetAsync("/api/marketplace/plugins");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── G4-D: removed stub endpoints no longer exist (404) ───────────────────

    [Fact]
    public async Task Admin_Post_Rate_Returns404_StubRemoved()
    {
        using var client = CreateAuthenticatedClient(role: "Admin");
        var response = await client.PostAsync("/api/marketplace/plugins/some-id/rate",
            new StringContent("{\"rating\":5}", System.Text.Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Admin_Post_Submit_Returns404_StubRemoved()
    {
        using var client = CreateAuthenticatedClient(role: "Admin");
        var response = await client.PostAsync("/api/marketplace/submit",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Admin_Post_Publish_Returns404_StubRemoved()
    {
        using var client = CreateAuthenticatedClient(role: "Admin");
        var response = await client.PostAsync("/api/marketplace/publish",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ─────────────────────────────────────────────────────────────────────────
    private HttpClient CreateAuthenticatedClient(string role)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx21MarketplaceRbacFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx21-admin");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", role);
        return client;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: Dais Isolation
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx21DaisIsolationFactory : WebApplicationFactory<ApiProgram>
{
    public const string AuthScheme = "Cx21DaisTestAuth";

    private readonly string _databaseName = $"cx21-dais-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["ConnectionStrings:TerraFusionDatabase"] = "Host=localhost;Database=tf_test;Username=tf;Password=tf",
                ["JwtSettings:SecretKey"] = "CX21_DAIS_TEST_SECRET_KEY_0123456789012345678901234567",
                ["JwtSettings:Issuer"] = "TerraFusionTestIssuer",
                ["JwtSettings:Audience"] = "TerraFusionTestAudience",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<DataDbContext>>();
            services.RemoveAll<DataDbContext>();
            services.AddDbContext<DataDbContext>(options => options.UseInMemoryDatabase(_databaseName));

            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = AuthScheme;
                    options.DefaultChallengeScheme = AuthScheme;
                    options.DefaultScheme = AuthScheme;
                })
                .AddScheme<AuthenticationSchemeOptions, Cx21TestAuthHandler>(AuthScheme, _ => { });
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: Marketplace RBAC
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx21MarketplaceRbacFactory : WebApplicationFactory<ApiProgram>
{
    public const string AuthScheme = "Cx21MarketplaceTestAuth";

    private readonly string _databaseName = $"cx21-marketplace-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["ConnectionStrings:TerraFusionDatabase"] = "Host=localhost;Database=tf_test;Username=tf;Password=tf",
                ["JwtSettings:SecretKey"] = "CX21_MRKT_TEST_SECRET_KEY_0123456789012345678901234567",
                ["JwtSettings:Issuer"] = "TerraFusionTestIssuer",
                ["JwtSettings:Audience"] = "TerraFusionTestAudience",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<DataDbContext>>();
            services.RemoveAll<DataDbContext>();
            services.AddDbContext<DataDbContext>(options => options.UseInMemoryDatabase(_databaseName));

            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = AuthScheme;
                    options.DefaultChallengeScheme = AuthScheme;
                    options.DefaultScheme = AuthScheme;
                })
                .AddScheme<AuthenticationSchemeOptions, Cx21TestAuthHandler>(AuthScheme, _ => { });
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared test auth handler — reads X-Test-* headers to build ClaimsPrincipal
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx21TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public Cx21TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authorizationValues))
            return Task.FromResult(AuthenticateResult.NoResult());

        if (!AuthenticationHeaderValue.TryParse(authorizationValues.ToString(), out var authHeader))
            return Task.FromResult(AuthenticateResult.NoResult());

        if (!string.Equals(authHeader.Scheme, Scheme.Name, StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(AuthenticateResult.NoResult());

        var userId = Request.Headers["X-Test-UserId"].FirstOrDefault() ?? "cx21-user";
        var countyId = Request.Headers["X-Test-CountyId"].FirstOrDefault();
        var countyCode = Request.Headers["X-Test-CountyCode"].FirstOrDefault();
        var roleHeader = Request.Headers["X-Test-Role"].FirstOrDefault();

        var claims = new List<Claim>
        {
            new("sub", userId),
            new("userId", userId),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, userId),
        };

        if (!string.IsNullOrWhiteSpace(countyId))
            claims.Add(new Claim("countyId", countyId));

        if (!string.IsNullOrWhiteSpace(countyCode))
            claims.Add(new Claim("countyCode", countyCode));

        if (!string.IsNullOrWhiteSpace(roleHeader))
        {
            foreach (var role in roleHeader.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
                claims.Add(new Claim("role", role));
            }
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
