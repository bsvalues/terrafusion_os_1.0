using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.API.Security;
using TerraFusion.Core.Models;
using TerraFusion.Core.Services;
using TerraFusion.Data.Repositories;
using Xunit;
using ApiProgram = TerraFusion.API.Program;
using County = TerraFusion.Core.Entities.County;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Property = TerraFusion.Core.Entities.Property;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// CX-27: PluginPermissionHandler JWT perm-claim fallback — Targeted Auth Tests
//
// Validates the CX-27 change: PluginPermissionHandler now checks JWT "perm"
// claims before falling back to X-Plugin-Id + plugin repository.
//
// These tests run through the REAL DynamicModulePolicyProvider + both handlers
// (not the CX-16 stub-to-authenticated workaround).
//
// Policy question answered: perm-claim fallback is intended because
// ModuleAccessHandler already trusts perm claims (identical pattern).
// Only tokens signed with the server's key are accepted.
//
// Filter: dotnet test --filter "FullyQualifiedName~R1Week5Cx27"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "CX27")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx27PermClaimAuthTests
    : IClassFixture<Cx27PermClaimFactory>, IAsyncLifetime
{
    private readonly Cx27PermClaimFactory _factory;

    public R1Week5Cx27PermClaimAuthTests(Cx27PermClaimFactory factory) => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ── 1. Valid perm claims allow direct API access ─────────────────

    [Fact]
    public async Task DossierNotes_WithPermClaim_Returns200()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: ["read:dossier"]);

        var response = await client.GetAsync($"/api/dossier/{Cx27PermClaimFactory.BentonParcelId}/notes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DossierDetails_WithPermClaim_Returns200()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: ["read:dossier"]);

        var response = await client.GetAsync(
            $"/api/dossier/parcels/{Cx27PermClaimFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DossierEvidence_WithPermClaim_Returns200()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: ["read:dossier"]);

        var response = await client.GetAsync(
            $"/api/dossier/parcels/{Cx27PermClaimFactory.BentonParcelId}/evidence");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── 2. Missing perm claims + no plugin header → 403 ─────────────

    [Fact]
    public async Task DossierNotes_NoPerm_NoPlugin_Returns403()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: []); // authenticated but no perm claims

        var response = await client.GetAsync($"/api/dossier/{Cx27PermClaimFactory.BentonParcelId}/notes");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DossierNotes_WrongPerm_Returns403()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: ["write:dossier"]); // has write but not read

        var response = await client.GetAsync($"/api/dossier/{Cx27PermClaimFactory.BentonParcelId}/notes");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── 3. Cross-county with valid perm → 404 (anti-enumeration) ────

    [Fact]
    public async Task DossierNotes_CrossCounty_WithValidPerm_Returns404Or200Empty()
    {
        // Yakima user with read:dossier tries to read Benton parcel
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.YakimaCountyId,
            permClaims: ["read:dossier"]);

        var response = await client.GetAsync($"/api/dossier/{Cx27PermClaimFactory.BentonParcelId}/notes");

        // Notes endpoint returns 200 with empty list for cross-county
        // (county-scoped query returns no results)
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        doc.RootElement.GetProperty("total").GetInt32().Should().Be(0);
    }

    [Fact]
    public async Task DossierDetails_CrossCounty_WithValidPerm_Returns404()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.YakimaCountyId,
            permClaims: ["read:dossier"]);

        var response = await client.GetAsync(
            $"/api/dossier/parcels/{Cx27PermClaimFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DossierEvidence_CrossCounty_WithValidPerm_Returns404()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.YakimaCountyId,
            permClaims: ["read:dossier"]);

        var response = await client.GetAsync(
            $"/api/dossier/parcels/{Cx27PermClaimFactory.BentonParcelId}/evidence");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── 4. Plugin-based access still works (regression) ──────────────

    [Fact]
    public async Task DossierNotes_PluginHeader_NoPerm_Returns200()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: [],
            pluginId: Cx27PermClaimFactory.PluginWithDossierPerms);

        var response = await client.GetAsync($"/api/dossier/{Cx27PermClaimFactory.BentonParcelId}/notes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DossierNotes_PluginWithoutPerm_NoClaim_Returns403()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: [],
            pluginId: Cx27PermClaimFactory.PluginWithoutDossierPerms);

        var response = await client.GetAsync($"/api/dossier/{Cx27PermClaimFactory.BentonParcelId}/notes");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── 5. Unauthenticated → 401 ────────────────────────────────────

    [Fact]
    public async Task DossierNotes_Unauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();
        // No Authorization header
        var response = await client.GetAsync($"/api/dossier/{Cx27PermClaimFactory.BentonParcelId}/notes");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private HttpClient CreateClient(Guid countyId, string[] permClaims, Guid? pluginId = null)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx27PermClaimFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx27-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId", countyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");

        if (permClaims.Length > 0)
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Perms", string.Join(",", permClaims));

        if (pluginId.HasValue)
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id", pluginId.Value.ToString());

        return client;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: REAL DynamicModulePolicyProvider + PluginPermissionHandler
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx27PermClaimFactory : WebApplicationFactory<ApiProgram>
{
    public static readonly Guid BentonCountyId = Guid.Parse("27270027-2727-2727-2727-272727272727");
    public static readonly Guid YakimaCountyId = Guid.Parse("27270027-2727-2727-2727-272727270099");
    public const string BentonParcelId = "CX27-BENTON-P1";
    public const string AuthScheme = "Cx27TestAuth";

    public static readonly Guid PluginWithDossierPerms = Guid.Parse("27270027-aaaa-aaaa-aaaa-272727272727");
    public static readonly Guid PluginWithoutDossierPerms = Guid.Parse("27270027-bbbb-bbbb-bbbb-272727272727");

    private readonly string _databaseName = $"cx27-perm-{Guid.NewGuid():N}";
    private readonly SemaphoreSlim _seedLock = new(1, 1);
    private bool _seeded;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["ConnectionStrings:TerraFusionDatabase"] = "Host=localhost;Database=tf_test;Username=tf;Password=tf",
                ["UltimateCostForgeAI:UltimateQuantumFactor"] = "999",
                ["UltimateCostForgeAI:UltimateAccuracyTarget"] = "99.9",
                ["UltimateCostForgeAI:UltimateAgentCount"] = "1000000",
                ["UltimateCostForgeAI:UltimateConsciousnessResonance"] = "0.9999",
                ["JwtSettings:SecretKey"] = "CX27_TEST_SECRET_KEY_012345678901234567890123456789",
                ["JwtSettings:Issuer"] = "TerraFusionTestIssuer",
                ["JwtSettings:Audience"] = "TerraFusionTestAudience",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            // ── InMemory DB ──────────────────────────────────────────
            services.RemoveAll<DbContextOptions<DataDbContext>>();
            services.RemoveAll<DataDbContext>();
            services.AddDbContext<DataDbContext>(o => o.UseInMemoryDatabase(_databaseName));

            // ── Service stubs ────────────────────────────────────────
            services.RemoveAll<ICostForgeService>();
            services.RemoveAll<ICostForgeAIService>();
            var costForgeMock = new Mock<ICostForgeService>();
            costForgeMock
                .Setup(m => m.AnalyzeCostAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Guid id) => new CostAnalysisDto
                {
                    PropertyId = id,
                    TotalCost = 100000m,
                    LandValue = 40000m,
                    ImprovementValue = 60000m,
                    ConfidenceScore = 0.95,
                    AnalysisDate = DateTime.UtcNow,
                    AnalysisMethod = "cx27-test",
                });
            services.AddScoped(_ => costForgeMock.Object);
            services.AddScoped(_ => new Mock<ICostForgeAIService>().Object);

            services.RemoveAll<IPropertyService>();
            services.AddScoped(_ => new Mock<IPropertyService>().Object);

            services.RemoveAll<IModuleOrchestrationService>();
            services.AddScoped(_ => new Mock<IModuleOrchestrationService>().Object);

            // ── Auth: test handler that supports perm claims ─────────
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = AuthScheme;
                options.DefaultChallengeScheme = AuthScheme;
                options.DefaultScheme = AuthScheme;
            })
            .AddScheme<AuthenticationSchemeOptions, Cx27TestAuthHandler>(AuthScheme, _ => { });

            // ── Authorization: REAL policy provider + handler ────────
            services.AddAuthorization(options =>
            {
                options.DefaultPolicy = new AuthorizationPolicyBuilder(AuthScheme)
                    .RequireAuthenticatedUser()
                    .Build();
            });

            services.RemoveAll<IAuthorizationPolicyProvider>();
            services.AddSingleton<IAuthorizationPolicyProvider, DynamicModulePolicyProvider>();

            // ── Mock plugin repository ───────────────────────────────
            var pluginRepo = new Mock<IPluginRepository>();
            pluginRepo.Setup(r => r.GetByIdAsync(PluginWithDossierPerms))
                .ReturnsAsync(new Plugin
                {
                    Id = PluginWithDossierPerms,
                    Name = "CX27-DossierPlugin",
                    Version = "1.0.0",
                    Description = "Plugin with dossier permissions",
                    Category = "test",
                    AuthorId = "cx27-test",
                    Status = PluginStatus.Approved,
                    PackageUrl = "https://test.local/pkg",
                    IconUrl = "https://test.local/icon",
                    PermissionsJson = JsonSerializer.Serialize(new[] { "read:dossier", "write:dossier" }),
                });
            pluginRepo.Setup(r => r.GetByIdAsync(PluginWithoutDossierPerms))
                .ReturnsAsync(new Plugin
                {
                    Id = PluginWithoutDossierPerms,
                    Name = "CX27-NoPermsPlugin",
                    Version = "1.0.0",
                    Description = "Plugin without dossier permissions",
                    Category = "test",
                    AuthorId = "cx27-test",
                    Status = PluginStatus.Approved,
                    PackageUrl = "https://test.local/pkg",
                    IconUrl = "https://test.local/icon",
                    PermissionsJson = JsonSerializer.Serialize(new[] { "access:costforge" }),
                });

            services.RemoveAll<IPluginRepository>();
            services.AddSingleton(pluginRepo.Object);

            services.AddScoped<IAuthorizationHandler, PluginPermissionHandler>();
        });
    }

    public async Task EnsureSeedDataAsync()
    {
        await _seedLock.WaitAsync();
        try
        {
            if (_seeded) return;

            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<DataDbContext>();
            await db.Database.EnsureCreatedAsync();

            if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
            {
                db.Counties.Add(new County
                {
                    Id = BentonCountyId,
                    Name = "Benton",
                    State = "WA",
                    FipsCode = "003",
                });
            }

            if (!await db.Counties.AnyAsync(c => c.Id == YakimaCountyId))
            {
                db.Counties.Add(new County
                {
                    Id = YakimaCountyId,
                    Name = "Yakima",
                    State = "WA",
                    FipsCode = "077",
                });
            }

            if (!await db.Properties.AnyAsync(p => p.ParcelId == BentonParcelId))
            {
                db.Properties.Add(new Property
                {
                    Id = Guid.NewGuid(),
                    PropertyId = "CX27-PROP-BENTON",
                    ParcelId = BentonParcelId,
                    ParcelNumber = "CX27BENTONP1",
                    Address = "100 CX27 Benton Ave",
                    PropertyType = "Residential",
                    AssessedValue = 250000,
                    LandValue = 100000,
                    ImprovementValue = 150000,
                    MarketValue = 275000,
                    AssessmentDate = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow,
                    TaxYear = 2026,
                    CountyId = BentonCountyId,
                });
            }

            await db.SaveChangesAsync();
            _seeded = true;
        }
        finally
        {
            _seedLock.Release();
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test auth handler — supports perm claims via X-Test-Perms header
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx27TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public Cx27TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authValues))
            return Task.FromResult(AuthenticateResult.NoResult());

        if (!AuthenticationHeaderValue.TryParse(authValues.ToString(), out var authHeader))
            return Task.FromResult(AuthenticateResult.NoResult());

        if (!string.Equals(authHeader.Scheme, Scheme.Name, StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(AuthenticateResult.NoResult());

        var userId = Request.Headers["X-Test-UserId"].FirstOrDefault() ?? "cx27-user";
        var countyId = Request.Headers["X-Test-CountyId"].FirstOrDefault();
        var countyCode = Request.Headers["X-Test-CountyCode"].FirstOrDefault();

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

        // CX-27: Support perm claims via header for testing
        var permsHeader = Request.Headers["X-Test-Perms"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(permsHeader))
        {
            foreach (var perm in permsHeader.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                claims.Add(new Claim("perm", perm));
            }
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
