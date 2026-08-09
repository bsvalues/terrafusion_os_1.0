using System.Net;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.API.Tests.Controllers;

public sealed class LocalOpsAcademyControllerTests
{
  [Fact]
  public void Controller_requires_authenticated_user()
  {
    var authorize = typeof(LocalOpsAcademyController).GetCustomAttribute<AuthorizeAttribute>();
    Assert.NotNull(authorize);
    Assert.Equal("RequireUser", authorize.Policy);
    Assert.Null(typeof(LocalOpsAcademyController).GetCustomAttribute<AllowAnonymousAttribute>());
    Assert.Equal("ApiPolicy", typeof(LocalOpsAcademyController)
        .GetCustomAttribute<EnableRateLimitingAttribute>()?.PolicyName);
  }

  [Fact]
  public async Task Ask_is_default_off_and_does_not_contact_runtime()
  {
    var handler = new StubHandler(HttpStatusCode.OK, "{}");
    var controller = BuildController(handler, enabled: false);

    var result = await controller.Ask(new AcademyLocalOpsRequest("localops-safety-boundary"), default);

    var content = Assert.IsType<ContentResult>(result);
    Assert.Equal(503, content.StatusCode);
    Assert.Contains("PRODUCT_JOURNEY_DISABLED", content.Content);
    Assert.Equal(0, handler.CallCount);
  }

  [Fact]
  public async Task Ask_forwards_only_to_the_fixed_loopback_pilot_runtime()
  {
    var handler = new StubHandler(HttpStatusCode.OK, "{\"ok\":true}");
    var controller = BuildController(handler, enabled: true);

    var result = await controller.Ask(new AcademyLocalOpsRequest("localops-safety-boundary"), default);

    var content = Assert.IsType<ContentResult>(result);
    Assert.Equal(200, content.StatusCode);
    Assert.Equal(new Uri("http://127.0.0.1:4317/pilot/localops/academy/ask"), handler.LastUri);
    Assert.Contains("localops-safety-boundary", handler.LastBody);
    Assert.Equal(new string('x', 32), handler.LastHostToken);
    Assert.Equal("19190019-1919-1919-1919-191919191919", handler.LastCountyId);
    Assert.Equal("academy-user", handler.LastUserId);
  }

  [Fact]
  public async Task Ask_rejects_runtime_redirects_fail_closed()
  {
    var handler = new StubHandler(HttpStatusCode.Redirect, "{}");
    var controller = BuildController(handler, enabled: true);

    var result = await controller.Ask(new AcademyLocalOpsRequest("localops-safety-boundary"), default);

    var content = Assert.IsType<ContentResult>(result);
    Assert.Equal(503, content.StatusCode);
    Assert.Contains("LOCALOPS_REDIRECT_REFUSED", content.Content);
    Assert.Equal(1, handler.CallCount);
  }

  [Fact]
  public async Task Ask_refuses_a_noncanonical_runtime_without_contacting_it()
  {
    var handler = new StubHandler(HttpStatusCode.OK, "{}");
    var controller = BuildController(handler, enabled: true, runtimeUrl: "http://127.0.0.1:9999/proxy");

    var result = await controller.Ask(new AcademyLocalOpsRequest("localops-safety-boundary"), default);

    var content = Assert.IsType<ContentResult>(result);
    Assert.Equal(503, content.StatusCode);
    Assert.Contains("UNSAFE_LOCALOPS_RUNTIME", content.Content);
    Assert.Equal(0, handler.CallCount);
  }

  [Fact]
  public async Task Ask_accepts_an_explicit_alternate_loopback_runtime_port()
  {
    var handler = new StubHandler(HttpStatusCode.OK, "{\"ok\":true}");
    var controller = BuildController(handler, enabled: true, runtimeUrl: "http://127.0.0.1:54317");

    var result = await controller.Ask(new AcademyLocalOpsRequest("localops-safety-boundary"), default);

    var content = Assert.IsType<ContentResult>(result);
    Assert.Equal(200, content.StatusCode);
    Assert.Equal(new Uri("http://127.0.0.1:54317/pilot/localops/academy/ask"), handler.LastUri);
  }

  [Fact]
  public async Task Ask_requires_authenticated_trace_context_before_contacting_runtime()
  {
    var handler = new StubHandler(HttpStatusCode.OK, "{}");
    var controller = BuildController(handler, enabled: true, includeTraceClaims: false);

    var result = await controller.Ask(new AcademyLocalOpsRequest("localops-safety-boundary"), default);

    var content = Assert.IsType<ContentResult>(result);
    Assert.Equal(403, content.StatusCode);
    Assert.Contains("LOCALOPS_TRACE_CONTEXT_REQUIRED", content.Content);
    Assert.Equal(0, handler.CallCount);
  }

  private static LocalOpsAcademyController BuildController(
      StubHandler handler,
      bool enabled,
      string runtimeUrl = "http://127.0.0.1:4317",
      bool includeTraceClaims = true)
  {
    var values = new Dictionary<string, string?>
    {
      ["LOCALOPS_PRODUCT_JOURNEY_ENABLED"] = enabled ? "1" : "0",
      ["LOCALOPS_PILOT_RUNTIME_URL"] = runtimeUrl,
      ["LOCALOPS_PILOT_HOST_TOKEN"] = new string('x', 32),
    };
    var config = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
    var controller = new LocalOpsAcademyController(
        new StubHttpClientFactory(new HttpClient(handler)),
        config,
        NullLogger<LocalOpsAcademyController>.Instance);
    var claims = includeTraceClaims
        ? new[]
        {
          new Claim("countyId", "19190019-1919-1919-1919-191919191919"),
          new Claim(ClaimTypes.NameIdentifier, "academy-user"),
        }
        : Array.Empty<Claim>();
    controller.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext
      {
        User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test")),
      },
    };
    return controller;
  }

  private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
  {
    public HttpClient CreateClient(string name) => client;
  }

  private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
  {
    public int CallCount { get; private set; }
    public Uri? LastUri { get; private set; }
    public string? LastBody { get; private set; }
    public string? LastHostToken { get; private set; }
    public string? LastCountyId { get; private set; }
    public string? LastUserId { get; private set; }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
      CallCount += 1;
      LastUri = request.RequestUri;
      LastHostToken = request.Headers.TryGetValues("X-TerraFusion-LocalOps-Host", out var values)
          ? values.Single()
          : null;
      LastCountyId = request.Headers.TryGetValues("X-TerraFusion-County-Id", out var countyValues)
          ? countyValues.Single()
          : null;
      LastUserId = request.Headers.TryGetValues("X-TerraFusion-User-Id", out var userValues)
          ? userValues.Single()
          : null;
      LastBody = request.Content is null
          ? null
          : await request.Content.ReadAsStringAsync(cancellationToken);
      return new HttpResponseMessage(status)
      {
        Content = new StringContent(body, Encoding.UTF8, "application/json"),
      };
    }
  }
}
