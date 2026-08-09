using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace TerraFusion.API.Controllers;

public sealed record AcademyLocalOpsRequest(string QuestionId);

/// <summary>
/// Authenticated, read-only host adapter for the separately enabled loopback
/// Pilot runtime. It has one fixed destination and exposes no generic proxy.
/// </summary>
[ApiController]
[Route("api/pilot/localops/academy")]
[Authorize(Policy = "RequireUser")]
[EnableRateLimiting("ApiPolicy")]
public sealed class LocalOpsAcademyController : ControllerBase
{
  private const string EnabledKey = "LOCALOPS_PRODUCT_JOURNEY_ENABLED";
  private const string RuntimeUrlKey = "LOCALOPS_PILOT_RUNTIME_URL";
  private const string HostTokenKey = "LOCALOPS_PILOT_HOST_TOKEN";

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly IConfiguration _configuration;
  private readonly ILogger<LocalOpsAcademyController> _logger;

  public LocalOpsAcademyController(
      IHttpClientFactory httpClientFactory,
      IConfiguration configuration,
      ILogger<LocalOpsAcademyController> logger)
  {
    _httpClientFactory = httpClientFactory;
    _configuration = configuration;
    _logger = logger;
  }

  [HttpPost("ask")]
  public async Task<IActionResult> Ask(
      [FromBody] AcademyLocalOpsRequest request,
      CancellationToken cancellationToken)
  {
    if (_configuration[EnabledKey] != "1")
    {
      return SafeJson(503, "disabled", "PRODUCT_JOURNEY_DISABLED",
          "LocalOps Academy is not enabled in this environment.");
    }

    var runtimeOrigin = ExplicitLoopbackOrigin(_configuration[RuntimeUrlKey]);
    if (runtimeOrigin is null)
    {
      return SafeJson(503, "misconfigured", "UNSAFE_LOCALOPS_RUNTIME",
          "LocalOps Academy requires the approved loopback Pilot runtime; no model request was sent.");
    }

    var hostToken = _configuration[HostTokenKey];
    if (string.IsNullOrEmpty(hostToken) || hostToken.Length < 32)
    {
      return SafeJson(503, "misconfigured", "LOCALOPS_HOST_TOKEN_MISSING",
          "LocalOps Academy requires its internal host credential; no model request was sent.");
    }

    if (string.IsNullOrWhiteSpace(request.QuestionId))
    {
      return SafeJson(400, "refused", "INVALID_SYNTHETIC_QUESTION",
          "Choose one of the synthetic Academy questions.");
    }

    var countyId = User.FindFirst("countyId")?.Value;
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
    if (!Guid.TryParse(countyId, out var parsedCountyId) || !IsSafeTraceIdentity(userId))
    {
      return SafeJson(403, "refused", "LOCALOPS_TRACE_CONTEXT_REQUIRED",
          "LocalOps Academy requires authenticated county and user trace context; no model request was sent.");
    }

    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
    timeout.CancelAfter(TimeSpan.FromSeconds(35));

    try
    {
      var client = _httpClientFactory.CreateClient("LocalOps");
      var askEndpoint = new Uri($"{runtimeOrigin}/pilot/localops/academy/ask");
      using var upstreamRequest = new HttpRequestMessage(HttpMethod.Post, askEndpoint)
      {
        Content = JsonContent.Create(request),
      };
      upstreamRequest.Headers.TryAddWithoutValidation("X-TerraFusion-LocalOps-Host", hostToken);
      upstreamRequest.Headers.TryAddWithoutValidation("X-TerraFusion-County-Id", parsedCountyId.ToString());
      upstreamRequest.Headers.TryAddWithoutValidation("X-TerraFusion-User-Id", userId);
      using var upstream = await client.SendAsync(upstreamRequest, timeout.Token);
      if ((int)upstream.StatusCode is >= 300 and < 400)
      {
        return SafeJson(503, "refused", "LOCALOPS_REDIRECT_REFUSED",
            "LocalOps refused an unexpected runtime redirect. No external destination was contacted.");
      }
      var body = await upstream.Content.ReadAsStringAsync(timeout.Token);
      if (body.Length > 128 * 1024)
      {
        return SafeJson(503, "failed", "LOCALOPS_RESPONSE_TOO_LARGE",
            "LocalOps returned an invalid response; no answer was displayed.");
      }

      return new ContentResult
      {
        StatusCode = (int)upstream.StatusCode,
        ContentType = "application/json; charset=utf-8",
        Content = body,
      };
    }
    catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
    {
      return SafeJson(503, "unavailable", "LOCALOPS_RUNTIME_TIMEOUT",
          "The LocalOps runtime timed out safely. No external provider was called.");
    }
    catch (HttpRequestException exception)
    {
      _logger.LogWarning(exception, "LocalOps Academy loopback runtime unavailable");
      return SafeJson(503, "unavailable", "LOCALOPS_RUNTIME_UNAVAILABLE",
          "The LocalOps runtime is unavailable. No external provider was called.");
    }
  }

  private static bool IsSafeTraceIdentity(string? value) =>
      !string.IsNullOrWhiteSpace(value) &&
      value.Length <= 128 &&
      value.All(character => char.IsLetterOrDigit(character) || character is '-' or '_' or '.' or ':' or '@');

  private static string? ExplicitLoopbackOrigin(string? value)
  {
    if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
        uri.Scheme != Uri.UriSchemeHttp ||
        !string.IsNullOrEmpty(uri.UserInfo) ||
        (uri.Host != "127.0.0.1" && uri.Host != "localhost") ||
        uri.IsDefaultPort ||
        uri.Port is < 1024 or > 65535 ||
        uri.AbsolutePath != "/" ||
        !string.IsNullOrEmpty(uri.Query) ||
        !string.IsNullOrEmpty(uri.Fragment))
    {
      return null;
    }

    return $"http://{uri.Host}:{uri.Port}";
  }

  private static ContentResult SafeJson(int statusCode, string status, string reasonCode, string message) =>
      new()
      {
        StatusCode = statusCode,
        ContentType = "application/json; charset=utf-8",
        Content = JsonSerializer.Serialize(new { ok = false, status, reasonCode, message }),
      };
}
