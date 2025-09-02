using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public interface IConsciousnessService
    {
        Task<ConsciousnessDataDto> GetConsciousnessDataAsync();
    }
}
