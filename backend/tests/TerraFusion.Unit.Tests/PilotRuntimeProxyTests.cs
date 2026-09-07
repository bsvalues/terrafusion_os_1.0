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
        request.Method = "POST";
        var result = await PilotRuntimeProxy.ForwardAsync(request, "invoke", new { toolId = "export_equalization_package" });
        var failure = result.Should().BeOfType<ObjectResult>().Subject;
        failure.StatusCode.Should().Be(503);
        System.Text.Json.JsonSerializer.Serialize(failure.Value).Should().Contain("PILOT_RUNTIME_CONFIGURATION_INVALID");
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
        var result = await controller.InvokeTool(new { toolId = "export_equalization_package" });
        var failure = result.Should().BeOfType<ObjectResult>().Subject;
        failure.StatusCode.Should().Be(503);
        var json = System.Text.Json.JsonSerializer.Serialize(failure.Value);
        json.Should().Contain("PILOT_RUNTIME_UNAVAILABLE").And.Contain("\"ok\":false").And.NotContain("private-transport-detail");
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
        object invocation = controller.InvokeTool(new { toolId = "export_equalization_package", confirmation = false });
        var result = invocation is System.Threading.Tasks.Task<IActionResult> pending
            ? await pending : (IActionResult)invocation;
        var content = result.Should().BeOfType<ContentResult>().Subject;
        content.StatusCode.Should().Be(200);
        content.Content.Should().Be("{\"ok\":false,\"errorCode\":\"CONFIRMATION_REQUIRED\"}");
        transport.Path.Should().Be("/pilot/invoke");
        transport.Authorization.Should().Be("Bearer synthetic-caller");
        transport.Body.Should().Contain("\"confirmation\":false");
        factory.Verify(f => f.CreateClient("county-workflow-pilot-runtime"), Times.Once);
    }

    private static PilotController CreateController(IServiceProvider services) => new(
        Mock.Of<IMuseService>(), Mock.Of<IDraftService>(), Mock.Of<IMuseRouterStatusService>(),
        NullLogger<PilotController>.Instance)
    {
        ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { RequestServices = services } }
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
        public string? Body { get; private set; }
        protected override async System.Threading.Tasks.Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Path = request.RequestUri!.AbsolutePath;
            Authorization = request.Headers.Authorization?.ToString();
            Body = await request.Content!.ReadAsStringAsync(ct);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"ok\":false,\"errorCode\":\"CONFIRMATION_REQUIRED\"}")
            };
        }
    }
}
