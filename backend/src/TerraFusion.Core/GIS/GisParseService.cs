// TFR-084: GIS Parse Service — Shapefile, GeoJSON, KML ingestion
using System.Text.Json;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.GIS.Connectors;

namespace TerraFusion.Core.GIS;

// ── Data Models ──────────────────────────────────────────────────────

/// <summary>Set of named boundaries extracted from parsed features.</summary>
public record BoundarySet(
    string Name,
    IReadOnlyList<Polygon> Boundaries,
    int FeatureCount);

// ── Interface ────────────────────────────────────────────────────────

/// <summary>
/// Parses spatial data files (Shapefile, GeoJSON, KML) into normalized
/// feature collections. Supports boundary extraction for overlay analysis.
/// </summary>
public interface IGisParseService
{
    /// <summary>Parse an ESRI Shapefile (.shp + .dbf + .shx) from a zip stream.</summary>
    /// <param name="stream">Zip archive containing .shp, .dbf, .shx files.</param>
    Task<FeatureCollection> ParseShapefileAsync(Stream stream, CancellationToken ct = default);

    /// <summary>Parse a GeoJSON file from a stream.</summary>
    /// <param name="stream">UTF-8 GeoJSON content.</param>
    Task<FeatureCollection> ParseGeoJsonAsync(Stream stream, CancellationToken ct = default);

    /// <summary>Parse a KML/KMZ file from a stream.</summary>
    /// <param name="stream">KML XML content or KMZ zip archive.</param>
    Task<FeatureCollection> ParseKmlAsync(Stream stream, CancellationToken ct = default);

    /// <summary>Extract closed polygon boundaries from a feature collection.</summary>
    /// <param name="features">Input features.</param>
    /// <param name="boundaryName">Name for the resulting boundary set.</param>
    BoundarySet ExtractBoundaries(FeatureCollection features, string boundaryName = "Imported");
}

// ── Implementation ───────────────────────────────────────────────────

/// <summary>
/// Production GIS file parser. GeoJSON and KML are parsed natively.
/// Shapefile parsing reads the simplified binary format header and
/// delegates complex cases to the GIS connector for server-side parsing.
/// </summary>
public sealed class GisParseService : IGisParseService
{
    private readonly ILogger<GisParseService> _logger;

    public GisParseService(ILogger<GisParseService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async Task<FeatureCollection> ParseShapefileAsync(Stream stream, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(stream);
        _logger.LogInformation("Parsing shapefile archive");

        // Shapefiles arrive as a zip containing .shp, .dbf, .shx, .prj
        using var archive = new System.IO.Compression.ZipArchive(stream, System.IO.Compression.ZipArchiveMode.Read);

        // Look for the .shp entry
        var shpEntry = archive.Entries.FirstOrDefault(e =>
            e.FullName.EndsWith(".shp", StringComparison.OrdinalIgnoreCase));

        if (shpEntry is null)
        {
            _logger.LogWarning("No .shp file found in archive");
            return new FeatureCollection(Array.Empty<GisFeature>(), 0);
        }

        // Read the .dbf for attributes if present
        var dbfEntry = archive.Entries.FirstOrDefault(e =>
            e.FullName.EndsWith(".dbf", StringComparison.OrdinalIgnoreCase));

        var features = new List<GisFeature>();

        // Parse the .shp binary header to extract basic geometry info
        await using var shpStream = shpEntry.Open();
        using var reader = new BinaryReader(shpStream);

        // Shapefile header: 100 bytes
        var fileCode = ReadBigEndianInt32(reader); // should be 9994
        if (fileCode != 9994)
        {
            _logger.LogWarning("Invalid shapefile magic number: {Code}", fileCode);
            return new FeatureCollection(features, 0);
        }

        reader.BaseStream.Seek(24, SeekOrigin.Begin);
        var fileLengthWords = ReadBigEndianInt32(reader);
        var version = reader.ReadInt32(); // little-endian
        var shapeType = reader.ReadInt32();
        var xMin = reader.ReadDouble();
        var yMin = reader.ReadDouble();
        var xMax = reader.ReadDouble();
        var yMax = reader.ReadDouble();

        _logger.LogDebug("Shapefile: type={ShapeType}, extent=({XMin},{YMin})-({XMax},{YMax})",
            shapeType, xMin, yMin, xMax, yMax);

        // Skip rest of header
        reader.BaseStream.Seek(100, SeekOrigin.Begin);

        // Read records
        var recordId = 0;
        while (reader.BaseStream.Position < reader.BaseStream.Length - 8)
        {
            try
            {
                var recNum = ReadBigEndianInt32(reader);
                var recLen = ReadBigEndianInt32(reader) * 2; // word to byte
                var recShapeType = reader.ReadInt32();

                var coords = new List<GeoPoint>();
                var geomType = "Unknown";

                switch (recShapeType)
                {
                    case 1: // Point
                        geomType = "Point";
                        var px = reader.ReadDouble();
                        var py = reader.ReadDouble();
                        coords.Add(new GeoPoint(py, px));
                        break;

                    case 5: // Polygon
                        geomType = "Polygon";
                        reader.ReadDouble(); reader.ReadDouble(); // bbox min
                        reader.ReadDouble(); reader.ReadDouble(); // bbox max
                        var numParts = reader.ReadInt32();
                        var numPoints = reader.ReadInt32();
                        var parts = new int[numParts];
                        for (var i = 0; i < numParts; i++) parts[i] = reader.ReadInt32();
                        for (var i = 0; i < numPoints; i++)
                        {
                            var x = reader.ReadDouble();
                            var y = reader.ReadDouble();
                            coords.Add(new GeoPoint(y, x));
                        }
                        break;

                    default:
                        // Skip unsupported shape types
                        var bytesToSkip = recLen - 4; // already read shapeType (4 bytes)
                        if (bytesToSkip > 0) reader.BaseStream.Seek(bytesToSkip, SeekOrigin.Current);
                        continue;
                }

                features.Add(new GisFeature(
                    (++recordId).ToString(),
                    geomType,
                    coords,
                    new Dictionary<string, object?> { ["RECORD_NUM"] = recNum }));
            }
            catch (EndOfStreamException)
            {
                break;
            }
        }

        _logger.LogInformation("Parsed {Count} features from shapefile", features.Count);
        return new FeatureCollection(features, features.Count);
    }

    /// <inheritdoc />
    public async Task<FeatureCollection> ParseGeoJsonAsync(Stream stream, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(stream);
        _logger.LogInformation("Parsing GeoJSON");

        var doc = await JsonSerializer.DeserializeAsync<JsonElement>(stream, cancellationToken: ct);

        var type = doc.TryGetProperty("type", out var t) ? t.GetString() : null;
        var features = new List<GisFeature>();

        if (type == "FeatureCollection" && doc.TryGetProperty("features", out var featureArray))
        {
            var idx = 0;
            foreach (var f in featureArray.EnumerateArray())
            {
                var feature = ParseGeoJsonFeature(f, idx++);
                if (feature is not null)
                    features.Add(feature);
            }
        }
        else if (type == "Feature")
        {
            var feature = ParseGeoJsonFeature(doc, 0);
            if (feature is not null) features.Add(feature);
        }

        _logger.LogInformation("Parsed {Count} features from GeoJSON", features.Count);
        return new FeatureCollection(features, features.Count);
    }

    /// <inheritdoc />
    public async Task<FeatureCollection> ParseKmlAsync(Stream stream, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(stream);
        _logger.LogInformation("Parsing KML");

        // Check if it's a KMZ (zip archive)
        Stream kmlStream = stream;
        System.IO.Compression.ZipArchive? archive = null;

        try
        {
            var peekBuffer = new byte[4];
            var bytesRead = await stream.ReadAsync(peekBuffer, 0, 4, ct);
            stream.Seek(0, SeekOrigin.Begin);

            if (bytesRead >= 4 && peekBuffer[0] == 0x50 && peekBuffer[1] == 0x4B)
            {
                // It's a ZIP (KMZ)
                archive = new System.IO.Compression.ZipArchive(stream, System.IO.Compression.ZipArchiveMode.Read);
                var kmlEntry = archive.Entries.FirstOrDefault(e =>
                    e.FullName.EndsWith(".kml", StringComparison.OrdinalIgnoreCase));
                if (kmlEntry is null)
                    return new FeatureCollection(Array.Empty<GisFeature>(), 0);
                kmlStream = kmlEntry.Open();
            }

            var xDoc = await XDocument.LoadAsync(kmlStream, LoadOptions.None, ct);
            var ns = xDoc.Root?.GetDefaultNamespace() ?? XNamespace.None;
            var features = new List<GisFeature>();
            var idx = 0;

            var placemarks = xDoc.Descendants(ns + "Placemark");
            foreach (var pm in placemarks)
            {
                var name = pm.Element(ns + "name")?.Value ?? $"Feature_{idx}";
                var desc = pm.Element(ns + "description")?.Value;
                var coords = new List<GeoPoint>();
                var geomType = "Unknown";

                // Point
                var pointEl = pm.Descendants(ns + "Point").FirstOrDefault();
                if (pointEl is not null)
                {
                    geomType = "Point";
                    ParseKmlCoordinates(pointEl.Element(ns + "coordinates")?.Value, coords);
                }

                // Polygon
                var polyEl = pm.Descendants(ns + "Polygon").FirstOrDefault();
                if (polyEl is not null)
                {
                    geomType = "Polygon";
                    var outerRing = polyEl.Descendants(ns + "outerBoundaryIs")
                        .FirstOrDefault()?.Descendants(ns + "coordinates").FirstOrDefault();
                    ParseKmlCoordinates(outerRing?.Value, coords);
                }

                // LineString
                var lineEl = pm.Descendants(ns + "LineString").FirstOrDefault();
                if (lineEl is not null)
                {
                    geomType = "LineString";
                    ParseKmlCoordinates(lineEl.Element(ns + "coordinates")?.Value, coords);
                }

                var attrs = new Dictionary<string, object?>
                {
                    ["NAME"] = name,
                    ["DESCRIPTION"] = desc
                };

                // Parse ExtendedData
                foreach (var data in pm.Descendants(ns + "Data"))
                {
                    var dataName = data.Attribute("name")?.Value;
                    var dataValue = data.Element(ns + "value")?.Value;
                    if (dataName is not null) attrs[dataName] = dataValue;
                }

                features.Add(new GisFeature(idx.ToString(), geomType, coords, attrs));
                idx++;
            }

            _logger.LogInformation("Parsed {Count} features from KML", features.Count);
            return new FeatureCollection(features, features.Count);
        }
        finally
        {
            archive?.Dispose();
        }
    }

    /// <inheritdoc />
    public BoundarySet ExtractBoundaries(FeatureCollection features, string boundaryName = "Imported")
    {
        ArgumentNullException.ThrowIfNull(features);

        var polygons = features.Features
            .Where(f => f.GeometryType is "Polygon" or "MultiPolygon")
            .Select(f => new Polygon(f.Coordinates))
            .ToList();

        _logger.LogDebug("Extracted {Count} boundaries from {Total} features",
            polygons.Count, features.Features.Count);

        return new BoundarySet(boundaryName, polygons, features.Features.Count);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private static GisFeature? ParseGeoJsonFeature(JsonElement f, int index)
    {
        var attrs = new Dictionary<string, object?>();
        if (f.TryGetProperty("properties", out var props) && props.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in props.EnumerateObject())
            {
                attrs[prop.Name] = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString(),
                    JsonValueKind.Number => prop.Value.GetDouble(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    _ => null
                };
            }
        }

        var coordinates = new List<GeoPoint>();
        var geomType = "Unknown";

        if (f.TryGetProperty("geometry", out var geom) && geom.ValueKind == JsonValueKind.Object)
        {
            geomType = geom.TryGetProperty("type", out var gt) ? gt.GetString() ?? "Unknown" : "Unknown";
            if (geom.TryGetProperty("coordinates", out var coords))
                ExtractCoordinates(coords, geomType, coordinates);
        }

        var id = f.TryGetProperty("id", out var fid) ? fid.ToString() : index.ToString();
        return new GisFeature(id, geomType, coordinates, attrs);
    }

    private static void ExtractCoordinates(JsonElement coords, string geomType, List<GeoPoint> output)
    {
        switch (geomType)
        {
            case "Point":
                if (coords.GetArrayLength() >= 2)
                    output.Add(new GeoPoint(coords[1].GetDouble(), coords[0].GetDouble()));
                break;
            case "LineString":
                foreach (var c in coords.EnumerateArray())
                    if (c.GetArrayLength() >= 2)
                        output.Add(new GeoPoint(c[1].GetDouble(), c[0].GetDouble()));
                break;
            case "Polygon":
                foreach (var ring in coords.EnumerateArray())
                    foreach (var c in ring.EnumerateArray())
                        if (c.GetArrayLength() >= 2)
                            output.Add(new GeoPoint(c[1].GetDouble(), c[0].GetDouble()));
                break;
            case "MultiPolygon":
                foreach (var poly in coords.EnumerateArray())
                    foreach (var ring in poly.EnumerateArray())
                        foreach (var c in ring.EnumerateArray())
                            if (c.GetArrayLength() >= 2)
                                output.Add(new GeoPoint(c[1].GetDouble(), c[0].GetDouble()));
                break;
        }
    }

    private static void ParseKmlCoordinates(string? coordText, List<GeoPoint> output)
    {
        if (string.IsNullOrWhiteSpace(coordText)) return;

        var tuples = coordText.Trim().Split(new[] { ' ', '\n', '\r', '\t' },
            StringSplitOptions.RemoveEmptyEntries);

        foreach (var tuple in tuples)
        {
            var parts = tuple.Split(',');
            if (parts.Length >= 2 &&
                double.TryParse(parts[0], out var lng) &&
                double.TryParse(parts[1], out var lat))
            {
                var alt = parts.Length >= 3 && double.TryParse(parts[2], out var a) ? a : (double?)null;
                output.Add(new GeoPoint(lat, lng, alt));
            }
        }
    }

    private static int ReadBigEndianInt32(BinaryReader reader)
    {
        var bytes = reader.ReadBytes(4);
        if (BitConverter.IsLittleEndian) Array.Reverse(bytes);
        return BitConverter.ToInt32(bytes, 0);
    }
}
