using System.Threading.Tasks;
using TerraFusion.AI.Interfaces;
using Wasmtime;
using Microsoft.Extensions.Logging;
using System;

namespace TerraFusion.AI.Services
{
    public class PluginSandboxService : IPluginSandboxService
    {
        private readonly ILogger<PluginSandboxService> _logger;

        public PluginSandboxService(ILogger<PluginSandboxService> logger)
        {
            _logger = logger;
        }

        public async System.Threading.Tasks.Task<(bool Success, string Output)> ExecutePluginAsync(byte[] wasmModule, string functionName, object[] parameters)
        {
            try
            {
                using var engine = new Engine();
                using var module = Module.FromBytes(engine, "plugin", wasmModule);
                using var store = new Store(engine);

                var instance = new Instance(store, module, Array.Empty<object>());

                var function = instance.GetFunction(functionName);
                if (function is null)
                {
                    var message = $"Function '{functionName}' not found in the WASM module.";
                    _logger.LogWarning(message);
                    return (false, message);
                }

                _logger.LogInformation("Executing function '{functionName}' in WASM sandbox.", functionName);
                var result = function.Invoke(); // Invoke without parameters for now

                var output = result?.ToString() ?? "(no output)";
                return (true, output);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while executing the plugin in the WASM sandbox.");
                return (false, ex.Message);
            }
        }
    }
}
