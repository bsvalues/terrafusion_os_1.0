// WO-DATA-004C-GEOM-011 — Pagination URL behavior tests.
//
// Verifies that FetchPageAsync and FetchCountAsync build the correct ArcGIS
// REST query URLs. No ArcGIS network calls — HTTP is captured by CapturingHandler.
// No EF/DB. No PACS.

using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.Core.Configuration;
using TerraFusion.Core.GIS.ArcGisRest;
using Xunit;

namespace TerraFusion.API.Tests.GIS;

public class GeomSliceControlPaginationTests
{
    private const string BentonFips = "53005";
    private static readonly Guid BentonId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private const string ServiceBase = "https://test.arcgis.example/FeatureServer/0";

    // ── FetchPageAsync URL construction ───────────────────────────────────

    [Fact]
    public async Task FetchPageAsync_FirstPage_UrlContainsResultRecordCount1000()
    {
        var (sut, h) = Build();
        await sut.FetchPageAsync(BentonFips, BentonId, offset: 0, pageSize: 1000, CancellationToken.None);
        Assert.Contains("resultRecordCount=1000", h.CapturedUri ?? string.Empty);
    }

    [Fact]
    public async Task FetchPageAsync_FirstPage_UrlContainsResultOffsetZero()
    {
        var (sut, h) = Build();
        await sut.FetchPageAsync(BentonFips, BentonId, offset: 0, pageSize: 1000, CancellationToken.None);
        Assert.Contains("resultOffset=0", h.CapturedUri ?? string.Empty);
    }

    [Fact]
    public async Task FetchPageAsync_SecondPage_UrlContainsResultOffset1000()
    {
        var (sut, h) = Build();
        await sut.FetchPageAsync(BentonFips, BentonId, offset: 1000, pageSize: 1000, CancellationToken.None);
        Assert.Contains("resultOffset=1000", h.CapturedUri ?? string.Empty);
    }

    [Fact]
    public async Task FetchPageAsync_UrlContainsOrderByObjectIdAsc()
    {
        var (sut, h) = Build();
        await sut.FetchPageAsync(BentonFips, BentonId, offset: 0, pageSize: 1000, CancellationToken.None);
        Assert.Contains("orderByFields=OBJECTID+ASC", h.CapturedUri ?? string.Empty);
    }

    [Fact]
    public async Task FetchPageAsync_UrlContainsFGeojson()
    {
        var (sut, h) = Build();
        await sut.FetchPageAsync(BentonFips, BentonId, offset: 0, pageSize: 1000, CancellationToken.None);
        Assert.Contains("f=geojson", h.CapturedUri ?? string.Empty);
    }

    // ── FetchCountAsync URL construction ─────────────────────────────────

    [Fact]
    public async Task FetchCountAsync_UrlContainsReturnCountOnly()
    {
        var (sut, h) = Build(countResponse: true);
        await sut.FetchCountAsync(BentonFips, CancellationToken.None);
        Assert.Contains("returnCountOnly=true", h.CapturedUri ?? string.Empty);
    }

    [Fact]
    public async Task FetchCountAsync_UrlContainsFJson()
    {
        var (sut, h) = Build(countResponse: true);
        await sut.FetchCountAsync(BentonFips, CancellationToken.None);
        Assert.Contains("f=json", h.CapturedUri ?? string.Empty);
    }

    // ── FetchPageAsync URL is distinct from FetchParcelsAsync URL ─────────

    [Fact]
    public async Task FetchPageAsync_UrlDiffersFromFetchParcels_NoPaginationParams()
    {
        var (sut, pagingHandler) = Build();
        var (sutFull, fullHandler) = Build();

        await sut.FetchPageAsync(BentonFips, BentonId, offset: 0, pageSize: 1000, CancellationToken.None);
        await sutFull.FetchParcelsAsync(BentonFips, BentonId, topN: null, CancellationToken.None);

        // The non-paged URL must NOT contain resultOffset or resultRecordCount.
        Assert.DoesNotContain("resultOffset", fullHandler.CapturedUri ?? string.Empty);
        // The paged URL must contain both.
        Assert.Contains("resultOffset=0", pagingHandler.CapturedUri ?? string.Empty);
        Assert.Contains("resultRecordCount=1000", pagingHandler.CapturedUri ?? string.Empty);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private static (ArcGisFeatureServiceClient sut, CapturingHandler handler) Build(
        bool countResponse = false)
    {
        var body = countResponse
            ? "{\"count\":89247}"
            : "{\"type\":\"FeatureCollection\",\"features\":[],\"exceededTransferLimit\":false}";

        var handler = new CapturingHandler(body);
        var http = new HttpClient(handler);
        var factory = new StubHttpClientFactory(http);

        var opts = new ArcGisFeatureServiceOptions();
        opts.Counties[BentonFips] = new CountyArcGisOptions
        {
            ParcelFeatureServiceUrl = ServiceBase,
            ApnAttributeName = "geo_id",
            ObjectIdAttributeName = "OBJECTID",
            OutSpatialReferenceEpsg = 4326,
            RequestTimeoutSeconds = 30,
            PageSize = 1000,
        };

        return (new ArcGisFeatureServiceClient(
            factory,
            Options.Create(opts),
            NullLogger<ArcGisFeatureServiceClient>.Instance), handler);
    }

    private sealed class CapturingHandler(string responseBody) : HttpMessageHandler
    {
        public string? CapturedUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CapturedUri = request.RequestUri?.ToString();
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseBody, Encoding.UTF8, "application/json"),
            });
        }
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }
}
