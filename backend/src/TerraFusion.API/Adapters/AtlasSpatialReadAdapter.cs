using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.DTOs.GisTf;

namespace TerraFusion.API.Adapters;

/// <summary>
/// Pure, unwired projection from the sovereign parcel geometry response to the
/// frozen atlas.spatial-read@1.0.0 contract.
/// </summary>
public static partial class AtlasSpatialReadAdapter
{
    private const string SchemaVersion = "1.0.0";
    private const decimal SquareFeetPerAcre = 43_560m;
    private static readonly JsonSerializerOptions ContractSerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static AtlasParcelSpatialReadResult Adapt(
        AtlasParcelSpatialReadRequest request,
        ParcelGeometryResponse source)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(source);

        RequireCanonicalIdentity(request.CountyId, source.CountyId, nameof(request.CountyId));
        RequireCanonicalIdentity(request.ParcelId, source.TfParcelId, nameof(request.ParcelId));

        if (!source.IsActive)
        {
            throw new InvalidOperationException("Atlas spatial reads require an active canonical geometry source.");
        }

        var centroid = new AtlasCoordinate
        {
            Longitude = ToCoordinate(source.CentroidLon, -180m, 180m, nameof(source.CentroidLon)),
            Latitude = ToCoordinate(source.CentroidLat, -90m, 90m, nameof(source.CentroidLat)),
        };
        var areaSquareFeet = ToArea(source.AreaSqFt);
        var outerRing = ParseOuterRing(source.GeomWkt);

        return new AtlasParcelSpatialReadResult
        {
            SchemaVersion = SchemaVersion,
            CountyId = source.CountyId.ToString("D"),
            ParcelId = source.TfParcelId.ToString("D"),
            EvidenceState = AtlasSpatialEvidenceState.canonical,
            Boundary = new AtlasBoundary
            {
                GeometryState = AtlasGeometryState.polygon,
                Centroid = centroid,
                Dimensions = null,
                AreaAcres = areaSquareFeet / SquareFeetPerAcre,
                AreaSquareFeet = areaSquareFeet,
                OuterRing = outerRing,
            },
            Layers = new AtlasLayers
            {
                Zoning = null,
                Flood = null,
            },
        };
    }

    /// <summary>
    /// Serializes the frozen contract with absent optional evidence omitted. The API-wide JSON
    /// policy preserves nulls, so a future runtime consumer must use this contract-safe path (or
    /// prove an equivalent scoped policy) rather than return the DTO through default MVC JSON.
    /// </summary>
    public static string Serialize(
        AtlasParcelSpatialReadRequest request,
        ParcelGeometryResponse source) =>
        JsonSerializer.Serialize(Adapt(request, source), ContractSerializerOptions);

    private static void RequireCanonicalIdentity(string value, Guid expected, string parameterName)
    {
        var canonical = expected.ToString("D");
        if (!Guid.TryParseExact(value, "D", out var parsed)
            || parsed != expected
            || !string.Equals(value, canonical, StringComparison.Ordinal))
        {
            throw new ArgumentException(
                $"{parameterName} must be the exact canonical identity for the source geometry.",
                parameterName);
        }
    }

    private static decimal ToCoordinate(double value, decimal minimum, decimal maximum, string fieldName)
    {
        var converted = ToFiniteDecimal(value, fieldName);
        if (converted < minimum || converted > maximum)
        {
            throw new InvalidOperationException($"{fieldName} is outside the WGS-84 coordinate range.");
        }

        return converted;
    }

    private static decimal ToArea(double value)
    {
        var converted = ToFiniteDecimal(value, nameof(ParcelGeometryResponse.AreaSqFt));
        if (converted < 0m)
        {
            throw new InvalidOperationException("AreaSqFt cannot be negative.");
        }

        return converted;
    }

    private static decimal ToFiniteDecimal(double value, string fieldName)
    {
        if (!double.IsFinite(value))
        {
            throw new InvalidOperationException($"{fieldName} must be finite.");
        }

        try
        {
            return Convert.ToDecimal(value, CultureInfo.InvariantCulture);
        }
        catch (OverflowException exception)
        {
            throw new InvalidOperationException($"{fieldName} is outside the contract numeric range.", exception);
        }
    }

    private static IReadOnlyList<AtlasCoordinate> ParseOuterRing(string wkt)
    {
        if (string.IsNullOrWhiteSpace(wkt))
        {
            throw new InvalidOperationException("GeomWkt must contain one polygon outer ring.");
        }

        var match = SinglePolygonRegex().Match(wkt);
        if (!match.Success)
        {
            throw new InvalidOperationException("Only one simple POLYGON outer ring is supported.");
        }

        var coordinateSegments = match.Groups["ring"].Value
            .Split(',', StringSplitOptions.TrimEntries);
        if (coordinateSegments.Any(string.IsNullOrWhiteSpace))
        {
            throw new InvalidOperationException("Polygon coordinate segments cannot be empty.");
        }

        var points = coordinateSegments.Select(ParseWktCoordinate).ToArray();

        if (points.Length < 4)
        {
            throw new InvalidOperationException("A polygon ring requires at least four coordinates.");
        }

        if (points[0] != points[^1])
        {
            throw new InvalidOperationException("The polygon outer ring must be closed.");
        }

        if (points.Take(points.Length - 1).Distinct().Count() < 3)
        {
            throw new InvalidOperationException("The polygon outer ring requires at least three distinct vertices.");
        }

        return points;
    }

    private static AtlasCoordinate ParseWktCoordinate(string coordinate)
    {
        var parts = coordinate.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2
            || !decimal.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var longitude)
            || !decimal.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var latitude)
            || longitude < -180m
            || longitude > 180m
            || latitude < -90m
            || latitude > 90m)
        {
            throw new InvalidOperationException("Polygon coordinates must be finite longitude/latitude pairs in WGS-84 range.");
        }

        return new AtlasCoordinate
        {
            Longitude = longitude,
            Latitude = latitude,
        };
    }

    [GeneratedRegex(
        @"^\s*POLYGON\s*\(\s*\(\s*(?<ring>[^()]*)\s*\)\s*\)\s*$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SinglePolygonRegex();
}
