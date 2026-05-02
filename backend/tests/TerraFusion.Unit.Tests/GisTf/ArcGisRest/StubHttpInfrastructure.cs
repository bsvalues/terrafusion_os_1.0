using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Unit.Tests.GisTf.ArcGisRest;

/// <summary>
/// Stub <see cref="HttpMessageHandler"/> for unit-testing
/// HttpClient-consuming services without network access. Captures the
/// last request URI for assertion and replies with a fixed status +
/// body.
/// </summary>
internal sealed class StubHttpMessageHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _statusCode;
    private readonly string _body;

    public StubHttpMessageHandler(HttpStatusCode statusCode, string body)
    {
        _statusCode = statusCode;
        _body = body;
    }

    public Uri? LastRequestUri { get; private set; }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        LastRequestUri = request.RequestUri;
        var response = new HttpResponseMessage(_statusCode)
        {
            Content = new StringContent(_body, System.Text.Encoding.UTF8, "application/json"),
            RequestMessage = request,
        };
        return Task.FromResult(response);
    }
}

/// <summary>
/// Stub <see cref="IHttpClientFactory"/> that always hands back an
/// <see cref="HttpClient"/> wired to a single
/// <see cref="StubHttpMessageHandler"/>.
/// </summary>
internal sealed class StubHttpClientFactory : IHttpClientFactory
{
    private readonly StubHttpMessageHandler _handler;
    public StubHttpClientFactory(StubHttpMessageHandler handler) => _handler = handler;

    public HttpClient CreateClient(string name)
    {
        return new HttpClient(_handler, disposeHandler: false);
    }
}
