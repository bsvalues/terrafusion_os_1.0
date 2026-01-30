using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TerraFusion.API.Contracts.Health;

public class SystemHealthResponse
{
    public string Status { get; set; } = "Degraded";
    public int ModuleCount { get; set; }
    public int HealthyModules { get; set; }
    public Dictionary<string, bool> SystemComponents { get; set; } = new();
    public List<string> Warnings { get; set; } = new();

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? IntentFilter { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? ModuleCountTotal { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? ModuleCountActive { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? ModuleCountFilteredOut { get; set; }
}
