// WO-DATA-004C-GEOM-011 — Service-level behaviour tests for LandParcelGeomsPagedAsync.
//
// Verifies loop-control contract:
//   * Multi-page runs land features across all pages.
//   * exceededTransferLimit=false does NOT terminate the loop.
//   * Empty page terminates the loop.
//   * Cross-page duplicate objectIds do not stop pagination.
//   * PageSize <= 0 throws ArgumentOutOfRangeException.
//
// No ArcGIS network calls — IArcGisFeatureServiceClient is mocked.
// No PACS. In-memory EF DB.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Core.GIS.ArcGisRest;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyArcGisRaw;
using Xunit;

namespace TerraFusion.API.Tests.GIS;

public sealed class ArcGisRawLandingServicePagedTests
{
    private static readonly Guid TestCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private const string TestFips = "53005";

    // ── Multi-page: all features from both pages are landed ───────────────

    [Fact]
    public async Task LandParcelGeomsPagedAsync_TwoPages_LandsBothPages()
    {
        var (svc, client) = Build();

        client.Setup(c => c.FetchCountAsync(TestFips, It.IsAny<CancellationToken>()))
              .ReturnsAsync(2000);

        client.SetupSequence(c => c.FetchPageAsync(
                TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MakeFeatures(1, 1000), false))   // page 0: objectIds 1-1000, exceededLimit=false
            .ReturnsAsync((MakeFeatures(1001, 1000), false)) // page 1: objectIds 1001-2000
            .ReturnsAsync((Array.Empty<ArcGisParcelFeature>(), false)); // safety: empty stop

        var result = await svc.LandParcelGeomsPagedAsync(
            TestFips, TestCountyId, "test-op", pageSize: 1000, topN: null);

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(2000, result.FeaturesConsidered);
        Assert.Equal(2000, result.FeaturesLanded);
        Assert.Equal(0, result.DuplicateObjectIds);
        Assert.True(result.PaginatedMode);

        // Exactly 2 page fetches were needed.
        client.Verify(c => c.FetchPageAsync(
            TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    // ── exceededTransferLimit=false must NOT stop the loop ────────────────

    [Fact]
    public async Task LandParcelGeomsPagedAsync_ExceededTransferLimitFalse_ContinuesToNextPage()
    {
        var (svc, client) = Build();

        // preflightCount = 1500, pageSize = 1000 → 2 pages needed
        client.Setup(c => c.FetchCountAsync(TestFips, It.IsAny<CancellationToken>()))
              .ReturnsAsync(1500);

        client.SetupSequence(c => c.FetchPageAsync(
                TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MakeFeatures(1, 1000), false))  // page 0 — server says false (no limit hit)
            .ReturnsAsync((MakeFeatures(1001, 500), false)) // page 1 — remaining 500
            .ReturnsAsync((Array.Empty<ArcGisParcelFeature>(), false));

        var result = await svc.LandParcelGeomsPagedAsync(
            TestFips, TestCountyId, "test-op", pageSize: 1000, topN: null);

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(1500, result.FeaturesConsidered);
        // Both pages must have been fetched.
        client.Verify(c => c.FetchPageAsync(
            TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    // ── Empty page terminates the loop ───────────────────────────────────

    [Fact]
    public async Task LandParcelGeomsPagedAsync_EmptyPage_StopsImmediately()
    {
        var (svc, client) = Build();

        // preflightCount = 5000 → we'd need 5 pages, but page 2 is empty → stops at page 2
        client.Setup(c => c.FetchCountAsync(TestFips, It.IsAny<CancellationToken>()))
              .ReturnsAsync(5000);

        client.SetupSequence(c => c.FetchPageAsync(
                TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MakeFeatures(1, 1000), true))   // page 0 — 1000 features
            .ReturnsAsync((Array.Empty<ArcGisParcelFeature>(), false)) // page 1 — empty → STOP
            .ReturnsAsync((MakeFeatures(1001, 1000), false)); // page 2 — should NOT be reached

        var result = await svc.LandParcelGeomsPagedAsync(
            TestFips, TestCountyId, "test-op", pageSize: 1000, topN: null);

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(1000, result.FeaturesConsidered);
        // Must stop after the empty page — page 2 must not be fetched.
        client.Verify(c => c.FetchPageAsync(
            TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    // ── Cross-page dedup does NOT stop pagination ─────────────────────────

    [Fact]
    public async Task LandParcelGeomsPagedAsync_CrossPageDuplicates_DoNotStopPagination()
    {
        var (svc, client) = Build();

        // preflightCount = 2000, but page 2 has 500 objectId duplicates from page 1.
        // totalConsidered still accumulates to 2000 across 2 pages → terminates correctly.
        client.Setup(c => c.FetchCountAsync(TestFips, It.IsAny<CancellationToken>()))
              .ReturnsAsync(2000);

        var page1Features = MakeFeatures(1, 1000);
        // Page 2: 500 duplicates (ids 501-1000) + 500 fresh (ids 1001-1500)
        var page2Features = MakeFeatures(501, 1000);

        client.SetupSequence(c => c.FetchPageAsync(
                TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((page1Features, false))
            .ReturnsAsync((page2Features, false))
            .ReturnsAsync((Array.Empty<ArcGisParcelFeature>(), false));

        var result = await svc.LandParcelGeomsPagedAsync(
            TestFips, TestCountyId, "test-op", pageSize: 1000, topN: null);

        Assert.Equal("COMPLETED", result.Status);
        // Both pages fetched — duplicates don't stop the loop.
        client.Verify(c => c.FetchPageAsync(
            TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
        // Dedup reduces landed vs considered.
        Assert.Equal(2000, result.FeaturesConsidered);
        Assert.Equal(500, result.DuplicateObjectIds);
        Assert.Equal(1500, result.FeaturesLanded);
    }

    // ── topN cap respected ───────────────────────────────────────────────

    [Fact]
    public async Task LandParcelGeomsPagedAsync_TopNCap_StopsAfterTopNConsidered()
    {
        var (svc, client) = Build();

        // corpus = 89247 but operator caps at topN=1500
        client.Setup(c => c.FetchCountAsync(TestFips, It.IsAny<CancellationToken>()))
              .ReturnsAsync(89247);

        client.SetupSequence(c => c.FetchPageAsync(
                TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MakeFeatures(1, 1000), false))   // page 0
            .ReturnsAsync((MakeFeatures(1001, 500), false))  // page 1 — 500 of the 1500 cap
            .ReturnsAsync((MakeFeatures(1501, 1000), false)); // should NOT be reached

        var result = await svc.LandParcelGeomsPagedAsync(
            TestFips, TestCountyId, "test-op", pageSize: 1000, topN: 1500);

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(1500, result.FeaturesConsidered);
        client.Verify(c => c.FetchPageAsync(
            TestFips, TestCountyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    // ── PageSize <= 0 throws immediately ────────────────────────────────

    [Fact]
    public async Task LandParcelGeomsPagedAsync_PageSizeZero_ThrowsArgumentOutOfRange()
    {
        var (svc, _) = Build();

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            svc.LandParcelGeomsPagedAsync(TestFips, TestCountyId, "op", pageSize: 0, topN: null));
    }

    [Fact]
    public async Task LandParcelGeomsPagedAsync_PageSizeNegative_ThrowsArgumentOutOfRange()
    {
        var (svc, _) = Build();

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            svc.LandParcelGeomsPagedAsync(TestFips, TestCountyId, "op", pageSize: -1, topN: null));
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private static (ArcGisRawLandingService svc, Mock<IArcGisFeatureServiceClient> client) Build()
    {
        var dbName = Guid.NewGuid().ToString();
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["ConnectionStrings:DefaultConnection"]).Returns($"Data Source={dbName}.db");

        var opts = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var db = new TerraFusionDbContext(opts, configMock.Object);
        var client = new Mock<IArcGisFeatureServiceClient>();
        var svc = new ArcGisRawLandingService(db, client.Object, NullLogger<ArcGisRawLandingService>.Instance);

        return (svc, client);
    }

    private static IReadOnlyList<ArcGisParcelFeature> MakeFeatures(long startObjectId, int count)
    {
        var features = new List<ArcGisParcelFeature>(count);
        for (var i = 0; i < count; i++)
        {
            features.Add(new ArcGisParcelFeature
            {
                CountyId = TestCountyId,
                ArcGisObjectId = startObjectId + i,
                ArcGisApn = $"APN-{startObjectId + i}",
                GeomWkt = "POLYGON((0 0,1 0,1 1,0 1,0 0))",
                CentroidLat = 46.2,
                CentroidLon = -119.3,
                AreaSqFt = 5000.0,
                SourceServiceUrl = "https://test.arcgis.example/FeatureServer/0",
            });
        }
        return features;
    }
}
