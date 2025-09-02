namespace TerraFusion.Security.Interfaces
{
    public interface IMfaService
    {
        Task<bool> ValidateMfaCodeAsync(string userId, string code);
        Task<string> GenerateMfaCodeAsync(string userId);
        Task<bool> IsMfaEnabledAsync(string userId);
        Task EnableMfaAsync(string userId);
        Task DisableMfaAsync(string userId);
    }
}
