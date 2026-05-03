using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.Canonical;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave44;

/// <summary>
/// R2Wave44 / C35-B - canonical sales qualification landing schema.
/// </summary>
[Trait("Category", "R2Wave44")]
[Trait("Category", "CanonicalSaleQualification")]
public sealed class R2Wave44CanonicalSaleQualificationSchemaTests
{
    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, config);
    }

    [Fact]
    public void C35B_CanonicalSaleQualification_HasSovereignCompositeKeyAndIndexes()
    {
        using var db = CreateDbContext(nameof(C35B_CanonicalSaleQualification_HasSovereignCompositeKeyAndIndexes));

        var entity = db.Model.FindEntityType(typeof(CanonicalSaleQualification));

        entity.Should().NotBeNull();
        var canonicalEntity = entity!;
        canonicalEntity.GetTableName().Should().Be("CanonicalSaleQualifications");
        var primaryKey = canonicalEntity.FindPrimaryKey();
        primaryKey.Should().NotBeNull();
        primaryKey!.Properties.Select(p => p.Name)
            .Should().Equal(
                nameof(CanonicalSaleQualification.CountyId),
                nameof(CanonicalSaleQualification.ChgOfOwnerId));

        var wacSource = canonicalEntity.FindProperty(nameof(CanonicalSaleQualification.WacCdSourceValue));
        var ratioSource = canonicalEntity.FindProperty(nameof(CanonicalSaleQualification.SlRatioTypeCdSourceValue));
        var salePrice = canonicalEntity.FindProperty(nameof(CanonicalSaleQualification.SalePrice));
        wacSource.Should().NotBeNull();
        ratioSource.Should().NotBeNull();
        salePrice.Should().NotBeNull();
        wacSource!.GetMaxLength().Should().Be(64);
        ratioSource!.GetMaxLength().Should().Be(64);
        salePrice!.GetPrecision().Should().Be(14);
        salePrice.GetScale().Should().Be(2);

        canonicalEntity.GetIndexes().Select(i => i.GetDatabaseName())
            .Should().Contain(new[]
            {
                "IX_CanonSaleQual_Workbook_Decision",
                "IX_CanonSaleQual_County_Decision",
            });

        canonicalEntity.FindProperty("Grantor").Should().BeNull();
        canonicalEntity.FindProperty("Grantee").Should().BeNull();
        canonicalEntity.FindProperty("BuyerName").Should().BeNull();
        canonicalEntity.FindProperty("SellerName").Should().BeNull();
    }

    [Fact]
    public async Task C35B_CanonicalSaleQualification_AllowsSamePacsSaleIdAcrossCounties()
    {
        await using var db = CreateDbContext(nameof(C35B_CanonicalSaleQualification_AllowsSamePacsSaleIdAcrossCounties));
        var workbookId = Guid.NewGuid();
        var chgOfOwnerId = 123456;

        db.CanonicalSaleQualifications.AddRange(
            CreateRow(Guid.NewGuid(), chgOfOwnerId, workbookId),
            CreateRow(Guid.NewGuid(), chgOfOwnerId, workbookId));

        await db.SaveChangesAsync();

        var rows = await db.CanonicalSaleQualifications
            .Where(r => r.ChgOfOwnerId == chgOfOwnerId)
            .ToListAsync();

        rows.Should().HaveCount(2);
        rows.Select(r => r.CountyId).Distinct().Should().HaveCount(2);
    }

    private static CanonicalSaleQualification CreateRow(Guid countyId, int chgOfOwnerId, Guid workbookId)
    {
        return new CanonicalSaleQualification
        {
            CountyId = countyId,
            ChgOfOwnerId = chgOfOwnerId,
            ComputedDecision = CanonicalSaleQualificationDecision.Qualified,
            WacCdSourceValue = "0",
            WacCdCanonicalValue = "qualified",
            WacCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SlRatioTypeCdSourceValue = "1",
            SlRatioTypeCdCanonicalValue = "qualified",
            SlRatioTypeCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SourceWorkbookId = workbookId,
            SourceWorkbookLockedAt = DateTime.UtcNow,
            SaleDate = DateTime.UtcNow.Date,
            SalePrice = 425000m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "c35b-schema-test",
            UpdatedBy = "c35b-schema-test",
        };
    }
}
