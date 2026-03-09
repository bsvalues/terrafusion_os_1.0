using System.IdentityModel.Tokens.Jwt;
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
using TerraFusion.AI.Services;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.API.Security;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Models;
using TerraFusion.Core.Services;
using TerraFusion.Data.Repositories;
using Xunit;
using ApiProgram = TerraFusion.API.Program;
using AuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using CoreAuthenticationService = TerraFusion.Core.Services.IAuthenticationService;
using CoreCostForgeService = TerraFusion.Core.Services.ICostForgeService;
using CoreSecurityService = TerraFusion.Core.Services.ISecurityService;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R14;

[Trait("Category", "R14")]
[Trait("Category", "Integration")]
[Trait("Category", "P0Controllers")]
public sealed class R14Phase2P0ControllerIntegrationTests
{
    [Fact]
    public async Task CostForge_Calculate_HappyPath_Returns200()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(
            roles: ["Assessor"],
            perms: ["access:costforge", "calculate:property-cost"]);

        var response = await client.PostAsJsonAsync("/api/costforge/calculate", new
        {
            PropertyId = R14Phase2ControllerFactory.BentonPropertyId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<CostAnalysisDto>();
        payload.Should().NotBeNull();
        payload!.PropertyId.Should().Be(R14Phase2ControllerFactory.BentonPropertyId);
    }

    [Fact]
    public async Task CostForge_Calculate_ValidationFailure_Returns400()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(
            roles: ["Assessor"],
            perms: ["access:costforge", "calculate:property-cost"]);

        var response = await client.PostAsJsonAsync("/api/costforge/calculate", new
        {
            PropertyId = Guid.Empty,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CostForge_Calculate_MissingPermissions_Returns403()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(roles: ["Assessor"]);

        var response = await client.PostAsJsonAsync("/api/costforge/calculate", new
        {
            PropertyId = R14Phase2ControllerFactory.BentonPropertyId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CostForge_Calculate_ServiceFailure_Returns500()
    {
        using var factory = await CreateFactoryAsync(options => options.ThrowCostForgeAnalysis = true);
        using var client = factory.CreateAuthenticatedClient(
            roles: ["Assessor"],
            perms: ["access:costforge", "calculate:property-cost"]);

        var response = await client.PostAsJsonAsync("/api/costforge/calculate", new
        {
            PropertyId = R14Phase2ControllerFactory.BentonPropertyId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        (await response.Content.ReadAsStringAsync()).Should().Contain("Internal server error in cost calculation");
    }

    [Fact]
    public async Task Dossier_Details_HappyPath_Returns200WithCorrelationId()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(
            roles: ["Assessor"],
            perms: ["read:dossier"]);

        var response = await client.GetAsync($"/api/dossier/parcels/{R14Phase2ControllerFactory.BentonParcelId}/details?include=property,notes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("X-Correlation-ID", out var values).Should().BeTrue();
        values!.Single().Should().StartWith("dossier-");

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("parcelId").GetString().Should().Be(R14Phase2ControllerFactory.BentonParcelId);
        document.RootElement.GetProperty("property").ValueKind.Should().NotBe(JsonValueKind.Null);
        document.RootElement.GetProperty("notes").ValueKind.Should().NotBe(JsonValueKind.Null);
    }

    [Fact]
    public async Task Dossier_CreateNote_ValidationFailure_Returns400()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(
            roles: ["Assessor"],
            perms: ["write:dossier"]);

        var response = await client.PostAsJsonAsync(
            $"/api/dossier/{R14Phase2ControllerFactory.BentonParcelId}/notes",
            new
            {
                Content = "",
                Type = "case_note",
            });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Dossier_Details_MissingPermissions_Returns403()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(roles: ["Assessor"]);

        var response = await client.GetAsync($"/api/dossier/parcels/{R14Phase2ControllerFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Dossier_Details_CostForgeFailure_Returns200WithNullValuation()
    {
        using var factory = await CreateFactoryAsync(options => options.ThrowCostBreakdown = true);
        using var client = factory.CreateAuthenticatedClient(
            roles: ["Assessor"],
            perms: ["read:dossier"]);

        var response = await client.GetAsync($"/api/dossier/parcels/{R14Phase2ControllerFactory.BentonParcelId}/details?include=valuation");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        document.RootElement.GetProperty("valuation").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Properties_GetById_HappyPath_Returns200()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(
            roles: ["Assessor"],
            perms: ["read:properties"]);

        var response = await client.GetAsync($"/api/properties/{R14Phase2ControllerFactory.BentonPropertyId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<PropertyDto>();
        payload.Should().NotBeNull();
        payload!.ParcelNumber.Should().Be(R14Phase2ControllerFactory.BentonParcelId);
    }

    [Fact]
    public async Task Properties_CreateValuation_ValidationFailure_Returns400()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(roles: ["Assessor"]);

        var response = await client.PostAsJsonAsync(
            $"/api/properties/{R14Phase2ControllerFactory.BentonPropertyId}/valuations",
            new
            {
                EstimatedValue = -1,
                Confidence = 2,
            });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Properties_GetById_MissingCountyClaim_Returns403()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(
            roles: ["Assessor"],
            perms: ["read:properties"],
            includeCountyClaims: false);

        var response = await client.GetAsync($"/api/properties/{R14Phase2ControllerFactory.BentonPropertyId}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Properties_GetById_ServiceFailure_Returns500()
    {
        using var factory = await CreateFactoryAsync(options => options.ThrowPropertyLookup = true);
        using var client = factory.CreateAuthenticatedClient(
            roles: ["Assessor"],
            perms: ["read:properties"]);

        var response = await client.GetAsync($"/api/properties/{R14Phase2ControllerFactory.BentonPropertyId}");

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        (await response.Content.ReadAsStringAsync()).Should().Contain("Internal server error");
    }

    [Fact]
    public async Task CodexReports_Daily_HappyPath_Returns200()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(roles: ["Management"]);

        var response = await client.GetAsync("/api/codex/reports/daily");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<ExecutiveReportDto>();
        payload.Should().NotBeNull();
        payload!.ReportType.Should().Be("Daily Operations Report");
    }

    [Fact]
    public async Task CodexReports_Monthly_InvalidQuery_Returns400()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(roles: ["BoardMember"]);

        var response = await client.GetAsync("/api/codex/reports/monthly?year=2026&month=invalid");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CodexReports_Daily_WrongRole_Returns403()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateAuthenticatedClient(roles: ["Assessor"]);

        var response = await client.GetAsync("/api/codex/reports/daily");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CodexReports_Daily_ServiceFailure_Returns500()
    {
        using var factory = await CreateFactoryAsync(options => options.ThrowDailyReport = true);
        using var client = factory.CreateAuthenticatedClient(roles: ["Management"]);

        var response = await client.GetAsync("/api/codex/reports/daily");

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        (await response.Content.ReadAsStringAsync()).Should().Contain("Failed to generate daily report");
    }

    [Fact]
    public async Task Auth_Login_HappyPath_Returns200()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "assessor@county.",
            Password = "supersecurepassword",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<LoginResponse>();
        payload.Should().NotBeNull();
        payload!.Token.Should().Be("r14-generated-token");
    }

    [Fact]
    public async Task Auth_Login_InvalidPayload_Returns400()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "not-an-email",
            Password = "short",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Auth_Profile_Unauthenticated_Returns401()
    {
        using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/auth/profile");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Auth_Revoke_ServiceFailure_Returns500()
    {
        using var factory = await CreateFactoryAsync(options => options.ThrowBlacklistToken = true);
        using var client = factory.CreateClient();
        var token = CreateRevocableJwt();

        var response = await client.PostAsJsonAsync("/api/auth/revoke", new
        {
            Token = token,
        });

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        (await response.Content.ReadAsStringAsync()).Should().Contain("Internal server error");
    }

    private static async Task<R14Phase2ControllerFactory> CreateFactoryAsync(Action<R14Phase2ControllerFactoryOptions>? configure = null)
    {
        var options = new R14Phase2ControllerFactoryOptions();
        configure?.Invoke(options);

        var factory = new R14Phase2ControllerFactory(options);
        await factory.EnsureSeedDataAsync();
        return factory;
    }

    private static string CreateRevocableJwt()
    {
        var token = new JwtSecurityToken(
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Jti, "r14-revoke-jti"),
            ],
            expires: DateTime.UtcNow.AddHours(1));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

internal sealed class R14Phase2ControllerFactoryOptions
{
    public bool ThrowCostForgeAnalysis { get; set; }
    public bool ThrowCostBreakdown { get; set; }
    public bool ThrowPropertyLookup { get; set; }
    public bool ThrowDailyReport { get; set; }
    public bool ThrowBlacklistToken { get; set; }
}

internal sealed class R14Phase2ControllerFactory : WebApplicationFactory<ApiProgram>
{
    public static readonly Guid BentonCountyId = Guid.Parse("14140014-1111-1111-1111-111111111111");
    public static readonly Guid YakimaCountyId = Guid.Parse("14140014-2222-2222-2222-222222222222");
    public static readonly Guid BentonPropertyId = Guid.Parse("14140014-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public const string BentonParcelId = "R14-BENTON-P1";
    public const string AuthScheme = "R14TestAuth";

    private readonly R14Phase2ControllerFactoryOptions _options;
    private readonly string _databaseName = $"r14-phase2-{Guid.NewGuid():N}";
    private readonly SemaphoreSlim _seedLock = new(1, 1);
    private bool _seeded;

    public R14Phase2ControllerFactory(R14Phase2ControllerFactoryOptions options)
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
                ["JwtSettings:SecretKey"] = "R14_PHASE2_TEST_SECRET_KEY_012345678901234567890123456789",
                ["JwtSettings:Issuer"] = "TerraFusionTestIssuer",
                ["JwtSettings:Audience"] = "TerraFusionTestAudience",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<DataDbContext>>();
            services.RemoveAll<DataDbContext>();
            services.AddDbContext<DataDbContext>(options => options.UseInMemoryDatabase(_databaseName));

            RegisterCostForgeServices(services);
            RegisterPropertyServices(services);
            RegisterReportServices(services);
            RegisterAuthServices(services);
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

            if (!await db.Properties.AnyAsync(p => p.Id == BentonPropertyId))
            {
                db.Properties.Add(new Property
                {
                    Id = BentonPropertyId,
                    PropertyId = "R14-PROP-BENTON",
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

            if (!await db.DossierNotes.AnyAsync(n => n.ParcelId == BentonParcelId))
            {
                db.DossierNotes.Add(new DossierNote
                {
                    Id = Guid.Parse("14140014-dddd-dddd-dddd-dddddddddddd"),
                    ParcelId = BentonParcelId,
                    Content = "Benton county dossier note",
                    NoteType = "case_note",
                    CountyId = BentonCountyId,
                    CreatedBy = "r14-user",
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

    public HttpClient CreateAuthenticatedClient(
        string[]? roles = null,
        string[]? perms = null,
        bool includeCountyClaims = true,
        string email = "r14.user@county.")
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "r14-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Email", email);

        if (includeCountyClaims)
        {
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId", BentonCountyId.ToString());
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        }

        if (roles is { Length: > 0 })
        {
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", string.Join(",", roles));
        }

        if (perms is { Length: > 0 })
        {
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Perms", string.Join(",", perms));
        }

        return client;
    }

    private void RegisterCostForgeServices(IServiceCollection services)
    {
        services.RemoveAll<CoreCostForgeService>();
        services.RemoveAll<ICostForgeAIService>();

        var costForge = new Mock<CoreCostForgeService>();
        if (_options.ThrowCostForgeAnalysis)
        {
            costForge
                .Setup(service => service.AnalyzeCostAsync(BentonPropertyId))
                .ThrowsAsync(new InvalidOperationException("R14 cost analysis failure"));
        }
        else
        {
            costForge
                .Setup(service => service.AnalyzeCostAsync(BentonPropertyId))
                .ReturnsAsync(new CostAnalysisDto
                {
                    PropertyId = BentonPropertyId,
                    TotalCost = 275000m,
                    LandValue = 100000m,
                    ImprovementValue = 175000m,
                    MarketAdjustment = 0m,
                    ConfidenceScore = 0.96,
                    AnalysisDate = DateTime.UtcNow,
                    AnalysisMethod = "r14-phase2",
                });
        }

        if (_options.ThrowCostBreakdown)
        {
            costForge
                .Setup(service => service.GetCostBreakdownAsync(BentonPropertyId))
                .ThrowsAsync(new InvalidOperationException("R14 cost breakdown failure"));
        }
        else
        {
            costForge
                .Setup(service => service.GetCostBreakdownAsync(BentonPropertyId))
                .ReturnsAsync(new CostBreakdownDto
                {
                    PropertyId = BentonPropertyId,
                    TotalValue = 275000m,
                    Categories =
                    [
                        new CostCategoryDto
                        {
                            Name = "Structure",
                            Amount = 175000m,
                            Percentage = 63.64,
                        },
                    ],
                });
        }

        services.AddScoped(_ => costForge.Object);
        services.AddScoped(_ => new Mock<ICostForgeAIService>().Object);
    }

    private void RegisterPropertyServices(IServiceCollection services)
    {
        services.RemoveAll<IPropertyService>();

        var propertyService = new Mock<IPropertyService>();
        if (_options.ThrowPropertyLookup)
        {
            propertyService
                .Setup(service => service.GetPropertyByIdAsync(BentonPropertyId, BentonCountyId))
                .ThrowsAsync(new InvalidOperationException("R14 property lookup failure"));
        }
        else
        {
            propertyService
                .Setup(service => service.GetPropertyByIdAsync(BentonPropertyId, BentonCountyId))
                .ReturnsAsync(new PropertyDto
                {
                    Id = BentonPropertyId,
                    ParcelNumber = BentonParcelId,
                    Address = "100 Benton Ave",
                    AssessedValue = 250000m,
                    LandValue = 100000m,
                    ImprovementValue = 150000m,
                    CountyId = BentonCountyId,
                    CountyName = "Benton",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                });
        }

        propertyService
            .Setup(service => service.GetPropertyByIdAsync(It.Is<Guid>(id => id != BentonPropertyId), It.IsAny<Guid>()))
            .ReturnsAsync((PropertyDto?)null);

        propertyService
            .Setup(service => service.CreateValuationAsync(It.IsAny<CreateValuationDto>()))
            .ReturnsAsync((CreateValuationDto createDto) => new ValuationDto
            {
                Id = Guid.NewGuid(),
                PropertyId = createDto.PropertyId,
                AIModelId = createDto.AIModelId,
                EstimatedValue = createDto.EstimatedValue,
                Confidence = createDto.Confidence,
                CreatedAt = DateTime.UtcNow,
            });

        propertyService
            .Setup(service => service.GetPropertyValuationsAsync(It.IsAny<Guid>()))
            .ReturnsAsync(Array.Empty<ValuationDto>());

        propertyService
            .Setup(service => service.GetPropertiesAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<Guid?>()))
            .ReturnsAsync(new PagedResult<PropertyDto>
            {
                Items = [],
                TotalCount = 0,
                Page = 1,
                PageSize = 50,
            });

        propertyService
            .Setup(service => service.GetPropertyStatsAsync())
            .ReturnsAsync(new PropertyStatsDto());

        propertyService
            .Setup(service => service.GetPropertyByParcelAsync(It.IsAny<string>()))
            .ReturnsAsync((PropertyDto?)null);

        services.AddScoped(_ => propertyService.Object);
    }

    private void RegisterReportServices(IServiceCollection services)
    {
        services.RemoveAll<ICodexExecutiveReportService>();

        var reportService = new Mock<ICodexExecutiveReportService>();
        if (_options.ThrowDailyReport)
        {
            reportService
                .Setup(service => service.GenerateDailyReportAsync(It.IsAny<string?>(), It.IsAny<DateTime>()))
                .ThrowsAsync(new InvalidOperationException("R14 report generation failure"));
        }
        else
        {
            reportService
                .Setup(service => service.GenerateDailyReportAsync(It.IsAny<string?>(), It.IsAny<DateTime>()))
                .ReturnsAsync(new ExecutiveReportDto
                {
                    ReportType = "Daily Operations Report",
                    ReportPeriod = "March 09, 2026",
                    CountyId = "Benton",
                    GeneratedAt = DateTime.UtcNow,
                });
        }

        services.AddScoped(_ => reportService.Object);
    }

    private void RegisterAuthServices(IServiceCollection services)
    {
        services.RemoveAll<CoreAuthenticationService>();
        services.RemoveAll<CoreSecurityService>();

        var authService = new Mock<CoreAuthenticationService>();
        authService
            .Setup(service => service.GenerateJwtTokenAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync("r14-generated-token");
        authService
            .Setup(service => service.ValidateTokenAsync(It.IsAny<string>()))
            .ReturnsAsync((ClaimsPrincipal?)null);

        if (_options.ThrowBlacklistToken)
        {
            authService
                .Setup(service => service.BlacklistTokenAsync(It.IsAny<string>(), It.IsAny<DateTime>()))
                .ThrowsAsync(new InvalidOperationException("R14 revoke failure"));
        }
        else
        {
            authService
                .Setup(service => service.BlacklistTokenAsync(It.IsAny<string>(), It.IsAny<DateTime>()))
                .Returns(() => Task.CompletedTask);
        }

        var securityService = new Mock<CoreSecurityService>();
        securityService
            .Setup(service => service.IsValidGovernmentUserAsync(It.IsAny<string>()))
            .ReturnsAsync(true);
        securityService
            .Setup(service => service.LogSecurityEventAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(() => Task.CompletedTask);

        services.AddScoped(_ => authService.Object);
        services.AddScoped(_ => securityService.Object);
    }

    private static void RegisterAuditLogger(IServiceCollection services)
    {
        services.RemoveAll<AuditLogger>();
        services.AddScoped(_ => new Mock<AuditLogger>().Object);
    }
}

internal sealed class R14TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public R14TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authorizationValues))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        if (!AuthenticationHeaderValue.TryParse(authorizationValues.ToString(), out var authHeader))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        if (!string.Equals(authHeader.Scheme, Scheme.Name, StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var userId = Request.Headers["X-Test-UserId"].FirstOrDefault() ?? "r14-user";
        var email = Request.Headers["X-Test-Email"].FirstOrDefault() ?? "r14.user@county.";
        var countyId = Request.Headers["X-Test-CountyId"].FirstOrDefault();
        var countyCode = Request.Headers["X-Test-CountyCode"].FirstOrDefault();
        var roleHeader = Request.Headers["X-Test-Role"].FirstOrDefault();
        var permsHeader = Request.Headers["X-Test-Perms"].FirstOrDefault();

        var claims = new List<Claim>
        {
            new("sub", userId),
            new("userId", userId),
            new("email", email),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, userId),
        };

        if (!string.IsNullOrWhiteSpace(countyId))
        {
            claims.Add(new Claim("countyId", countyId));
        }

        if (!string.IsNullOrWhiteSpace(countyCode))
        {
            claims.Add(new Claim("countyCode", countyCode));
        }

        if (!string.IsNullOrWhiteSpace(roleHeader))
        {
            foreach (var role in roleHeader.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
                claims.Add(new Claim("role", role));
            }
        }

        if (!string.IsNullOrWhiteSpace(permsHeader))
        {
            foreach (var permission in permsHeader.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                claims.Add(new Claim("perm", permission));
            }
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
