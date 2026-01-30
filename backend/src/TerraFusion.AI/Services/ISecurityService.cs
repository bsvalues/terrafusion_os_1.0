using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public interface ISecurityService
    {
        System.Threading.Tasks.Task<SecurityDataDto> GetSecurityDataAsync();
    }
}
