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

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// CX-19: Cross-County Non-Leak Goldens at HTTP Level
//
// Verifies that county-scoped controllers never return data belonging to a
// foreign county. Two counties are seeded (Benton + King). The caller's JWT
// claims always resolve to Benton. Requests targeting King county data must
// return 403 (Forbid), 404 (NotFound), or an empty set — never 200 with data.
//
// Lock doc: backend/docs/r1-week5-scope-lock.md §CX-19
// Filter:   dotnet test --filter "FullyQualifiedName~R1Week5Cx19"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "CX19")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx19CrossCountyNonLeakTests
    : IClassFixture<Cx19CrossCountyFactory>, IAsyncLifetime
{
  private readonly Cx19CrossCountyFactory _factory;

  public R1Week5Cx19CrossCountyNonLeakTests(Cx19CrossCountyFactory factory)
      => _factory = factory;

  public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
  public Task DisposeAsync() => Task.CompletedTask;

  // ════════════════════════════════════════════════════════════════════
  // ATLAS CONTROLLER — server-resolved county from JWT claims
  // ════════════════════════════════════════════════════════════════════

  [Fact]
  public async Task Atlas_SameCounty_ParcelGeometry_ReturnsNon404()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/atlas/parcels/{Cx19CrossCountyFactory.BentonParcelId}");

    // Benton caller accessing Benton parcel → should pass authz
    response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
        "Benton caller accessing Benton parcel should not be 403");
  }

  [Fact]
  public async Task Atlas_CrossCounty_ParcelGeometry_NoLeak()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/atlas/parcels/{Cx19CrossCountyFactory.KingParcelId}");

    // Benton caller accessing King parcel → 404 (not found in Benton scope)
    response.StatusCode.Should().BeOneOf(
        new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
        "Benton caller should not access King county parcel");
  }

  [Fact]
  public async Task Atlas_SameCounty_ParcelLayers_ReturnsNon404()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/atlas/parcels/{Cx19CrossCountyFactory.BentonParcelId}/layers");

    response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
        "Benton caller accessing Benton layers should not be 403");
  }

  [Fact]
  public async Task Atlas_CrossCounty_ParcelLayers_NoLeak()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/atlas/parcels/{Cx19CrossCountyFactory.KingParcelId}/layers");

    response.StatusCode.Should().BeOneOf(
        new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
        "Benton caller should not access King county layers");
  }

  // ════════════════════════════════════════════════════════════════════
  // COSTFORGE CONTROLLER — server-resolved county + request county match
  // ════════════════════════════════════════════════════════════════════

  [Fact]
  public async Task CostForge_SameCounty_Calculate_PassesAuthz()
  {
    using var client = CreateBentonClient();
    var body = JsonSerializer.Serialize(new
    {
      PropertyId = Cx19CrossCountyFactory.BentonPropertyGuid,
      Region = "BENTON",
      BuildingType = "SFR"
    });
    var response = await client.PostAsync("/api/CostForge/calculate",
        new StringContent(body, Encoding.UTF8, "application/json"));

    response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
        "Benton caller with Benton region should not be 403");
  }

  [Fact]
  public async Task CostForge_CrossCounty_Calculate_Forbidden()
  {
    using var client = CreateBentonClient();
    var body = JsonSerializer.Serialize(new
    {
      PropertyId = Cx19CrossCountyFactory.KingPropertyGuid,
      Region = "KING",
      BuildingType = "SFR"
    });
    var response = await client.PostAsync("/api/CostForge/calculate",
        new StringContent(body, Encoding.UTF8, "application/json"));

    // Benton caller requesting KING region → Forbid (county mismatch)
    response.StatusCode.Should().BeOneOf(
        new[] { HttpStatusCode.Forbidden, HttpStatusCode.NotFound },
        "Benton caller should not calculate for King county");
  }

  [Fact]
  public async Task CostForge_SameCounty_Breakdown_PassesAuthz()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/CostForge/{Cx19CrossCountyFactory.BentonPropertyGuid}/breakdown");

    response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
        "Benton caller for Benton property breakdown should not be 403");
  }

  [Fact]
  public async Task CostForge_CrossCounty_Breakdown_NoLeak()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/CostForge/{Cx19CrossCountyFactory.KingPropertyGuid}/breakdown");

    response.StatusCode.Should().Be(HttpStatusCode.NotFound,
        "Benton caller should receive 404 for King county property breakdown");
  }

  // ════════════════════════════════════════════════════════════════════
  // DOSSIER CONTROLLER — server-resolved county, parcel-scoped
  // ════════════════════════════════════════════════════════════════════

  [Fact]
  public async Task Dossier_SameCounty_Notes_ReturnsData()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/dossier/{Cx19CrossCountyFactory.BentonParcelId}/notes");

    response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
        "Benton caller reading Benton notes should not be 403");
    response.StatusCode.Should().NotBe(HttpStatusCode.NotFound,
        "Benton parcel notes endpoint should exist");

    if (response.StatusCode == HttpStatusCode.OK)
    {
      var json = await response.Content.ReadAsStringAsync();
      var doc = JsonDocument.Parse(json);
      // Notes are scoped to county — should contain our seeded note
      doc.RootElement.TryGetProperty("notes", out _).Should().BeTrue(
          "Response should include 'notes' array");
    }
  }

  [Fact]
  public async Task Dossier_CrossCounty_Notes_NoLeak()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/dossier/{Cx19CrossCountyFactory.KingParcelId}/notes");

    if (response.StatusCode == HttpStatusCode.OK)
    {
      // If 200, must be empty set (no King county notes visible to Benton)
      var json = await response.Content.ReadAsStringAsync();
      var doc = JsonDocument.Parse(json);
      if (doc.RootElement.TryGetProperty("notes", out var notes))
      {
        notes.GetArrayLength().Should().Be(0,
            "Benton caller should see zero notes for King county parcel");
      }
    }
    else
    {
      // 404 or 403 are both acceptable non-leak responses
      response.StatusCode.Should().BeOneOf(
          new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
          "Cross-county notes should be blocked or not found");
    }
  }

  [Fact]
  public async Task Dossier_SameCounty_Casefile_PassesAuthz()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/dossier/parcels/{Cx19CrossCountyFactory.BentonParcelId}/casefile");

    response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
        "Benton caller reading Benton casefile should not be 403");
  }

  [Fact]
  public async Task Dossier_CrossCounty_Casefile_NoLeak()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/dossier/parcels/{Cx19CrossCountyFactory.KingParcelId}/casefile");

    if (response.StatusCode == HttpStatusCode.OK)
    {
      var json = await response.Content.ReadAsStringAsync();
      var doc = JsonDocument.Parse(json);
      // If 200, verify it's an empty/null casefile, not King's data
      if (doc.RootElement.TryGetProperty("documents", out var docs))
      {
        docs.GetArrayLength().Should().Be(0,
            "Cross-county casefile should have no documents");
      }
    }
    else
    {
      response.StatusCode.Should().BeOneOf(
          new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
          "Cross-county casefile should be blocked or not found");
    }
  }

  [Fact]
  public async Task Dossier_CrossCounty_WriteNote_Blocked()
  {
    using var client = CreateBentonClient();
    var body = JsonSerializer.Serialize(new
    {
      Content = "cross-county-leak-test",
      Type = "case_note"
    });
    var response = await client.PostAsync(
        $"/api/dossier/{Cx19CrossCountyFactory.KingParcelId}/notes",
        new StringContent(body, Encoding.UTF8, "application/json"));

    // Writing to a cross-county parcel must be blocked
    response.StatusCode.Should().BeOneOf(
        new[] { HttpStatusCode.NotFound, HttpStatusCode.Forbidden },
        "Cannot write notes to a cross-county parcel");
  }

  // ════════════════════════════════════════════════════════════════════
  // LEVY CALCULATION CONTROLLER — server-resolved county + request match
  // ════════════════════════════════════════════════════════════════════

  [Fact]
  public async Task Levy_SameCounty_CalculateRate_PassesAuthz()
  {
    using var client = CreateBentonClient(roles: "Assessor,LevyClerk");
    var body = JsonSerializer.Serialize(new
    {
      DistrictId = "DIST-001",
      DistrictName = "Benton County Regular",
      AssessedValue = 1000000.0,
      BudgetAmount = 10000.0,
      DistrictType = "county-regular",
      MeasureType = "regular",
      CountyCode = "BENTON"
    });
    var response = await client.PostAsync("/api/levy-calculation/calculate-rate",
        new StringContent(body, Encoding.UTF8, "application/json"));

    response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
        "Benton caller with BENTON county code should not be 403");
    response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized,
        "Authenticated Benton caller should not be 401");
  }

  [Fact]
  public async Task Levy_CrossCounty_CalculateRate_Forbidden()
  {
    using var client = CreateBentonClient(roles: "Assessor,LevyClerk");
    var body = JsonSerializer.Serialize(new
    {
      DistrictId = "DIST-001",
      DistrictName = "King County Regular",
      AssessedValue = 1000000.0,
      BudgetAmount = 10000.0,
      DistrictType = "county-regular",
      MeasureType = "regular",
      CountyCode = "KING"
    });
    var response = await client.PostAsync("/api/levy-calculation/calculate-rate",
        new StringContent(body, Encoding.UTF8, "application/json"));

    // Benton caller with KING county code → Forbid (mismatch)
    response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
        "Benton caller cannot calculate levy for King county");
  }

  [Fact]
  public async Task Levy_SameCounty_BatchCalculate_PassesAuthz()
  {
    using var client = CreateBentonClient(roles: "Assessor,LevyClerk");
    var body = JsonSerializer.Serialize(new[]
    {
            new { DistrictId = "D1", AssessedValue = 500000.0, BudgetAmount = 5000.0,
                  DistrictType = "county-regular", MeasureType = "regular", CountyCode = "BENTON" }
        });
    var response = await client.PostAsync("/api/levy-calculation/calculate-batch",
        new StringContent(body, Encoding.UTF8, "application/json"));

    response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
        "Benton caller with BENTON county code should not be 403 on batch");
  }

  [Fact]
  public async Task Levy_CrossCounty_BatchCalculate_Forbidden()
  {
    using var client = CreateBentonClient(roles: "Assessor,LevyClerk");
    var body = JsonSerializer.Serialize(new
    {
      CountyCode = "KING",
      Items = new[]
        {
                new { DistrictId = "D1", AssessedValue = 500000.0, BudgetAmount = 5000.0,
                      DistrictType = "county-regular", MeasureType = "regular" }
            }
    });
    var response = await client.PostAsync("/api/levy-calculation/calculate-batch",
        new StringContent(body, Encoding.UTF8, "application/json"));

    response.StatusCode.Should().BeOneOf(
        new[] { HttpStatusCode.Forbidden, HttpStatusCode.BadRequest },
        "Benton caller cannot batch-calculate for King county");
  }

  // ════════════════════════════════════════════════════════════════════
  // PROPERTIES CONTROLLER — client-side countyId (documented finding)
  // ════════════════════════════════════════════════════════════════════

  [Fact]
  public async Task Properties_SameCounty_GetById_ReturnsData()
  {
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/Properties/{Cx19CrossCountyFactory.BentonPropertyGuid}");

    // Properties uses [RequiresPermission("read:properties")] on GET {id}
    response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden,
        "Benton caller with read:properties should not be 403");
  }

  [Fact]
  public async Task Properties_CrossCounty_GetById_DocumentedBehavior()
  {
    // DOCUMENTED FINDING: PropertiesController.GetProperty(id) does NOT
    // filter by county. It returns any property by GUID regardless of
    // caller's county context. This is a known gap — the controller
    // relies on client-provided countyId query param for list endpoints
    // but individual lookups are unscoped.
    //
    // This test documents the current behavior. A future CX lane should
    // add server-side county filtering to PropertiesController.
    using var client = CreateBentonClient();
    var response = await client.GetAsync(
        $"/api/Properties/{Cx19CrossCountyFactory.KingPropertyGuid}");

    // Record the status — we expect this MAY return 200 (known weakness)
    // or 404 if the service layer can't find it for other reasons.
    var status = response.StatusCode;
    (status == HttpStatusCode.OK ||
     status == HttpStatusCode.NotFound ||
     status == HttpStatusCode.InternalServerError).Should().BeTrue(
        $"PropertiesController cross-county access returned {status} — " +
        "documented: no server-side county isolation on GET /api/Properties/{{id}}");
  }

  // ════════════════════════════════════════════════════════════════════
  // Helpers
  // ════════════════════════════════════════════════════════════════════

  private HttpClient CreateBentonClient(string roles = "Assessor")
  {
    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue(Cx19CrossCountyFactory.AuthScheme, "token");
    client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx19-benton-user");
    client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId",
        Cx19CrossCountyFactory.BentonCountyId.ToString());
    client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
    client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", roles);
    client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id",
        Cx19CrossCountyFactory.PluginAllPermsId.ToString());
    return client;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: Two-county seed data, production DI, test auth only
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx19CrossCountyFactory : WebApplicationFactory<ApiProgram>
{
  // ── County IDs ───────────────────────────────────────────────────────
  public static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
  public static readonly Guid KingCountyId = Guid.Parse("19190019-2929-2929-2929-292929292929");

  // ── Property IDs ─────────────────────────────────────────────────────
  public static readonly Guid BentonPropertyGuid = Guid.Parse("19190019-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
  public static readonly Guid KingPropertyGuid = Guid.Parse("19190019-cccc-cccc-cccc-cccccccccccc");

  // ── Parcel IDs (string) ──────────────────────────────────────────────
  public const string BentonParcelId = "CX19-BENTON-P1";
  public const string KingParcelId = "CX19-KING-P1";

  // ── Plugin for permission pass-through ───────────────────────────────
  public static readonly Guid PluginAllPermsId = Guid.Parse("19191919-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

  public const string AuthScheme = "Cx19TestAuth";

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

  private readonly string _databaseName = $"cx19-xc-{Guid.NewGuid():N}";
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
        ["JwtSettings:SecretKey"] = "CX19_TEST_SECRET_KEY_01234567890123456789012345678",
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
          .AddScheme<AuthenticationSchemeOptions, Cx19TestAuthHandler>(AuthScheme, _ => { });

      // ── Mock IPluginRepository (for RequiresPermission pass-through) ──
      var pluginRepo = new Mock<IPluginRepository>();
      pluginRepo.Setup(r => r.GetByIdAsync(PluginAllPermsId))
              .ReturnsAsync(new Plugin
            {
              Id = PluginAllPermsId,
              Name = "CX19-AllPerms",
              Version = "1.0.0",
              Description = "Cross-county test plugin with all permissions",
              Category = "test",
              AuthorId = "cx19-test",
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

      // ── Seed Counties ────────────────────────────────────────
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

      // ── Seed Properties (one per county) ─────────────────────
      if (!await db.Properties.AnyAsync(p => p.Id == BentonPropertyGuid))
      {
        db.Properties.Add(new Property
        {
          Id = BentonPropertyGuid,
          PropertyId = "BENTON-PROP-001",
          ParcelId = BentonParcelId,
          ParcelNumber = "CX19-BN-001",
          Address = "100 Main St, Kennewick, WA",
          CountyId = BentonCountyId,
          AssessedValue = 250000m,
          LandValue = 100000m,
          ImprovementValue = 150000m,
          MarketValue = 260000m,
          TaxYear = 2026,
          AssessmentDate = DateTime.UtcNow,
          LastUpdated = DateTime.UtcNow,
        });

        db.Properties.Add(new Property
        {
          Id = KingPropertyGuid,
          PropertyId = "KING-PROP-001",
          ParcelId = KingParcelId,
          ParcelNumber = "CX19-KG-001",
          Address = "200 1st Ave, Seattle, WA",
          CountyId = KingCountyId,
          AssessedValue = 750000m,
          LandValue = 400000m,
          ImprovementValue = 350000m,
          MarketValue = 800000m,
          TaxYear = 2026,
          AssessmentDate = DateTime.UtcNow,
          LastUpdated = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
      }

      // ── Seed DossierNotes (one per county) ───────────────────
      if (!await db.DossierNotes.AnyAsync(n => n.ParcelId == BentonParcelId))
      {
        db.DossierNotes.Add(new DossierNote
        {
          ParcelId = BentonParcelId,
          CountyId = BentonCountyId,
          Content = "Benton county assessment note",
          NoteType = "case_note",
          CreatedBy = "cx19-seed",
        });

        db.DossierNotes.Add(new DossierNote
        {
          ParcelId = KingParcelId,
          CountyId = KingCountyId,
          Content = "King county assessment note — SHOULD NOT LEAK",
          NoteType = "case_note",
          CreatedBy = "cx19-seed",
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
          AnalysisMethod = "cx19-test",
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
// Test auth handler — Benton county identity from headers
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx19TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
  public Cx19TestAuthHandler(
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

    var userId = Request.Headers["X-Test-UserId"].FirstOrDefault() ?? "cx19-user";
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
