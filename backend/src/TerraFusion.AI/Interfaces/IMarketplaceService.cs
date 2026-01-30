using System.Threading.Tasks;
using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Interfaces
{
    public interface IMarketplaceService
    {
        Task<(bool Success, string Message)> ProcessPluginSubmissionAsync(PluginSubmissionDto submissionDto);
        Task<(bool Success, string Message)> PublishPluginAsync(PluginPublishDto publishDto);
    }
}
