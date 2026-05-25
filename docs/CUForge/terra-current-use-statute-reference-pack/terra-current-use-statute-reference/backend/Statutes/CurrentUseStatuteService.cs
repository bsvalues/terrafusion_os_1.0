
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Statutes;

public interface ICurrentUseStatuteService
{
    Task<IReadOnlyList<CurrentUseStatuteReferenceDto>> GetReferencesAsync(
        string stateCode,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CurrentUseRuleProvenanceDto>> GetRuleProvenanceAsync(
        CancellationToken cancellationToken);
}

public sealed class CurrentUseStatuteService : ICurrentUseStatuteService
{
    public Task<IReadOnlyList<CurrentUseStatuteReferenceDto>> GetReferencesAsync(
        string stateCode,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(
            (IReadOnlyList<CurrentUseStatuteReferenceDto>)
            CurrentUseStatuteRegistry.References
                .Where(x => x.StateCode == stateCode)
                .ToArray());
    }

    public Task<IReadOnlyList<CurrentUseRuleProvenanceDto>> GetRuleProvenanceAsync(
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseRuleProvenanceDto> result =
        [
            new(
                "farm_ag.rollback_years.after_2025_09_01",
                "2025.09.01",
                "RCW 84.34.108",
                "Farm & Agricultural rollback reduced to four years after statutory cutover.")
        ];

        return Task.FromResult(result);
    }
}
