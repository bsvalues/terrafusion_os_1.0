
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Statutes;

public static class CurrentUseStatuteRegistry
{
    public static readonly IReadOnlyList<CurrentUseStatuteReferenceDto> References =
    [
        new(
            "WA",
            "RCW 84.34",
            "Current Use Taxation",
            "Washington Current Use and Open Space taxation framework.",
            "2025.09.01",
            "https://app.leg.wa.gov/rcw/default.aspx?cite=84.34"),

        new(
            "WA",
            "RCW 84.34.108",
            "Rollback Tax",
            "Additional tax, interest, and penalty after removal.",
            "2025.09.01",
            "https://app.leg.wa.gov/rcw/default.aspx?cite=84.34.108")
    ];
}
