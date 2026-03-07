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
using TerraFusion.Core.Entities;
using TerraFusion.Core.Models;
using TerraFusion.Core.Services;
using TerraFusion.Data.Repositories;
using Xunit;
using ApiProgram = TerraFusion.API.Program;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week2;

// ─────────────────────────────────────────────────────────────────────────────
// CX-8: CostForge Real-Output Verification
//
// Proves that POST /api/costforge/calculate returns:
//   1. Non-zero TotalCost, LandValue, ImprovementValue for seeded properties
//   2. Parcel-variable outputs: Property A != Property B when underlying data differs
//   3. PropertyId in response matches the requested property
//
// This validates the CostForgeService uses real DB property data, not hardcoded
// demo values. The real CostForgeService + real PropertyService run end-to-end.
//
// Lock doc: backend/docs/r1-week2-cx8-costforge-real-output-report.md
// Filter:   dotnet test --filter "FullyQualifiedName~R1Week2Cx8"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week2")]
[Trait("Category", "CX8")]
[Trait("Category", "Integration")]
public sealed class R1Week2Cx8CostForgeRealOutputTests
    : IClassFixture<Cx8CostForgeRealFactory>, IAsyncLifetime
{
    private readonly Cx8CostForgeRealFactory _factory;

    public R1Week2Cx8CostForgeRealOutputTests(Cx8CostForgeRealFactory factory)
        => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ════════════════════════════════════════════════════════════════════
    // TEST 1: Property A returns non-zero values
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CostForge_PropertyA_ReturnsNonZeroValues()
    {
        using var client = CreateBentonClient();
        var payload = JsonSerializer.Serialize(new
        {
            PropertyId = Cx8CostForgeRealFactory.PropertyAId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "RESIDENTIAL",
        });

        var response = await client.PostAsync("/api/CostForge/calculate",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            "Benton caller calculating Benton property A should succeed");

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        result.GetProperty("totalCost").GetDecimal().Should().BeGreaterThan(0m,
            "TotalCost must be non-zero for a seeded property");
        result.GetProperty("landValue").GetDecimal().Should().BeGreaterThan(0m,
            "LandValue must be non-zero for a seeded property");
        result.GetProperty("improvementValue").GetDecimal().Should().BeGreaterThan(0m,
            "ImprovementValue must be non-zero for a seeded property");
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 2: Property B returns non-zero values
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CostForge_PropertyB_ReturnsNonZeroValues()
    {
        using var client = CreateBentonClient();
        var payload = JsonSerializer.Serialize(new
        {
            PropertyId = Cx8CostForgeRealFactory.PropertyBId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "RESIDENTIAL",
        });

        var response = await client.PostAsync("/api/CostForge/calculate",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            "Benton caller calculating Benton property B should succeed");

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        result.GetProperty("totalCost").GetDecimal().Should().BeGreaterThan(0m,
            "TotalCost must be non-zero for a seeded property");
        result.GetProperty("landValue").GetDecimal().Should().BeGreaterThan(0m,
            "LandValue must be non-zero for a seeded property");
        result.GetProperty("improvementValue").GetDecimal().Should().BeGreaterThan(0m,
            "ImprovementValue must be non-zero for a seeded property");
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 3: Property A != Property B (parcel-variable output)
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CostForge_PropertyA_DiffersFrom_PropertyB()
    {
        using var client = CreateBentonClient();

        // Calculate Property A
        var payloadA = JsonSerializer.Serialize(new
        {
            PropertyId = Cx8CostForgeRealFactory.PropertyAId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "RESIDENTIAL",
        });
        var responseA = await client.PostAsync("/api/CostForge/calculate",
            new StringContent(payloadA, Encoding.UTF8, "application/json"));
        responseA.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonA = await responseA.Content.ReadAsStringAsync();
        var resultA = JsonSerializer.Deserialize<JsonElement>(jsonA);

        // Calculate Property B
        var payloadB = JsonSerializer.Serialize(new
        {
            PropertyId = Cx8CostForgeRealFactory.PropertyBId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "RESIDENTIAL",
        });
        var responseB = await client.PostAsync("/api/CostForge/calculate",
            new StringContent(payloadB, Encoding.UTF8, "application/json"));
        responseB.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonB = await responseB.Content.ReadAsStringAsync();
        var resultB = JsonSerializer.Deserialize<JsonElement>(jsonB);

        // Parcel-variable: at least one of TotalCost, LandValue, ImprovementValue must differ
        var totalA = resultA.GetProperty("totalCost").GetDecimal();
        var totalB = resultB.GetProperty("totalCost").GetDecimal();
        var landA = resultA.GetProperty("landValue").GetDecimal();
        var landB = resultB.GetProperty("landValue").GetDecimal();
        var improvA = resultA.GetProperty("improvementValue").GetDecimal();
        var improvB = resultB.GetProperty("improvementValue").GetDecimal();

        var anyDifference = totalA != totalB || landA != landB || improvA != improvB;
        anyDifference.Should().BeTrue(
            $"PropertyA (total={totalA}, land={landA}, improv={improvA}) must differ from " +
            $"PropertyB (total={totalB}, land={landB}, improv={improvB}) — " +
            "CostForge must produce parcel-variable outputs from real property data");
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 4: PropertyId in response matches requested property
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CostForge_ResponsePropertyId_MatchesRequest()
    {
        using var client = CreateBentonClient();
        var payload = JsonSerializer.Serialize(new
        {
            PropertyId = Cx8CostForgeRealFactory.PropertyAId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "RESIDENTIAL",
        });

        var response = await client.PostAsync("/api/CostForge/calculate",
            new StringContent(payload, Encoding.UTF8, "application/json"));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        var responsePropertyId = result.GetProperty("propertyId").GetString();
        responsePropertyId.Should().Be(Cx8CostForgeRealFactory.PropertyAId.ToString(),
            "Response PropertyId must match the requested property, not a random GUID");
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 5: ParcelNumber-based lookup also returns real data
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CostForge_ByParcelNumber_ReturnsNonZeroValues()
    {
        using var client = CreateBentonClient();
        var payload = JsonSerializer.Serialize(new
        {
            PropertyId = Guid.Empty,
            ParcelNumber = Cx8CostForgeRealFactory.PropertyAParcelNumber,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "RESIDENTIAL",
        });

        var response = await client.PostAsync("/api/CostForge/calculate",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            "ParcelNumber-based lookup for existing Benton parcel should succeed");

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        result.GetProperty("totalCost").GetDecimal().Should().BeGreaterThan(0m,
            "ParcelNumber lookup must also produce non-zero TotalCost from real data");
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 6: ConfidenceScore reflects data completeness
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CostForge_ConfidenceScore_IsPositive()
    {
        using var client = CreateBentonClient();
        var payload = JsonSerializer.Serialize(new
        {
            PropertyId = Cx8CostForgeRealFactory.PropertyAId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "RESIDENTIAL",
        });

        var response = await client.PostAsync("/api/CostForge/calculate",
            new StringContent(payload, Encoding.UTF8, "application/json"));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        result.GetProperty("confidenceScore").GetDouble().Should().BeGreaterThan(0.0,
            "ConfidenceScore must be positive for a property with complete data");
        result.GetProperty("confidenceScore").GetDouble().Should().BeLessThanOrEqualTo(1.0,
            "ConfidenceScore must not exceed 1.0");
    }

    // ════════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════════

    private HttpClient CreateBentonClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx8CostForgeRealFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx8-benton-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId",
            Cx8CostForgeRealFactory.BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id",
            Cx8CostForgeRealFactory.PluginAllPermsId.ToString());
        return client;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: Two Benton properties with different values, real CostForgeService
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx8CostForgeRealFactory : WebApplicationFactory<ApiProgram>
{
    // ── County IDs ───────────────────────────────────────────────────────
    public static readonly Guid BentonCountyId = Guid.Parse("c8c8c8c8-0000-0000-0000-c8c8c8c8c8c8");

    // ── Property IDs ─────────────────────────────────────────────────────
    public static readonly Guid PropertyAId = Guid.Parse("c8c8c8c8-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public static readonly Guid PropertyBId = Guid.Parse("c8c8c8c8-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    // ── Parcel identifiers ──────────────────────────────────────────────
    public const string PropertyAParcelNumber = "CX8-BN-SMALL-001";
    public const string PropertyBParcelNumber = "CX8-BN-LARGE-002";

    // ── Plugin for permission pass-through ───────────────────────────────
    public static readonly Guid PluginAllPermsId = Guid.Parse("c8c8c8c8-ffff-ffff-ffff-ffffffffffff");

    public const string AuthScheme = "Cx8TestAuth";

    private static readonly string[] AllPermissions =
    [
        "read:properties", "read:parcel", "access:costforge",
        "calculate:property-cost", "calculate:batch-valuation",
        "read:cost-breakdown", "read:cost-comparison", "read:cost-forecast",
        "read:cost-factors", "read:cost-matrix", "read:system-status",
        "read:ai-agents", "manage:ai-agents", "read:performance-metrics",
        "sync:external-systems",
    ];

    private readonly string _databaseName = $"cx8-real-{Guid.NewGuid():N}";
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
                ["JwtSettings:SecretKey"] = "CX8_TEST_SECRET_KEY_01234567890123456789012345678",
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

            // ── Real CostForgeService (NOT mocked — that's the point of CX-8) ──
            // ICostForgeService uses the real implementation from DI (registered in Program.cs).
            // Only ICostForgeAIService is mocked (external AI dependency not needed for calculation).
            services.RemoveAll<ICostForgeAIService>();
            services.AddScoped(_ => new Mock<ICostForgeAIService>().Object);

            // ── Mock IModuleOrchestrationService ──
            services.RemoveAll<IModuleOrchestrationService>();
            services.AddScoped(_ => new Mock<IModuleOrchestrationService>().Object);

            // ── Test auth handler ────────────────────────────────────
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = AuthScheme;
                options.DefaultChallengeScheme = AuthScheme;
                options.DefaultScheme = AuthScheme;
            })
            .AddScheme<AuthenticationSchemeOptions, Cx8TestAuthHandler>(AuthScheme, _ => { });

            // ── Mock IPluginRepository ───────────────────────────────
            var pluginRepo = new Mock<IPluginRepository>();
            pluginRepo.Setup(r => r.GetByIdAsync(PluginAllPermsId))
                .ReturnsAsync(new Plugin
                {
                    Id = PluginAllPermsId,
                    Name = "CX8-AllPerms",
                    Version = "1.0.0",
                    Description = "CX-8 test plugin with all CostForge permissions",
                    Category = "test",
                    AuthorId = "cx8-test",
                    Status = TerraFusion.Core.Models.PluginStatus.Approved,
                    PackageUrl = "https://test.local/pkg",
                    IconUrl = "https://test.local/icon",
                    PermissionsJson = JsonSerializer.Serialize(AllPermissions),
                });
            services.RemoveAll<IPluginRepository>();
            services.AddScoped(_ => pluginRepo.Object);
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

            // ── Seed County ────────────────────────────────────────
            if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
            {
                db.Counties.Add(new County
                {
                    Id = BentonCountyId,
                    Name = "Benton",
                    State = "WA",
                    FipsCode = "005",
                });
                await db.SaveChangesAsync();
            }

            // ── Seed Property A: small residential (120k land, 80k improvement) ──
            if (!await db.Properties.AnyAsync(p => p.Id == PropertyAId))
            {
                db.Properties.Add(new Property
                {
                    Id = PropertyAId,
                    PropertyId = "CX8-BENTON-A",
                    ParcelId = "CX8-BN-A-PID",
                    ParcelNumber = PropertyAParcelNumber,
                    Address = "100 Vine St, Kennewick, WA",
                    CountyId = BentonCountyId,
                    AssessedValue = 200000m,
                    LandValue = 120000m,
                    ImprovementValue = 80000m,
                    MarketValue = 210000m,
                    TaxYear = 2026,
                    AssessmentDate = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow,
                });

                // ── Seed Property B: large residential (250k land, 400k improvement) ──
                db.Properties.Add(new Property
                {
                    Id = PropertyBId,
                    PropertyId = "CX8-BENTON-B",
                    ParcelId = "CX8-BN-B-PID",
                    ParcelNumber = PropertyBParcelNumber,
                    Address = "500 Columbia Dr, Richland, WA",
                    CountyId = BentonCountyId,
                    AssessedValue = 650000m,
                    LandValue = 250000m,
                    ImprovementValue = 400000m,
                    MarketValue = 680000m,
                    TaxYear = 2026,
                    AssessmentDate = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow,
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Test auth handler — Benton county identity from headers
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx8TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public Cx8TestAuthHandler(
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

        var userId = Request.Headers["X-Test-UserId"].FirstOrDefault() ?? "cx8-user";
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

        if (!string.IsNullOrEmpty(countyId))
            claims.Add(new Claim("countyId", countyId));
        if (!string.IsNullOrEmpty(countyCode))
            claims.Add(new Claim("countyCode", countyCode));

        if (!string.IsNullOrEmpty(roleHeader))
        {
            foreach (var role in roleHeader.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
