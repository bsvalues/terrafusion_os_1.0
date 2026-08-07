using Microsoft.Extensions.Options;
using TerraFusion.API.Adapters;
using TerraFusion.API.Configuration;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.GIS.ArcGisRest;

namespace TerraFusion.API.Services.Atlas;

public sealed class AtlasProjectionConsumer
{
    private readonly IParcelGeometryReader _reader;
    private readonly IAtlasProjectionProcessHost _processHost;
    private readonly AtlasProjectionOptions _options;

    public AtlasProjectionConsumer(
        IParcelGeometryReader reader,
        IAtlasProjectionProcessHost processHost,
        IOptions<AtlasProjectionOptions> options)
    {
        _reader = reader;
        _processHost = processHost;
        _options = options.Value;
    }

    public async Task<AtlasProjectionConsumerResult> ProjectAsync(
        Guid countyId,
        Guid tfParcelId,
        CancellationToken cancellationToken = default)
    {
        if (_options.Mode != AtlasProjectionMode.LocalExact)
        {
            throw new AtlasProjectionConsumerException("Canonical Atlas projection is disabled.");
        }
        if (countyId == Guid.Empty)
        {
            throw new ArgumentException("CountyId must be a non-empty Guid.", nameof(countyId));
        }
        if (tfParcelId == Guid.Empty)
        {
            throw new ArgumentException("TfParcelId must be a non-empty Guid.", nameof(tfParcelId));
        }

        var modulePath = RequireCanonicalAbsoluteModulePath(_options.ModulePath);
        var lookup = await _reader.GetGeometryAsync(tfParcelId, cancellationToken).ConfigureAwait(false);

        if (lookup.Kind == ParcelGeometryLookupKind.NotFound)
        {
            return AtlasProjectionConsumerResult.NotFound();
        }

        if (lookup.CountyId is null || lookup.CountyId.Value != countyId)
        {
            return AtlasProjectionConsumerResult.NotFound();
        }

        if (lookup.Kind == ParcelGeometryLookupKind.NoGeometry)
        {
            return AtlasProjectionConsumerResult.Unavailable(countyId, tfParcelId);
        }

        if (lookup.Kind != ParcelGeometryLookupKind.Found || lookup.Payload is null)
        {
            throw new AtlasProjectionConsumerException("Canonical parcel geometry lookup was internally inconsistent.");
        }

        var source = lookup.Payload;
        if (source.CountyId != countyId || source.TfParcelId != tfParcelId)
        {
            throw new AtlasProjectionConsumerException("Canonical parcel geometry identity did not match the request.");
        }

        var request = new AtlasParcelSpatialReadRequest
        {
            CountyId = countyId.ToString("D"),
            ParcelId = tfParcelId.ToString("D"),
        };
        string exchangeJson;
        try
        {
            exchangeJson = AtlasSpatialReadAdapter.Serialize(request, source);
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
        {
            throw new AtlasProjectionConsumerException(
                "Canonical parcel geometry failed Atlas contract validation.",
                exception);
        }

        var projection = await _processHost.ProjectAsync(
                modulePath,
                AtlasProjectionOptions.ExpectedModuleSha256,
                exchangeJson,
                cancellationToken)
            .ConfigureAwait(false);

        if (!projection.Success || projection.Outcome != AtlasProjectionOutcome.Polygon)
        {
            throw new AtlasProjectionConsumerException(
                $"Canonical Atlas projection failed closed with {projection.Failure}/{projection.Outcome}.");
        }
        if (!string.Equals(projection.CountyId, request.CountyId, StringComparison.Ordinal)
            || !string.Equals(projection.ParcelId, request.ParcelId, StringComparison.Ordinal)
            || !string.Equals(projection.EvidenceState, "canonical", StringComparison.Ordinal)
            || string.IsNullOrWhiteSpace(projection.NormalizedFeatureJson)
            || string.Equals(projection.NormalizedFeatureJson, "null", StringComparison.Ordinal))
        {
            throw new AtlasProjectionConsumerException("Canonical Atlas projection returned mismatched identity or evidence.");
        }
        if (!string.Equals(
                projection.SourceModuleSha256,
                AtlasProjectionOptions.ExpectedModuleSha256,
                StringComparison.Ordinal)
            || !string.Equals(
                projection.CopiedModuleSha256,
                AtlasProjectionOptions.ExpectedModuleSha256,
                StringComparison.Ordinal))
        {
            throw new AtlasProjectionConsumerException("Canonical Atlas projection did not prove the exact module hash.");
        }

        return AtlasProjectionConsumerResult.Polygon(
            projection.NormalizedFeatureJson,
            request.CountyId,
            request.ParcelId,
            projection.SourceModuleSha256!,
            projection.CopiedModuleSha256!);
    }

    private static string RequireCanonicalAbsoluteModulePath(string modulePath)
    {
        if (string.IsNullOrWhiteSpace(modulePath) || !Path.IsPathFullyQualified(modulePath))
        {
            throw new AtlasProjectionConsumerException("Atlas module path must be an absolute local path.");
        }

        var canonical = Path.GetFullPath(modulePath);
        var comparison = OperatingSystem.IsWindows()
            ? StringComparison.OrdinalIgnoreCase
            : StringComparison.Ordinal;
        if (!string.Equals(canonical, modulePath, comparison))
        {
            throw new AtlasProjectionConsumerException("Atlas module path must already be canonical.");
        }

        return canonical;
    }
}

public enum AtlasProjectionConsumerOutcome
{
    Polygon = 0,
    Unavailable = 1,
    NotFound = 2,
}

public sealed record AtlasProjectionConsumerResult(
    AtlasProjectionConsumerOutcome Outcome,
    string? NormalizedFeatureJson,
    string? CountyId,
    string? ParcelId,
    string? EvidenceState,
    string? SourceModuleSha256,
    string? CopiedModuleSha256)
{
    public static AtlasProjectionConsumerResult Polygon(
        string normalizedFeatureJson,
        string countyId,
        string parcelId,
        string sourceModuleSha256,
        string copiedModuleSha256) =>
        new(
            AtlasProjectionConsumerOutcome.Polygon,
            normalizedFeatureJson,
            countyId,
            parcelId,
            "canonical",
            sourceModuleSha256,
            copiedModuleSha256);

    public static AtlasProjectionConsumerResult Unavailable(Guid countyId, Guid tfParcelId) =>
        new(
            AtlasProjectionConsumerOutcome.Unavailable,
            "null",
            countyId.ToString("D"),
            tfParcelId.ToString("D"),
            "unavailable",
            null,
            null);

    public static AtlasProjectionConsumerResult NotFound() =>
        new(AtlasProjectionConsumerOutcome.NotFound, null, null, null, null, null, null);
}

public sealed class AtlasProjectionConsumerException : Exception
{
    public AtlasProjectionConsumerException(string message)
        : base(message)
    {
    }

    public AtlasProjectionConsumerException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
