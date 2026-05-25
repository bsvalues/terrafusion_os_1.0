using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.SmokeTests;

public sealed class CurrentUseEndpointSmokeTests
{
    private readonly HttpClient _client;

    public CurrentUseEndpointSmokeTests()
    {
        // Replace with WebApplicationFactory in real test project.
        _client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:5000")
        };
    }

    [Fact(Skip = "Enable in local integration test environment.")]
    public async Task Core_Overview_Returns_200()
    {
        var parcelId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        var response = await _client.GetAsync($"/api/forge/current-use/parcels/{parcelId}/overview");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact(Skip = "Enable in local integration test environment.")]
    public async Task Policy_Resolve_Returns_200()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/forge/current-use/policy/resolve",
            new
            {
                countyId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                evaluationDate = "2026-03-15"
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
