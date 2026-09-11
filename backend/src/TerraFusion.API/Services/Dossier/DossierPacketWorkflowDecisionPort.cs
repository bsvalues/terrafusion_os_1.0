using System.Text.Json.Nodes;
using TerraFusion.API.Configuration;
using TerraFusion.API.DTOs;

namespace TerraFusion.API.Services.Dossier;

public sealed class DossierPacketWorkflowDecisionPort(DossierPacketWorkflowProcessHost? host) : IDossierPacketWorkflowDecisionPort
{
    public JsonObject Provenance(string traceId) => new()
    {
        ["suiteCommit"] = DossierPacketWorkflowOptions.ExpectedCommit,
        ["artifactSha256"] = DossierPacketWorkflowOptions.ExpectedArtifactSha256,
        ["contractVersion"] = "1.0.0", ["traceId"] = traceId
    };
    public Task<JsonObject> DecideAsync(JsonObject request, CancellationToken cancellationToken)
    {
        if (host == null) throw new DossierWorkflowException(503, "CANONICAL_UNAVAILABLE", "Canonical packet workflow is disabled.");
        if (!JsonNode.DeepEquals(request["provenance"], Provenance(request["traceId"]?.GetValue<string>() ?? "")))
            throw new DossierWorkflowException(503, "ARTIFACT_IDENTITY_MISMATCH", "Request does not bind protected Dossier provenance.");
        return host.DecideAsync(request, cancellationToken);
    }
}
