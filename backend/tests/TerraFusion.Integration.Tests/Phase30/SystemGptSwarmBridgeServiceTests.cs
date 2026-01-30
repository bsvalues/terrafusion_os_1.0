// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30 TESTS: SystemGptSwarmBridgeService Unit Tests
// TDD Red Phase: Write tests BEFORE implementation
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using System.Text.Json;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase30;

/// <summary>
/// Phase 30: Swarm Bridge Service tests.
/// Tests the bridge that executes Swarm actions via external API calls.
///
/// Test Plan Section 3-B:
/// - Action → API endpoint mapping
/// - Success/failure handling
/// - Timeout handling
/// - Response parsing
/// </summary>
public class SystemGptSwarmBridgeServiceTests
{
    private readonly Mock<ILogger<SystemGptSwarmBridgeService>> _loggerMock;
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
    private readonly SwarmBridgeOptions _defaultOptions;

    public SystemGptSwarmBridgeServiceTests()
    {
        _loggerMock = new Mock<ILogger<SystemGptSwarmBridgeService>>();
        _httpClientFactoryMock = new Mock<IHttpClientFactory>();
        _defaultOptions = new SwarmBridgeOptions
        {
            SwarmControlPlaneUrl = "http://localhost:9000/swarm",
            TimeoutSeconds = 30,
            MaxRetries = 3,
            RetryDelayMs = 100
        };
    }

    private SystemGptSwarmBridgeService CreateService(
        HttpClient? httpClient = null,
        SwarmBridgeOptions? options = null)
    {
        var client = httpClient ?? CreateMockHttpClient(HttpStatusCode.OK, new { success = true });
        _httpClientFactoryMock
            .Setup(f => f.CreateClient(It.IsAny<string>()))
            .Returns(client);

        var opts = Options.Create(options ?? _defaultOptions);
        return new SystemGptSwarmBridgeService(
            _httpClientFactoryMock.Object,
            opts,
            _loggerMock.Object);
    }

    #region Action → API Endpoint Mapping

    [Fact]
    public async Task ExecuteActionAsync_EnableSafeMode_CallsCorrectEndpoint()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            JsonSerializer.Serialize(new { success = true, message = "SafeMode enabled" }));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "benton",
            Action = SwarmActionKind.EnableSafeMode,
            Reason = "High error rate detected"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(SwarmActionKind.EnableSafeMode, result.Action);
        Assert.Equal("benton", result.CountyId);
        Assert.Contains("/safemode/enable", messageHandler.LastRequestUri?.ToString() ?? "");
    }

    [Fact]
    public async Task ExecuteActionAsync_DisableSafeMode_CallsCorrectEndpoint()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            JsonSerializer.Serialize(new { success = true }));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "yakima",
            Action = SwarmActionKind.DisableSafeMode,
            Reason = "System recovered"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.Success);
        Assert.Contains("/safemode/disable", messageHandler.LastRequestUri?.ToString() ?? "");
    }

    [Fact]
    public async Task ExecuteActionAsync_IncreaseCapacity_CallsCorrectEndpoint()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            JsonSerializer.Serialize(new { success = true, newCapacity = 70 }));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "king",
            Action = SwarmActionKind.IncreaseCapacity,
            Reason = "High latency detected"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.Success);
        Assert.Contains("/capacity/increase", messageHandler.LastRequestUri?.ToString() ?? "");
    }

    [Fact]
    public async Task ExecuteActionAsync_DecreaseCapacity_CallsCorrectEndpoint()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            JsonSerializer.Serialize(new { success = true, newCapacity = 40 }));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "pierce",
            Action = SwarmActionKind.DecreaseCapacity,
            Reason = "Low load detected"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.Success);
        Assert.Contains("/capacity/decrease", messageHandler.LastRequestUri?.ToString() ?? "");
    }

    [Fact]
    public async Task ExecuteActionAsync_ThrottleRequests_CallsCorrectEndpoint()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            JsonSerializer.Serialize(new { success = true }));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "spokane",
            Action = SwarmActionKind.ThrottleRequests,
            Reason = "Approaching overload"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.Success);
        Assert.Contains("/throttle/enable", messageHandler.LastRequestUri?.ToString() ?? "");
    }

    [Fact]
    public async Task ExecuteActionAsync_RelaxThrottle_CallsCorrectEndpoint()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            JsonSerializer.Serialize(new { success = true }));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "clark",
            Action = SwarmActionKind.RelaxThrottle,
            Reason = "System stable"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.Success);
        Assert.Contains("/throttle/disable", messageHandler.LastRequestUri?.ToString() ?? "");
    }

    [Fact]
    public async Task ExecuteActionAsync_RouteToSafeModel_CallsCorrectEndpoint()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            JsonSerializer.Serialize(new { success = true, model = "gpt-3.5-turbo" }));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "thurston",
            Action = SwarmActionKind.RouteToSafeModel,
            Reason = "Primary model unavailable"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.Success);
        Assert.Contains("/route/safemodel", messageHandler.LastRequestUri?.ToString() ?? "");
    }

    [Fact]
    public async Task ExecuteActionAsync_NoneAction_SkipsExecution()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(HttpStatusCode.OK, "{}");
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "snohomish",
            Action = SwarmActionKind.None,
            Reason = "System normal"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(SwarmActionKind.None, result.Action);
        Assert.Null(messageHandler.LastRequestUri); // No HTTP call made
    }

    #endregion

    #region Failure Handling

    [Fact]
    public async Task ExecuteActionAsync_HttpError_ReturnsFailure()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.InternalServerError,
            JsonSerializer.Serialize(new { error = "Swarm overloaded" }));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "benton",
            Action = SwarmActionKind.EnableSafeMode,
            Reason = "Test"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.FailureReason);
        Assert.Contains("500", result.FailureReason);
    }

    [Fact]
    public async Task ExecuteActionAsync_NetworkError_ReturnsFailure()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(new HttpRequestException("Connection refused"));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "benton",
            Action = SwarmActionKind.IncreaseCapacity,
            Reason = "Test"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.FailureReason);
    }

    [Theory]
    [InlineData(HttpStatusCode.BadRequest)]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.Forbidden)]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    public async Task ExecuteActionAsync_VariousHttpErrors_ReturnsFailure(HttpStatusCode statusCode)
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(statusCode, "{}");
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "test_county",
            Action = SwarmActionKind.EnableSafeMode,
            Reason = "Test"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.False(result.Success);
        Assert.Contains(((int)statusCode).ToString(), result.FailureReason ?? "");
    }

    #endregion

    #region Timeout Handling

    [Fact]
    public async Task ExecuteActionAsync_Timeout_ReturnsFailure()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(TimeSpan.FromSeconds(60)); // Longer than timeout
        var client = new HttpClient(messageHandler);
        var options = new SwarmBridgeOptions
        {
            SwarmControlPlaneUrl = "http://localhost:9000/swarm",
            TimeoutSeconds = 1, // Very short timeout for test
            MaxRetries = 1,
            RetryDelayMs = 10
        };
        var service = CreateService(client, options);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "timeout_county",
            Action = SwarmActionKind.EnableSafeMode,
            Reason = "Test timeout"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("timeout", result.FailureReason?.ToLower() ?? "");
    }

    #endregion

    #region Response Parsing

    [Fact]
    public async Task ExecuteActionAsync_ValidResponse_ParsesMessage()
    {
        // Arrange
        var responseContent = new
        {
            success = true,
            message = "SafeMode enabled for benton",
            timestamp = DateTimeOffset.UtcNow
        };
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            JsonSerializer.Serialize(responseContent));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "benton",
            Action = SwarmActionKind.EnableSafeMode,
            Reason = "Test"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.Success);
        Assert.Contains("SafeMode enabled", result.ResponseMessage ?? "");
    }

    [Fact]
    public async Task ExecuteActionAsync_MalformedResponse_HandlesGracefully()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            "not json at all {{{");
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "benton",
            Action = SwarmActionKind.EnableSafeMode,
            Reason = "Test"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert - should still succeed if HTTP was 200
        Assert.True(result.Success);
    }

    #endregion

    #region Request Body Validation

    [Fact]
    public async Task ExecuteActionAsync_IncludesCountyIdInRequest()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(HttpStatusCode.OK, "{}");
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "benton",
            Action = SwarmActionKind.EnableSafeMode,
            Reason = "High error rate"
        };

        // Act
        await service.ExecuteActionAsync(decision);

        // Assert
        var requestBody = messageHandler.LastRequestContent ?? "";
        Assert.Contains("benton", requestBody);
    }

    [Fact]
    public async Task ExecuteActionAsync_IncludesReasonInRequest()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(HttpStatusCode.OK, "{}");
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "yakima",
            Action = SwarmActionKind.IncreaseCapacity,
            Reason = "Critical latency threshold exceeded"
        };

        // Act
        await service.ExecuteActionAsync(decision);

        // Assert
        var requestBody = messageHandler.LastRequestContent ?? "";
        Assert.Contains("latency", requestBody.ToLower());
    }

    #endregion

    #region Execution Time Tracking

    [Fact]
    public async Task ExecuteActionAsync_TracksExecutionTime()
    {
        // Arrange
        var messageHandler = new MockHttpMessageHandler(
            HttpStatusCode.OK,
            "{}",
            delay: TimeSpan.FromMilliseconds(50));
        var client = new HttpClient(messageHandler);
        var service = CreateService(client);

        var decision = new SwarmPolicyDecision
        {
            CountyId = "test",
            Action = SwarmActionKind.EnableSafeMode,
            Reason = "Test"
        };

        // Act
        var result = await service.ExecuteActionAsync(decision);

        // Assert
        Assert.True(result.ExecutionTimeMs >= 40); // Some timing variance
    }

    #endregion

    #region Helper Methods and Mock Classes

    private static HttpClient CreateMockHttpClient(HttpStatusCode statusCode, object responseBody)
    {
        var handler = new MockHttpMessageHandler(statusCode, JsonSerializer.Serialize(responseBody));
        return new HttpClient(handler);
    }

    #endregion
}

/// <summary>
/// Mock HTTP message handler for testing.
/// </summary>
public class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _statusCode;
    private readonly string _responseContent;
    private readonly HttpRequestException? _exception;
    private readonly TimeSpan _delay;

    public Uri? LastRequestUri { get; private set; }
    public string? LastRequestContent { get; private set; }

    public MockHttpMessageHandler(HttpStatusCode statusCode, string responseContent, TimeSpan? delay = null)
    {
        _statusCode = statusCode;
        _responseContent = responseContent;
        _delay = delay ?? TimeSpan.Zero;
    }

    public MockHttpMessageHandler(HttpRequestException exception)
    {
        _exception = exception;
        _statusCode = HttpStatusCode.InternalServerError;
        _responseContent = "";
    }

    public MockHttpMessageHandler(TimeSpan timeout)
    {
        _statusCode = HttpStatusCode.OK;
        _responseContent = "";
        _delay = timeout;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        LastRequestUri = request.RequestUri;

        if (request.Content != null)
        {
            LastRequestContent = await request.Content.ReadAsStringAsync(cancellationToken);
        }

        if (_exception != null)
        {
            throw _exception;
        }

        if (_delay > TimeSpan.Zero)
        {
            await Task.Delay(_delay, cancellationToken);
        }

        return new HttpResponseMessage(_statusCode)
        {
            Content = new StringContent(_responseContent)
        };
    }
}
// SwarmBridgeOptions is defined in TerraFusion.AI.Services namespace
