using System.Reflection;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.Unit.Tests.Controllers;

public sealed class CanonRuntimeControllerTests
{
    [Theory]
    [InlineData("ping")]
    [InlineData("corpus")]
    [InlineData("doctor")]
    [InlineData("gatefast")]
    public async Task Actual_MVC_router_dispatches_named_operations(string operation)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Configuration.AddInMemoryCollection(new Dictionary<string,string?> {
            ["CANON_CONFERENCE_ENABLED"]="1", ["LOCALOPS_PILOT_HOST_TOKEN"]=new string('x',40),
        });
        builder.Services.AddControllers().AddApplicationPart(typeof(CanonRuntimeController).Assembly);
        builder.Services.AddAuthorization(options => options.AddPolicy("RequireUser", policy => policy.RequireAuthenticatedUser()));
        var handler=new Handler(operation=="corpus" ? "{\"ok\":true}" : "{\"overallOk\":true}");
        builder.Services.AddSingleton<IHttpClientFactory>(new Factory(handler));
        await using var app=builder.Build();
        // This test supplies a synthetic authenticated principal to exercise MVC
        // selection/dispatch, not the separately proven production login flow.
        app.Use(async (context,next) => {
            context.User=new ClaimsPrincipal(new ClaimsIdentity(new[] {
                new Claim("countyId","b7c9fef3-cf48-45f4-967f-d3b9d265876d"),
                new Claim(ClaimTypes.NameIdentifier,"conference-test"),
            },"synthetic-routing-test"));
            await next();
        });
        app.UseAuthorization();
        app.MapControllers();
        await app.StartAsync();
        try {
            using var client=new HttpClient();
            var response=await client.PostAsync($"{app.Urls.Single()}/api/pilot/canon/{operation}",new StringContent("{}",Encoding.UTF8,"application/json"));
            Assert.Equal(HttpStatusCode.OK,response.StatusCode);
            Assert.Equal(1,handler.Calls);
        } finally { await app.StopAsync(); }
    }

    [Fact]
    public void Canon_has_an_authenticated_API_route_not_an_unprotected_static_proxy()
    {
        var type = typeof(PilotController).Assembly.GetType("TerraFusion.API.Controllers.CanonRuntimeController");
        Assert.NotNull(type);
        Assert.Equal("api/pilot/canon", type.GetCustomAttribute<RouteAttribute>()?.Template);
        Assert.Equal("RequireUser", type.GetCustomAttribute<AuthorizeAttribute>()?.Policy);
        Assert.Null(type.GetCustomAttribute<AllowAnonymousAttribute>());
    }

    [Theory]
    [InlineData("ping", "{\"echo\":\"local\"}", "{\"overallOk\":true}")]
    [InlineData("corpus", "{}", "{\"ok\":true}")]
    [InlineData("doctor", "{}", "{\"overallOk\":false}")]
    [InlineData("gatefast", "{}", "{\"overallOk\":true}")]
    public async Task Fixed_actions_forward_authenticated_context_and_preserve_results(string action, string input, string output)
    {
        var handler = new Handler(output);
        var controller = Build(handler);
        var result = Assert.IsType<ContentResult>(await controller.Run(action, Json(input), default));
        Assert.Equal(200, result.StatusCode);
        Assert.Equal(output, result.Content);
        Assert.Equal($"http://127.0.0.1:4317/pilot/canon/{action}", handler.Uri);
        Assert.Equal("conference-test", handler.User);
        Assert.Equal("b7c9fef3-cf48-45f4-967f-d3b9d265876d", handler.County);
        Assert.Equal(new string('x', 40), handler.Token);
        Assert.Equal("no-store", controller.Response.Headers.CacheControl);
    }

    [Theory]
    [InlineData(false, true, "ping", "{}", 503)]
    [InlineData(true, false, "ping", "{}", 403)]
    [InlineData(true, true, "git-status", "{}", 404)]
    [InlineData(true, true, "write", "{}", 404)]
    [InlineData(true, true, "ping", "{\"path\":\"/forge\"}", 400)]
    [InlineData(true, true, "doctor", "{\"echo\":\"x\"}", 400)]
    [InlineData(true, true, "ping", "[]", 400)]
    public async Task Invalid_or_unavailable_requests_never_contact_runtime(bool enabled, bool identity, string action, string input, int status)
    {
        var handler = new Handler("{\"overallOk\":true}");
        var controller = Build(handler, enabled, identity);
        Assert.Equal(status, Assert.IsType<ObjectResult>(await controller.Run(action, Json(input), default)).StatusCode);
        Assert.Equal(0, handler.Calls);
    }

    [Theory]
    [InlineData("{}", "application/json", 200)]
    [InlineData("not-json", "application/json", 200)]
    [InlineData("<html>ok</html>", "text/html", 200)]
    [InlineData("{\"overallOk\":true}", "application/json", 302)]
    public async Task Invalid_upstream_is_not_a_success_receipt(string body, string contentType, int status)
    {
        var controller = Build(new Handler(body, contentType, status));
        Assert.Equal(503, Assert.IsType<ObjectResult>(await controller.Run("ping", Json("{}"), default)).StatusCode);
    }

    [Fact]
    public async Task Oversize_upstream_is_bounded()
    {
        var controller = Build(new Handler(new string('x', 131073)));
        Assert.Equal(503, Assert.IsType<ObjectResult>(await controller.Run("ping", Json("{}"), default)).StatusCode);
    }

    private static JsonElement Json(string value) => JsonDocument.Parse(value).RootElement.Clone();
    private static CanonRuntimeController Build(Handler handler, bool enabled = true, bool identity = true)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> {
            ["CANON_CONFERENCE_ENABLED"] = enabled ? "1" : "0",
            ["LOCALOPS_PILOT_HOST_TOKEN"] = new string('x',40),
        }).Build();
        var controller = new CanonRuntimeController(new Factory(handler), config);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(identity ? new[] {
            new Claim(ClaimTypes.NameIdentifier,"conference-test"), new Claim("countyId","b7c9fef3-cf48-45f4-967f-d3b9d265876d"),
        } : Array.Empty<Claim>(), identity ? "test" : null)) } };
        return controller;
    }
    private sealed class Factory(Handler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) { Assert.Equal("CanonLocal", name); return new HttpClient(handler); }
    }
    private sealed class Handler(string body, string contentType = "application/json", int status = 200) : HttpMessageHandler
    {
        public int Calls;
        public string? Uri, User, County, Token;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            Uri = request.RequestUri?.AbsoluteUri;
            User = request.Headers.GetValues("X-TerraFusion-User-Id").Single();
            County = request.Headers.GetValues("X-TerraFusion-County-Id").Single();
            Token = request.Headers.GetValues("X-TerraFusion-LocalOps-Host").Single();
            return Task.FromResult(new HttpResponseMessage((HttpStatusCode)status) { Content = new StringContent(body, Encoding.UTF8, contentType) });
        }
    }
}
