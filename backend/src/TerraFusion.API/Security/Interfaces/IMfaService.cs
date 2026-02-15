namespace TerraFusion.API.Security.Interfaces;

/// <summary>
/// Multi-Factor Authentication service for TOTP-based 2FA.
/// FISMA AC-7 / IA-2(1): MFA enforcement for privileged accounts.
/// </summary>
public interface IMfaService
{
    Task<bool> ValidateMfaCodeAsync(string userId, string code);
    Task<string> GenerateMfaSecretAsync(string userId);
    Task<bool> IsMfaEnabledAsync(string userId);
    Task EnableMfaAsync(string userId, string secret);
    Task DisableMfaAsync(string userId);

    /// <summary>Generate current TOTP code (dev/testing only).</summary>
    Task<string> GenerateTotpCodeAsync(string userId);
}
