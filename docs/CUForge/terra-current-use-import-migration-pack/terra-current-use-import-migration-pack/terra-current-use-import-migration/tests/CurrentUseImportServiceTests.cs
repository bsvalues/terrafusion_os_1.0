using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Import;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseImportServiceTests
{
    [Fact]
    public async Task Valid_Classification_Inventory_Batch_Becomes_Ready()
    {
        var service = new CurrentUseImportService(
            new ICurrentUseImportValidator[]
            {
                new ClassificationInventoryImportValidator(),
                new RollbackWorksheetImportValidator()
            });

        var batch = await service.CreateBatchAsync(
            new CreateCurrentUseImportBatchDto(
                Guid.NewGuid(),
                CurrentUseImportType.ClassificationInventory,
                "inventory.csv",
                "unit.test"),
            CancellationToken.None);

        var validated = await service.ValidateRowsAsync(
            new ValidateCurrentUseImportRowsDto(
                batch.ImportBatchId,
                new[]
                {
                    new Dictionary<string, string?>
                    {
                        ["ParcelId"] = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                        ["ClassificationType"] = "FARM_AND_AGRICULTURAL",
                        ["LifecycleState"] = "ACTIVE_MONITORING",
                        ["ClassifiedAcres"] = "18.42",
                        ["OwnerName"] = "Sample Owner"
                    }
                },
                "unit.test"),
            CancellationToken.None);

        Assert.Equal(CurrentUseImportStatus.ReadyToImport, validated.Status);
        Assert.Equal(0, validated.ErrorRows);
    }

    [Fact]
    public async Task Missing_Required_Field_Fails_Validation()
    {
        var service = new CurrentUseImportService(
            new ICurrentUseImportValidator[]
            {
                new ClassificationInventoryImportValidator(),
                new RollbackWorksheetImportValidator()
            });

        var batch = await service.CreateBatchAsync(
            new CreateCurrentUseImportBatchDto(
                Guid.NewGuid(),
                CurrentUseImportType.ClassificationInventory,
                "inventory.csv",
                "unit.test"),
            CancellationToken.None);

        var validated = await service.ValidateRowsAsync(
            new ValidateCurrentUseImportRowsDto(
                batch.ImportBatchId,
                new[]
                {
                    new Dictionary<string, string?>
                    {
                        ["ParcelId"] = "",
                        ["ClassificationType"] = "FARM_AND_AGRICULTURAL"
                    }
                },
                "unit.test"),
            CancellationToken.None);

        Assert.Equal(CurrentUseImportStatus.ValidationFailed, validated.Status);
        Assert.True(validated.ErrorRows > 0);
    }
}
