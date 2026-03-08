namespace TerraFusion.Security.Interfaces;

/// <summary>
/// Service for checking whether a password appears in a common/breached password list.
/// </summary>
public interface ICommonPasswordService
{
    /// <summary>
    /// Returns true if the supplied password is found in the common password blocklist.
    /// </summary>
    bool IsCommon(string password);
}
