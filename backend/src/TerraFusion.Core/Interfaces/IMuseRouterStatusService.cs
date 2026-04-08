using TerraFusion.Core.DTOs.Pilot;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Probes each configured Muse router lane and reports live/offline state.
/// Used by GET /api/pilot/router/status.
/// </summary>
public interface IMuseRouterStatusService
{
    Task<RouterStatusResponse> GetStatusAsync(CancellationToken ct = default);
}
