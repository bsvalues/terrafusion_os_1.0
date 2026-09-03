using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Sync;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Assessor-facing, county-bound control surface for the external read-only Sales sync.
/// </summary>
[ApiController]
[Route("api/county-sync/sales")]
[Authorize(Policy = "RequireAssessor")]
[Produces("application/json")]
public sealed class CountyReadOnlySalesSyncController : ControllerBase
{
    private readonly AuthenticatedCanonicalCountyContextProvider _countyContextProvider;
    private readonly ICountyReadOnlySalesSyncService _syncService;

    public CountyReadOnlySalesSyncController(
        AuthenticatedCanonicalCountyContextProvider countyContextProvider,
        ICountyReadOnlySalesSyncService syncService)
    {
        _countyContextProvider = countyContextProvider
            ?? throw new ArgumentNullException(nameof(countyContextProvider));
        _syncService = syncService ?? throw new ArgumentNullException(nameof(syncService));
    }

    [HttpGet]
    public async Task<IActionResult> GetAvailability(CancellationToken cancellationToken = default)
    {
        var context = await GetContextAsync(cancellationToken).ConfigureAwait(false);
        if (context is null) return Forbid();
        var availability = await _syncService.GetAvailabilityAsync(context, cancellationToken)
            .ConfigureAwait(false);
        return Ok(new CountyReadOnlySalesSyncAvailabilityResponse(
            availability.ContractId,
            availability.CountyId,
            context.County!.Key,
            context.County.Name,
            availability.ConnectionConfigured,
            availability.SourceSystem,
            availability.LastSuccessfulSyncAtUtc,
            availability.AvailableSales,
            availability.LatestSaleDate,
            availability.RecommendedStudyYear,
            availability.SalesReviewAvailable,
            availability.Status));
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run(CancellationToken cancellationToken = default)
    {
        var context = await GetContextAsync(cancellationToken).ConfigureAwait(false);
        if (context is null) return Forbid();
        var result = await _syncService.SyncAsync(
            new CountyReadOnlySalesSyncRequest(context), cancellationToken).ConfigureAwait(false);
        if (result.Disposition == CountyReadOnlySalesSyncDisposition.Completed
            && result.Receipt is not null)
        {
            return Ok(new CountyReadOnlySalesSyncResponse(
                context.County!.Key,
                context.County.Name,
                result.Receipt));
        }

        var statusCode = result.Disposition == CountyReadOnlySalesSyncDisposition.Failed
            ? StatusCodes.Status502BadGateway
            : result.DenialCode switch
            {
                CountyReadOnlySalesSyncDenialCode.ConnectionNotConfigured => StatusCodes.Status404NotFound,
                CountyReadOnlySalesSyncDenialCode.InvalidAuthority => StatusCodes.Status403Forbidden,
                _ => StatusCodes.Status409Conflict,
            };
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = "County read-only Sales sync did not complete.",
            Detail = "The authenticated county source did not satisfy the protected read-only sync contract.",
        };
        problem.Extensions["code"] = result.Disposition == CountyReadOnlySalesSyncDisposition.Failed
            ? "COUNTY_SYNC_FAILED"
            : $"COUNTY_SYNC_{result.DenialCode.ToString().ToUpperInvariant()}";
        return new ObjectResult(problem) { StatusCode = statusCode };
    }

    private async Task<AuthenticatedCanonicalCountyContextResult?> GetContextAsync(
        CancellationToken cancellationToken)
    {
        var context = await _countyContextProvider.GetCurrentAsync(cancellationToken)
            .ConfigureAwait(false);
        return context.Decision == AuthenticatedCanonicalCountyContextDecision.Established
            && context.County is not null
            && context.CountyId is not null
            ? context
            : null;
    }
}

public sealed record CountyReadOnlySalesSyncAvailabilityResponse(
    string ContractId,
    Guid CountyId,
    string CountyKey,
    string CountyName,
    bool ConnectionConfigured,
    string? SourceSystem,
    DateTimeOffset? LastSuccessfulSyncAtUtc,
    int AvailableSales,
    string? LatestSaleDate,
    int? RecommendedStudyYear,
    bool SalesReviewAvailable,
    string Status);

public sealed record CountyReadOnlySalesSyncResponse(
    string CountyKey,
    string CountyName,
    CountyReadOnlySalesSyncReceipt Receipt);
