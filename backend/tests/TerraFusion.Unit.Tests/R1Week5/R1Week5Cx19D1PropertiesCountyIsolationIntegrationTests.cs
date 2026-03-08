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

    private readonly string _databaseName = $"cx19d1-properties-{Guid.NewGuid():N}";

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
            services.AddDbContext<DataDbContext>(options => options.UseInMemoryDatabase(_databaseName));

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

                return mock.Object;
            });

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
