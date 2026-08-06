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
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Models;
using TerraFusion.Core.Services;
using TerraFusion.Data.Repositories;
using Xunit;
using ApiProgram = TerraFusion.API.Program;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week5;

[Trait("Category", "R1Week5")]
[Trait("Category", "CX19D1")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx19D1PropertiesCountyIsolationIntegrationTests
    : IClassFixture<Cx19D1PropertiesIsolationFactory>
{
    private static readonly Guid BentonCountyId = Guid.Parse("d1a10000-0000-0000-0000-000000000001");
    private static readonly Guid BentonPropertyId = Guid.Parse("d1a10000-0000-0000-0000-0000000000a1");
    private static readonly Guid YakimaPropertyId = Guid.Parse("d1a10000-0000-0000-0000-0000000000b1");
    private const string SharedParcelNumber = "CX19D1-SHARED-P1";

    private readonly Cx19D1PropertiesIsolationFactory _factory;

    public R1Week5Cx19D1PropertiesCountyIsolationIntegrationTests(Cx19D1PropertiesIsolationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Unauthenticated_GetPropertyById_Returns401()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/properties/{BentonPropertyId}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Authenticated_SameCounty_GetPropertyById_Returns200_WithStableShape()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");
        var response = await client.GetAsync($"/api/properties/{BentonPropertyId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(json);
        document.RootElement.GetProperty("parcelNumber").GetString().Should().Be("CX19D1-BENTON-P1");
    }

    [Fact]
    public async Task Authenticated_CrossCounty_GetPropertyById_Returns404()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");
        var response = await client.GetAsync($"/api/properties/{YakimaPropertyId}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Authenticated_MissingCountyClaims_GetPropertyById_Returns403Or401()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx19D1PropertiesIsolationFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx19d1-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id", Cx19D1PropertiesIsolationFactory.PluginAllPermsId.ToString());

        var response = await client.GetAsync($"/api/properties/{BentonPropertyId}");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Unauthenticated_GetPropertyByParcel_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/properties/parcel/{SharedParcelNumber}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Authenticated_WithoutReadPropertiesPermission_GetPropertyByParcel_Returns403()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");
        client.DefaultRequestHeaders.Remove("X-Plugin-Id");

        var response = await client.GetAsync($"/api/properties/parcel/{SharedParcelNumber}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Authenticated_SearchAndParcelDetail_UseClaimCountyAndFailClosedOnUnscopedGis()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");

        var searchResponse = await client.GetAsync("/api/properties?page=1&pageSize=25&search=CX19D1-SHARED");
        var detailResponse = await client.GetAsync($"/api/properties/parcel/{SharedParcelNumber}");

        searchResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        detailResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var searchDocument = JsonDocument.Parse(await searchResponse.Content.ReadAsStringAsync());
        searchDocument.RootElement.GetProperty("totalCount").GetInt32().Should().Be(1);
        searchDocument.RootElement.GetProperty("items")[0].GetProperty("countyId").GetGuid()
            .Should().Be(BentonCountyId);

        using var detailDocument = JsonDocument.Parse(await detailResponse.Content.ReadAsStringAsync());
        var detail = detailDocument.RootElement;
        detail.GetProperty("countyId").GetGuid().Should().Be(BentonCountyId);
        detail.GetProperty("squareFeet").GetDecimal().Should().Be(1450);
        detail.GetProperty("grossLivingArea").GetDecimal().Should().Be(1450);
        detail.GetProperty("legalDescription").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Authenticated_SameParcelIdentifierAcrossCounties_DoesNotLeakCamaEvidence()
    {
        using var bentonClient = CreateAuthenticatedClient(BentonCountyId, "BENTON");
        using var yakimaClient = CreateAuthenticatedClient(
            Guid.Parse("d1a10000-0000-0000-0000-000000000002"),
            "YAKIMA");

        var bentonResponse = await bentonClient.GetAsync($"/api/properties/parcel/{SharedParcelNumber}");
        var yakimaResponse = await yakimaClient.GetAsync($"/api/properties/parcel/{SharedParcelNumber}");

        bentonResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        yakimaResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var bentonDocument = JsonDocument.Parse(await bentonResponse.Content.ReadAsStringAsync());
        using var yakimaDocument = JsonDocument.Parse(await yakimaResponse.Content.ReadAsStringAsync());
        bentonDocument.RootElement.GetProperty("squareFeet").GetDecimal().Should().Be(1450);
        yakimaDocument.RootElement.GetProperty("squareFeet").GetDecimal().Should().Be(9900);
    }

    [Fact]
    public async Task Authenticated_RequestedCountyMismatchAndUnknownParcel_FailClosed()
    {
        using var client = CreateAuthenticatedClient(BentonCountyId, "BENTON");

        var mismatch = await client.GetAsync(
            "/api/properties?page=1&pageSize=25&countyId=d1a10000-0000-0000-0000-000000000002");
        var unknown = await client.GetAsync("/api/properties/parcel/CX19D1-UNKNOWN");

        mismatch.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        unknown.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task BootstrapDisposableSqliteParcelJourney_SeedsRealPropertyServiceFixture()
    {
        var usesDisposableSqlite = !string.IsNullOrWhiteSpace(
            Environment.GetEnvironmentVariable("WORKBENCH_SMOKE_DATABASE_PATH"));
        var countyId = usesDisposableSqlite
            ? TerraFusion.API.Seeds.DatabaseSeeder.BentonCountyId
            : BentonCountyId;
        var parcel = usesDisposableSqlite ? "SR009A-SYNTHETIC-P1" : SharedParcelNumber;
        using var client = CreateAuthenticatedClient(countyId, "benton");

        var search = await client.GetAsync($"/api/properties?page=1&pageSize=25&search={parcel}");
        var detail = await client.GetAsync($"/api/properties/parcel/{parcel}");
        var detailBody = await detail.Content.ReadAsStringAsync();

        search.StatusCode.Should().Be(HttpStatusCode.OK);
        detail.StatusCode.Should().Be(HttpStatusCode.OK, "the detail response was {0}", detailBody);
    }

    private HttpClient CreateAuthenticatedClient(Guid countyId, string countyCode, string role = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx19D1PropertiesIsolationFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx19d1-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId", countyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", countyCode);
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", role);
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id", Cx19D1PropertiesIsolationFactory.PluginAllPermsId.ToString());
        return client;
    }
}

public sealed class Cx19D1PropertiesIsolationFactory : WebApplicationFactory<ApiProgram>
{
    private static readonly Guid BentonCountyId = Guid.Parse("d1a10000-0000-0000-0000-000000000001");
    private static readonly Guid YakimaCountyId = Guid.Parse("d1a10000-0000-0000-0000-000000000002");
    private static readonly Guid BentonPropertyId = Guid.Parse("d1a10000-0000-0000-0000-0000000000a1");
    private static readonly Guid YakimaPropertyId = Guid.Parse("d1a10000-0000-0000-0000-0000000000b1");
    public static readonly Guid PluginAllPermsId = Guid.Parse("d1a10000-0000-0000-0000-0000000000f1");

    public const string AuthScheme = "Cx19D1TestAuth";
    private const string SharedParcelNumber = "CX19D1-SHARED-P1";

    private readonly string _databaseName = $"cx19d1-properties-{Guid.NewGuid():N}";
    private readonly string? _smokeDatabasePath =
        Environment.GetEnvironmentVariable("WORKBENCH_SMOKE_DATABASE_PATH")?.Trim();

    private bool UsesDisposableSqlite => !string.IsNullOrWhiteSpace(_smokeDatabasePath);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["ConnectionStrings:TerraFusionDatabase"] = "Host=localhost;Database=tf_test;Username=tf;Password=tf",
                ["JwtSettings:SecretKey"] = "CX19D1_TEST_SECRET_KEY_0123456789012345678901234567",
                ["JwtSettings:Issuer"] = "TerraFusionTestIssuer",
                ["JwtSettings:Audience"] = "TerraFusionTestAudience",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<DataDbContext>>();
            services.RemoveAll<DataDbContext>();
            services.AddDbContext<DataDbContext>(options =>
            {
                if (UsesDisposableSqlite)
                    options.UseSqlite($"Data Source={_smokeDatabasePath}");
                else
                    options.UseInMemoryDatabase(_databaseName);
            });

            if (!UsesDisposableSqlite)
            {
                services.RemoveAll<IPropertyService>();
                services.AddScoped(_ =>
                {
                    var mock = new Mock<IPropertyService>();

                mock.Setup(m => m.GetPropertyByIdAsync(BentonPropertyId))
                    .ReturnsAsync(new PropertyDto
                    {
                        Id = BentonPropertyId,
                        ParcelNumber = "CX19D1-BENTON-P1",
                        Address = "100 Benton Ave",
                        CountyId = BentonCountyId,
                        CountyName = "Benton",
                        AssessedValue = 250000,
                        LandValue = 100000,
                        ImprovementValue = 150000,
                    });

                mock.Setup(m => m.GetPropertyByIdAsync(YakimaPropertyId))
                    .ReturnsAsync(new PropertyDto
                    {
                        Id = YakimaPropertyId,
                        ParcelNumber = "CX19D1-YAKIMA-P1",
                        Address = "200 Yakima Ave",
                        CountyId = YakimaCountyId,
                        CountyName = "Yakima",
                        AssessedValue = 300000,
                        LandValue = 120000,
                        ImprovementValue = 180000,
                    });

                mock.Setup(m => m.GetPropertyByIdAsync(BentonPropertyId, BentonCountyId))
                    .ReturnsAsync(new PropertyDto
                    {
                        Id = BentonPropertyId,
                        ParcelNumber = "CX19D1-BENTON-P1",
                        Address = "100 Benton Ave",
                        CountyId = BentonCountyId,
                        CountyName = "Benton",
                        AssessedValue = 250000,
                        LandValue = 100000,
                        ImprovementValue = 150000,
                    });

                mock.Setup(m => m.GetPropertyByIdAsync(YakimaPropertyId, BentonCountyId))
                    .ReturnsAsync((PropertyDto?)null);

                mock.Setup(m => m.GetPropertiesAsync(
                        It.IsAny<int>(),
                        It.IsAny<int>(),
                        It.IsAny<string?>(),
                        BentonCountyId))
                    .ReturnsAsync((int page, int pageSize, string? _, Guid? _) => new PagedResult<PropertyDto>
                    {
                        Items = new[] { BuildSharedParcel(BentonCountyId, "Benton") },
                        TotalCount = 1,
                        Page = page,
                        PageSize = pageSize,
                    });
                mock.Setup(m => m.GetPropertyByParcelAsync(SharedParcelNumber, BentonCountyId))
                    .ReturnsAsync(BuildSharedParcel(BentonCountyId, "Benton"));
                mock.Setup(m => m.GetPropertyByParcelAsync(SharedParcelNumber, YakimaCountyId))
                    .ReturnsAsync(BuildSharedParcel(YakimaCountyId, "Yakima"));
                mock.Setup(m => m.GetPropertyByParcelAsync("CX19D1-UNKNOWN", BentonCountyId))
                    .ReturnsAsync((PropertyDto?)null);

                    return mock.Object;
                });
            }

            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = AuthScheme;
                    options.DefaultChallengeScheme = AuthScheme;
                    options.DefaultScheme = AuthScheme;
                })
                .AddScheme<AuthenticationSchemeOptions, Cx19D1TestAuthHandler>(AuthScheme, _ => { });

            var pluginRepo = new Mock<IPluginRepository>();
            pluginRepo.Setup(r => r.GetByIdAsync(PluginAllPermsId))
                .ReturnsAsync(new Plugin
                {
                    Id = PluginAllPermsId,
                    Name = "CX19D1-AllPerms",
                    Version = "1.0.0",
                    Description = "CX-19D1 test plugin permissions",
                    Category = "test",
                    AuthorId = "cx19d1-test",
                    Status = PluginStatus.Approved,
                    PackageUrl = "https://test.local/pkg",
                    IconUrl = "https://test.local/icon",
                    PermissionsJson = JsonSerializer.Serialize(new[] { "read:properties" }),
                });
            services.RemoveAll<IPluginRepository>();
            services.AddScoped(_ => pluginRepo.Object);
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DataDbContext>();

        if (UsesDisposableSqlite)
        {
            db.Database.EnsureDeleted();
            CreateDisposableParcelSchema(db);
            var countyId = TerraFusion.API.Seeds.DatabaseSeeder.BentonCountyId;
            db.Counties.Add(new TerraFusion.Core.Entities.County
            {
                Id = countyId,
                Name = "Benton",
                State = "WA",
                FipsCode = "53005",
                Population = 0,
                Area = 0,
            });
            db.Properties.Add(new TerraFusion.Core.Entities.Property
            {
                Id = Guid.Parse("be0900a0-0000-0000-0000-000000000001"),
                PropertyId = "SR009A-SYNTHETIC-P1",
                ParcelId = "SR009A-SYNTHETIC-P1",
                ParcelNumber = "SR009A-SYNTHETIC-P1",
                Address = "100 Synthetic Proof Way",
                PropertyType = "Residential",
                AssessedValue = 250000,
                LandValue = 100000,
                ImprovementValue = 150000,
                MarketValue = 250000,
                AssessmentDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                TaxYear = 2025,
                CountyId = countyId,
            });
            db.CamaCharacteristics.Add(new TerraFusion.Core.Entities.CamaCharacteristic
            {
                CountyId = countyId,
                ParcelId = "SR009A-SYNTHETIC-P1",
                TaxYear = 2025,
                BuildingType = "R1",
                SquareFeet = 1450,
            });
            db.GisParcelGeometries.Add(new TerraFusion.Core.Entities.GisParcelGeometry
            {
                ParcelId = "SR009A-SYNTHETIC-P1",
                LegalDescription = "UNSCOPED GIS MUST NOT BE RETURNED",
            });
            db.SaveChanges();
            return host;
        }

        db.Database.EnsureCreated();
        db.CamaCharacteristics.AddRange(
            new TerraFusion.Core.Entities.CamaCharacteristic
            {
                CountyId = BentonCountyId,
                ParcelId = SharedParcelNumber,
                TaxYear = 2025,
                BuildingType = "R1",
                SquareFeet = 1450,
            },
            new TerraFusion.Core.Entities.CamaCharacteristic
            {
                CountyId = YakimaCountyId,
                ParcelId = SharedParcelNumber,
                TaxYear = 2026,
                BuildingType = "R1",
                SquareFeet = 9900,
            });
        db.GisParcelGeometries.Add(new TerraFusion.Core.Entities.GisParcelGeometry
        {
            ParcelId = SharedParcelNumber,
            LegalDescription = "UNSCOPED GIS DESCRIPTION",
        });
        db.SaveChanges();
        return host;
    }

    private static void CreateDisposableParcelSchema(DataDbContext db)
    {
        var createScript = db.Database.GenerateCreateScript().Replace("\r\n", "\n");
        var createdTables = new HashSet<string>(StringComparer.Ordinal);
        var statements = createScript.Split(";\n", StringSplitOptions.RemoveEmptyEntries)
            .Select(statement => statement.Trim())
            .Where(statement => statement.StartsWith("CREATE TABLE \"", StringComparison.Ordinal));

        foreach (var statement in statements)
        {
            var tableNameStart = "CREATE TABLE \"".Length;
            var tableNameEnd = statement.IndexOf('"', tableNameStart);
            var tableName = statement[tableNameStart..tableNameEnd];
            if (createdTables.Add(tableName))
                db.Database.ExecuteSqlRaw(statement);
        }
    }

    private static PropertyDto BuildSharedParcel(Guid countyId, string countyName) => new()
    {
        Id = countyId == BentonCountyId ? BentonPropertyId : YakimaPropertyId,
        ParcelNumber = SharedParcelNumber,
        Address = countyId == BentonCountyId ? "100 Benton Ave" : "200 Yakima Ave",
        CountyId = countyId,
        CountyName = countyName,
        AssessedValue = countyId == BentonCountyId ? 250000 : 300000,
        LandValue = countyId == BentonCountyId ? 100000 : 120000,
        ImprovementValue = countyId == BentonCountyId ? 150000 : 180000,
    };
}

public sealed class Cx19D1TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public Cx19D1TestAuthHandler(
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

        var userId = Request.Headers["X-Test-UserId"].FirstOrDefault() ?? "cx19d1-user";
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
