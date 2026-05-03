using System.Text.Json;

namespace TerraFusion.Core.Services;

public sealed record CountySegmentMetadata(
    string NeighborhoodCode,
    string BuildingType,
    string QualityGrade,
    int? RevalArea
);

public static class CountySegmentMetadataSupport
{
    public static CountySegmentMetadata Create(
        string? neighborhoodCode,
        string? buildingType,
        string? qualityGrade,
        int? revalArea)
    {
        var normalizedNeighborhood = NormalizeToken(neighborhoodCode);
        return new CountySegmentMetadata(
            NeighborhoodCode: normalizedNeighborhood,
            BuildingType: NormalizeToken(buildingType),
            QualityGrade: NormalizeToken(qualityGrade),
            RevalArea: NormalizeRevalArea(revalArea));
    }

    public static CountySegmentMetadata Parse(string? ruleDefinition, string? geographyRef = null)
    {
        if (string.IsNullOrWhiteSpace(ruleDefinition))
        {
            return Create(geographyRef, null, null, null);
        }

        try
        {
            var doc = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(ruleDefinition);
            if (doc is null)
            {
                return Create(geographyRef, null, null, null);
            }

            var neighborhood = GetString(doc, "neighborhood") ?? geographyRef;
            var buildingType = GetString(doc, "buildingType");
            var qualityGrade = GetString(doc, "qualityGrade");
            var revalArea = GetNullableInt(doc, "revalArea");

            return Create(neighborhood, buildingType, qualityGrade, revalArea);
        }
        catch (JsonException)
        {
            return Create(geographyRef, null, null, null);
        }
    }

    public static string SerializeRuleDefinition(
        string? neighborhoodCode,
        string? buildingType,
        string? qualityGrade,
        int? revalArea)
    {
        var metadata = Create(neighborhoodCode, buildingType, qualityGrade, revalArea);
        return JsonSerializer.Serialize(new
        {
            neighborhood = metadata.NeighborhoodCode,
            buildingType = metadata.BuildingType,
            qualityGrade = metadata.QualityGrade,
            revalArea = metadata.RevalArea,
        });
    }

    public static int? NormalizeRevalArea(int? revalArea)
    {
        if (revalArea.HasValue && revalArea.Value >= 1 && revalArea.Value <= 6)
        {
            return revalArea.Value;
        }

        return null;
    }

    public static string NormalizeToken(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "UNKNOWN" : value.Trim();

    private static string? GetString(IReadOnlyDictionary<string, JsonElement> doc, string key)
    {
        return doc.TryGetValue(key, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static int? GetNullableInt(IReadOnlyDictionary<string, JsonElement> doc, string key)
    {
        if (!doc.TryGetValue(key, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetInt32(out var number) => number,
            JsonValueKind.String when int.TryParse(value.GetString(), out var parsed) => parsed,
            _ => null,
        };
    }
}
