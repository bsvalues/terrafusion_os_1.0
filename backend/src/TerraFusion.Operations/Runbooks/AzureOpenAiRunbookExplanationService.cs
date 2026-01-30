// =============================================================================
// Phase 40B: Azure OpenAI Runbook Explanation Service
// =============================================================================
// EXPLAINER SPEC LOCK v1.0.0
// LLM-based enrichment that ONLY modifies text fields.
// CRITICAL: Immutable fields are validated and preserved.
// =============================================================================

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.Operations.Incidents;

namespace TerraFusion.Operations.Runbooks;

/// <summary>
/// Azure OpenAI implementation of IRunbookExplanationService.
/// EXPLAINER SPEC LOCK v1.0.0 - LLM is narrator only.
/// </summary>
/// <remarks>
/// CRITICAL CONSTRAINTS (enforced by validation):
/// - MUST NOT modify immutable fields (PlanId, StepId, SafetyLevel, Kind, etc.)
/// - MAY ONLY modify text fields (Title, Description)
/// - On any error, returns original plan unchanged
/// </remarks>
public class AzureOpenAiRunbookExplanationService : IRunbookExplanationService
{
    private readonly HttpClient _httpClient;
    private readonly RunbookExplanationOptions _options;
    private readonly ILogger<AzureOpenAiRunbookExplanationService> _logger;

    public AzureOpenAiRunbookExplanationService(
        HttpClient httpClient,
        IOptions<RunbookExplanationOptions> options,
        ILogger<AzureOpenAiRunbookExplanationService> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // Configure HTTP client with API key if provided
        if (!string.IsNullOrWhiteSpace(_options.AzureOpenAiApiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("api-key", _options.AzureOpenAiApiKey);
        }
    }

    /// <inheritdoc />
    public async Task<RunbookPlan> EnrichWithExplanationAsync(
        RunbookPlan plan,
        IncidentSummary incident,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(plan);
        ArgumentNullException.ThrowIfNull(incident);

        // Check if service is available
        if (!_options.Enabled || !_options.IsConfiguredForAzureOpenAi)
        {
            _logger.LogDebug("Runbook explanation service is not enabled or configured");
            return plan;
        }

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            // Build the prompt
            var prompt = BuildEnrichmentPrompt(plan, incident);

            // Call Azure OpenAI
            var enrichedData = await CallAzureOpenAiAsync(prompt, cancellationToken);

            if (enrichedData == null)
            {
                _logger.LogWarning("Azure OpenAI returned null response, returning original plan");
                return plan;
            }

            // Merge enriched text while preserving immutable fields
            var enrichedPlan = MergeEnrichedData(plan, enrichedData);

            stopwatch.Stop();
            _logger.LogInformation(
                "Successfully enriched runbook plan {PlanId} in {DurationMs}ms",
                plan.PlanId, stopwatch.ElapsedMilliseconds);

            return enrichedPlan;
        }
        catch (OperationCanceledException ex)
        {
            // Graceful degradation: return original plan on cancellation/timeout
            stopwatch.Stop();
            _logger.LogWarning(ex,
                "Runbook explanation was cancelled/timed out for plan {PlanId} after {DurationMs}ms, returning original",
                plan.PlanId, stopwatch.ElapsedMilliseconds);
            return plan;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex,
                "Failed to enrich runbook plan {PlanId} after {DurationMs}ms, returning original",
                plan.PlanId, stopwatch.ElapsedMilliseconds);
            return plan;
        }
    }

    /// <inheritdoc />
    public Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
    {
        var isAvailable = _options.Enabled && _options.IsConfiguredForAzureOpenAi;
        return Task.FromResult(isAvailable);
    }

    /// <summary>
    /// Builds the system + user prompt for enrichment.
    /// </summary>
    private static string BuildEnrichmentPrompt(RunbookPlan plan, IncidentSummary incident)
    {
        var stepsJson = JsonSerializer.Serialize(plan.Steps.Select(s => new
        {
            s.StepId,
            s.Title,
            s.Description,
            Kind = s.Kind.ToString(),
            SafetyLevel = s.SafetyLevel.ToString()
        }), new JsonSerializerOptions { WriteIndented = true });

        return $@"You are a technical writer for government IT operations.
Your task is to improve the clarity and actionability of runbook step descriptions.

CRITICAL RULES:
1. You may ONLY modify the 'Title' and 'Description' text fields
2. You MUST NOT change: StepId, Kind, SafetyLevel, or any other fields
3. Keep language professional, clear, and actionable
4. Include specific commands or links where helpful
5. For HighRisk steps, emphasize caution and verification

INCIDENT CONTEXT:
- Title: {incident.Title}
- Severity: {incident.OverallSeverity}
- Description: {incident.Description}

RUNBOOK PLAN:
- Plan ID: {plan.PlanId}
- Title: {plan.Title}
- Steps:
{stepsJson}

Respond with JSON array of enriched steps, with ONLY 'StepId', 'Title', and 'Description' fields.
Each step must have the EXACT same StepId as the input.

Example response format:
[
  {{ ""StepId"": ""STEP-000001"", ""Title"": ""Improved Title"", ""Description"": ""Clearer description with specific actions..."" }}
]";
    }

    /// <summary>
    /// Calls Azure OpenAI API and parses the response.
    /// </summary>
    private async Task<List<EnrichedStepData>?> CallAzureOpenAiAsync(
        string prompt,
        CancellationToken cancellationToken)
    {
        var endpoint = $"{_options.AzureOpenAiEndpoint?.TrimEnd('/')}/openai/deployments/{_options.AzureOpenAiDeploymentName}/chat/completions?api-version=2024-02-01";

        var requestBody = new
        {
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = _options.MaxTokens,
            temperature = _options.Temperature
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(_options.Timeout);

        var response = await _httpClient.PostAsync(endpoint, content, cts.Token);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Azure OpenAI API error: {Status} - {Error}", response.StatusCode, error);
            return null;
        }

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var chatResponse = JsonSerializer.Deserialize<AzureOpenAiChatResponse>(responseJson);

        var messageContent = chatResponse?.Choices?.FirstOrDefault()?.Message?.Content;
        if (string.IsNullOrWhiteSpace(messageContent))
        {
            _logger.LogWarning("Azure OpenAI returned empty message content");
            return null;
        }

        // Extract JSON from response (may be wrapped in markdown code blocks)
        var jsonContent = ExtractJsonFromResponse(messageContent);

        try
        {
            return JsonSerializer.Deserialize<List<EnrichedStepData>>(jsonContent);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse LLM response as JSON: {Content}", jsonContent);
            return null;
        }
    }

    /// <summary>
    /// Extracts JSON from LLM response (handles markdown code blocks).
    /// </summary>
    private static string ExtractJsonFromResponse(string response)
    {
        var trimmed = response.Trim();

        // Handle ```json ... ``` wrapping
        if (trimmed.StartsWith("```"))
        {
            var firstNewline = trimmed.IndexOf('\n');
            var lastBackticks = trimmed.LastIndexOf("```");
            if (firstNewline > 0 && lastBackticks > firstNewline)
            {
                return trimmed.Substring(firstNewline + 1, lastBackticks - firstNewline - 1).Trim();
            }
        }

        // Handle [ ... ] direct array
        var startBracket = trimmed.IndexOf('[');
        var endBracket = trimmed.LastIndexOf(']');
        if (startBracket >= 0 && endBracket > startBracket)
        {
            return trimmed.Substring(startBracket, endBracket - startBracket + 1);
        }

        return trimmed;
    }

    /// <summary>
    /// Merges enriched text data while STRICTLY preserving immutable fields.
    /// </summary>
    private RunbookPlan MergeEnrichedData(RunbookPlan original, List<EnrichedStepData> enrichedSteps)
    {
        // Create a lookup for enriched step data by StepId
        var enrichmentLookup = enrichedSteps
            .Where(e => !string.IsNullOrWhiteSpace(e.StepId))
            .ToDictionary(e => e.StepId!, e => e);

        // Merge enriched text into steps while preserving ALL immutable fields
        var mergedSteps = original.Steps.Select(originalStep =>
        {
            if (enrichmentLookup.TryGetValue(originalStep.StepId, out var enriched))
            {
                return originalStep with
                {
                    // MUTABLE: Can be enriched
                    Title = !string.IsNullOrWhiteSpace(enriched.Title)
                        ? enriched.Title
                        : originalStep.Title,
                    Description = !string.IsNullOrWhiteSpace(enriched.Description)
                        ? enriched.Description
                        : originalStep.Description

                    // IMMUTABLE: StepId, Order, Kind, SafetyLevel, RequiresHumanApproval,
                    // CanBeSuggestedForAutomation, RelatedAlertNames, RelatedMetricNames,
                    // SuggestedOwnerRole, EstimatedDurationMinutes
                    // ALL preserved automatically via 'with' expression
                };
            }
            return originalStep;
        }).ToList();

        // Return plan with ONLY mutable fields potentially changed
        return original with
        {
            Steps = mergedSteps
            // IMMUTABLE: PlanId, IncidentId, OverallSeverity, PlanVersion,
            // ImpactedCountyIds, CreatedAt, AuditInfo
            // ALL preserved automatically via 'with' expression
        };
    }

    /// <summary>
    /// Internal DTO for parsing LLM response.
    /// </summary>
    private record EnrichedStepData
    {
        [JsonPropertyName("StepId")]
        public string? StepId { get; init; }

        [JsonPropertyName("Title")]
        public string? Title { get; init; }

        [JsonPropertyName("Description")]
        public string? Description { get; init; }
    }

    /// <summary>
    /// Azure OpenAI API response structure.
    /// </summary>
    private record AzureOpenAiChatResponse
    {
        [JsonPropertyName("choices")]
        public List<ChatChoice>? Choices { get; init; }
    }

    private record ChatChoice
    {
        [JsonPropertyName("message")]
        public ChatMessage? Message { get; init; }
    }

    private record ChatMessage
    {
        [JsonPropertyName("content")]
        public string? Content { get; init; }
    }
}
