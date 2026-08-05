using System.Text.Json;
using TerraFusion.API.Services.Valuation.KernelContracts;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities.Forge;

namespace TerraFusion.API.Services.Valuation;

/// <summary>
/// Resolves explicit, host-proven candidate sets and invokes the manifest-pinned Forge kernel.
/// It owns no persistence, provider, authorization, or runtime-selection behavior.
/// </summary>
public sealed class ForgeCanonicalCostConsumer : IForgeCanonicalCostConsumer
{
    private const string ForgeSourceIdentity =
        "git:24059c3642339f36877cb454ca63683180915b71";
    private readonly IValuationKernelClient _kernel;

    public ForgeCanonicalCostConsumer(IValuationKernelClient kernel) => _kernel = kernel;

    public async Task<ForgeCanonicalConsumerResult> ConsumeAsync(
        ForgeCanonicalConsumerRequest request,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.Identity);
        ArgumentNullException.ThrowIfNull(request.Authorization);

        var property = Single(
            request.Properties,
            candidate => candidate.CountyId == request.Identity.CountyId
                && (string.Equals(candidate.ParcelId, request.Identity.ParcelId, StringComparison.Ordinal)
                    || candidate.Aliases.Any(alias =>
                        string.Equals(alias, request.Identity.ParcelId, StringComparison.Ordinal))),
            "property");

        var canonicalIdentity = request.Identity with { ParcelId = property.ParcelId };
        var cama = Single(
            request.CamaFacts,
            candidate => Matches(candidate.CountyId, candidate.ParcelId, candidate.TaxYear, canonicalIdentity),
            "CAMA fact");
        var land = Single(
            request.LandFacts,
            candidate => Matches(candidate.CountyId, candidate.ParcelId, candidate.TaxYear, canonicalIdentity),
            "land fact");
        var costSet = Single(
            request.CostFactorSets,
            candidate => candidate.CountyId == canonicalIdentity.CountyId
                && candidate.EffectiveYear == canonicalIdentity.TaxYear,
            "cost factor set");
        var depreciation = Single(
            request.DepreciationSchedules,
            candidate => candidate.CountyId == canonicalIdentity.CountyId
                && candidate.EffectiveYear == canonicalIdentity.TaxYear,
            "depreciation schedule");

        var pin = new ForgeCostSchedulePin(
            canonicalIdentity.CountyId,
            canonicalIdentity.TaxYear,
            costSet.Id,
            costSet.Version,
            ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costSet),
            depreciation.Id,
            depreciation.Version,
            ForgeCostScheduleProjection.ComputeDepreciationScheduleContentSha256(depreciation));

        var projection = ForgeCanonicalCostConsumerProjection.Create(new(
            canonicalIdentity,
            request.Authorization,
            cama,
            land,
            costSet,
            depreciation,
            pin));

        using var attributes = JsonDocument.Parse("{}");
        var payload = new ValuationKernelPayload(
            new ValuationSubject(canonicalIdentity.ParcelId, attributes.RootElement.Clone()),
            new ValuationCostBreakdown(
                projection.KernelRequest.ReplacementCost,
                projection.KernelRequest.Depreciation,
                projection.KernelRequest.Rcnld),
            new ValuationModel(projection.KernelRequest.LandValue, null));

        var invocation = await _kernel.ValuateAsync(
            payload,
            KernelExecutionContext.Create(canonicalIdentity.CorrelationId),
            ct);

        ValidateInvocation(invocation, canonicalIdentity);
        var data = invocation.Data!;
        var validated = ForgeCanonicalCostConsumerProjection.ValidateResponse(
            projection,
            new(data.TotalValue, data.Components.Land, data.Components.Building));

        return new ForgeCanonicalConsumerResult(
            validated,
            new ForgeCanonicalConsumerEvidence(
                canonicalIdentity.CorrelationId,
                projection.FactSnapshotSha256,
                invocation.InputHash,
                invocation.KernelBinarySha256,
                invocation.AuditEvent?.Hash,
                invocation.AuditEvent?.EventId,
                invocation.StdoutByteCount,
                invocation.StdoutSha256,
                invocation.StderrByteCount,
                invocation.StderrSha256));
    }

    private static void ValidateInvocation(
        KernelInvocationResult<ValuationKernelResult> invocation,
        ForgeCanonicalRequestIdentity identity)
    {
        if (!invocation.Success || invocation.Data is null)
            throw new InvalidOperationException(
                $"Canonical Forge kernel failed closed: {invocation.FailureMode?.ToString() ?? "Unknown"}.");
        if (!string.Equals(invocation.KernelName, "terraforge.kernel.valuation", StringComparison.Ordinal))
            throw new InvalidOperationException("Kernel identity did not match the canonical Forge valuation kernel.");
        if (!string.Equals(invocation.RequestId, identity.CorrelationId, StringComparison.Ordinal))
            throw new InvalidOperationException("Kernel request identity did not match the caller correlation identity.");
        if (invocation.AuditEvent is null
            || !string.Equals(invocation.AuditEvent.Hash, ForgeSourceIdentity, StringComparison.OrdinalIgnoreCase)
            || !string.Equals(invocation.AuditEvent.ResourceId, identity.ParcelId, StringComparison.Ordinal)
            || !string.Equals(invocation.AuditEvent.Module, "terraforge.kernel.valuation", StringComparison.Ordinal)
            || !string.Equals(invocation.AuditEvent.Action, "valuate", StringComparison.Ordinal))
            throw new InvalidOperationException("Kernel source, audit, or parcel identity did not match.");
        if (!IsSha256(invocation.InputHash) || !IsSha256(invocation.KernelBinarySha256))
            throw new InvalidOperationException("Kernel input or binary provenance was absent.");
    }

    private static bool Matches(Guid countyId, string parcelId, int year, ForgeCanonicalRequestIdentity identity)
        => countyId == identity.CountyId
            && year == identity.TaxYear
            && string.Equals(parcelId, identity.ParcelId, StringComparison.Ordinal);

    private static bool IsSha256(string? value)
        => value is { Length: 64 } && value.All(character =>
            character is >= '0' and <= '9' or >= 'a' and <= 'f');

    private static T Single<T>(IReadOnlyList<T>? candidates, Func<T, bool> predicate, string label)
    {
        if (candidates is null)
            throw new InvalidOperationException($"{label} candidates are required.");
        var matches = candidates.Where(predicate).Take(2).ToArray();
        return matches.Length switch
        {
            1 => matches[0],
            0 => throw new InvalidOperationException($"Exactly one {label} is required; none matched."),
            _ => throw new InvalidOperationException($"Exactly one {label} is required; the match was ambiguous."),
        };
    }
}
