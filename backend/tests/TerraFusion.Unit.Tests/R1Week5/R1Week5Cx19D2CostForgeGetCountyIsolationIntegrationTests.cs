using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using ApiProgram = TerraFusion.API.Program;

namespace TerraFusion.Unit.Tests.R1Week5;

[Trait("Category", "R1Week5")]
[Trait("Category", "CX19D2")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx19D2CostForgeGetCountyIsolationIntegrationTests
    : IClassFixture<Cx19CrossCountyFactory>, IAsyncLifetime
{
    private readonly Cx19CrossCountyFactory _factory;

    public R1Week5Cx19D2CostForgeGetCountyIsolationIntegrationTests(Cx19CrossCountyFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task CostForge_Breakdown_SameCounty_ReturnsNonLeakSuccessStatus()
    {
        using var client = CreateBentonClient();
        var response = await client.GetAsync($"/api/CostForge/{Cx19CrossCountyFactory.BentonPropertyGuid}/breakdown");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CostForge_Breakdown_CrossCounty_Returns404()
    {
        using var client = CreateBentonClient();
        var response = await client.GetAsync($"/api/CostForge/{Cx19CrossCountyFactory.KingPropertyGuid}/breakdown");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CostForge_Forecast_CrossCounty_Returns404()
    {
        using var client = CreateBentonClient();
        var response = await client.GetAsync($"/api/CostForge/{Cx19CrossCountyFactory.KingPropertyGuid}/forecast?years=5");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CostForge_Compare_WhenSecondPropertyCrossCounty_Returns404()
    {
        using var client = CreateBentonClient();
        var response = await client.GetAsync(
            $"/api/CostForge/compare/{Cx19CrossCountyFactory.BentonPropertyGuid}/{Cx19CrossCountyFactory.KingPropertyGuid}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CostForge_Breakdown_AuthenticatedWithoutCountyClaims_Returns403Or401()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx19d2-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id", Cx19CrossCountyFactory.PluginAllPermsId.ToString());

        var response = await client.GetAsync($"/api/CostForge/{Cx19CrossCountyFactory.BentonPropertyGuid}/breakdown");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("/api/CostForge/cost-matrix/benton")]
    [InlineData("/api/CostForge/depreciation-schedule")]
    [InlineData("/api/CostForge/income-approach/cap-rates")]
    [InlineData("/api/CostForge/sales-comparison/adjustment-factors")]
    public async Task CostForge_BentonCertifiedReferenceGets_Returns409ForNonBentonCounty(string path)
    {
        using var client = CreateKingClient();

        var response = await client.GetAsync(path);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        response.Headers.TryGetValues("X-CostForge-Reference-Posture", out var values).Should().BeTrue();
        values.Should().Contain("certified-lane-unavailable");
    }

    [Fact]
    public async Task CostForge_CostEstimate_Returns409ForNonBentonCounty()
    {
        using var client = CreateKingClient();

        var response = await client.PostAsJsonAsync("/api/CostForge/cost-estimate", new
        {
            BuildingType = "R1",
            Region = "Reval 1",
            SquareFeet = 1800,
            YearBuilt = 2000,
            QualityGrade = "STANDARD",
            ConditionGrade = "GOOD",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        response.Headers.TryGetValues("X-CostForge-Reference-Posture", out var values).Should().BeTrue();
        values.Should().Contain("certified-lane-unavailable");
    }

    [Fact]
    public async Task CostForge_DepreciationCalculate_Returns409ForNonBentonCounty()
    {
        using var client = CreateKingClient();

        var response = await client.PostAsJsonAsync("/api/CostForge/depreciation-calculate", new
        {
            ActualAge = 10,
            EffectiveAge = 10,
            Condition = "GOOD",
            Quality = "STANDARD",
            ReplacementCostNew = 250000,
        });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        response.Headers.TryGetValues("X-CostForge-Reference-Posture", out var values).Should().BeTrue();
        values.Should().Contain("certified-lane-unavailable");
    }

    [Fact]
    public async Task CostForge_BentonCertifiedReferenceAllowsBentonCounty()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync("/api/CostForge/cost-matrix/benton?buildingType=R1&region=Reval%201");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.TryGetValues("X-CostForge-Source", out var values).Should().BeTrue();
        values.Should().Contain("benton-real-calculator-fy2025");
    }

    [Fact]
    public async Task AiModules_PredictCost_Returns409ForNonBentonCounty()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.TryAddWithoutValidation("x-county-code", "KING");

        var response = await client.PostAsJsonAsync("/api/AIModules/predict-cost", new
        {
            BuildingType = "R1",
            RevalArea = "Reval 1",
            SquareFootage = 1800,
            Quality = "STANDARD",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        response.Headers.TryGetValues("X-AI-Cost-Reference-Posture", out var values).Should().BeTrue();
        values.Should().Contain("certified-lane-unavailable");
    }

    [Fact]
    public async Task AiModules_PredictCost_AllowsExplicitBentonScope()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.TryAddWithoutValidation("x-county-code", "BENTON");

        var response = await client.PostAsJsonAsync("/api/AIModules/predict-cost", new
        {
            BuildingType = "R1",
            RevalArea = "Reval 1",
            SquareFootage = 1800,
            Quality = "STANDARD",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private HttpClient CreateBentonClient(string roles = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx19d2-benton-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Test-CountyId", Cx19CrossCountyFactory.BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", roles);
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id", Cx19CrossCountyFactory.PluginAllPermsId.ToString());
        return client;
    }

    private HttpClient CreateKingClient(string roles = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx19d2-king-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Test-CountyId", Cx19CrossCountyFactory.KingCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "KING");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", roles);
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id", Cx19CrossCountyFactory.PluginAllPermsId.ToString());
        return client;
    }
}
