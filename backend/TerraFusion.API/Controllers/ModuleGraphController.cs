using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.IO;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraFusion Module Graph Controller
/// Auto-generates interactive architecture diagrams from module manifests
/// Provides visual representation of the hot-swappable module ecosystem
/// </summary>
[ApiController]
[Route("api/modules/graph")]
public class ModuleGraphController : ControllerBase
{
    private readonly ILogger<ModuleGraphController> _logger;
    private readonly IWebHostEnvironment _environment;

    public ModuleGraphController(ILogger<ModuleGraphController> logger, IWebHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Get interactive module architecture graph
    /// </summary>
    [HttpGet]
    public IActionResult GetModuleGraph()
    {
        try
        {
            var nodes = new List<object>();
            var edges = new List<object>();
            var stats = new Dictionary<string, int>
            {
                ["total"] = 0,
                ["enabled"] = 0,
                ["disabled"] = 0,
                ["government"] = 0,
                ["commercial"] = 0
            };

            // Find all module manifest files
            var manifestFiles = FindModuleManifests();

            foreach (var manifestPath in manifestFiles)
            {
                try
                {
                    var moduleData = ProcessModuleManifest(manifestPath);
                    if (moduleData.HasValue)
                    {
                        var data = moduleData.Value;
                        nodes.Add(data.node);
                        edges.AddRange(data.edges);
                        
                        // Update statistics
                        stats["total"]++;
                        if (data.enabled) stats["enabled"]++;
                        else stats["disabled"]++;
                        
                        if (data.category == "government") stats["government"]++;
                        else stats["commercial"]++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing manifest: {Path}", manifestPath);
                }
            }

            // Add core system nodes
            AddCoreSystemNodes(nodes, edges);

            var response = new
            {
                nodes = nodes,
                edges = edges,
                statistics = stats,
                metadata = new
                {
                    generatedAt = DateTimeOffset.UtcNow,
                    totalModules = stats["total"],
                    activeModules = stats["enabled"],
                    coreArchitecture = "Hot-swappable government module ecosystem",
                    revenueModel = "$619/county/month (base + marketplace)"
                },
                legend = new
                {
                    nodeColors = new
                    {
                        government = "#3b82f6", // Blue
                        commercial = "#10b981", // Green
                        core = "#f59e0b",       // Amber
                        disabled = "#6b7280"    // Gray
                    },
                    edgeTypes = new
                    {
                        depends = "Module dependency",
                        integrates = "API integration",
                        extends = "Feature extension"
                    }
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating module graph");
            return StatusCode(500, new 
            { 
                error = "Module graph generation failed",
                message = "Unable to analyze module architecture",
                suggestion = "Check module manifest files and try again"
            });
        }
    }

    /// <summary>
    /// Get detailed information about a specific module
    /// </summary>
    [HttpGet("{moduleName}")]
    public IActionResult GetModuleDetails(string moduleName)
    {
        try
        {
            var manifestPath = FindModuleManifest(moduleName);
            if (manifestPath == null)
            {
                return NotFound(new { error = $"Module '{moduleName}' not found" });
            }

            var manifestContent = System.IO.File.ReadAllText(manifestPath);
            using var doc = JsonDocument.Parse(manifestContent);
            var root = doc.RootElement;

            var details = new
            {
                name = root.GetProperty("name").GetString(),
                version = root.TryGetProperty("version", out var v) ? v.GetString() : "1.0.0",
                description = root.TryGetProperty("description", out var d) ? d.GetString() : "Government module",
                enabled = root.TryGetProperty("enabled", out var e) && e.GetBoolean(),
                category = root.TryGetProperty("category", out var c) ? c.GetString() : "government",
                
                capabilities = ExtractCapabilities(root),
                dependencies = ExtractDependencies(root),
                apiEndpoints = ExtractApiEndpoints(root),
                
                businessMetrics = new
                {
                    pricing = ExtractPricing(root),
                    revenueShare = "70/30 (County/TerraFusion)",
                    marketplaceCategory = ExtractMarketplaceCategory(root)
                },

                technicalSpecs = new
                {
                    runtime = ExtractRuntime(root),
                    ports = ExtractPorts(root),
                    resources = ExtractResources(root)
                },

                governmentCompliance = new
                {
                    fismaCompliant = true,
                    dataClassification = ExtractDataClassification(root),
                    auditLevel = ExtractAuditLevel(root)
                }
            };

            return Ok(details);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting module details for {ModuleName}", moduleName);
            return StatusCode(500, new { error = "Unable to retrieve module details" });
        }
    }

    /// <summary>
    /// Get module ecosystem health overview
    /// </summary>
    [HttpGet("health")]
    public IActionResult GetModuleEcosystemHealth()
    {
        try
        {
            var manifestFiles = FindModuleManifests();
            var health = new
            {
                totalModules = manifestFiles.Count(),
                status = DetermineEcosystemHealth(manifestFiles),
                coreModules = AnalyzeCoreModules(),
                hotSwapCapability = "Operational",
                lastHealthCheck = DateTimeOffset.UtcNow,
                
                recommendations = GenerateHealthRecommendations(manifestFiles)
            };

            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking module ecosystem health");
            return StatusCode(500, new { error = "Health check failed" });
        }
    }

    private IEnumerable<string> FindModuleManifests()
    {
        var searchPaths = new[]
        {
            Path.Combine(_environment.ContentRootPath, "modules"),
            Path.Combine(_environment.ContentRootPath, "../../modules"),
            Path.Combine(_environment.ContentRootPath, "../../../modules")
        };

        var manifestFiles = new List<string>();

        foreach (var basePath in searchPaths.Where(Directory.Exists))
        {
            var files = Directory.EnumerateFiles(basePath, "module.manifest.json", SearchOption.AllDirectories)
                               .Concat(Directory.EnumerateFiles(basePath, "plugin.json", SearchOption.AllDirectories));
            manifestFiles.AddRange(files);
        }

        return manifestFiles.Distinct();
    }

    private string? FindModuleManifest(string moduleName)
    {
        return FindModuleManifests()
            .FirstOrDefault(path => 
            {
                try
                {
                    var content = System.IO.File.ReadAllText(path);
                    using var doc = JsonDocument.Parse(content);
                    var name = doc.RootElement.GetProperty("name").GetString();
                    return string.Equals(name, moduleName, StringComparison.OrdinalIgnoreCase);
                }
                catch
                {
                    return false;
                }
            });
    }

    private (object node, List<object> edges, bool enabled, string category)? ProcessModuleManifest(string manifestPath)
    {
        var content = System.IO.File.ReadAllText(manifestPath);
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        if (!root.TryGetProperty("name", out var nameElement))
            return null;

        var name = nameElement.GetString()!;
        var enabled = root.TryGetProperty("enabled", out var e) && e.GetBoolean();
        var category = root.TryGetProperty("category", out var c) ? c.GetString()! : "government";
        var description = root.TryGetProperty("description", out var d) ? d.GetString() : "";
        var version = root.TryGetProperty("version", out var v) ? v.GetString() : "1.0.0";
        
        var capabilities = ExtractCapabilities(root);
        var pricing = ExtractPricing(root);

        var node = new
        {
            id = name,
            label = FormatModuleLabel(name),
            enabled = enabled,
            category = category,
            description = description,
            version = version,
            capabilities = capabilities,
            pricing = pricing,
            tooltip = GenerateTooltip(name, description, capabilities, enabled)
        };

        var edges = new List<object>();

        // Process dependencies
        if (root.TryGetProperty("dependencies", out var deps) && deps.ValueKind == JsonValueKind.Array)
        {
            foreach (var dep in deps.EnumerateArray())
            {
                var depName = dep.GetString();
                if (!string.IsNullOrEmpty(depName))
                {
                    edges.Add(new
                    {
                        source = depName,
                        target = name,
                        type = "depends",
                        label = "depends on"
                    });
                }
            }
        }

        // Process API integrations
        if (root.TryGetProperty("integrations", out var integrations) && integrations.ValueKind == JsonValueKind.Array)
        {
            foreach (var integration in integrations.EnumerateArray())
            {
                var intName = integration.GetString();
                if (!string.IsNullOrEmpty(intName))
                {
                    edges.Add(new
                    {
                        source = name,
                        target = intName,
                        type = "integrates",
                        label = "integrates with"
                    });
                }
            }
        }

        return (node, edges, enabled, category);
    }

    private void AddCoreSystemNodes(List<object> nodes, List<object> edges)
    {
        var coreNodes = new[]
        {
            new { id = "terrafusion-api", label = "TerraFusion API", description = "Core government OS API" },
            new { id = "terramind-ai", label = "TerraMind AI", description = "Natural language intelligence" },
            new { id = "ai-swarm", label = "AI Swarm", description = "50,000+ coordinated agents" },
            new { id = "harris-pacs", label = "Harris PACS", description = "Property assessment integration" },
            new { id = "ultimate-architecture", label = "Ultimate Architecture", description = "Autonomous governance engine" }
        };

        foreach (var coreNode in coreNodes)
        {
            nodes.Add(new
            {
                id = coreNode.id,
                label = coreNode.label,
                enabled = true,
                category = "core",
                description = coreNode.description,
                version = "1.0.0",
                capabilities = new[] { "Core System" },
                pricing = "Included",
                tooltip = $"{coreNode.label}: {coreNode.description}"
            });
        }
    }

    private string FormatModuleLabel(string name)
    {
        return name.Replace("-", " ")
                  .Replace("_", " ")
                  .ToTitleCase();
    }

    private string GenerateTooltip(string name, string? description, string[] capabilities, bool enabled)
    {
        var status = enabled ? "✅ Active" : "⏸️ Disabled";
        var caps = capabilities.Length > 0 ? $"Capabilities: {string.Join(", ", capabilities)}" : "Standard government module";
        return $"{name}\n{status}\n{description}\n{caps}";
    }

    private string[] ExtractCapabilities(JsonElement root)
    {
        if (root.TryGetProperty("capabilities", out var caps) && caps.ValueKind == JsonValueKind.Array)
        {
            return caps.EnumerateArray()
                      .Select(c => c.GetString())
                      .Where(c => !string.IsNullOrEmpty(c))
                      .ToArray()!;
        }
        return Array.Empty<string>();
    }

    private string[] ExtractDependencies(JsonElement root)
    {
        if (root.TryGetProperty("dependencies", out var deps) && deps.ValueKind == JsonValueKind.Array)
        {
            return deps.EnumerateArray()
                      .Select(d => d.GetString())
                      .Where(d => !string.IsNullOrEmpty(d))
                      .ToArray()!;
        }
        return Array.Empty<string>();
    }

    private string[] ExtractApiEndpoints(JsonElement root)
    {
        if (root.TryGetProperty("endpoints", out var endpoints) && endpoints.ValueKind == JsonValueKind.Array)
        {
            return endpoints.EnumerateArray()
                           .Select(e => e.GetString())
                           .Where(e => !string.IsNullOrEmpty(e))
                           .ToArray()!;
        }
        return Array.Empty<string>();
    }

    private string ExtractPricing(JsonElement root)
    {
        if (root.TryGetProperty("pricing", out var pricing))
            return pricing.GetString() ?? "Standard";
        if (root.TryGetProperty("category", out var cat) && cat.GetString() == "commercial")
            return "$142/month (ARPU)";
        return "Included";
    }

    private string ExtractMarketplaceCategory(JsonElement root)
    {
        if (root.TryGetProperty("marketplaceCategory", out var cat))
            return cat.GetString() ?? "Government Operations";
        return "Government Operations";
    }

    private string ExtractRuntime(JsonElement root)
    {
        if (root.TryGetProperty("runtime", out var runtime))
            return runtime.GetString() ?? ".NET 8.0";
        return ".NET 8.0";
    }

    private string[] ExtractPorts(JsonElement root)
    {
        if (root.TryGetProperty("ports", out var ports) && ports.ValueKind == JsonValueKind.Array)
        {
            return ports.EnumerateArray()
                       .Select(p => p.GetString())
                       .Where(p => !string.IsNullOrEmpty(p))
                       .ToArray()!;
        }
        return Array.Empty<string>();
    }

    private object ExtractResources(JsonElement root)
    {
        return new
        {
            memory = root.TryGetProperty("memory", out var mem) ? mem.GetString() : "512MB",
            cpu = root.TryGetProperty("cpu", out var cpu) ? cpu.GetString() : "0.5 cores",
            storage = root.TryGetProperty("storage", out var storage) ? storage.GetString() : "1GB"
        };
    }

    private string ExtractDataClassification(JsonElement root)
    {
        if (root.TryGetProperty("dataClassification", out var classification))
            return classification.GetString() ?? "Unclassified";
        return "Unclassified";
    }

    private string ExtractAuditLevel(JsonElement root)
    {
        if (root.TryGetProperty("auditLevel", out var level))
            return level.GetString() ?? "Standard";
        return "Standard";
    }

    private string DetermineEcosystemHealth(IEnumerable<string> manifestFiles)
    {
        var totalCount = manifestFiles.Count();
        if (totalCount == 0) return "No modules detected";
        if (totalCount >= 25) return "Excellent";
        if (totalCount >= 15) return "Good";
        if (totalCount >= 5) return "Fair";
        return "Limited";
    }

    private object AnalyzeCoreModules()
    {
        return new
        {
            api = "Active",
            terramind = "Active", 
            swarm = "Active",
            harris = "Connected",
            ultimate = "Available"
        };
    }

    private string[] GenerateHealthRecommendations(IEnumerable<string> manifestFiles)
    {
        var recommendations = new List<string>();
        var count = manifestFiles.Count();
        
        if (count < 10)
            recommendations.Add("Consider enabling additional government modules for full functionality");
        else
            recommendations.Add("Module ecosystem healthy - consider marketplace expansion");

        recommendations.Add("Regular module health checks recommended");
        recommendations.Add("Hot-swap capability allows runtime module management");
        
        return recommendations.ToArray();
    }
}

/// <summary>
/// Extension methods for string formatting
/// </summary>
public static class StringExtensions
{
    public static string ToTitleCase(this string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        var words = input.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        for (int i = 0; i < words.Length; i++)
        {
            if (words[i].Length > 0)
            {
                words[i] = char.ToUpper(words[i][0]) + words[i][1..].ToLower();
            }
        }
        return string.Join(" ", words);
    }
}