namespace TerraFusion.Security.Interfaces;

public interface ITokenRepository
{
    Task<bool> IsRevokedAsync(string jti);
    Task RevokeByUserAsync(string userId);
}
