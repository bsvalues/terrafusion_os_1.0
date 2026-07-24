using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Adapters;

/// <summary>
/// Pure, unwired projection from an already-materialized county- and parcel-scoped evidence page
/// to the frozen dossier.evidence-registry-read@1.0.0 contract.
/// </summary>
public static class DossierEvidenceRegistryReadAdapter
{
    private const string SchemaVersion = "1.0.0";
    private static readonly HashSet<string> EvidenceTypes = new(StringComparer.Ordinal)
    {
        "field-inspection",
        "valuation-record",
        "legal-document",
        "tax-record",
        "correspondence",
        "photo",
    };
    private static readonly HashSet<string> IntegrityValues = new(StringComparer.Ordinal)
    {
        "pending",
        "verified",
        "disputed",
    };
    private static readonly JsonSerializerOptions ContractSerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new UtcDateTimeOffsetJsonConverter() },
    };

    public static DossierEvidenceRegistryReadResult Map(
        DossierEvidenceRegistryReadRequest request,
        int total,
        IReadOnlyList<DossierEvidence> sourcePage)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(sourcePage);

        if (!string.Equals(request.SchemaVersion, SchemaVersion, StringComparison.Ordinal))
        {
            throw new ArgumentException(
                $"SchemaVersion must be exactly {SchemaVersion}.",
                nameof(request));
        }

        var countyId = RequireCanonicalGuid(request.CountyId, nameof(request.CountyId));
        if (string.IsNullOrWhiteSpace(request.ParcelId))
        {
            throw new ArgumentException("ParcelId must be non-empty.", nameof(request));
        }

        if (request.Limit is < 1 or > 100)
        {
            throw new ArgumentOutOfRangeException(
                nameof(request),
                request.Limit,
                "Limit must be between 1 and 100.");
        }

        if (request.Offset < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(request),
                request.Offset,
                "Offset must be non-negative.");
        }

        if (request.TraceId is not null && string.IsNullOrWhiteSpace(request.TraceId))
        {
            throw new ArgumentException("TraceId must be non-empty when supplied.", nameof(request));
        }

        if (total < 0)
        {
            throw new InvalidOperationException("Total cannot be negative.");
        }

        if (sourcePage.Count > request.Limit)
        {
            throw new InvalidOperationException("Source page cannot contain more records than the request limit.");
        }

        if ((long)request.Offset + sourcePage.Count > total)
        {
            throw new InvalidOperationException("Source page cannot extend beyond the declared total.");
        }

        var records = new List<DossierEvidenceRegistryRecord>(sourcePage.Count);
        var evidenceIds = new HashSet<Guid>();
        foreach (var evidence in sourcePage)
        {
            if (evidence is null)
            {
                throw new InvalidOperationException("Evidence source cannot contain null records.");
            }

            records.Add(MapEvidence(evidence, countyId, request.ParcelId, evidenceIds));
        }

        records.Sort(static (left, right) =>
        {
            var timestamp = right.CreatedAt.CompareTo(left.CreatedAt);
            return timestamp != 0
                ? timestamp
                : StringComparer.Ordinal.Compare(left.EvidenceId, right.EvidenceId);
        });

        return new DossierEvidenceRegistryReadResult
        {
            SchemaVersion = SchemaVersion,
            CountyId = countyId.ToString("D"),
            ParcelId = request.ParcelId,
            Results = records,
            Total = total,
            HasMore = (long)request.Offset + records.Count < total,
            Limit = request.Limit,
            Offset = request.Offset,
            TraceId = request.TraceId,
        };
    }

    /// <summary>
    /// Serializes the frozen contract while omitting absent document and trace identities.
    /// </summary>
    public static string Serialize(
        DossierEvidenceRegistryReadRequest request,
        int total,
        IReadOnlyList<DossierEvidence> sourcePage) =>
        JsonSerializer.Serialize(Map(request, total, sourcePage), ContractSerializerOptions);

    private static DossierEvidenceRegistryRecord MapEvidence(
        DossierEvidence evidence,
        Guid countyId,
        string parcelId,
        ISet<Guid> evidenceIds)
    {
        if (evidence.CountyId != countyId)
        {
            throw new InvalidOperationException("Every evidence record must match the requested county identity.");
        }

        if (!string.Equals(evidence.ParcelId, parcelId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Every evidence record must match the requested parcel identity.");
        }

        if (evidence.Id == Guid.Empty)
        {
            throw new InvalidOperationException("Evidence identity cannot be empty.");
        }

        if (!evidenceIds.Add(evidence.Id))
        {
            throw new InvalidOperationException("Evidence identity must be unique within a page.");
        }

        if (evidence.DocumentId == Guid.Empty)
        {
            throw new InvalidOperationException("Document identity cannot be empty when supplied.");
        }

        RequireClosedValue(EvidenceTypes, evidence.EvidenceType, nameof(evidence.EvidenceType));
        RequireClosedValue(IntegrityValues, evidence.Integrity, nameof(evidence.Integrity));

        if (evidence.CreatedAt.Kind != DateTimeKind.Utc)
        {
            throw new InvalidOperationException("CreatedAt must be UTC.");
        }

        return new DossierEvidenceRegistryRecord
        {
            EvidenceId = evidence.Id.ToString("D"),
            EvidenceType = evidence.EvidenceType,
            Integrity = evidence.Integrity,
            CreatedAt = new DateTimeOffset(evidence.CreatedAt),
            DocumentId = evidence.DocumentId?.ToString("D"),
        };
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

    private static void RequireClosedValue(
        IReadOnlySet<string> vocabulary,
        string value,
        string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value) || !vocabulary.Contains(value))
        {
            throw new InvalidOperationException($"{fieldName} is not in the frozen contract vocabulary.");
        }
    }

    private sealed class UtcDateTimeOffsetJsonConverter : JsonConverter<DateTimeOffset>
    {
        public override DateTimeOffset Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options) =>
            throw new NotSupportedException("The Dossier contract serializer is write-only.");

        public override void Write(
            Utf8JsonWriter writer,
            DateTimeOffset value,
            JsonSerializerOptions options)
        {
            if (value.Offset != TimeSpan.Zero)
            {
                throw new JsonException("Dossier contract timestamps must be UTC.");
            }

            writer.WriteStringValue(value.UtcDateTime.ToString("O", CultureInfo.InvariantCulture));
        }
    }
}
