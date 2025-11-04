using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using TerraFusion.API;
using Xunit;

namespace TerraFusion.Tests.Integration;

/// <summary>
/// IntegrationTest087 - AI Generated Integration Test
/// Component: Component87
/// Generated: 2025-10-18 23:26:11 UTC
/// </summary>
public class IntegrationTest087 : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public IntegrationTest087(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task EndpointIntegration_ValidRequest_ReturnsExpectedResponse()
    {
        // Arrange - API integration test
        var requestData = new { County = "Benton County", Type = "Integration" };
        
        // Act
        var response = await _client.PostAsJsonAsync("/api/Component87", requestData);
        
        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Benton County");
    }

    [Fact]
    public async Task DatabaseIntegration_CRUD_Operations_WorkCorrectly()
    {
        // Arrange - Database integration
        var entity = CreateTestEntity();
        
        // Act - Create
        var createResponse = await _client.PostAsJsonAsync("/api/Component87", entity);
        createResponse.IsSuccessStatusCode.Should().BeTrue();
        
        var createdEntity = await createResponse.Content.ReadFromJsonAsync<dynamic>();
        var entityId = createdEntity.id;
        
        // Act - Read
        var readResponse = await _client.GetAsync("/api/Component87/{entityId}");
        readResponse.IsSuccessStatusCode.Should().BeTrue();
        
        // Act - Update  
        entity.UpdatedField = "Modified Value";
        var updateResponse = await _client.PutAsJsonAsync("/api/Component87/{entityId}", entity);
        updateResponse.IsSuccessStatusCode.Should().BeTrue();
        
        // Act - Delete
        var deleteResponse = await _client.DeleteAsync("/api/Component87/{entityId}");
        deleteResponse.IsSuccessStatusCode.Should().BeTrue();
        
        // Assert - Verify deletion
        var verifyResponse = await _client.GetAsync("/api/Component87/{entityId}");
        verifyResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ExternalSystemIntegration_HarrisPACS_ConnectsSuccessfully()
    {
        // Arrange - Harris PACS v12.4.7 integration test
        var packetRequest = new { County = "Benton County", System = "Harris_PACS", Version = "12.4.7" };
        
        // Act
        var response = await _client.PostAsJsonAsync("/api/integrations/harris-pacs", packetRequest);
        
        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var result = await response.Content.ReadFromJsonAsync<dynamic>();
        result.connectionEstablished.Should().BeTrue();
        result.systemVersion.Should().Be("12.4.7");
    }

    private object CreateTestEntity() => new { 
        Name = "Test Entity", 
        County = "Benton County",
        Type = "Integration Test"
    };
}
