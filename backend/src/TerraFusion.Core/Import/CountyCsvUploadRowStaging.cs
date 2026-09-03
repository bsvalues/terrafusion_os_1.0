using System.Globalization;
using TerraFusion.Core.Counties;

namespace TerraFusion.Core.Import;

public sealed record CountyCsvStagedRow(
    int SourceRowNumber,
    string ParcelId,
    string? SitusAddress,
    decimal? AssessedValue,
    string? SaleDate,
    decimal? SalePrice);

public sealed record CountyCsvQuarantinedRow(
    int SourceRowNumber,
    string ReasonCode,
    string Detail);

public sealed record CountyCsvQuarantineReasonCount(string ReasonCode, int Count);

public sealed record CountyCsvUploadRowValidationResult(
    string ContractId,
    string SchemaVersion,
    CountyCsvDataset Dataset,
    int TotalRowCount,
    IReadOnlyList<CountyCsvStagedRow> StagedRows,
    IReadOnlyList<CountyCsvQuarantinedRow> QuarantinedRows)
{
    public int StagedRowCount => StagedRows.Count;

    public int QuarantinedRowCount => QuarantinedRows.Count;

    public IReadOnlyList<CountyCsvQuarantineReasonCount> ReasonCounts =>
        QuarantinedRows
            .GroupBy(row => row.ReasonCode, StringComparer.Ordinal)
            .OrderBy(group => group.Key, StringComparer.Ordinal)
            .Select(group => new CountyCsvQuarantineReasonCount(group.Key, group.Count()))
            .ToArray();
}

public sealed class CountyCsvUploadRowSchemaException(
    string reasonCode,
    string message) : FormatException(message)
{
    public string ReasonCode { get; } = reasonCode;
}

/// <summary>
/// Pure validator for the bounded launch CSV templates. It persists only the canonical fields
/// required for later promotion; unknown source columns are deliberately discarded rather than
/// copied into TerraFusion staging.
/// </summary>
public static class CountyCsvUploadRowValidator
{
    public const string ContractId = "wal.county-upload.row-validation.v1";
    public const string SchemaVersion = "wa-county-csv-v1";

    private const decimal MaximumMoney = 999_999_999_999_999m;

    private static readonly IReadOnlyDictionary<string, string> HeaderAliases =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["parcelid"] = "parcel_id",
            ["parcelnumber"] = "parcel_id",
            ["accountid"] = "parcel_id",
            ["situsaddress"] = "situs_address",
            ["propertyaddress"] = "situs_address",
            ["address"] = "situs_address",
            ["assessedvalue"] = "assessed_value",
            ["totalassessedvalue"] = "assessed_value",
            ["marketvalue"] = "assessed_value",
            ["saledate"] = "sale_date",
            ["transferdate"] = "sale_date",
            ["recordingdate"] = "sale_date",
            ["saleprice"] = "sale_price",
            ["saleamount"] = "sale_price",
            ["consideration"] = "sale_price",
        };

    public static CountyCsvUploadRowValidationResult Validate(
        CountyCsvDataset dataset,
        CountyCsvDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);
        if (dataset is not CountyCsvDataset.Parcels and not CountyCsvDataset.Sales)
        {
            throw new ArgumentOutOfRangeException(nameof(dataset));
        }

        var headers = BuildHeaderMap(document.Headers, out var ambiguousHeaders);
        var requiredHeaders = dataset == CountyCsvDataset.Sales
            ? new[] { "parcel_id", "sale_date", "sale_price" }
            : new[] { "parcel_id", "situs_address", "assessed_value" };
        var missingHeaders = requiredHeaders.Where(header => !headers.ContainsKey(header)).ToArray();

        if (ambiguousHeaders.Count > 0 || missingHeaders.Length > 0)
        {
            var reason = ambiguousHeaders.Count > 0
                ? "AMBIGUOUS_HEADER"
                : "MISSING_REQUIRED_HEADER";
            var detail = ambiguousHeaders.Count > 0
                ? $"Multiple source headers map to: {string.Join(", ", ambiguousHeaders)}."
                : $"Required headers are missing: {string.Join(", ", missingHeaders)}.";
            if (document.Rows.Count == 0)
            {
                throw new CountyCsvUploadRowSchemaException(reason, detail);
            }
            var quarantined = document.Rows
                .Select((_, index) => new CountyCsvQuarantinedRow(index + 2, reason, detail))
                .ToArray();
            return Result(dataset, document.Rows.Count, [], quarantined);
        }

        var staged = new List<CountyCsvStagedRow>(document.Rows.Count);
        var quarantinedRows = new List<CountyCsvQuarantinedRow>();
        var parcelKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var saleKeys = new HashSet<(string ParcelId, DateOnly SaleDate, decimal SalePrice)>();

        for (var index = 0; index < document.Rows.Count; index++)
        {
            var sourceRowNumber = index + 2;
            var row = document.Rows[index];
            var parcelId = Cell(row, headers["parcel_id"]);
            if (!TryBoundedText(parcelId, 50, out parcelId))
            {
                quarantinedRows.Add(new(sourceRowNumber, "INVALID_PARCEL_ID",
                    "parcel_id must be non-empty, trimmed, control-free, and at most 50 characters."));
                continue;
            }

            if (dataset == CountyCsvDataset.Parcels)
            {
                var address = Cell(row, headers["situs_address"]);
                if (!TryBoundedText(address, 500, out address))
                {
                    quarantinedRows.Add(new(sourceRowNumber, "INVALID_SITUS_ADDRESS",
                        "situs_address must be non-empty, trimmed, control-free, and at most 500 characters."));
                    continue;
                }

                if (!TryMoney(Cell(row, headers["assessed_value"]), allowZero: true, out var assessed))
                {
                    quarantinedRows.Add(new(sourceRowNumber, "INVALID_ASSESSED_VALUE",
                        "assessed_value must be an invariant decimal from 0 through 999999999999999."));
                    continue;
                }

                if (!parcelKeys.Add(parcelId))
                {
                    quarantinedRows.Add(new(sourceRowNumber, "DUPLICATE_PARCEL_ID",
                        "parcel_id already appears in this upload batch."));
                    continue;
                }

                staged.Add(new(sourceRowNumber, parcelId, address, assessed, null, null));
                continue;
            }

            var saleDateText = Cell(row, headers["sale_date"]);
            if (!DateOnly.TryParseExact(
                    saleDateText,
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var saleDate))
            {
                quarantinedRows.Add(new(sourceRowNumber, "INVALID_SALE_DATE",
                    "sale_date must use the ISO yyyy-MM-dd format."));
                continue;
            }

            if (!TryMoney(Cell(row, headers["sale_price"]), allowZero: false, out var salePrice))
            {
                quarantinedRows.Add(new(sourceRowNumber, "INVALID_SALE_PRICE",
                    "sale_price must be an invariant decimal greater than 0 and at most 999999999999999."));
                continue;
            }

            decimal? assessedValue = null;
            if (headers.TryGetValue("assessed_value", out var assessedIndex)
                && Cell(row, assessedIndex).Length > 0)
            {
                if (!TryMoney(Cell(row, assessedIndex), allowZero: true, out var parsedAssessed))
                {
                    quarantinedRows.Add(new(sourceRowNumber, "INVALID_ASSESSED_VALUE",
                        "assessed_value must be blank or an invariant decimal from 0 through 999999999999999."));
                    continue;
                }
                assessedValue = parsedAssessed;
            }

            var saleKey = (parcelId.ToUpperInvariant(), saleDate, salePrice);
            if (!saleKeys.Add(saleKey))
            {
                quarantinedRows.Add(new(sourceRowNumber, "DUPLICATE_SALE",
                    "The same parcel_id, sale_date, and sale_price already appear in this batch."));
                continue;
            }

            staged.Add(new(
                sourceRowNumber,
                parcelId,
                null,
                assessedValue,
                saleDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                salePrice));
        }

        return Result(dataset, document.Rows.Count, staged, quarantinedRows);
    }

    private static Dictionary<string, int> BuildHeaderMap(
        IReadOnlyList<string> headers,
        out IReadOnlyList<string> ambiguousHeaders)
    {
        var map = new Dictionary<string, int>(StringComparer.Ordinal);
        var ambiguous = new SortedSet<string>(StringComparer.Ordinal);
        for (var index = 0; index < headers.Count; index++)
        {
            var token = new string(headers[index]
                .Trim()
                .Where(char.IsLetterOrDigit)
                .Select(char.ToLowerInvariant)
                .ToArray());
            if (!HeaderAliases.TryGetValue(token, out var canonical))
            {
                continue;
            }
            if (!map.TryAdd(canonical, index))
            {
                ambiguous.Add(canonical);
            }
        }
        ambiguousHeaders = ambiguous.ToArray();
        return map;
    }

    private static string Cell(IReadOnlyList<string> row, int index) => row[index];

    private static bool TryBoundedText(string? value, int maximum, out string normalized)
    {
        normalized = value?.Trim() ?? string.Empty;
        return normalized.Length > 0
            && normalized.Length <= maximum
            && !normalized.Any(char.IsControl);
    }

    private static bool TryMoney(string? value, bool allowZero, out decimal parsed)
    {
        parsed = 0;
        var text = value?.Trim();
        return !string.IsNullOrEmpty(text)
            && decimal.TryParse(
                text,
                NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                CultureInfo.InvariantCulture,
                out parsed)
            && parsed <= MaximumMoney
            && (allowZero ? parsed >= 0 : parsed > 0);
    }

    private static CountyCsvUploadRowValidationResult Result(
        CountyCsvDataset dataset,
        int totalRows,
        IReadOnlyList<CountyCsvStagedRow> staged,
        IReadOnlyList<CountyCsvQuarantinedRow> quarantined) =>
        new(ContractId, SchemaVersion, dataset, totalRows, staged, quarantined);
}

public sealed record CountyCsvUploadRowStagingRequest(
    AuthenticatedCanonicalCountyContextResult? CountyContext,
    TerraFusion.Core.Entities.Import.CountyCsvUploadBatch? Batch,
    ReadOnlyMemory<byte> AdmittedContent);

public sealed record CountyCsvUploadRowStagingSummary(
    Guid BatchId,
    Guid CountyId,
    string ContractId,
    string SchemaVersion,
    int TotalRowCount,
    int StagedRowCount,
    int QuarantinedRowCount,
    IReadOnlyList<CountyCsvQuarantineReasonCount> ReasonCounts,
    DateTimeOffset ValidatedAtUtc);
