using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Entities.Forge;

/// <summary>
/// Pure assembly and validation boundary for one canonical Forge cost-kernel request. The caller
/// supplies every identity, authorization, fact, schedule, and provenance assertion; this class
/// performs no lookup, persistence, provider, runtime, or authorization work.
/// </summary>
public static class ForgeCanonicalCostConsumerProjection
{
    private const string Permission = "access:forge";
    private const string FactSchema = "forge-canonical-cost-consumer-facts/v1";
    private const decimal ResponseTolerance = 0.000001m;

    public static ForgeCanonicalCostConsumerProjectionResult Create(ForgeCanonicalCostConsumerInput input)
    {
        ArgumentNullException.ThrowIfNull(input);
        ValidateAssertions(input);

        var rates = ForgeCostScheduleProjection.Create(
            input.CostFactorSet,
            input.DepreciationSchedule,
            input.SchedulePin,
            input.Cama.ImprovementClassCode,
            input.Cama.SizeSqFt,
            input.Cama.EffectiveAgeYears);

        decimal replacementCost;
        decimal depreciation;
        decimal rcnld;
        decimal totalValue;
        try
        {
            replacementCost = checked(input.Cama.SizeSqFt * rates.BaseRate);
            depreciation = checked(replacementCost * rates.DepreciationRate);
            rcnld = checked(replacementCost - depreciation);
            totalValue = checked(rcnld + input.Land.LandValue);
        }
        catch (OverflowException exception)
        {
            throw new InvalidOperationException("Canonical Forge cost arithmetic overflowed.", exception);
        }

        var request = new ForgeCanonicalValuationRequest(
            input.Identity.ParcelId,
            ToExactDouble(replacementCost, nameof(replacementCost)),
            ToExactDouble(depreciation, nameof(depreciation)),
            ToExactDouble(rcnld, nameof(rcnld)),
            ToExactDouble(input.Land.LandValue, nameof(input.Land.LandValue)));

        return new ForgeCanonicalCostConsumerProjectionResult(
            input.Identity,
            input.SchedulePin,
            ComputeFactSnapshotSha256(input, rates, replacementCost, depreciation, rcnld, totalValue),
            rates.BaseRate,
            rates.DepreciationRate,
            replacementCost,
            depreciation,
            rcnld,
            input.Land.LandValue,
            totalValue,
            request);
    }

    public static ForgeCanonicalCostConsumerValidatedResult ValidateResponse(
        ForgeCanonicalCostConsumerProjectionResult projection,
        ForgeCanonicalValuationResponse response)
    {
        ArgumentNullException.ThrowIfNull(projection);
        ArgumentNullException.ThrowIfNull(response);

        var total = FromFiniteNonnegativeDouble(response.TotalValue, nameof(response.TotalValue));
        var land = FromFiniteNonnegativeDouble(response.LandValue, nameof(response.LandValue));
        var building = FromFiniteNonnegativeDouble(response.BuildingValue, nameof(response.BuildingValue));
        decimal componentTotal;
        try
        {
            componentTotal = checked(building + land);
        }
        catch (OverflowException exception)
        {
            throw new InvalidOperationException("Kernel response component arithmetic overflowed.", exception);
        }

        RequireWithinTolerance(building, projection.Rcnld, "Kernel building value does not match projected RCNLD.");
        RequireWithinTolerance(land, projection.LandValue, "Kernel land value does not match projected land value.");
        RequireWithinTolerance(total, componentTotal, "Kernel total does not equal its components.");
        RequireWithinTolerance(total, projection.TotalValue, "Kernel total does not match the projected total.");

        return new ForgeCanonicalCostConsumerValidatedResult(projection, total, land, building);
    }

    private static void ValidateAssertions(ForgeCanonicalCostConsumerInput input)
    {
        var identity = input.Identity ?? throw new InvalidOperationException("Request identity is required.");
        var authorization = input.Authorization ?? throw new InvalidOperationException("Authorization assertion is required.");
        var cama = input.Cama ?? throw new InvalidOperationException("CAMA fact is required.");
        var land = input.Land ?? throw new InvalidOperationException("Land fact is required.");
        ArgumentNullException.ThrowIfNull(input.CostFactorSet);
        ArgumentNullException.ThrowIfNull(input.DepreciationSchedule);
        ArgumentNullException.ThrowIfNull(input.SchedulePin);

        if (identity.CountyId == Guid.Empty || authorization.CountyId == Guid.Empty)
            throw new InvalidOperationException("County identity is required.");
        if (!authorization.IsAuthenticated)
            throw new InvalidOperationException("An authenticated authorization assertion is required.");
        RequireCanonicalText(authorization.SubjectId, "Subject identity");
        if (!string.Equals(authorization.Permission, Permission, StringComparison.Ordinal))
            throw new InvalidOperationException($"Permission must be exactly '{Permission}'.");
        RequireCanonicalText(identity.ParcelId, "Parcel identity");
        RequireCanonicalText(cama.ParcelId, "CAMA parcel identity");
        RequireCanonicalText(land.ParcelId, "Land parcel identity");
        RequireCanonicalText(cama.ImprovementClassCode, "Improvement class code");

        if (!IsSafeCorrelationId(identity.CorrelationId))
            throw new InvalidOperationException("Correlation identity must be 1-128 safe ASCII characters.");

        if (identity.TaxYear <= 0 || cama.TaxYear <= 0 || land.TaxYear <= 0)
            throw new InvalidOperationException("Tax year must be positive.");
        if (cama.SizeSqFt <= 0 || cama.EffectiveAgeYears < 0)
            throw new InvalidOperationException("CAMA size and effective age are outside the admitted bounds.");
        if (land.LandValue < 0m)
            throw new InvalidOperationException("Land value cannot be negative.");

        if (identity.CountyId != authorization.CountyId
            || identity.CountyId != cama.CountyId
            || identity.CountyId != land.CountyId
            || identity.CountyId != input.SchedulePin.CountyId)
            throw new InvalidOperationException("County identities do not match.");
        if (!string.Equals(identity.ParcelId, cama.ParcelId, StringComparison.Ordinal)
            || !string.Equals(identity.ParcelId, land.ParcelId, StringComparison.Ordinal))
            throw new InvalidOperationException("Parcel identities do not match.");
        if (identity.TaxYear != cama.TaxYear
            || identity.TaxYear != land.TaxYear
            || identity.TaxYear != input.SchedulePin.EffectiveYear)
            throw new InvalidOperationException("Tax-year identities do not match.");
    }

    private static string ComputeFactSnapshotSha256(
        ForgeCanonicalCostConsumerInput input,
        ForgeCostScheduleProjectionResult rates,
        decimal replacementCost,
        decimal depreciation,
        decimal rcnld,
        decimal totalValue)
    {
        using var buffer = new MemoryStream();
        using (var writer = new Utf8JsonWriter(buffer, new JsonWriterOptions { Indented = false }))
        {
            writer.WriteStartObject();
            writer.WriteString("schema", FactSchema);
            writer.WriteString("countyId", input.Identity.CountyId.ToString("D"));
            writer.WriteString("parcelId", input.Identity.ParcelId.Normalize(NormalizationForm.FormC));
            writer.WriteNumber("taxYear", input.Identity.TaxYear);
            writer.WriteString("improvementClass", input.Cama.ImprovementClassCode.Normalize(NormalizationForm.FormC));
            writer.WriteNumber("sizeSqFt", input.Cama.SizeSqFt);
            writer.WriteNumber("effectiveAgeYears", input.Cama.EffectiveAgeYears);
            WriteDecimal(writer, "landValue", input.Land.LandValue);
            writer.WriteString("costFactorSetId", input.SchedulePin.CostFactorSetId.ToString("D"));
            writer.WriteString("costFactorSetVersion", input.SchedulePin.CostFactorSetVersion.Normalize(NormalizationForm.FormC));
            writer.WriteString("costFactorSetSha256", input.SchedulePin.CostFactorSetContentSha256);
            writer.WriteString("depreciationScheduleId", input.SchedulePin.DepreciationScheduleId.ToString("D"));
            writer.WriteString("depreciationScheduleVersion", input.SchedulePin.DepreciationScheduleVersion.Normalize(NormalizationForm.FormC));
            writer.WriteString("depreciationScheduleSha256", input.SchedulePin.DepreciationScheduleContentSha256);
            WriteDecimal(writer, "baseRate", rates.BaseRate);
            WriteDecimal(writer, "depreciationRate", rates.DepreciationRate);
            WriteDecimal(writer, "replacementCost", replacementCost);
            WriteDecimal(writer, "depreciation", depreciation);
            WriteDecimal(writer, "rcnld", rcnld);
            WriteDecimal(writer, "totalValue", totalValue);
            writer.WriteEndObject();
        }

        buffer.Position = 0;
        return Convert.ToHexString(SHA256.HashData(buffer)).ToLowerInvariant();
    }

    private static void WriteDecimal(Utf8JsonWriter writer, string name, decimal value)
        => writer.WriteString(name, value.ToString("0.############################", CultureInfo.InvariantCulture));

    private static double ToExactDouble(decimal value, string field)
    {
        var converted = (double)value;
        if (!double.IsFinite(converted))
            throw new InvalidOperationException($"{field} cannot be represented as a finite double.");
        try
        {
            if ((decimal)converted != value)
                throw new InvalidOperationException($"{field} loses precision at the kernel DTO boundary.");
        }
        catch (OverflowException exception)
        {
            throw new InvalidOperationException($"{field} cannot round-trip through the kernel DTO boundary.", exception);
        }
        return converted;
    }

    private static decimal FromFiniteNonnegativeDouble(double value, string field)
    {
        if (!double.IsFinite(value) || value < 0d)
            throw new InvalidOperationException($"{field} must be finite and nonnegative.");
        try
        {
            return (decimal)value;
        }
        catch (OverflowException exception)
        {
            throw new InvalidOperationException($"{field} is outside decimal bounds.", exception);
        }
    }

    private static void RequireWithinTolerance(decimal actual, decimal expected, string message)
    {
        if (Math.Abs(actual - expected) > ResponseTolerance)
            throw new InvalidOperationException(message);
    }

    private static void RequireCanonicalText(string value, string field)
    {
        if (string.IsNullOrWhiteSpace(value)
            || !string.Equals(value, value.Trim(), StringComparison.Ordinal)
            || !value.IsNormalized(NormalizationForm.FormC))
            throw new InvalidOperationException($"{field} must be nonempty, unpadded NFC text.");
    }

    private static bool IsSafeCorrelationId(string value)
        => value is { Length: >= 1 and <= 128 }
            && value.All(character => char.IsAsciiLetterOrDigit(character) || character is '.' or '_' or '-');
}
