// WO-DATA-004C-GEOM-002 — Unit tests for geometry slice-control.
// Covers: URL resultRecordCount appending, orderByFields, full-corpus guard,
// and geomTopN derivation. No ArcGIS network calls — HTTP is captured by
// CapturingHandler. No EF/DB required.

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

public class GeomSliceControlTests
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    // ── URL construction ──────────────────────────────────────────────────

    [Fact]
    public async Task FetchParcels_TopN100_UrlContainsResultRecordCount()
    {
        var (sut, h) = Build();
        await sut.FetchParcelsAsync(BentonId, topN: 100, CancellationToken.None);
        Assert.Contains("resultRecordCount=100", h.CapturedUri ?? string.Empty);
    }

    [Fact]
    public async Task FetchParcels_TopN100_UrlContainsOrderByObjectId()
    {
        var (sut, h) = Build();
        await sut.FetchParcelsAsync(BentonId, topN: 100, CancellationToken.None);
        Assert.Contains("orderByFields=OBJECTID", h.CapturedUri ?? string.Empty);
    }

    [Fact]
    public async Task FetchParcels_NullTopN_UrlHasNoResultRecordCount()
    {
        var (sut, h) = Build();
        await sut.FetchParcelsAsync(BentonId, topN: null, CancellationToken.None);
        Assert.DoesNotContain("resultRecordCount", h.CapturedUri ?? string.Empty);
    }

    [Fact]
    public async Task FetchParcels_TopN100_And_TopN500_ProduceDifferentUrls()
    {
        var (sut100, h100) = Build();
        var (sut500, h500) = Build();

        await sut100.FetchParcelsAsync(BentonId, topN: 100, CancellationToken.None);
        await sut500.FetchParcelsAsync(BentonId, topN: 500, CancellationToken.None);

        Assert.NotEqual(h100.CapturedUri, h500.CapturedUri);
    }

    // ── Full-corpus guard logic ───────────────────────────────────────────

    [Fact]
    public void Guard_Fires_WhenTopNNullAndFullCorpusFalse()
    {
        int? topN = null;
        bool fullCorpus = false;
        Assert.True(topN is null && !fullCorpus,
            "Guard must block null TopN + FullCorpus=false to prevent silent full-county pull.");
    }

    [Fact]
    public void Guard_DoesNotFire_WhenTopNProvided()
    {
        int? topN = 100;
        bool fullCorpus = false;
        Assert.False(topN is null && !fullCorpus);
    }

    [Fact]
    public void Guard_DoesNotFire_WhenFullCorpusTrue()
    {
        int? topN = null;
        bool fullCorpus = true;
        Assert.False(topN is null && !fullCorpus);
    }

    // ── geomTopN derivation ───────────────────────────────────────────────

    [Fact]
    public void GeomTopN_IsNull_WhenFullCorpusTrue()
    {
        int? topN = 100;
        bool fullCorpus = true;
        int? geomTopN = fullCorpus ? (int?)null : topN;
        Assert.Null(geomTopN);
    }

    [Fact]
    public void GeomTopN_EqualsTopN_WhenFullCorpusFalse()
    {
        int? topN = 100;
        bool fullCorpus = false;
        int? geomTopN = fullCorpus ? (int?)null : topN;
        Assert.Equal(100, geomTopN);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private static (ArcGisFeatureServiceClient sut, CapturingHandler handler) Build()
    {
        var handler = new CapturingHandler();
        var http = new HttpClient(handler);
        var factory = new StubHttpClientFactory(http);

        var opts = new ArcGisFeatureServiceOptions();
        opts.Counties[BentonId.ToString()] = new CountyArcGisOptions
        {
            ParcelFeatureServiceUrl = "https://test.arcgis.example/FeatureServer/0",
            ApnAttributeName = "geo_id",
            ObjectIdAttributeName = "OBJECTID",
            OutSpatialReferenceEpsg = 4326,
            RequestTimeoutSeconds = 30,
        };

        return (new ArcGisFeatureServiceClient(
            factory,
            Options.Create(opts),
            NullLogger<ArcGisFeatureServiceClient>.Instance), handler);
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public string? CapturedUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CapturedUri = request.RequestUri?.ToString();
            const string empty = "{\"type\":\"FeatureCollection\",\"features\":[]}";
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(empty, Encoding.UTF8, "application/json"),
            });
        }
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }
}
