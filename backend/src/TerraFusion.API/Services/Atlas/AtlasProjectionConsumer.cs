using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Adapters;
using TerraFusion.API.Configuration;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.GIS.ArcGisRest;
using TerraFusion.Data;

namespace TerraFusion.API.Services.Atlas;

public sealed class AtlasProjectionConsumer
{
    private readonly IParcelGeometryReader _reader;
    private readonly IAtlasParcelIdentityResolver _identityResolver;
    private readonly IAtlasParcelCountyScopeVerifier _countyScopeVerifier;
    private readonly IAtlasProjectionProcessHost _processHost;
    private readonly AtlasProjectionOptions _options;

    public AtlasProjectionConsumer(
        IParcelGeometryReader reader,
        IAtlasParcelIdentityResolver identityResolver,
        IAtlasParcelCountyScopeVerifier countyScopeVerifier,
        IAtlasProjectionProcessHost processHost,
        IOptions<AtlasProjectionOptions> options)
    {
        _reader = reader;
        _identityResolver = identityResolver;
        _countyScopeVerifier = countyScopeVerifier;
        _processHost = processHost;
        _options = options.Value;
    }

    public async Task<AtlasProjectionConsumerResult> ProjectAsync(
        Guid countyId,
        string parcelNumber,
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
        if (string.IsNullOrWhiteSpace(parcelNumber) || parcelNumber.Length > 50)
        {
            throw new ArgumentException("ParcelNumber must contain 1-50 characters.", nameof(parcelNumber));
        }

        var modulePath = RequireCanonicalAbsoluteModulePath(_options.ModulePath);
        var tfParcelId = await _identityResolver
            .ResolveInCountyAsync(countyId, parcelNumber, cancellationToken)
            .ConfigureAwait(false);
        if (tfParcelId is null)
        {
            return AtlasProjectionConsumerResult.NotFound();
        }

        if (!await _countyScopeVerifier
                .ExistsInCountyAsync(countyId, tfParcelId.Value, cancellationToken)
                .ConfigureAwait(false))
        {
            return AtlasProjectionConsumerResult.NotFound();
        }

        var lookup = await _reader.GetGeometryAsync(tfParcelId.Value, cancellationToken).ConfigureAwait(false);

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
            return AtlasProjectionConsumerResult.Unavailable(countyId, tfParcelId.Value);
        }

        if (lookup.Kind != ParcelGeometryLookupKind.Found || lookup.Payload is null)
        {
            throw new AtlasProjectionConsumerException("Canonical parcel geometry lookup was internally inconsistent.");
        }

        var source = lookup.Payload;
        if (source.CountyId != countyId || source.TfParcelId != tfParcelId.Value)
        {
            throw new AtlasProjectionConsumerException("Canonical parcel geometry identity did not match the request.");
        }

        var request = new AtlasParcelSpatialReadRequest
        {
            CountyId = countyId.ToString("D"),
            ParcelId = tfParcelId.Value.ToString("D"),
        };
        string exchangeJson;
        try
        {
            var resultJson = AtlasSpatialReadAdapter.Serialize(request, source);
            exchangeJson = $"{{\"result\":{resultJson}}}";
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
        {
            throw new AtlasProjectionConsumerException(
                $"Canonical parcel geometry failed Atlas contract validation: {exception.Message}",
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

public interface IAtlasParcelIdentityResolver
{
    Task<Guid?> ResolveInCountyAsync(
        Guid countyId,
        string parcelNumber,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Resolves a Workbench parcel number to exactly one sovereign parcel inside
/// the authenticated county. Missing and ambiguous matches are intentionally
/// indistinguishable.
/// </summary>
public sealed class AtlasParcelIdentityResolver(TerraFusionDbContext db)
    : IAtlasParcelIdentityResolver
{
    public async Task<Guid?> ResolveInCountyAsync(
        Guid countyId,
        string parcelNumber,
        CancellationToken cancellationToken = default)
    {
        var matches = await db.TfParcels
            .AsNoTracking()
            .Where(parcel => parcel.CountyId == countyId && parcel.ParcelNumber == parcelNumber)
            .Select(parcel => parcel.TfParcelId)
            .Take(2)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return matches.Count == 1 ? matches[0] : null;
    }
}

public interface IAtlasParcelCountyScopeVerifier
{
    Task<bool> ExistsInCountyAsync(
        Guid countyId,
        Guid tfParcelId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Prevents a cross-county parcel or geometry from being materialized by the
/// canonical reader. The reader remains the only geometry source after this
/// county-scoped identity predicate succeeds.
/// </summary>
public sealed class AtlasParcelCountyScopeVerifier(TerraFusionDbContext db)
    : IAtlasParcelCountyScopeVerifier
{
    public Task<bool> ExistsInCountyAsync(
        Guid countyId,
        Guid tfParcelId,
        CancellationToken cancellationToken = default) =>
        db.TfParcels
            .AsNoTracking()
            .AnyAsync(
                parcel => parcel.TfParcelId == tfParcelId && parcel.CountyId == countyId,
                cancellationToken);
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
