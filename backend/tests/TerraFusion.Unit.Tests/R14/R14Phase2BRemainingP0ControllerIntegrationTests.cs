using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
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
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.API.Security;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TerraFusion.Data.Repositories;
using Xunit;
using ApiGovernmentComplianceService = TerraFusion.API.Services.IGovernmentComplianceService;
using ApiProgram = TerraFusion.API.Program;
using AuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using CountyEntity = TerraFusion.Core.Entities.County;
using PropertyEntity = TerraFusion.Core.Entities.Property;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R14;

public sealed class R14Phase2BRemainingP0ControllerIntegrationTests
{
    [Fact]
    public async Task Atlas_GetParcelGeometry_HappyPath_Returns200()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions());
        await factory.EnsureSeedDataAsync();
        using var client = factory.CreateAuthenticatedClient("read:parcel");

        var response = await client.GetAsync($"/api/atlas/parcels/{R14Phase2BControllerFactory.BentonParcelId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal(R14Phase2BControllerFactory.BentonParcelId, json.RootElement.GetProperty("parcelId").GetString());
        Assert.False(json.RootElement.GetProperty("geometryAvailable").GetBoolean());
    }

    [Fact]
    public async Task Atlas_GetParcelGeometry_InvalidParcel_Returns400()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions());
        using var client = factory.CreateAuthenticatedClient("read:parcel");

        var response = await client.GetAsync("/api/atlas/parcels/invalid!parcel");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Atlas_GetParcelGeometry_MissingPermission_Returns403()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions());
        await factory.EnsureSeedDataAsync();
        using var client = factory.CreateAuthenticatedClient();

        var response = await client.GetAsync($"/api/atlas/parcels/{R14Phase2BControllerFactory.BentonParcelId}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // CI-HYGIENE-4C (#739): the original assertion expected a Post-R1
    // 501 stub. AtlasController.GetLayers was intentionally promoted to
    // emit the Benton ArcGIS layer catalog (31 verified layers,
    // X-Atlas-Source header, no fabricated metrics). The test now asserts
    // that real evidence-only catalog contract — not the deprecated
    // Post-R1 placeholder. See AtlasController.cs ~line 199.
    [Fact]
    public async Task Atlas_GetLayers_ReturnsLayerCatalog_Returns200()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions());
        using var client = factory.CreateAuthenticatedClient("read:parcel");

        var response = await client.GetAsync("/api/atlas/layers");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("benton-arcgis-layer-catalog-fy2025", response.Headers.GetValues("X-Atlas-Source").Single());

        using var json = await ReadJsonAsync(response);
        Assert.Equal(JsonValueKind.Array, json.RootElement.ValueKind);
        Assert.True(json.RootElement.GetArrayLength() > 0, "Layer catalog should not be empty");

        // The catalog must contain the well-known 'parcels' layer with
        // the controller's 'enabled = true' default for canonical layers.
        var parcelsLayer = json.RootElement.EnumerateArray()
            .FirstOrDefault(l => l.GetProperty("id").GetString() == "parcels");
        Assert.True(parcelsLayer.ValueKind == JsonValueKind.Object,
            "Catalog must include the 'parcels' layer");
        Assert.True(parcelsLayer.GetProperty("enabled").GetBoolean());
        Assert.Equal("Benton County ArcGIS FeatureServer",
            parcelsLayer.GetProperty("source").GetString());
    }

    // CI-HYGIENE-4C (#739): the original assertion expected a fabricated
    // status of "OPERATIONAL" sourced from ITerrasyncService.GetGovernmentExcellenceAsync().
    // That contract was deliberately retired in favor of an evidence-only
    // shape: the controller now emits LOCAL_LIVE / LOCAL_LIVE_WITH_EXTERNAL_SYNC
    // based on actual TerraSync reachability and live parcel counts. See
    // GovernmentController.GetGovernmentExcellence — the comments explicitly
    // forbid claiming "live AI swarm, optimization, satisfaction, or SLA
    // metrics" not backed by observation. With the test factory's
    // IsHealthyAsync mocked to true, the happy path is LOCAL_LIVE_WITH_EXTERNAL_SYNC.
    [Fact]
    public async Task Government_Excellence_EvidenceOnlyHappyPath_Returns200()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions());
        using var client = factory.CreateAnonymousClient();

        var response = await client.GetAsync("/api/government/excellence");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal("LOCAL_LIVE_WITH_EXTERNAL_SYNC",
            json.RootElement.GetProperty("status").GetString());
        Assert.Equal("Benton County",
            json.RootElement.GetProperty("county").GetProperty("name").GetString());
        Assert.Equal("LIVE_DB",
            json.RootElement.GetProperty("propertyAssessment").GetProperty("dataSource").GetString());
        Assert.Equal("AVAILABLE",
            json.RootElement.GetProperty("externalSystems")
                .GetProperty("terrasync").GetProperty("status").GetString());
    }

    // CI-HYGIENE-4C (#739): the original assertion expected
    // dataSource = "STATIC_FALLBACK" and a "realTimeSync" feature flag,
    // both sourced from a NullCountyConfig fallback path through
    // ITerrasyncService.GetCountyConfigAsync(). The evidence-only
    // controller does not call GetCountyConfigAsync at all — it builds
    // the response from live DB parcel counts and observed terrasync
    // reachability, with explicit "REFERENCE_ONLY" / "PILOT_ONLY" stance
    // on legacy systems and governed execution. Asserting that real
    // contract.
    [Fact]
    public async Task Government_CountyConfig_EvidenceContract_Returns200()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions());
        using var client = factory.CreateAnonymousClient();

        var response = await client.GetAsync("/api/government/county-config");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal("Benton County",
            json.RootElement.GetProperty("county").GetProperty("name").GetString());
        Assert.Equal("LIVE_DB",
            json.RootElement.GetProperty("evidence").GetProperty("parcelDataSource").GetString());
        Assert.True(
            json.RootElement.GetProperty("features").GetProperty("terrasyncHealth").GetBoolean(),
            "IsHealthyAsync mock returns true; terrasyncHealth should reflect that observation");
        Assert.False(
            json.RootElement.GetProperty("features").GetProperty("aiSwarm").GetBoolean(),
            "Evidence-only contract must not claim AI swarm without observation");
        Assert.Equal("PILOT_ONLY",
            json.RootElement.GetProperty("deployment").GetProperty("governedExecution").GetString());
        Assert.Equal("REFERENCE_ONLY",
            json.RootElement.GetProperty("legacySystem").GetProperty("status").GetString());
    }

    // CI-HYGIENE-4C (#739): the original test set ThrowGovernmentExcellence
    // to make ITerrasyncService.GetGovernmentExcellenceAsync() throw, but
    // the evidence-only controller does not call that method — it calls
    // IsHealthyAsync(). The factory option semantic now routes the throw
    // to IsHealthyAsync (the real dependency) so the controller's catch
    // block fires and returns the documented 500 contract.
    [Fact]
    public async Task Government_Excellence_ServiceFailure_Returns500()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions
        {
            ThrowGovernmentExcellence = true,
        });
        using var client = factory.CreateAnonymousClient();

        var response = await client.GetAsync("/api/government/excellence");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal("Failed to retrieve government status", json.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task Government_Health_HappyPath_Returns200()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions());
        using var client = factory.CreateAnonymousClient();

        var response = await client.GetAsync("/api/government/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal("healthy", json.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task GovernmentCompliance_Validate_HappyPath_Returns200()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions());
        using var client = factory.CreateAnonymousClient();

        var response = await client.PostAsync("/api/compliance/validate?component=System&operation=Readiness", content: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.True(json.RootElement.GetProperty("overallCompliant").GetBoolean());
    }

    [Fact]
    public async Task GovernmentCompliance_Validate_PartialCompliance_Returns207()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions
        {
            PartialCompliance = true,
        });
        using var client = factory.CreateAnonymousClient();

        var response = await client.PostAsync("/api/compliance/validate?component=System&operation=Readiness", content: null);

        Assert.Equal((HttpStatusCode)207, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.False(json.RootElement.GetProperty("overallCompliant").GetBoolean());
        Assert.Equal(1, json.RootElement.GetProperty("violations").GetArrayLength());
    }

    [Fact]
    public async Task GovernmentCompliance_Validate_MissingOperation_Returns400()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions());
        using var client = factory.CreateAnonymousClient();

        var response = await client.PostAsync("/api/compliance/validate?component=System", content: null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GovernmentCompliance_Validate_ServiceFailure_Returns500()
    {
        await using var factory = new R14Phase2BControllerFactory(new R14Phase2BControllerFactoryOptions
        {
            ThrowCompliance = true,
        });
        using var client = factory.CreateAnonymousClient();

        var response = await client.PostAsync("/api/compliance/validate?component=System&operation=Readiness", content: null);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal("Compliance validation service error", json.RootElement.GetProperty("error").GetString());
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    }
}

internal sealed class R14Phase2BControllerFactoryOptions
{
    /// <summary>
    /// CI-HYGIENE-4C (#739): the evidence-only Government /excellence
    /// endpoint depends on <see cref="ITerrasyncService.IsHealthyAsync"/>,
    /// not GetGovernmentExcellenceAsync. When true, the factory makes
    /// IsHealthyAsync throw so the controller's catch block fires.
    /// </summary>
    public bool ThrowGovernmentExcellence { get; init; }
    public bool PartialCompliance { get; init; }
    public bool ThrowCompliance { get; init; }
}

internal sealed class R14Phase2BControllerFactory : WebApplicationFactory<ApiProgram>
{
    public static readonly Guid BentonCountyId = Guid.Parse("1414002b-1111-1111-1111-111111111111");
    public static readonly Guid BentonPropertyId = Guid.Parse("1414002b-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public const string BentonParcelId = "R14B-BENTON-P1";
    public const string AuthScheme = "R14Phase2BAuth";

    private readonly R14Phase2BControllerFactoryOptions _options;
    private readonly string _databaseName = $"r14-phase2b-{Guid.NewGuid():N}";
    private readonly SemaphoreSlim _seedLock = new(1, 1);
    private bool _seeded;

    public R14Phase2BControllerFactory(R14Phase2BControllerFactoryOptions options)
    {
        _options = options;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["ConnectionStrings:TerraFusionDatabase"] = "Host=localhost;Database=tf_test;Username=tf;Password=tf",
                ["JwtSettings:SecretKey"] = "R14_PHASE2B_TEST_SECRET_KEY_012345678901234567890123456789",
                ["JwtSettings:Issuer"] = "TerraFusionTestIssuer",
                ["JwtSettings:Audience"] = "TerraFusionTestAudience",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<TerraFusionDbContext>>();
            services.RemoveAll<TerraFusionDbContext>();
            services.AddDbContext<TerraFusionDbContext>(options => options.UseInMemoryDatabase(_databaseName));

            RegisterTerrasyncService(services);
            RegisterComplianceService(services);
            RegisterAuditLogger(services);

            services.AddHttpContextAccessor();

            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = AuthScheme;
                    options.DefaultChallengeScheme = AuthScheme;
                    options.DefaultScheme = AuthScheme;
                })
                .AddScheme<AuthenticationSchemeOptions, R14TestAuthHandler>(AuthScheme, _ => { });

            services.AddAuthorization(options =>
            {
                options.DefaultPolicy = new AuthorizationPolicyBuilder(AuthScheme)
                    .RequireAuthenticatedUser()
                    .Build();
            });

            services.RemoveAll<IAuthorizationPolicyProvider>();
            services.AddSingleton<IAuthorizationPolicyProvider, DynamicModulePolicyProvider>();

            var pluginRepo = new Mock<IPluginRepository>();
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
            if (_seeded)
            {
                return;
            }

            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            await db.Database.EnsureCreatedAsync();

            if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
            {
                db.Counties.Add(new CountyEntity
                {
                    Id = BentonCountyId,
                    Name = "Benton",
                    State = "WA",
                    FipsCode = "003",
                });
            }

            if (!await db.Properties.AnyAsync(p => p.Id == BentonPropertyId))
            {
                db.Properties.Add(new PropertyEntity
                {
                    Id = BentonPropertyId,
                    PropertyId = "R14B-PROP-BENTON",
                    ParcelId = BentonParcelId,
                    ParcelNumber = BentonParcelId,
                    Address = "200 Benton Ave",
                    PropertyType = "SFR",
                    AssessedValue = 310000,
                    LandValue = 120000,
                    ImprovementValue = 190000,
                    MarketValue = 330000,
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

    public HttpClient CreateAuthenticatedClient(params string[] perms)
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "r14b-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Email", "r14b.user@county.test");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId", BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");

        if (perms.Length > 0)
        {
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Perms", string.Join(",", perms));
        }

        return client;
    }

    public HttpClient CreateAnonymousClient()
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    private void RegisterTerrasyncService(IServiceCollection services)
    {
        services.RemoveAll<ITerrasyncService>();

        var terrasync = new Mock<ITerrasyncService>();

        // CI-HYGIENE-4C (#739): the Government controllers no longer call
        // GetGovernmentExcellenceAsync() or GetCountyConfigAsync(). The
        // evidence-only refactor sources status from IsHealthyAsync() and
        // live DB parcel counts. Setups for the deprecated rich-DTO methods
        // were removed; the only mock surface that matters is IsHealthyAsync.
        if (_options.ThrowGovernmentExcellence)
        {
            terrasync
                .Setup(service => service.IsHealthyAsync())
                .ThrowsAsync(new InvalidOperationException("R14 phase2b government excellence failure"));
        }
        else
        {
            terrasync
                .Setup(service => service.IsHealthyAsync())
                .ReturnsAsync(true);
        }

        terrasync
            .Setup(service => service.GetSystemStatusAsync())
            .ReturnsAsync((TerrasyncSystemStatus?)null);
        terrasync
            .Setup(service => service.GetBentonCountyStatusAsync())
            .ReturnsAsync((TerrasyncCountyStatus?)null);

        services.AddScoped(_ => terrasync.Object);
    }

    private void RegisterComplianceService(IServiceCollection services)
    {
        services.RemoveAll<ApiGovernmentComplianceService>();

        var compliance = new Mock<ApiGovernmentComplianceService>();

        if (_options.ThrowCompliance)
        {
            compliance
                .Setup(service => service.ValidateComplianceAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new InvalidOperationException("R14 phase2b compliance failure"));
        }
        else if (_options.PartialCompliance)
        {
            compliance
                .Setup(service => service.ValidateComplianceAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new GovernmentComplianceResult
                {
                    Component = "System",
                    Operation = "Readiness",
                    Timestamp = DateTime.UtcNow,
                    OverallCompliant = false,
                    OverallScore = 0.87,
                    FISMACompliant = true,
                    FISMAScore = 0.97,
                    WCAGCompliant = true,
                    WCAGScore = 0.96,
                    CountyCompliant = true,
                    CountyScore = 0.95,
                    AIAgentCompliant = false,
                    AIAgentScore = 0.79,
                    Violations =
                    [
                        new ComplianceViolation
                        {
                            Type = "AI_POLICY",
                            Component = "System",
                            Operation = "Readiness",
                            Severity = ViolationSeverity.High,
                            Description = "One policy exception requires operator review",
                            Recommendation = "Resolve exception before release",
                        },
                    ],
                });
        }
        else
        {
            compliance
                .Setup(service => service.ValidateComplianceAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new GovernmentComplianceResult
                {
                    Component = "System",
                    Operation = "Readiness",
                    Timestamp = DateTime.UtcNow,
                    OverallCompliant = true,
                    OverallScore = 0.99,
                    FISMACompliant = true,
                    FISMAScore = 0.99,
                    WCAGCompliant = true,
                    WCAGScore = 0.98,
                    CountyCompliant = true,
                    CountyScore = 1.0,
                    AIAgentCompliant = true,
                    AIAgentScore = 0.98,
                });
        }

        services.AddScoped(_ => compliance.Object);
    }

    private static void RegisterAuditLogger(IServiceCollection services)
    {
        services.RemoveAll<AuditLogger>();

        var auditLogger = new Mock<AuditLogger>();
        auditLogger
            .Setup(logger => logger.LogApiCallAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<double>(), It.IsAny<string?>()))
            .Returns(() => Task.CompletedTask);
        auditLogger
            .Setup(logger => logger.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>(), It.IsAny<string?>()))
            .Returns(() => Task.CompletedTask);

        services.AddScoped(_ => auditLogger.Object);
    }
}
