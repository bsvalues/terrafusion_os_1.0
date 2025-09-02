using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public interface ISecurityService
    {
        Task<SecurityDataDto> GetSecurityDataAsync();
    }
}
