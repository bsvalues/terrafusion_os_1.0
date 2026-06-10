using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Core.Sync.Corpus;
using TerraFusion.Data;
using TerraFusion.Data.Services.Workbench.Corpus;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2 unit tests for
/// <see cref="PacsBaselineReconciler"/>. We exercise the
/// canonical-count side (against the in-memory db) and the
/// PACS-side unreachable path (no <c>PacsConnection</c> configured).
///
/// <para>The PACS query path isn't exercised in unit tests — it
/// requires a real SQL Server connection and is proven against
/// live PACS in the SYNC-COMPLETE-3 live-replay seal.</para>
/// </summary>
public sealed class PacsBaselineReconcilerTests : IDisposable
{
    private readonly TerraFusionDbContext _db;
    private readonly IConfiguration _emptyConfig;

    public PacsBaselineReconcilerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"corpus-recon-{Guid.NewGuid():N}")
            .Options;
        _emptyConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        _db = new TerraFusionDbContext(options, _emptyConfig);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private PacsBaselineReconciler Build(IConfiguration? config = null) =>
        new(_db, config ?? _emptyConfig,
            NullLogger<PacsBaselineReconciler>.Instance);

    [Fact]
    public async Task QueryAsync_without_PacsConnection_returns_Unreachable()
    {
        var result = await Build().QueryAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None);
        result.Outcome.Should().Be(PacsBaselineOutcome.Unreachable);
        result.Notes.Should().Contain("PacsConnection");
    }

    [Fact]
    public async Task QueryAsync_with_blank_lane_name_returns_UnknownLane()
    {
        // Lane validation happens before the PacsConnection guard.
        var result = await Build().QueryAsync(" ", 2026, CancellationToken.None);
        result.Outcome.Should().Be(PacsBaselineOutcome.UnknownLane);
    }

    [Fact]
    public async Task QueryAsync_geometry_without_ArcGis_url_returns_Unreachable()
    {
        var result = await Build().QueryAsync(
            CorpusReconciliationPolicy.LaneGeometry, 2026, CancellationToken.None);
        result.Outcome.Should().Be(PacsBaselineOutcome.Unreachable);
        result.Notes.Should().Contain("ArcGis");
    }

    [Fact]
    public async Task CountTfCanonicalAsync_parcel_returns_zero_when_empty()
    {
        var count = await Build().CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None);
        count.Should().Be(0L);
    }

    [Fact]
    public async Task CountTfCanonicalAsync_parcel_counts_seeded_rows()
    {
        for (var i = 0; i < 3; i++)
        {
            _db.TfParcels.Add(new TfParcel { TfParcelId = Guid.NewGuid(), CountyId = Guid.NewGuid() });
        }
        await _db.SaveChangesAsync();

        var count = await Build().CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None);
        count.Should().Be(3L);
    }

    [Fact]
    public async Task CountTfCanonicalAsync_sales_only_counts_qualified_rows()
    {
        _db.TfSales.Add(new TfSale
        {
            TfSaleId = Guid.NewGuid(),
            DorRatioQualified = true,
            CountyRatioQualified = false,
        });
        _db.TfSales.Add(new TfSale
        {
            TfSaleId = Guid.NewGuid(),
            DorRatioQualified = false,
            CountyRatioQualified = true,
        });
        _db.TfSales.Add(new TfSale
        {
            TfSaleId = Guid.NewGuid(),
            DorRatioQualified = false,
            CountyRatioQualified = false,
        });
        await _db.SaveChangesAsync();

        var count = await Build().CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneSales, 2026, CancellationToken.None);
        count.Should().Be(2L);
    }

    [Fact]
    public async Task CountTfCanonicalAsync_owner_wsdor_aggregates_owner_and_wsdor_rows()
    {
        _db.TfOwners.Add(new TfOwner { TfOwnerId = Guid.NewGuid() });
        _db.TfOwners.Add(new TfOwner { TfOwnerId = Guid.NewGuid() });
        _db.TfAssessmentWsdors.Add(new TfAssessmentWsdor
        {
            TfAssessmentWsdorId = Guid.NewGuid(),
            AssessmentYear = 2026,
        });
        _db.TfAssessmentWsdors.Add(new TfAssessmentWsdor
        {
            TfAssessmentWsdorId = Guid.NewGuid(),
            AssessmentYear = 2025,  // wrong year — excluded
        });
        await _db.SaveChangesAsync();

        var count = await Build().CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneOwnerWsdor, 2026, CancellationToken.None);
        count.Should().Be(3L);
    }

    [Fact]
    public async Task CountTfCanonicalAsync_unknown_lane_returns_zero()
    {
        var count = await Build().CountTfCanonicalAsync(
            "not-a-lane", 2026, CancellationToken.None);
        count.Should().Be(0L);
    }
}
