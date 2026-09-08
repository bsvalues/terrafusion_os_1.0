using System.Text.Json.Nodes;

namespace TerraFusion.API.Services.Dossier;

public interface IDossierPacketWorkflowDecisionPort
{
    JsonObject Provenance(string traceId);
    Task<JsonObject> DecideAsync(JsonObject request, CancellationToken cancellationToken);
}
