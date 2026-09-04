using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.PACS;
using TerraFusion.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync;

public sealed class PacsToTerraFusionSyncServiceIdentityTests
{
    [Fact]
    public async Task ComparableSalesPreserveMultiPropertyAndSameValueTransferIdentity()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase($"pacs-sale-identity-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder().Build();
        await using var db = new TerraFusionDbContext(options, configuration);
        db.Counties.Add(new County
        {
            Id = Guid.Parse("19190019-1919-1919-1919-191919191919"),
            Name = "Benton",
            State = "WA",
            FipsCode = "53005",
        });
        await db.SaveChangesAsync();

        var saleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc);
        var rows = new[]
        {
            Sale(5001, 1001, "BEN-1001", saleDate, 425_000m),
            Sale(5001, 1002, "BEN-1002", saleDate, 425_000m),
            Sale(5002, 1001, "BEN-1001", saleDate, 425_000m),
        };
        var adapter = new Mock<IPacsAdapter>(MockBehavior.Strict);
        adapter.Setup(value => value.ValidateContractAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsContractProof { IsValid = true });
        adapter.Setup(value => value.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsPagedResult<PacsComparableSale>
            {
                Page = 1,
                PageSize = 500,
                TotalCount = rows.Length,
                Items = rows,
            });
        var service = new PacsToTerraFusionSyncService(
            NullLogger<PacsToTerraFusionSyncService>.Instance,
            db,
            adapter.Object);
        var syncOptions = new SyncOptions
        {
            FullSync = true,
            BatchSize = 500,
            DataTypes = ["Sales"],
        };

        var first = await service.SyncCountyDataAsync("Benton", "WA", syncOptions);
        var second = await service.SyncCountyDataAsync("Benton", "WA", syncOptions);

        Assert.True(first.Success);
        Assert.True(second.Success);
        var persisted = await db.ComparableSales
            .AsNoTracking()
            .OrderBy(sale => sale.PacsChgOfOwnerId)
            .ThenBy(sale => sale.PacsPropId)
            .ToListAsync();
        Assert.Equal(3, persisted.Count);
        var expectedIdentity = new (int ChangeOfOwnerId, int PropId, string ParcelId)[]
        {
            (5001, 1001, "BEN-1001"),
            (5001, 1002, "BEN-1002"),
            (5002, 1001, "BEN-1001"),
        };
        Assert.Equal(
            expectedIdentity,
            persisted.Select(sale => (
                sale.PacsChgOfOwnerId!.Value,
                sale.PacsPropId!.Value,
                sale.ParcelId)).ToArray());
        Assert.All(persisted, sale => Assert.Equal("multifamily", sale.PropertyType));
    }

    private static PacsComparableSale Sale(
        int changeOfOwnerId,
        int propId,
        string geoId,
        DateTime saleDate,
        decimal salePrice) => new()
        {
            PacsChgOfOwnerId = changeOfOwnerId,
            PropId = propId,
            GeoId = geoId,
            SaleDate = saleDate,
            SalePrice = salePrice,
            PropTypeCd = "A1",
        };
}
