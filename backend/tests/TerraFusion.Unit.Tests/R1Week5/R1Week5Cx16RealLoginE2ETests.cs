using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Core.Services;
using Xunit;
using ApiProgram = TerraFusion.API.Program;
using County = TerraFusion.Core.Entities.County;
using DossierNote = TerraFusion.Core.Entities.DossierNote;
using Property = TerraFusion.Core.Entities.Property;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// CX-16 E2E: Real Login Token → [RequiresPermission] Dossier Route
//
// This test closes the full auth loop:
//   POST /api/auth/login  →  JWT issued with perm+county claims
//     ↓
//   GET /api/dossier/{parcelId}/notes  (Bearer token, real JwtBearerHandler)
//     ↓
//   DynamicModulePolicyProvider → PluginPermissionHandler → perm claim check
//     ↓
//   County-isolation query → 200 with notes
//
// No test auth handler. No stubbed policies. Real JWT pipeline end-to-end.
//
// Filter: dotnet test --filter "FullyQualifiedName~R1Week5Cx16RealLogin"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "CX16")]
[Trait("Category", "E2E")]
public sealed class R1Week5Cx16RealLoginE2ETests
    : IClassFixture<Cx16RealLoginFactory>, IAsyncLifetime
{
    private readonly Cx16RealLoginFactory _factory;

    public R1Week5Cx16RealLoginE2ETests(Cx16RealLoginFactory factory) => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ── 1. Assessor login → dossier read → 200 (the CX-16 proof) ────

    [Fact]
    public async Task RealLogin_Assessor_DossierNotes_Returns200()
    {
        using var client = _factory.CreateClient();

        // Step 1: Login via the real /api/auth/login endpoint
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "assessor@terrafusionmarket.com",
            Password = "Government2026!",
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK,
            "login should succeed for a valid government user");

        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = loginBody.GetProperty("token").GetString();
        token.Should().NotBeNullOrWhiteSpace("login response must include a JWT");

        // Step 2: Use the real JWT to call a [RequiresPermission("read:dossier")] endpoint
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var dossierResponse = await client.GetAsync(
            $"/api/dossier/{Cx16RealLoginFactory.BentonParcelId}/notes");

        dossierResponse.StatusCode.Should().Be(HttpStatusCode.OK,
            "assessor with read:dossier perm should pass the permission gate (not 403)");

        var dossierBody = await dossierResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(dossierBody);
        doc.RootElement.GetProperty("parcelId").GetString()
            .Should().Be(Cx16RealLoginFactory.BentonParcelId);
    }

    // ── 2. Token carries perm claims (structural assertion) ──────────

    [Fact]
    public async Task RealLogin_Assessor_TokenContainsPermClaims()
    {
        using var client = _factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "assessor@terrafusionmarket.com",
            Password = "Government2026!",
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = loginBody.GetProperty("token").GetString()!;

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        var permClaims = jwt.Claims.Where(c => c.Type == "perm").Select(c => c.Value).ToList();

        permClaims.Should().Contain("read:dossier", "assessor role must derive read:dossier");
        permClaims.Should().Contain("write:dossier", "assessor role must derive write:dossier");
        permClaims.Should().Contain("access:costforge", "assessor role must derive access:costforge");
    }

    // ── 3. Token carries county context ──────────────────────────────

    [Fact]
    public async Task RealLogin_TokenContainsCountyClaims()
    {
        using var client = _factory.CreateClient();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "assessor@terrafusionmarket.com",
            Password = "Government2026!",
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = loginBody.GetProperty("token").GetString()!;

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        var countyId = jwt.Claims.FirstOrDefault(c => c.Type == "countyId")?.Value;
        var countyCode = jwt.Claims.FirstOrDefault(c => c.Type == "countyCode")?.Value;

        countyId.Should().Be(Cx16RealLoginFactory.BentonCountyId.ToString(),
            "dev login token must carry DefaultCounty:Id from config");
        countyCode.Should().Be("benton",
            "dev login token must carry DefaultCounty:Code from config");
    }

    // ── 4. GovernmentUser (no assessor) → dossier read still 200 ─────

    [Fact]
    public async Task RealLogin_GovernmentUser_DossierNotes_Returns200()
    {
        using var client = _factory.CreateClient();

        // "user@terrafusionmarket.com" has GovernmentUser role only
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "user@terrafusionmarket.com",
            Password = "Government2026!",
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = loginBody.GetProperty("token").GetString()!;

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var dossierResponse = await client.GetAsync(
            $"/api/dossier/{Cx16RealLoginFactory.BentonParcelId}/notes");

        dossierResponse.StatusCode.Should().Be(HttpStatusCode.OK,
            "GovernmentUser has read:dossier → should pass permission gate");
    }

    // ── 5. Unauthenticated (no login) → 401 ─────────────────────────

    [Fact]
    public async Task NoLogin_DossierNotes_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync(
            $"/api/dossier/{Cx16RealLoginFactory.BentonParcelId}/notes");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: Real JWT Bearer pipeline (no test auth handler)
// ─────────────────────────────────────────────────────────────────────────────

public sealed class Cx16RealLoginFactory : WebApplicationFactory<ApiProgram>
{
    public static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    public const string BentonParcelId = "CX16E2E-BENTON-001";

    private const string SecretKey = "CX16E2E_REAL_LOGIN_SECRET_0123456789_0123456789_ENOUGH";
    private const string Issuer = "TerraFusion.API";
    private const string Audience = "TerraFusion.Client";

    private readonly string _databaseName = $"cx16-e2e-{Guid.NewGuid():N}";
    private readonly SemaphoreSlim _seedLock = new(1, 1);
    private bool _seeded;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                // JWT settings — same key for issuance (JwtTokenService) and validation (JwtBearerHandler)
                ["JwtSettings:SecretKey"] = SecretKey,
                ["JwtSettings:Issuer"] = Issuer,
                ["JwtSettings:Audience"] = Audience,
                ["JwtSettings:ExpirationMinutes"] = "60",

                // CX-16: DefaultCounty – provides countyId/countyCode in tokens
                ["DefaultCounty:Id"] = BentonCountyId.ToString(),
                ["DefaultCounty:Code"] = "benton",

                // Required config stubs
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["ConnectionStrings:TerraFusionDatabase"] = "Host=localhost;Database=tf_test;Username=tf;Password=tf",
                ["UltimateCostForgeAI:UltimateQuantumFactor"] = "999",
                ["UltimateCostForgeAI:UltimateAccuracyTarget"] = "99.9",
                ["UltimateCostForgeAI:UltimateAgentCount"] = "1000000",
                ["UltimateCostForgeAI:UltimateConsciousnessResonance"] = "0.9999",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            // InMemory database
            services.RemoveAll<DbContextOptions<TerraFusion.Data.TerraFusionDbContext>>();
            services.RemoveAll<TerraFusion.Data.TerraFusionDbContext>();
            services.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(
                options => options.UseInMemoryDatabase(_databaseName));

            // Stub CostForge services (not relevant to this test)
            services.RemoveAll<ICostForgeService>();
            services.RemoveAll<ICostForgeAIService>();
            services.AddScoped(_ => new Mock<ICostForgeService>().Object);
            services.AddScoped(_ => new Mock<ICostForgeAIService>().Object);

            // Disable HTTPS metadata requirement for test host (no TLS in TestServer)
            // and ensure the signing key matches the key used by JwtTokenService.
            // This is needed because AddTerraFusionAuthentication reads config during
            // ConfigureServices and the InMemoryCollection may not be first in precedence.
            services.PostConfigure<JwtBearerOptions>(
                JwtBearerDefaults.AuthenticationScheme,
                opt =>
                {
                    opt.RequireHttpsMetadata = false;
                    opt.TokenValidationParameters.ValidIssuer = Issuer;
                    opt.TokenValidationParameters.ValidAudience = Audience;
                    opt.TokenValidationParameters.IssuerSigningKey =
                        new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                            System.Text.Encoding.UTF8.GetBytes(SecretKey));
                });

            // NOTE: We do NOT replace auth or authorization — we use the REAL pipeline:
            //   JwtBearerHandler → DynamicModulePolicyProvider → PluginPermissionHandler
            // The login endpoint issues a real JWT; the dossier endpoint validates it.
        });
    }

    public async Task EnsureSeedDataAsync()
    {
        await _seedLock.WaitAsync();
        try
        {
            if (_seeded) return;

            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TerraFusion.Data.TerraFusionDbContext>();
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

            if (!await db.Properties.AnyAsync(p => p.ParcelId == BentonParcelId))
            {
                db.Properties.Add(new Property
                {
                    Id = Guid.NewGuid(),
                    PropertyId = "CX16E2E-PROP-BENTON",
                    ParcelId = BentonParcelId,
                    ParcelNumber = "CX16E2EBENTON001",
                    Address = "100 E2E Benton Ave",
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
