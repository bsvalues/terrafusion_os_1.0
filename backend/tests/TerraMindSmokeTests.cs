using System.Net.Http.Json;
using Xunit;

public class TerraMindSmokeTests : IClassFixture<WebAppFactory>
{
    private readonly HttpClient _client;
    public TerraMindSmokeTests(WebAppFactory f){ _client = f.CreateClient(); }

    [Fact]
    public async Task TerraMind_Status_And_Models()
    {
        var status = await _client.GetAsync("/api/terramind/status");
        Assert.True(status.IsSuccessStatusCode);

        var models = await _client.GetFromJsonAsync<string[]>("/api/terramind/models");
        Assert.NotNull(models);
        Assert.NotEmpty(models!);
    }

    [Fact]
    public async Task Modules_Validate_Is_Ok()
    {
        var res = await _client.GetAsync("/api/modules/validate");
        Assert.True(res.IsSuccessStatusCode);
    }
}