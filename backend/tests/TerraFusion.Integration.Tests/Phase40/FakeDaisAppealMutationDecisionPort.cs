using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.Services;

namespace TerraFusion.Integration.Tests.Phase40;

internal sealed class FakeDaisAppealMutationDecisionPort : IDaisAppealMutationDecisionPort
{
    public Task<DaisAppealCreateDecisionResult> DecideCreateAsync(
        DaisAppealCreateDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        var ground = Enum.TryParse<DaisAppealGround>(request.Command.Ground, out var parsed)
            ? parsed
            : DaisAppealGround.MARKET_VALUE;
        return Task.FromResult(new DaisAppealCreateDecisionResult
        {
            SchemaVersion = request.SchemaVersion,
            Operation = request.Operation,
            CommandId = request.CommandId,
            CountyId = request.CountyId,
            TraceId = request.TraceId,
            Decision = DaisAppealMutationDecision.accepted,
            Mutation = new DaisAppealCreateMutation
            {
                Ground = ground,
                Status = DaisAppealStatus.filed,
                TaxYear = request.Command.TaxYear ?? request.EffectiveAt.Year,
                FiledAt = request.EffectiveAt,
                UpdatedAt = request.EffectiveAt,
            },
            Violations = [],
        });
    }

    public Task<DaisAppealTransitionDecisionResult> DecideTransitionAsync(
        DaisAppealTransitionDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        var status = Enum.Parse<DaisAppealStatus>(request.Command.Requested.Status);
        return Task.FromResult(new DaisAppealTransitionDecisionResult
        {
            SchemaVersion = request.SchemaVersion,
            Operation = request.Operation,
            CommandId = request.CommandId,
            CountyId = request.CountyId,
            TraceId = request.TraceId,
            Decision = DaisAppealMutationDecision.accepted,
            Mutation = new DaisAppealTransitionMutation
            {
                Status = status,
                UpdatedAt = request.EffectiveAt,
                DecisionAt = status == DaisAppealStatus.decided ? request.EffectiveAt : null,
            },
            Violations = [],
        });
    }
}
