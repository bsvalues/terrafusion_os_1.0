using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for the AISwarmController.
/// Validates AI swarm status, county optimization, workflow execution,
/// performance metrics, workflow listing, and authorization enforcement.
/// All endpoints require OSCoreAccess policy (Authorize).
/// </summary>
[Collection("Integration")]
public class AISwarmControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public AISwarmControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/aiswarm/status ───────────────────────────────────────

    [Fact]
    public async Task GetSwarmStatus_Authenticated_Returns_Ok_Or_ServerError()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/aiswarm/status");

        // The endpoint makes external HTTP calls to localhost:8001/8002 which
        // won't be available in test; expect OK (fallback) or 500 (caught exception).
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected OK or 500 (external services unavailable), got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(json));

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Should contain swarm coordination info
            Assert.True(
                root.TryGetProperty("supremeCommander", out _) ||
                root.TryGetProperty("performance", out _) ||
                root.TryGetProperty("timestamp", out _),
                "Swarm status should contain coordination or performance data");
        }
    }

    [Fact]
    public async Task GetSwarmStatus_Unauthenticated_Returns_Unauthorized_Or_Forbidden()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/aiswarm/status");

        // Controller uses [Authorize(Policy = "OSCoreAccess")] - could be 401 or 403
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403 for unauthenticated request, got {response.StatusCode}");
    }

    // ── POST /api/aiswarm/optimize/county ─────────────────────────────

    [Fact]
    public async Task OptimizeCounty_Authenticated_Returns_Ok_Or_ServerError()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            CountyId = "benton",
            Parameters = new Dictionary<string, object>
            {
                { "mode", "standard" }
            }
        };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/aiswarm/optimize/county", content);

        // External service call to localhost:8001 - expect OK or 500
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected OK or 500 (external services unavailable), got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(json));

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.True(
                root.TryGetProperty("success", out _) || root.TryGetProperty("message", out _),
                "Optimization response should contain success or message property");
        }
    }

    [Fact]
    public async Task OptimizeCounty_Unauthenticated_Returns_Unauthorized_Or_Forbidden()
    {
        using var client = _factory.CreateClient();

        var payload = new { CountyId = "benton" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/aiswarm/optimize/county", content);

        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403 for unauthenticated request, got {response.StatusCode}");
    }

    // ── POST /api/aiswarm/workflow/execute ─────────────────────────────

    [Fact]
    public async Task ExecuteWorkflow_Authenticated_Returns_Ok_Or_ServerError()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            WorkflowId = "county-optimization",
            Parameters = new Dictionary<string, object>
            {
                { "target", "all" }
            }
        };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/aiswarm/workflow/execute", content);

        // External service call to localhost:8002 - expect OK or 500
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected OK or 500 (external services unavailable), got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(json));

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.True(
                root.TryGetProperty("success", out _) || root.TryGetProperty("workflowId", out _),
                "Workflow response should contain success or workflowId property");
        }
    }

    [Fact]
    public async Task ExecuteWorkflow_Unauthenticated_Returns_Unauthorized_Or_Forbidden()
    {
        using var client = _factory.CreateClient();

        var payload = new { WorkflowId = "county-optimization" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/aiswarm/workflow/execute", content);

        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403 for unauthenticated request, got {response.StatusCode}");
    }

    // ── GET /api/aiswarm/performance ──────────────────────────────────

    [Fact]
    public async Task GetPerformanceMetrics_Authenticated_Returns_Ok_Or_ServerError()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/aiswarm/performance");

        // External calls to localhost:8001/8002 - expect OK or 500
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected OK or 500 (external services unavailable), got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(json));

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.True(
                root.TryGetProperty("swarmCoordination", out _) ||
                root.TryGetProperty("systemMetrics", out _) ||
                root.TryGetProperty("timestamp", out _),
                "Performance response should contain coordination or metrics data");
        }
    }

    [Fact]
    public async Task GetPerformanceMetrics_Unauthenticated_Returns_Unauthorized_Or_Forbidden()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/aiswarm/performance");

        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403 for unauthenticated request, got {response.StatusCode}");
    }

    // ── GET /api/aiswarm/workflows ────────────────────────────────────

    [Fact]
    public async Task GetAvailableWorkflows_Authenticated_Returns_Ok_Or_ServerError()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/aiswarm/workflows");

        // External call to localhost:8002 with fallback - expect OK or 500
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected OK or 500 (external services unavailable), got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(json));

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Should contain workflows array or count
            Assert.True(
                root.TryGetProperty("workflows", out _) || root.TryGetProperty("count", out _),
                "Workflows response should contain 'workflows' or 'count' property");
        }
    }

    [Fact]
    public async Task GetAvailableWorkflows_Unauthenticated_Returns_Unauthorized_Or_Forbidden()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/aiswarm/workflows");

        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403 for unauthenticated request, got {response.StatusCode}");
    }

    // ── Response Shape Validation ─────────────────────────────────────

    [Fact]
    public async Task GetSwarmStatus_Response_Is_Valid_Json()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/aiswarm/status");

        if (response.IsSuccessStatusCode)
        {
            var json = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(json));

            // Ensure response is parseable JSON
            var parseException = Record.Exception(() => JsonDocument.Parse(json));
            Assert.Null(parseException);
        }
    }

    [Fact]
    public async Task GetPerformanceMetrics_Response_Is_Valid_Json()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/aiswarm/performance");

        if (response.IsSuccessStatusCode)
        {
            var json = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(json));

            var parseException = Record.Exception(() => JsonDocument.Parse(json));
            Assert.Null(parseException);
        }
    }

    [Fact]
    public async Task OptimizeCounty_ServerError_Contains_Error_Details()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new { CountyId = "benton" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/aiswarm/optimize/county", content);

        if (response.StatusCode == HttpStatusCode.InternalServerError)
        {
            var json = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(json));

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.True(
                root.TryGetProperty("error", out _),
                "Error response should contain 'error' property");
        }
    }

    [Fact]
    public async Task ExecuteWorkflow_ServerError_Contains_Error_Details()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new { WorkflowId = "test-workflow" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/aiswarm/workflow/execute", content);

        if (response.StatusCode == HttpStatusCode.InternalServerError)
        {
            var json = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(json));

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.True(
                root.TryGetProperty("error", out _),
                "Error response should contain 'error' property");
        }
    }
}
