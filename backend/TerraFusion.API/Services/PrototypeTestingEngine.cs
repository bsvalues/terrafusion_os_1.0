using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TerraFusion.API.Services
{
    // Lightweight prototype engine to back the Playground controller
    public class PrototypeTestingEngine
    {
        private static readonly List<string> DefaultScenarios = new()
        {
            "hello-world",
            "pilt-sample",
            "permit-ai"
        };

        public Task<IReadOnlyList<string>> GetScenariosAsync()
        {
            return Task.FromResult<IReadOnlyList<string>>(DefaultScenarios);
        }

        public Task<bool> ValidateScenarioAsync(string scenarioId)
        {
            var valid = !string.IsNullOrWhiteSpace(scenarioId) && DefaultScenarios.Contains(scenarioId);
            return Task.FromResult(valid);
        }

        public Task<string> StartScenarioAsync(string scenarioId, IDictionary<string, string>? parameters = null)
        {
            // In a full implementation this would enqueue a job and return a tracking id
            var trackingId = $"scn_{scenarioId}_{System.Guid.NewGuid().ToString("N").Substring(0, 8)}";
            return Task.FromResult(trackingId);
        }
    }
}
