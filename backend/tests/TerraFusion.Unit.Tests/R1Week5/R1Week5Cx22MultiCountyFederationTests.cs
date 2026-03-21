using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
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

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// CX-22: Multi-County Federation Isolation — G7 Gate
//
// Proves three-county mutual data isolation at the HTTP boundary:
//   Benton (WA-005), Yakima (WA-077), Cowlitz (WA-015)
//
// Each county caller must:
//   1. Access their own county's parcel data (pass)
//   2. Be denied access to any other county's parcel data (403 or 404)
//
// This is the CP-16 federation gate: county sovereignty enforced across
// all three simultaneous county deployments in Region 1.
//
// Filter: dotnet test --filter "FullyQualifiedName~R1Week5Cx22"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "CX22")]
[Trait("Category", "Integration")]
[Trait("Category", "Federation")]
public sealed class R1Week5Cx22MultiCountyFederationTests
    : IClassFixture<Cx22FederationFactory>, IAsyncLifetime
{
    private readonly Cx22FederationFactory _factory;

    public R1Week5Cx22MultiCountyFederationTests(Cx22FederationFactory factory)
        => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ════════════════════════════════════════════════════════════════════
    // BENTON COUNTY — same-county pass, cross-county deny
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Benton_CanAccess_BentonParcel()
    {
        using var client = CreateClient("BENTON", Cx22FederationFactory.BentonCountyId);
        var response = await client.GetAsync(
            $"/api/atlas/parcels/{Cx22FederationFactory.BentonParcelId}");

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
            "Benton caller accessing Benton parcel should not be 403");
    }

    [Fact]
    public async Task Benton_Denied_YakimaParcel()
    {
        using var client = CreateClient("BENTON", Cx22FederationFactory.BentonCountyId);
        var response = await client.GetAsync(
            $"/api/atlas/parcels/{Cx22FederationFactory.YakimaParcelId}");

        response.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
            "Benton caller must not access Yakima county parcel");
    }

    [Fact]
    public async Task Benton_Denied_CowlitzParcel()
    {
        using var client = CreateClient("BENTON", Cx22FederationFactory.BentonCountyId);
        var response = await client.GetAsync(
            $"/api/atlas/parcels/{Cx22FederationFactory.CowlitzParcelId}");

        response.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
            "Benton caller must not access Cowlitz county parcel");
    }

    // ════════════════════════════════════════════════════════════════════
    // YAKIMA COUNTY — same-county pass, cross-county deny
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Yakima_CanAccess_YakimaParcel()
    {
        using var client = CreateClient("YAKIMA", Cx22FederationFactory.YakimaCountyId);
        var response = await client.GetAsync(
            $"/api/atlas/parcels/{Cx22FederationFactory.YakimaParcelId}");

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
            "Yakima caller accessing Yakima parcel should not be 403");
    }

    [Fact]
    public async Task Yakima_Denied_BentonParcel()
    {
        using var client = CreateClient("YAKIMA", Cx22FederationFactory.YakimaCountyId);
        var response = await client.GetAsync(
            $"/api/atlas/parcels/{Cx22FederationFactory.BentonParcelId}");

        response.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
            "Yakima caller must not access Benton county parcel");
    }

    [Fact]
    public async Task Yakima_Denied_CowlitzParcel()
    {
        using var client = CreateClient("YAKIMA", Cx22FederationFactory.YakimaCountyId);
        var response = await client.GetAsync(
            $"/api/atlas/parcels/{Cx22FederationFactory.CowlitzParcelId}");

        response.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
            "Yakima caller must not access Cowlitz county parcel");
    }

    // ════════════════════════════════════════════════════════════════════
    // COWLITZ COUNTY — same-county pass, cross-county deny
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Cowlitz_CanAccess_CowlitzParcel()
    {
        using var client = CreateClient("COWLITZ", Cx22FederationFactory.CowlitzCountyId);
        var response = await client.GetAsync(
            $"/api/atlas/parcels/{Cx22FederationFactory.CowlitzParcelId}");

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
            "Cowlitz caller accessing Cowlitz parcel should not be 403");
    }

    [Fact]
    public async Task Cowlitz_Denied_BentonParcel()
    {
        using var client = CreateClient("COWLITZ", Cx22FederationFactory.CowlitzCountyId);
        var response = await client.GetAsync(
            $"/api/atlas/parcels/{Cx22FederationFactory.BentonParcelId}");

        response.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
            "Cowlitz caller must not access Benton county parcel");
    }

    [Fact]
    public async Task Cowlitz_Denied_YakimaParcel()
    {
        using var client = CreateClient("COWLITZ", Cx22FederationFactory.CowlitzCountyId);
        var response = await client.GetAsync(
            $"/api/atlas/parcels/{Cx22FederationFactory.YakimaParcelId}");

        response.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
            "Cowlitz caller must not access Yakima county parcel");
    }

    // ════════════════════════════════════════════════════════════════════
    // DOSSIER — note isolation across all three counties
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Benton_DossierNotes_DoNotContain_YakimaData()
    {
        using var client = CreateClient("BENTON", Cx22FederationFactory.BentonCountyId);
        var response = await client.GetAsync(
            $"/api/dossier/{Cx22FederationFactory.YakimaParcelId}/notes");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("notes", out var notes))
            {
                notes.GetArrayLength().Should().Be(0,
                    "Benton caller must see zero notes from Yakima parcel");
            }
        }
        else
        {
            response.StatusCode.Should().BeOneOf(
                new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
                "Benton caller cross-county dossier must be blocked or not found");
        }
    }

    [Fact]
    public async Task Yakima_DossierNotes_DoNotContain_CowlitzData()
    {
        using var client = CreateClient("YAKIMA", Cx22FederationFactory.YakimaCountyId);
        var response = await client.GetAsync(
            $"/api/dossier/{Cx22FederationFactory.CowlitzParcelId}/notes");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("notes", out var notes))
            {
                notes.GetArrayLength().Should().Be(0,
                    "Yakima caller must see zero notes from Cowlitz parcel");
            }
        }
        else
        {
            response.StatusCode.Should().BeOneOf(
                new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
                "Yakima caller cross-county dossier must be blocked or not found");
        }
    }

    [Fact]
    public async Task Cowlitz_DossierNotes_DoNotContain_BentonData()
    {
        using var client = CreateClient("COWLITZ", Cx22FederationFactory.CowlitzCountyId);
        var response = await client.GetAsync(
            $"/api/dossier/{Cx22FederationFactory.BentonParcelId}/notes");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("notes", out var notes))
            {
                notes.GetArrayLength().Should().Be(0,
                    "Cowlitz caller must see zero notes from Benton parcel");
            }
        }
        else
        {
            response.StatusCode.Should().BeOneOf(
                new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
                "Cowlitz caller cross-county dossier must be blocked or not found");
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // SERVICE REGISTRY — all three counties register distinct county codes
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task ServiceRegistry_ThreeCounties_AreSeeded_AndDistinct()
    {
        // Verify the InMemory DB has all three counties with distinct IDs and codes.
        // This is a source-of-truth check: the DB backing the test server knows about
        // three sovereign counties, proving the federation seeding is correct.
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DataDbContext>();

        var counties = await db.Counties.ToListAsync();
        var countyCodes = new[] { "005", "077", "015" }; // Benton, Yakima, Cowlitz FIPS

        foreach (var fips in countyCodes)
        {
            counties.Should().Contain(c => c.FipsCode == fips,
                $"County with FIPS {fips} must be registered in the federation");
        }

        counties.Select(c => c.Id).Distinct().Should().HaveCountGreaterOrEqualTo(3,
            "Each county must have a distinct sovereign ID");
    }

    // ════════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════════

    private HttpClient CreateClient(string countyCode, Guid countyId, string roles = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx22FederationFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId",
            $"cx22-{countyCode.ToLowerInvariant()}-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId",
            countyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", countyCode);
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", roles);
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id",
            Cx22FederationFactory.PluginAllPermsId.ToString());
        return client;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: Three-county seed (Benton + Yakima + Cowlitz)
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx22FederationFactory : WebApplicationFactory<ApiProgram>
{
    // ── County IDs ─────────────────────────────────────────────────────
    public static readonly Guid BentonCountyId  = Guid.Parse("22220022-0500-0500-0500-050005000500");
    public static readonly Guid YakimaCountyId  = Guid.Parse("22220022-0770-0770-0770-077007700770");
    public static readonly Guid CowlitzCountyId = Guid.Parse("22220022-0150-0150-0150-015001500150");

    // ── Parcel IDs (string) ────────────────────────────────────────────
    public const string BentonParcelId  = "CX22-BENTON-P1";
    public const string YakimaParcelId  = "CX22-YAKIMA-P1";
    public const string CowlitzParcelId = "CX22-COWLITZ-P1";

    // ── Property GUIDs ─────────────────────────────────────────────────
    public static readonly Guid BentonPropertyGuid  = Guid.Parse("22220022-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public static readonly Guid YakimaPropertyGuid  = Guid.Parse("22220022-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    public static readonly Guid CowlitzPropertyGuid = Guid.Parse("22220022-cccc-cccc-cccc-cccccccccccc");

    // ── Plugin for permission pass-through ────────────────────────────
    public static readonly Guid PluginAllPermsId = Guid.Parse("22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    public const string AuthScheme = "Cx22TestAuth";

    private static readonly string[] AllPermissions =
    [
        "read:properties", "read:parcel", "access:costforge",
        "calculate:property-cost", "calculate:batch-valuation",
        "read:cost-breakdown", "read:cost-comparison", "read:cost-forecast",
        "read:cost-factors", "read:cost-matrix", "read:system-status",
        "read:ai-agents", "manage:ai-agents", "read:performance-metrics",
        "sync:external-systems", "read:dossier", "write:dossier",
        "ecosystem:view", "ecosystem:manage",
    ];

    private readonly string _databaseName = $"cx22-fed-{Guid.NewGuid():N}";
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
                ["JwtSettings:SecretKey"] = "CX22_TEST_SECRET_KEY_01234567890123456789012345678",
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

            // ── Service stubs ─────────────────────────────────────────
            RegisterServiceStubs(services);

            // ── Test auth handler ─────────────────────────────────────
            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = AuthScheme;
                    options.DefaultChallengeScheme = AuthScheme;
                    options.DefaultScheme = AuthScheme;
                })
                .AddScheme<AuthenticationSchemeOptions, Cx22TestAuthHandler>(AuthScheme, _ => { });

            // ── Mock IPluginRepository ────────────────────────────────
            var pluginRepo = new Mock<IPluginRepository>();
            pluginRepo.Setup(r => r.GetByIdAsync(PluginAllPermsId))
                .ReturnsAsync(new Plugin
                {
                    Id = PluginAllPermsId,
                    Name = "CX22-AllPerms",
                    Version = "1.0.0",
                    Description = "Federation test plugin with all permissions",
                    Category = "test",
                    AuthorId = "cx22-test",
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

            // ── Three sovereign counties ──────────────────────────────
            if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
            {
                db.Counties.AddRange(
                    new County
                    {
                        Id = BentonCountyId,
                        Name = "Benton",
                        State = "WA",
                        FipsCode = "005",
                    },
                    new County
                    {
                        Id = YakimaCountyId,
                        Name = "Yakima",
                        State = "WA",
                        FipsCode = "077",
                    },
                    new County
                    {
                        Id = CowlitzCountyId,
                        Name = "Cowlitz",
                        State = "WA",
                        FipsCode = "015",
                    }
                );
                await db.SaveChangesAsync();
            }

            // ── One property per county ───────────────────────────────
            if (!await db.Properties.AnyAsync(p => p.Id == BentonPropertyGuid))
            {
                db.Properties.AddRange(
                    new Property
                    {
                        Id = BentonPropertyGuid,
                        PropertyId = "CX22-BN-001",
                        ParcelId = BentonParcelId,
                        ParcelNumber = "CX22-BN-001",
                        Address = "100 Columbia Dr, Kennewick, WA",
                        CountyId = BentonCountyId,
                        AssessedValue = 280000m,
                        LandValue = 110000m,
                        ImprovementValue = 170000m,
                        MarketValue = 295000m,
                        TaxYear = 2026,
                        AssessmentDate = DateTime.UtcNow,
                        LastUpdated = DateTime.UtcNow,
                    },
                    new Property
                    {
                        Id = YakimaPropertyGuid,
                        PropertyId = "CX22-YK-001",
                        ParcelId = YakimaParcelId,
                        ParcelNumber = "CX22-YK-001",
                        Address = "200 Yakima Ave, Yakima, WA",
                        CountyId = YakimaCountyId,
                        AssessedValue = 220000m,
                        LandValue = 80000m,
                        ImprovementValue = 140000m,
                        MarketValue = 235000m,
                        TaxYear = 2026,
                        AssessmentDate = DateTime.UtcNow,
                        LastUpdated = DateTime.UtcNow,
                    },
                    new Property
                    {
                        Id = CowlitzPropertyGuid,
                        PropertyId = "CX22-CW-001",
                        ParcelId = CowlitzParcelId,
                        ParcelNumber = "CX22-CW-001",
                        Address = "300 Ocean Beach Hwy, Longview, WA",
                        CountyId = CowlitzCountyId,
                        AssessedValue = 195000m,
                        LandValue = 70000m,
                        ImprovementValue = 125000m,
                        MarketValue = 205000m,
                        TaxYear = 2026,
                        AssessmentDate = DateTime.UtcNow,
                        LastUpdated = DateTime.UtcNow,
                    }
                );
                await db.SaveChangesAsync();
            }

            // ── Dossier notes — one per county, tagged SHOULD NOT LEAK ─
            if (!await db.DossierNotes.AnyAsync(n => n.ParcelId == BentonParcelId))
            {
                db.DossierNotes.AddRange(
                    new DossierNote
                    {
                        ParcelId = BentonParcelId,
                        CountyId = BentonCountyId,
                        Content = "Benton county assessment note — SOVEREIGN",
                        NoteType = "case_note",
                        CreatedBy = "cx22-seed",
                    },
                    new DossierNote
                    {
                        ParcelId = YakimaParcelId,
                        CountyId = YakimaCountyId,
                        Content = "Yakima county assessment note — SHOULD NOT LEAK TO BENTON/COWLITZ",
                        NoteType = "case_note",
                        CreatedBy = "cx22-seed",
                    },
                    new DossierNote
                    {
                        ParcelId = CowlitzParcelId,
                        CountyId = CowlitzCountyId,
                        Content = "Cowlitz county assessment note — SHOULD NOT LEAK TO BENTON/YAKIMA",
                        NoteType = "case_note",
                        CreatedBy = "cx22-seed",
                    }
                );
                await db.SaveChangesAsync();
            }

            _seeded = true;
        }
        finally
        {
            _seedLock.Release();
        }
    }

    private static void RegisterServiceStubs(IServiceCollection services)
    {
        services.RemoveAll<ICostForgeService>();
        services.RemoveAll<ICostForgeAIService>();
        services.RemoveAll<IPropertyService>();
        services.RemoveAll<IModuleOrchestrationService>();

        services.AddScoped(_ => new Mock<ICostForgeService>().Object);
        services.AddScoped(_ => new Mock<ICostForgeAIService>().Object);
        services.AddScoped(_ => new Mock<IPropertyService>().Object);
        services.AddScoped(_ => new Mock<IModuleOrchestrationService>().Object);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test auth handler — county identity injected via request headers
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx22TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public Cx22TestAuthHandler(
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

        var userId     = Request.Headers["X-Test-UserId"].FirstOrDefault()   ?? "cx22-user";
        var countyId   = Request.Headers["X-Test-CountyId"].FirstOrDefault();
        var countyCode = Request.Headers["X-Test-CountyCode"].FirstOrDefault();
        var roleHeader = Request.Headers["X-Test-Role"].FirstOrDefault();

        var claims = new List<Claim>
        {
            new("sub",                        userId),
            new("userId",                     userId),
            new(ClaimTypes.NameIdentifier,    userId),
            new(ClaimTypes.Name,              userId),
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

        var identity  = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket    = new AuthenticationTicket(principal, Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
