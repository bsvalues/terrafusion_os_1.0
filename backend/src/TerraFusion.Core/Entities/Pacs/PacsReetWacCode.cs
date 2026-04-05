namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// PACS lookup table: dbo.reet_wac_code
///
/// WAC 458-61A real estate excise tax (REET) exemption codes. When a sale's wac_cd
/// is non-empty, the buyer claimed an excise tax exemption under this WAC code.
///
/// Key fields:
///   <see cref="Inactive"/> — when true, the code is retired / no longer used.
///     An inactive code on a sale means no active exemption applies → treat as qualified.
///   <see cref="SysFlag"/> — system-reserved code; not county-assignable.
///
/// FK: sale.wac_cd → reet_wac_code.wac_cd
/// </summary>
public class PacsReetWacCode
{
    /// <summary>WAC 458-61A exemption code (e.g. "9a", "1", "2b").</summary>
    public string WacCd { get; set; } = null!;

    /// <summary>Human-readable description of the WAC exemption.</summary>
    public string? WacDesc { get; set; }

    /// <summary>
    /// When true, this code is retired/inactive.
    /// An inactive REET code on a sale means no active exemption is in force
    /// — qualify the sale normally rather than treating it as exempt.
    /// </summary>
    public bool Inactive { get; set; }

    /// <summary>System-reserved code; not directly assignable by county staff.</summary>
    public bool SysFlag { get; set; }
}
