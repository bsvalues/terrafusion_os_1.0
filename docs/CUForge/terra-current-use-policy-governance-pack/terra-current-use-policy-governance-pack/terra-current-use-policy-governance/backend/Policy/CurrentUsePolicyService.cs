
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Policy;

public interface ICurrentUsePolicyService
{
    Task<IReadOnlyList<CurrentUsePolicyPackDto>> GetPolicyPacksAsync(Guid countyId, CancellationToken cancellationToken);
    Task<ResolvedCurrentUsePolicyDto> ResolvePolicyAsync(ResolveCurrentUsePolicyRequestDto request, CancellationToken cancellationToken);
}

public sealed class CurrentUsePolicyService : ICurrentUsePolicyService
{
    private static readonly List<CurrentUsePolicyPackDto> Packs =
    [
        new CurrentUsePolicyPackDto(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            "Current Use 2025 Policy Pack",
            "2025.09.01",
            CurrentUsePolicyStatus.Active,
            new DateOnly(2025, 9, 1),
            null,
            new[]
            {
                new CurrentUsePolicyRuleDto(
                    "farm_ag.rollback_years.after_2025_09_01",
                    "ROLLBACK_YEARS",
                    "4",
                    "Farm & Agricultural rollback reduced to four years after 2025-09-01.")
            },
            "Initial production rule pack.",
            DateTimeOffset.UtcNow,
            "policy.admin",
            DateTimeOffset.UtcNow,
            "policy.admin")
    ];

    public Task<IReadOnlyList<CurrentUsePolicyPackDto>> GetPolicyPacksAsync(
        Guid countyId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUsePolicyPackDto> result = Packs
            .Where(x => x.CountyId == countyId)
            .ToArray();

        return Task.FromResult(result);
    }

    public Task<ResolvedCurrentUsePolicyDto> ResolvePolicyAsync(
        ResolveCurrentUsePolicyRequestDto request,
        CancellationToken cancellationToken)
    {
        var active = Packs.First(x =>
            x.CountyId == request.CountyId &&
            x.Status == CurrentUsePolicyStatus.Active);

        return Task.FromResult(
            new ResolvedCurrentUsePolicyDto(
                active.PolicyPackId,
                active.PolicyVersion,
                active.Rules,
                active.EffectiveStartDate));
    }
}
