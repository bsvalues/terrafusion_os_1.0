using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;

namespace TerraFusion.API.Services;

/// <summary>
/// Claude-powered Muse NLP engine. Implements IMuseService using the
/// Anthropic Messages API. Falls back to MuseService (template engine)
/// on any API error — no raw provider errors bubble to users.
///
/// R3.1 Guardrails:
///   1. No API key in repo config (env var or production config only)
///   2. Template engine is default in development
///   3. Claude failure degrades deterministically to template
///   4. Response format stays contract-compatible (only Engine + Fallback change)
///   5. IMuseService interface is unchanged
///   6. GetCapabilities() reflects real engine state
/// </summary>
public class ClaudeMuseService : IMuseService
{
    private readonly MuseService _templateFallback;
    private readonly MuseOptions _options;
    private readonly HttpClient _httpClient;
    private readonly ILogger<ClaudeMuseService> _logger;
    private bool _isHealthy = true;

    private const string ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
    private const string ANTHROPIC_VERSION = "2023-06-01";

    public ClaudeMuseService(
        MuseService templateFallback,
        IOptions<MuseOptions> options,
        IHttpClientFactory httpClientFactory,
        ILogger<ClaudeMuseService> logger)
    {
        _templateFallback = templateFallback;
        _options = options.Value;
        _httpClient = httpClientFactory.CreateClient("ClaudeMuse");
        _logger = logger;

        _httpClient.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);
    }

    public MuseCapabilities GetCapabilities()
    {
        if (!_isHealthy)
        {
            return _templateFallback.GetCapabilities();
        }

        return new MuseCapabilities
        {
            Engine = _options.Model,
            AiPowered = true,
            SupportedTypes = new[]
            {
                "explain_value_change", "explain_assessment",
                "draft_notice", "draft_appeal_response",
                "generate_memo", "synthesize_evidence"
            },
            Audiences = new[] { "taxpayer", "appraiser", "commissioner", "internal" },
        };
    }

    // ── IMuseService Implementation ─────────────────────────────────

    public async Task<ExplanationResult> ExplainValueChangeAsync(
        ExplainValueChangeRequest request, Guid countyId)
    {
        var audience = request.Audience ?? "internal";
        var systemPrompt = BuildValueChangeSystemPrompt(audience);
        var userPrompt = $"Explain the value change for parcel {request.ParcelId}. " +
            $"Previous value: ${request.FromValue:N0}, New value: ${request.ToValue:N0}. " +
            (request.FromYear.HasValue ? $"From year {request.FromYear} to {request.ToYear}. " : "") +
            $"Audience: {audience}.";

        try
        {
            var text = await CallClaudeAsync(systemPrompt, userPrompt);
            return new ExplanationResult
            {
                ParcelId = request.ParcelId,
                Explanation = text,
                Drivers = InferDriversFromText(text),
                Confidence = 0.95,
                Engine = _options.Model,
                Fallback = false,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Claude API failed for ExplainValueChange, falling back to template engine");
            _isHealthy = false;
            var result = await _templateFallback.ExplainValueChangeAsync(request, countyId);
            result.Fallback = true;
            return result;
        }
    }

    public async Task<ExplanationResult> ExplainAssessmentAsync(
        ExplainAssessmentRequest request, Guid countyId)
    {
        var audience = request.Audience ?? "internal";
        var systemPrompt = BuildAssessmentSystemPrompt(audience);
        var userPrompt = $"Explain the current assessment for parcel {request.ParcelId}. " +
            $"Audience: {audience}. Include USPAP methodology and Washington State RCW 84.40.030 references.";

        try
        {
            var text = await CallClaudeAsync(systemPrompt, userPrompt);
            return new ExplanationResult
            {
                ParcelId = request.ParcelId,
                Explanation = text,
                Drivers = new[] { "assessment_methodology", "market_conditions" },
                Confidence = 0.95,
                Engine = _options.Model,
                Fallback = false,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Claude API failed for ExplainAssessment, falling back to template engine");
            _isHealthy = false;
            var result = await _templateFallback.ExplainAssessmentAsync(request, countyId);
            result.Fallback = true;
            return result;
        }
    }

    public async Task<DraftResult> DraftNoticeAsync(
        DraftNoticeRequest request, Guid countyId)
    {
        var systemPrompt = BuildNoticeSystemPrompt();
        var userPrompt = $"Draft a {request.NoticeType ?? "value_change"} notice for parcel {request.ParcelId}. " +
            (request.TaxYear.HasValue ? $"Tax year: {request.TaxYear}. " : "") +
            "Use formal government tone with statutory references (RCW 84.40.030, RCW 84.40.038).";

        try
        {
            var text = await CallClaudeAsync(systemPrompt, userPrompt);
            return new DraftResult
            {
                ParcelId = request.ParcelId,
                Draft = text,
                NoticeType = request.NoticeType ?? "value_change",
                Engine = _options.Model,
                Fallback = false,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Claude API failed for DraftNotice, falling back to template engine");
            _isHealthy = false;
            var result = await _templateFallback.DraftNoticeAsync(request, countyId);
            result.Fallback = true;
            return result;
        }
    }

    public async Task<DraftResult> DraftAppealResponseAsync(
        DraftAppealResponseRequest request, Guid countyId)
    {
        var systemPrompt = BuildAppealResponseSystemPrompt();
        var userPrompt = $"Draft a Board of Equalization appeal response for case {request.CaseId}, " +
            $"parcel {request.ParcelId}. Assessed value: ${request.AssessedValue:N0}. " +
            "Reference USPAP three-approach methodology and provide evidence-based findings.";

        try
        {
            var text = await CallClaudeAsync(systemPrompt, userPrompt);
            return new DraftResult
            {
                ParcelId = request.ParcelId,
                Draft = text,
                NoticeType = "appeal_response",
                Engine = _options.Model,
                Fallback = false,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Claude API failed for DraftAppealResponse, falling back to template engine");
            _isHealthy = false;
            var result = await _templateFallback.DraftAppealResponseAsync(request, countyId);
            result.Fallback = true;
            return result;
        }
    }

    public async Task<DraftResult> GenerateMemoAsync(
        GenerateMemoRequest request, Guid countyId)
    {
        var systemPrompt = BuildMemoSystemPrompt();
        var userPrompt = $"Generate a commissioner memorandum on: {request.Topic}. " +
            (request.Context != null ? $"Context: {request.Context}. " : "") +
            "Format as a formal government memo with TO, FROM, DATE, RE sections.";

        try
        {
            var text = await CallClaudeAsync(systemPrompt, userPrompt);
            return new DraftResult
            {
                ParcelId = null,
                Draft = text,
                NoticeType = "commissioner_memo",
                Engine = _options.Model,
                Fallback = false,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Claude API failed for GenerateMemo, falling back to template engine");
            _isHealthy = false;
            var result = await _templateFallback.GenerateMemoAsync(request, countyId);
            result.Fallback = true;
            return result;
        }
    }

    public async Task<SynthesisResult> SynthesizeEvidenceAsync(
        SynthesizeEvidenceRequest request, Guid countyId)
    {
        var systemPrompt = BuildEvidenceSynthesisSystemPrompt();
        var userPrompt = $"Synthesize available evidence for parcel {request.ParcelId}. " +
            "Correlate property records, assessment history, and market data. " +
            "Flag any data quality concerns. Use IAAO and USPAP standards.";

        try
        {
            var text = await CallClaudeAsync(systemPrompt, userPrompt);
            return new SynthesisResult
            {
                ParcelId = request.ParcelId,
                Synthesis = text,
                Sources = new[] { "property_record", "assessment_history", "market_data" },
                Confidence = 0.93,
                Engine = _options.Model,
                Fallback = false,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Claude API failed for SynthesizeEvidence, falling back to template engine");
            _isHealthy = false;
            var result = await _templateFallback.SynthesizeEvidenceAsync(request, countyId);
            result.Fallback = true;
            return result;
        }
    }

    // ── Claude API Call ──────────────────────────────────────────────

    private async Task<string> CallClaudeAsync(string systemPrompt, string userPrompt)
    {
        var requestBody = new ClaudeRequest
        {
            Model = _options.Model,
            MaxTokens = _options.MaxTokens,
            System = systemPrompt,
            Messages = new[]
            {
                new ClaudeMessage { Role = "user", Content = userPrompt }
            }
        };

        var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        });

        var request = new HttpRequestMessage(HttpMethod.Post, ANTHROPIC_API_URL)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        request.Headers.Add("x-api-key", _options.ApiKey);
        request.Headers.Add("anthropic-version", ANTHROPIC_VERSION);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException(
                $"Anthropic API returned {response.StatusCode}: {errorBody}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        var claudeResponse = JsonSerializer.Deserialize<ClaudeResponse>(
            responseJson,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

        if (claudeResponse?.Content == null || claudeResponse.Content.Length == 0)
        {
            throw new InvalidOperationException("Claude API returned empty content");
        }

        _isHealthy = true;
        return claudeResponse.Content[0].Text;
    }

    // ── System Prompts ──────────────────────────────────────────────

    private static string BuildValueChangeSystemPrompt(string audience) =>
        "You are a professional property assessment analyst for a Washington State county assessor's office. " +
        "Generate clear, accurate explanations of property value changes using USPAP three-approach methodology " +
        "(sales comparison, income capitalization, cost approach) and reconciliation. " +
        "Always reference Washington State RCW 84.40.030 and IAAO standards where applicable. " +
        audience switch
        {
            "taxpayer" => "Write in plain, empathetic language suitable for a property owner. Avoid jargon. " +
                          "Explain appeal rights under RCW 84.40.038.",
            "appraiser" => "Use technical IAAO terminology. Include market adjustment factors and comparable analysis details.",
            "commissioner" => "Provide an executive summary with key metrics. Focus on policy implications and trends.",
            _ => "Provide full technical detail with all methodology references and data sources."
        };

    private static string BuildAssessmentSystemPrompt(string audience) =>
        "You are a Washington State property assessment professional. Explain property assessments using " +
        "USPAP-compliant methodology, referencing RCW 84.40.030 (true and fair value standard). " +
        "Include property classification, land/improvement value breakdown, and assessment methodology. " +
        (audience == "taxpayer"
            ? "Use plain language accessible to property owners."
            : "Use professional assessment terminology per IAAO standards.");

    private static string BuildNoticeSystemPrompt() =>
        "You are drafting an official government notice from a Washington State county assessor's office. " +
        "Use formal tone appropriate for official correspondence. Include statutory references " +
        "(RCW 84.40.030 for assessment standards, RCW 84.40.038 for appeal rights). " +
        "Format with proper headers: property identification, assessed values, and appeal instructions.";

    private static string BuildAppealResponseSystemPrompt() =>
        "You are drafting a professional response to a Board of Equalization appeal for a Washington State " +
        "county assessor's office. Present evidence-based findings using USPAP three-approach methodology. " +
        "Reference specific comparable sales, income data, and cost analysis. Maintain professional, " +
        "objective tone suitable for quasi-judicial proceedings.";

    private static string BuildMemoSystemPrompt() =>
        "You are a Washington State county assessor preparing a memorandum for county commissioners. " +
        "Use formal government memo format (TO, FROM, DATE, RE). Provide executive-level analysis " +
        "with key findings and recommendations. Reference IAAO standards and RCW requirements where applicable.";

    private static string BuildEvidenceSynthesisSystemPrompt() =>
        "You are a property assessment analyst synthesizing evidence from multiple data sources. " +
        "Correlate property records, assessment history, comparable sales, and market indicators. " +
        "Flag data quality concerns and confidence levels. Use IAAO and USPAP evidence standards. " +
        "Produce a concise, structured synthesis suitable for case review.";

    // ── Helpers ──────────────────────────────────────────────────────

    private static string[] InferDriversFromText(string text)
    {
        var drivers = new List<string>();
        var lower = text.ToLowerInvariant();

        if (lower.Contains("market") || lower.Contains("comparable")) drivers.Add("market_conditions");
        if (lower.Contains("improvement") || lower.Contains("renovation")) drivers.Add("improvement_value");
        if (lower.Contains("land")) drivers.Add("land_value");
        if (lower.Contains("depreci")) drivers.Add("depreciation");
        if (lower.Contains("income") || lower.Contains("rent")) drivers.Add("income_factor");

        return drivers.Count > 0 ? drivers.ToArray() : new[] { "market_conditions" };
    }

    // ── Claude API DTOs ─────────────────────────────────────────────

    private class ClaudeRequest
    {
        public string Model { get; set; } = string.Empty;
        public int MaxTokens { get; set; }
        public string? System { get; set; }
        public ClaudeMessage[] Messages { get; set; } = Array.Empty<ClaudeMessage>();
    }

    private class ClaudeMessage
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    private class ClaudeResponse
    {
        public ClaudeContentBlock[] Content { get; set; } = Array.Empty<ClaudeContentBlock>();
        public string? StopReason { get; set; }
    }

    private class ClaudeContentBlock
    {
        public string Type { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
    }
}
