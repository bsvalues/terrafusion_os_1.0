using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.Services;

namespace TerraFusion.Unit.Tests.Dais;

internal sealed class FakeDaisAppealMutationDecisionPort : IDaisAppealMutationDecisionPort
{
    private readonly Func<DaisAppealCreateDecisionRequest, CancellationToken, Task<DaisAppealCreateDecisionResult>> _create;
    private readonly Func<DaisAppealTransitionDecisionRequest, CancellationToken, Task<DaisAppealTransitionDecisionResult>> _transition;

    public FakeDaisAppealMutationDecisionPort(
        Func<DaisAppealCreateDecisionRequest, CancellationToken, Task<DaisAppealCreateDecisionResult>>? create = null,
        Func<DaisAppealTransitionDecisionRequest, CancellationToken, Task<DaisAppealTransitionDecisionResult>>? transition = null)
    {
        _create = create ?? AcceptCreate;
        _transition = transition ?? AcceptTransition;
    }

    public List<DaisAppealCreateDecisionRequest> CreateRequests { get; } = [];
    public List<DaisAppealTransitionDecisionRequest> TransitionRequests { get; } = [];

    public async Task<DaisAppealCreateDecisionResult> DecideCreateAsync(
        DaisAppealCreateDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        CreateRequests.Add(request);
        return await _create(request, cancellationToken);
    }

    public async Task<DaisAppealTransitionDecisionResult> DecideTransitionAsync(
        DaisAppealTransitionDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        TransitionRequests.Add(request);
        return await _transition(request, cancellationToken);
    }

    public static Task<DaisAppealCreateDecisionResult> AcceptCreate(
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

    public static Task<DaisAppealTransitionDecisionResult> AcceptTransition(
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
