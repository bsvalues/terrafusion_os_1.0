namespace TerraFusion.Core.Entities.Import;

/// <summary>
/// One immutable county-scoped validation/staging document for an admitted upload batch. Only
/// normalized launch fields are retained; unrecognized source columns are intentionally discarded.
/// </summary>
public sealed class CountyCsvUploadRowStage
{
    private CountyCsvUploadRowStage()
    {
    }

    public CountyCsvUploadRowStage(
        Guid batchId,
        Guid countyId,
        string contentSha256,
        string dataset,
        string contractId,
        string schemaVersion,
        int totalRowCount,
        int stagedRowCount,
        int quarantinedRowCount,
        string stagedRowsJson,
        string quarantinedRowsJson,
        string reasonCountsJson,
        DateTimeOffset validatedAtUtc)
    {
        if (batchId == Guid.Empty) throw new ArgumentException("Batch ID is required.", nameof(batchId));
        if (countyId == Guid.Empty) throw new ArgumentException("County ID is required.", nameof(countyId));
        if (totalRowCount < 0 || stagedRowCount < 0 || quarantinedRowCount < 0
            || stagedRowCount + quarantinedRowCount != totalRowCount)
        {
            throw new ArgumentOutOfRangeException(nameof(totalRowCount));
        }
        if (validatedAtUtc.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Validation time must be UTC.", nameof(validatedAtUtc));
        }

        BatchId = batchId;
        CountyId = countyId;
        ContentSha256 = LowercaseSha256(contentSha256, nameof(contentSha256));
        Dataset = Required(dataset, 16, nameof(dataset));
        ContractId = Required(contractId, 128, nameof(contractId));
        SchemaVersion = Required(schemaVersion, 64, nameof(schemaVersion));
        TotalRowCount = totalRowCount;
        StagedRowCount = stagedRowCount;
        QuarantinedRowCount = quarantinedRowCount;
        StagedRowsJson = RequiredJson(stagedRowsJson, nameof(stagedRowsJson));
        QuarantinedRowsJson = RequiredJson(quarantinedRowsJson, nameof(quarantinedRowsJson));
        ReasonCountsJson = RequiredJson(reasonCountsJson, nameof(reasonCountsJson));
        ValidatedAtUtc = validatedAtUtc;
    }

    public Guid BatchId { get; private set; }
    public Guid CountyId { get; private set; }
    public string ContentSha256 { get; private set; } = null!;
    public string Dataset { get; private set; } = null!;
    public string ContractId { get; private set; } = null!;
    public string SchemaVersion { get; private set; } = null!;
    public int TotalRowCount { get; private set; }
    public int StagedRowCount { get; private set; }
    public int QuarantinedRowCount { get; private set; }
    public string StagedRowsJson { get; private set; } = null!;
    public string QuarantinedRowsJson { get; private set; } = null!;
    public string ReasonCountsJson { get; private set; } = null!;
    public DateTimeOffset ValidatedAtUtc { get; private set; }

    private static string Required(string? value, int maximum, string name)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maximum
            || value.Any(char.IsControl) || value != value.Trim())
        {
            throw new ArgumentException("A bounded canonical value is required.", name);
        }
        return value;
    }

    private static string RequiredJson(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("A JSON document is required.", name);
        }
        return value;
    }

    private static string LowercaseSha256(string? value, string name)
    {
        if (value is not { Length: 64 }
            || value.Any(character =>
                character is not (>= '0' and <= '9' or >= 'a' and <= 'f')))
        {
            throw new ArgumentException("A lowercase SHA-256 digest is required.", name);
        }
        return value;
    }
}
