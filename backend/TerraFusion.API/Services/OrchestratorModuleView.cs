using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.API.Health;

namespace TerraFusion.API.Services;

public sealed class OrchestratorModuleView : IOrchestratorView
{
    private readonly IUnifiedOrchestrationService _orchestrationService;
    private readonly ILogger<OrchestratorModuleView> _logger;

    public OrchestratorModuleView(
        IUnifiedOrchestrationService orchestrationService,
        ILogger<OrchestratorModuleView> logger)
    {
        _orchestrationService = orchestrationService ?? throw new ArgumentNullException(nameof(orchestrationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<IReadOnlyList<string>> GetEnabledNamesAsync(CancellationToken ct = default)
    {
        try
        {
            var statuses = await _orchestrationService.GetModuleStatusesAsync();
            
            var enabledNames = statuses
                .Where(s => s.IsHealthy || s.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.ModuleName)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .OrderBy(n => n)
                .ToList();
                
            _logger.LogDebug("Orchestrator has {Count} enabled modules", enabledNames.Count);
            return enabledNames;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting enabled modules from orchestrator");
            // Return empty list instead of throwing to allow health check to continue
            return new List<string>();
        }
    }
}
