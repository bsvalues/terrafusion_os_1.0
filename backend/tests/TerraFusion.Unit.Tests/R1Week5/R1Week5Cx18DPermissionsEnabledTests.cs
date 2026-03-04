using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
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
using Moq;
using TerraFusion.Core.Models;
using TerraFusion.Core.Services;
using TerraFusion.Data.Repositories;
using Xunit;
using ApiProgram = TerraFusion.API.Program;
using County = TerraFusion.Core.Entities.County;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// CX-18D: Production DI Verification — Permission Pipeline Enabled
//
// Proves that the CX-18D fix (DynamicModulePolicyProvider + PluginPermission-
// Handler + ModuleAccessHandler registered in production DI) is live.
//
// CRITICAL DIFFERENCE from CX-18:
//   CX-18  → test factory explicitly registers provider + handler
//   CX-18D → test factory does NOT register provider or handler;
//            relies on production AuthenticationConfiguration wiring.
//
// 5 representative endpoints (one per controller) × 3 assertions each:
//   1. Unauthenticated → 401
//   2. Authenticated without X-Plugin-Id → 403
//   3. Authenticated with valid plugin → non-401 & non-403
//
// Filter:  dotnet test --filter "FullyQualifiedName~R1Week5Cx18D"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "CX18D")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx18DPermissionsEnabledTests
    : IClassFixture<Cx18DProductionDIFactory>, IAsyncLifetime
{
    private readonly Cx18DProductionDIFactory _factory;

    public R1Week5Cx18DPermissionsEnabledTests(Cx18DProductionDIFactory factory)
        => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ── Representative endpoints: one per controller ────────────────────

    public static IEnumerable<object?[]> RepresentativeEndpoints()
    {
        var guid = Guid.NewGuid();

        // PropertiesController
        yield return new object?[] { "Properties", "GET", $"/api/Properties/{guid}", null };

        // AtlasController
        yield return new object?[] { "Atlas", "GET", "/api/atlas/parcels/CX18D-P1", null };

        // CostForgeController (class + method gate)
        yield return new object?[] { "CostForge", "GET", "/api/CostForge/status", null };

        // DossierController
        yield return new object?[] { "Dossier", "GET", "/api/dossier/CX18D-P1/notes", null };

        // EnhancementModuleController
        yield return new object?[] { "Ecosystem", "GET", "/api/ecosystem/enhancement-modules", null };
    }

    // ── 5 × Unauthenticated → 401 ──────────────────────────────────────

    [Theory]
    [MemberData(nameof(RepresentativeEndpoints))]
    public async Task ProductionDI_Unauthenticated_Returns401(
        string controller, string verb, string url, string? body)
    {
        using var client = _factory.CreateClient();
        var response = await SendAsync(client, verb, url, body);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            $"[{controller}] {verb} {url} without auth should be 401 via production DI");
    }

    // ── 5 × Auth without permission → 403 ──────────────────────────────

    [Theory]
    [MemberData(nameof(RepresentativeEndpoints))]
    public async Task ProductionDI_AuthWithoutPermission_Returns403(
        string controller, string verb, string url, string? body)
    {
        using var client = CreateAuthenticatedClient();
        var response = await SendAsync(client, verb, url, body);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            $"[{controller}] {verb} {url} authenticated but no X-Plugin-Id should be 403 via production DI");
    }

    // ── 5 × Auth with valid plugin → non-401 & non-403 ─────────────────

    [Theory]
    [MemberData(nameof(RepresentativeEndpoints))]
    public async Task ProductionDI_AuthWithPermission_PassesAuthz(
        string controller, string verb, string url, string? body)
    {
        using var client = CreateAuthenticatedClient(Cx18DProductionDIFactory.PluginAllPermsId);
        var response = await SendAsync(client, verb, url, body);

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized,
            $"[{controller}] {verb} {url} with auth should not be 401");
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
            $"[{controller}] {verb} {url} with valid plugin should not be 403");
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private HttpClient CreateAuthenticatedClient(Guid? pluginId = null)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx18DProductionDIFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx18d-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId",
            Cx18DProductionDIFactory.BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");

        if (pluginId.HasValue)
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id", pluginId.Value.ToString());

        return client;
    }

    private static async Task<HttpResponseMessage> SendAsync(
        HttpClient client, string verb, string url, string? body)
    {
        return verb.ToUpperInvariant() switch
        {
            "GET" => await client.GetAsync(url),
            "POST" => await client.PostAsync(url,
                body != null
                    ? new StringContent(body, Encoding.UTF8, "application/json")
                    : new StringContent("{}", Encoding.UTF8, "application/json")),
            _ => throw new ArgumentException($"Unsupported verb: {verb}")
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: Production DI pipeline — does NOT register provider or handler.
// Only overrides: auth scheme (test), DB (InMemory), service stubs,
// and mock IPluginRepository (seeded with test plugins).
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx18DProductionDIFactory : WebApplicationFactory<ApiProgram>
{
    public static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public const string AuthScheme = "Cx18DTestAuth";

    public static readonly Guid PluginAllPermsId = Guid.Parse("dd18dd18-dd18-dd18-dd18-dd18dd18dd18");

    private static readonly string[] AllPermissions =
    [
        "read:properties",
        "read:parcel",
        "access:costforge",
        "calculate:property-cost",
        "calculate:batch-valuation",
        "read:cost-breakdown",
        "read:cost-comparison",
        "read:cost-forecast",
        "read:cost-factors",
        "read:cost-matrix",
        "read:system-status",
        "read:ai-agents",
        "manage:ai-agents",
        "read:performance-metrics",
        "sync:external-systems",
        "read:dossier",
        "write:dossier",
        "ecosystem:view",
        "ecosystem:manage",
    ];

    private readonly string _databaseName = $"cx18d-prod-{Guid.NewGuid():N}";
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
                ["JwtSettings:SecretKey"] = "CX18D_TEST_SECRET_KEY_01234567890123456789012345678",
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

            // ── Controller dependency stubs ──────────────────────────
            RegisterCostForgeServiceStubs(services);
            RegisterPropertyServiceStub(services);
            RegisterModuleOrchestrationServiceStub(services);

            // ── Test auth handler (replaces JWT bearer only) ─────────
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = AuthScheme;
                options.DefaultChallengeScheme = AuthScheme;
                options.DefaultScheme = AuthScheme;
            })
            .AddScheme<AuthenticationSchemeOptions, Cx18DTestAuthHandler>(AuthScheme, _ => { });

            // ── Mock IPluginRepository (override production registration) ──
            var pluginRepo = new Mock<IPluginRepository>();
            pluginRepo.Setup(r => r.GetByIdAsync(PluginAllPermsId))
                .ReturnsAsync(new Plugin
                {
                    Id = PluginAllPermsId,
                    Name = "CX18D-AllPerms",
                    Version = "1.0.0",
                    Description = "Production DI test plugin with all permissions",
                    Category = "test",
                    AuthorId = "cx18d-test",
                    Status = PluginStatus.Approved,
                    PackageUrl = "https://test.local/pkg",
                    IconUrl = "https://test.local/icon",
                    PermissionsJson = JsonSerializer.Serialize(AllPermissions),
                });
            services.RemoveAll<IPluginRepository>();
            services.AddScoped(_ => pluginRepo.Object);

            // ═══════════════════════════════════════════════════════════
            // NOTE: We do NOT register IAuthorizationPolicyProvider or
            // IAuthorizationHandler here. The production DI pipeline
            // (AuthenticationConfiguration.AddTerraFusionAuthentication)
            // must provide them. If this test passes, the fix is live.
            // ═══════════════════════════════════════════════════════════
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
                await db.SaveChangesAsync();
            }

            _seeded = true;
        }
        finally
        {
            _seedLock.Release();
        }
    }

    private static void RegisterCostForgeServiceStubs(IServiceCollection services)
    {
        services.RemoveAll<ICostForgeService>();
        services.RemoveAll<ICostForgeAIService>();

        var costForgeMock = new Mock<ICostForgeService>();
        costForgeMock
            .Setup(m => m.AnalyzeCostAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid propertyId) => new CostAnalysisDto
            {
                PropertyId = propertyId,
                TotalCost = 100000m,
                LandValue = 40000m,
                ImprovementValue = 60000m,
                MarketAdjustment = 0m,
                ConfidenceScore = 0.95,
                AnalysisDate = DateTime.UtcNow,
                AnalysisMethod = "cx18d-test",
            });

        services.AddScoped(_ => costForgeMock.Object);
        services.AddScoped(_ => new Mock<ICostForgeAIService>().Object);
    }

    private static void RegisterPropertyServiceStub(IServiceCollection services)
    {
        services.RemoveAll<IPropertyService>();
        services.AddScoped(_ => new Mock<IPropertyService>().Object);
    }

    private static void RegisterModuleOrchestrationServiceStub(IServiceCollection services)
    {
        services.RemoveAll<IModuleOrchestrationService>();
        services.AddScoped(_ => new Mock<IModuleOrchestrationService>().Object);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test auth handler — identity from headers (same pattern as CX-18)
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx18DTestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public Cx18DTestAuthHandler(
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

        var userId = Request.Headers["X-Test-UserId"].FirstOrDefault() ?? "cx18d-user";
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
            foreach (var role in roleHeader.Split(',',
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
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
