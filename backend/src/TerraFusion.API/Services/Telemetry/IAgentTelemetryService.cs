using TerraFusion.API.Contracts.Agents;

namespace TerraFusion.API.Services.Telemetry;

public interface IAgentTelemetryService
{
    AgentSystemStatusResponse GetStatus();
    AgentEventsResponse GetEvents(int limit, string? afterCursor);
    void Emit(string level, string agent, string topic, string message, object? data = null, string? correlationId = null);
}
