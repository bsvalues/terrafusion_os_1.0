using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers;

public sealed record AcademyLocalOpsRequest(string QuestionId);

/// <summary>
/// Authenticated, read-only host adapter for the separately enabled loopback
/// Pilot runtime. It has one fixed destination and exposes no generic proxy.
/// </summary>
[ApiController]
[Route("api/pilot/localops/academy")]
[Authorize(Policy = "RequireUser")]
public sealed class LocalOpsAcademyController : ControllerBase
{
  private const string EnabledKey = "LOCALOPS_PRODUCT_JOURNEY_ENABLED";
  private const string RuntimeUrlKey = "LOCALOPS_PILOT_RUNTIME_URL";
  private const string ApprovedRuntimeOrigin = "http://127.0.0.1:4317";
  private static readonly Uri AskEndpoint = new($"{ApprovedRuntimeOrigin}/pilot/localops/academy/ask");

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

    if (_configuration[RuntimeUrlKey] != ApprovedRuntimeOrigin)
    {
      return SafeJson(503, "misconfigured", "UNSAFE_LOCALOPS_RUNTIME",
          "LocalOps Academy requires the approved loopback Pilot runtime; no model request was sent.");
    }

    if (string.IsNullOrWhiteSpace(request.QuestionId))
    {
      return SafeJson(400, "refused", "INVALID_SYNTHETIC_QUESTION",
          "Choose one of the synthetic Academy questions.");
    }

    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
    timeout.CancelAfter(TimeSpan.FromSeconds(35));

    try
    {
      var client = _httpClientFactory.CreateClient(nameof(LocalOpsAcademyController));
      using var upstream = await client.PostAsJsonAsync(AskEndpoint, request, timeout.Token);
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

  private static ContentResult SafeJson(int statusCode, string status, string reasonCode, string message) =>
      new()
      {
        StatusCode = statusCode,
        ContentType = "application/json; charset=utf-8",
        Content = JsonSerializer.Serialize(new { ok = false, status, reasonCode, message }),
      };
}
