using System.Globalization;

namespace TerraFusion.Core.Entities.Import;

/// <summary>
/// Immutable receipt for one county-scoped promotion of validated upload rows into TerraForge's
/// comparable-sales write lane. The newly promoted sale IDs preserve rollback-grade lineage
/// without copying row values into a second promotion document. A fully overlapping later batch
/// records an immutable zero-new-sales receipt so retries converge without inflating availability.
/// </summary>
public sealed class CountyCsvUploadPromotion
{
    private CountyCsvUploadPromotion()
    {
    }

    public CountyCsvUploadPromotion(
        Guid batchId,
        Guid countyId,
        string promotedByActorId,
        string contractId,
        int promotedRowCount,
        string comparableSaleIdsJson,
        string latestSaleDate,
        DateTimeOffset promotedAtUtc)
    {
        if (batchId == Guid.Empty) throw new ArgumentException("Batch ID is required.", nameof(batchId));
        if (countyId == Guid.Empty) throw new ArgumentException("County ID is required.", nameof(countyId));
        if (promotedRowCount < 0) throw new ArgumentOutOfRangeException(nameof(promotedRowCount));
        if (promotedAtUtc.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Promotion time must be UTC.", nameof(promotedAtUtc));
        }
        if (!DateOnly.TryParseExact(
                latestSaleDate,
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out _))
        {
            throw new ArgumentException("Latest sale date must be canonical ISO date.", nameof(latestSaleDate));
        }

        BatchId = batchId;
        CountyId = countyId;
        PromotedByActorId = Required(promotedByActorId, 200, nameof(promotedByActorId));
        ContractId = Required(contractId, 128, nameof(contractId));
        PromotedRowCount = promotedRowCount;
        ComparableSaleIdsJson = Required(comparableSaleIdsJson, nameof(comparableSaleIdsJson));
        LatestSaleDate = latestSaleDate;
        PromotedAtUtc = promotedAtUtc;
    }

    public Guid BatchId { get; private set; }
    public Guid CountyId { get; private set; }
    public string PromotedByActorId { get; private set; } = null!;
    public string ContractId { get; private set; } = null!;
    public int PromotedRowCount { get; private set; }
    public string ComparableSaleIdsJson { get; private set; } = null!;
    public string LatestSaleDate { get; private set; } = null!;
    public DateTimeOffset PromotedAtUtc { get; private set; }

    private static string Required(string? value, int maximum, string name)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maximum
            || value.Any(char.IsControl) || value != value.Trim())
        {
            throw new ArgumentException("A bounded canonical value is required.", name);
        }
        return value;
    }

    private static string Required(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("A JSON document is required.", name);
        }
        return value;
    }
}
