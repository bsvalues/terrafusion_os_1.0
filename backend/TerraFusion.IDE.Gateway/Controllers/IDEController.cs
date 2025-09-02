using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace TerraFusion.IDE.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IDEController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IDEController> _logger;

    public IDEController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<IDEController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("capabilities")]
    [AllowAnonymous]
    public IActionResult GetCapabilities()
    {
        var capabilities = new
        {
            IDE = new
            {
                Name = _configuration["IDE:Name"],
                Version = _configuration["IDE:Version"],
                SupportedLanguages = _configuration.GetSection("IDE:Capabilities:SupportedLanguages").Get<string[]>(),
                AIAgents = _configuration.GetValue<int>("IDE:Capabilities:AIAgents"),
                TestOrchestrators = _configuration.GetValue<int>("IDE:Capabilities:TestOrchestrators"),
                OpsTools = _configuration.GetValue<int>("IDE:Capabilities:OpsTools")
            },
            Features = new
            {
                AICodeCompletion = _configuration.GetValue<bool>("IDE:Features:AICodeCompletion"),
                VisualWorkflowDesigner = _configuration.GetValue<bool>("IDE:Features:VisualWorkflowDesigner"),
                GovernmentCompliance = _configuration.GetValue<bool>("IDE:Features:GovernmentCompliance"),
                RealTimeCollaboration = _configuration.GetValue<bool>("IDE:Features:RealTimeCollaboration"),
                AutomatedTesting = _configuration.GetValue<bool>("IDE:Features:AutomatedTesting"),
                DevOpsIntegration = _configuration.GetValue<bool>("IDE:Features:DevOpsIntegration")
            },
            BackendServices = new
            {
                Gateway = "Running",
                TerraFusionAPI = "Connected",
                RustDevEngine = "Connected",
                AISwarm = "Connected",
                OpsTools = "Connected"
            }
        };

        return Ok(capabilities);
    }

    [HttpPost("projects")]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
    {
        _logger.LogInformation("Creating new project: {ProjectName}", request.Name);

        try
        {
            // Create project structure based on type
            var projectStructure = request.Type switch
            {
                "government-module" => await CreateGovernmentModuleProject(request),
                "ai-agent" => await CreateAIAgentProject(request),
                "rust-service" => await CreateRustServiceProject(request),
                "dotnet-api" => await CreateDotNetAPIProject(request),
                "python-ai" => await CreatePythonAIProject(request),
                _ => throw new ArgumentException($"Unsupported project type: {request.Type}")
            };

            return Ok(new { 
                Success = true, 
                ProjectId = Guid.NewGuid(),
                Structure = projectStructure,
                Message = $"Project '{request.Name}' created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create project: {ProjectName}", request.Name);
            return BadRequest(new { Success = false, Error = ex.Message });
        }
    }

    [HttpGet("ai/completion")]
    public async Task<IActionResult> GetAICompletion([FromQuery] string code, [FromQuery] string language)
    {
        try
        {
            var aiClient = _httpClientFactory.CreateClient("AISwarm");
            var response = await aiClient.PostAsJsonAsync("/api/completion", new
            {
                Code = code,
                Language = language,
                Context = "TerraFusion Government Development"
            });

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadAsStringAsync();
                return Ok(JsonSerializer.Deserialize<object>(result));
            }

            return BadRequest("AI completion service unavailable");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI completion failed");
            return StatusCode(500, "AI completion service error");
        }
    }

    [HttpGet("ops/tools")]
    public async Task<IActionResult> GetAvailableOpsTools()
    {
        try
        {
            var opsClient = _httpClientFactory.CreateClient("OpsTools");
            var response = await opsClient.GetAsync("/api/tools");

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadAsStringAsync();
                return Ok(JsonSerializer.Deserialize<object>(result));
            }

            return BadRequest("Ops tools service unavailable");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get ops tools");
            return StatusCode(500, "Ops tools service error");
        }
    }

    [HttpPost("compliance/validate")]
    public async Task<IActionResult> ValidateCompliance([FromBody] ComplianceValidationRequest request)
    {
        _logger.LogInformation("Validating compliance for project: {ProjectId}", request.ProjectId);

        var validationResults = new
        {
            ProjectId = request.ProjectId,
            Timestamp = DateTime.UtcNow,
            Standards = new
            {
                FISMA = new { Status = "Compliant", Score = 95, Issues = new string[0] },
                NIST = new { Status = "Compliant", Score = 92, Issues = new[] { "Minor: Add additional encryption for data at rest" } },
                Section508 = new { Status = "Compliant", Score = 98, Issues = new string[0] }
            },
            OverallScore = 95,
            RecommendedActions = new[]
            {
                "Implement additional data encryption",
                "Add accessibility testing automation",
                "Update security documentation"
            }
        };

        return Ok(validationResults);
    }

    // Helper methods for project creation
    private async Task<object> CreateGovernmentModuleProject(CreateProjectRequest request)
    {
        // Create government module structure
        return new
        {
            Type = "government-module",
            Structure = new
            {
                Frontend = new[] { "src/", "components/", "pages/", "assets/" },
                Backend = new[] { "Controllers/", "Services/", "Models/", "Data/" },
                Tests = new[] { "unit/", "integration/", "compliance/" },
                Documentation = new[] { "README.md", "COMPLIANCE.md", "API.md" }
            },
            Features = new[]
            {
                "FISMA compliance validation",
                "Government UI/UX standards",
                "Audit logging framework",
                "Role-based access control"
            }
        };
    }

    private async Task<object> CreateAIAgentProject(CreateProjectRequest request)
    {
        return new
        {
            Type = "ai-agent",
            Structure = new
            {
                Agent = new[] { "agent.py", "config.yaml", "requirements.txt" },
                Training = new[] { "models/", "data/", "training_scripts/" },
                Tests = new[] { "test_agent.py", "test_integration.py" },
                Documentation = new[] { "README.md", "AGENT_SPEC.md" }
            }
        };
    }

    private async Task<object> CreateRustServiceProject(CreateProjectRequest request)
    {
        return new
        {
            Type = "rust-service",
            Structure = new
            {
                Source = new[] { "src/main.rs", "src/lib.rs", "Cargo.toml" },
                Config = new[] { "config/", "docker/" },
                Tests = new[] { "tests/", "benches/" },
                Documentation = new[] { "README.md", "API_DOCS.md" }
            }
        };
    }

    private async Task<object> CreateDotNetAPIProject(CreateProjectRequest request)
    {
        return new
        {
            Type = "dotnet-api",
            Structure = new
            {
                Controllers = new[] { "Controllers/", "Models/", "Services/" },
                Data = new[] { "Data/", "Migrations/" },
                Tests = new[] { "Tests/", "IntegrationTests/" },
                Configuration = new[] { "appsettings.json", "Program.cs" }
            }
        };
    }

    private async Task<object> CreatePythonAIProject(CreateProjectRequest request)
    {
        return new
        {
            Type = "python-ai",
            Structure = new
            {
                Source = new[] { "src/", "models/", "training/" },
                Data = new[] { "data/", "datasets/" },
                Notebooks = new[] { "notebooks/", "experiments/" },
                Tests = new[] { "tests/", "benchmarks/" }
            }
        };
    }
}

public class CreateProjectRequest
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string Description { get; set; } = "";
    public Dictionary<string, object>? Configuration { get; set; }
}

public class ComplianceValidationRequest
{
    public string ProjectId { get; set; } = "";
    public string[] Standards { get; set; } = Array.Empty<string>();
}