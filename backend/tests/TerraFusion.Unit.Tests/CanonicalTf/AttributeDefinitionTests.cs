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
/// Slice E2 acceptance tests for <see cref="AttributeDefinition"/>.
/// Per Block-C contract v1.2
/// (<c>docs/pacs/block-c-contract-v1.2.md</c>):
///
/// <list type="bullet">
///   <item>Insert + persist via the canonical DbSet.</item>
///   <item>Same <c>IAttrId</c> across different counties is allowed
///   (sovereign isolation); never within one county.</item>
///   <item>Each closed-vocab value of <c>DataType</c> and
///   <c>AppliesTo</c> persists round-trip.</item>
///   <item>Soft-retire via <c>IsActive = false</c> keeps the row
///   queryable.</item>
///   <item>Provenance columns round-trip correctly.</item>
/// </list>
///
/// <para>Note on uniqueness: <c>(CountyId, IAttrId)</c> and
/// <c>(CountyId, AttributeCode)</c> uniqueness is locked at the
/// EF model level (asserted in
/// <see cref="Doctrine.BlockCContractV1Tests"/>) and at the
/// relational provider level via the AddAttributeDefinition
/// migration. The InMemory provider used here does NOT enforce
/// indexes — the tests below verify the cross-county-allowed
/// behavior, while the model-shape uniqueness is verified by the
/// dedicated H2 contract test.</para>
/// </summary>
public sealed class AttributeDefinitionTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public AttributeDefinitionTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"e2-{Guid.NewGuid():N}")
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

        var row = new AttributeDefinition
        {
            CountyId = countyId,
            IAttrId = 47,
            AttributeCode = "BEDROOMS",
            AttributeName = "Number of bedrooms",
            DataType = "NUMERIC",
            AppliesTo = "IMPROVEMENT",
            LoadBatchId = loadBatchId,
            SourceQueryHash = "qh-attr",
        };
        _db.AttributeDefinitions.Add(row);
        await _db.SaveChangesAsync();

        var loaded = await _db.AttributeDefinitions.SingleAsync();
        loaded.AttributeDefinitionId.Should().NotBe(Guid.Empty);
        loaded.CountyId.Should().Be(countyId);
        loaded.IAttrId.Should().Be(47);
        loaded.AttributeCode.Should().Be("BEDROOMS");
        loaded.DataType.Should().Be("NUMERIC");
        loaded.AppliesTo.Should().Be("IMPROVEMENT");
        loaded.IsActive.Should().BeTrue("default IsActive is true per v1.2 §3.8");
        loaded.LoadBatchId.Should().Be(loadBatchId);
        loaded.SourceQueryHash.Should().Be("qh-attr");
    }

    [Fact]
    public async Task SameIAttrId_AcrossDifferentCounties_IsAllowed()
    {
        var bentonId = Guid.NewGuid();
        var franklinId = Guid.NewGuid();

        _db.AttributeDefinitions.AddRange(
            NewRow(bentonId, iAttrId: 47, code: "BEDROOMS"),
            NewRow(franklinId, iAttrId: 47, code: "POOL_TYPE"));
        await _db.SaveChangesAsync();

        // Sovereign isolation: same i_attr_id across counties is fine,
        // and the canonical handle CAN differ (Benton's 47 ≠ Franklin's 47).
        var both = await _db.AttributeDefinitions
            .Where(a => a.IAttrId == 47)
            .ToListAsync();
        both.Should().HaveCount(2);
        both.Select(a => a.AttributeCode)
            .Should().BeEquivalentTo(new[] { "BEDROOMS", "POOL_TYPE" });
    }

    [Theory]
    [InlineData("NUMERIC")]
    [InlineData("STRING")]
    [InlineData("BOOLEAN")]
    [InlineData("DATE")]
    [InlineData("CODE")]
    public async Task DataType_AcceptsClosedVocabularyValues(string dataType)
    {
        // The v1.2 contract freezes these five DataType values.
        // Adding a sixth is a v1.3+ bump.
        var countyId = Guid.NewGuid();
        _db.AttributeDefinitions.Add(new AttributeDefinition
        {
            CountyId = countyId,
            IAttrId = 100,
            AttributeCode = $"ATTR-{dataType}",
            DataType = dataType,
            AppliesTo = "BOTH",
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
        });
        await _db.SaveChangesAsync();

        var saved = await _db.AttributeDefinitions
            .SingleAsync(a => a.DataType == dataType);
        saved.AttributeCode.Should().Be($"ATTR-{dataType}");
    }

    [Theory]
    [InlineData("IMPROVEMENT")]
    [InlineData("LAND")]
    [InlineData("BOTH")]
    public async Task AppliesTo_AcceptsClosedVocabularyValues(string appliesTo)
    {
        // Three frozen values per v1.2 §3.8.
        var countyId = Guid.NewGuid();
        _db.AttributeDefinitions.Add(new AttributeDefinition
        {
            CountyId = countyId,
            IAttrId = 200,
            AttributeCode = $"APPLIES-{appliesTo}",
            DataType = "STRING",
            AppliesTo = appliesTo,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
        });
        await _db.SaveChangesAsync();

        var saved = await _db.AttributeDefinitions
            .SingleAsync(a => a.AppliesTo == appliesTo);
        saved.AttributeCode.Should().Be($"APPLIES-{appliesTo}");
    }

    [Fact]
    public async Task SoftRetire_KeepsRowQueryable_ButFiltersFromActiveLookups()
    {
        var countyId = Guid.NewGuid();
        _db.AttributeDefinitions.AddRange(
            NewRow(countyId, iAttrId: 1, code: "ACTIVE_ATTR"),
            NewRow(countyId, iAttrId: 2, code: "RETIRED_ATTR"));
        await _db.SaveChangesAsync();

        var retired = await _db.AttributeDefinitions
            .SingleAsync(a => a.AttributeCode == "RETIRED_ATTR");
        retired.IsActive = false;
        retired.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Historical lookup: row still present.
        (await _db.AttributeDefinitions.CountAsync(a => a.CountyId == countyId))
            .Should().Be(2,
                "soft-retire never hard-deletes per v1.2 §3.8 lifecycle rule");

        // Active-only lookup: only the live row.
        var active = await _db.AttributeDefinitions
            .Where(a => a.CountyId == countyId && a.IsActive)
            .ToListAsync();
        active.Should().HaveCount(1);
        active[0].AttributeCode.Should().Be("ACTIVE_ATTR");
    }

    [Fact]
    public async Task ValueDomain_CanReferenceDictionary_WhenDataTypeIsCode()
    {
        var countyId = Guid.NewGuid();
        _db.AttributeDefinitions.Add(new AttributeDefinition
        {
            CountyId = countyId,
            IAttrId = 300,
            AttributeCode = "NEIGHBORHOOD",
            DataType = "CODE",
            ValueDomain = "dict_neighborhood",
            AppliesTo = "BOTH",
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
        });
        await _db.SaveChangesAsync();

        var saved = await _db.AttributeDefinitions.SingleAsync();
        saved.DataType.Should().Be("CODE");
        saved.ValueDomain.Should().Be("dict_neighborhood",
            "ValueDomain is the free-text pointer to a code-list dictionary in v1.2");
    }

    [Fact]
    public async Task Provenance_RoundTripsLoadBatchAndSourceQueryHash()
    {
        var countyId = Guid.NewGuid();
        var batch1 = Guid.NewGuid();

        _db.AttributeDefinitions.Add(new AttributeDefinition
        {
            CountyId = countyId,
            IAttrId = 1,
            AttributeCode = "PROV-1",
            DataType = "STRING",
            AppliesTo = "IMPROVEMENT",
            LoadBatchId = batch1,
            SourceQueryHash = "qh-1",
        });
        await _db.SaveChangesAsync();

        var fromBatch = await _db.AttributeDefinitions
            .SingleAsync(a => a.LoadBatchId == batch1);
        fromBatch.SourceQueryHash.Should().Be("qh-1");
        fromBatch.AttributeCode.Should().Be("PROV-1");
    }

    private static AttributeDefinition NewRow(
        Guid countyId, long iAttrId, string code,
        string dataType = "STRING",
        string appliesTo = "IMPROVEMENT")
        => new()
        {
            CountyId = countyId,
            IAttrId = iAttrId,
            AttributeCode = code,
            DataType = dataType,
            AppliesTo = appliesTo,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
        };
}
