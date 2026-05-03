using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Retired AI-side consciousness service.
    /// Synthetic random output is intentionally blocked until a governed data source exists.
    /// </summary>
    public class ConsciousnessService : IConsciousnessService
    {
        public Task<ConsciousnessDataDto> GetConsciousnessDataAsync()
        {
            return Task.FromException<ConsciousnessDataDto>(
                new NotSupportedException(
                    "Governed consciousness data is unavailable. The synthetic AI-side ConsciousnessService has been retired."));
        }
    }
}
