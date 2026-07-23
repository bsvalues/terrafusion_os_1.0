using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Adapters;

/// <summary>
/// Pure, unwired projection from county-scoped appeal records to the frozen
/// dais.appeal-workflow@1.0.0 contract.
/// </summary>
public static class DaisAppealWorkflowReadAdapter
{
    private const string SchemaVersion = "1.0.0";
    private const int MinimumTaxYear = 1900;
    private const int MaximumTaxYear = 2200;
    private static readonly JsonSerializerOptions ContractSerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new UtcDateTimeOffsetJsonConverter() },
    };

    public static DaisAppealWorkflowReadResult Map(
        DaisAppealWorkflowReadRequest request,
        IReadOnlyList<Appeal> source)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(source);

        if (!string.Equals(request.SchemaVersion, SchemaVersion, StringComparison.Ordinal))
        {
            throw new ArgumentException(
                $"SchemaVersion must be exactly {SchemaVersion}.",
                nameof(request));
        }

        var countyId = RequireCanonicalGuid(request.CountyId, nameof(request.CountyId));
        if (request.TraceId is not null && string.IsNullOrWhiteSpace(request.TraceId))
        {
            throw new ArgumentException("TraceId must be non-empty when supplied.", nameof(request));
        }

        var selector = ValidateSelector(request.Selector);
        var appeals = new List<DaisAppealWorkflowRecord>(source.Count);
        foreach (var appeal in source)
        {
            if (appeal is null)
            {
                throw new InvalidOperationException("Appeal source cannot contain null records.");
            }

            appeals.Add(MapAppeal(appeal, countyId, selector));
        }

        return new DaisAppealWorkflowReadResult
        {
            SchemaVersion = SchemaVersion,
            CountyId = countyId.ToString("D"),
            Appeals = appeals,
            TraceId = request.TraceId,
        };
    }

    /// <summary>
    /// Serializes the frozen contract while omitting absent optional timestamps and trace identity.
    /// </summary>
    public static string Serialize(
        DaisAppealWorkflowReadRequest request,
        IReadOnlyList<Appeal> source) =>
        JsonSerializer.Serialize(Map(request, source), ContractSerializerOptions);

    private static DaisAppealWorkflowRecord MapAppeal(
        Appeal appeal,
        Guid countyId,
        ValidatedSelector selector)
    {
        if (appeal.CountyId != countyId)
        {
            throw new InvalidOperationException("Every appeal must match the requested county identity.");
        }

        if (appeal.Id == Guid.Empty)
        {
            throw new InvalidOperationException("Appeal identity cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(appeal.ParcelId))
        {
            throw new InvalidOperationException("ParcelId cannot be empty.");
        }

        ValidateTaxYear(appeal.TaxYear, nameof(appeal.TaxYear), sourceValue: true);

        var appealId = appeal.Id.ToString("D");
        if ((selector.AppealId is not null
                && !string.Equals(selector.AppealId, appealId, StringComparison.Ordinal))
            || (selector.ParcelId is not null
                && !string.Equals(selector.ParcelId, appeal.ParcelId, StringComparison.Ordinal))
            || (selector.TaxYear is not null && selector.TaxYear.Value != appeal.TaxYear))
        {
            throw new InvalidOperationException("Every appeal must match the exact request selector.");
        }

        var filedAt = RequireUtc(appeal.FiledDate, nameof(appeal.FiledDate));
        var hearingAt = RequireOptionalUtc(appeal.HearingDate, nameof(appeal.HearingDate));
        var decisionAt = RequireOptionalUtc(appeal.DecisionDate, nameof(appeal.DecisionDate));
        if (hearingAt is not null && hearingAt.Value < filedAt)
        {
            throw new InvalidOperationException("HearingDate cannot precede FiledDate.");
        }

        if (decisionAt is not null && decisionAt.Value < filedAt)
        {
            throw new InvalidOperationException("DecisionDate cannot precede FiledDate.");
        }

        return new DaisAppealWorkflowRecord
        {
            AppealId = appealId,
            ParcelId = appeal.ParcelId,
            TaxYear = appeal.TaxYear,
            Ground = ParseClosedEnum<DaisAppealGround>(appeal.AppealGround, nameof(appeal.AppealGround)),
            Status = ParseClosedEnum<DaisAppealStatus>(appeal.Status, nameof(appeal.Status)),
            FiledAt = filedAt,
            HearingAt = hearingAt,
            DecisionAt = decisionAt,
        };
    }

    private static ValidatedSelector ValidateSelector(DaisAppealSelector selector)
    {
        ArgumentNullException.ThrowIfNull(selector);

        var selectedCount = (selector.AppealId is null ? 0 : 1)
            + (selector.ParcelId is null ? 0 : 1)
            + (selector.TaxYear.HasValue ? 1 : 0);
        if (selectedCount != 1)
        {
            throw new ArgumentException(
                "Selector must contain exactly one of AppealId, ParcelId, or TaxYear.",
                nameof(selector));
        }

        string? appealId = null;
        if (selector.AppealId is not null)
        {
            appealId = RequireCanonicalGuid(selector.AppealId, nameof(selector.AppealId)).ToString("D");
        }

        string? parcelId = null;
        if (selector.ParcelId is not null)
        {
            if (string.IsNullOrWhiteSpace(selector.ParcelId))
            {
                throw new ArgumentException("ParcelId must be non-empty.", nameof(selector));
            }

            parcelId = selector.ParcelId;
        }

        if (selector.TaxYear is not null)
        {
            ValidateTaxYear(selector.TaxYear.Value, nameof(selector.TaxYear), sourceValue: false);
        }

        return new ValidatedSelector(appealId, parcelId, selector.TaxYear);
    }

    private static Guid RequireCanonicalGuid(string value, string parameterName)
    {
        if (!Guid.TryParseExact(value, "D", out var parsed)
            || !string.Equals(value, parsed.ToString("D"), StringComparison.Ordinal))
        {
            throw new ArgumentException(
                $"{parameterName} must be an exact canonical D-format GUID.",
                parameterName);
        }

        return parsed;
    }

    private static void ValidateTaxYear(int value, string fieldName, bool sourceValue)
    {
        if (value < MinimumTaxYear || value > MaximumTaxYear)
        {
            var message = $"{fieldName} must be between {MinimumTaxYear} and {MaximumTaxYear}.";
            if (sourceValue)
            {
                throw new InvalidOperationException(message);
            }

            throw new ArgumentOutOfRangeException(fieldName, value, message);
        }
    }

    private static DateTimeOffset RequireUtc(DateTime value, string fieldName)
    {
        if (value.Kind != DateTimeKind.Utc)
        {
            throw new InvalidOperationException($"{fieldName} must be UTC.");
        }

        return new DateTimeOffset(value);
    }

    private static DateTimeOffset? RequireOptionalUtc(DateTime? value, string fieldName) =>
        value is null ? null : RequireUtc(value.Value, fieldName);

    private static TEnum ParseClosedEnum<TEnum>(string value, string fieldName)
        where TEnum : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value)
            || !Enum.TryParse<TEnum>(value, ignoreCase: false, out var parsed)
            || !string.Equals(Enum.GetName(parsed), value, StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"{fieldName} is not in the frozen contract vocabulary.");
        }

        return parsed;
    }

    private sealed record ValidatedSelector(string? AppealId, string? ParcelId, int? TaxYear);

    private sealed class UtcDateTimeOffsetJsonConverter : JsonConverter<DateTimeOffset>
    {
        public override DateTimeOffset Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options) =>
            throw new NotSupportedException("The Dais contract serializer is write-only.");

        public override void Write(
            Utf8JsonWriter writer,
            DateTimeOffset value,
            JsonSerializerOptions options)
        {
            if (value.Offset != TimeSpan.Zero)
            {
                throw new JsonException("Dais contract timestamps must be UTC.");
            }

            writer.WriteStringValue(value.UtcDateTime.ToString("O", CultureInfo.InvariantCulture));
        }
    }
}
