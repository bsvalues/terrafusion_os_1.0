using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
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
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// CX-18: Permission Policy Enforcement — Real Pipeline Integration Tests
//
// Validates that every [RequiresPermission] attribute on the 5 governed
// controllers resolves through DynamicModulePolicyProvider + PluginPermission-
// Handler, NOT through the CX-16-era "stub-to-authenticated" workaround.
//
// Lock doc: backend/docs/r1-week5-scope-lock.md §CX-18
// Filter:   dotnet test --filter "FullyQualifiedName~R1Week5Cx18"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "CX18")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx18PermissionPolicyIntegrationTests
    : IClassFixture<Cx18PermissionPolicyFactory>, IAsyncLifetime
{
    private readonly Cx18PermissionPolicyFactory _factory;

    public R1Week5Cx18PermissionPolicyIntegrationTests(Cx18PermissionPolicyFactory factory)
        => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ── Test Data ──────────────────────────────────────────────────────

    /// <summary>
    /// 23 policy-endpoint pairs from the Week 5 scope lock matrix.
    /// Each entry: (label, HTTP verb, URL, JSON body or null).
    /// </summary>
    public static IEnumerable<object?[]> PolicyEndpoints()
    {
        var guid1 = Guid.NewGuid();
        var guid2 = Guid.NewGuid();

        // ── PropertiesController (1) ─────────────────────────────────
        yield return new object?[] { "Properties_read:properties", "GET", $"/api/Properties/{guid1}", null };

        // ── AtlasController (2) ──────────────────────────────────────
        yield return new object?[] { "Atlas_read:parcel_geometry", "GET", "/api/atlas/parcels/CX18-P1", null };
        yield return new object?[] { "Atlas_read:parcel_layers", "GET", "/api/atlas/parcels/CX18-P1/layers", null };

        // ── CostForgeController —— class-level gate (1) ─────────────
        yield return new object?[] { "CostForge_access:costforge_classGate", "GET", "/api/CostForge/status", null };

        // ── CostForgeController —— method-level (12) ────────────────
        yield return new object?[] { "CostForge_calculate:property-cost", "POST", "/api/CostForge/calculate",
            JsonSerializer.Serialize(new { PropertyId = guid1, Region = "BENTON", BuildingType = "SFR" }) };
        yield return new object?[] { "CostForge_calculate:batch-valuation", "POST", "/api/CostForge/batch-calculate",
            JsonSerializer.Serialize(new { PropertyIds = Array.Empty<Guid>(), CountyId = "BENTON", Parameters = new { } }) };
        yield return new object?[] { "CostForge_read:cost-breakdown", "GET", $"/api/CostForge/{guid1}/breakdown", null };
        yield return new object?[] { "CostForge_read:cost-comparison", "GET", $"/api/CostForge/compare/{guid1}/{guid2}", null };
        yield return new object?[] { "CostForge_read:cost-forecast", "GET", $"/api/CostForge/{guid1}/forecast", null };
        yield return new object?[] { "CostForge_read:cost-factors", "GET", "/api/CostForge/factors/BENTON", null };
        yield return new object?[] { "CostForge_read:cost-matrix", "GET", "/api/CostForge/matrix?buildingType=SFR&region=BENTON", null };
        yield return new object?[] { "CostForge_read:system-status", "GET", "/api/CostForge/status", null };
        yield return new object?[] { "CostForge_read:ai-agents", "GET", "/api/CostForge/agents/status", null };
        yield return new object?[] { "CostForge_manage:ai-agents", "POST", "/api/CostForge/agents/scale",
            JsonSerializer.Serialize(new { TargetCount = 1 }) };
        yield return new object?[] { "CostForge_read:performance-metrics", "GET", "/api/CostForge/metrics", null };
        yield return new object?[] { "CostForge_sync:external-systems", "POST", "/api/CostForge/sync/harris-pacs",
            JsonSerializer.Serialize(new { CountyId = "BENTON", FullSync = false }) };

        // ── DossierController (3) ────────────────────────────────────
        yield return new object?[] { "Dossier_read:dossier_notes", "GET", "/api/dossier/CX18-P1/notes", null };
        yield return new object?[] { "Dossier_write:dossier", "POST", "/api/dossier/CX18-P1/notes",
            JsonSerializer.Serialize(new { Content = "cx18-test", Type = "case_note" }) };
        yield return new object?[] { "Dossier_read:dossier_casefile", "GET", "/api/dossier/parcels/CX18-P1/casefile", null };

        // ── EnhancementModuleController (4) ──────────────────────────
        yield return new object?[] { "Ecosystem_view_list", "GET", "/api/ecosystem/enhancement-modules", null };
        yield return new object?[] { "Ecosystem_manage_register", "POST", "/api/ecosystem/enhancement-modules/register", null };
        yield return new object?[] { "Ecosystem_view_single", "GET", "/api/ecosystem/enhancement-modules/test-module", null };
        yield return new object?[] { "Ecosystem_view_health", "GET", "/api/ecosystem/enhancement-modules/test-module/health", null };
    }

    // ── 23 × Unauthenticated → 401 ────────────────────────────────────

    [Theory]
    [MemberData(nameof(PolicyEndpoints))]
    public async Task Unauthenticated_Returns401(string label, string verb, string url, string? body)
    {
        using var client = _factory.CreateClient();
        var response = await SendAsync(client, verb, url, body);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            $"[{label}] {verb} {url} without auth token should be 401");
    }

    // ── 23 × Authenticated without permission → 403 ───────────────────

    [Theory]
    [MemberData(nameof(PolicyEndpoints))]
    public async Task AuthenticatedWithoutPermission_Returns403(string label, string verb, string url, string? body)
    {
        // Authenticated (has identity) but no X-Plugin-Id → handler can't succeed → 403
        using var client = CreateAuthenticatedClient();
        var response = await SendAsync(client, verb, url, body);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            $"[{label}] {verb} {url} without permission claim should be 403");
    }

    // ── 23 × Authenticated with permission → non-403 ──────────────────

    [Theory]
    [MemberData(nameof(PolicyEndpoints))]
    public async Task AuthenticatedWithPermission_ReturnsNon403(string label, string verb, string url, string? body)
    {
        // Has identity + X-Plugin-Id pointing to Plugin A (all permissions)
        using var client = CreateAuthenticatedClient(Cx18PermissionPolicyFactory.PluginAllPermsId);
        var response = await SendAsync(client, verb, url, body);

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized,
            $"[{label}] {verb} {url} with auth should not be 401");
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
            $"[{label}] {verb} {url} with valid permission should not be 403");
    }

    // ── Class-level gate: access:costforge ─────────────────────────────

    [Fact]
    public async Task CostForge_ClassGate_MethodPermWithoutClassPerm_Returns403()
    {
        // Plugin B has method-level perms (read:system-status) but NOT class-level
        // (access:costforge). The class-level gate should reject.
        using var client = CreateAuthenticatedClient(Cx18PermissionPolicyFactory.PluginNoClassPermId);
        var response = await client.GetAsync("/api/CostForge/status");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            "CostForge class-level access:costforge gate should block without class permission");
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private HttpClient CreateAuthenticatedClient(Guid? pluginId = null)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx18PermissionPolicyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx18-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId",
            Cx18PermissionPolicyFactory.BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");

        if (pluginId.HasValue)
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id", pluginId.Value.ToString());

        return client;
    }

    private static async Task<HttpResponseMessage> SendAsync(HttpClient client, string verb, string url, string? body)
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
// Factory: wires DynamicModulePolicyProvider + PluginPermissionHandler
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx18PermissionPolicyFactory : WebApplicationFactory<ApiProgram>
{
    public static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public const string AuthScheme = "Cx18TestAuth";

    /// <summary>Plugin with ALL 19 unique permissions (happy-path).</summary>
    public static readonly Guid PluginAllPermsId = Guid.Parse("aa18aa18-aa18-aa18-aa18-aa18aa18aa18");

    /// <summary>Plugin with CostForge METHOD perms but NOT class-level access:costforge.</summary>
    public static readonly Guid PluginNoClassPermId = Guid.Parse("bb18bb18-bb18-bb18-bb18-bb18bb18bb18");

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

    private static readonly string[] MethodOnlyPermissions =
    [
        "read:system-status",
        "read:ai-agents",
        "read:performance-metrics",
        "calculate:property-cost",
        // access:costforge intentionally OMITTED
    ];

    private readonly string _databaseName = $"cx18-perm-{Guid.NewGuid():N}";
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
                ["JwtSettings:SecretKey"] = "CX18_TEST_SECRET_KEY_012345678901234567890123456789",
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

            // ── Test auth handler ────────────────────────────────────
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = AuthScheme;
                options.DefaultChallengeScheme = AuthScheme;
                options.DefaultScheme = AuthScheme;
            })
            .AddScheme<AuthenticationSchemeOptions, Cx18TestAuthHandler>(AuthScheme, _ => { });

            // ── Authorization: REAL policy provider + handler ────────
            services.AddAuthorization(options =>
            {
                options.DefaultPolicy = new AuthorizationPolicyBuilder(AuthScheme)
                    .RequireAuthenticatedUser()
                    .Build();
            });

            services.RemoveAll<IAuthorizationPolicyProvider>();
            services.AddSingleton<IAuthorizationPolicyProvider, DynamicModulePolicyProvider>();

            // Mock plugin repository — returns seeded plugins
            var pluginRepo = new Mock<IPluginRepository>();
            pluginRepo.Setup(r => r.GetByIdAsync(PluginAllPermsId))
                .ReturnsAsync(new Plugin
                {
                    Id = PluginAllPermsId,
                    Name = "CX18-AllPerms",
                    Version = "1.0.0",
                    Description = "Test plugin with all permissions",
                    Category = "test",
                    AuthorId = "cx18-test",
                    Status = PluginStatus.Approved,
                    PackageUrl = "https://test.local/pkg",
                    IconUrl = "https://test.local/icon",
                    PermissionsJson = JsonSerializer.Serialize(AllPermissions),
                });
            pluginRepo.Setup(r => r.GetByIdAsync(PluginNoClassPermId))
                .ReturnsAsync(new Plugin
                {
                    Id = PluginNoClassPermId,
                    Name = "CX18-NoClassPerm",
                    Version = "1.0.0",
                    Description = "Test plugin without access:costforge",
                    Category = "test",
                    AuthorId = "cx18-test",
                    Status = PluginStatus.Approved,
                    PackageUrl = "https://test.local/pkg",
                    IconUrl = "https://test.local/icon",
                    PermissionsJson = JsonSerializer.Serialize(MethodOnlyPermissions),
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
                AnalysisMethod = "cx18-test",
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
// Test auth handler — same pattern as CX-16 (identity from headers)
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx18TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public Cx18TestAuthHandler(
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

        var userId = Request.Headers["X-Test-UserId"].FirstOrDefault() ?? "cx18-user";
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
