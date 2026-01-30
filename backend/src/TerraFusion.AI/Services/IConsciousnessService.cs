using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public interface IConsciousnessService
    {
        System.Threading.Tasks.Task<ConsciousnessDataDto> GetConsciousnessDataAsync();
    }
}
