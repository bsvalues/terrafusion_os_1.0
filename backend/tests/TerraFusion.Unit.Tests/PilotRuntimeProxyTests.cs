using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.API.Services.Dossier;
using Microsoft.Extensions.Hosting;
using TerraFusion.Core.Interfaces;
using Xunit;

namespace TerraFusion.Unit.Tests;

public sealed class PilotRuntimeProxyTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async System.Threading.Tasks.Task LogicalPilotFailureIncrementsExistingPrometheusCounterExactlyOnce(bool ok)
    {
        async System.Threading.Tasks.Task<double> Errors()
        {
            using var stream = new MemoryStream();
            await global::Prometheus.Metrics.DefaultRegistry.CollectAndExportAsTextAsync(stream);
            var text = System.Text.Encoding.UTF8.GetString(stream.ToArray());
            var line = text.Split('\n').SingleOrDefault(x => x.StartsWith("pilot_workflow_errors_total{") &&
                x.Contains("operation=\"open_appeal_packet\"") && x.Contains("category=\"execution\"") && x.Contains("environment=\"unknown\""));
            return line == null ? 0 : double.Parse(line[(line.LastIndexOf(' ') + 1)..], System.Globalization.CultureInfo.InvariantCulture);
        }
        using var client = new HttpClient(new InventoryTransport(System.Text.Json.JsonSerializer.Serialize(new { ok, errorCode = ok ? null : "EXECUTION_FAILED", correlationId = "tf-counted" })));
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services); controller.Request.Method = "POST";
        controller.HttpContext.Items["CorrelationId"] = "tf-counted";
        var before = await Errors();
        var response = (await PilotRuntimeProxy.ForwardAsync(controller.Request, "invoke", new { toolId = "open_appeal_packet" })).Should().BeOfType<ContentResult>().Subject;
        response.StatusCode.Should().Be(200);
        (await Errors()).Should().Be(before + (ok ? 0 : 1));
    }

    [Theory]
    [InlineData("not-json")]
    [InlineData("{\"events\":null}")]
    [InlineData("{\"events\":[null]}")]
    [InlineData("{\"events\":[{\"context\":null}]}")]
    public async System.Threading.Tasks.Task MalformedTraceFailsClosed(string json)
    {
        using var client = new HttpClient(new InventoryTransport(json));
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services); controller.Request.Method = "GET";
        var response = (await PilotRuntimeProxy.ForwardAsync(controller.Request, "trace/tf-malformed")).Should().BeOfType<ObjectResult>().Subject;
        response.StatusCode.Should().Be(503);
        System.Text.Json.JsonSerializer.Serialize(response.Value).Should().Contain("PILOT_RUNTIME_RESPONSE_INVALID");
    }

    [Fact]
    public async System.Threading.Tasks.Task TraceBridgeCapsVisibleMetadataAtTwoHundredEvents()
    {
        var json = System.Text.Json.JsonSerializer.Serialize(new { events = Enumerable.Range(0, 205).Select(_ => new {
            eventId = Guid.NewGuid(), timestamp = "2026-09-07T00:00:00Z", type = "tool_completed",
            toolId = "export_audit_bundle", correlationId = "tf-capped",
            context = new { countyId = "11111111-1111-1111-1111-111111111111", userId = "operator" },
            summary = "private-source", payloadRef = "private-path" }) });
        using var client = new HttpClient(new InventoryTransport(json));
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services); controller.Request.Method = "GET";
        var response = (await PilotRuntimeProxy.ForwardAsync(controller.Request, "trace/tf-capped")).Should().BeOfType<ContentResult>().Subject;
        using var body = System.Text.Json.JsonDocument.Parse(response.Content!);
        body.RootElement.GetProperty("events").GetArrayLength().Should().Be(200);
        response.Content.Should().NotContain("private-");
    }

    [Theory]
    [InlineData(400)]
    [InlineData(403)]
    [InlineData(500)]
    public async System.Threading.Tasks.Task TraceErrorsNeverReturnUpstreamDiagnostics(int status)
    {
        using var client = new HttpClient(new InventoryTransport("{\"rawPayload\":\"private-diagnostic\"}", (HttpStatusCode)status));
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services); controller.Request.Method = "GET";
        var response = (await PilotRuntimeProxy.ForwardAsync(controller.Request, "trace/tf-error-test")).Should().BeOfType<ObjectResult>().Subject;
        response.StatusCode.Should().Be(status);
        var json = System.Text.Json.JsonSerializer.Serialize(response.Value);
        json.Should().Contain("tf-error-test").And.NotContain("private-diagnostic").And.NotContain("rawPayload");
    }

    [Theory]
    [InlineData("invoke")]
    [InlineData("validate")]
    public async System.Threading.Tasks.Task WorkflowDispatchNeverAcceptsAnonymousIdentityHeaders(string operation)
    {
        var factory = new Mock<IHttpClientFactory>(MockBehavior.Strict);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services); controller.Request.Method = "POST";
        controller.HttpContext.User = new();
        controller.Request.Headers["x-user-id"] = "operator";
        controller.Request.Headers["x-county-id"] = "11111111-1111-1111-1111-111111111111";
        controller.Request.Headers["x-role"] = "appraiser";
        (await PilotRuntimeProxy.ForwardAsync(controller.Request, operation, new { toolId = "export_audit_bundle" })).Should().BeOfType<UnauthorizedResult>();
        factory.Verify(f => f.CreateClient(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async System.Threading.Tasks.Task TraceBridgeReturnsOnlyTheAuthenticatedWorkflowMetadata()
    {
        const string county = "11111111-1111-1111-1111-111111111111";
        const string cid = "tf-county-trace-test";
        object Event(string countyId, string actor, string toolId, string correlationId = cid) => new
        {
            eventId = Guid.NewGuid(), timestamp = "2026-09-07T00:00:00Z", type = "tool_completed",
            toolId, correlationId, context = new { countyId, userId = actor, roles = new[] { "appraiser" } },
            summary = "private-upstream-summary", payloadRef = "private-upstream-payload", rawPayload = "private-source"
        };
        var json = System.Text.Json.JsonSerializer.Serialize(new { events = new[] {
            Event(county, "operator", "export_audit_bundle"),
            Event("22222222-2222-2222-2222-222222222222", "operator", "export_audit_bundle"),
            Event(county, "other-actor", "export_audit_bundle"),
            Event(county, "operator", "register_document"),
            Event(county, "operator", "export_audit_bundle", "different-correlation") } });
        using var client = new HttpClient(new InventoryTransport(json));
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient("county-workflow-pilot-runtime")).Returns(client);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services);
        controller.Request.Method = "GET";
        controller.HttpContext.User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[] {
            new System.Security.Claims.Claim("countyId", county),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "operator"),
            new System.Security.Claims.Claim("perm", "read:dossier"), new System.Security.Claims.Claim("perm", "read:dais") }, "synthetic"));
        controller.Request.Headers["x-county-id"] = "22222222-2222-2222-2222-222222222222";
        controller.Request.Headers["x-user-id"] = "other-actor";
        var response = (await PilotRuntimeProxy.ForwardAsync(controller.Request, $"trace/{cid}")).Should().BeOfType<ContentResult>().Subject;
        response.StatusCode.Should().Be(200);
        using var result = System.Text.Json.JsonDocument.Parse(response.Content!);
        var events = result.RootElement.GetProperty("events").EnumerateArray().ToArray();
        events.Should().ContainSingle();
        events[0].GetProperty("correlationId").GetString().Should().Be(cid);
        events[0].GetProperty("context").GetProperty("countyId").GetString().Should().Be(county);
        response.Content.Should().NotContain("private-").And.NotContain("other-actor");
    }

    [Theory]
    [InlineData(false, true, "tf-valid-cid")]
    [InlineData(true, false, "tf-valid-cid")]
    [InlineData(true, true, "../../tools")]
    public async System.Threading.Tasks.Task TraceBridgeRefusesUnauthorizedOrUnsafeRequestsBeforeDispatch(bool authenticated, bool permission, string cid)
    {
        var factory = new Mock<IHttpClientFactory>(MockBehavior.Strict);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services);
        var claims = new List<System.Security.Claims.Claim> {
            new("countyId", "11111111-1111-1111-1111-111111111111"),
            new(System.Security.Claims.ClaimTypes.NameIdentifier, "operator") };
        if (permission) { claims.Add(new("perm", "read:dossier")); claims.Add(new("perm", "read:dais")); }
        controller.Request.Method = "GET";
        controller.HttpContext.User = new(new System.Security.Claims.ClaimsIdentity(claims, authenticated ? "synthetic" : null));
        var response = await PilotRuntimeProxy.ForwardAsync(controller.Request, $"trace/{cid}");
        response.Should().BeAssignableTo<IActionResult>();
        response.Should().NotBeOfType<ContentResult>();
        factory.Verify(f => f.CreateClient(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async System.Threading.Tasks.Task DiscoveryOnlyAdvertisesTheFourSupportedWorkflowDispatches()
    {
        using var client = new HttpClient(new InventoryTransport("""
            {"count":5,"tools":[
              {"toolId":"generate_morning_brief","mode":"muse","displayName":"Morning Brief"},
              {"toolId":"open_appeal_packet","mode":"pilot"},
              {"toolId":"export_equalization_package","mode":"pilot","requiresConfirmation":true},
              {"toolId":"export_audit_bundle","mode":"pilot","requiresConfirmation":true},
              {"toolId":"register_document","mode":"pilot"}
            ]}
            """));
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient("county-workflow-pilot-runtime")).Returns(client);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services);
        controller.Request.Method = "GET";
        var result = (await controller.GetTools()).Should().BeOfType<ContentResult>().Subject;
        result.StatusCode.Should().Be(200);
        using var payload = System.Text.Json.JsonDocument.Parse(result.Content!);
        payload.RootElement.GetProperty("count").GetInt32().Should().Be(4);
        var tools = payload.RootElement.GetProperty("tools").EnumerateArray().ToArray();
        tools.Select(tool => tool.GetProperty("toolId").GetString()).Should().Equal(
            "generate_morning_brief", "open_appeal_packet", "export_equalization_package", "export_audit_bundle");
        tools[0].GetProperty("displayName").GetString().Should().Be("Morning Brief");
        tools[2].GetProperty("requiresConfirmation").GetBoolean().Should().BeTrue();
    }

    [Theory]
    [InlineData("not-json")]
    [InlineData("{\"tools\":null}")]
    [InlineData("{\"tools\":[{\"toolId\":1}]}")]
    public async System.Threading.Tasks.Task InvalidDiscoveryFailsClosed(string response)
    {
        using var client = new HttpClient(new InventoryTransport(response));
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient("county-workflow-pilot-runtime")).Returns(client);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services);
        controller.Request.Method = "GET";
        var result = (await controller.GetTools()).Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(503);
        System.Text.Json.JsonSerializer.Serialize(result.Value).Should().Contain("PILOT_RUNTIME_RESPONSE_INVALID");
    }

    private sealed class InventoryTransport(string json, HttpStatusCode status = HttpStatusCode.OK) : HttpMessageHandler
    {
        protected override System.Threading.Tasks.Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
            => System.Threading.Tasks.Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(json) });
    }

    [Fact]
    public async System.Threading.Tasks.Task ActualNamedApplicationClientRefusesCredentialBearingRedirects()
    {
        using var port = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
        port.Start();
        var address = $"http://127.0.0.1:{((IPEndPoint)port.LocalEndpoint).Port}/";
        port.Stop();
        using var listener = new HttpListener();
        listener.Prefixes.Add(address);
        listener.Start();
        var paths = new List<string>();
        var server = System.Threading.Tasks.Task.Run(async () =>
        {
            try
            {
                while (listener.IsListening)
                {
                    var incoming = await listener.GetContextAsync();
                    paths.Add(incoming.Request.Url!.AbsolutePath);
                    incoming.Response.StatusCode = paths.Count == 1 ? 307 : 200;
                    if (paths.Count == 1) incoming.Response.Headers["Location"] = "/credential-sink";
                    incoming.Response.Close();
                }
            }
            catch (Exception ex) when (ex is HttpListenerException or ObjectDisposedException) { }
        });
        try
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            { ["PilotRuntime:BaseUrl"] = address }).Build();
            var registrations = new ServiceCollection().AddLogging().AddSingleton<IConfiguration>(config);
            registrations.AddDossierMutationRuntime(config, Mock.Of<IHostEnvironment>());
            using var services = registrations.BuildServiceProvider();
            var controller = CreateController(services);
            controller.Request.Method = "POST";
            controller.Request.Headers.Authorization = "Bearer synthetic-caller";
            var result = await controller.InvokeTool(new { toolId = "export_equalization_package" });
            result.Should().BeOfType<ContentResult>().Which.StatusCode.Should().Be(307);
        }
        finally
        {
            listener.Stop();
            await server;
        }
        paths.Should().Equal("/pilot/invoke");
    }

    [Theory]
    [InlineData("https://example.com")]
    [InlineData("http://localhost:19417/other")]
    [InlineData("http://user:password@localhost:19417")]
    [InlineData("http://localhost:19417?destination=remote")]
    public async System.Threading.Tasks.Task InvalidRuntimeDestinationFailsClosed(string destination)
    {
        using var services = Services(destination);
        var request = CreateController(services).Request;
        request.HttpContext.Items["CorrelationId"] = "tf-config-failure";
        request.Method = "POST";
        var result = await PilotRuntimeProxy.ForwardAsync(request, "invoke", new { toolId = "export_equalization_package" });
        var failure = result.Should().BeOfType<ObjectResult>().Subject;
        failure.StatusCode.Should().Be(503);
        System.Text.Json.JsonSerializer.Serialize(failure.Value).Should().Contain("PILOT_RUNTIME_CONFIGURATION_INVALID").And.Contain("tf-config-failure");
    }

    [Fact]
    public async System.Threading.Tasks.Task MissingConfigurationAndUnrelatedToolsRemainOffline()
    {
        using var offline = Services(null);
        var result = await CreateController(offline).InvokeTool(new { toolId = "export_equalization_package" });
        var payload = System.Text.Json.JsonSerializer.Serialize(result.Should().BeOfType<OkObjectResult>().Subject.Value);
        payload.Should().Contain("PILOT_RUNTIME_OFFLINE").And.Contain("\"success\":false");
        using var configured = Services("http://localhost:19417");
        // No HTTP factory is registered: unrelated tools must not attempt dispatch.
        var unrelated = await PilotRuntimeProxy.ForwardAsync(CreateController(configured).Request,
            "invoke", new { toolId = "register_document" });
        unrelated.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task TransportFailureCannotBecomeSuccessfulExport()
    {
        using var client = new HttpClient(new UnavailableTransport());
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient("county-workflow-pilot-runtime")).Returns(client);
        using var services = Services("http://localhost:19417", factory.Object);
        var controller = CreateController(services);
        controller.Request.Method = "POST";
        controller.HttpContext.Items["CorrelationId"] = "tf-transport-failure";
        var result = await controller.InvokeTool(new { toolId = "export_equalization_package" });
        var failure = result.Should().BeOfType<ObjectResult>().Subject;
        failure.StatusCode.Should().Be(503);
        var json = System.Text.Json.JsonSerializer.Serialize(failure.Value);
        json.Should().Contain("PILOT_RUNTIME_UNAVAILABLE").And.Contain("\"ok\":false").And.Contain("tf-transport-failure").And.NotContain("private-transport-detail");
    }

    private static ServiceProvider Services(string? destination, IHttpClientFactory? factory = null)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["PilotRuntime:BaseUrl"] = destination,
        }).Build();
        var services = new ServiceCollection().AddSingleton<IConfiguration>(config);
        if (factory is not null) services.AddSingleton(factory);
        return services.BuildServiceProvider();
    }

    [Fact]
    public async System.Threading.Tasks.Task ConfiguredApplicationRouteForwardsCallerAndReturnsRealRuntimeEnvelope()
    {
        var transport = new RecordingTransport();
        using var client = new HttpClient(transport);
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["PilotRuntime:BaseUrl"] = "http://localhost:19417"
        }).Build();
        using var services = new ServiceCollection().AddSingleton<IConfiguration>(config)
            .AddSingleton(factory.Object).BuildServiceProvider();
        var controller = CreateController(services);
        controller.Request.Method = "POST";
        controller.Request.Headers.Authorization = "Bearer synthetic-caller";
        controller.Request.Headers["x-county-id"] = "11111111-1111-1111-1111-111111111111";
        controller.HttpContext.Items["CorrelationId"] = "tf-proxy-correlation-test";
        controller.Request.Headers["x-user-id"] = "forged-actor";
        controller.Request.Headers["x-role"] = "administrator";
        controller.Request.Headers["x-county-id"] = "22222222-2222-2222-2222-222222222222";
        object invocation = controller.InvokeTool(new { toolId = "export_equalization_package", confirmation = false });
        var result = invocation is System.Threading.Tasks.Task<IActionResult> pending
            ? await pending : (IActionResult)invocation;
        var content = result.Should().BeOfType<ContentResult>().Subject;
        content.StatusCode.Should().Be(200);
        content.Content.Should().Be("{\"ok\":false,\"errorCode\":\"CONFIRMATION_REQUIRED\"}");
        transport.Path.Should().Be("/pilot/invoke");
        transport.Authorization.Should().Be("Bearer synthetic-caller");
        transport.CorrelationId.Should().Be("tf-proxy-correlation-test");
        transport.CountyId.Should().Be("11111111-1111-1111-1111-111111111111");
        transport.Actor.Should().Be("operator");
        transport.Roles.Should().Be("appraiser");
        transport.Body.Should().Contain("\"confirmation\":false");
        factory.Verify(f => f.CreateClient("county-workflow-pilot-runtime"), Times.Once);
    }

    private static PilotController CreateController(IServiceProvider services) => new(
        Mock.Of<IMuseService>(), Mock.Of<IDraftService>(), Mock.Of<IMuseRouterStatusService>(),
        NullLogger<PilotController>.Instance)
    {
        ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { RequestServices = services,
            User = new(new System.Security.Claims.ClaimsIdentity(new[] {
                new System.Security.Claims.Claim("countyId", "11111111-1111-1111-1111-111111111111"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "operator"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "appraiser"),
                new System.Security.Claims.Claim("perm", "read:dossier"), new System.Security.Claims.Claim("perm", "read:dais") }, "synthetic")) } }
    };

    private sealed class UnavailableTransport : HttpMessageHandler
    {
        protected override System.Threading.Tasks.Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
            => throw new HttpRequestException("private-transport-detail");
    }

    private sealed class RecordingTransport : HttpMessageHandler
    {
        public string? Path { get; private set; }
        public string? Authorization { get; private set; }
        public string? CorrelationId { get; private set; }
        public string? CountyId { get; private set; }
        public string? Actor { get; private set; }
        public string? Roles { get; private set; }
        public string? Body { get; private set; }
        protected override async System.Threading.Tasks.Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Path = request.RequestUri!.AbsolutePath;
            Authorization = request.Headers.Authorization?.ToString();
            CorrelationId = request.Headers.TryGetValues("X-Correlation-ID", out var values) ? values.Single() : null;
            CountyId = request.Headers.TryGetValues("x-county-id", out var counties) ? counties.Single() : null;
            Actor = request.Headers.TryGetValues("x-user-id", out var actors) ? actors.Single() : null;
            Roles = request.Headers.TryGetValues("x-role", out var roles) ? roles.Single() : null;
            Body = await request.Content!.ReadAsStringAsync(ct);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"ok\":false,\"errorCode\":\"CONFIRMATION_REQUIRED\"}")
            };
        }
    }
}
