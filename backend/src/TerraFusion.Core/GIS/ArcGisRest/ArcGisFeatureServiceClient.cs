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
        string fipsCode,
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        var county = _options.Value.GetForCounty(fipsCode)
            ?? throw new ArcGisFeatureServiceConfigurationException(
                $"No ArcGIS feature-service configuration bound for FIPS={fipsCode} (county {countyId}).");

        if (string.IsNullOrWhiteSpace(county.ParcelFeatureServiceUrl))
        {
            throw new ArcGisFeatureServiceConfigurationException(
                $"County {countyId} has empty ParcelFeatureServiceUrl.");
        }

        var queryUrl = BuildQueryUrl(county);
        using var http = _httpClientFactory.CreateClient(HttpClientName);
        http.Timeout = TimeSpan.FromSeconds(county.RequestTimeoutSeconds);

        if (!string.IsNullOrEmpty(county.BearerToken))
        {
            http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", county.BearerToken);
        }

        ArcGisGeoJsonFeatureCollection? payload;
        try
        {
            payload = await http.GetFromJsonAsync<ArcGisGeoJsonFeatureCollection>(
                queryUrl, JsonOptions, cancellationToken).ConfigureAwait(false);
        }
        catch (HttpRequestException ex)
        {
            throw new ArcGisFeatureServiceTransportException(
                $"ArcGIS feature-service request failed for county {countyId}: {ex.Message}", ex);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            throw new ArcGisFeatureServiceTransportException(
                $"ArcGIS feature-service request timed out after {county.RequestTimeoutSeconds}s for county {countyId}.", ex);
        }
        catch (JsonException ex)
        {
            throw new ArcGisFeatureServiceTransportException(
                $"ArcGIS feature-service response was not valid JSON for county {countyId}: {ex.Message}", ex);
        }

        if (payload?.Features is null || payload.Features.Count == 0)
        {
            _logger.LogWarning(
                "ArcGIS feature service returned no features for county {CountyId} at {Url}",
                countyId, county.ParcelFeatureServiceUrl);
            return Array.Empty<ArcGisParcelFeature>();
        }

        var results = new List<ArcGisParcelFeature>(payload.Features.Count);
        foreach (var feature in payload.Features)
        {
            var projected = TryProject(feature, countyId, county);
            if (projected is not null)
            {
                results.Add(projected);
            }
        }
        return results;
    }

    private static string BuildQueryUrl(CountyArcGisOptions county)
    {
        var separator = county.ParcelFeatureServiceUrl.EndsWith('/') ? "query" : "/query";
        var sr = county.OutSpatialReferenceEpsg.ToString(CultureInfo.InvariantCulture);
        return $"{county.ParcelFeatureServiceUrl}{separator}" +
               $"?f=geojson&where=1%3D1&outFields=*&outSR={sr}&returnGeometry=true";
    }

    private ArcGisParcelFeature? TryProject(
        ArcGisGeoJsonFeature feature,
        Guid countyId,
        CountyArcGisOptions county)
    {
        if (feature.Geometry is null ||
            !string.Equals(feature.Geometry.Type, "Polygon", StringComparison.OrdinalIgnoreCase))
        {
            // v1: only Polygon. MultiPolygon and other shapes are
            // dropped silently with a warning so a single bad row
            // doesn't fail the whole pull.
            _logger.LogDebug(
                "Skipping feature with unsupported geometry type {Type} for county {CountyId}",
                feature.Geometry?.Type ?? "<null>", countyId);
            return null;
        }

        var ring = ExtractFirstRing(feature.Geometry.Coordinates);
        if (ring is null || ring.Count < 3)
        {
            _logger.LogDebug(
                "Skipping feature with degenerate polygon for county {CountyId}", countyId);
            return null;
        }

        var (centroidLng, centroidLat) = ComputeCentroid(ring);
        var wkt = FormatPolygonWkt(ring);

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
