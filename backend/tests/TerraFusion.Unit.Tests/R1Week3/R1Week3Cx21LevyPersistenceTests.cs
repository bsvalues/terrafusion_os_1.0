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

namespace TerraFusion.Unit.Tests.R1Week3;

// ─────────────────────────────────────────────────────────────────────────────
// CX-21: Levy Calculation Persistence + Retrieval
//
// Proves that:
//   1. POST /api/levy-calculation/calculate-rate persists a TaxLevy record
//   2. Different inputs produce different outputs (input-variable)
//   3. GET /api/levy-calculation/history returns persisted records
//   4. History is county-isolated (Benton sees Benton, not King)
//   5. TaxLevyId in response is non-null and retrievable
//
// Lock doc: backend/docs/r1-week3-cx21-levy-persistence-report.md
// Filter:   dotnet test --filter "FullyQualifiedName~R1Week3Cx21"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week3")]
[Trait("Category", "CX21")]
[Trait("Category", "Integration")]
public sealed class R1Week3Cx21LevyPersistenceTests
    : IClassFixture<Cx21LevyPersistenceFactory>, IAsyncLifetime
{
    private readonly Cx21LevyPersistenceFactory _factory;

    public R1Week3Cx21LevyPersistenceTests(Cx21LevyPersistenceFactory factory)
        => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ════════════════════════════════════════════════════════════════════
    // TEST 1: Calculate returns non-zero rate and persists TaxLevyId
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Levy_Calculate_ReturnsNonZeroAndPersists()
    {
        using var client = CreateBentonClient();
        var payload = MakePayload("DIST-A", 1_500_000, 45_000);

        var response = await client.PostAsync("/api/levy-calculation/calculate-rate",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await Deserialize(response);

        result.GetProperty("aiOptimalRate").GetDouble().Should().BeGreaterThan(0,
            "Calculated rate must be non-zero for valid inputs");
        result.GetProperty("projectedRevenue").GetDouble().Should().BeGreaterThan(0,
            "Projected revenue must be non-zero");
        result.GetProperty("taxLevyId").GetString().Should().NotBeNull(
            "Persisted TaxLevyId must be returned in response");

        var taxLevyId = Guid.Parse(result.GetProperty("taxLevyId").GetString()!);
        taxLevyId.Should().NotBe(Guid.Empty, "TaxLevyId must not be empty GUID");
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 2: Different inputs → different outputs (input-variable)
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Levy_DifferentInputs_ProduceDifferentOutputs()
    {
        using var client = CreateBentonClient();

        // District A: small budget / large AV
        var responseA = await client.PostAsync("/api/levy-calculation/calculate-rate",
            new StringContent(
                MakePayload("DIST-SMALL", 2_000_000, 20_000),
                Encoding.UTF8, "application/json"));
        responseA.StatusCode.Should().Be(HttpStatusCode.OK);
        var resultA = await Deserialize(responseA);

        // District B: large budget / small AV
        var responseB = await client.PostAsync("/api/levy-calculation/calculate-rate",
            new StringContent(
                MakePayload("DIST-LARGE", 500_000, 40_000),
                Encoding.UTF8, "application/json"));
        responseB.StatusCode.Should().Be(HttpStatusCode.OK);
        var resultB = await Deserialize(responseB);

        var rateA = resultA.GetProperty("aiOptimalRate").GetDouble();
        var rateB = resultB.GetProperty("aiOptimalRate").GetDouble();
        var revenueA = resultA.GetProperty("projectedRevenue").GetDouble();
        var revenueB = resultB.GetProperty("projectedRevenue").GetDouble();

        rateA.Should().NotBe(rateB,
            "Different AV/budget combinations must produce different rates");
        revenueA.Should().NotBe(revenueB,
            "Different AV/budget combinations must produce different revenue");
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 3: Calculate + retrieve history (round-trip)
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Levy_CalculateThenHistory_RoundTrip()
    {
        using var client = CreateBentonClient();
        var districtId = "DIST-RT-" + Guid.NewGuid().ToString()[..8];
        var payload = MakePayload(districtId, 1_000_000, 30_000);

        // Calculate
        var calcResponse = await client.PostAsync("/api/levy-calculation/calculate-rate",
            new StringContent(payload, Encoding.UTF8, "application/json"));
        calcResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var calcResult = await Deserialize(calcResponse);
        var taxLevyId = calcResult.GetProperty("taxLevyId").GetString()!;
        var calculatedRate = calcResult.GetProperty("aiOptimalRate").GetDouble();

        // Retrieve history
        var historyResponse = await client.GetAsync(
            $"/api/levy-calculation/history?districtId={districtId}");
        historyResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var historyJson = await historyResponse.Content.ReadAsStringAsync();
        var history = JsonSerializer.Deserialize<JsonElement>(historyJson);

        history.GetArrayLength().Should().BeGreaterOrEqualTo(1,
            "History must contain at least the just-calculated record");

        // Find our record
        var found = false;
        foreach (var record in history.EnumerateArray())
        {
            if (record.GetProperty("taxLevyId").GetString() == taxLevyId)
            {
                record.GetProperty("taxRate").GetDouble().Should().BeApproximately(
                    calculatedRate, 0.001,
                    "Persisted TaxRate must match the calculated rate");
                record.GetProperty("taxingDistrict").GetString().Should().Be(districtId);
                found = true;
                break;
            }
        }

        found.Should().BeTrue("The calculated TaxLevy must appear in history");
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 4: History is county-isolated (Benton ≠ King)
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Levy_History_CountyIsolated()
    {
        // Calculate a levy as Benton
        using var bentonClient = CreateBentonClient();
        var bentonPayload = MakePayload("DIST-BENTON-ISO", 1_000_000, 25_000);
        var bentonCalc = await bentonClient.PostAsync("/api/levy-calculation/calculate-rate",
            new StringContent(bentonPayload, Encoding.UTF8, "application/json"));
        bentonCalc.StatusCode.Should().Be(HttpStatusCode.OK);
        var bentonResult = await Deserialize(bentonCalc);
        var bentonTaxLevyId = bentonResult.GetProperty("taxLevyId").GetString()!;

        // Retrieve history as King — should NOT see Benton's record
        using var kingClient = CreateKingClient();
        var kingHistory = await kingClient.GetAsync("/api/levy-calculation/history");
        kingHistory.StatusCode.Should().Be(HttpStatusCode.OK);

        var kingHistoryJson = await kingHistory.Content.ReadAsStringAsync();
        var kingRecords = JsonSerializer.Deserialize<JsonElement>(kingHistoryJson);

        foreach (var record in kingRecords.EnumerateArray())
        {
            record.GetProperty("taxLevyId").GetString().Should().NotBe(bentonTaxLevyId,
                "King county must not see Benton county levy records");
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 5: Statutory compliance flag is correct
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Levy_StatutoryCompliance_FlaggedCorrectly()
    {
        using var client = CreateBentonClient();

        // Rate within limit: $20,000 budget / $1,000,000 AV = 20 per $1000 → over most limits
        // county-regular limit = 1.80 per $1000
        // Budget that yields ~1.5 per $1000: budget = (1.5 / 1000) * AV = 1500
        var compliantPayload = MakePayload("DIST-COMPLIANT", 1_000_000, 1_500);
        var compliantResponse = await client.PostAsync("/api/levy-calculation/calculate-rate",
            new StringContent(compliantPayload, Encoding.UTF8, "application/json"));
        compliantResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var compliantResult = await Deserialize(compliantResponse);
        compliantResult.GetProperty("isCompliant").GetBoolean().Should().BeTrue(
            "Rate ~1.5 per $1000 should be within county-regular limit of 1.80");

        // Rate over limit: high budget → rate > 1.80
        var overPayload = MakePayload("DIST-OVER", 1_000_000, 5_000);
        var overResponse = await client.PostAsync("/api/levy-calculation/calculate-rate",
            new StringContent(overPayload, Encoding.UTF8, "application/json"));
        overResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var overResult = await Deserialize(overResponse);
        overResult.GetProperty("isCompliant").GetBoolean().Should().BeFalse(
            "Rate ~5.0 per $1000 should exceed county-regular limit of 1.80");
    }

    // ════════════════════════════════════════════════════════════════════
    // TEST 6: Batch calculate persists multiple records
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Levy_BatchCalculate_PersistsMultipleRecords()
    {
        using var client = CreateBentonClient();
        var batchPayload = JsonSerializer.Serialize(new[]
        {
            new { DistrictId = "DIST-BATCH-1", DistrictName = "Batch 1",
                  AssessedValue = 1_000_000.0, BudgetAmount = 10_000.0,
                  DistrictType = "county-regular", MeasureType = "regular", CountyCode = "BENTON" },
            new { DistrictId = "DIST-BATCH-2", DistrictName = "Batch 2",
                  AssessedValue = 2_000_000.0, BudgetAmount = 30_000.0,
                  DistrictType = "school-district", MeasureType = "regular", CountyCode = "BENTON" },
        });

        var response = await client.PostAsync("/api/levy-calculation/calculate-batch",
            new StringContent(batchPayload, Encoding.UTF8, "application/json"));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(json);
        result.GetProperty("successCount").GetInt32().Should().Be(2);

        // Verify records appear in history
        var historyResponse = await client.GetAsync("/api/levy-calculation/history");
        historyResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var historyJson = await historyResponse.Content.ReadAsStringAsync();
        var history = JsonSerializer.Deserialize<JsonElement>(historyJson);

        // Should find at least the 2 batch records
        var batchDistricts = new HashSet<string>();
        foreach (var record in history.EnumerateArray())
        {
            var dist = record.GetProperty("taxingDistrict").GetString();
            if (dist == "DIST-BATCH-1" || dist == "DIST-BATCH-2")
                batchDistricts.Add(dist);
        }

        batchDistricts.Should().Contain("DIST-BATCH-1");
        batchDistricts.Should().Contain("DIST-BATCH-2");
    }

    // ════════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════════

    private static string MakePayload(string districtId, double assessedValue, double budgetAmount)
    {
        return JsonSerializer.Serialize(new
        {
            DistrictId = districtId,
            DistrictName = $"Test District {districtId}",
            AssessedValue = assessedValue,
            BudgetAmount = budgetAmount,
            DistrictType = "county-regular",
            MeasureType = "regular",
            CountyCode = "BENTON"
        });
    }

    private static async Task<JsonElement> Deserialize(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<JsonElement>(json);
    }

    private HttpClient CreateBentonClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx21LevyPersistenceFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx21-benton-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId",
            Cx21LevyPersistenceFactory.BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor,LevyClerk");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id",
            Cx21LevyPersistenceFactory.PluginAllPermsId.ToString());
        return client;
    }

    private HttpClient CreateKingClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx21LevyPersistenceFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx21-king-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId",
            Cx21LevyPersistenceFactory.KingCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "KING");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor,LevyClerk");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id",
            Cx21LevyPersistenceFactory.PluginAllPermsId.ToString());
        return client;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: Two counties, InMemory DB, real LevyCalculationController
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx21LevyPersistenceFactory : WebApplicationFactory<ApiProgram>
{
    public static readonly Guid BentonCountyId = Guid.Parse("21210021-1111-1111-1111-111111111111");
    public static readonly Guid KingCountyId = Guid.Parse("21210021-2222-2222-2222-222222222222");
    public static readonly Guid PluginAllPermsId = Guid.Parse("21212121-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    public const string AuthScheme = "Cx21TestAuth";

    private static readonly string[] AllPermissions =
    [
        "read:properties", "read:parcel", "access:costforge",
        "calculate:property-cost", "calculate:batch-valuation",
        "read:cost-breakdown", "read:cost-comparison", "read:cost-forecast",
        "read:cost-factors", "read:cost-matrix", "read:system-status",
        "read:ai-agents", "manage:ai-agents", "read:performance-metrics",
        "sync:external-systems", "read:dossier", "write:dossier",
    ];

    private readonly string _databaseName = $"cx21-levy-{Guid.NewGuid():N}";
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
                ["JwtSettings:SecretKey"] = "CX21_TEST_SECRET_KEY_01234567890123456789012345678",
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

            // ── Stubs for dependencies not under test ────────────────
            services.RemoveAll<ICostForgeService>();
            services.RemoveAll<ICostForgeAIService>();
            services.AddScoped(_ => new Mock<ICostForgeService>().Object);
            services.AddScoped(_ => new Mock<ICostForgeAIService>().Object);

            services.RemoveAll<IModuleOrchestrationService>();
            services.AddScoped(_ => new Mock<IModuleOrchestrationService>().Object);

            // ── Test auth handler ────────────────────────────────────
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = AuthScheme;
                options.DefaultChallengeScheme = AuthScheme;
                options.DefaultScheme = AuthScheme;
            })
            .AddScheme<AuthenticationSchemeOptions, Cx21TestAuthHandler>(AuthScheme, _ => { });

            // ── Mock IPluginRepository ───────────────────────────────
            var pluginRepo = new Mock<IPluginRepository>();
            pluginRepo.Setup(r => r.GetByIdAsync(PluginAllPermsId))
                .ReturnsAsync(new Plugin
                {
                    Id = PluginAllPermsId,
                    Name = "CX21-AllPerms",
                    Version = "1.0.0",
                    Description = "CX-21 test plugin with all permissions",
                    Category = "test",
                    AuthorId = "cx21-test",
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

            if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
            {
                db.Counties.Add(new County
                {
                    Id = BentonCountyId,
                    Name = "Benton",
                    State = "WA",
                    FipsCode = "005",
                });
                db.Counties.Add(new County
                {
                    Id = KingCountyId,
                    Name = "King",
                    State = "WA",
                    FipsCode = "033",
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
// Test auth handler — county identity from headers
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx21TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public Cx21TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authValues))
            return System.Threading.Tasks.Task.FromResult(AuthenticateResult.NoResult());

        if (!AuthenticationHeaderValue.TryParse(authValues.ToString(), out var authHeader))
            return System.Threading.Tasks.Task.FromResult(AuthenticateResult.NoResult());

        if (!string.Equals(authHeader.Scheme, Scheme.Name, StringComparison.OrdinalIgnoreCase))
            return System.Threading.Tasks.Task.FromResult(AuthenticateResult.NoResult());

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
        return System.Threading.Tasks.Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
