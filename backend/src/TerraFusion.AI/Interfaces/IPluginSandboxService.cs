using System.Threading.Tasks;

namespace TerraFusion.AI.Interfaces
{
    public interface IPluginSandboxService
    {
        Task<(bool Success, string Output)> ExecutePluginAsync(byte[] wasmModule, string functionName, object[] parameters);
    }
}
