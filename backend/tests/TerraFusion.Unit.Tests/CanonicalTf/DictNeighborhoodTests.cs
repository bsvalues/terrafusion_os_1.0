using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice E1 acceptance tests for
/// <see cref="DictNeighborhood"/>. Per Block-C contract v1.1
/// (<c>docs/pacs/block-c-contract-v1.1.md</c>):
///
/// <list type="bullet">
///   <item>Insert + persist via the canonical DbSet.</item>
///   <item>Same <c>HoodCd</c> across different counties is allowed
///   (sovereign isolation).</item>
///   <item>Soft-retire via <c>IsActive = false</c> keeps the row
///   queryable for historical lookups.</item>
///   <item>Provenance columns (<c>LoadBatchId</c> +
///   <c>SourceQueryHash</c>) round-trip correctly.</item>
/// </list>
///
/// <para>Note on uniqueness: the <c>(CountyId, HoodCd)</c> unique
/// index is locked at the EF model level (asserted in
/// <see cref="Doctrine.BlockCContractV1Tests"/>) and at the
/// relational provider level via the AddDictNeighborhood
/// migration. The InMemory provider used here does NOT enforce
/// indexes, so the duplicate-rejection test is intentionally an
/// EF-model-shape assertion rather than a SaveChanges throw.</para>
/// </summary>
public sealed class DictNeighborhoodTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public DictNeighborhoodTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"e1-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Insert_AssignsId_AndPersists()
    {
        var countyId = Guid.NewGuid();
        var loadBatchId = Guid.NewGuid();

        var row = new DictNeighborhood
        {
            CountyId = countyId,
            HoodCd = "HOOD-01",
            HoodName = "Downtown Kennewick",
            HoodGroupCd = "URBAN",
            LoadBatchId = loadBatchId,
            SourceQueryHash = "abc123",
        };
        _db.DictNeighborhoods.Add(row);
        await _db.SaveChangesAsync();

        var loaded = await _db.DictNeighborhoods.SingleAsync();
        loaded.DictNeighborhoodId.Should().NotBe(Guid.Empty);
        loaded.CountyId.Should().Be(countyId);
        loaded.HoodCd.Should().Be("HOOD-01");
        loaded.HoodName.Should().Be("Downtown Kennewick");
        loaded.HoodGroupCd.Should().Be("URBAN");
        loaded.IsActive.Should().BeTrue("default IsActive is true per v1.1 §3.7");
        loaded.LoadBatchId.Should().Be(loadBatchId);
        loaded.SourceQueryHash.Should().Be("abc123");
    }

    [Fact]
    public async Task SameHoodCd_AcrossDifferentCounties_IsAllowed()
    {
        var bentonId = Guid.NewGuid();
        var franklinId = Guid.NewGuid();

        _db.DictNeighborhoods.AddRange(
            NewRow(bentonId, "RIVER-01", "Benton riverbank zone"),
            NewRow(franklinId, "RIVER-01", "Franklin riverbank zone"));
        await _db.SaveChangesAsync();

        // Sovereign isolation: same hood_cd across counties is fine.
        var both = await _db.DictNeighborhoods
            .Where(d => d.HoodCd == "RIVER-01")
            .ToListAsync();
        both.Should().HaveCount(2);
        both.Select(d => d.CountyId)
            .Should().BeEquivalentTo(new[] { bentonId, franklinId });
    }

    [Fact]
    public async Task SoftRetire_KeepsRowQueryable_ButFiltersFromActiveLookups()
    {
        var countyId = Guid.NewGuid();
        _db.DictNeighborhoods.AddRange(
            NewRow(countyId, "ACTIVE-01"),
            NewRow(countyId, "RETIRED-01"));
        await _db.SaveChangesAsync();

        var retired = await _db.DictNeighborhoods.SingleAsync(d => d.HoodCd == "RETIRED-01");
        retired.IsActive = false;
        retired.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Historical lookup: row still present.
        (await _db.DictNeighborhoods.CountAsync(d => d.CountyId == countyId))
            .Should().Be(2,
                "soft-retire never hard-deletes per v1.1 §3.7 lifecycle rule");

        // Active-only lookup: only the live row.
        var active = await _db.DictNeighborhoods
            .Where(d => d.CountyId == countyId && d.IsActive)
            .ToListAsync();
        active.Should().HaveCount(1);
        active[0].HoodCd.Should().Be("ACTIVE-01");
    }

    [Fact]
    public async Task Provenance_RoundTripsLoadBatchAndSourceQueryHash()
    {
        var countyId = Guid.NewGuid();
        var batch1 = Guid.NewGuid();
        var batch2 = Guid.NewGuid();

        _db.DictNeighborhoods.AddRange(
            new DictNeighborhood
            {
                CountyId = countyId, HoodCd = "B1-01",
                LoadBatchId = batch1, SourceQueryHash = "qh-1",
            },
            new DictNeighborhood
            {
                CountyId = countyId, HoodCd = "B2-01",
                LoadBatchId = batch2, SourceQueryHash = "qh-2",
            });
        await _db.SaveChangesAsync();

        var fromBatch1 = await _db.DictNeighborhoods
            .Where(d => d.LoadBatchId == batch1)
            .ToListAsync();
        fromBatch1.Should().HaveCount(1);
        fromBatch1[0].HoodCd.Should().Be("B1-01");
        fromBatch1[0].SourceQueryHash.Should().Be("qh-1");
    }

    [Fact]
    public async Task Update_TouchesUpdatedAt_Independently_OfCreatedAt()
    {
        var countyId = Guid.NewGuid();
        var createdAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        _db.DictNeighborhoods.Add(new DictNeighborhood
        {
            CountyId = countyId,
            HoodCd = "UPD-01",
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
        });
        await _db.SaveChangesAsync();

        var row = await _db.DictNeighborhoods.SingleAsync();
        var newUpdatedAt = createdAt.AddDays(7);
        row.HoodName = "Updated label";
        row.UpdatedAt = newUpdatedAt;
        await _db.SaveChangesAsync();

        var reloaded = await _db.DictNeighborhoods.SingleAsync();
        reloaded.CreatedAt.Should().Be(createdAt,
            "CreatedAt is set once and never moves");
        reloaded.UpdatedAt.Should().Be(newUpdatedAt);
        reloaded.HoodName.Should().Be("Updated label");
    }

    private static DictNeighborhood NewRow(
        Guid countyId, string hoodCd, string? name = null)
        => new()
        {
            CountyId = countyId,
            HoodCd = hoodCd,
            HoodName = name ?? hoodCd,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
        };
}
