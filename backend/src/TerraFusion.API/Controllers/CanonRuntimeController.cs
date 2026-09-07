using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace TerraFusion.API.Controllers;

/// <summary>Conference-only authenticated host adapter for the existing local
/// Canon runtime. No generic proxy, caller-selected path, or filesystem access.</summary>
[ApiController]
[Route("api/pilot/canon")]
[Authorize(Policy = "RequireUser")]
[EnableRateLimiting("ApiPolicy")]
[RequestSizeLimit(4096)]
public sealed class CanonRuntimeController(IHttpClientFactory clients, IConfiguration configuration) : ControllerBase
{
    private static readonly SemaphoreSlim Capacity = new(2, 2);
    private const int MaxResponseBytes = 128 * 1024;

    [HttpPost("{operation}")]
    public async Task<IActionResult> Run(string operation, [FromBody] JsonElement body, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        if (configuration["CANON_CONFERENCE_ENABLED"] != "1") return Failure(503, "CANON_CONFERENCE_DISABLED");
        if (operation is not ("ping" or "corpus" or "doctor" or "gatefast")) return Failure(404, "CANON_CONFERENCE_ROUTE_UNAVAILABLE");
        var county = User.FindFirst("countyId")?.Value;
        var user = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (User.Identity?.IsAuthenticated != true || !Guid.TryParse(county, out var countyId) || countyId == Guid.Empty ||
            string.IsNullOrWhiteSpace(user) || user.Length > 128 ||
            !user.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.' or ':' or '@'))
            return Failure(403, "CANON_AUTHENTICATED_CONTEXT_REQUIRED");
        var token = configuration["LOCALOPS_PILOT_HOST_TOKEN"];
        if (string.IsNullOrEmpty(token) || token.Length < 32) return Failure(503, "CANON_HOST_CREDENTIAL_UNAVAILABLE");
        if (body.ValueKind != JsonValueKind.Object) return Failure(400, "CANON_INVALID_INPUT");
        var echo = "hello";
        foreach (var property in body.EnumerateObject())
        {
            if (operation != "ping" || property.Name != "echo" || property.Value.ValueKind != JsonValueKind.String)
                return Failure(400, "CANON_INVALID_INPUT");
            echo = property.Value.GetString() ?? "hello";
            if (echo.Length > 160 || echo.Any(char.IsControl)) return Failure(400, "CANON_INVALID_INPUT");
        }
        if (!await Capacity.WaitAsync(0, cancellationToken)) return Failure(429, "CANON_LOCAL_CAPACITY_BUSY");
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(35));
            using var request = new HttpRequestMessage(HttpMethod.Post, $"http://127.0.0.1:4317/pilot/canon/{operation}")
            {
                Content = operation == "ping" ? JsonContent.Create(new { echo }) : new StringContent("{}", Encoding.UTF8, "application/json"),
            };
            request.Headers.Add("X-TerraFusion-LocalOps-Host", token);
            request.Headers.Add("X-TerraFusion-County-Id", countyId.ToString());
            request.Headers.Add("X-TerraFusion-User-Id", user);
            using var upstream = await clients.CreateClient("CanonLocal").SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            if (!upstream.IsSuccessStatusCode) return Failure(503, "CANON_RUNTIME_REFUSED");
            if (upstream.Content.Headers.ContentType?.MediaType != "application/json") return Failure(503, "CANON_INVALID_RUNTIME_RESPONSE");
            await using var stream = await upstream.Content.ReadAsStreamAsync(timeout.Token);
            using var bytes = new MemoryStream();
            var buffer = new byte[8192];
            int count;
            while ((count = await stream.ReadAsync(buffer, timeout.Token)) > 0)
            {
                if (bytes.Length + count > MaxResponseBytes) return Failure(503, "CANON_RUNTIME_RESPONSE_TOO_LARGE");
                bytes.Write(buffer, 0, count);
            }
            using var json = JsonDocument.Parse(bytes.ToArray());
            var field = operation == "corpus" ? "ok" : "overallOk";
            if (json.RootElement.ValueKind != JsonValueKind.Object || !json.RootElement.TryGetProperty(field, out var success) ||
                success.ValueKind is not (JsonValueKind.True or JsonValueKind.False)) return Failure(503, "CANON_INVALID_RUNTIME_RESPONSE");
            // A valid negative check remains negative. HTTP success is not gate success.
            return new ContentResult { StatusCode = 200, ContentType = "application/json; charset=utf-8", Content = json.RootElement.GetRawText() };
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested) { return Failure(503, "CANON_RUNTIME_TIMEOUT"); }
        catch (HttpRequestException) { return Failure(503, "CANON_RUNTIME_UNAVAILABLE"); }
        catch (JsonException) { return Failure(503, "CANON_INVALID_RUNTIME_RESPONSE"); }
        finally { Capacity.Release(); }
    }

    private static ObjectResult Failure(int status, string code) => new(new { ok = false, overallOk = false, error = code }) { StatusCode = status };
}
