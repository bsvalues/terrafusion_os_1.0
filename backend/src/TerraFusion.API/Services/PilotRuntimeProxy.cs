using System.Net.Http.Json;
using System.Text.Json;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Services;

/// <summary>Same-origin application bridge to an explicitly configured local Pilot runtime.</summary>
public static class PilotRuntimeProxy
{
    private static readonly HashSet<string> WorkflowTools = new(StringComparer.Ordinal)
    {
        "generate_morning_brief", "open_appeal_packet",
        "export_equalization_package", "export_audit_bundle",
    };

    // Existing Prometheus registry and /metrics endpoint; no CID/user/county metric labels.
    private static readonly Prometheus.Counter WorkflowErrors = Prometheus.Metrics.CreateCounter(
        "pilot_workflow_errors_total", "Failed API-observed Pilot workflow invocations, including logical HTTP 200 failures.",
        new Prometheus.CounterConfiguration { LabelNames = ["operation", "category", "environment"] });
    private static readonly Prometheus.Histogram WorkflowDuration = Prometheus.Metrics.CreateHistogram(
        "pilot_workflow_duration_seconds", "API bridge entry through Pilot outcome; excludes response serialization.",
        new Prometheus.HistogramConfiguration { LabelNames = ["operation", "outcome", "environment"] });

    public static async Task<IActionResult?> ForwardAsync(
        HttpRequest request, string operation, object? body = null)
    {
        var payload = operation == "invoke" ? JsonSerializer.SerializeToElement(body) : default;
        var toolId = payload.ValueKind == JsonValueKind.Object ? String(payload, "toolId") : null;
        if (toolId is null || !WorkflowTools.Contains(toolId)) return await ForwardCoreAsync(request, operation, body);
        var started = System.Diagnostics.Stopwatch.GetTimestamp();
        var environment = request.HttpContext.RequestServices.GetService<IHostEnvironment>()?.EnvironmentName ?? "unknown";
        var success = false;
        var category = "runtime";
        try
        {
            var result = await ForwardCoreAsync(request, operation, body);
            var status = result switch { ContentResult content => content.StatusCode ?? 200,
                ObjectResult value => value.StatusCode ?? 200, StatusCodeResult value => value.StatusCode,
                ForbidResult => 403, ChallengeResult => 401, _ => 503 };
            if (status is 401 or 403) category = "denied";
            else if (status >= 400) category = "http_failure";
            else if (result is ContentResult content)
            {
                try
                {
                    using var envelope = JsonDocument.Parse(content.Content ?? "null");
                    if (envelope.RootElement.ValueKind != JsonValueKind.Object ||
                        !envelope.RootElement.TryGetProperty("ok", out var ok) || ok.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                        category = "invalid_response";
                    else
                    {
                        success = ok.ValueKind == JsonValueKind.True;
                        category = String(envelope.RootElement, "errorCode") switch {
                            "PERMISSION_DENIED" or "COUNTY_MISMATCH" or "POLICY_DENIED" or "OFFICE_SCOPE_DENIED" => "denied",
                            "PARAMS_SCHEMA_INVALID" or "VALIDATION" or "CONFIRMATION_REQUIRED" or "REASON_CODE_REQUIRED" or "REASON_CODE_INVALID" or "MODE_MISMATCH" => "validation",
                            "COUNTY_WORKFLOW_TRACE_UNAVAILABLE" or "PILOT_RUNTIME_UNAVAILABLE" => "runtime",
                            _ => "execution" };
                    }
                }
                catch (JsonException) { category = "invalid_response"; }
            }
            return result;
        }
        finally
        {
            var seconds = System.Diagnostics.Stopwatch.GetElapsedTime(started).TotalSeconds;
            WorkflowDuration.WithLabels(toolId, success ? "success" : "failure", environment).Observe(seconds);
            if (!success) WorkflowErrors.WithLabels(toolId, category, environment).Inc();
            request.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("PilotWorkflowOutcome")
                .LogInformation("Pilot workflow {Operation} {Outcome}; CID {CorrelationId}; environment {Environment}; category {Category}; durationSeconds {DurationSeconds}",
                    toolId, success ? "success" : "failure", request.HttpContext.Items["CorrelationId"], environment, success ? "none" : category, seconds);
        }
    }

    private static async Task<IActionResult?> ForwardCoreAsync(
        HttpRequest request, string operation, object? body)
    {
        var requestCid = request.HttpContext.Items["CorrelationId"] as string;
        ObjectResult RequestFailure(string code, int status, string? cid = null) => Failure(code, status,
            cid ?? (requestCid is not null && Regex.IsMatch(requestCid, @"^[A-Za-z0-9._\-]{1,128}$") ? requestCid : null));
        var configuration = request.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var configured = configuration["PilotRuntime:BaseUrl"];
        if (string.IsNullOrWhiteSpace(configured)) return null;
        var traceId = operation.StartsWith("trace/", StringComparison.Ordinal) ? operation[6..] : null;
        if (traceId is not null && !Regex.IsMatch(traceId, @"^[A-Za-z0-9._\-]{1,128}$"))
            return new BadRequestObjectResult(new { code = "INVALID_CORRELATION_ID" });
        // Enabling this bounded bridge must not activate unrelated service-account tools.
        if (operation is "invoke" or "validate")
        {
            var payload = JsonSerializer.SerializeToElement(body);
            if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty("toolId", out var toolId) ||
                toolId.ValueKind != JsonValueKind.String || !WorkflowTools.Contains(toolId.GetString()!))
                return null;
        }
        string? county = null, actor = null;
        var principal = request.HttpContext.User;
        if (traceId is not null || operation is "invoke" or "validate")
        {
            if (principal.Identity?.IsAuthenticated != true) return new UnauthorizedResult();
            var counties = principal.FindAll("countyId").Select(x => x.Value).ToArray();
            var actors = principal.FindAll(ClaimTypes.NameIdentifier).Concat(principal.FindAll("sub")).Select(x => x.Value).Distinct().ToArray();
            if (counties.Length != 1 || !Guid.TryParseExact(counties[0], "D", out var countyId) || countyId == Guid.Empty ||
                counties[0] != countyId.ToString("D") || actors.Length != 1 || string.IsNullOrWhiteSpace(actors[0]) || actors[0].Length > 200)
                return new ForbidResult();
            county = counties[0]; actor = actors[0];
            if (traceId is not null && (!principal.HasClaim("perm", "read:dossier") || !principal.HasClaim("perm", "read:dais")))
                return new ForbidResult();
        }
        // This bounded development integration is not an arbitrary destination proxy.
        if (!Uri.TryCreate(configured, UriKind.Absolute, out var target) || !target.IsLoopback ||
            target.Scheme is not ("http" or "https") || target.AbsolutePath != "/" ||
            target.UserInfo.Length != 0 || target.Query.Length != 0 || target.Fragment.Length != 0)
            return RequestFailure("PILOT_RUNTIME_CONFIGURATION_INVALID", StatusCodes.Status503ServiceUnavailable);

        var factory = request.HttpContext.RequestServices.GetRequiredService<IHttpClientFactory>();
        using var message = new HttpRequestMessage(new HttpMethod(request.Method),
            new Uri(target, $"pilot/{operation}{request.QueryString}"));
        foreach (var header in new[] { "Authorization", "x-mode", "x-office-id" })
            if (request.Headers.TryGetValue(header, out var values))
                message.Headers.TryAddWithoutValidation(header, values.ToArray());
        if (county is not null && actor is not null)
        {
            message.Headers.TryAddWithoutValidation("x-county-id", county);
            message.Headers.TryAddWithoutValidation("x-user-id", actor);
            var roles = principal.Claims.Where(x => x.Type is ClaimTypes.Role or "roles" or "role").Select(x => x.Value).Distinct();
            message.Headers.TryAddWithoutValidation("x-role", string.Join(",", roles));
        }
        if (request.HttpContext.Items["CorrelationId"] is string correlation &&
            System.Text.RegularExpressions.Regex.IsMatch(correlation, @"^[A-Za-z0-9._\-]{1,128}$"))
            message.Headers.TryAddWithoutValidation("X-Correlation-ID", correlation);
        if (body is not null) message.Content = JsonContent.Create(body);
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(request.HttpContext.RequestAborted);
        timeout.CancelAfter(TimeSpan.FromSeconds(20));
        try
        {
            using var response = await factory.CreateClient("county-workflow-pilot-runtime").SendAsync(message, timeout.Token);
            var content = await response.Content.ReadAsStringAsync(timeout.Token);
            if (traceId is not null && !response.IsSuccessStatusCode)
                return RequestFailure("PILOT_TRACE_UNAVAILABLE", (int)response.StatusCode, traceId);
            if (traceId is not null && response.IsSuccessStatusCode)
            {
                using var trace = JsonDocument.Parse(content);
                if (trace.RootElement.ValueKind != JsonValueKind.Object || !trace.RootElement.TryGetProperty("events", out var events) || events.ValueKind != JsonValueKind.Array)
                    return RequestFailure("PILOT_RUNTIME_RESPONSE_INVALID", StatusCodes.Status503ServiceUnavailable);
                var visible = new List<object>();
                foreach (var item in events.EnumerateArray())
                {
                    if (item.ValueKind != JsonValueKind.Object || !item.TryGetProperty("context", out var context) || context.ValueKind != JsonValueKind.Object)
                        return RequestFailure("PILOT_RUNTIME_RESPONSE_INVALID", StatusCodes.Status503ServiceUnavailable);
                    if (String(item, "correlationId") != traceId || String(context, "countyId") != county || String(context, "userId") != actor) continue;
                    var toolId = String(item, "toolId"); var type = String(item, "type");
                    if (toolId is null || !WorkflowTools.Contains(toolId) || type is not ("tool_invoked" or "tool_completed" or "tool_failed")) continue;
                    if (!Guid.TryParse(String(item, "eventId"), out var eventId) || !DateTimeOffset.TryParse(String(item, "timestamp"), out var timestamp))
                        return RequestFailure("PILOT_RUNTIME_RESPONSE_INVALID", StatusCodes.Status503ServiceUnavailable);
                    visible.Add(new { eventId, timestamp, type, toolId, correlationId = traceId,
                        context = new { countyId = county, userId = actor }, summary = $"{type}: {toolId}",
                        errorCode = type == "tool_failed" ? "WORKFLOW_FAILED" : null });
                    if (visible.Count == 200) break;
                }
                content = JsonSerializer.Serialize(new { events = visible });
            }
            if (operation == "tools" && response.IsSuccessStatusCode)
            {
                // Discovery must expose only the same bounded IDs this bridge can dispatch.
                using var inventory = JsonDocument.Parse(content);
                if (inventory.RootElement.ValueKind != JsonValueKind.Object ||
                    !inventory.RootElement.TryGetProperty("tools", out var tools) || tools.ValueKind != JsonValueKind.Array)
                    return RequestFailure("PILOT_RUNTIME_RESPONSE_INVALID", StatusCodes.Status503ServiceUnavailable);
                var supported = new List<JsonElement>();
                foreach (var tool in tools.EnumerateArray())
                {
                    if (tool.ValueKind != JsonValueKind.Object || !tool.TryGetProperty("toolId", out var id) || id.ValueKind != JsonValueKind.String)
                        return RequestFailure("PILOT_RUNTIME_RESPONSE_INVALID", StatusCodes.Status503ServiceUnavailable);
                    if (WorkflowTools.Contains(id.GetString()!)) supported.Add(tool);
                }
                content = JsonSerializer.Serialize(new { count = supported.Count, tools = supported });
            }
            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                ContentType = "application/json",
                Content = content,
            };
        }
        catch (JsonException)
        {
            return RequestFailure("PILOT_RUNTIME_RESPONSE_INVALID", StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException)
        {
            return RequestFailure("PILOT_RUNTIME_UNAVAILABLE", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static ObjectResult Failure(string code, int status, string? correlationId = null) => new(new
    {
        ok = false,
        correlationId = correlationId ?? $"pilot-{Guid.NewGuid():N}",
        errorCode = code,
        error = "The configured Pilot runtime is unavailable.",
    }) { StatusCode = status };

    private static string? String(JsonElement value, string name) => value.TryGetProperty(name, out var field) && field.ValueKind == JsonValueKind.String ? field.GetString() : null;
}
