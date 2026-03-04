using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
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
using TerraFusion.Core.Services;
using Xunit;
using ApiProgram = TerraFusion.API.Program;
using County = TerraFusion.Core.Entities.County;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using DossierNote = TerraFusion.Core.Entities.DossierNote;
using Property = TerraFusion.Core.Entities.Property;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week4;

[Trait("Category", "R1Week4")]
[Trait("Category", "CX16")]
[Trait("Category", "Integration")]
public sealed class R1Week4Cx16AuthorizationGateIntegrationTests
    : IClassFixture<Cx16AuthorizationGateFactory>, IAsyncLifetime
{
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private const string BentonParcelId = "CX16-BENTON-001";
    private const string YakimaParcelId = "CX16-YAKIMA-001";

    private readonly Cx16AuthorizationGateFactory _factory;

    public R1Week4Cx16AuthorizationGateIntegrationTests(Cx16AuthorizationGateFactory factory)
    {
        _factory = factory;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    public Task InitializeAsync()
    {
        return _factory.EnsureSeedDataAsync();
    }

    [Fact]
    public async Task CostForge_Unauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/costforge/calculate", new
        {
            PropertyId = Guid.Empty,
            ParcelNumber = BentonParcelId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Levy_Unauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/levy-calculation/calculate-rate", new
        {
            DistrictId = "CX16-D1",
            DistrictName = "District One",
            AssessedValue = 1000000,
            BudgetAmount = 10000,
            DistrictType = "county-regular",
            MeasureType = "regular",
            CountyCode = "BENTON",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Atlas_Unauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/atlas/parcels/{BentonParcelId}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DossierPost_Unauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync($"/api/dossier/{BentonParcelId}/notes", new
        {
            Content = "cx16 unauth test note",
            Type = "case_note",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CostForge_SameCountyParcelNumberPath_Returns200()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");
        var response = await client.PostAsJsonAsync("/api/costforge/calculate", new
        {
            PropertyId = Guid.Empty,
            ParcelNumber = BentonParcelId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CostForge_CountyTokenMismatch_Returns403()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");
        var response = await client.PostAsJsonAsync("/api/costforge/calculate", new
        {
            PropertyId = Guid.Empty,
            ParcelNumber = BentonParcelId,
            CountyCode = "YAKIMA",
            Region = "YAKIMA",
            BuildingType = "SFR",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CostForge_CountyMatchesButCrossCountyParcel_Returns404()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");
        var response = await client.PostAsJsonAsync("/api/costforge/calculate", new
        {
            PropertyId = Guid.Empty,
            ParcelNumber = YakimaParcelId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Atlas_CrossCountyParcel_Returns404()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");
        var response = await client.GetAsync($"/api/atlas/parcels/{YakimaParcelId}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Dossier_CrossCountyNotesRead_Returns200WithEmptyNotes()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");
        var response = await client.GetAsync($"/api/dossier/{YakimaParcelId}/notes");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        var root = document.RootElement;
        root.GetProperty("parcelId").GetString().Should().Be(YakimaParcelId);
        root.GetProperty("total").GetInt32().Should().Be(0);
        root.GetProperty("notes").GetArrayLength().Should().Be(0);
    }

    private HttpClient CreateAuthenticatedClient(Guid countyId, string countyCode, string role = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx16AuthorizationGateFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx16-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId", countyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", countyCode);
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", role);
        return client;
    }
}

public sealed class Cx16AuthorizationGateFactory : WebApplicationFactory<ApiProgram>
{
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid YakimaCountyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private const string BentonParcelId = "CX16-BENTON-001";
    private const string YakimaParcelId = "CX16-YAKIMA-001";

    public const string AuthScheme = "TestAuth";

    private readonly string _databaseName = $"cx16-auth-gate-{Guid.NewGuid():N}";
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
                ["JwtSettings:SecretKey"] = "CX16_TEST_SECRET_KEY_012345678901234567890123456789",
                ["JwtSettings:Issuer"] = "TerraFusionTestIssuer",
                ["JwtSettings:Audience"] = "TerraFusionTestAudience",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<DataDbContext>>();
            services.RemoveAll<DataDbContext>();
            services.AddDbContext<DataDbContext>(options => options.UseInMemoryDatabase(_databaseName));

            RegisterCostForgeServiceStubs(services);

            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = AuthScheme;
                    options.DefaultChallengeScheme = AuthScheme;
                    options.DefaultScheme = AuthScheme;
                })
                .AddScheme<AuthenticationSchemeOptions, Cx16TestAuthHandler>(AuthScheme, _ => { });

            services.AddAuthorization(options =>
            {
                var authenticated = new AuthorizationPolicyBuilder(AuthScheme)
                    .RequireAuthenticatedUser()
                    .Build();

                options.DefaultPolicy = authenticated;
                options.AddPolicy("RequiresPermission_access:costforge", authenticated);
                options.AddPolicy("RequiresPermission_calculate:property-cost", authenticated);
                options.AddPolicy("RequiresPermission_read:parcel", authenticated);
                options.AddPolicy("RequiresPermission_write:dossier", authenticated);
                options.AddPolicy("RequiresPermission_read:dossier", authenticated);
            });
        });
    }

    public async Task EnsureSeedDataAsync()
    {
        await _seedLock.WaitAsync();
        try
        {
            if (_seeded)
                return;

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

            if (!await db.Properties.AnyAsync(p => p.Id == Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")))
            {
                db.Properties.Add(new Property
                {
                    Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    PropertyId = "CX16-PROP-BENTON",
                    ParcelId = BentonParcelId,
                    ParcelNumber = BentonParcelId,
                    Address = "100 Benton Ave",
                    PropertyType = "SFR",
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

            if (!await db.Properties.AnyAsync(p => p.Id == Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")))
            {
                db.Properties.Add(new Property
                {
                    Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    PropertyId = "CX16-PROP-YAKIMA",
                    ParcelId = YakimaParcelId,
                    ParcelNumber = YakimaParcelId,
                    Address = "200 Yakima Ave",
                    PropertyType = "SFR",
                    AssessedValue = 300000,
                    LandValue = 120000,
                    ImprovementValue = 180000,
                    MarketValue = 330000,
                    AssessmentDate = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow,
                    TaxYear = 2026,
                    CountyId = YakimaCountyId,
                });
            }

            if (!await db.DossierNotes.AnyAsync(n => n.Id == Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")))
            {
                db.DossierNotes.Add(new DossierNote
                {
                    Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    ParcelId = YakimaParcelId,
                    Content = "yakima county note",
                    NoteType = "case_note",
                    CountyId = YakimaCountyId,
                    CreatedBy = "yakima-user",
                    CreatedAt = DateTime.UtcNow,
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
                TotalCost = 123456m,
                LandValue = 50000m,
                ImprovementValue = 73456m,
                MarketAdjustment = 0m,
                ConfidenceScore = 0.95,
                AnalysisDate = DateTime.UtcNow,
                AnalysisMethod = "cx16-test",
            });

        services.AddScoped(_ => costForgeMock.Object);
        services.AddScoped(_ => new Mock<ICostForgeAIService>().Object);
    }
}

public sealed class Cx16TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public Cx16TestAuthHandler(
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

        var userId = Request.Headers["X-Test-UserId"].FirstOrDefault() ?? "cx16-user";
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
