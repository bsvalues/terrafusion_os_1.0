using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace TerraFusion.Core.Entities.Forge;

/// <summary>Exact identity and semantic-content pins for one cost/depreciation schedule pair.</summary>
public sealed record ForgeCostSchedulePin(
    Guid CountyId,
    int EffectiveYear,
    Guid CostFactorSetId,
    string CostFactorSetVersion,
    string CostFactorSetContentSha256,
    Guid DepreciationScheduleId,
    string DepreciationScheduleVersion,
    string DepreciationScheduleContentSha256);

/// <summary>Pure decimal output from one exact, caller-supplied schedule snapshot.</summary>
public readonly record struct ForgeCostScheduleProjectionResult(
    decimal BaseRate,
    decimal DepreciationRate);

/// <summary>
/// Validates exact schedule pins and resolves the unique narrowest matching cost and depreciation
/// bands. This foundation is pure and unwired: it performs no lookup, persistence, conversion,
/// provider, or runtime work.
/// </summary>
public static class ForgeCostScheduleProjection
{
    private const string CostSchema = "forge-cost-factor-set/v1";
    private const string DepreciationSchema = "forge-depreciation-schedule/v1";

    public static ForgeCostScheduleProjectionResult Create(
        CostFactorSet costFactorSet,
        DepreciationSchedule depreciationSchedule,
        ForgeCostSchedulePin pin,
        string improvementClassCode,
        int sizeSqFt,
        int effectiveAgeYears)
    {
        ArgumentNullException.ThrowIfNull(costFactorSet);
        ArgumentNullException.ThrowIfNull(depreciationSchedule);
        ArgumentNullException.ThrowIfNull(pin);

        ValidateRequest(pin, improvementClassCode, sizeSqFt, effectiveAgeYears);
        ValidateScheduleMetadata(costFactorSet);
        ValidateScheduleMetadata(depreciationSchedule);
        ValidatePinnedIdentity(costFactorSet, depreciationSchedule, pin);
        ValidateCostFactorRows(costFactorSet);
        ValidateDepreciationRows(depreciationSchedule);
        ValidatePinnedHashes(costFactorSet, depreciationSchedule, pin);

        var cost = SelectUniqueCostFactor(costFactorSet.Factors, improvementClassCode, sizeSqFt);
        var depreciation = SelectUniqueDepreciationFactor(
            depreciationSchedule.Factors,
            effectiveAgeYears);

        return new ForgeCostScheduleProjectionResult(
            cost.UnitCostPerSqFt,
            depreciation.DepreciationFraction);
    }

    public static string ComputeCostFactorSetContentSha256(CostFactorSet costFactorSet)
    {
        ArgumentNullException.ThrowIfNull(costFactorSet);
        ValidateCostFactorSet(costFactorSet);
        return ComputeSha256(WriteCostFactorSet(costFactorSet));
    }

    public static string ComputeDepreciationScheduleContentSha256(
        DepreciationSchedule depreciationSchedule)
    {
        ArgumentNullException.ThrowIfNull(depreciationSchedule);
        ValidateDepreciationSchedule(depreciationSchedule);
        return ComputeSha256(WriteDepreciationSchedule(depreciationSchedule));
    }

    private static void ValidateRequest(
        ForgeCostSchedulePin pin,
        string improvementClassCode,
        int sizeSqFt,
        int effectiveAgeYears)
    {
        if (pin.CountyId == Guid.Empty || pin.EffectiveYear <= 0
            || pin.CostFactorSetId == Guid.Empty || pin.DepreciationScheduleId == Guid.Empty)
        {
            throw new InvalidOperationException("Schedule pin identity is incomplete.");
        }

        if (pin.CostFactorSetId == pin.DepreciationScheduleId)
            throw new InvalidOperationException("Cost and depreciation schedule identities must differ.");

        RequireMetadata(pin.CostFactorSetVersion, nameof(pin.CostFactorSetVersion));
        RequireMetadata(pin.DepreciationScheduleVersion, nameof(pin.DepreciationScheduleVersion));
        RequireSha256(pin.CostFactorSetContentSha256, nameof(pin.CostFactorSetContentSha256));
        RequireSha256(
            pin.DepreciationScheduleContentSha256,
            nameof(pin.DepreciationScheduleContentSha256));
        RequireCanonicalText(improvementClassCode, nameof(improvementClassCode));

        if (sizeSqFt <= 0)
            throw new InvalidOperationException("Improvement size must be positive.");
        if (effectiveAgeYears < 0)
            throw new InvalidOperationException("Effective age cannot be negative.");
    }

    private static void ValidatePinnedIdentity(
        CostFactorSet costs,
        DepreciationSchedule depreciation,
        ForgeCostSchedulePin pin)
    {
        if (costs.CountyId != pin.CountyId || depreciation.CountyId != pin.CountyId)
            throw new InvalidOperationException("Schedule county identity does not match the pin.");
        if (costs.EffectiveYear != pin.EffectiveYear
            || depreciation.EffectiveYear != pin.EffectiveYear)
        {
            throw new InvalidOperationException("Schedule effective year does not match the pin.");
        }
        if (costs.Id != pin.CostFactorSetId
            || depreciation.Id != pin.DepreciationScheduleId)
        {
            throw new InvalidOperationException("Schedule ID does not match the pin.");
        }
        if (!string.Equals(costs.Version, pin.CostFactorSetVersion, StringComparison.Ordinal)
            || !string.Equals(
                depreciation.Version,
                pin.DepreciationScheduleVersion,
                StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Schedule version does not match the opaque exact pin.");
        }

    }

    private static void ValidatePinnedHashes(
        CostFactorSet costs,
        DepreciationSchedule depreciation,
        ForgeCostSchedulePin pin)
    {
        var costHash = ComputeSha256(WriteCostFactorSet(costs));
        var depreciationHash = ComputeSha256(WriteDepreciationSchedule(depreciation));
        if (!string.Equals(costHash, pin.CostFactorSetContentSha256, StringComparison.Ordinal)
            || !string.Equals(
                depreciationHash,
                pin.DepreciationScheduleContentSha256,
                StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Schedule semantic content hash does not match the pin.");
        }
    }

    private static void ValidateCostFactorSet(CostFactorSet set)
    {
        ValidateScheduleMetadata(set);
        ValidateCostFactorRows(set);
    }

    private static void ValidateScheduleMetadata(CostFactorSet set)
        => ValidateScheduleMetadata(
            set.Id,
            set.CountyId,
            set.EffectiveYear,
            set.Version,
            set.Origin,
            set.ProvenanceAuthor,
            set.RevalCycle,
            nameof(CostFactorSet));

    private static void ValidateCostFactorRows(CostFactorSet set)
    {
        if (set.Factors is null || set.Factors.Count == 0)
            throw new InvalidOperationException("Cost factor set must contain factors.");

        var rowIds = new HashSet<Guid>();
        foreach (var factor in set.Factors)
        {
            if (factor is null || factor.Id == Guid.Empty || !rowIds.Add(factor.Id))
                throw new InvalidOperationException("Cost factor row identity is missing or duplicated.");
            if (factor.CostFactorSetId != set.Id)
                throw new InvalidOperationException("Cost factor row references a different schedule.");
            RequireCanonicalText(
                factor.ImprovementClassCode,
                nameof(factor.ImprovementClassCode));
            ValidateBounds(factor.SizeBandMinSqFt, factor.SizeBandMaxSqFt, "cost factor");
            if (factor.UnitCostPerSqFt <= 0m)
                throw new InvalidOperationException("Cost factor unit cost must be positive.");
        }
    }

    private static void ValidateDepreciationSchedule(DepreciationSchedule schedule)
    {
        ValidateScheduleMetadata(schedule);
        ValidateDepreciationRows(schedule);
    }

    private static void ValidateScheduleMetadata(DepreciationSchedule schedule)
        => ValidateScheduleMetadata(
            schedule.Id,
            schedule.CountyId,
            schedule.EffectiveYear,
            schedule.Version,
            schedule.Origin,
            schedule.ProvenanceAuthor,
            schedule.RevalCycle,
            nameof(DepreciationSchedule));

    private static void ValidateDepreciationRows(DepreciationSchedule schedule)
    {
        if (schedule.Factors is null || schedule.Factors.Count == 0)
            throw new InvalidOperationException("Depreciation schedule must contain factors.");

        var rowIds = new HashSet<Guid>();
        foreach (var factor in schedule.Factors)
        {
            if (factor is null || factor.Id == Guid.Empty || !rowIds.Add(factor.Id))
                throw new InvalidOperationException("Depreciation row identity is missing or duplicated.");
            if (factor.DepreciationScheduleId != schedule.Id)
                throw new InvalidOperationException("Depreciation row references a different schedule.");
            ValidateBounds(factor.AgeMinYears, factor.AgeMaxYears, "depreciation factor");
            if (factor.AgeMinYears < 0 || factor.DepreciationFraction is < 0m or > 1m)
                throw new InvalidOperationException("Depreciation factor values are outside allowed bounds.");
        }
    }

    private static void ValidateScheduleMetadata(
        Guid id,
        Guid countyId,
        int effectiveYear,
        string version,
        ReferenceDataOrigin origin,
        string author,
        string? revalCycle,
        string scheduleName)
    {
        if (id == Guid.Empty || countyId == Guid.Empty || effectiveYear <= 0)
            throw new InvalidOperationException($"{scheduleName} identity is incomplete.");
        if (!Enum.IsDefined(origin))
            throw new InvalidOperationException($"{scheduleName} origin is unknown.");

        RequireMetadata(version, $"{scheduleName}.Version");
        RequireMetadata(author, $"{scheduleName}.ProvenanceAuthor");
        if (revalCycle is not null)
            RequireMetadata(revalCycle, $"{scheduleName}.RevalCycle");
    }

    private static CostFactor SelectUniqueCostFactor(
        IEnumerable<CostFactor> factors,
        string improvementClassCode,
        int sizeSqFt)
    {
        var matches = factors
            .Where(f => string.Equals(
                f.ImprovementClassCode,
                improvementClassCode,
                StringComparison.OrdinalIgnoreCase))
            .Where(f => (f.SizeBandMinSqFt is null || sizeSqFt >= f.SizeBandMinSqFt)
                && (f.SizeBandMaxSqFt is null || sizeSqFt <= f.SizeBandMaxSqFt))
            .Select(f => (Factor: f, Width: BandWidth(f.SizeBandMinSqFt, f.SizeBandMaxSqFt)))
            .OrderBy(candidate => candidate.Width)
            .ToList();

        if (matches.Count == 0)
            throw new InvalidOperationException("No cost factor matches the exact class and size.");
        if (matches.Count > 1 && matches[0].Width == matches[1].Width)
            throw new InvalidOperationException("Cost factor resolution is equal-specificity ambiguous.");
        return matches[0].Factor;
    }

    private static DepreciationFactor SelectUniqueDepreciationFactor(
        IEnumerable<DepreciationFactor> factors,
        int effectiveAgeYears)
    {
        var matches = factors
            .Where(f => effectiveAgeYears >= f.AgeMinYears && effectiveAgeYears <= f.AgeMaxYears)
            .Select(f => (Factor: f, Width: (long)f.AgeMaxYears - f.AgeMinYears))
            .OrderBy(candidate => candidate.Width)
            .ToList();

        if (matches.Count == 0)
            throw new InvalidOperationException("No depreciation factor matches the effective age.");
        if (matches.Count > 1 && matches[0].Width == matches[1].Width)
            throw new InvalidOperationException("Depreciation resolution is equal-specificity ambiguous.");
        return matches[0].Factor;
    }

    private static byte[] WriteCostFactorSet(CostFactorSet set)
    {
        using var stream = new MemoryStream();
        using (var writer = CreateWriter(stream))
        {
            writer.WriteStartObject();
            writer.WriteString("schema", CostSchema);
            WriteScheduleIdentity(
                writer,
                set.Id,
                set.CountyId,
                set.EffectiveYear,
                set.Version,
                set.Origin,
                set.ProvenanceAuthor,
                set.RevalCycle);
            writer.WriteStartArray("factors");
            foreach (var factor in set.Factors.OrderBy(f => f, CostFactorCanonicalComparer.Instance))
            {
                writer.WriteStartObject();
                writer.WriteString("id", FormatGuid(factor.Id));
                writer.WriteString("class", Normalize(factor.ImprovementClassCode));
                WriteNullableNumber(writer, "minSqFt", factor.SizeBandMinSqFt);
                WriteNullableNumber(writer, "maxSqFt", factor.SizeBandMaxSqFt);
                writer.WriteString("unitCost", FormatDecimal(factor.UnitCostPerSqFt));
                writer.WriteEndObject();
            }
            writer.WriteEndArray();
            writer.WriteEndObject();
        }
        return stream.ToArray();
    }

    private static byte[] WriteDepreciationSchedule(DepreciationSchedule schedule)
    {
        using var stream = new MemoryStream();
        using (var writer = CreateWriter(stream))
        {
            writer.WriteStartObject();
            writer.WriteString("schema", DepreciationSchema);
            WriteScheduleIdentity(
                writer,
                schedule.Id,
                schedule.CountyId,
                schedule.EffectiveYear,
                schedule.Version,
                schedule.Origin,
                schedule.ProvenanceAuthor,
                schedule.RevalCycle);
            writer.WriteStartArray("factors");
            foreach (var factor in schedule.Factors.OrderBy(
                f => f,
                DepreciationFactorCanonicalComparer.Instance))
            {
                writer.WriteStartObject();
                writer.WriteString("id", FormatGuid(factor.Id));
                writer.WriteNumber("minAge", factor.AgeMinYears);
                writer.WriteNumber("maxAge", factor.AgeMaxYears);
                writer.WriteString("fraction", FormatDecimal(factor.DepreciationFraction));
                writer.WriteEndObject();
            }
            writer.WriteEndArray();
            writer.WriteEndObject();
        }
        return stream.ToArray();
    }

    private static Utf8JsonWriter CreateWriter(Stream stream) => new(
        stream,
        new JsonWriterOptions
        {
            Encoder = JavaScriptEncoder.Default,
            Indented = false,
        });

    private static void WriteScheduleIdentity(
        Utf8JsonWriter writer,
        Guid id,
        Guid countyId,
        int effectiveYear,
        string version,
        ReferenceDataOrigin origin,
        string author,
        string? revalCycle)
    {
        writer.WriteString("id", FormatGuid(id));
        writer.WriteString("countyId", FormatGuid(countyId));
        writer.WriteNumber("effectiveYear", effectiveYear);
        writer.WriteString("version", Normalize(version));
        writer.WriteString("origin", origin.ToString());
        writer.WriteString("author", Normalize(author));
        if (revalCycle is null)
            writer.WriteNull("revalCycle");
        else
            writer.WriteString("revalCycle", Normalize(revalCycle));
    }

    private static void WriteNullableNumber(Utf8JsonWriter writer, string name, int? value)
    {
        if (value.HasValue)
            writer.WriteNumber(name, value.Value);
        else
            writer.WriteNull(name);
    }

    private static void ValidateBounds(int? minimum, int? maximum, string label)
    {
        if (minimum is < 0 || maximum is < 0 || (minimum.HasValue && maximum < minimum))
            throw new InvalidOperationException($"Invalid {label} bounds.");
    }

    private static long BandWidth(int? minimum, int? maximum)
        => minimum.HasValue && maximum.HasValue
            ? (long)maximum.Value - minimum.Value
            : long.MaxValue;

    private static void RequireMetadata(string value, string name)
    {
        RequireCanonicalText(value, name);
        if (!string.Equals(value, value.Trim(), StringComparison.Ordinal))
            throw new InvalidOperationException($"{name} must already be trimmed.");
    }

    private static void RequireCanonicalText(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"{name} is required.");
        if (!string.Equals(value, Normalize(value), StringComparison.Ordinal))
            throw new InvalidOperationException($"{name} must use Unicode NFC.");
    }

    private static void RequireSha256(string value, string name)
    {
        if (value.Length != 64 || value.Any(c => !char.IsAsciiHexDigit(c) || char.IsUpper(c)))
            throw new InvalidOperationException($"{name} must be lowercase SHA-256 hex.");
    }

    private static string Normalize(string value) => value.Normalize(NormalizationForm.FormC);
    private static string FormatGuid(Guid value) => value.ToString("D", CultureInfo.InvariantCulture);
    private static string FormatDecimal(decimal value)
        => value == 0m
            ? "0"
            : value.ToString("0.############################", CultureInfo.InvariantCulture);
    private static string ComputeSha256(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();

    private sealed class CostFactorCanonicalComparer : IComparer<CostFactor>
    {
        public static CostFactorCanonicalComparer Instance { get; } = new();

        public int Compare(CostFactor? left, CostFactor? right)
        {
            if (ReferenceEquals(left, right)) return 0;
            if (left is null) return -1;
            if (right is null) return 1;

            var result = StringComparer.OrdinalIgnoreCase.Compare(
                left.ImprovementClassCode,
                right.ImprovementClassCode);
            if (result != 0) return result;
            result = StringComparer.Ordinal.Compare(left.ImprovementClassCode, right.ImprovementClassCode);
            if (result != 0) return result;
            result = CompareNullableMinimum(left.SizeBandMinSqFt, right.SizeBandMinSqFt);
            if (result != 0) return result;
            result = CompareNullableMaximum(left.SizeBandMaxSqFt, right.SizeBandMaxSqFt);
            if (result != 0) return result;
            result = StringComparer.Ordinal.Compare(
                FormatDecimal(left.UnitCostPerSqFt),
                FormatDecimal(right.UnitCostPerSqFt));
            return result != 0
                ? result
                : StringComparer.Ordinal.Compare(FormatGuid(left.Id), FormatGuid(right.Id));
        }
    }

    private sealed class DepreciationFactorCanonicalComparer : IComparer<DepreciationFactor>
    {
        public static DepreciationFactorCanonicalComparer Instance { get; } = new();

        public int Compare(DepreciationFactor? left, DepreciationFactor? right)
        {
            if (ReferenceEquals(left, right)) return 0;
            if (left is null) return -1;
            if (right is null) return 1;

            var result = left.AgeMinYears.CompareTo(right.AgeMinYears);
            if (result != 0) return result;
            result = left.AgeMaxYears.CompareTo(right.AgeMaxYears);
            if (result != 0) return result;
            result = StringComparer.Ordinal.Compare(
                FormatDecimal(left.DepreciationFraction),
                FormatDecimal(right.DepreciationFraction));
            return result != 0
                ? result
                : StringComparer.Ordinal.Compare(FormatGuid(left.Id), FormatGuid(right.Id));
        }
    }

    private static int CompareNullableMinimum(int? left, int? right)
        => left.HasValue
            ? right.HasValue ? left.Value.CompareTo(right.Value) : 1
            : right.HasValue ? -1 : 0;

    private static int CompareNullableMaximum(int? left, int? right)
        => left.HasValue
            ? right.HasValue ? left.Value.CompareTo(right.Value) : -1
            : right.HasValue ? 1 : 0;
}
