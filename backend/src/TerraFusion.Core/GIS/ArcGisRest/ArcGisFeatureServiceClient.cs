using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.Core.Configuration;

namespace TerraFusion.Core.GIS.ArcGisRest;

/// <summary>
/// Slice G1-C: read-only ArcGIS REST feature-service adapter. Issues
/// a single <c>/query?f=geojson&amp;where=1=1&amp;outFields=*&amp;outSR={epsg}&amp;returnGeometry=true</c>
/// request and projects the response into a sequence of
/// <see cref="ArcGisParcelFeature"/>s ready for canonical persistence
/// via G1-D.
///
/// <para>Polygon geometry is converted to Well-Known Text (WGS84) for
/// portable storage in <c>gis_tf.tf_parcel_geom.GeomWkt</c>. Centroids
/// are computed as the mean of the exterior-ring vertices — adequate
/// for proximity queries at parcel scale; high-precision centroids
/// remain a Phase 2 PostGIS concern.</para>
///
/// <para>Area is read from the <c>Shape__Area</c> attribute when
/// present; otherwise zero. Computing area from WGS84 lat/lon
/// polygons client-side requires equal-area reprojection and is
/// out-of-scope for v1.</para>
/// </summary>
public sealed class ArcGisFeatureServiceClient : IArcGisFeatureServiceClient
{
    public const string HttpClientName = "ArcGisFeatureService";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IOptions<ArcGisFeatureServiceOptions> _options;
    private readonly ILogger<ArcGisFeatureServiceClient> _logger;

    public ArcGisFeatureServiceClient(
        IHttpClientFactory httpClientFactory,
        IOptions<ArcGisFeatureServiceOptions> options,
        ILogger<ArcGisFeatureServiceClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ArcGisParcelFeature>> FetchParcelsAsync(
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        var county = _options.Value.GetForCounty(countyId)
            ?? throw new ArcGisFeatureServiceConfigurationException(
                $"No ArcGIS feature-service configuration bound for county {countyId}.");

        if (string.IsNullOrWhiteSpace(county.ParcelFeatureServiceUrl))
        {
            throw new ArcGisFeatureServiceConfigurationException(
                $"County {countyId} has empty ParcelFeatureServiceUrl.");
        }

        using var http = _httpClientFactory.CreateClient(HttpClientName);
        http.Timeout = TimeSpan.FromSeconds(county.RequestTimeoutSeconds);

        if (!string.IsNullOrEmpty(county.BearerToken))
        {
            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", county.BearerToken);
        }

        // GEOMETRY-PAGING (2026-06-04): ArcGIS FeatureServers cap each /query
        // response at MaxRecordCount (commonly 2,000). The previous single-request
        // implementation silently truncated at the first page (~3,955 of 80,076
        // Benton parcels never landed). Page via resultOffset/resultRecordCount,
        // accumulating until a page returns fewer rows than requested (or zero).
        var results = new List<ArcGisParcelFeature>();
        var pageSize = county.PageSize > 0 ? county.PageSize : 2000;
        var offset = 0;
        var pages = 0;
        const int MaxPages = 1000; // hard backstop (1000 * 2000 = 2M features)

        const int MaxAttemptsPerPage = 4;
        while (pages < MaxPages)
        {
            var queryUrl = BuildQueryUrl(county, offset, pageSize);
            // GEOMETRY-PAGING resilience: ArcGIS occasionally times out / drops a
            // single page under load. Retry the page (bounded, with backoff) so one
            // transient failure does not abort the whole multi-page pull. Only the
            // FINAL failed attempt surfaces as a transport exception.
            ArcGisGeoJsonFeatureCollection? payload = null;
            Exception? lastError = null;
            for (var attempt = 1; attempt <= MaxAttemptsPerPage; attempt++)
            {
                try
                {
                    payload = await http.GetFromJsonAsync<ArcGisGeoJsonFeatureCollection>(
                        queryUrl, JsonOptions, cancellationToken).ConfigureAwait(false);
                    lastError = null;
                    break;
                }
                catch (Exception ex) when (
                    (ex is HttpRequestException
                     || (ex is TaskCanceledException && !cancellationToken.IsCancellationRequested)
                     || ex is System.IO.IOException
                     || ex is JsonException)
                    && attempt < MaxAttemptsPerPage)
                {
                    lastError = ex;
                    _logger.LogWarning(
                        "ArcGIS page fetch failed (county {CountyId}, offset {Offset}, attempt {Attempt}/{Max}): {Msg}; retrying",
                        countyId, offset, attempt, MaxAttemptsPerPage, ex.Message);
                    await Task.Delay(TimeSpan.FromSeconds(3 * attempt), cancellationToken).ConfigureAwait(false);
                }
            }
            if (payload is null)
            {
                throw new ArcGisFeatureServiceTransportException(
                    $"ArcGIS feature-service request failed for county {countyId} (offset {offset}) after {MaxAttemptsPerPage} attempts: {lastError?.Message}", lastError!);
            }

            var pageCount = payload?.Features?.Count ?? 0;
            if (payload?.Features is not null)
            {
                foreach (var feature in payload.Features)
                {
                    var projected = TryProject(feature, countyId, county);
                    if (projected is not null)
                        results.Add(projected);
                }
            }

            pages++;
            // Last page when the server returned fewer than we asked for (or
            // didn't flag a transfer-limit overflow). Either condition ends paging.
            if (pageCount < pageSize || payload?.Properties?.ExceededTransferLimit == false)
                break;
            if (pageCount == 0)
                break;
            offset += pageCount;
        }

        if (results.Count == 0)
        {
            _logger.LogWarning(
                "ArcGIS feature service returned no usable features for county {CountyId} at {Url} after {Pages} page(s)",
                countyId, county.ParcelFeatureServiceUrl, pages);
            return Array.Empty<ArcGisParcelFeature>();
        }

        _logger.LogInformation(
            "ArcGIS pull for county {CountyId}: {Count} features across {Pages} page(s) of {PageSize}",
            countyId, results.Count, pages, pageSize);
        return results;
    }

    private static string BuildQueryUrl(CountyArcGisOptions county, int resultOffset, int resultRecordCount)
    {
        var separator = county.ParcelFeatureServiceUrl.EndsWith('/') ? "query" : "/query";
        var sr = county.OutSpatialReferenceEpsg.ToString(CultureInfo.InvariantCulture);
        return $"{county.ParcelFeatureServiceUrl}{separator}" +
               $"?f=geojson&where=1%3D1&outFields=*&outSR={sr}&returnGeometry=true" +
               $"&resultOffset={resultOffset}&resultRecordCount={resultRecordCount}";
    }

    private ArcGisParcelFeature? TryProject(
        ArcGisGeoJsonFeature feature,
        Guid countyId,
        CountyArcGisOptions county)
    {
        if (feature.Geometry is null)
        {
            _logger.LogDebug("Skipping feature with null geometry for county {CountyId}", countyId);
            return null;
        }

        var geomType = feature.Geometry.Type ?? "<null>";
        var isPolygon = string.Equals(geomType, "Polygon", StringComparison.OrdinalIgnoreCase);
        var isMultiPolygon = string.Equals(geomType, "MultiPolygon", StringComparison.OrdinalIgnoreCase);

        if (!isPolygon && !isMultiPolygon)
        {
            // Genuinely unsupported (Point/LineString/etc.) — parcels should not be these.
            _logger.LogDebug(
                "Skipping feature with unsupported geometry type {Type} for county {CountyId}",
                geomType, countyId);
            return null;
        }

        // GEOMETRY-MULTIPOLYGON (2026-06-04): MultiPolygon parcels (multi-part lots)
        // were previously dropped silently, losing real parcels. Project both: a
        // Polygon yields POLYGON((...)); a MultiPolygon yields MULTIPOLYGON(((...)),...).
        // Centroid is computed over the LARGEST exterior ring (best single
        // representative point for proximity queries).
        string wkt;
        double centroidLng, centroidLat;

        if (isPolygon)
        {
            var ring = ExtractFirstRing(feature.Geometry.Coordinates);
            if (ring is null || ring.Count < 3)
            {
                _logger.LogDebug("Skipping feature with degenerate polygon for county {CountyId}", countyId);
                return null;
            }
            (centroidLng, centroidLat) = ComputeCentroid(ring);
            wkt = FormatPolygonWkt(ring);
        }
        else
        {
            // MultiPolygon: coordinates = [ polygon, polygon, ... ], each polygon = [ ring, ring, ... ].
            var polygonRings = ExtractMultiPolygonExteriorRings(feature.Geometry.Coordinates);
            if (polygonRings.Count == 0)
            {
                _logger.LogDebug("Skipping feature with degenerate multipolygon for county {CountyId}", countyId);
                return null;
            }
            wkt = FormatMultiPolygonWkt(polygonRings);
            // centroid from the largest ring (by vertex count — cheap, adequate at parcel scale)
            var largest = polygonRings[0];
            foreach (var r in polygonRings)
                if (r.Count > largest.Count) largest = r;
            (centroidLng, centroidLat) = ComputeCentroid(largest);
        }

        long objectId = 0;
        string? apn = null;
        double areaSqFt = 0;

        if (feature.Properties is not null)
        {
            if (feature.Properties.TryGetValue(county.ObjectIdAttributeName, out var objectIdEl))
            {
                objectId = ReadInt64(objectIdEl);
            }
            if (feature.Properties.TryGetValue(county.ApnAttributeName, out var apnEl))
            {
                apn = ReadString(apnEl);
            }
            if (feature.Properties.TryGetValue("Shape__Area", out var areaEl))
            {
                areaSqFt = ReadDouble(areaEl);
            }
        }

        return new ArcGisParcelFeature
        {
            CountyId = countyId,
            ArcGisObjectId = objectId,
            ArcGisApn = apn,
            GeomWkt = wkt,
            CentroidLat = centroidLat,
            CentroidLon = centroidLng,
            AreaSqFt = areaSqFt,
            SourceServiceUrl = county.ParcelFeatureServiceUrl,
        };
    }

    /// <summary>
    /// GeoJSON Polygon coordinates are <c>[[[lng,lat], ...]]</c> —
    /// outer array is the rings list, first ring is the exterior.
    /// </summary>
    private static List<(double Lng, double Lat)>? ExtractFirstRing(JsonElement coordinates)
    {
        if (coordinates.ValueKind != JsonValueKind.Array || coordinates.GetArrayLength() == 0)
        {
            return null;
        }

        var firstRing = coordinates[0];
        if (firstRing.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var ring = new List<(double, double)>(firstRing.GetArrayLength());
        foreach (var vertex in firstRing.EnumerateArray())
        {
            if (vertex.ValueKind != JsonValueKind.Array || vertex.GetArrayLength() < 2)
            {
                continue;
            }
            var lng = vertex[0].GetDouble();
            var lat = vertex[1].GetDouble();
            ring.Add((lng, lat));
        }
        return ring;
    }

    private static (double Lng, double Lat) ComputeCentroid(List<(double Lng, double Lat)> ring)
    {
        // Simple mean of vertices; sufficient for parcel-scale
        // proximity queries. Real planar centroid would weight by
        // edge contribution, but that's a Phase 2 PostGIS upgrade.
        double sumLng = 0, sumLat = 0;
        foreach (var (lng, lat) in ring)
        {
            sumLng += lng;
            sumLat += lat;
        }
        var n = ring.Count;
        return (sumLng / n, sumLat / n);
    }

    private static string FormatPolygonWkt(List<(double Lng, double Lat)> ring)
    {
        var sb = new StringBuilder("POLYGON((");
        for (int i = 0; i < ring.Count; i++)
        {
            if (i > 0)
            {
                sb.Append(", ");
            }
            sb.Append(ring[i].Lng.ToString("G17", CultureInfo.InvariantCulture));
            sb.Append(' ');
            sb.Append(ring[i].Lat.ToString("G17", CultureInfo.InvariantCulture));
        }
        sb.Append("))");
        return sb.ToString();
    }

    /// <summary>
    /// GEOMETRY-MULTIPOLYGON: extract the exterior ring of each polygon in a
    /// GeoJSON MultiPolygon. Coordinates shape is
    /// <c>[ [ [ [lng,lat],... ] (exterior ring), [holes...] ], (next polygon)... ]</c>.
    /// We keep the exterior ring (index 0) of each polygon; holes are ignored for
    /// the v1 representative geometry (consistent with the single-Polygon path which
    /// also takes only the first/exterior ring).
    /// </summary>
    private static List<List<(double Lng, double Lat)>> ExtractMultiPolygonExteriorRings(JsonElement coordinates)
    {
        var polygons = new List<List<(double Lng, double Lat)>>();
        if (coordinates.ValueKind != JsonValueKind.Array)
            return polygons;

        foreach (var polygon in coordinates.EnumerateArray())
        {
            // each polygon is [ exteriorRing, hole, hole, ... ]; take exterior (first).
            var ring = ExtractFirstRing(polygon);
            if (ring is not null && ring.Count >= 3)
                polygons.Add(ring);
        }
        return polygons;
    }

    private static string FormatMultiPolygonWkt(List<List<(double Lng, double Lat)>> polygons)
    {
        var sb = new StringBuilder("MULTIPOLYGON(");
        for (int p = 0; p < polygons.Count; p++)
        {
            if (p > 0) sb.Append(", ");
            sb.Append("((");
            var ring = polygons[p];
            for (int i = 0; i < ring.Count; i++)
            {
                if (i > 0) sb.Append(", ");
                sb.Append(ring[i].Lng.ToString("G17", CultureInfo.InvariantCulture));
                sb.Append(' ');
                sb.Append(ring[i].Lat.ToString("G17", CultureInfo.InvariantCulture));
            }
            sb.Append("))");
        }
        sb.Append(')');
        return sb.ToString();
    }

    private static long ReadInt64(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.Number => el.TryGetInt64(out var v) ? v : (long)el.GetDouble(),
        JsonValueKind.String when long.TryParse(el.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var s) => s,
        _ => 0,
    };

    private static double ReadDouble(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.Number => el.GetDouble(),
        JsonValueKind.String when double.TryParse(el.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var d) => d,
        _ => 0,
    };

    private static string? ReadString(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.String => el.GetString(),
        JsonValueKind.Number => el.ToString(),
        JsonValueKind.Null or JsonValueKind.Undefined => null,
        _ => el.ToString(),
    };
}
