using System.Net;
using System.Net.Http.Headers;
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
}
