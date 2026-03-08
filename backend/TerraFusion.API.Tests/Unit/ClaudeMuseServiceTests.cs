using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.API.Tests.Unit;

/// <summary>
/// Unit tests for ClaudeMuseService — the Claude-powered Muse engine.
/// Tests:
///   - Success path: Claude API returns valid response
///   - Failure path: Claude API fails, service falls back to template engine
///   - Health flag transitions (_isHealthy toggling)
///   - Capabilities reflection based on health state
///   - Fallback field set correctly on results
///
/// Uses Moq to mock IHttpClientFactory and the underlying HttpMessageHandler
/// to simulate Claude API responses without network calls.
/// </summary>
public class ClaudeMuseServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;
    private readonly MuseService _templateFallback;
    private readonly Guid _countyId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    private static readonly MuseOptions DefaultOptions = new()
    {
        Engine = "claude-sonnet-4-5-20250514",
        ApiKey = "test-api-key-for-unit-tests",
        Model = "claude-sonnet-4-5-20250514",
        MaxTokens = 2048,
        Temperature = 0.3,
        TimeoutSeconds = 30,
    };

    public ClaudeMuseServiceTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        var museLogger = new Mock<ILogger<MuseService>>();
        _templateFallback = new MuseService(_db, museLogger.Object);

        SeedTestData();
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    private void SeedTestData()
    {
        _db.Counties.Add(new County
        {
            Id = _countyId,
            Name = "Benton",
            State = "WA",
            FipsCode = "53005",
            Population = 210_000,
        });

        _db.Properties.Add(new Property
        {
            Id = Guid.NewGuid(),
            PropertyId = "PROP-CLAUDE-001",
            ParcelId = "CLAUDE-001",
            ParcelNumber = "CLAUDE-001",
            CountyId = _countyId,
            Address = "500 AI Way, Kennewick, WA 99336",
            PropertyType = "Residential",
            AssessedValue = 500_000m,
            LandValue = 150_000m,
            ImprovementValue = 350_000m,
            MarketValue = 520_000m,
            TaxYear = 2025,
            YearBuilt = 2015,
        });

        _db.SaveChanges();
    }

    // ── Helper: Build ClaudeMuseService with mocked HTTP ─────────────

    private ClaudeMuseService CreateService(
        Mock<HttpMessageHandler> handlerMock,
        MuseOptions? options = null)
    {
        var opts = options ?? DefaultOptions;
        var httpClient = new HttpClient(handlerMock.Object)
        {
            Timeout = TimeSpan.FromSeconds(opts.TimeoutSeconds),
        };

        var httpClientFactoryMock = new Mock<IHttpClientFactory>();
        httpClientFactoryMock
            .Setup(f => f.CreateClient("ClaudeMuse"))
            .Returns(httpClient);

        var optionsMock = Options.Create(opts);
        var logger = new Mock<ILogger<ClaudeMuseService>>();

        return new ClaudeMuseService(
            _templateFallback,
            optionsMock,
            httpClientFactoryMock.Object,
            logger.Object);
    }

    private static Mock<HttpMessageHandler> CreateMockHandler(
        HttpStatusCode statusCode, string responseBody)
    {
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = statusCode,
                Content = new StringContent(responseBody, Encoding.UTF8, "application/json"),
            });
        return handlerMock;
    }

    private static string BuildClaudeSuccessResponse(string text) =>
        JsonSerializer.Serialize(new
        {
            content = new[] { new { type = "text", text } },
            stop_reason = "end_turn",
        });

    // ── GetCapabilities ──────────────────────────────────────────────

    [Fact]
    public void GetCapabilities_WhenHealthy_Returns_ClaudeEngine()
    {
        var handler = CreateMockHandler(HttpStatusCode.OK, BuildClaudeSuccessResponse("test"));
        var sut = CreateService(handler);

        var caps = sut.GetCapabilities();

        Assert.Equal("claude-sonnet-4-5-20250514", caps.Engine);
        Assert.True(caps.AiPowered);
        Assert.Equal(6, caps.SupportedTypes.Length);
        Assert.Equal(4, caps.Audiences.Length);
    }

    // ── ExplainValueChange: Success Path ─────────────────────────────

    [Fact]
    public async Task ExplainValueChange_Success_Returns_ClaudeResponse()
    {
        var claudeText = "The property value increased due to market appreciation and comparable sales in the area.";
        var handler = CreateMockHandler(HttpStatusCode.OK, BuildClaudeSuccessResponse(claudeText));
        var sut = CreateService(handler);

        var request = new ExplainValueChangeRequest
        {
            ParcelId = "CLAUDE-001",
            FromValue = 450_000m,
            ToValue = 500_000m,
            Audience = "taxpayer",
        };

        var result = await sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Equal("CLAUDE-001", result.ParcelId);
        Assert.Equal(claudeText, result.Explanation);
        Assert.Equal("claude-sonnet-4-5-20250514", result.Engine);
        Assert.False(result.Fallback);
        Assert.Equal(0.95, result.Confidence);
        Assert.NotEmpty(result.Drivers);
    }

    [Fact]
    public async Task ExplainValueChange_Success_Infers_Drivers_From_Text()
    {
        var claudeText = "Market conditions and land value appreciation drove the increase. Income analysis also supports this.";
        var handler = CreateMockHandler(HttpStatusCode.OK, BuildClaudeSuccessResponse(claudeText));
        var sut = CreateService(handler);

        var request = new ExplainValueChangeRequest
        {
            ParcelId = "CLAUDE-001",
            FromValue = 400_000m,
            ToValue = 500_000m,
        };

        var result = await sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Contains("market_conditions", result.Drivers);
        Assert.Contains("land_value", result.Drivers);
        Assert.Contains("income_factor", result.Drivers);
    }

    // ── ExplainValueChange: Failure Path (Fallback) ──────────────────

    [Fact]
    public async Task ExplainValueChange_ApiFailure_Falls_Back_To_Template()
    {
        var handler = CreateMockHandler(HttpStatusCode.InternalServerError, "{\"error\":\"server error\"}");
        var sut = CreateService(handler);

        var request = new ExplainValueChangeRequest
        {
            ParcelId = "CLAUDE-001",
            FromValue = 450_000m,
            ToValue = 500_000m,
            Audience = "taxpayer",
        };

        var result = await sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Equal("CLAUDE-001", result.ParcelId);
        Assert.True(result.Fallback);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Contains("Your property", result.Explanation);
    }

    // ── ExplainAssessment: Success + Failure ─────────────────────────

    [Fact]
    public async Task ExplainAssessment_Success_Returns_ClaudeResponse()
    {
        var claudeText = "This property assessment reflects market value per USPAP standards.";
        var handler = CreateMockHandler(HttpStatusCode.OK, BuildClaudeSuccessResponse(claudeText));
        var sut = CreateService(handler);

        var request = new ExplainAssessmentRequest { ParcelId = "CLAUDE-001", Audience = "internal" };

        var result = await sut.ExplainAssessmentAsync(request, _countyId);

        Assert.Equal(claudeText, result.Explanation);
        Assert.Equal("claude-sonnet-4-5-20250514", result.Engine);
        Assert.False(result.Fallback);
    }

    [Fact]
    public async Task ExplainAssessment_ApiFailure_Falls_Back_To_Template()
    {
        var handler = CreateMockHandler(HttpStatusCode.ServiceUnavailable, "{}");
        var sut = CreateService(handler);

        var request = new ExplainAssessmentRequest { ParcelId = "CLAUDE-001" };

        var result = await sut.ExplainAssessmentAsync(request, _countyId);

        Assert.True(result.Fallback);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Contains("500 AI Way", result.Explanation);
    }

    // ── DraftNotice: Success + Failure ───────────────────────────────

    [Fact]
    public async Task DraftNotice_Success_Returns_ClaudeResponse()
    {
        var claudeText = "NOTICE OF ASSESSED VALUE - Tax Year 2025\n\nDear Property Owner...";
        var handler = CreateMockHandler(HttpStatusCode.OK, BuildClaudeSuccessResponse(claudeText));
        var sut = CreateService(handler);

        var request = new DraftNoticeRequest { ParcelId = "CLAUDE-001", TaxYear = 2025 };

        var result = await sut.DraftNoticeAsync(request, _countyId);

        Assert.Equal(claudeText, result.Draft);
        Assert.Equal("claude-sonnet-4-5-20250514", result.Engine);
        Assert.False(result.Fallback);
    }

    [Fact]
    public async Task DraftNotice_ApiFailure_Falls_Back_To_Template()
    {
        var handler = CreateMockHandler(HttpStatusCode.TooManyRequests, "{}");
        var sut = CreateService(handler);

        var request = new DraftNoticeRequest { ParcelId = "CLAUDE-001", TaxYear = 2025 };

        var result = await sut.DraftNoticeAsync(request, _countyId);

        Assert.True(result.Fallback);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Contains("NOTICE OF ASSESSED VALUE", result.Draft);
    }

    // ── DraftAppealResponse: Success + Failure ───────────────────────

    [Fact]
    public async Task DraftAppealResponse_Success_Returns_ClaudeResponse()
    {
        var claudeText = "RE: Appeal Case CASE-2025-001\nDear Board Members...";
        var handler = CreateMockHandler(HttpStatusCode.OK, BuildClaudeSuccessResponse(claudeText));
        var sut = CreateService(handler);

        var request = new DraftAppealResponseRequest
        {
            ParcelId = "CLAUDE-001",
            CaseId = "CASE-2025-001",
            AssessedValue = 500_000m,
        };

        var result = await sut.DraftAppealResponseAsync(request, _countyId);

        Assert.Equal(claudeText, result.Draft);
        Assert.Equal("appeal_response", result.NoticeType);
        Assert.False(result.Fallback);
    }

    [Fact]
    public async Task DraftAppealResponse_ApiFailure_Falls_Back_To_Template()
    {
        var handler = CreateMockHandler(HttpStatusCode.BadGateway, "{}");
        var sut = CreateService(handler);

        var request = new DraftAppealResponseRequest
        {
            ParcelId = "CLAUDE-001",
            CaseId = "CASE-2025-001",
            AssessedValue = 500_000m,
        };

        var result = await sut.DraftAppealResponseAsync(request, _countyId);

        Assert.True(result.Fallback);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Contains("CASE-2025-001", result.Draft);
    }

    // ── GenerateMemo: Success + Failure ──────────────────────────────

    [Fact]
    public async Task GenerateMemo_Success_Returns_ClaudeResponse()
    {
        var claudeText = "MEMORANDUM\n\nTO: Board of County Commissioners...";
        var handler = CreateMockHandler(HttpStatusCode.OK, BuildClaudeSuccessResponse(claudeText));
        var sut = CreateService(handler);

        var request = new GenerateMemoRequest { Topic = "Tax Rate Analysis" };

        var result = await sut.GenerateMemoAsync(request, _countyId);

        Assert.Equal(claudeText, result.Draft);
        Assert.Null(result.ParcelId);
        Assert.Equal("commissioner_memo", result.NoticeType);
        Assert.False(result.Fallback);
    }

    [Fact]
    public async Task GenerateMemo_ApiFailure_Falls_Back_To_Template()
    {
        var handler = CreateMockHandler(HttpStatusCode.Forbidden, "{}");
        var sut = CreateService(handler);

        var request = new GenerateMemoRequest { Topic = "Budget Review" };

        var result = await sut.GenerateMemoAsync(request, _countyId);

        Assert.True(result.Fallback);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Contains("MEMORANDUM", result.Draft);
    }

    // ── SynthesizeEvidence: Success + Failure ────────────────────────

    [Fact]
    public async Task SynthesizeEvidence_Success_Returns_ClaudeResponse()
    {
        var claudeText = "Evidence synthesis for parcel CLAUDE-001: comprehensive market analysis...";
        var handler = CreateMockHandler(HttpStatusCode.OK, BuildClaudeSuccessResponse(claudeText));
        var sut = CreateService(handler);

        var request = new SynthesizeEvidenceRequest { ParcelId = "CLAUDE-001" };

        var result = await sut.SynthesizeEvidenceAsync(request, _countyId);

        Assert.Equal(claudeText, result.Synthesis);
        Assert.Equal("claude-sonnet-4-5-20250514", result.Engine);
        Assert.False(result.Fallback);
        Assert.Equal(0.93, result.Confidence);
    }

    [Fact]
    public async Task SynthesizeEvidence_ApiFailure_Falls_Back_To_Template()
    {
        var handler = CreateMockHandler(HttpStatusCode.GatewayTimeout, "{}");
        var sut = CreateService(handler);

        var request = new SynthesizeEvidenceRequest { ParcelId = "CLAUDE-001" };

        var result = await sut.SynthesizeEvidenceAsync(request, _countyId);

        Assert.True(result.Fallback);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Contains("CLAUDE-001", result.Synthesis);
    }

    // ── Health Flag Transitions ──────────────────────────────────────

    [Fact]
    public async Task Health_Degrades_After_ApiFailure_Then_Capabilities_Reflect_Template()
    {
        var handler = CreateMockHandler(HttpStatusCode.InternalServerError, "{}");
        var sut = CreateService(handler);

        // Initially healthy -- capabilities show Claude
        var capsBefore = sut.GetCapabilities();
        Assert.True(capsBefore.AiPowered);

        // Trigger a failure
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "CLAUDE-001",
            FromValue = 400_000m,
            ToValue = 500_000m,
        };
        await sut.ExplainValueChangeAsync(request, _countyId);

        // After failure, capabilities should reflect template engine
        var capsAfter = sut.GetCapabilities();
        Assert.Equal("muse-template-v1", capsAfter.Engine);
        Assert.False(capsAfter.AiPowered);
    }

    [Fact]
    public async Task Health_Recovers_After_Successful_Call()
    {
        // First call fails
        var failHandler = CreateMockHandler(HttpStatusCode.InternalServerError, "{}");
        var failClient = new HttpClient(failHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30),
        };

        // Second call succeeds
        var successResponse = BuildClaudeSuccessResponse("Recovery successful.");
        var successHandler = CreateMockHandler(HttpStatusCode.OK, successResponse);
        var successClient = new HttpClient(successHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30),
        };

        // We need to create a handler that fails first, then succeeds
        var callCount = 0;
        var sequenceHandler = new Mock<HttpMessageHandler>();
        sequenceHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(() =>
            {
                callCount++;
                if (callCount == 1)
                {
                    return new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.InternalServerError,
                        Content = new StringContent("{}", Encoding.UTF8, "application/json"),
                    };
                }
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(
                        BuildClaudeSuccessResponse("Recovered."),
                        Encoding.UTF8, "application/json"),
                };
            });

        var sut = CreateService(sequenceHandler);

        // First call fails -- health degrades
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "CLAUDE-001",
            FromValue = 400_000m,
            ToValue = 500_000m,
        };
        var result1 = await sut.ExplainValueChangeAsync(request, _countyId);
        Assert.True(result1.Fallback);

        // Capabilities show degraded state
        var capsDegraded = sut.GetCapabilities();
        Assert.False(capsDegraded.AiPowered);

        // Second call succeeds -- health recovers
        var result2 = await sut.ExplainValueChangeAsync(request, _countyId);
        Assert.False(result2.Fallback);
        Assert.Equal("claude-sonnet-4-5-20250514", result2.Engine);
    }

    // ── Empty Content Handling ────────────────────────────────────────

    [Fact]
    public async Task ExplainValueChange_EmptyContent_Falls_Back_To_Template()
    {
        // Claude returns 200 but with empty content array
        var emptyResponse = JsonSerializer.Serialize(new
        {
            content = Array.Empty<object>(),
            stop_reason = "end_turn",
        });
        var handler = CreateMockHandler(HttpStatusCode.OK, emptyResponse);
        var sut = CreateService(handler);

        var request = new ExplainValueChangeRequest
        {
            ParcelId = "CLAUDE-001",
            FromValue = 400_000m,
            ToValue = 500_000m,
            Audience = "taxpayer",
        };

        var result = await sut.ExplainValueChangeAsync(request, _countyId);

        Assert.True(result.Fallback);
        Assert.Equal("muse-template-v1", result.Engine);
    }

    // ── Audience appears in system prompt (verified via request body) ─

    [Theory]
    [InlineData("taxpayer")]
    [InlineData("appraiser")]
    [InlineData("commissioner")]
    [InlineData("internal")]
    public async Task ExplainValueChange_Sends_Audience_In_Request(string audience)
    {
        HttpRequestMessage? capturedRequest = null;
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
            {
                capturedRequest = req;
            })
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(
                    BuildClaudeSuccessResponse("Test response for " + audience),
                    Encoding.UTF8, "application/json"),
            });

        var sut = CreateService(handlerMock);

        var request = new ExplainValueChangeRequest
        {
            ParcelId = "CLAUDE-001",
            FromValue = 400_000m,
            ToValue = 500_000m,
            Audience = audience,
        };

        await sut.ExplainValueChangeAsync(request, _countyId);

        Assert.NotNull(capturedRequest);
        var body = await capturedRequest.Content!.ReadAsStringAsync();
        // The user prompt includes the audience
        Assert.Contains(audience, body, StringComparison.OrdinalIgnoreCase);
    }

    // ── API Key and Headers ──────────────────────────────────────────

    [Fact]
    public async Task CallClaude_Sends_Correct_Headers()
    {
        HttpRequestMessage? capturedRequest = null;
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
            {
                capturedRequest = req;
            })
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(
                    BuildClaudeSuccessResponse("Headers test."),
                    Encoding.UTF8, "application/json"),
            });

        var sut = CreateService(handlerMock);

        var request = new ExplainValueChangeRequest
        {
            ParcelId = "CLAUDE-001",
            FromValue = 400_000m,
            ToValue = 500_000m,
        };

        await sut.ExplainValueChangeAsync(request, _countyId);

        Assert.NotNull(capturedRequest);
        Assert.Contains("test-api-key-for-unit-tests",
            capturedRequest.Headers.GetValues("x-api-key"));
        Assert.Contains("2023-06-01",
            capturedRequest.Headers.GetValues("anthropic-version"));
        Assert.Equal(HttpMethod.Post, capturedRequest.Method);
        Assert.Equal("https://api.anthropic.com/v1/messages", capturedRequest.RequestUri?.ToString());
    }
}
