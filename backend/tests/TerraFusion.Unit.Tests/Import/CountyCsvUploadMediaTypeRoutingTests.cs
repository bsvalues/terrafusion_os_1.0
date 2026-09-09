using System.Diagnostics;
using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Auth;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Import;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Import;

/// <summary>
/// Exercises real MVC endpoint generation and ASP.NET endpoint routing without a host or socket.
/// Routing-only cases observe controller selection before execution; they do not authenticate a
/// user, establish county context, invoke actions or prove their HTTP responses.
/// The fallback does execute, so the original wrong-route 404 is visible in a failing assertion.
/// Separate direct-action and real MVC-invocation cases use synthetic context/resolver ports
/// through the real county binding chain. They do not prove JWT/RequireAssessor middleware.
/// </summary>
public sealed class CountyCsvUploadMediaTypeRoutingTests
{
    [Fact]
    public void Factory_discovers_only_the_production_data_import_controller()
    {
        using var fixture = new RoutingFixture();
        var actions = fixture.Endpoints
            .Select(endpoint => endpoint.Metadata.GetMetadata<ControllerActionDescriptor>())
            .OfType<ControllerActionDescriptor>()
            .ToArray();

        Assert.NotEmpty(actions);
        Assert.All(actions, action =>
            Assert.Equal(typeof(DataImportController), action.ControllerTypeInfo.AsType()));
        Assert.Single(actions.Where(action => action.MethodInfo.Name == nameof(DataImportController.UploadFile)));
        Assert.Contains(actions, action => action.MethodInfo.Name == nameof(DataImportController.GetCountyUploadHistory));
        Assert.Contains(actions, action => action.MethodInfo.Name == nameof(DataImportController.PromoteSales));
        Assert.Contains(actions, action => action.MethodInfo.Name == nameof(DataImportController.GetPromotedSalesAvailability));
        Assert.Equal(int.MaxValue, fixture.Fallback.Order);
        Assert.NotNull(fixture.Fallback.Metadata.GetMetadata<IAllowAnonymous>());
        Assert.Null(fixture.Fallback.Metadata.GetMetadata<IAcceptsMetadata>());
    }

    [Theory]
    [InlineData("application/json")]
    [InlineData("application/json; charset=utf-8")]
    [InlineData("text/plain")]
    [InlineData("application/x-www-form-urlencoded")]
    [InlineData("application/octet-stream")]
    [InlineData("multipart/mixed; boundary=wal002l")]
    [InlineData(null)]
    public async Task Unsupported_content_type_selects_protected_upload_rejection_not_spa(
        string? contentType)
    {
        using var fixture = new RoutingFixture();
        var observed = await fixture.RouteAsync("POST", "/api/upload", contentType);

        // This is deliberately a behavioral RED at the old production controller: routing picks
        // the anonymous fallback and executes its 404. No reference to a future method is needed.
        Assert.True(observed.ControllerExecutionDeferred,
            $"POST /api/upload Content-Type '{contentType ?? "<absent>"}' selected " +
            $"'{observed.Endpoint?.DisplayName ?? "<no endpoint>"}'; " +
            $"fallbackExecuted={observed.FallbackExecuted}, response={observed.StatusCode}. " +
            "Expected the assessor-protected production rejection action for HTTP 415, not SPA 404.");

        var endpoint = Assert.IsType<RouteEndpoint>(observed.Endpoint);
        var action = Assert.IsType<ControllerActionDescriptor>(
            endpoint.Metadata.GetMetadata<ControllerActionDescriptor>());
        Assert.Equal(typeof(DataImportController), action.ControllerTypeInfo.AsType());
        Assert.NotEqual(nameof(DataImportController.UploadFile), action.MethodInfo.Name);
        Assert.Equal("api/upload", endpoint.RoutePattern.RawText?.TrimStart('/'));
        Assert.Equal("POST", Assert.Single(endpoint.Metadata.GetMetadata<IHttpMethodMetadata>()!.HttpMethods));
        Assert.True(endpoint.Order > fixture.Upload.Order && endpoint.Order < fixture.Fallback.Order,
            "The exact upload rejection must rank after multipart UploadFile and before the SPA fallback.");
        AssertAssessorProtected(endpoint);
        Assert.False(observed.FallbackExecuted);
        Assert.Equal(0L, observed.RequestBodyPosition);
        // No response-status assertion here: the controller has not executed. In particular,
        // a default HttpContext status of 200 is not a fabricated successful upload or rejection.
    }

    [Theory]
    [InlineData("multipart/form-data; boundary=wal002l")]
    [InlineData("multipart/form-data; boundary=\"wal002l\"")]
    [InlineData("Multipart/Form-Data; boundary=wal002l")]
    [InlineData("multipart/form-data")]
    public async Task Multipart_keeps_the_original_protected_upload_action(string contentType)
    {
        using var fixture = new RoutingFixture();
        var observed = await fixture.RouteAsync("POST", "/api/upload", contentType);

        Assert.Same(fixture.Upload, observed.Endpoint);
        Assert.True(observed.ControllerExecutionDeferred);
        AssertAssessorProtected(fixture.Upload);
        var accepts = fixture.Upload.Metadata.GetMetadata<IAcceptsMetadata>();
        Assert.NotNull(accepts);
        Assert.Equal("multipart/form-data", Assert.Single(accepts!.ContentTypes));
        Assert.False(observed.FallbackExecuted);
        Assert.Equal(0L, observed.RequestBodyPosition);
        // A missing boundary still matches the media type. Form-parser refusal is a later stage,
        // intentionally not asserted by this routing-only fixture.
    }

    [Theory]
    [InlineData("GET", "/api/upload/history", nameof(DataImportController.GetCountyUploadHistory))]
    [InlineData("GET", "/api/upload/promoted-sales", nameof(DataImportController.GetPromotedSalesAvailability))]
    [InlineData("POST", "/api/upload/00000000-0000-4000-8000-000000000001/promote", nameof(DataImportController.PromoteSales))]
    public async Task Existing_upload_routes_keep_their_own_protected_actions(
        string method, string path, string actionName)
    {
        using var fixture = new RoutingFixture();
        var observed = await fixture.RouteAsync(method, path, "application/json");

        var endpoint = Assert.IsType<RouteEndpoint>(observed.Endpoint);
        var action = Assert.IsType<ControllerActionDescriptor>(
            endpoint.Metadata.GetMetadata<ControllerActionDescriptor>());
        Assert.Equal(typeof(DataImportController), action.ControllerTypeInfo.AsType());
        Assert.Equal(actionName, action.MethodInfo.Name);
        AssertAssessorProtected(endpoint);
        Assert.True(observed.ControllerExecutionDeferred);
        Assert.False(observed.FallbackExecuted);
    }

    [Theory]
    [InlineData("POST", "/api/unknown")]
    [InlineData("GET", "/api/unknown")]
    [InlineData("POST", "/api/uploads")]
    [InlineData("POST", "/api/upload/extra")]
    [InlineData("POST", "/api/upload/not-a-guid/promote")]
    [InlineData("POST", "/api/upload/history")]
    [InlineData("POST", "/hubs/unknown")]
    [InlineData("GET", "/api/upload")]
    [InlineData("HEAD", "/api/upload")]
    [InlineData("PUT", "/api/upload")]
    [InlineData("PATCH", "/api/upload")]
    [InlineData("DELETE", "/api/upload")]
    [InlineData("OPTIONS", "/api/upload")]
    public async Task Unknown_paths_and_other_verbs_preserve_api_fallback_404(
        string method, string path)
    {
        using var fixture = new RoutingFixture();
        var observed = await fixture.RouteAsync(method, path, "application/json");

        AssertFallbackEndpoint(fixture.Fallback, observed.Endpoint);
        Assert.Null(observed.Endpoint!.Metadata.GetMetadata<ControllerActionDescriptor>());
        Assert.False(observed.ControllerExecutionDeferred);
        Assert.True(observed.FallbackExecuted);
        Assert.Equal(StatusCodes.Status404NotFound, observed.StatusCode);
        Assert.Equal(string.Empty, observed.ResponseBody);
    }

    [Theory]
    [InlineData("GET")]
    [InlineData("POST")]
    public async Task Non_api_non_file_path_keeps_the_anonymous_spa_fallback(string method)
    {
        using var fixture = new RoutingFixture();
        var observed = await fixture.RouteAsync(method, "/counties", "application/json");

        AssertFallbackEndpoint(fixture.Fallback, observed.Endpoint);
        Assert.NotNull(observed.Endpoint!.Metadata.GetMetadata<IAllowAnonymous>());
        Assert.False(observed.ControllerExecutionDeferred);
        Assert.True(observed.FallbackExecuted);
        Assert.Equal(StatusCodes.Status200OK, observed.StatusCode);
        Assert.Equal(RoutingFixture.SyntheticShell, observed.ResponseBody);
    }

    [Fact]
    public async Task Missing_file_does_not_match_the_nonfile_fallback()
    {
        using var fixture = new RoutingFixture();
        var observed = await fixture.RouteAsync("GET", "/missing.js", null);

        Assert.Null(observed.Endpoint);
        Assert.False(observed.ControllerExecutionDeferred);
        Assert.False(observed.FallbackExecuted);
        Assert.Equal(StatusCodes.Status404NotFound, observed.StatusCode);
    }

    [Fact]
    public void Api_explorer_exposes_one_upload_operation_not_the_rejection_route()
    {
        using var fixture = new RoutingFixture();
        var upload = Assert.Single(fixture.ApiDescriptions.Where(description =>
            description.HttpMethod == "POST" && description.RelativePath == "api/upload"));
        var action = Assert.IsType<ControllerActionDescriptor>(upload.ActionDescriptor);
        Assert.Equal(nameof(DataImportController.UploadFile), action.MethodInfo.Name);
    }

    [Theory]
    [InlineData(true, "wa-yakima", "synthetic-operator", false, 415)]
    [InlineData(false, "wa-yakima", "synthetic-operator", false, 403)]
    [InlineData(true, "unknown", "synthetic-operator", false, 403)]
    [InlineData(true, "wa-yakima", "", false, 403)]
    [InlineData(true, "wa-yakima", "synthetic-operator", true, 403)]
    public async Task Direct_rejection_preserves_canonical_context_without_body_or_ingestion(
        bool authenticated, string county, string actor, bool ambiguous, int status)
    {
        var fixture = CreateDirectAction(authenticated, county, actor, ambiguous);
        using var body = new UnreadBody();
        fixture.Controller.Request.Body = body;
        fixture.Controller.Request.ContentType = "application/json";

        var result = await fixture.Controller.RejectUnsupportedUpload();

        if (status == 415)
            Assert.Equal(status, Assert.IsType<UnsupportedMediaTypeResult>(result).StatusCode);
        else
            Assert.IsType<ForbidResult>(result);
        fixture.VerifyNoIngestion();
    }

    [Fact]
    public async Task Direct_rejection_honors_cancellation_without_ingestion()
    {
        var fixture = CreateDirectAction(true, "wa-yakima", "synthetic-operator", false);
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        fixture.Controller.HttpContext.RequestAborted = cancellation.Token;
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            fixture.Controller.RejectUnsupportedUpload());
        fixture.VerifyNoIngestion();
    }

    [Theory]
    [InlineData(true, 415)]
    [InlineData(false, 403)]
    public async Task Mvc_invocation_rejects_urlencoded_without_reading_body(
        bool established, int expectedStatus)
    {
        // Real MVC activation, model binding and action invocation, with synthetic context ports.
        // This is not JWT/policy middleware acceptance. Capture the result before executing it,
        // so a Forbid result does not need a synthetic authentication handler.
        var services = new ServiceCollection();
        services.AddLogging();
        using var diagnostics = new DiagnosticListener("WAL002L.MvcInvocation");
        services.AddSingleton(diagnostics);
        services.AddSingleton<DiagnosticSource>(diagnostics);
        var captured = new CapturedResult();
        services.AddControllers(options => options.Filters.Add(captured))
            .ConfigureApplicationPartManager(parts =>
            {
                parts.ApplicationParts.Clear();
                parts.ApplicationParts.Add(new UploadControllerPart());
                parts.FeatureProviders.Clear();
                parts.FeatureProviders.Add(new ControllerFeatureProvider());
            });
        var fixture = CreateDirectAction(true, established ? "wa-yakima" : "unknown",
            "synthetic-operator", false, services);
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var action = Assert.Single(provider.GetRequiredService<IActionDescriptorCollectionProvider>()
            .ActionDescriptors.Items.OfType<ControllerActionDescriptor>().Where(descriptor =>
                descriptor.MethodInfo.Name == nameof(DataImportController.RejectUnsupportedUpload)));
        using var body = new UnreadBody();
        var context = new DefaultHttpContext { RequestServices = scope.ServiceProvider };
        context.Request.Method = "POST";
        context.Request.Path = "/api/upload";
        context.Request.ContentType = "application/x-www-form-urlencoded";
        context.Request.ContentLength = body.Length;
        context.Request.Body = body;
        var invoker = provider.GetRequiredService<IActionInvokerFactory>()
            .CreateInvoker(new ActionContext(context, new RouteData(), action));
        Assert.NotNull(invoker);

        await invoker!.InvokeAsync();

        if (expectedStatus == 415)
            Assert.Equal(expectedStatus,
                Assert.IsType<UnsupportedMediaTypeResult>(captured.Result).StatusCode);
        else
            Assert.IsType<ForbidResult>(captured.Result);
        Assert.Equal(0L, body.Position);
        fixture.VerifyNoIngestion();
    }

    private sealed class CapturedResult : IAsyncResultFilter, IOrderedFilter
    {
        public int Order => int.MinValue;
        public IActionResult? Result { get; private set; }
        public Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
        {
            Result = context.Result;
            context.Cancel = true;
            return Task.CompletedTask;
        }
    }

    private static (DataImportController Controller, Action VerifyNoIngestion) CreateDirectAction(
        bool authenticated, string county, string actor, bool ambiguous,
        IServiceCollection? services = null)
    {
        // Unit-test ports only: no fabricated JWT, Established result, database row or role grant.
        var accessor = new Mock<IRequestUserContextAccessor>(MockBehavior.Strict);
        accessor.SetupGet(value => value.Current).Returns(new RequestUserContext(
            authenticated, actor, county, new[] { "Assessor" }));
        var countyId = Guid.Parse("00000000-0000-4000-8000-000000000077");
        var resolver = new Mock<ICountyResolver>(MockBehavior.Strict);
        resolver.Setup(value => value.TryResolveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string key, CancellationToken token) =>
            {
                token.ThrowIfCancellationRequested();
                return Task.FromResult<Guid?>(key == "wa-yakima" || (ambiguous && key == "wa-benton")
                    ? countyId : null);
            });
        var provider = new AuthenticatedCanonicalCountyContextProvider(
            new AuthenticatedCountyAuthorityBinding(accessor.Object, resolver.Object),
            new AuthenticatedCanonicalCountyContext(resolver.Object));
        var ledger = new Mock<ICountyCsvUploadAdmissionLedger>(MockBehavior.Strict);
        var history = new Mock<ICountyCsvUploadHistoryReader>(MockBehavior.Strict);
        var stager = new Mock<ICountyCsvUploadRowStager>(MockBehavior.Strict);
        var promoter = new Mock<ICountyCsvUploadPromoter>(MockBehavior.Strict);
        if (services is not null)
        {
            services.AddSingleton(provider);
            services.AddSingleton(ledger.Object);
            services.AddSingleton(history.Object);
            services.AddSingleton(stager.Object);
            services.AddSingleton(promoter.Object);
        }
        var controller = new DataImportController(NullLogger<DataImportController>.Instance,
            provider, ledger.Object, history.Object, stager.Object, promoter.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        return (controller, () =>
        {
            ledger.VerifyNoOtherCalls();
            history.VerifyNoOtherCalls();
            stager.VerifyNoOtherCalls();
            promoter.VerifyNoOtherCalls();
        });
    }

    private sealed class UnreadBody : MemoryStream
    {
        public UnreadBody() : base(Encoding.UTF8.GetBytes("key=value")) { }
        public override int Read(byte[] buffer, int offset, int count) =>
            throw new InvalidOperationException("Rejection must not read the request body.");
        public override int Read(Span<byte> buffer) =>
            throw new InvalidOperationException("Rejection must not read the request body.");
        public override int ReadByte() =>
            throw new InvalidOperationException("Rejection must not read the request body.");
        public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken token) =>
            throw new InvalidOperationException("Rejection must not read the request body.");
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken token = default) =>
            throw new InvalidOperationException("Rejection must not read the request body.");
    }

    private static void AssertFallbackEndpoint(RouteEndpoint expected, Endpoint? selected)
    {
        // Endpoint data sources may regenerate equivalent instances while building the pipeline.
        // Assert route semantics here; each caller separately proves fallback execution and output.
        var actual = Assert.IsType<RouteEndpoint>(selected);
        Assert.Equal(expected.RoutePattern.RawText, actual.RoutePattern.RawText);
        Assert.Equal(expected.Order, actual.Order);
        Assert.Null(actual.Metadata.GetMetadata<ControllerActionDescriptor>());
        Assert.NotNull(actual.Metadata.GetMetadata<IAllowAnonymous>());
    }

    private static void AssertAssessorProtected(Endpoint endpoint)
    {
        Assert.Null(endpoint.Metadata.GetMetadata<IAllowAnonymous>());
        Assert.Contains(endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>(),
            authorization => authorization.Policy == "RequireAssessor");
    }

    private sealed class UploadControllerPart : ApplicationPart, IApplicationPartTypeProvider
    {
        public override string Name => nameof(UploadControllerPart);
        public IEnumerable<TypeInfo> Types => new[] { typeof(DataImportController).GetTypeInfo() };
    }

    private sealed class RoutingFixture : IDisposable
    {
        public const string SyntheticShell = "<!doctype html><title>WAL002L routing fixture</title>";
        private static readonly object DeferredControllerKey = new();
        private static readonly object ExecutedFallbackKey = new();
        private readonly DiagnosticListener _diagnostics = new("WAL002L.RoutingTests");
        private readonly ServiceProvider _services;
        private readonly RequestDelegate _pipeline;

        public IReadOnlyList<Endpoint> Endpoints { get; }
        public RouteEndpoint Upload { get; }
        public RouteEndpoint Fallback { get; }
        public IEnumerable<ApiDescription> ApiDescriptions => _services
            .GetRequiredService<IApiDescriptionGroupCollectionProvider>()
            .ApiDescriptionGroups.Items.SelectMany(group => group.Items);

        public RoutingFixture()
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddSingleton(_diagnostics);
            services.AddSingleton<DiagnosticSource>(_diagnostics);
            services.AddRouting();
            services.AddControllers().ConfigureApplicationPartManager(parts =>
            {
                parts.ApplicationParts.Clear();
                parts.ApplicationParts.Add(new UploadControllerPart());
                parts.FeatureProviders.Clear();
                parts.FeatureProviders.Add(new ControllerFeatureProvider());
            });
            _services = services.BuildServiceProvider();

            var app = new ApplicationBuilder(_services);
            app.UseRouting();
            app.Use(next => context =>
            {
                // Observe the real routing result without executing protected controllers. No
                // fake principal, auth scheme, controller activator, or replacement endpoint is
                // installed. JWT/policy execution and controller collaborators are outside scope.
                if (context.GetEndpoint()?.Metadata.GetMetadata<ControllerActionDescriptor>() is not null)
                {
                    context.Items[DeferredControllerKey] = true;
                    return Task.CompletedTask;
                }

                return next(context);
            });

            var endpoints = new List<Endpoint>();
            app.UseEndpoints(routes =>
            {
                routes.MapControllers();
                // Reproduce Program.cs:2896-2938 with the UI-present branch active: no method
                // constraint, default {*path:nonfile}, /api and /hubs refusal inside the delegate,
                // AllowAnonymous. Only index.html file I/O is replaced by an in-memory shell.
                routes.MapFallback(context =>
                {
                    context.Items[ExecutedFallbackKey] = true;
                    if (context.Request.Path.StartsWithSegments("/api") ||
                        context.Request.Path.StartsWithSegments("/hubs"))
                    {
                        context.Response.StatusCode = StatusCodes.Status404NotFound;
                        return Task.CompletedTask;
                    }

                    context.Response.ContentType = "text/html; charset=utf-8";
                    context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                    return context.Response.WriteAsync(SyntheticShell);
                }).AllowAnonymous();
                endpoints.AddRange(routes.DataSources.SelectMany(source => source.Endpoints));
            });

            Endpoints = endpoints;
            Upload = endpoints.OfType<RouteEndpoint>().Single(endpoint =>
                endpoint.Metadata.GetMetadata<ControllerActionDescriptor>()?.MethodInfo.Name ==
                    nameof(DataImportController.UploadFile));
            Fallback = endpoints.OfType<RouteEndpoint>().Single(endpoint =>
                endpoint.RoutePattern.RawText == "{*path:nonfile}");
            _pipeline = app.Build();
        }

        public async Task<RoutingObservation> RouteAsync(string method, string path, string? contentType)
        {
            using var scope = _services.CreateScope();
            using var requestBody = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
            using var responseBody = new MemoryStream();
            var context = new DefaultHttpContext { RequestServices = scope.ServiceProvider };
            context.Request.Method = method;
            context.Request.Path = path;
            context.Request.ContentType = contentType;
            context.Request.ContentLength = requestBody.Length;
            context.Request.Body = requestBody;
            context.Response.Body = responseBody;

            await _pipeline(context);

            return new RoutingObservation(
                context.GetEndpoint(),
                context.Items.ContainsKey(DeferredControllerKey),
                context.Items.ContainsKey(ExecutedFallbackKey),
                context.Response.StatusCode,
                Encoding.UTF8.GetString(responseBody.ToArray()),
                requestBody.Position);
        }

        public void Dispose()
        {
            _services.Dispose();
            _diagnostics.Dispose();
        }
    }

    private sealed record RoutingObservation(
        Endpoint? Endpoint,
        bool ControllerExecutionDeferred,
        bool FallbackExecuted,
        int StatusCode,
        string ResponseBody,
        long RequestBodyPosition);
}
