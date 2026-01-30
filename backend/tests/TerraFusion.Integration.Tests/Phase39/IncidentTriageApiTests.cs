// =============================================================================
// Phase 39: Incident Triage API - Integration Tests
// =============================================================================
// Tests the POST /api/ops/incidents/triage endpoint.
// =============================================================================

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Operations.Incidents;
using TerraFusion.Integration.Tests.Infrastructure;

namespace TerraFusion.Integration.Tests.Phase39;

/// <summary>
/// Integration tests for the Incident Triage API endpoint.
/// </summary>
[Trait("Category", "Phase39")]
[Trait("Category", "Integration")]
public class IncidentTriageApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public IncidentTriageApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddAuthentication("Test")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });

                services.AddAuthorization(options =>
                {
                    options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder("Test")
                        .RequireAuthenticatedUser()
                        .Build();
                });
            });
        });

        _client = _factory.CreateClient();
    }

    // =========================================================================
    // SECTION A: Basic API Endpoint Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_ReturnsOk_WithValidRequest()
    {
        // Arrange
        var request = CreateValidRequest();

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_ReturnsIncidentSummary()
    {
        // Arrange
        var request = CreateValidRequest();

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);
        var result = await response.Content.ReadFromJsonAsync<IncidentSummary>(JsonOptions);

        // Assert
        result.Should().NotBeNull();
        result!.IncidentId.Should().NotBe(Guid.Empty);
        result.Title.Should().NotBeNullOrWhiteSpace();
        result.OverallSeverity.Should().BeOneOf(
            IncidentSeverity.Info,
            IncidentSeverity.Warning,
            IncidentSeverity.Critical);
    }

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_ReturnsBadRequest_WhenNoAlerts()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>()
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_ReturnsBadRequest_WhenNullRequest()
    {
        // Arrange - send null
        var content = new StringContent("null", System.Text.Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/ops/incidents/triage", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // =========================================================================
    // SECTION B: Response Content Validation
    // =========================================================================

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_ReturnsRecommendations()
    {
        // Arrange
        var request = CreateValidRequest();

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);
        var result = await response.Content.ReadFromJsonAsync<IncidentSummary>(JsonOptions);

        // Assert
        result!.Recommendations.Should().NotBeEmpty();
        result.Recommendations.Should().AllSatisfy(r =>
        {
            r.Id.Should().NotBeNullOrWhiteSpace();
            r.Text.Should().NotBeNullOrWhiteSpace();
        });
    }

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_IncludesAuditInfo()
    {
        // Arrange
        var request = CreateValidRequest();

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);
        var result = await response.Content.ReadFromJsonAsync<IncidentSummary>(JsonOptions);

        // Assert
        result!.AuditInfo.Should().NotBeNull();
        result.AuditInfo!.TriageEngineVersion.Should().NotBeNullOrWhiteSpace();
        result.AuditInfo.TriageDurationMs.Should().BeGreaterOrEqualTo(0);
    }

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_SetsGovernmentFlag()
    {
        // Arrange
        var request = CreateValidRequest();

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);
        var result = await response.Content.ReadFromJsonAsync<IncidentSummary>(JsonOptions);

        // Assert
        result!.Government.Should().BeTrue();
    }

    // =========================================================================
    // SECTION C: Severity Mapping Tests
    // =========================================================================

    [Theory]
    [InlineData("critical", IncidentSeverity.Critical)]
    [InlineData("warning", IncidentSeverity.Warning)]
    [InlineData("info", IncidentSeverity.Info)]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_MapsSeverityCorrectly(
        string alertSeverity,
        IncidentSeverity expectedIncidentSeverity)
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "TestAlert",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = alertSeverity,
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = $"test-{alertSeverity}"
                }
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);
        var result = await response.Content.ReadFromJsonAsync<IncidentSummary>(JsonOptions);

        // Assert
        result!.OverallSeverity.Should().Be(expectedIncidentSeverity);
    }

    // =========================================================================
    // SECTION D: With Explanation Option Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_WithExplanation_ReturnsSuccessResponse()
    {
        // Note: This test validates the API accepts the request.
        // Actual explanation depends on LLM service configuration.

        // Arrange
        var request = CreateValidRequest();

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        // Explanation may be null if NullIncidentExplanationService is registered
    }

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_ReturnsNullExplanationByDefault()
    {
        // Arrange
        var request = CreateValidRequest();

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);
        var result = await response.Content.ReadFromJsonAsync<IncidentSummary>(JsonOptions);

        // Assert - explanation is null when NullIncidentExplanationService is used
        result!.Explanation.Should().BeNull();
    }

    // =========================================================================
    // SECTION E: Content-Type and Headers
    // =========================================================================

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_ReturnsJsonContentType()
    {
        // Arrange
        var request = CreateValidRequest();

        // Act
        var response = await _client.PostAsJsonAsync("/api/ops/incidents/triage", request);

        // Assert
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    [Trait("Category", "API")]
    public async Task POST_TriageEndpoint_RejectsInvalidContentType()
    {
        // Arrange
        var content = new StringContent("<xml>invalid</xml>", System.Text.Encoding.UTF8, "application/xml");

        // Act
        var response = await _client.PostAsync("/api/ops/incidents/triage", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.UnsupportedMediaType);
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private static IncidentTriageRequest CreateValidRequest()
    {
        return new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "AtlasForecastStale",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "critical",
                        ["component"] = "atlas",
                        ["government"] = "true"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = "test-fingerprint-001"
                }
            },
            MetricSnapshots = new List<IncidentMetricSnapshot>
            {
                new IncidentMetricSnapshot
                {
                    CountyId = BentonCountyId,
                    MetricName = "atlas_forecast_engine_runs_total",
                    Value = 0,
                    Timestamp = BaseTime
                }
            }
        };
    }
}
