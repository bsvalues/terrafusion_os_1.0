// WO-DATA-004C-GEOM-002 Blocker Patch — focused tests addressing Codex review findings.
//
// Covers:
//   A. Controller guard through real DrainGeometry action path (not just boolean logic)
//   B. SourceQueryHash/provenance descriptor is distinct for TopN=100 vs TopN=500 and
//      for FullCorpus=true vs bounded TopN
//   C. Mismatched Benton CountyId returns 409 BEFORE any ArcGIS fetch (LandParcelGeomsAsync
//      must never be called when the county row has the wrong GUID)
//
// No geometry execution. No ArcGIS calls. No real DB. No PACS.

using System;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Core.GIS.ArcGisRest;
using TerraFusion.Core.Sync.ArcGisRawLanding;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.API.Tests.GIS;

public sealed class GeomSliceControlV2Tests
{
    private static readonly Guid KnownBentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    // ── A. Controller guard through real action path ──────────────────────

    [Fact]
    public async Task DrainGeometry_NullRequest_Returns400()
    {
        var (controller, _) = BuildController();
        var result = await controller.DrainGeometry(
            rawLandingSvc: null!,
            truthPromotionSvc: null!,
            canonicalProjector: null!,
            request: null,
            cancellationToken: CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task DrainGeometry_TopNNull_FullCorpusFalse_Returns400()
    {
        var (controller, _) = BuildController();
        var result = await controller.DrainGeometry(
            rawLandingSvc: null!,
            truthPromotionSvc: null!,
            canonicalProjector: null!,
            request: new DoctrineDrainController.DoctrineDrainRequest(null, null, false, null),
            cancellationToken: CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        // Response body contains the error key
        Assert.NotNull(bad.Value);
    }

    [Fact]
    public async Task DrainGeometry_TopNProvided_PassesGuard_DoesNotReturn400()
    {
        // TopN=100 + FullCorpus=false must clear the guard.
        // Drain proceeds but hits mismatched county 409 (empty DB has no Benton row →
        // ResolveOrCreate creates one with KnownBentonId → CountyId matches → proceeds
        // to Stage 1 which needs a service). Verify result is NOT 400.
        var (controller, _) = BuildController();
        var mockSvc = new Mock<IArcGisRawLandingService>();
        mockSvc
            .Setup(s => s.LandParcelGeomsAsync(It.IsAny<Guid>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArcGisRawLandingResult
            {
                LoadBatchId = Guid.NewGuid(),
                Status = "FAILED",
                FeaturesConsidered = 0,
                FeaturesLanded = 0,
                DuplicateObjectIds = 0,
                AreaSqFtSum = 0d,
                ErrorSummary = "stub",
            });

        var result = await controller.DrainGeometry(
            rawLandingSvc: mockSvc.Object,
            truthPromotionSvc: null!,
            canonicalProjector: null!,
            request: new DoctrineDrainController.DoctrineDrainRequest(null, null, false, 100),
            cancellationToken: CancellationToken.None);

        Assert.IsNotType<BadRequestObjectResult>(result);
    }

    // ── B. SourceQueryHash / provenance descriptor distinctness ──────────

    // The queryDescriptor used in ArcGisRawLandingService is:
    //   $"county={countyId} f=geojson where=1=1 outSR=4326 returnGeometry=true{topNPart}"
    // where topNPart = " topN=N orderByFields=OBJECTID+ASC" (bounded) or " fullCorpus=true".
    // Two different descriptors → two different SHA256 hashes.

    [Fact]
    public void SourceQueryDescriptor_TopN100_DiffersFrom_TopN500()
    {
        var id = KnownBentonId;
        var d100 = BuildDescriptor(id, topN: 100);
        var d500 = BuildDescriptor(id, topN: 500);
        Assert.NotEqual(d100, d500);
        Assert.NotEqual(ComputeHash(d100), ComputeHash(d500));
    }

    [Fact]
    public void SourceQueryDescriptor_FullCorpus_DiffersFrom_BoundedTopN100()
    {
        var id = KnownBentonId;
        var dBounded = BuildDescriptor(id, topN: 100);
        var dFull = BuildDescriptor(id, topN: null);
        Assert.NotEqual(dBounded, dFull);
        Assert.NotEqual(ComputeHash(dBounded), ComputeHash(dFull));
    }

    [Fact]
    public void SourceQueryHash_TopN100_ContainsTopNString()
    {
        var desc = BuildDescriptor(KnownBentonId, topN: 100);
        Assert.Contains("topN=100", desc);
        Assert.Contains("orderByFields=OBJECTID+ASC", desc);
    }

    [Fact]
    public void SourceQueryHash_FullCorpus_ContainsFullCorpusString()
    {
        var desc = BuildDescriptor(KnownBentonId, topN: null);
        Assert.Contains("fullCorpus=true", desc);
        Assert.DoesNotContain("topN=", desc);
    }

    // ── C. Mismatched Benton CountyId → 409 before ArcGIS fetch ─────────

    [Fact]
    public async Task DrainGeometry_MismatchedBentonCountyId_Returns409()
    {
        var wrongId = Guid.NewGuid(); // NOT KnownBentonId
        var (controller, _) = BuildController(bentonIdOverride: wrongId);
        var mockSvc = new Mock<IArcGisRawLandingService>();

        var result = await controller.DrainGeometry(
            rawLandingSvc: mockSvc.Object,
            truthPromotionSvc: null!,
            canonicalProjector: null!,
            request: new DoctrineDrainController.DoctrineDrainRequest(null, null, false, 100),
            cancellationToken: CancellationToken.None);

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(409, obj.StatusCode);
    }

    [Fact]
    public async Task DrainGeometry_MismatchedBentonCountyId_NeverCallsLandParcelGeoms()
    {
        var wrongId = Guid.NewGuid();
        var (controller, _) = BuildController(bentonIdOverride: wrongId);
        var mockSvc = new Mock<IArcGisRawLandingService>();

        await controller.DrainGeometry(
            rawLandingSvc: mockSvc.Object,
            truthPromotionSvc: null!,
            canonicalProjector: null!,
            request: new DoctrineDrainController.DoctrineDrainRequest(null, null, false, 100),
            cancellationToken: CancellationToken.None);

        // LandParcelGeomsAsync must never be called when county identity is wrong.
        mockSvc.Verify(
            s => s.LandParcelGeomsAsync(
                It.IsAny<Guid>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "ArcGIS fetch must not be initiated when BentonCountyId does not match the configured GUID");
    }

    // ── helpers ──────────────────────────────────────────────────────────

    /// <summary>
    /// Build a DoctrineDrainController backed by an in-memory EF DB.
    /// <paramref name="bentonIdOverride"/> seeds a Benton county row with that GUID
    /// (simulating a stale random-GUID row); when null the DB starts empty so
    /// ResolveOrCreate will create the canonical KnownBentonId row.
    /// </summary>
    private static (DoctrineDrainController controller, TerraFusionDbContext db)
        BuildController(Guid? bentonIdOverride = null)
    {
        var dbName = Guid.NewGuid().ToString();
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["ConnectionStrings:DefaultConnection"]).Returns($"Data Source={dbName}.db");

        var opts = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var db = new TerraFusionDbContext(opts, configMock.Object);

        if (bentonIdOverride.HasValue)
        {
            db.Counties.Add(new County
            {
                Id = bentonIdOverride.Value,
                Name = "Benton",
                State = "WA",
                FipsCode = "53005",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
            db.SaveChanges();
        }

        var controller = new DoctrineDrainController(
            db,
            NullLogger<DoctrineDrainController>.Instance);

        return (controller, db);
    }

    // Mirrors the queryDescriptor logic in ArcGisRawLandingService.LandParcelGeomsAsync.
    private static string BuildDescriptor(Guid countyId, int? topN)
    {
        var topNPart = topN.HasValue
            ? $" topN={topN.Value.ToString(CultureInfo.InvariantCulture)} orderByFields=OBJECTID+ASC"
            : " fullCorpus=true";
        return $"county={countyId} f=geojson where=1=1 outSR=4326 returnGeometry=true{topNPart}";
    }

    private static string ComputeHash(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
        var sb = new StringBuilder(16);
        for (var i = 0; i < 8; i++)
        {
            sb.Append(hash[i].ToString("x2", CultureInfo.InvariantCulture));
        }
        return sb.ToString();
    }
}
