using System.Net.Http.Json;
using System.Text.Json;
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

    public static async Task<IActionResult?> ForwardAsync(
        HttpRequest request, string operation, object? body = null)
    {
        var configuration = request.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var configured = configuration["PilotRuntime:BaseUrl"];
        if (string.IsNullOrWhiteSpace(configured)) return null;
        // Enabling this bounded bridge must not activate unrelated service-account tools.
        if (operation is "invoke" or "validate")
        {
            var payload = JsonSerializer.SerializeToElement(body);
            if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty("toolId", out var toolId) ||
                toolId.ValueKind != JsonValueKind.String || !WorkflowTools.Contains(toolId.GetString()!))
                return null;
        }
        // This bounded development integration is not an arbitrary destination proxy.
        if (!Uri.TryCreate(configured, UriKind.Absolute, out var target) || !target.IsLoopback ||
            target.Scheme is not ("http" or "https") || target.AbsolutePath != "/" ||
            target.UserInfo.Length != 0 || target.Query.Length != 0 || target.Fragment.Length != 0)
            return Failure("PILOT_RUNTIME_CONFIGURATION_INVALID", StatusCodes.Status503ServiceUnavailable);

        var factory = request.HttpContext.RequestServices.GetRequiredService<IHttpClientFactory>();
        using var message = new HttpRequestMessage(new HttpMethod(request.Method),
            new Uri(target, $"pilot/{operation}{request.QueryString}"));
        foreach (var header in new[] { "Authorization", "x-county-id", "x-user-id", "x-role", "x-mode", "x-office-id" })
            if (request.Headers.TryGetValue(header, out var values))
                message.Headers.TryAddWithoutValidation(header, values.ToArray());
        if (body is not null) message.Content = JsonContent.Create(body);
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(request.HttpContext.RequestAborted);
        timeout.CancelAfter(TimeSpan.FromSeconds(20));
        try
        {
            using var response = await factory.CreateClient("county-workflow-pilot-runtime").SendAsync(message, timeout.Token);
            return new ContentResult
            {
                StatusCode = (int)response.StatusCode,
                ContentType = "application/json",
                Content = await response.Content.ReadAsStringAsync(timeout.Token),
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException)
        {
            return Failure("PILOT_RUNTIME_UNAVAILABLE", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static ObjectResult Failure(string code, int status) => new(new
    {
        ok = false,
        correlationId = $"pilot-{Guid.NewGuid():N}",
        errorCode = code,
        error = "The configured Pilot runtime is unavailable.",
    }) { StatusCode = status };
}
