using TerraFusion.API.Services.Valuation.KernelContracts;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities.Forge;

namespace TerraFusion.API.Services.Valuation;

public sealed record ForgeCanonicalPropertyCandidate(
    Guid CountyId,
    string ParcelId,
    IReadOnlyList<string> Aliases);

public sealed record ForgeCanonicalConsumerRequest(
    ForgeCanonicalRequestIdentity Identity,
    ForgeCanonicalAuthorizationAssertion Authorization,
    IReadOnlyList<ForgeCanonicalPropertyCandidate> Properties,
    IReadOnlyList<ForgeCanonicalCamaFact> CamaFacts,
    IReadOnlyList<ForgeCanonicalLandValueFact> LandFacts,
    IReadOnlyList<CostFactorSet> CostFactorSets,
    IReadOnlyList<DepreciationSchedule> DepreciationSchedules);

public sealed record ForgeCanonicalConsumerEvidence(
    string RequestId,
    string FactSnapshotSha256,
    string InputSha256,
    string? BinarySha256,
    string? SourceIdentity,
    string? AuditEventId,
    int StdoutByteCount,
    string? StdoutSha256,
    int StderrByteCount,
    string? StderrSha256);

public sealed record ForgeCanonicalConsumerResult(
    ForgeCanonicalCostConsumerValidatedResult Value,
    ForgeCanonicalConsumerEvidence Evidence);

public interface IForgeCanonicalCostConsumer
{
    Task<ForgeCanonicalConsumerResult> ConsumeAsync(
        ForgeCanonicalConsumerRequest request,
        CancellationToken ct = default);
}
